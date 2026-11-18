import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Migrations and `prisma db push` need a direct (non-pooled) connection, so
// prefer DIRECT_URL when it is set. The app itself uses DATABASE_URL at runtime.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
