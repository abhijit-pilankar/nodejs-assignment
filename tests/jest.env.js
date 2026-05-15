process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jest-only';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-key-for-jest-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.PORT = '0';
process.env.MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://nodeuser:NodeAssignment%402026@nodejsassignment.qeezhkh.mongodb.net/node_assignment?retryWrites=true&w=majority';
