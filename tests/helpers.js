'use strict';

const Role = require('../src/models/Role');
const User = require('../src/models/User');
const Person = require('../src/models/Person');
const { signToken } = require('../src/middleware/auth');

async function seedRoles() {
  const names = ['Administrator', 'Operator', 'Access User'];
  const roles = {};
  for (const roleName of names) {
    // eslint-disable-next-line no-await-in-loop
    let role = await Role.findOne({ roleName });
    if (!role) {
      // eslint-disable-next-line no-await-in-loop
      role = await Role.create({ roleName });
    }
    roles[roleName] = role;
  }
  return roles;
}

async function makeUser({ username, email, password = 'Password@123', roleName }) {
  const role = await Role.findOne({ roleName });
  if (!role) throw new Error(`Role ${roleName} not seeded`);
  const user = await User.create({
    username,
    email: email || `${username}@example.com`,
    password,
    roleId: role._id
  });
  return { user, role };
}

function tokenFor(user, roleName) {
  return signToken({
    userId: user._id.toString(),
    username: user.username,
    roleName
  });
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

function samplePersonPayload(overrides = {}) {
  return {
    firstName: 'Asha',
    middleName: 'Rao',
    lastName: 'Kulkarni',
    gender: 'Female',
    dateOfBirth: '1990-05-12',
    age: 35,
    address: {
      flatNumber: 'A-101',
      societyName: 'Sunshine Apartments',
      streetOrArea: 'MG Road'
    },
    city: 'Pune',
    state: 'Maharashtra',
    pinCode: '411001',
    phoneNo: '02012345678',
    mobileNo: '9876543210',
    physicalDisability: '',
    maritalStatus: 'Married',
    educationStatus: 'Masters',
    birthSign: 'Taurus',
    ...overrides
  };
}

async function makePerson(overrides = {}) {
  return Person.create({
    ...samplePersonPayload(),
    personalUniqueId: '111122223333',
    ...overrides
  });
}

module.exports = {
  seedRoles,
  makeUser,
  tokenFor,
  authHeader,
  samplePersonPayload,
  makePerson
};
