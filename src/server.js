'use strict';

const env = require('./config/env');
const { connect } = require('./config/db');
const createApp = require('./app');
const logger = require('./utils/logger');

async function bootstrap() {
  try {
    await connect();
    const app = createApp();
    app.listen(env.port, () => {
      logger.info({ port: env.port, nodeEnv: env.nodeEnv }, 'API listening');
    });
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();
