'use strict';

const Person = require('../models/Person');
const asyncHandler = require('../utils/asyncHandler');
const { buildPersonFilter } = require('../services/search.service');

const search = asyncHandler(async (req, res) => {
  const filter = buildPersonFilter(req.query);

  // Access User can only see their own record. Operator/Administrator have full access.
  if (req.user.roleName === 'Access User') {
    filter.ownerUserId = req.user.userId;
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const skip = parseInt(req.query.skip, 10) || 0;

  const [items, total] = await Promise.all([
    Person.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Person.countDocuments(filter)
  ]);

  res.json({
    total,
    count: items.length,
    skip,
    limit,
    results: items.map((p) => p.toJSON())
  });
});

module.exports = { search };
