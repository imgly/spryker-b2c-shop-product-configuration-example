/**
 * Mock Glue Storefront API — validate the designer's wire contract without
 * booting Spryker.
 *
 * Accepts the same request the real Glue API gets
 * (POST /guest-cart-items with a productConfigurationInstance), pretty-prints
 * the received payload, and answers 201 with a minimal JSON:API body.
 *
 * Usage:
 *   npm run mock:glue          # listens on http://localhost:9000
 *   PORT=9001 npm run mock:glue
 *
 * Then open the designer in embedded mode against it:
 *   http://localhost:5173/?sku=001_25904006&quantity=1&glueBaseUrl=http://localhost:9000&anonymousId=dev-1
 *
 * (Deliberately dependency-free — plain node:http.)
 */

import { createServer } from 'node:http';

const PORT = Number(process.env.PORT) || 9000;

const server = createServer((req, res) => {
  // The designer runs on a different origin (localhost:5173) — mirror the
  // CORS headers the real Glue deployment must also send.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Accept, X-Anonymous-Customer-Unique-Id'
  );

  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/guest-cart-items') {
    res.writeHead(404, { 'Content-Type': 'application/vnd.api+json' });
    res.end(JSON.stringify({ errors: [{ status: 404, detail: 'Not found' }] }));
    return;
  }

  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    const anonymousId = req.headers['x-anonymous-customer-unique-id'];
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/vnd.api+json' });
      res.end(JSON.stringify({ errors: [{ status: 400, detail: 'Invalid JSON' }] }));
      return;
    }

    const attributes = payload?.data?.attributes ?? {};
    const instance = attributes.productConfigurationInstance ?? {};

    console.log('\n─── POST /guest-cart-items ───────────────────────────────');
    console.log('X-Anonymous-Customer-Unique-Id:', anonymousId ?? '(missing!)');
    console.log('sku:', attributes.sku, '· quantity:', attributes.quantity);
    console.log('configuratorKey:', instance.configuratorKey);
    console.log('isComplete:', instance.isComplete);
    try {
      console.log('configuration:', JSON.parse(instance.configuration));
      console.log('displayData:', JSON.parse(instance.displayData));
    } catch {
      console.log('configuration (raw):', instance.configuration);
      console.log('displayData (raw):', instance.displayData);
    }

    res.writeHead(201, { 'Content-Type': 'application/vnd.api+json' });
    res.end(
      JSON.stringify({
        data: {
          type: 'guest-cart-items',
          id: `${attributes.sku ?? 'unknown'}-mock`,
          attributes
        }
      })
    );
  });
});

server.listen(PORT, () => {
  console.log(`Mock Glue API listening on http://localhost:${PORT}`);
  console.log('Waiting for POST /guest-cart-items ...');
});
