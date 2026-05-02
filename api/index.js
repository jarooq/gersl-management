// Vercel serverless entrypoint. Vercel maps every request matching /api/*
// (per vercel.json rewrite) into this function and hands it the standard
// Node http req/res, which serverless-http adapts for the Express app.
//
// The Express app itself (server/src/server.js) gates app.listen() on
// VERCEL !== '1', so importing it here doesn't open a TCP socket.

import serverless from 'serverless-http';
import app from '../server/src/server.js';

export const config = {
  // Default 10s on Hobby, 60s on Pro. Bumped for the rare slow query
  // (movement clustering trigger, fuel-claim PDF render).
  maxDuration: 30,
};

export default serverless(app);
