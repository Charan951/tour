---
description: Seed the MongoDB database
---

From the repo root:

```bash
npm run seed
```

Runs `server/src/seed/seedData.ts` via tsx. Requires `server/.env` with a valid
`MONGODB_URI`. This overwrites seed collections — confirm with the user before
running against any non-local database.
