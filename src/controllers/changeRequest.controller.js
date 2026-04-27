'use strict';

const asyncHandler = require('../utils/asyncHandler');
const changeRequestService = require('../services/changeRequest.service');

const listChangeRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const items = await changeRequestService.listChangeRequests({ status });
  res.json(items.map((c) => c.toJSON()));
});

const approve = asyncHandler(async (req, res) => {
  const { changeRequest, person } = await changeRequestService.approveChangeRequest({
    changeRequestId: req.params.id,
    reviewerId: req.user.userId
  });
  res.json({
    changeRequest: changeRequest.toJSON(),
    person: person.toJSON()
  });
});

const reject = asyncHandler(async (req, res) => {
  const cr = await changeRequestService.rejectChangeRequest({
    changeRequestId: req.params.id,
    reviewerId: req.user.userId,
    reason: req.body && req.body.reason ? String(req.body.reason) : ''
  });
  res.json(cr.toJSON());
});

module.exports = { listChangeRequests, approve, reject };
