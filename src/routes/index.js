'use strict';

const express = require('express');

const authRoutes = require('./auth.routes');
const roleRoutes = require('./role.routes');
const userRoutes = require('./user.routes');
const personRoutes = require('./person.routes');
const changeRequestRoutes = require('./changeRequest.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/roles', roleRoutes);
router.use('/users', userRoutes);
router.use('/persons', personRoutes);
router.use('/change-requests', changeRequestRoutes);

module.exports = router;
