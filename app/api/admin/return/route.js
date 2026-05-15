import pool from '../../../../lib/db';

export async function POST(req) {
    try {
        const { borrowId, bookId } = await req.json();

        await pool.query('BEGIN');
        
        // 1. Mark the borrowing as 'returned'
        await pool.query('UPDATE borrowings SET status = $1 WHERE id = $2', ['returned', borrowId]);

        // 2. Add the copy back to the books table
        await pool.query('UPDATE books SET available_copies = available_copies + 1 WHERE id = $1', [bookId]);

        await pool.query('COMMIT');
        return Response.json({ message: 'Book returned successfully' });
    } catch (err) {
        await pool.query('ROLLBACK');
        return Response.json({ error: err.message }, { status: 500 });
    }
}