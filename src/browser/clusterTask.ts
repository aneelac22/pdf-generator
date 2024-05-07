import os from 'os';
import fs from 'fs';
import { PdfRequestBody } from '../common/types';
import { apiLogger } from '../common/logging';
import { pageHeight, pageWidth, setWindowProperty } from './helpers';
import PdfCache from '../common/pdfCache';
import { getHeaderAndFooterTemplates } from '../server/render-template';
import config from '../common/config';
import { uploadPDF } from '../common/objectStore';
import { UpdateStatus, isValidPageResponse } from '../server/utils';
import { PdfGenerationError } from '../server/errors';
import { cluster } from '../server/cluster';
import { HTTPRequest, Page } from 'puppeteer';

// Match the timeout on the gateway
const BROWSER_TIMEOUT = 60_000;

const redirectFontFiles = async (request: HTTPRequest) => {
  if (request.url().endsWith('.woff') || request.url().endsWith('.woff2')) {
    const modifiedUrl = request.url().replace(/^http:\/\/localhost:8000\//, '');
    const fontFile = `./dist/${modifiedUrl}`;
    fs.readFile(fontFile, async (err, data) => {
      if (err) {
        await request.respond({
          status: 404,
          body: `An error occurred while loading font ${modifiedUrl} : ${err.message}`,
        });
      }
      await request.respond({
        body: data,
        status: 200,
      });
    });
  } else {
    await request.continue();
  }
};

const getNewPdfName = (id: string) => {
  const pdfFilename = `report_${id}.pdf`;
  return `${os.tmpdir()}/${pdfFilename}`;
};

export const generatePdf = async (
  {
    url,
    identity,
    fetchDataParams,
    uuid: componentId,
    authHeader,
  }: PdfRequestBody,
  collectionId: string
): Promise<string> => {
  const pdfPath = getNewPdfName(componentId);
  const createFilename = async (): Promise<string> => {
    await cluster.queue(async ({ page }: { page: Page }) => {
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
      );

      await page.setViewport({ width: pageWidth, height: pageHeight });

      // Enables console logging in Headless mode - handy for debugging components
      page.on('console', (msg) =>
        apiLogger.info(`[Headless log] ${msg.text()}`)
      );

      await setWindowProperty(
        page,
        'customPuppeteerParams',
        JSON.stringify({
          puppeteerParams: {
            pageWidth,
            pageHeight,
          },
        })
      );

      const extraHeaders: Record<string, string> = {};
      if (identity) {
        extraHeaders['x-rh-identity'] = identity;
      }

      if (fetchDataParams) {
        extraHeaders[config?.OPTIONS_HEADER_NAME] =
          JSON.stringify(fetchDataParams);
      }

      if (authHeader) {
        extraHeaders[config.AUTHORIZATION_CONTEXT_KEY] = authHeader;
      }

      await page.setExtraHTTPHeaders(extraHeaders);

      // Intercept font requests from chrome and send them from dist
      await page.setRequestInterception(true);
      page.on('request', async (request) => {
        await redirectFontFiles(request);
      });

      const pageResponse = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: BROWSER_TIMEOUT,
      });
      // wait for subsequent network requests to finish
      await page.waitForNetworkIdle({
        idleTime: 1000,
      });
      // because a cached response is a 3xx, puppeteer counts cache as an error
      // so we don't use pageResponse.ok()
      const pageStatus = pageResponse?.status();

      // get the error from DOM if it exists
      const error = await page.evaluate(() => {
        const elem = document.getElementById('report-error');
        if (elem) {
          return elem.innerText;
        }
      });

      // error happened during page rendering
      if (error && error.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let response: any;
        try {
          // error should be JSON
          response = JSON.parse(error);
          apiLogger.debug(response.data);
        } catch {
          // fallback to initial error value
          response = error;
          apiLogger.debug(`Page render error ${response}`);
        }
        const updated = {
          collectionId,
          status: `Failed: ${response}`,
          filepath: '',
          componentId: componentId,
        };
        UpdateStatus(updated);
        throw new PdfGenerationError(
          collectionId,
          componentId,
          `Page render error: ${response}`
        );
      }
      if (!pageStatus || !isValidPageResponse(pageStatus)) {
        apiLogger.debug(`Page status: ${pageResponse?.statusText()}`);
        const updated = {
          collectionId,
          status: `Failed: ${pageResponse?.statusText()}`,
          filepath: '',
          componentId: componentId,
        };
        UpdateStatus(updated);
        throw new PdfGenerationError(
          collectionId,
          componentId,
          `Puppeteer error while loading the react app: ${pageResponse?.statusText()}`
        );
      }

      const { headerTemplate, footerTemplate } = getHeaderAndFooterTemplates();

      try {
        await page.pdf({
          path: pdfPath,
          format: 'a4',
          printBackground: true,
          margin: {
            top: '54px',
            bottom: '54px',
          },
          displayHeaderFooter: true,
          headerTemplate,
          footerTemplate,
          timeout: BROWSER_TIMEOUT,
        });
        uploadPDF(componentId, pdfPath).catch((error: unknown) => {
          apiLogger.error(`Failed to upload PDF: ${error}`);
        });
        const updated = {
          collectionId,
          status: 'Generated',
          filepath: pdfPath,
          componentId: componentId,
        };
        UpdateStatus(updated);
        PdfCache.getInstance().verifyCollection(collectionId);
      } catch (error: unknown) {
        const updated = {
          collectionId,
          status: `Failed to print pdf: ${JSON.stringify(error)}`,
          filepath: '',
          componentId: componentId,
        };
        UpdateStatus(updated);
        throw new PdfGenerationError(
          collectionId,
          componentId,
          `Failed to print pdf: ${JSON.stringify(error)}`
        );
      } finally {
        await page.close();
      }
      return pdfPath;
    });

    return pdfPath;
  };

  const filename = await createFilename()
    .then((filename) => {
      return filename;
    })
    // TODO: This seems dumb
    .catch((error) => {
      throw error;
    });
  return filename;
};
