import pool from '../../../../lib/db';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) return Response.json({ error: "Email required" }, { status: 400 });

        const result = await pool.query(
            'SELECT * FROM borrowings WHERE user_email = $1 ORDER BY issue_date DESC',
            [email]
        );

        return Response.json(result.rows);
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}