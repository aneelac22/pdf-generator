import fs from 'fs';
import crypto from 'crypto';
import { sanitizeFilepath } from '../../browser/helpers';
import PdfCache from '../../common/pdfCache';
import {
  SendingFailedError,
  PDFNotFoundError,
  PdfGenerationError,
} from '../errors';
import { Router, Request } from 'express';
import httpContext from 'express-http-context';
import renderTemplate from '../render-template';
import config from '../../common/config';
import previewPdf from '../../browser/previewPDF';
import pool from '../workers';
import {
  GenerateHandlerRequest,
  PdfRequestBody,
  PuppeteerBrowserRequest,
  PreviewHandlerRequest,
  GeneratePayload,
} from '../../common/types';
import { apiLogger } from '../../common/logging';
import { ReportCache } from '../cache';
import { downloadPDF } from '../../common/objectStore';
import { Readable } from 'stream';
import { UpdateStatus } from '../utils';
import { cluster } from '../cluster';
import { generatePdf } from '../../browser/clusterTask';
import { API_CALL_LIMIT } from '../../browser/constants';

const CALL_LIMIT = Number(process.env.API_CALL_LIMIT) || API_CALL_LIMIT;

const router = Router();
const cache = new ReportCache();
const pdfCache = PdfCache.getInstance();

function getPdfRequestBody(payload: GeneratePayload): PdfRequestBody {
  const { manifestLocation, module, scope, fetchDataParams, importName } =
    payload;
  const uuid = crypto.randomUUID();
  const requestURL = new URL(`http://localhost:${config?.webPort}/puppeteer`);
  requestURL.searchParams.append('manifestLocation', manifestLocation);
  requestURL.searchParams.append('scope', scope);
  requestURL.searchParams.append('module', module);
  if (importName) {
    requestURL.searchParams.append('importName', importName);
  }
  if (fetchDataParams) {
    requestURL.searchParams.append(
      'fetchDataParams',
      JSON.stringify(fetchDataParams)
    );
  }
  return {
    ...payload,
    uuid,
    url: requestURL.toString(),
  };
}

// Middleware that activates on all routes, responsible for rendering the correct
// template/component into html to the requester.
router.get('/puppeteer', (req: PuppeteerBrowserRequest, res, _next) => {
  const payload = req.query;
  if (!payload) {
    apiLogger.warning('Missing template, using "demo"');
    throw new Error('Missing template metadata!');
  }
  try {
    const configHeaders: string | string[] | undefined =
      req.headers[config?.OPTIONS_HEADER_NAME];
    if (configHeaders) {
      delete req.headers[config?.OPTIONS_HEADER_NAME];
    }

    const HTMLTemplate: string = renderTemplate(payload);
    res.send(HTMLTemplate);
  } catch (error) {
    // render error to DOM to retrieve the error content from puppeteer
    res.send(
      `<div id="report-error" data-error="${JSON.stringify(
        error
      )}">${error}</div>`
    );
  }
});

router.get(`${config?.APIPrefix}/v1/hello`, (_req, res) => {
  return res.status(200).send('<h1>Well this works!</h1>');
});

