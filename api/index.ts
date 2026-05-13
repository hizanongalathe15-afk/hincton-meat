import serverless from 'serverless-http';
import app from '../backend/src/server';

export default serverless(app as any);
import app from '../backend/src/server';

// Re-export the Express app as the default export so Vercel's Node builder
// treats this file as the serverless function entrypoint.
export default app;
