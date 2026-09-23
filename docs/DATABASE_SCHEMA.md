# VedAI Prototype Data Schema

The current repository uses a local JSON data store at `backend/data/vedai-db.json`. This is real local persistence for the prototype and is intentionally gitignored. It is not the final production database.

## Collections

### users

- `id`
- `name`
- `email`
- `role`
- `preferences`
- `passwordSalt`
- `passwordHash`
- `createdAt`
- `updatedAt`

### emotionHistory

- `id`
- `userId`
- `userText`
- `emotion`
- `confidence`
- `probabilities`
- `guidance`
- `recommendations`
- `safety`
- `createdAt`

### journalEntries

- `id`
- `userId`
- `title`
- `content`
- `emotion`
- `createdAt`
- `updatedAt`

## Migration Target

The next database phase should move these collections into PostgreSQL tables with foreign keys, timestamp indexes, and later pgvector-backed knowledge tables for RAG.