router.post(
  `${config?.APIPrefix}/v2/create`,
  async (req: GenerateHandlerRequest, res, next) => {
    const requestConfig = Array.isArray(req.body.payload)
      ? req.body.payload[0]
      : req.body.payload;
    // need to support multiple IDs in a group
    // and await the results to combine
    const pdfDetails = getPdfRequestBody(requestConfig);
    const collectionId = pdfDetails.uuid;
    const configHeaders: string | string[] | undefined =
      req.headers[config?.OPTIONS_HEADER_NAME];
    if (configHeaders) {
      delete req.headers[config?.OPTIONS_HEADER_NAME];
    }

    try {
      // TODO: Based on payload length
      const requiredCalls = 1;
      if (requiredCalls === 1) {
        const id = crypto.randomUUID();
        apiLogger.debug(`Single call to generator queued for ${collectionId}`);
        await generatePdf(pdfDetails, {}, id);
        const updateMessage = {
          status: 'Generating',
          filepath: '',
          componentId: id,
          collectionId: collectionId,
        };
        UpdateStatus(updateMessage);
        return res.status(202).send({ statusID: collectionId });
      }
      // add these in a loop
      apiLogger.debug(`Queueing ${requiredCalls} for ${collectionId}`);
      for (let x = 0; x < Number(requiredCalls); x++) {
        const segmentStart = x * CALL_LIMIT;
        const segmentEnd = segmentStart + CALL_LIMIT - 1;
        const dataRange = { start: segmentStart, end: segmentEnd };

        const id = crypto.randomUUID();
        await generatePdf(pdfDetails, dataRange, id);
        const updateMessage = {
          status: 'Generating',
          filepath: '',
          componentId: id,
          collectionId: collectionId,
        };
        UpdateStatus(updateMessage);
      }

      return res.status(202).send({ statusID: collectionId });
    } catch (error: unknown) {
      if (error instanceof PdfGenerationError) {
        if (error.message.includes('No API descriptor')) {
          const updateMessage = {
            status: `Failed: ${error.message}`,
            filepath: '',
            collectionId: error.collectionId,
            componentId: error.componentId,
          };
          apiLogger.error(`Error: ${error}`);
          UpdateStatus(updateMessage);
          res.status(400).send({
            error: {
              status: 400,
              statusText: 'Bad Request',
              description: `${error}`,
            },
          });
        } else {
          apiLogger.error(`Internal Server error: ${error}`);
          const updateMessage = {
            status: `Failed: ${error}`,
            filepath: '',
            collectionId: error.collectionId,
            componentId: error.componentId,
          };
          UpdateStatus(updateMessage);
          res.status(500).send({
            error: {
              status: 500,
              statusText: 'Internal server error',
              description: `${error}`,
            },
          });
        }
      }
      next();
    } finally {
      // To handle the edge case where a pool terminates while the queue isn't empty,
      // we ensure that the queue is empty and all workers are idle.
      await cluster.idle();
      apiLogger.debug('task finished');
      await cluster.close();
    }
  }
);

router.get(`${config?.APIPrefix}/v2/status/:statusID`, (req: Request, res) => {
  const ID = req.params.statusID;
  try {
    const status = pdfCache.getCollection(ID);
    apiLogger.debug(JSON.stringify(status));
    if (!status) {
      res.status(404).send({
        error: {
          status: 404,
          statusText: 'PDF status could not be determined; Please check the ID',
          description: `No PDF status found for ${ID}`,
        },
      });
    }

    return res.status(200).send({ status });
  } catch (error) {
    res.status(400).send({
      error: {
        status: 400,
        statusText: 'PDF status could not be determined',
        description: `Error: ${error}`,
      },
    });
  }
});

router.get(
  `${config?.APIPrefix}/v2/download/:ID`,
  async (req: Request, res) => {
    const ID = req.params.ID;
    try {
      apiLogger.debug(ID);
      const response = await downloadPDF(ID);
      if (!response) {
        return res.status(404).send({
          error: {
            status: 404,
            statusText: `No PDF found; Please check the status of this ID`,
            description: `No PDF found for ${ID}`,
          },
        });
      }
      if (response.ContentLength && response.ContentLength > 0) {
        const contentLength = response.ContentLength;
        res.setHeader('Content-Length', contentLength);
      }
      res.setHeader('Content-Disposition', `inline; filename="${ID}.pdf"`);
      res.setHeader('Content-Type', 'application/pdf');
      const stream = response.Body as Readable;
      stream.pipe(res);
    } catch (error) {
      res.status(400).send({
        error: {
          status: 400,
          statusText: 'PDF status could not be determined',
          description: `Error: ${error}`,
        },
      });
    }
  }
);

