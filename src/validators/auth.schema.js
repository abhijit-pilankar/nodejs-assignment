'use strict';

const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string().trim().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  roleName: Joi.string().valid('Administrator', 'Operator', 'Access User').optional()
});

const loginSchema = Joi.object({
  username: Joi.string().trim().required(),
  password: Joi.string().required(),
  loginForm: Joi.string().trim().optional()
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const logoutSchema = Joi.object({
  refreshToken: Joi.string().required()
});

module.exports = { registerSchema, loginSchema, refreshSchema, logoutSchema };
