"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './login.css';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', password: '', email: '', name: '' });
  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, mode: isLogin ? 'login' : 'signup' })
      });

      const data = await res.json();

      if (res.ok) {
        const storedUser = { ...data.user, role: data.role };
        localStorage.setItem('user', JSON.stringify(storedUser));
        router.push(data.role === 'admin' ? '/admin' : '/dashboard');
      } else {
        alert(data.error || "Authentication failed");
      }
    } catch (err) {
      alert("Network Error: Database is unreachable.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-hero">
        <h1>Library Portal</h1>
        <p>Access our digital collection.</p>
      </div>
      
      <div className="login-form-area">
        <div className="login-box">
          <h2>{isLogin ? "Sign In" : "Sign Up"}</h2>
          <p className="subtitle">
            {isLogin ? "Enter your credentials to continue" : "Create your student account"}
          </p>
          
          <form onSubmit={handleAuth}>
            {!isLogin && (
              <>
                <label>Full Name</label>
                <input type="text" placeholder="Juan Dela Cruz" required 
                  onChange={e => setForm({...form, name: e.target.value})} />
                
                <label>Email</label>
                <input type="email" placeholder="student@test.com" required 
                  onChange={e => setForm({...form, email: e.target.value})} />
              </>
            )}

            <label>Username</label>
            <input type="text" placeholder="" required 
              onChange={e => setForm({...form, username: e.target.value})} />

            <label>Password</label>
            <input type="password" placeholder="••••••••" required 
              onChange={e => setForm({...form, password: e.target.value})} />

            <button type="submit" className="login-btn">
              {isLogin ? "Login" : "Register"}
            </button>
          </form>

          <div className="signup-link">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Sign Up" : "Log In"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}