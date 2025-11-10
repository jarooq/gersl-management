// Vercel Serverless Function Wrapper
import serverless from 'serverless-http';
import app from '../server/src/server.js';

// Wrap the Express app for serverless deployment
export default serverless(app);
