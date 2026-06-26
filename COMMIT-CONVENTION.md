# Commit Convention

This project follows the **Conventional Commits** specification to keep the Git history clean, consistent, and easy to understand.

## Commit Format

```text
<type>: <description>
```

### Examples

```bash
feat: add user registration endpoint
fix: resolve CORS issue in API middleware
docs: update README with Docker setup
style: format code using Biome
refactor: simplify authentication middleware
test: add unit tests for auth service
chore: update project dependencies
perf: improve database query performance
ci: update GitHub Actions workflow
build: configure production build
revert: revert previous authentication changes
```

---

## Commit Types

| Type | Description |
|------|-------------|
| `feat` | Add a new feature |
| `fix` | Fix a bug |
| `docs` | Documentation changes |
| `style` | Formatting or style changes (no logic changes) |
| `refactor` | Refactor existing code without changing behavior |
| `test` | Add or update tests |
| `perf` | Performance improvements |
| `build` | Build system or dependency changes |
| `ci` | CI/CD configuration changes |
| `chore` | Maintenance tasks or tooling updates |
| `revert` | Revert a previous commit |

---

## Best Practices

- Use the imperative mood.
- Keep the subject line short and descriptive.
- Limit the subject line to **100 characters**.
- Make one logical change per commit.
- Avoid generic commit messages.

### ✅ Good

```bash
feat: add email verification endpoint
fix: prevent duplicate user registration
docs: update installation guide
refactor: extract JWT helper functions
```

### ❌ Bad

```bash
fix: bug
update
changes
work
final
misc
```

---

## Automatic Validation

Git hooks are configured using **Husky**.

### Pre-commit

Before every commit, the project automatically runs **lint-staged** to:

- Format staged files
- Run code quality checks
- Prevent improperly formatted code from being committed

If any check fails, the commit is aborted until the issues are resolved.

### Commit Message Validation

After the pre-commit hook succeeds, **Commitlint** validates your commit message against the Conventional Commits specification.

If the message is invalid, the commit is rejected.

---

## Need Help?

If your commit is rejected, follow one of the examples above or refer to this guide before committing again.