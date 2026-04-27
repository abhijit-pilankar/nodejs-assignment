'use strict';

const Joi = require('joi');

const createUserSchema = Joi.object({
  username: Joi.string().trim().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  roleName: Joi.string()
    .valid('Administrator', 'Operator', 'Access User')
    .optional()
});

module.exports = { createUserSchema };
