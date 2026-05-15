import pool from '../../../../lib/db';

export async function GET() {
    try {
        const bookCount = await pool.query('SELECT COUNT(*) FROM books');
        const borrowCount = await pool.query('SELECT COUNT(*) FROM borrowings WHERE status = $1', ['on-hand']);
        const userCount = await pool.query('SELECT COUNT(*) FROM authorized_users WHERE role = $1', ['student']);
        
        const borrows = await pool.query('SELECT * FROM borrowings ORDER BY issue_date DESC LIMIT 10');

        return Response.json({
            stats: {
                totalBooks: bookCount.rows[0].count,
                activeBorrows: borrowCount.rows[0].count,
                users: userCount.rows[0].count
            },
            borrows: borrows.rows
        });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}