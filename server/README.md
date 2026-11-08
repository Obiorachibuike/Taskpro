# TaskPro sync API

Optional authenticated Express/PostgreSQL service. Run `createdb taskpro`, copy `.env.example` to `.env`, then `npm run server:dev`. The service applies `schema.sql` on startup.

Push operations are idempotent by operation UUID and are processed in database transactions. User ownership comes only from the verified JWT, never from the query string. Stale writes receive HTTP 409; the mobile client retains local changes for conflict handling. Pull uses an updated-at cursor and includes tombstones.

Password reset requires a deployment email-delivery hook; the endpoint intentionally returns an enumeration-safe response and does not claim to send email itself.
