'use strict';

const { connect, disconnect } = require('../src/config/db');
const Role = require('../src/models/Role');

const ROLES = [
  { roleName: 'Administrator', description: 'Full system access' },
  { roleName: 'Operator', description: 'Can create and update person records (subject to admin approval)' },
  { roleName: 'Access User', description: 'Can view and request updates to their own information' }
];

async function run() {
  await connect();
  for (const r of ROLES) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await Role.findOne({ roleName: r.roleName });
    if (existing) {
      // eslint-disable-next-line no-console
      console.log(`Role already exists: ${r.roleName}`);
    } else {
      // eslint-disable-next-line no-await-in-loop
      await Role.create(r);
      // eslint-disable-next-line no-console
      console.log(`Created role: ${r.roleName}`);
    }
  }
  await disconnect();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
