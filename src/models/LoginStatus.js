'use strict';

const mongoose = require('mongoose');

const loginStatusSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, index: true },
    loginForm: { type: String, default: 'web' },
    dateTime: { type: Date, default: Date.now },
    ipAddress: { type: String, default: '' },
    success: { type: Boolean, default: true }
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.loginStatusId = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('LoginStatus', loginStatusSchema);
