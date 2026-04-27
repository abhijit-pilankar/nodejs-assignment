'use strict';

const Person = require('../models/Person');
const User = require('../models/User');
const ChangeRequest = require('../models/ChangeRequest');
const ApiError = require('../utils/ApiError');

async function submitCreate({ payload, submittedBy }) {
  return ChangeRequest.create({
    action: 'create',
    status: 'pending',
    payload,
    submittedBy
  });
}

async function submitUpdate({ personId, payload, submittedBy, requester }) {
  const person = await Person.findById(personId);
  if (!person) throw ApiError.notFound('Person not found');

  if (requester.roleName === 'Access User') {
    const user = await User.findById(requester.userId);
    if (!user || !person.ownerUserId || person.ownerUserId.toString() !== user._id.toString()) {
      throw ApiError.forbidden('Access User can only update their own record');
    }
  }

  return ChangeRequest.create({
    action: 'update',
    status: 'pending',
    targetPersonId: person._id,
    payload,
    submittedBy
  });
}

async function getPerson({ personId, requester }) {
  const person = await Person.findById(personId);
  if (!person) throw ApiError.notFound('Person not found');

  if (requester.roleName === 'Access User') {
    if (!person.ownerUserId || person.ownerUserId.toString() !== requester.userId) {
      throw ApiError.forbidden('Access denied');
    }
  }
  return person;
}

module.exports = { submitCreate, submitUpdate, getPerson };
