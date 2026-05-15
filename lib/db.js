import { Pool } from 'pg';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const connectionString = process.env.DATABASE_URL;
const hasDatabase = Boolean(connectionString);

const localDataDir = hasDatabase
  ? null
  : (process.env.NODE_ENV === 'production'
      ? path.join(os.tmpdir(), 'soft-eng-data')
      : path.join(process.cwd(), '.data'));

const booksFile = localDataDir ? path.join(localDataDir, 'books.json') : null;
const usersFile = localDataDir ? path.join(localDataDir, 'authorized_users.json') : null;
const borrowingsFile = localDataDir ? path.join(localDataDir, 'borrowings.json') : null;

const ensureLocalFiles = async () => {
  if (!localDataDir) return;
  await fs.mkdir(localDataDir, { recursive: true });
  const files = [booksFile, usersFile, borrowingsFile];
  await Promise.all(files.map(async (file) => {
    try {
      await fs.access(file);
    } catch {
      await fs.writeFile(file, '[]', 'utf8');
    }
  }));
};

const readJson = async (file) => {
  const content = await fs.readFile(file, 'utf8');
  return content ? JSON.parse(content) : [];
};

const writeJson = async (file, data) => {
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
};

const normalizeSql = (sql) => sql.replace(/\s+/g, ' ').trim();
const todayIso = () => new Date().toISOString().slice(0, 10);
const parseDate = (value) => new Date(value);

