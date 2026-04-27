'use strict';

const express = require('express');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { createPersonSchema, updatePersonSchema } = require('../validators/person.schema');
const personController = require('../controllers/person.controller');
const searchController = require('../controllers/search.controller');

const router = express.Router();

router.use(requireAuth);

// Search must come BEFORE /:id so it isn't captured as an id.
router.get(
  '/search',
  requireRole('Administrator', 'Operator', 'Access User'),
  searchController.search
);

router.post(
  '/',
  requireRole('Administrator', 'Operator'),
  validate(createPersonSchema),
  personController.submitCreate
);

router.put(
  '/:id',
  requireRole('Administrator', 'Operator', 'Access User'),
  validate(updatePersonSchema),
  personController.submitUpdate
);

router.get(
  '/:id',
  requireRole('Administrator', 'Operator', 'Access User'),
  personController.getPerson
);

module.exports = router;
