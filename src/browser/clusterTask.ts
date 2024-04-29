import os from 'os';
import fs from 'fs';
import { PdfRequestBody } from '../common/types';
import { apiLogger } from '../common/logging';
import {
  getViewportConfig,
  pageHeight,
  pageWidth,
  setWindowProperty,
} from './helpers';
import { getHeaderAndFooterTemplates } from '../server/render-template';
import config from '../common/config';
import { uploadPDF } from '../common/objectStore';
import { UpdateStatus, isValidPageResponse } from '../server/utils';
import { PdfGenerationError } from '../server/errors';
import { cluster } from '../server/cluster';
import { Page } from 'puppeteer';

// Match the timeout on the gateway
const BROWSER_TIMEOUT = 60_000;

const redirectFontFiles = async (request: any) => {
  if (request.url().endsWith('.woff') || request.url().endsWith('.woff2')) {
    const modifiedUrl = request.url().replace(/^http:\/\/localhost:8000\//, '');
    const fontFile = `./dist/${modifiedUrl}`;
    fs.readFile(fontFile, async (err, data) => {
      if (err) {
        await request.respond({
          status: 404,
          body: `An error occurred while loading font ${modifiedUrl} : ${err}`,
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
    rhIdentity,
    templateConfig,
    orientationOption,
    dataOptions,
    uuid,
  }: PdfRequestBody,
  dataRange: any,
  componentId: string
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
        // }) as undefined // probably a typings issue in puppeteer
      );

      await page.setExtraHTTPHeaders({
        ...(dataOptions
          ? {
              [config?.OPTIONS_HEADER_NAME]: JSON.stringify(dataOptions),
            }
          : {}),

        ...(config?.IS_DEVELOPMENT && !rhIdentity
          ? {}
          : { 'x-rh-identity': rhIdentity }),
        ...(dataRange
          ? { start: `${dataRange.start}`, end: `${dataRange.end}` }
          : {}),
      });

      // Intercept font requests from chrome and send them from dist
      await page.setRequestInterception(true);
      page.on('request', async (request) => {
        await redirectFontFiles(request);
      });

      const pageResponse = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: BROWSER_TIMEOUT,
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
          collectionId: uuid,
          status: `Failed: ${response}`,
          filepath: '',
          componentId: componentId,
        };
        UpdateStatus(updated);
        throw new PdfGenerationError(
          uuid,
          componentId,
          `Page render error: ${response}`
        );
      }
      if (!pageStatus || !isValidPageResponse(pageStatus)) {
        apiLogger.debug(`Page status: ${pageResponse?.statusText()}`);
        const updated = {
          collectionId: uuid,
          status: `Failed: ${pageResponse?.statusText()}`,
          filepath: '',
          componentId: componentId,
        };
        UpdateStatus(updated);
        throw new PdfGenerationError(
          uuid,
          componentId,
          `Puppeteer error while loading the react app: ${pageResponse?.statusText()}`
        );
      }
      const { browserMargins, landscape } = getViewportConfig(
        templateConfig,
        orientationOption
      );

      const { headerTemplate, footerTemplate } =
        getHeaderAndFooterTemplates(templateConfig);

      try {
        await page.pdf({
          path: pdfPath,
          format: 'a4',
          printBackground: true,
          margin: browserMargins,
          displayHeaderFooter: true,
          headerTemplate,
          footerTemplate,
          landscape,
          timeout: BROWSER_TIMEOUT,
        });
        uploadPDF(componentId, pdfPath).catch((error: unknown) => {
          apiLogger.error(`Failed to upload PDF: ${error}`);
        });
        const updated = {
          collectionId: uuid,
          status: 'Generated',
          filepath: pdfPath,
          componentId: componentId,
        };
        UpdateStatus(updated);
      } catch (error: unknown) {
        const updated = {
          collectionId: uuid,
          status: `Failed to print pdf: ${JSON.stringify(error)}`,
          filepath: '',
          componentId: componentId,
        };
        UpdateStatus(updated);
        throw new PdfGenerationError(
          uuid,
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
