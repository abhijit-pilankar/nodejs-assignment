'use strict';

const mongoose = require('mongoose');

const ROLE_NAMES = Object.freeze(['Administrator', 'Operator', 'Access User']);

const roleSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      required: true,
      unique: true,
      enum: ROLE_NAMES,
      trim: true
    },
    description: { type: String, trim: true, default: '' }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.roleId = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

const Role = mongoose.model('Role', roleSchema);
Role.ROLE_NAMES = ROLE_NAMES;

module.exports = Role;
