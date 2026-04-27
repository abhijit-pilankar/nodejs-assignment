'use strict';

const Joi = require('joi');

const createRoleSchema = Joi.object({
  roleName: Joi.string()
    .valid('Administrator', 'Operator', 'Access User')
    .required(),
  description: Joi.string().allow('').max(255).optional()
});

module.exports = { createRoleSchema };
