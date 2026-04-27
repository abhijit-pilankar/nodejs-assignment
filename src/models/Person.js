'use strict';

const mongoose = require('mongoose');

const GENDERS = Object.freeze(['Male', 'Female', 'Other']);
const MARITAL_STATUSES = Object.freeze([
  'Married',
  'Unmarried',
  'Divorced',
  'Widow',
  'Widower',
  'Separated'
]);
const EDUCATION_STATUSES = Object.freeze([
  'PHD',
  'Masters',
  'Graduate',
  'Under-Graduate',
  'HSC',
  'SSC',
  'Illiterate',
  'Other'
]);
const BIRTH_SIGNS = Object.freeze([
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
  'None'
]);

const addressSchema = new mongoose.Schema(
  {
    flatNumber: { type: String, required: true, trim: true },
    societyName: { type: String, required: true, trim: true },
    streetOrArea: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const personSchema = new mongoose.Schema(
  {
    personalUniqueId: { type: String, unique: true, sparse: true, index: true },
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true, default: '' },
    lastName: { type: String, required: true, trim: true },
    gender: { type: String, required: true, enum: GENDERS },
    dateOfBirth: { type: Date, required: true },
    age: { type: Number, required: true, min: 0, max: 150 },
    address: { type: addressSchema, required: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pinCode: { type: String, required: true, match: /^[0-9]{6}$/ },
    phoneNo: { type: String, trim: true, default: '' },
    mobileNo: { type: String, required: true, match: /^[0-9]{10}$/ },
    physicalDisability: { type: String, trim: true, default: '' },
    maritalStatus: { type: String, required: true, enum: MARITAL_STATUSES },
    educationStatus: { type: String, required: true, enum: EDUCATION_STATUSES },
    birthSign: { type: String, enum: BIRTH_SIGNS, default: 'None' },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.personId = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

const Person = mongoose.model('Person', personSchema);
Person.GENDERS = GENDERS;
Person.MARITAL_STATUSES = MARITAL_STATUSES;
Person.EDUCATION_STATUSES = EDUCATION_STATUSES;
Person.BIRTH_SIGNS = BIRTH_SIGNS;

module.exports = Person;
