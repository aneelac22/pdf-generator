import axios, { AxiosRequestHeaders, AxiosRequestConfig } from 'axios';
import ServiceNames from './service-names';

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
// TODO: Base it on https://gitlab.cee.redhat.com/service/app-interface/-/blob/master/data/products/insights/environments/production.yml and load trough clowder
const AVAIABLE_SERVICES = {
  [ServiceNames.compliance]: {
    host: 'compliance-service.compliance-prod.svc.cluster.local',
    port: 8000,
  },
  [ServiceNames.vulnerability]: {
    host: 'foo.bar',
    port: 8000,
  },
  [ServiceNames.demo]: {
    host: 'foo.bar',
    port: 8000,
  },
};

export type APIDescriptor<T = Record<string, unknown>, R = unknown> = {
  service: ServiceNames;
  path: string;
  responseProcessor: (...args: any[]) => R;
  mock: (...args: any[]) => Promise<T>;
};

export type ServiceCallFunction = (
  headers: AxiosRequestHeaders,
  options: Omit<AxiosRequestConfig, 'headers'>
) => Promise<unknown>;

function prepareServiceCall<T = Record<string, unknown>>(
  descriptor: APIDescriptor<T>
): ServiceCallFunction {
  const { service, path, responseProcessor } = descriptor;
  const serviceConfig = AVAIABLE_SERVICES[service];
  if (!serviceConfig) {
    throw new Error(`Trying to reach unusupported service ${service}!`);
  }
  const URL = `${serviceConfig.host}:${serviceConfig.port}${path}`;
  return async (headers, options) => {
    let data;
    if (IS_DEVELOPMENT) {
      data = descriptor.mock();
    } else {
      data = await axios.get(URL, { ...options, headers });
    }
    return responseProcessor(data);
  };
}

export default prepareServiceCall;
