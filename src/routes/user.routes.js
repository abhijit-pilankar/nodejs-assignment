'use strict';

const express = require('express');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { createUserSchema } = require('../validators/user.schema');
const userController = require('../controllers/user.controller');

const router = express.Router();

router.use(requireAuth, requireRole('Administrator'));

router.post('/', validate(createUserSchema), userController.createUser);
router.get('/', userController.listUsers);
router.get('/:id', userController.getUser);

module.exports = router;
