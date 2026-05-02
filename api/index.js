// Vercel serverless entrypoint. Vercel maps every request matching /api/*
// (per vercel.json rewrite) into this function and hands it the standard
// Node http req/res, which serverless-http adapts for the Express app.
//
// The Express app itself (server/src/server.js) gates app.listen() on
// VERCEL !== '1', so importing it doesn't open a TCP socket.

import serverless from 'serverless-http';

export const config = {
  // Default 10s on Hobby, 60s on Pro. Bumped for the rare slow query
  // (movement clustering trigger, fuel-claim PDF render).
  maxDuration: 30,
};

let _handler = null;
let _bootError = null;

const boot = async () => {
  if (_handler) return _handler;
  if (_bootError) throw _bootError;
  try {
    const { default: app } = await import('../server/src/server.js');
    _handler = serverless(app);
    return _handler;
  } catch (err) {
    _bootError = err;
    throw err;
  }
};

export default async function handler(req, res) {
  try {
    const h = await boot();
    return h(req, res);
  } catch (err) {
    // Surface the boot error as JSON so we can see it in curl/browser
    // instead of an opaque FUNCTION_INVOCATION_FAILED.
    console.error('Function boot failed:', err);
    res.status(500).json({
      success: false,
      message: 'Server boot failed',
      error:   err?.message || String(err),
      stack:   err?.stack,
      missingEnv: ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET']
        .filter(k => !process.env[k]),
    });
  }
}
