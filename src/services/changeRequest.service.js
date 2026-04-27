'use strict';

const ChangeRequest = require('../models/ChangeRequest');
const Person = require('../models/Person');
const generateUniqueId = require('../utils/generateUniqueId');
const ApiError = require('../utils/ApiError');

async function listChangeRequests({ status } = {}) {
  const filter = {};
  if (status) filter.status = status;
  return ChangeRequest.find(filter).sort({ createdAt: -1 });
}

async function approveChangeRequest({ changeRequestId, reviewerId }) {
  const cr = await ChangeRequest.findById(changeRequestId);
  if (!cr) throw ApiError.notFound('Change request not found');
  if (cr.status !== 'pending') {
    throw ApiError.badRequest(`Change request is already ${cr.status}`);
  }

  let person;
  if (cr.action === 'create') {
    const personalUniqueId = await generateUnusedUniqueId();
    person = await Person.create({
      ...cr.payload,
      personalUniqueId
    });
  } else if (cr.action === 'update') {
    person = await Person.findById(cr.targetPersonId);
    if (!person) {
      cr.status = 'rejected';
      cr.reviewedBy = reviewerId;
      cr.reviewedAt = new Date();
      cr.reason = 'Target person no longer exists';
      await cr.save();
      throw ApiError.notFound('Target person no longer exists');
    }
    Object.assign(person, cr.payload);
    await person.save();
  } else {
    throw ApiError.badRequest(`Unknown action: ${cr.action}`);
  }

  cr.status = 'approved';
  cr.reviewedBy = reviewerId;
  cr.reviewedAt = new Date();
  await cr.save();

  return { changeRequest: cr, person };
}

async function rejectChangeRequest({ changeRequestId, reviewerId, reason = '' }) {
  const cr = await ChangeRequest.findById(changeRequestId);
  if (!cr) throw ApiError.notFound('Change request not found');
  if (cr.status !== 'pending') {
    throw ApiError.badRequest(`Change request is already ${cr.status}`);
  }
  cr.status = 'rejected';
  cr.reviewedBy = reviewerId;
  cr.reviewedAt = new Date();
  cr.reason = reason;
  await cr.save();
  return cr;
}

async function generateUnusedUniqueId(maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const candidate = generateUniqueId();
    // eslint-disable-next-line no-await-in-loop
    const exists = await Person.findOne({ personalUniqueId: candidate });
    if (!exists) return candidate;
  }
  throw new Error('Failed to generate a unique personalUniqueId');
}

module.exports = {
  listChangeRequests,
  approveChangeRequest,
  rejectChangeRequest,
  generateUnusedUniqueId
};
