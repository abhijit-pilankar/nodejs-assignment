'use strict';

const asyncHandler = require('../utils/asyncHandler');
const personService = require('../services/person.service');

const submitCreate = asyncHandler(async (req, res) => {
  const cr = await personService.submitCreate({
    payload: req.body,
    submittedBy: req.user.userId
  });
  res.status(202).json({
    message: 'Person create submitted for administrator approval',
    changeRequestId: cr._id,
    status: cr.status
  });
});

const submitUpdate = asyncHandler(async (req, res) => {
  const cr = await personService.submitUpdate({
    personId: req.params.id,
    payload: req.body,
    submittedBy: req.user.userId,
    requester: req.user
  });
  res.status(202).json({
    message: 'Person update submitted for administrator approval',
    changeRequestId: cr._id,
    status: cr.status
  });
});

const getPerson = asyncHandler(async (req, res) => {
  const person = await personService.getPerson({
    personId: req.params.id,
    requester: req.user
  });
  res.json(person.toJSON());
});

module.exports = { submitCreate, submitUpdate, getPerson };
