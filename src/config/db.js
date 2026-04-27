'use strict';

const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

async function connect(uri = env.mongoUri) {
  if (!uri) {
    throw new Error('MongoDB URI is not configured');
  }
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000
  });
  return mongoose.connection;
}

async function disconnect() {
  await mongoose.disconnect();
}

module.exports = { connect, disconnect, mongoose };
