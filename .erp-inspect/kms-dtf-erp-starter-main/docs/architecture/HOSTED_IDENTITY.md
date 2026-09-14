# Hosted Identity and Tenant Boundary

## Purpose

The desktop schema has global users and roles. The hosted ERP introduces an
organization boundary without invalidating existing user IDs, password hashes,
role assignments, or audit references.

## Schema

- `organizations` identifies a company boundary using an internal integer key and
  an external UUID-shaped `public_id`.
- `organization_memberships` links a user to an organization and records active,
  invited, or disabled status.
- `membership_roles` applies existing permission-bearing roles within one
  membership. Legacy `user_roles` remains available to the desktop runtime during
  migration but must not authorize web requests.
- `authentication_identities` links one hosted provider subject to one local user.
- `web_sessions` stores only SHA-256 token hashes, expiry, revocation, organization,
  IP, and user-agent context. Raw session secrets must exist only in secure cookies.
- `password_reset_tokens` stores only single-use token hashes.
- `authentication_throttles` stores only a hash of the attempted username/IP key
  and enforces failed-login windows across processes and server restarts.
- `audit_records` gains organization, request, IP, and user-agent context.

## Authorization invariant

Every authenticated web request must resolve this chain before business data is
read or changed:

```text
session -> active user -> active membership -> organization -> membership roles
        -> role permissions
```

The organization is derived from the validated session. It must never be trusted
from a browser-supplied request body or query parameter.

## Migration approach

1. Apply the schema migration to an empty PostgreSQL staging database.
2. Create one organization for the current KMS business.
3. Import existing users while preserving integer IDs and password hashes.
4. Create one active membership per imported user.
5. Copy each legacy `user_roles` assignment into `membership_roles`.
6. Import business tables only after organization columns and API filters exist.
7. Reconcile users, roles, permissions, memberships, and audit counts.
8. Require a password reset or verified login before issuing the first web session.

No hosted identity migration is permitted to modify the source SQLite file.

## PostgreSQL safety

- Use a dedicated application database role without schema-owner privileges.
- Run Alembic migrations using a separate deployment credential.
- Keep the database on Render's private network with the API in the same region.
- Enforce TLS for any external database connection.
- Back up before every production migration and test restore procedures regularly.
