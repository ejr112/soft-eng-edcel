import pool from '../../../../lib/db';

export async function POST(req) {
  try {
    const { username, bookId } = await req.json();

    if (!username || !bookId) {
      return Response.json({ error: 'Username and Book ID are required' }, { status: 400 });
    }

    const userResult = await pool.query(
      'SELECT email FROM authorized_users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    const email = userResult.rows[0].email;
    const bookCheck = await pool.query('SELECT available_copies FROM books WHERE id = $1', [bookId]);
    if (bookCheck.rows.length === 0 || bookCheck.rows[0].available_copies <= 0) {
      return Response.json({ error: 'Book is unavailable' }, { status: 400 });
    }

    await pool.query('BEGIN');
    await pool.query(
      'INSERT INTO borrowings (book_id, user_email, due_date) VALUES ($1, $2, CURRENT_DATE + INTERVAL \'7 days\')',
      [bookId, email]
    );
    await pool.query('UPDATE books SET available_copies = available_copies - 1 WHERE id = $1', [bookId]);
    await pool.query('COMMIT');

    return Response.json({ message: 'Book issued successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    return Response.json({ error: err.message }, { status: 500 });
  }
}
