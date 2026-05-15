import { Pool } from 'pg';

let pool;
const connectionString = process.env.DATABASE_URL;

const getPool = () => {
  if (!pool) {
    if (!connectionString) {
      throw new Error('Missing DATABASE_URL. Create a .env.local file with DATABASE_URL=postgres://user:pass@localhost:5432/dbname');
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  return pool;
};

const db = {
  query: (...args) => getPool().query(...args),
  connect: (...args) => getPool().connect(...args),
  end: (...args) => getPool().end(...args)
};

export default db;