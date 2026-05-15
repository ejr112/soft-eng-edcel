import pool from '../../../../lib/db';

export async function POST(req) {
    try {
        const { bookId, userEmail } = await req.json();

        // 1. Check if book is available
        const bookCheck = await pool.query('SELECT available_copies FROM books WHERE id = $1', [bookId]);
        if (bookCheck.rows.length === 0 || bookCheck.rows[0].available_copies <= 0) {
            return Response.json({ error: 'Book is currently unavailable' }, { status: 400 });
        }

        // 2. Transaction: Create borrowing record & decrease copy count
        await pool.query('BEGIN');
        
        await pool.query(
            'INSERT INTO borrowings (book_id, user_email, due_date) VALUES ($1, $2, CURRENT_DATE + INTERVAL \'7 days\')',
            [bookId, userEmail]
        );

        await pool.query(
            'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1',
            [bookId]
        );

        await pool.query('COMMIT');
        
        return Response.json({ message: 'Book borrowed successfully' });
    } catch (err) {
        await pool.query('ROLLBACK');
        return Response.json({ error: err.message }, { status: 500 });
    }
}