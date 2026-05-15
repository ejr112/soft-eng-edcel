import pool from '../../../lib/db';

export async function POST(req) {
    try {
        const body = await req.json();
        const { username, password, email, name, mode } = body;

        // 1. Hardcoded Admin Check
        if (username === 'admin@isu.com' && password === 'adminpassword123') {
            return Response.json({ 
                role: 'admin', 
                user: { name: 'Admin User', email: 'admin@isu.com' } 
            });
        }

        // 2. Database Action
        if (mode === 'signup') {
            const result = await pool.query(
                'INSERT INTO authorized_users (name, email, username, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [name, email, username, password, 'student']
            );
            return Response.json({ role: 'student', user: result.rows[0] });
        } else {
            const userCheck = await pool.query(
                'SELECT * FROM authorized_users WHERE username = $1', 
                [username]
            );
            
            if (userCheck.rows.length > 0) {
                if (userCheck.rows[0].password === password) {
                    return Response.json({ 
                        role: userCheck.rows[0].role, 
                        user: userCheck.rows[0] 
                    });
                }
                return Response.json({ error: 'Invalid Password' }, { status: 401 });
            }
            return Response.json({ error: 'User not found' }, { status: 404 });
        }
    } catch (err) {
        console.error("DATABASE ERROR:", err.message);
        return Response.json({ error: err.message }, { status: 500 });
    }
}