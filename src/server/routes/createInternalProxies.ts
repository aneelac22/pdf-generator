import { createProxyMiddleware } from 'http-proxy-middleware';
import instanceConfig from '../../common/config';
import { ServiceNames } from '../../integration/endpoints';
import { Endpoint } from 'app-common-js';
// import { apiLogger } from '../../common/logging';

console.log('Available endpoints: ', instanceConfig.endpoints);

function createInternalProxies() {
  const meta = Object.entries(instanceConfig.endpoints).reduce<
    Partial<{
      [key in ServiceNames]: Endpoint;
    }>
  >((acc, [serviceName, endpoint]) => {
    const index: ServiceNames = ServiceNames[serviceName as ServiceNames];
    if (ServiceNames[index]) {
      acc[ServiceNames[index]] = endpoint;
    }
    return acc;
  }, {});

  const internalProxies = Object.entries(meta).map(
    ([serviceName, endpoint]) => {
      return createProxyMiddleware({
        logger: console,
        target: `http://${endpoint.hostname}:${endpoint.port}`,
        changeOrigin: true,
        pathFilter: (path) => path.startsWith(`/internal/${serviceName}`),
        pathRewrite: {
          [`^/internal/${serviceName}`]: '',
        },
        on: {
          proxyReq: (proxyReq, req) => {
            console.log('Proxying request to:', req.url);
            console.log(proxyReq.getHeaders());
          },
        },
      });
    }
  );

  return internalProxies;
}

export default createInternalProxies;
