import app from '../backend/src/server';

// Re-export the Express app as the default export so Vercel's Node builder
// treats this file as the serverless function entrypoint.
export default app;
