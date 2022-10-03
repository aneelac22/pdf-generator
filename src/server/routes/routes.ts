import fs from 'fs';
import { Router, Request } from 'express';
import httpContext from 'express-http-context';

import getTemplateData from '../data-access';
import ServiceNames from '../../common/service-names';
import renderTemplate from '../render-template';
import { processOrientationOption } from '../../browser/helpers';
import generatePdf, { previewPdf } from '../../browser';
import { SendingFailedError, PDFNotFoundError } from '../errors';
import config from '../../common/config';
import { PreviewReqBody, PreviewReqQuery } from '../../common/types';

// type PreviewOptions = unknown;
// type PreviewHandlerRequest = Request<
//   PreviewOptions,
//   any,
//   unknown,
//   PreviewReqQuery
// >;

type PreviewHandlerRequest = Request<
  unknown,
  unknown,
  PreviewReqBody,
  PreviewReqQuery
>;

export type GenerateHandlerRequest = Request<
  unknown,
  unknown,
  Record<string, any>,
  { service: ServiceNames; template: string }
>;

export type HelloHandlerRequest = Request<
  unknown,
  unknown,
  unknown,
  { policyId: string; totalHostCount: number }
>;

export type PupetterBrowserRequest = Request<
  unknown,
  unknown,
  unknown,
  { service: ServiceNames; template: string }
>;

const router = Router();

// Middlware that activates on all routes, responsible for rendering the correct
// template/component into html to the requester.
router.use('^/$', async (req: PupetterBrowserRequest, res, _next) => {
  let service: ServiceNames = req.query.service;
  let template: string = req.query.template;
  if (!service) {
    console.info('Missing service, using "demo"');
    service = ServiceNames.demo;
  }
  if (!template) {
    console.info('Missing template, using "demo"');
    template = 'demo';
  }

  const templateConfig = {
    service,
    template,
  };
  try {
    const configHeaders: string | string[] | undefined =
      req.headers[config?.OPTIONS_HEADER_NAME as string];
    if (configHeaders) {
      delete req.headers[config?.OPTIONS_HEADER_NAME as string];
    }

    const templateData = await getTemplateData(
      req.headers,
      templateConfig,
      configHeaders ? JSON.parse(configHeaders as string) : undefined
    );
    const HTMLTemplate: string = renderTemplate(
      templateConfig,
      templateData as Record<string, unknown>
    );
    res.send(HTMLTemplate);
  } catch (error) {
    console.log(error);
    res.send(`<div>Unable to render ${template}!</div>`);
  }
});

router.get(`${config?.APIPrefix}/hello`, (_req, res) => {
  return res.status(200).send('<h1>Well this works!</h1>');
});

router.post(
  `${config?.APIPrefix}/generate`,
  async (req: GenerateHandlerRequest, res) => {
    const rhIdentity = httpContext.get(config?.IDENTITY_HEADER_KEY as string);
    const orientationOption = processOrientationOption(req);
    const service = req.body.service;
    const template = req.body.template;
    const dataOptions = req.body;
    const url = `http://localhost:${config?.webPort}?template=${template}&service=${service}`;

    try {
      // Generate the pdf
      const pathToPdf = await generatePdf(
        url,
        rhIdentity,
        {
          service,
          template,
        },
        orientationOption,
        dataOptions
      );

      const pdfFileName = pathToPdf.split('/').pop();

      if (!fs.existsSync(pathToPdf)) {
        throw new PDFNotFoundError(pdfFileName as string);
      }

      res.status(200).sendFile(pathToPdf, (err) => {
        if (err) {
          const errorMessage = new SendingFailedError(
            pdfFileName as string,
            err
          );
          throw errorMessage;
        }

        fs.unlink(pathToPdf, (err) => {
          if (err) {
            console.info('warn', `Failed to unlink ${pdfFileName}: ${err}`);
          }
        });
      });
    } catch (error: unknown) {
      if (error instanceof Error) res.status(500).send(error.message); // same as below, 500 is only preliminary for now.
      // res.status((error.code as number) || 500).send(error.message);
    }
  }
);

router.get(`/preview`, async (req: PreviewHandlerRequest, res) => {
  const service: ServiceNames = req.query.service;
  const template: string = req.query.template;
  const templateData = await getTemplateData(req.headers, {
    service,
    template,
  });
  const orientationOption = processOrientationOption(req);

  const url = `http://localhost:${config?.webPort}?service=${service}&template=${template}`;
  try {
    const pdfBuffer = await previewPdf(
      url,
      {
        service,
        template,
      },
      templateData as Record<string, unknown>,
      orientationOption // could later turn into a full options object for other things outside orientation.
    );
    res.set('Content-Type', 'application/pdf');
    res.status(200).send(pdfBuffer);
  } catch (error: unknown) {
    if (error instanceof Error) {
      // error.code is not part of the Error definition for TS inside of Node. Choices: delete the usage of code, or, force a new definition.
      // console.info('error', `${error.code}: ${error.message}`);
      console.info('error', `${error.message}`);
      // res.status((error.code as number) || 500).send(error.message);
      res.status(500).send(error.message); // only here as example, we don't want to force a 500 every time.
    }
  }
});

router.get('/healthz', (_req, res, _next) => {
  return res.status(200).send('Build assets available');
});

export default router;
