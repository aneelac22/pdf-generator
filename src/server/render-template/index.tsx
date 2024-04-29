import React from 'react';
import fs from 'fs';
import path from 'path';
import { renderToString } from 'react-dom/server';

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

function renderTemplate() {
  const root = process.cwd();
  const baseTemplate = fs.readFileSync(
    path.resolve(root, 'public/templates/base-template.html'),
    { encoding: 'utf-8' }
  );

  const template = baseTemplate.replace(
    '<div id="root"></div>',
    `<div id="root">${renderToString(<></>)}</div>`
  );
  return template;
}

export default renderTemplate;
