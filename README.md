# Backend Starter

> A production-ready Express.js backend starter built with TypeScript, PostgreSQL, Prisma, JWT authentication, CSRF protection, email verification, 2FA, and role-based authorization.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)
![Express](https://img.shields.io/badge/Express-5.x-000000)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![License](https://img.shields.io/badge/license-ISC-blue)

---

## Why Backend Starter?

Backend Starter provides a secure and scalable foundation for building production-ready REST APIs. It includes authentication, authorization, CSRF protection, email verification, two-factor authentication, and user management out of the box, allowing you to focus on building your application's business logic instead of repetitive infrastructure.

---

## Table of Contents

* [Features](#features)
* [Tech Stack](#tech-stack)
* [Project Structure](#project-structure)
* [Requirements](#requirements)
* [Quick Start](#quick-start)
* [Available Scripts](#available-scripts)
* [Development Workflow](#development-workflow)
* [Environment Variables](#environment-variables)
* [Authentication Flow](#authentication-flow)
* [API Modules](#api-modules)
* [Security](#security)
* [Postman Collection](#postman-collection)
* [Production](#production)
* [Roadmap](#roadmap)
* [Contributing](#contributing)
* [License](#license)
* [Acknowledgements](#acknowledgements)

---

# Features

## Authentication

* Email & password authentication
* JWT access & refresh tokens
* HTTP-only secure cookies
* Email verification
* Two-factor authentication (2FA)
* Password reset
* Email change
* Change password

## Security

* CSRF protection
* Helmet
* Express Rate Limit
* Secure cookie configuration
* Input validation using Zod
* Password hashing with bcrypt
* Refresh token rotation

## User Management

* User registration
* Profile management
* Device session management
* Account deletion workflow
* Login history

## Admin

* User management
* Role management
* Account status management
* Login history

## Developer Experience

* TypeScript
* Prisma ORM
* Path aliases
* Biome formatting & linting
* Husky Git hooks
* Environment example generator
* Postman collection included

---

# Tech Stack

| Layer          | Technology                            |
| -------------- | ------------------------------------- |
| Runtime        | Node.js                               |
| Framework      | Express.js 5                          |
| Language       | TypeScript                            |
| Database       | PostgreSQL                            |
| ORM            | Prisma                                |
| Authentication | JWT                                   |
| Validation     | Zod                                   |
| Email          | Nodemailer                            |
| Security       | Helmet, CSRF-CSRF, Express Rate Limit |

---

# Project Structure

```text
backend-starter/
├── .husky/                  # Git hooks
├── .vscode/                 # VS Code settings
├── generated/               # Generated files
├── prisma/
│   ├── migrations/          # Database migrations
│   └── schema.prisma        # Prisma schema
├── scripts/
│   └── generate-env-example.ts
├── src/
│   ├── config/              # Environment & application configuration
│   ├── errors/              # Custom error classes
│   ├── middlewares/         # Express middlewares
│   ├── modules/             # Feature modules
│   │   ├── auth/
│   │   ├── user/
│   │   └── ...
│   ├── schemas/             # Zod validation schemas
│   ├── types/               # Shared TypeScript types
│   ├── utils/               # Helper utilities
│   ├── app.ts               # Application entry point
│   └── appFactory.ts        # Express app configuration
├── .env
├── .env.example
├── biome.json
├── commitlint.config.cjs
├── package.json
├── prisma.config.ts
├── tsconfig.json
├── COMMIT_CONVENTION.md
├── CONTRIBUTING.md
└── README.md
```

---

# Requirements

* Node.js 18+
* PostgreSQL
* npm

---

# Quick Start

## 1. Clone

```bash
git clone https://github.com/yourusername/backend-starter.git

cd backend-starter
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment

Create your local environment file.

```bash
cp .env.example .env
```

Update all required environment variables.

### Maintaining `.env.example`

After adding or modifying environment variables, regenerate `.env.example` from your local `.env`.

```bash
npm run env:example
```

> This command is intended for project maintainers to keep `.env.example` synchronized with `.env`.

## 4. Setup Database

```bash
npx prisma migrate dev

npx prisma generate
```

## 5. Start Development Server

```bash
npm run dev
```

The server will be available at:

```text
http://localhost:8000
```

Verify the installation:

```http
GET /health
```

---

# Available Scripts

| Command               | Description                                  |
| --------------------- | -------------------------------------------- |
| `npm run dev`         | Start the development server with hot reload |
| `npm run build`       | Build the project                            |
| `npm start`           | Start the production server                  |
| `npm run env:example` | Generate `.env.example` from `.env`          |

---

# Development Workflow

```text
Clone Repository
        │
        ▼
Configure .env
        │
        ▼
Run Database Migrations
        │
        ▼
Start Development Server
        │
        ▼
Develop Features
        │
        ▼
Pre-commit Checks
        │
        ▼
Commitlint Validation
        │
        ▼
Push Changes
```

---

# Environment Variables

Minimum required configuration:

```env
NODE_ENV=development

PORT=8000

DATABASE_URL=

JWT_ACCESS_SECRET=

JWT_REFRESH_SECRET=

SMTP_HOST=

SMTP_PORT=

SMTP_USER=

SMTP_PASS=
```

See `.env.example` for the complete list of supported variables.

---

# Authentication Flow

```text
Get CSRF Token
        │
        ▼
Register User
        │
        ▼
Verify Email
        │
        ▼
Sign In
        │
        ▼
2FA Verification
        │
        ▼
Authenticated Requests
```

---

# API Modules

| Module         | Description                  |
| -------------- | ---------------------------- |
| Authentication | Login, Logout, Refresh Token |
| Users          | Registration & Profile       |
| Devices        | Device Sessions              |
| Admin          | User Administration          |
| Health         | Health Check                 |

Complete API documentation and ready-to-use requests are available in the included Postman collection.

---

# Security

* JWT Authentication
* HTTP-only Cookies
* CSRF Protection
* Helmet Security Headers
* Express Rate Limiting
* Password Hashing with bcrypt
* Zod Request Validation
* Refresh Token Rotation

---

# Postman Collection

A complete Postman collection is included for testing the API.

Features:

* Authentication flow
* Automatic CSRF token handling
* Cookie management
* Device verification (2FA)
* User management
* Admin endpoints
* Environment variables

Import:

```text
Backend Starter.postman_collection.json
```

---

# Production

Build and start the application.

```bash
npm run build
npm start
```

---

# Roadmap

* [ ] OAuth Authentication
* [ ] Google Login
* [ ] GitHub Login
* [ ] Redis Support
* [ ] Docker Compose
* [ ] Swagger / OpenAPI
* [ ] Background Jobs
* [ ] File Upload Module

---

# Contributing

Contributions are welcome.

Before opening a pull request, please read:

* `CONTRIBUTING.md`
* `COMMIT_CONVENTION.md`

These documents explain the development workflow, coding standards, and commit message conventions.

---

# License

This project is licensed under the ISC License.

See the `LICENSE` file for details.

---

# Acknowledgements

* Express.js
* Prisma
* TypeScript
* PostgreSQL
* Zod
* Biome
