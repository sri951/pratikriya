# Security Policy

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, report privately via GitHub's "Report a vulnerability" feature (Security tab → Advisories). Include:

- A description of the vulnerability and its impact
- Steps to reproduce / proof of concept
- Affected routes, tables, or functions

We aim to acknowledge reports within 72 hours.

## Security Model

- **Row-Level Security (RLS)** is enabled on every database table. Users can only access rows they own; policies are enforced server-side by Postgres, not in client code.
- **Authentication** is handled by Supabase Auth (email + Google OAuth). Server functions verify the caller's JWT via middleware before any data access.
- **Secrets** (AI gateway keys, service keys) live only in server-side environment variables and are never shipped to the browser bundle.
- **Role checks** are always performed server-side through security-definer functions — never via client-side storage.
- **AI inputs** are validated with Zod schemas; file uploads are size-limited and processed in-memory.

## Scope Notes

- The AI-generated content is educational material, not professional advice.
- Uploaded images/documents are sent to the AI provider for analysis; do not upload sensitive personal documents.
