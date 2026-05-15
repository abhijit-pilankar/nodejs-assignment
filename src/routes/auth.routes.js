'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, refreshSchema, logoutSchema } = require('../validators/auth.schema');
const authController = require('../controllers/auth.controller');

const router = express.Router();

const authLimiter =
  process.env.NODE_ENV === 'test'
    ? (req, res, next) => next()
    : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { message: 'Too many requests, please try again later.' } }
    });

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(logoutSchema), authController.logout);

module.exports = router;
