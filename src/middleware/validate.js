'use strict';

const ApiError = require('../utils/ApiError');

const validate = (schema, source = 'body') => (req, res, next) => {
  if (!schema) return next();
  const data = req[source];
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const details = error.details.map((d) => ({
      path: d.path.join('.'),
      message: d.message
    }));
    return next(ApiError.badRequest('Validation failed', details));
  }

  req[source] = value;
  return next();
};

module.exports = validate;
