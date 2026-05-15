import pool from '../../../../lib/db';

export async function GET() {
  try {
    const overdue = await pool.query(
      "SELECT id, user_email, book_id, due_date, EXTRACT(DAY FROM CURRENT_DATE - due_date) AS days_late FROM borrowings WHERE status = $1 AND due_date < CURRENT_DATE ORDER BY due_date ASC",
      ['on-hand']
    );

    return Response.json({
      overdueCount: overdue.rows.length,
      overdueBorrows: overdue.rows,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