const localQuery = async (sql, params = []) => {
  await ensureLocalFiles();
  const normalized = normalizeSql(sql);

  if (normalized === 'BEGIN' || normalized === 'COMMIT' || normalized === 'ROLLBACK') {
    return { rows: [] };
  }

  if (normalized === 'SELECT * FROM books ORDER BY id ASC') {
    const books = await readJson(booksFile);
    return { rows: books.sort((a, b) => String(a.id).localeCompare(String(b.id))) };
  }

  if (normalized === 'DELETE FROM books WHERE id = $1') {
    const [bookId] = params;
    const books = await readJson(booksFile);
    const filtered = books.filter(book => String(book.id) !== String(bookId));
    await writeJson(booksFile, filtered);
    return { rows: [] };
  }

  if (normalized === 'SELECT available_copies FROM books WHERE id = $1') {
    const [bookId] = params;
    const books = await readJson(booksFile);
    const book = books.find(book => String(book.id) === String(bookId));
    return { rows: book ? [{ available_copies: book.available_copies }] : [] };
  }

  if (normalized === 'INSERT INTO books (id, title, author, available_copies) VALUES ($1, $2, $3, $4)') {
    const [bookId, title, author, copies] = params;
    const books = await readJson(booksFile);
    const newBook = {
      id: bookId,
      title,
      author,
      available_copies: Number(copies)
    };
    books.push(newBook);
    await writeJson(booksFile, books);
    return { rows: [newBook] };
  }

  if (normalized === 'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1') {
    const [bookId] = params;
    const books = await readJson(booksFile);
    const book = books.find(book => String(book.id) === String(bookId));
    if (book) {
      book.available_copies = Number(book.available_copies) - 1;
      await writeJson(booksFile, books);
    }
    return { rows: [] };
  }

  if (normalized === 'UPDATE books SET available_copies = available_copies + 1 WHERE id = $1') {
    const [bookId] = params;
    const books = await readJson(booksFile);
    const book = books.find(book => String(book.id) === String(bookId));
    if (book) {
      book.available_copies = Number(book.available_copies) + 1;
      await writeJson(booksFile, books);
    }
    return { rows: [] };
  }

  if (normalized === "INSERT INTO borrowings (book_id, user_email, due_date) VALUES ($1, $2, CURRENT_DATE + INTERVAL '7 days')") {
    const [bookId, userEmail] = params;
    const borrowings = await readJson(borrowingsFile);
    const newBorrow = {
      id: Date.now(),
      book_id: bookId,
      user_email: userEmail,
      status: 'on-hand',
      issue_date: todayIso(),
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    };
    borrowings.push(newBorrow);
    await writeJson(borrowingsFile, borrowings);
    return { rows: [newBorrow] };
  }

  if (normalized === 'SELECT * FROM borrowings WHERE user_email = $1 ORDER BY issue_date DESC') {
    const [email] = params;
    const borrowings = await readJson(borrowingsFile);
    const rows = borrowings
      .filter(b => b.user_email === email)
      .sort((a, b) => b.issue_date.localeCompare(a.issue_date));
    return { rows };
  }

  if (normalized === "SELECT id, user_email, book_id, due_date, EXTRACT(DAY FROM CURRENT_DATE - due_date) AS days_late FROM borrowings WHERE status = $1 AND due_date < CURRENT_DATE ORDER BY due_date ASC") {
    const [status] = params;
    const borrowings = await readJson(borrowingsFile);
    const now = new Date(todayIso());
    const rows = borrowings
      .filter(b => b.status === status && new Date(b.due_date) < now)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .map(b => ({
        id: b.id,
        user_email: b.user_email,
        book_id: b.book_id,
        due_date: b.due_date,
        days_late: Math.max(0, Math.floor((now - new Date(b.due_date)) / 86400000))
      }));
    return { rows };
  }

  if (normalized === 'SELECT email FROM authorized_users WHERE username = $1') {
    const [username] = params;
    const users = await readJson(usersFile);
    const user = users.find(user => user.username === username);
    return { rows: user ? [{ email: user.email }] : [] };
  }

  if (normalized === 'SELECT * FROM authorized_users WHERE username = $1') {
    const [username] = params;
    const users = await readJson(usersFile);
    const user = users.find(user => user.username === username);
    return { rows: user ? [user] : [] };
  }

  if (normalized.startsWith('INSERT INTO authorized_users')) {
    const [, name, email, username, password, role] = params;
    const users = await readJson(usersFile);
    const newUser = {
      id: Date.now(),
      name,
      email,
      username,
      password,
      role
    };
    users.push(newUser);
    await writeJson(usersFile, users);
    return { rows: [newUser] };
  }

  if (normalized === 'SELECT COUNT(*) FROM books') {
    const books = await readJson(booksFile);
    return { rows: [{ count: String(books.length) }] };
  }

  if (normalized === 'SELECT COUNT(*) FROM borrowings WHERE status = $1') {
    const [status] = params;
    const borrowings = await readJson(borrowingsFile);
    return { rows: [{ count: String(borrowings.filter(b => b.status === status).length) }] };
  }

  if (normalized === 'SELECT COUNT(*) FROM authorized_users WHERE role = $1') {
    const [role] = params;
    const users = await readJson(usersFile);
    return { rows: [{ count: String(users.filter(u => u.role === role).length) }] };
  }

  if (normalized === 'SELECT * FROM borrowings ORDER BY issue_date DESC LIMIT 10') {
    const borrowings = await readJson(borrowingsFile);
    const rows = borrowings
      .slice()
      .sort((a, b) => b.issue_date.localeCompare(a.issue_date))
      .slice(0, 10);
    return { rows };
  }

  if (normalized === 'UPDATE borrowings SET status = $1 WHERE id = $2') {
    const [status, borrowId] = params;
    const borrowings = await readJson(borrowingsFile);
    const borrow = borrowings.find(b => String(b.id) === String(borrowId));
    if (borrow) {
      borrow.status = status;
      await writeJson(borrowingsFile, borrowings);
    }
    return { rows: [] };
  }

  throw new Error(`Unsupported local DB query: ${normalized}`);
};

let pool;

const getPool = () => {
  if (pool) return pool;

  if (!connectionString) {
    pool = {
      query: localQuery,
      connect: async () => null,
      end: async () => null
    };
    return pool;
  }

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  return pool;
};

const db = {
  query: (...args) => getPool().query(...args),
  connect: (...args) => getPool().connect(...args),
  end: (...args) => getPool().end(...args)
};

export default db;