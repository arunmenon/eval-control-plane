## ADR-0013: Database backend – SQLite for local development

**Status:** Accepted

### Context

The platform is designed around a relational database with JSON-heavy fields (artifacts, results, overrides).
PostgreSQL is a strong fit for production, but it introduces setup friction for local development and evaluation demos.
We want a lightweight, file-based database for local use that works well with Prisma and can be swapped for PostgreSQL later.

### Decision

- For local development and initial demos, we will use **SQLite** via Prisma:
  - `datasource db.provider = "sqlite"`.
  - `DATABASE_URL` will typically be `file:./dev.db` for local usage.
- Because Prisma's SQLite connector does not support the `Json` type, we will:
  - store JSON-like data (e.g., tags, evaluation_splits, overrides, configs, artifacts) as `String` columns containing JSON-encoded values,
  - keep the JSON structure consistent so we can migrate these columns to native `Json` or array types in PostgreSQL later if needed.
- For production, we retain the option to:
  - introduce a separate Prisma datasource with `provider = "postgresql"`, or
  - migrate the SQLite schema to PostgreSQL using Prisma migrations and data export/import.

### Consequences

- (+) Local setup is simple (no Postgres dependency; a single SQLite file).
- (+) Prisma continues to provide a single schema/model layer across environments.
- (+) We can run the API and UI quickly for demos without additional infrastructure.
- (-) Some PostgreSQL-specific features (native arrays, native Json, advanced indexing) are not used in the initial schema.
- (-) A later migration to PostgreSQL will require data migration and possibly schema adjustments, but the use of JSON-encoded strings keeps the logical structure intact.
