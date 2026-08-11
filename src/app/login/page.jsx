"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import './page.css';

const initialState = {
  email: 'ti@acemaingenieria.com',
  password: 'admin123',
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthContext();
  const [form, setForm] = useState(initialState);
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: form.email, password: form.password }),
    });

    const payload = await response.json();

    if (!response.ok || !payload?.success) {
      setMessage(payload?.error || 'Ha ocurrido un error');
      return;
    }

    login(payload.data);
    setMessage('Inicio de sesión correcto');
    router.push('/dashboard');
  }

  return (
    <main className="pageWrapper">
      <section className="card">
        <h1 className="heading">Iniciar sesión</h1>
        <p className="description">Ingresa con el usuario administrador.</p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
              style={{ padding: 12, borderRadius: 10, border: '1px solid #cbd5e1' }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
              style={{ padding: 12, borderRadius: 10, border: '1px solid #cbd5e1' }}
            />
          </label>

          <button type="submit" className="button">
            Entrar
          </button>
        </form>

        {message ? <p className="message">{message}</p> : null}
      </section>
    </main>
  );
}
