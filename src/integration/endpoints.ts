import { Endpoint } from 'app-common-js';

export enum ServiceNames {
  'ros-backend' = 'ros-backend',
}

export type ServicesEndpoints = {
  [key in ServiceNames]: Endpoint;
};
