import pool from '../../../../lib/db';

export async function POST(req) {
  try {
    const { bookId } = await req.json();

    if (!bookId) {
      return Response.json({ error: 'Book ID is required' }, { status: 400 });
    }

    await pool.query('DELETE FROM books WHERE id = $1', [bookId]);
    return Response.json({ message: 'Book removed successfully' });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