router.post(
  `${config?.APIPrefix}/v1/generate`,
  async (req: GenerateHandlerRequest, res, next) => {
    // for testing purposes
    const requestConfig = Array.isArray(req.body.payload)
      ? req.body.payload[0]
      : req.body.payload;
    const pdfDetails = getPdfRequestBody(requestConfig);
    const accountID = httpContext.get(config?.ACCOUNT_ID);
    const ID = pdfDetails.uuid;
    const cacheKey = cache.createCacheKey({
      request: pdfDetails,
      accountID: accountID,
    });
    apiLogger.debug(`Hashed key ${cacheKey} with Account ID ${accountID}`);

    // Check for a cached version of the pdf
    const filePath = cache.fetch(sanitizeFilepath(cacheKey));
    if (filePath) {
      apiLogger.info(`No new generation needed ${filePath} found in cache.`);
      return res.status(200).sendFile(sanitizeFilepath(filePath), (err) => {
        if (err) {
          const errorMessage = new SendingFailedError(filePath, err);
          res.status(500).send({
            error: {
              status: 500,
              statusText: 'PDF was generated, but could not be sent',
              description: errorMessage.message,
            },
          });
        }
      });
    }

    apiLogger.debug(JSON.stringify(pool.stats(), null, 2));

    try {
      const pathToPdf = await pool.exec<(...args: unknown[]) => string>(
        'generatePdf',
        [pdfDetails]
      );

      const pdfFileName = pathToPdf.split('/').pop();

      if (!fs.existsSync(pathToPdf)) {
        throw new PDFNotFoundError(pdfFileName as string);
      }
      cache.fill(cacheKey, pathToPdf);
      res.setHeader('Content-Disposition', `inline; filename="${ID}.pdf"`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Deprecated', 'True');
      const sanitizedPath = sanitizeFilepath(pathToPdf);
      return res.status(200).sendFile(sanitizedPath, (err) => {
        if (err) {
          const errorMessage = new SendingFailedError(
            pdfFileName as string,
            err
          );
          res.status(500).send({
            error: {
              status: 500,
              statusText: 'PDF was generated, but could not be sent',
              description: errorMessage.message,
            },
          });
        }
        apiLogger.info('Successfully generated report');
      });
    } catch (error: unknown) {
      const errStr = `${error}`;
      if (errStr.includes('No API descriptor')) {
        apiLogger.error(`Failed to generate a PDF: ${error}`);
        res.status(400).send({
          error: {
            status: 400,
            statusText: 'Bad Request',
            description: `${error}`,
          },
        });
      } else {
        apiLogger.error(`Internal Server error: ${error}`);
        res.status(500).send({
          error: {
            status: 500,
            statusText: 'Internal server error',
            description: `${error}`,
          },
        });
      }
      next();
    } finally {
      // To handle the edge case where a pool terminates while the queue isn't empty,
      // we ensure that the queue is empty and all workers are idle.
      const stats = pool.stats();
      apiLogger.debug(JSON.stringify(stats, null, 2));
      if (
        stats.pendingTasks === 0 &&
        stats.totalWorkers === stats.idleWorkers
      ) {
        await pool.terminate();
      }
    }
  }
);

router.get(`/preview`, async (req: PreviewHandlerRequest, res) => {
  const pdfUrl = new URL(`http://localhost:${config?.webPort}/puppeteer`);
  pdfUrl.searchParams.append('manifestLocation', req.query.manifestLocation);
  pdfUrl.searchParams.append('scope', req.query.scope);
  pdfUrl.searchParams.append('module', req.query.module);
  if (req.query.importName) {
    pdfUrl.searchParams.append('importName', req.query.importName);
  }
  if (req.query.fetchDataParams) {
    pdfUrl.searchParams.append(
      'fetchDataParams',
      JSON.stringify(req.query.fetchDataParams)
    );
  }

  try {
    const pdfBuffer = await previewPdf(pdfUrl.toString());
    res.set('Content-Type', 'application/pdf');
    res.status(200).send(pdfBuffer);
  } catch (error: unknown) {
    if (error instanceof Error) {
      // error.code is not part of the Error definition for TS inside of Node. Choices: delete the usage of code, or, force a new definition.
      apiLogger.error(`${error.message}`);
      // res.status((error.code as number) || 500).send(error.message);
      res.status(500).send(error.message); // only here as example, we don't want to force a 500 every time.
    }
  }
});

router.get('/healthz', (_req, res, _next) => {
  return res.status(200).send('Build assets available');
});

router.get(`${config?.APIPrefix}/v1/openapi.json`, (_req, res, _next) => {
  fs.readFile('./docs/openapi.json', 'utf8', (err, data) => {
    if (err) {
      apiLogger.error(err);
      return res
        .status(500)
        .send(
          `An error occurred while fetching the OpenAPI spec : ${err.message}`
        );
    } else {
      return res.json(JSON.parse(data));
    }
  });
});

export default router;
