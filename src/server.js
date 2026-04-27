'use strict';

const env = require('./config/env');
const { connect } = require('./config/db');
const createApp = require('./app');

async function bootstrap() {
  try {
    await connect();
    const app = createApp();
    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`API listening on port ${env.port} (${env.nodeEnv})`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
