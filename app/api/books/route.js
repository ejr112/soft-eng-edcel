import pool from '../../../lib/db';

export async function GET() {
    try {
        const result = await pool.query('SELECT * FROM books ORDER BY id ASC');
        return Response.json(result.rows);
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}