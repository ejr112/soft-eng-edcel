import pool from '../../../../lib/db';

export async function POST(req) {
  try {
    const { bookId, title, author, copies } = await req.json();

    if (!bookId || !title || !author || !copies) {
      return Response.json({ error: 'All book fields are required' }, { status: 400 });
    }

    await pool.query(
      'INSERT INTO books (id, title, author, available_copies) VALUES ($1, $2, $3, $4)',
      [bookId, title, author, copies]
    );

    return Response.json({ message: 'Book added successfully' });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
