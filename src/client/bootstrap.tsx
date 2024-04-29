/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppsConfig, getModule } from '@scalprum/core';
import ScalprumProvider, {
  ScalprumComponent,
  ScalprumComponentProps,
} from '@scalprum/react-core';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GeneratePayload } from '../common/types';

declare global {
  interface Window {
    __initialState__: GeneratePayload;
  }
}

const state = window.__initialState__;
const config: AppsConfig = {
  [state.scope]: {
    name: state.scope,
    manifestLocation: state.manifestLocation,
  },
};

type CreateAxiosRequest = (config: AxiosRequestConfig) => Promise<unknown>;

function createAxiosRequest(config: AxiosRequestConfig) {
  return axios(config).then((response: AxiosResponse) => response.data);
}

type FetchData = (createAsyncRequest: CreateAxiosRequest) => Promise<unknown>;

type AsyncState = {
  loading: boolean;
  error: unknown;
  data: unknown;
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
        state.scope,
        state.module,
        'fetchData'
      );
      if (!fn) {
        setAsyncState({ loading: false, error: null, data: null });
        return;
      }
      const data = await fn(createAxiosRequest);

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
    scope: state.scope,
    module: state.module,
    importName: state.importName,
  };
  return <ScalprumComponent {...props} />;
};

const App = () => {
  return (
    <ScalprumProvider pluginSDKOptions={{}} config={config}>
      <div>
        <h1>Hello World</h1>
      </div>
      <div>
        <pre>{JSON.stringify(window.__initialState__, null, 2)}</pre>
      </div>
      <MetadataWrapper />
    </ScalprumProvider>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const root = createRoot(rootElement);
root.render(<App />);
