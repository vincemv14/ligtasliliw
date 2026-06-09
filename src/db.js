import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const connectionString = import.meta.env.VITE_DATABASE_URL;

// Add the 'disableWarningInBrowsers: true' flag here
const sql = neon(connectionString, {
  disableWarningInBrowsers: true,
});

export const db = drizzle(sql);