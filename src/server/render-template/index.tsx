import fs from 'fs';
import path from 'path';
import { GeneratePayload } from '../../common/types';

export function getHeaderAndFooterTemplates(): {
  headerTemplate: string;
  footerTemplate: string;
} {
  const root = process.cwd();
  const headerBase = fs.readFileSync(
    path.resolve(root, 'public/templates/header-template.html'),
    { encoding: 'utf-8' }
  );

  const footerBase = fs.readFileSync(
    path.resolve(root, 'public/templates/footer-template.html'),
    { encoding: 'utf-8' }
  );

  return {
    headerTemplate: headerBase,
    footerTemplate: footerBase,
  };
}

function renderTemplate(payload: GeneratePayload) {
  const root = process.cwd();
  const baseTemplate = fs.readFileSync(
    path.resolve(root, 'dist/public/index.html'),
    { encoding: 'utf-8' }
  );

  const template = baseTemplate.replace(
    '<script id="initial-state"></script>',
    `<script id="initial-state">window.__initialState__ = ${JSON.stringify(
      payload,
      null,
      2
    )}</script>`
  );

  return template;
}

export default renderTemplate;
