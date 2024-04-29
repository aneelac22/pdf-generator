import ServiceNames from './service-names';
import 'dotenv/config';
import {
  Endpoint,
  ObjectBucket,
  IsClowderEnabled,
  KafkaBroker,
  KafkaTopic,
  Config,
} from 'app-common-js';
import { UPDATE_TOPIC } from '../browser/constants';
import * as fs from 'fs';

export type ServicesEndpoints = Omit<
  {
    [key in ServiceNames]: Endpoint;
  } & {
    'advisor-backend': Endpoint;
    'ros-backend': Endpoint;
    'vulnerability-engine-manager-service': Endpoint;
  },
  'advisor' | 'ros' | 'vulnerability'
>;

const defaultConfig: {
  webPort: number;
  metricsPort: number;
  metricsPath: string;
  tlsCAPath: string;
  endpoints: Partial<ServicesEndpoints>;
  objectStore: {
    hostname: string;
    port: number;
    accessKey: string;
    secretKey: string;
    tls: boolean;
    buckets: ObjectBucket[];
  };
  kafka: {
    brokers: KafkaBroker[];
    topics: KafkaTopic[];
  };
  kafkaCaLocation: string;
  APIPrefix: string;
  IS_PRODUCTION: boolean;
  IS_DEVELOPMENT: boolean;
  OPTIONS_HEADER_NAME: string;
  IDENTITY_CONTEXT_KEY: string;
  IDENTITY_HEADER_KEY: string;
  ACCOUNT_ID: string;
  LOG_LEVEL: string;
  scalprum: {
    // for proxy request to /api
    apiHost: string;
    // for proxy request to /apps
    assetsHost: string;
  };
} = {
  webPort: 8000,
  metricsPort: 9000,
  metricsPath: '/metrics',
  endpoints: {},
  tlsCAPath: '',
  objectStore: {
    hostname: 'localhost',
    port: 9100,
    accessKey: process.env.MINIO_ACCESS_KEY as string,
    secretKey: process.env.MINIO_SECRET_KEY as string,
    tls: false,
    buckets: [
      {
        accessKey: process.env.MINIO_ACCESS_KEY as string,
        secretKey: process.env.MINIO_SECRET_KEY as string,
        requestedName: 'crc-generated-pdfs',
        name: 'crc-generated-pdfs',
        region: 'us-east-1',
        tls: false,
        endpoint: 'localhost',
      },
    ],
  },
  kafkaCaLocation: '/tmp/kafkaca',
  kafka: {
    brokers: [
      {
        hostname: 'localhost',
        port: 9092,
        authtype: '',
        cacert: '',
        securityProtocol: '',
        sasl: {
          username: 'me',
          password: 'me',
          saslMechanism: '',
          securityProtocol: '',
        },
      },
    ],
    topics: [
      {
        requestedName: `${UPDATE_TOPIC}`,
        name: `${UPDATE_TOPIC}`,
        consumerGroupName: '',
      },
    ],
  },
  APIPrefix: '/api/crc-pdf-generator',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  OPTIONS_HEADER_NAME: 'x-pdf-gen-options',
  IDENTITY_CONTEXT_KEY: 'identity',
  IDENTITY_HEADER_KEY: 'x-rh-identity',
  ACCOUNT_ID: '',
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  scalprum: {
    apiHost: process.env.API_HOST || 'https://console.stage.redhat.com/',
    assetsHost: process.env.ASSETS_HOST || 'https://console.stage.redhat.com/',
  },
};

/**
 * 
 * endpoints: [
    {
      app: 'crc-pdf-generator',
      hostname: 'crc-pdf-generator-api.ephemeral-twdkua.svc',
      name: 'api',
      port: 8000
    },
    {
      app: 'compliance',
      hostname: 'compliance-service.ephemeral-twdkua.svc',
      name: 'service',
      port: 8000
    }
  ],
 */

function initializeConfig() {
  let isClowderEnabled = false;
  const endpoints: Partial<ServicesEndpoints> = {};
  try {
    let config: typeof defaultConfig = {
      ...defaultConfig,
    };
    const clowder: Config = new Config();
    isClowderEnabled = IsClowderEnabled();
    if (isClowderEnabled) {
      const clowderConfig = clowder.LoadedConfig();
      if (clowderConfig.endpoints) {
        clowderConfig.endpoints.forEach((endpoint) => {
          // special case for vulnerability
          if (endpoint.name === 'manager-service') {
            endpoints['vulnerability-engine-manager-service'] = endpoint;
          } else {
            endpoints[endpoint.app as keyof ServicesEndpoints] = endpoint;
          }
        });
      }
      if (clowderConfig.kafka.brokers[0].cacert != undefined) {
        try {
          fs.writeFileSync(
            '/tmp/kafkaca',
            clowderConfig.kafka.brokers[0].cacert
          );
        } catch (error) {
          console.log(error);
        }
      }
      config = {
        ...defaultConfig,
        ...clowderConfig,
        endpoints,
      };
    }
    return config;
  } catch (error) {
    return defaultConfig;
  }
}
const instanceConfig = initializeConfig();

export default instanceConfig;
