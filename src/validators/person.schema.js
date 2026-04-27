'use strict';

const Joi = require('joi');
const Person = require('../models/Person');

const addressSchema = Joi.object({
  flatNumber: Joi.string().trim().min(1).max(50).required(),
  societyName: Joi.string().trim().min(1).max(150).required(),
  streetOrArea: Joi.string().trim().min(1).max(150).required()
});

const baseFields = {
  firstName: Joi.string().trim().min(1).max(80),
  middleName: Joi.string().trim().allow('').max(80),
  lastName: Joi.string().trim().min(1).max(80),
  gender: Joi.string().valid(...Person.GENDERS),
  dateOfBirth: Joi.date().less('now'),
  age: Joi.number().integer().min(0).max(150),
  address: addressSchema,
  city: Joi.string().trim().min(1).max(80),
  state: Joi.string().trim().min(1).max(80),
  pinCode: Joi.string().pattern(/^[0-9]{6}$/).message('pinCode must be 6 digits'),
  phoneNo: Joi.string().trim().pattern(/^[0-9]{6,15}$/).allow(''),
  mobileNo: Joi.string().pattern(/^[0-9]{10}$/).message('mobileNo must be 10 digits'),
  physicalDisability: Joi.string().trim().allow('').max(255),
  maritalStatus: Joi.string().valid(...Person.MARITAL_STATUSES),
  educationStatus: Joi.string().valid(...Person.EDUCATION_STATUSES),
  birthSign: Joi.string().valid(...Person.BIRTH_SIGNS),
  ownerUserId: Joi.string().hex().length(24)
};

const createPersonSchema = Joi.object({
  firstName: baseFields.firstName.required(),
  middleName: baseFields.middleName.optional().default(''),
  lastName: baseFields.lastName.required(),
  gender: baseFields.gender.required(),
  dateOfBirth: baseFields.dateOfBirth.required(),
  age: baseFields.age.required(),
  address: addressSchema.required(),
  city: baseFields.city.required(),
  state: baseFields.state.required(),
  pinCode: baseFields.pinCode.required(),
  phoneNo: baseFields.phoneNo.optional().default(''),
  mobileNo: baseFields.mobileNo.required(),
  physicalDisability: baseFields.physicalDisability.optional().default(''),
  maritalStatus: baseFields.maritalStatus.required(),
  educationStatus: baseFields.educationStatus.required(),
  birthSign: baseFields.birthSign.optional().default('None'),
  ownerUserId: baseFields.ownerUserId.optional()
});

const updatePersonSchema = Joi.object({
  firstName: baseFields.firstName,
  middleName: baseFields.middleName,
  lastName: baseFields.lastName,
  gender: baseFields.gender,
  dateOfBirth: baseFields.dateOfBirth,
  age: baseFields.age,
  address: addressSchema,
  city: baseFields.city,
  state: baseFields.state,
  pinCode: baseFields.pinCode,
  phoneNo: baseFields.phoneNo,
  mobileNo: baseFields.mobileNo,
  physicalDisability: baseFields.physicalDisability,
  maritalStatus: baseFields.maritalStatus,
  educationStatus: baseFields.educationStatus,
  birthSign: baseFields.birthSign
}).min(1);

module.exports = { createPersonSchema, updatePersonSchema };
