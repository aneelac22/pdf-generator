import express from 'express';
import path from 'path';
import cors from 'cors';
import promBundle from 'express-prom-bundle';
import httpContext from 'express-http-context';
import http from 'http';
import config from '../common/config';
import router from './routes/routes';
import identityMiddleware from '../middleware/identity-middleware';
import { requestLogger, apiLogger } from '../common/logging';
import PdfCache from '../common/pdfCache';
import { consumeMessages } from '../common/kafka';
import { UPDATE_TOPIC } from '../browser/constants';

const PORT = config?.webPort;

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.resolve(__dirname, '..', 'build')));
app.use(express.static(path.resolve(__dirname, '../public')));
app.use(httpContext.middleware);
app.use(identityMiddleware);
app.use(requestLogger);
router.use('/public', express.static(path.resolve(__dirname, './public')));
app.use('/', router);

PdfCache.getInstance();

const server = http.createServer({}, app).listen(PORT, () => {
  apiLogger.info(`Listening on port ${PORT}`);
  consumeMessages(UPDATE_TOPIC).catch((error: unknown) => {
    apiLogger.error(`${error}`);
  });
});

// setup keep alive timeout
server.keepAliveTimeout = 60 * 1000 + 1000; // 61 s
server.keepAliveTimeout = 60 * 1000 + 2000; // 62 s

const metricsApp = express();

const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  metricsPath: config?.metricsPath,
  promClient: {
    collectDefaultMetrics: {},
  },
});

metricsApp.use(metricsMiddleware);
metricsApp.listen(config?.metricsPort, () => {
  apiLogger.info(`Metrics server listening on port ${config?.metricsPort}`);
});
