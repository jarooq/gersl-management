// Vercel serverless entrypoint. Express's request handler is (req, res, next).
// Vercel's @vercel/node runtime hands us (req, res), which Express accepts
// directly — no serverless-http adapter needed. Bypassing serverless-http
// resolved the 504-on-every-request hang we hit when wrapping with it.

import app from '../server/src/server.js';

export const config = {
  maxDuration: 30,
};

export default function handler(req, res) {
  return app(req, res);
}
