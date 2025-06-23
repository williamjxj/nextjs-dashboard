const postgres = require('postgres');

const pUrl = process.env.POSTGRES_URL || `postgres://postgres:William1!@localhost:5432/nextjs-dashboard-postgres`;

// Disable SSL for local connections
const sql = postgres(pUrl, { ssl: false });

async function testConnection() {
  try {
    await sql`SELECT 1`;
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

testConnection().finally(() => {
  sql.end();
})