# Node.js Assignment - Person Information API

Production-style REST API using Node.js, Express, and MongoDB Atlas for Aadhaar-like person information management with:

- JWT authentication
- Role-based authorization (`Administrator`, `Operator`, `Access User`)
- Admin approval workflow for person create/update
- Dynamic search endpoint
- Automated test suite with 90%+ coverage threshold

## Features implemented

- Person Information schema with all requested fields
- Roles collection with required roles
- Users collection with role mapping and password hashing
- Login Status tracking on login attempts
- Auth endpoints (`register`, `login`) with JWT
- Role and user management endpoints
- Person create/update workflow via `change_requests`
- Admin approve/reject endpoints
- Single dynamic search endpoint (`/api/persons/search`)
- Validation for request payloads (`POST`/`PUT`)
- Unit + integration tests

## Tech stack

- Runtime: Node.js, Express, Mongoose, JWT, Joi, bcryptjs
- Security/middleware: Helmet, CORS, Morgan
- Testing: Jest, Supertest
- Database: MongoDB Atlas

## Prerequisites

- Node.js 18+ (recommended)
- npm 9+ (recommended)
- MongoDB Atlas cluster/database access

## Project setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`:

```bash
copy .env.example .env
```

3. Update environment values in `.env`.

## Environment variables

Use the following keys in `.env`:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://nodeuser:NodeAssignment%402026@nodejsassignment.qeezhkh.mongodb.net/node_assignment?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=1h
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@12345
```

Important:

- If password contains `@`, encode it as `%40` in `MONGODB_URI`.
- Never commit `.env`.

## Running the app

Development mode (auto-reload):

```bash
npm run dev
```

Production/start mode:

```bash
npm start
```

Health check:

```http
GET /health
```

Expected response:

```json
{ "status": "ok" }
```

## Seed data

Seed required roles and initial admin user:

```bash
npm run seed
```

This creates:

- `Administrator`
- `Operator`
- `Access User`
- Admin user from `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

## Authentication

### Register (public)

`POST /api/auth/register`

```json
{
  "username": "user1",
  "email": "user1@example.com",
  "password": "Password@123"
}
```

Notes:

- Registration always creates `Access User`.
- Any incoming role in register payload is ignored intentionally.

### Login

`POST /api/auth/login`

```json
{
  "username": "user1",
  "password": "Password@123",
  "loginForm": "web"
}
```

Response includes token:

```json
{
  "token": "<jwt-token>",
  "user": {
    "userId": "...",
    "username": "user1",
    "email": "user1@example.com",
    "roleName": "Access User"
  }
}
```

Use this header for protected APIs:

```http
Authorization: Bearer <jwt-token>
```

## Authorization matrix

- `Administrator`
  - Full access
  - Can approve/reject person change requests
  - Can manage roles/users
- `Operator`
  - Can submit person create/update
  - Can run search
- `Access User`
  - Can update only own person info (submitted for approval)
  - Can read/search only own person info

## API reference

Base path: `/api`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Roles (Admin only)

- `GET /api/roles`
- `POST /api/roles`

### Users (Admin only)

- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`

`POST /api/users` behavior:

- `roleName` optional
- defaults to `Access User`
- if role assignment fails, user creation fails (no partial creation)

### Persons

- `POST /api/persons` (Admin/Operator)
  - does not directly insert person
  - creates pending change request (`action=create`)
- `PUT /api/persons/:id` (Admin/Operator/Access User)
  - creates pending change request (`action=update`)
- `GET /api/persons/:id`
  - Admin/Operator: any person
  - Access User: own person only

### Change requests (Admin only)

- `GET /api/change-requests`
- `GET /api/change-requests?status=pending`
- `POST /api/change-requests/:id/approve`
- `POST /api/change-requests/:id/reject`

Approval rules:

- Approving `create`:
  - inserts person into `persons`
  - generates `personalUniqueId` (12-digit numeric)
- Approving `update`:
  - applies patch to target person
- Reject:
  - marks request rejected and does not alter person

### Search (single endpoint)

- `GET /api/persons/search`

Supported query examples:

- `?PersonName=Asha`
- `?City=Pune`
- `?State=Maharashtra`
- `?AgeGt=30&AgeLt=60`
- `?Age=35`
- `?Gender=Female`
- `?PinCode=411001`
- `?PersonalUniqueId=123456789012`
- pagination: `?limit=20&skip=0`

Access:

- Admin/Operator: all records
- Access User: auto-scoped to own record

## Person payload format

`POST /api/persons` expects:

```json
{
  "firstName": "Asha",
  "middleName": "Rao",
  "lastName": "Kulkarni",
  "gender": "Female",
  "dateOfBirth": "1990-05-12",
  "age": 35,
  "address": {
    "flatNumber": "A-101",
    "societyName": "Sunshine Apartments",
    "streetOrArea": "MG Road"
  },
  "city": "Pune",
  "state": "Maharashtra",
  "pinCode": "411001",
  "phoneNo": "02012345678",
  "mobileNo": "9876543210",
  "physicalDisability": "",
  "maritalStatus": "Married",
  "educationStatus": "Masters",
  "birthSign": "Taurus"
}
```

## Validation and error format

- Invalid request payloads return `400 Bad Request`.
- Typical error response:

```json
{
  "error": {
    "message": "Validation failed",
    "details": [
      { "path": "email", "message": "\"email\" must be a valid email" }
    ]
  }
}
```

## Running tests

Run all tests with coverage:

```bash
npm test
```

Current coverage target config is in `jest.config.js`:

- branches: 90
- functions: 90
- lines: 90
- statements: 90

## Current test result summary

Latest run:

- Statements: 97.23%
- Branches: 91.28%
- Functions: 95.23%
- Lines: 97.29%
- Tests: 103 passed

## Recommended local verification flow

1. `npm install`
2. Configure `.env`
3. `npm run seed`
4. `npm run dev`
5. Run auth, role, user, person, change-request, and search APIs
6. `npm test`

## Folder structure

```text
src/
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
  utils/
  validators/
  app.js
  server.js
seed/
tests/
```

## Troubleshooting

- `MongoDB URI parse/auth issue`:
  - ensure special chars in password are URL-encoded (`@` -> `%40`)
- `401 Unauthorized`:
  - check `Authorization: Bearer <token>` format
- `403 Forbidden`:
  - verify user role permissions
- `Role does not exist` while creating user:
  - run `npm run seed` first
- `Validation failed`:
  - verify required fields and enums in request payload

