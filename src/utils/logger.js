 'use strict';
 
 const pino = require('pino');
 
 const logger = pino({
   level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
   redact: {
     paths: [
       'req.headers.authorization',
       'req.headers.cookie',
       'req.body.password',
       'req.body.refreshToken',
       'refreshToken'
     ],
     remove: true
   }
 });
 
 module.exports = logger;
