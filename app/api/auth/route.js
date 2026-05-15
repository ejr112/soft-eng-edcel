import pool from '../../../lib/db';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const useLocalAuth = !process.env.DATABASE_URL;
const dataDir = useLocalAuth
  ? (process.env.NODE_ENV === 'production'
      ? path.join(os.tmpdir(), 'soft-eng-auth')
      : path.join(process.cwd(), '.data'))
  : null;
const usersFile = useLocalAuth ? path.join(dataDir, 'authorized_users.json') : null;

const ensureUsersFile = async () => {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(usersFile);
  } catch {
    await fs.writeFile(usersFile, JSON.stringify([], null, 2), 'utf8');
  }
};

const readLocalUsers = async () => {
  await ensureUsersFile();
  const content = await fs.readFile(usersFile, 'utf8');
  return content ? JSON.parse(content) : [];
};

const writeLocalUsers = async (users) => {
  await ensureUsersFile();
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf8');
};

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password, email, name, mode } = body;

    if (username === 'admin@isu.com' && password === 'adminpassword123') {
      return Response.json({
        role: 'admin',
        user: { name: 'Admin User', email: 'admin@isu.com' }
      });
    }

    if (mode === 'signup') {
      if (!name || !email || !username || !password) {
        return Response.json({ error: 'All fields are required' }, { status: 400 });
      }

      if (useLocalAuth) {
        const users = await readLocalUsers();
        if (users.some(user => user.username === username)) {
          return Response.json({ error: 'User already exists' }, { status: 409 });
        }

        const newUser = {
          id: Date.now(),
          name,
          email,
          username,
          password,
          role: 'student'
        };

        users.push(newUser);
        await writeLocalUsers(users);

        return Response.json({ role: 'student', user: newUser });
      }

      const result = await pool.query(
        'INSERT INTO authorized_users (name, email, username, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, email, username, password, 'student']
      );

      return Response.json({ role: 'student', user: result.rows[0] });
    }

    if (useLocalAuth) {
      const users = await readLocalUsers();
      const foundUser = users.find(user => user.username === username);

      if (!foundUser) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      if (foundUser.password !== password) {
        return Response.json({ error: 'Invalid Password' }, { status: 401 });
      }

      return Response.json({ role: foundUser.role, user: foundUser });
    }

    const userCheck = await pool.query(
      'SELECT * FROM authorized_users WHERE username = $1',
      [username]
    );

    if (userCheck.rows.length > 0) {
      if (userCheck.rows[0].password === password) {
        return Response.json({
          role: userCheck.rows[0].role,
          user: userCheck.rows[0]
        });
      }
      return Response.json({ error: 'Invalid Password' }, { status: 401 });
    }

    return Response.json({ error: 'User not found' }, { status: 404 });
  } catch (err) {
    console.error('AUTH ERROR:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}