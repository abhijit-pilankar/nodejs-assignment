'use strict';

const Role = require('../models/Role');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const createRole = asyncHandler(async (req, res) => {
  const { roleName, description = '' } = req.body;
  const exists = await Role.findOne({ roleName });
  if (exists) {
    throw ApiError.conflict(`Role "${roleName}" already exists`);
  }
  const role = await Role.create({ roleName, description });
  res.status(201).json(role.toJSON());
});

const listRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().sort({ roleName: 1 });
  res.json(roles.map((r) => r.toJSON()));
});

module.exports = { createRole, listRoles };
