 'use strict';
 
 const mongoose = require('mongoose');
 
 const refreshTokenSchema = new mongoose.Schema(
   {
     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
     jti: { type: String, required: true, unique: true, index: true },
     expiresAt: { type: Date, required: true, index: true },
     revokedAt: { type: Date, default: null },
     replacedByJti: { type: String, default: null },
     createdByIp: { type: String, default: '' },
     revokedByIp: { type: String, default: '' }
   },
   { timestamps: true }
 );
 
 refreshTokenSchema.methods.isActive = function isActive() {
   return !this.revokedAt && this.expiresAt > new Date();
 };
 
 module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
