'use strict';

const env = require('../src/config/env');
const { connect, disconnect } = require('../src/config/db');
const Role = require('../src/models/Role');
const User = require('../src/models/User');

async function run() {
  await connect();

  const adminRole = await Role.findOne({ roleName: 'Administrator' });
  if (!adminRole) {
    throw new Error('Administrator role does not exist. Run `npm run seed` (or seedRoles.js) first.');
  }

  const existing = await User.findOne({ username: env.admin.username });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`Admin user "${env.admin.username}" already exists.`);
  } else {
    await User.create({
      username: env.admin.username,
      email: env.admin.email,
      password: env.admin.password,
      roleId: adminRole._id
    });
    // eslint-disable-next-line no-console
    console.log(`Created admin user "${env.admin.username}".`);
  }

  await disconnect();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
