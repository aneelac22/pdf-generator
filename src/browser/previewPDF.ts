import puppeteer from 'puppeteer';
import {
  CHROMIUM_PATH,
  getViewportConfig,
  pageHeight,
  pageWidth,
  setWindowProperty,
} from './helpers';
import config from '../common/config';
import renderTemplate, {
  getHeaderAndFooterTemplates,
} from '../server/render-template';
import { TemplateConfig } from '../common/types';
import { apiLogger } from '../common/logging';

const previewPdf = async (
  url: string,
  templateConfig: TemplateConfig,
  templateData: Record<string, unknown>,
  orientationOption?: boolean
) => {
  const createBuffer = async () => {
    const { browserMargins, landscape } = getViewportConfig(
      templateConfig,
      orientationOption
    );
    const browser = await puppeteer.launch({
      headless: true,
      ...(config?.IS_PRODUCTION
        ? {
            // we have a different dir structure than puppeteer expects. We have to point it to the correct chromium executable
            executablePath: CHROMIUM_PATH,
          }
        : {}),
      args: ['--no-sandbox', '--disable-gpu'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: pageWidth, height: pageHeight });
    await page.setContent(renderTemplate(templateConfig, templateData));

    // // Enables console logging in Headless mode - handy for debugging components
    page.on('console', (msg) =>
      apiLogger.debug(`[Headless log] ${msg.text()}`)
    );
    const { headerTemplate, footerTemplate } =
      getHeaderAndFooterTemplates(templateConfig);

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

    const pageStatus = await page.goto(url, { waitUntil: 'networkidle2' });

    const pdfBuffer = await page.pdf({
      format: 'a4',
      printBackground: true,
      margin: browserMargins,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      landscape,
    });

    if (!pageStatus?.ok()) {
      throw new Error(
        `Puppeteer error while loading the react app: ${pageStatus?.statusText()}`
      );
    }

    await browser.close();
    return pdfBuffer;
  };

  const bufferLock = createBuffer();
  return await bufferLock;
};

export default previewPdf;
