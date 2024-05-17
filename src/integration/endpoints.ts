import { Endpoint } from 'app-common-js';

export enum ServiceNames {
  'ros-backend' = 'ros-backend',
  'chrome-service' = 'chrome-service',
}

export type ServicesEndpoints = {
  [key in ServiceNames]: Endpoint;
};
