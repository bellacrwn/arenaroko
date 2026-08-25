import { createServer } from 'node:http';
import { createApp } from './app.js';
import { config, validateProductionConfig } from './config.js';

validateProductionConfig();
const app = await createApp();
const server = createServer(app);

server.listen(config.port, '0.0.0.0', () => {
  console.log(`REKO API listening on http://0.0.0.0:${config.port}${config.apiPrefix}`);
  if (!config.isProduction && config.jwtSecret === 'development-only-change-this-secret') console.warn('Using the development JWT secret. Set JWT_SECRET before deployment.');
});

function shutdown(signal) {
  console.log(`${signal} received; closing REKO API.`);
  server.close((error) => {
    if (error) { console.error(error); process.exit(1); }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
