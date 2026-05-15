'use strict';

const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  const details = err.details;

  if (err && err.name === 'ValidationError') {
    status = 400;
  } else if (err && err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err && err.code === 11000) {
    status = 409;
    message = 'Duplicate key';
  }

  const body = { error: { message } };
  if (details) body.error.details = details;
  if (process.env.NODE_ENV === 'development') {
    body.error.stack = err.stack;
  }

  const headers = req.headers || {};
  const reqId = req.id || headers['x-request-id'];
  logger.error(
    {
      err,
      reqId,
      method: req.method,
      path: req.originalUrl,
      statusCode: status
    },
    'Request failed'
  );

  res.status(status).json(body);
}

module.exports = { notFoundHandler, errorHandler };
