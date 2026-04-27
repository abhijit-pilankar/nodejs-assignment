'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

function signToken(payload, options = {}) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    ...options
  });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (!token || scheme !== 'Bearer') {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'));
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      roleName: decoded.roleName
    };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token expired'));
    }
    return next(ApiError.unauthorized('Invalid token'));
  }
}

function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }
    if (!allowed.includes(req.user.roleName)) {
      return next(ApiError.forbidden('Insufficient role'));
    }
    return next();
  };
}

module.exports = { signToken, verifyToken, requireAuth, requireRole };
