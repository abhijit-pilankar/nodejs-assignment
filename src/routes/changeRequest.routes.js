'use strict';

const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const changeRequestController = require('../controllers/changeRequest.controller');

const router = express.Router();

router.use(requireAuth, requireRole('Administrator'));

router.get('/', changeRequestController.listChangeRequests);
router.post('/:id/approve', changeRequestController.approve);
router.post('/:id/reject', changeRequestController.reject);

module.exports = router;
