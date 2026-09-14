# Web Authentication

## Implemented controls

- Passwords use the existing versioned scrypt password hasher and are never logged.
- Login errors do not reveal whether a username exists, is disabled, or lacks an
  organization membership.
- Repeated login failures are stored in a hashed, database-backed throttle window.
- Browser sessions use high-entropy opaque tokens. Only SHA-256 token hashes are
  stored in `web_sessions`.
- The session cookie is HTTP-only and SameSite=Lax. It is also Secure in production.
- State-changing authenticated routes require a matching CSRF cookie/header pair.
- Logout, password reset, and account disabling revoke server-side sessions.
- Password-reset tokens are random, hashed, expire after 30 minutes, and are
  single-use.
- Password-reset requests return the same response for existing and missing users.
- Every request derives its organization from the validated session and active
  membership; browser-supplied organization IDs are never trusted.
- Permissions come from `membership_roles -> roles -> permissions`, not legacy
  desktop `user_roles`.
- Account administration is restricted to users inside the administrator's current
  organization, and administrators cannot disable themselves.

## Endpoints

```text
POST  /api/v1/auth/login
GET   /api/v1/auth/me
POST  /api/v1/auth/logout
POST  /api/v1/auth/password-reset/request
POST  /api/v1/auth/password-reset/confirm
PATCH /api/v1/auth/users/{user_id}/status
```

## Password-reset delivery

The API emits reset material only to the configured server-side dispatcher. It is
never returned in an HTTP response or written to logs. Production deployment must
connect this dispatcher to a transactional email provider before password reset is
enabled for users.

## Remaining production controls

Step 8 will configure trusted proxy handling, production domain/cookie validation,
email delivery, centralized monitoring, secret rotation, TLS verification, backup
alerts, and deployment-level request limits.
