import WP from 'workerpool';
import puppeteer, { HTTPRequest } from 'puppeteer';
import os from 'os';
import fs from 'fs';
import crypto from 'crypto';
import { PdfRequestBody } from '../common/types';
import { apiLogger } from '../common/logging';
import {
  CHROMIUM_PATH,
  pageHeight,
  pageWidth,
  setWindowProperty,
} from './helpers';
import { getHeaderAndFooterTemplates } from '../server/render-template';
import config from '../common/config';

// Match the timeout on the gateway
const BROWSER_TIMEOUT = 600_000;

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

const getNewPdfName = () => {
  const pdfFilename = `report_${crypto.randomUUID()}.pdf`;
  return `${os.tmpdir()}/${pdfFilename}`;
};

const generatePdf = async (data: PdfRequestBody) => {
  const { url, identity, uuid, fetchDataParams } = data;
  console.log('generatePdf', data);
  const pdfPath = getNewPdfName();
  const createFilename = async () => {
    apiLogger.debug(uuid);
    apiLogger.debug(`Could not fetch browser status; starting a new browser`);
    const browser = await puppeteer.launch({
      timeout: BROWSER_TIMEOUT,
      ...(config?.IS_PRODUCTION
        ? {
            // we have a different dir structure than puppeteer expects. We have to point it to the correct chromium executable
            executablePath: CHROMIUM_PATH,
          }
        : {}),
      args: [
        '--no-sandbox',
        '--disable-gpu',
        '--no-zygote',
        '--no-first-run',
        '--disable-dev-shm-usage',
        '--single-process',
        '--mute-audio',
        "--proxy-server='direct://'",
        '--proxy-bypass-list=*',
        '--user-data-dir=/tmp/',
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
    );

    await page.setViewport({ width: pageWidth, height: pageHeight });

    // Enables console logging in Headless mode - handy for debugging components
    page.on('console', (msg) => apiLogger.info(`[Headless log] ${msg.text()}`));

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
    console.log('Identity in worker: ', identity);
    await page.setExtraHTTPHeaders({
      ...(fetchDataParams
        ? {
            [config?.OPTIONS_HEADER_NAME]: JSON.stringify(fetchDataParams),
          }
        : {}),

      ...(config?.IS_DEVELOPMENT || !identity
        ? {}
        : { 'x-rh-identity': identity }),
    });

    // Intercept font requests from chrome and send them from dist
    await page.setRequestInterception(true);
    page.on('request', async (request) => {
      await redirectFontFiles(request);
    });

    const pageStatus = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: BROWSER_TIMEOUT,
    });
    // get the error from DOM if it exists
    const error = await page.evaluate(() => {
      const elem = document.getElementById('report-error');
      if (elem) {
        return elem.innerText;
      }
    });

    console.log({ error });

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
      throw new Error(`Page render error: ${response}`);
    }

    console.log(pageStatus?.statusText(), pageStatus?.ok());

    if (!pageStatus?.ok() && pageStatus?.statusText() !== 'Not Modified') {
      apiLogger.debug(`Page status: ${pageStatus?.statusText()}`);
      throw new Error(
        `Puppeteer error while loading the react app: ${pageStatus?.statusText()}`
      );
    }

    console.log('pdfPath', pdfPath);
    const { headerTemplate, footerTemplate } = getHeaderAndFooterTemplates();

    try {
      await page.pdf({
        path: pdfPath,
        format: 'a4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate,
        footerTemplate,
        timeout: BROWSER_TIMEOUT,
        margin: {
          top: '54px',
          bottom: '54px',
        },
      });
    } catch (error: unknown) {
      throw new Error(`Failed to print pdf: ${JSON.stringify(error)}`);
    } finally {
      await page.close();
      await browser.close();
    }
    return pdfPath;
  };

  const filename = await createFilename()
    .then((filename) => {
      return filename;
    })
    .catch((error) => {
      throw error;
    });
  return filename;
};

const workerTerminated = (code: number | undefined) => {
  if (typeof code === 'number') {
    const workerResult = code > 0 ? `with error code ${code}` : `successfully`;
    apiLogger.debug(`Worker terminated ${workerResult}`);
  } else {
    apiLogger.warning(
      `A worker reached a termination issue and no code is available`
    );
  }
};

// register new worker to pool
WP.worker(
  {
    generatePdf,
  },
  {
    onTerminate: workerTerminated,
  }
);
