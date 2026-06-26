# Contributing Guide

Thank you for your interest in contributing to Backend Starter.

Whether you're fixing a bug, improving documentation, or adding a new feature, your contribution is appreciated.

---

# Before You Start

Before opening an issue or pull request:

- Search existing issues and pull requests.
- Open an issue before implementing large features or breaking changes.
- Keep pull requests focused on a single change.

---

# Development Setup

## 1. Fork the Repository

Fork the repository and clone your fork.

```bash
git clone https://github.com/<your-username>/backend-starter.git

cd backend-starter
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment

Copy the example environment file.

```bash
cp .env.example .env
```

Update the required environment variables.

---

## 4. Setup Database

```bash
npx prisma migrate dev

npx prisma generate
```

---

## 5. Start the Development Server

```bash
npm run dev
```

---

# Branch Naming

Create a dedicated branch for every feature or fix.

Examples:

```text
feature/email-verification
feature/oauth-login
fix/jwt-refresh
fix/csrf-validation
docs/readme-update
refactor/auth-service
```

---

# Coding Standards

Please follow the existing code style throughout the project.

- Write TypeScript.
- Keep functions small and focused.
- Use meaningful names.
- Follow the existing project structure.
- Reuse existing utilities whenever possible.
- Avoid unnecessary dependencies.
- Write maintainable and readable code.

---

# Code Quality

Git hooks automatically validate your code before every commit.

## Pre-commit

The pre-commit hook runs **lint-staged** to:

- Format staged files
- Run code quality checks

If any check fails, the commit is aborted.

## Commit Messages

The commit-msg hook validates commit messages using **Commitlint**.

See **COMMIT_CONVENTION.md** for the complete commit message guide.

---

# Development Workflow

```bash
# Create a branch
git checkout -b feature/my-feature

# Make your changes

# Stage files
git add .

# Commit
git commit -m "feat: add authentication middleware"

# Push
git push origin feature/my-feature
```

During every commit:

1. **pre-commit** runs `lint-staged`.
2. **commit-msg** validates the commit message.
3. If both checks pass, the commit is created.

---

# Pull Requests

Before opening a pull request, ensure that:

- [ ] Your branch is up to date.
- [ ] Your changes have been tested locally.
- [ ] Pre-commit checks pass successfully.
- [ ] Commit messages follow Conventional Commits.
- [ ] Documentation has been updated when necessary.
- [ ] The project builds successfully.

---

# Reporting Bugs

Please include:

- Project version
- Node.js version
- Operating system
- Steps to reproduce
- Expected behavior
- Actual behavior
- Relevant logs or screenshots

---

# Feature Requests

Feature requests are welcome.

Please include:

- The problem you're trying to solve
- Your proposed solution
- Alternative approaches you've considered

---

# Questions

If you have questions or need help, feel free to open an issue or start a discussion.

Happy coding! 🚀