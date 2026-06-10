# Flagger - Feature Flag Manager API

## Description

Flagger is a lightweight, production-ready REST API for managing feature flags, built with raw Node.js. Control what your users see without touching your codebase. Flagger lets you create, toggle, and manage feature flags across environments. Flip a flag and a feature goes live, no redeployment needed. Every change is logged in a full audit trail so you always know what changed, when, and by whom.

## Features

- Feature flag CRUD across environments (`development`, `staging`, `production`)
- Toggle flags on/off instantly
- Public flags visible to anonymous users
- JWT authentication with token blacklisting on logout
- Role-based access: admin sees everything, users manage their own flags
- Full audit log: every change tracked with old and new values
- Health endpoint with system stats
- Raw Node.js `http` module

## [Demo](https://flagger-823039407907.us-central1.run.app)

## Technologies & Dependencies

- **Runtime** : Node.js v20+
- **Database** : MySQL 8.0 (Cloud SQL on Google Cloud)
- **Auth** : `jsonwebtoken` + `bcrypt`
- **DB Driver** : `mysql2`

## Endpoints

### Auth

| Method | Route            | Access | Description                   |
| ------ | ---------------- | ------ | ----------------------------- |
| POST   | `/auth/register` | Public | Create an account             |
| POST   | `/auth/login`    | Public | Login and receive a JWT token |
| POST   | `/auth/logout`   | Auth   | Invalidate current token      |

### Feature Flags

| Method | Route               | Access   | Description                                                            |
| ------ | ------------------- | -------- | ---------------------------------------------------------------------- |
| GET    | `/flags`            | Optional | List flags, anonymous sees public, users see own flags, admin sees all |
| GET    | `/flags/:id`        | Optional | Get a single flag by ID                                                |
| POST   | `/flags`            | Auth     | Create a flag                                                          |
| PUT    | `/flags/:id`        | Auth     | Update flag metadata                                                   |
| PATCH  | `/flags/:id/toggle` | Auth     | Toggle enabled state on/off                                            |
| DELETE | `/flags/:id`        | Auth     | Delete a flag                                                          |

### Audit Log

| Method | Route          | Access | Description           |
| ------ | -------------- | ------ | --------------------- |
| GET    | `/audit`       | Auth   | Your own audit log    |
| GET    | `/audit/users` | Admin  | All users' audit logs |

### Account & Users

| Method | Route        | Access | Description                         |
| ------ | ------------ | ------ | ----------------------------------- |
| GET    | `/users`     | Admin  | List all users with flag counts     |
| GET    | `/users/:id` | Admin  | Get a specific user by ID           |
| GET    | `/account`   | Auth   | Get your own profile                |
| PUT    | `/account`   | Auth   | Update your name, email or password |
| DELETE | `/account`   | Auth   | Delete your own account             |
| DELETE | `/users/:id` | Admin  | Delete a user by ID                 |

### System

| Method | Route     | Access   | Description                                        |
| ------ | --------- | -------- | -------------------------------------------------- |
| GET    | `/health` | Optional | API and DB status, returns system stats for admins |

## Flag Visibility

| User      | Sees                     |
| --------- | ------------------------ |
| Anonymous | Public flags only        |
| Logged in | Own flags                |
| Admin     | All flags from all users |

## Authentication

Flagger uses **JWT + token blacklist** authentication.

1. Register or login to receive a token
2. Pass the token in the `Authorization` header on every protected request:

```
Authorization: Bearer your.jwt.token
```

3. On logout the token is immediately blacklisted and it can't be reused even before expiry

Tokens expire after **12 hours**.

## Security

- Passwords hashed with **bcrypt**
- All SQL queries use **parameterized placeholders**, protected against SQL injection
- JWT tokens **blacklisted on logout**, immediate invalidation
- Input validation on all write endpoints
- Passwords and sensitive fields never returned in API responses

## Getting Started

Follow the steps below to run the project locally.

### 1. Clone the repository

```bash
git clone https://github.com/Balteanu-Sara/flag-manager.git
cd flag-manager
```

### 2. Install dependencies

Make sure you have Node.js v20+ and MySQL 8.0 installed.

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=feature_flags
JWT_SECRET_KEY=your-random-secret
PORT=8000
```

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Run the migration

Create the database and all tables:

```bash
node src/config/migrateSchema.js
```

### 5. Seed default data (optional)

Insert a set of public flags and logs:

```bash
node src/config/default.js
```

### 6. Start the development server

```bash
npm run dev
```

The API will run at: **http://localhost:8000**
