/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppsConfig, getModule } from '@scalprum/core';
import ScalprumProvider, {
  ScalprumComponent,
  ScalprumComponentProps,
} from '@scalprum/react-core';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const config: AppsConfig = {
  landing: {
    name: 'landing',
    manifestLocation: '/apps/landing/fed-mods.json',
  },
};

type Service = {
  host: string;
};

type FetchConfig = {
  service: object;
  pathname: string;
};

type ResponseProcessor = (response: unknown) => any;

type FetchDataReturn = {
  request: FetchConfig | FetchConfig[];
  responseProcessor: ResponseProcessor;
};

type FetchData = (services: { [key: string]: Service }) => FetchDataReturn;

async function getTemplateData(
  configs: FetchConfig[],
  responseProcessor: ResponseProcessor
) {
  console.log({ configs });
  const tasks = configs.map(async (config) => {
    return axios.get(config.pathname).then(({ data }) => data);
  });
  const results = await Promise.all(tasks);
  return responseProcessor(results);
}

// clowder should populate this
const servicesMock: { [key: string]: Service } = {
  foo: {
    host: 'bar',
  },
  'chrome-service': {
    host: 'chrome-service',
  },
};

type AsyncState = {
  loading: boolean;
  error: unknown;
  data: any;
};

const MetadataWrapper = () => {
  const [asyncState, setAsyncState] = useState<AsyncState>({
    loading: true,
    error: null,
    data: null,
  });
  async function getFetchMetadata() {
    try {
      const fn = await getModule<FetchData | undefined>(
        'landing',
        './EdgeWidget',
        'fetchData'
      );
      if (!fn) {
        setAsyncState({ loading: false, error: null, data: null });
        return;
      }
      const { request, responseProcessor } = fn(servicesMock);
      const configs: FetchConfig[] = Array.isArray(request)
        ? request
        : [request];
      const data = await getTemplateData(configs, responseProcessor);

      setAsyncState({ loading: false, error: null, data });
    } catch (error) {
      setAsyncState({ loading: false, error, data: null });
    }
  }
  useEffect(() => {
    getFetchMetadata();
  }, []);
  const props: ScalprumComponentProps<
    Record<string, any>,
    { asyncData: AsyncState }
  > = {
    asyncData: asyncState,
    scope: 'landing',
    module: './EdgeWidget',
  };
  return <ScalprumComponent {...props} />;
};

const App = () => {
  return (
    <ScalprumProvider pluginSDKOptions={{}} config={config}>
      <div>
        <h1>Hello World</h1>
      </div>
      <MetadataWrapper />
    </ScalprumProvider>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const root = createRoot(rootElement);
root.render(<App />);
