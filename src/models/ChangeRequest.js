'use strict';

const mongoose = require('mongoose');

const ACTIONS = Object.freeze(['create', 'update']);
const STATUSES = Object.freeze(['pending', 'approved', 'rejected']);

const changeRequestSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, enum: ACTIONS },
    status: { type: String, required: true, enum: STATUSES, default: 'pending', index: true },
    targetPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Person',
      default: null
    },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: { type: Date, default: null },
    reason: { type: String, default: '' }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.changeRequestId = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

const ChangeRequest = mongoose.model('ChangeRequest', changeRequestSchema);
ChangeRequest.ACTIONS = ACTIONS;
ChangeRequest.STATUSES = STATUSES;

module.exports = ChangeRequest;
