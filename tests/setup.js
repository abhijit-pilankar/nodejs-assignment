'use strict';

const mongoose = require('mongoose');

let connected = false;
let dbName;

async function startTestDb() {
  if (connected) return mongoose.connection.host;
  const baseUri = process.env.MONGODB_URI;
  if (!baseUri) {
    throw new Error('MONGODB_URI is required for tests');
  }
  dbName = `na_t_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000).toString(36)}`;
  await mongoose.connect(baseUri, { dbName });
  connected = true;
  return mongoose.connection.host;
}

async function stopTestDb() {
  if (!connected) return;
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.disconnect();
  connected = false;
  dbName = undefined;
}

async function clearDb() {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((c) => c.deleteMany({}))
  );
}

module.exports = { startTestDb, stopTestDb, clearDb };
