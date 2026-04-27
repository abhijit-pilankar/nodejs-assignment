'use strict';

const express = require('express');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { createRoleSchema } = require('../validators/role.schema');
const roleController = require('../controllers/role.controller');

const router = express.Router();

router.use(requireAuth, requireRole('Administrator'));

router.post('/', validate(createRoleSchema), roleController.createRole);
router.get('/', roleController.listRoles);

module.exports = router;
