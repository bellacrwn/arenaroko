import { createServer } from 'node:http';
import { createApp } from './app.js';
import { config, validateConfig } from './config.js';

validateConfig();
const app = await createApp();
const server = createServer(app);

server.listen(config.port, '0.0.0.0', () => {
  console.log(`REKO Supabase API listening on http://0.0.0.0:${config.port}${config.apiPrefix}`);
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
