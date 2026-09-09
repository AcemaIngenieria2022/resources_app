"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import './page.css';

// Estado inicial del formulario para evitar valores vacíos al renderizar la pantalla de login.
const initialState = {
  email: 'ti@acemaingenieria.com',
  password: 'admin123',
};

// Página de inicio de sesión del sistema con validación, recordarme y redirección al dashboard.
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthContext();
  const [form, setForm] = useState(initialState);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Cargar email guardado al montar el componente
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setForm(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
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

      // Guardar email si "Recordarme" está activado
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', form.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      login(payload.data);
      setMessage('Inicio de sesión correcto');
      setTimeout(() => router.push('/loading?next=/dashboard'), 500);
    } catch (error) {
      setMessage('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="loginContainer">
      <div className="loginWrapper">
        {/* Sección izquierda - Imagen */}
        <div className="imageSection">
          <div className="imageContent">
            <div className="brandLogo">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <rect width="60" height="60" rx="12" fill="#36BBA7" />
                <path d="M20 20H40V40H20V20Z" stroke="white" strokeWidth="3" />
                <path d="M30 15V45" stroke="white" strokeWidth="3" strokeLinecap="round" />
                <path d="M15 30H45" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="imageTitle">Bienvenido de vuelta</h1>
            <p className="imageDescription">
              Inicia sesión para acceder a tu panel de administración
            </p>
            <div className="imageFeatures">
              <div className="feature">
                <span className="featureIcon">✓</span>
                <span>Gestión completa</span>
              </div>
              <div className="feature">
                <span className="featureIcon">✓</span>
                <span>Dashboard intuitivo</span>
              </div>
              <div className="feature">
                <span className="featureIcon">✓</span>
                <span>Reportes en tiempo real</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sección derecha - Login */}
        <div className="loginSection">
          <div className="loginContent">
            <div className="loginHeader">
              <h2 className="loginTitle">Iniciar sesión</h2>
              <p className="loginSubtitle">Ingresa con tus credenciales</p>
            </div>

            <form onSubmit={handleSubmit} className="loginForm">
              <div className="formGroup">
                <label className="formLabel">Correo electrónico</label>
                <div className="inputWrapper">
                  <svg className="inputIcon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M2 4L10 10L18 4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 16V4C2 2.89543 2.89543 2 4 2H16C17.1046 2 18 2.89543 18 4V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16Z" stroke="#94a3b8" strokeWidth="2"/>
                  </svg>
                  <input
                    type="email"
                    className="formInput"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <div className="formGroup">
                <label className="formLabel">Contraseña</label>
                <div className="inputWrapper">
                  <svg className="inputIcon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 12V8C4 5.79086 5.79086 4 8 4H12C14.2091 4 16 5.79086 16 8V12" stroke="#94a3b8" strokeWidth="2"/>
                    <rect x="2" y="12" width="16" height="6" rx="2" stroke="#94a3b8" strokeWidth="2"/>
                    <circle cx="10" cy="15" r="1" fill="#94a3b8"/>
                  </svg>
                  <input
                    type="password"
                    className="formInput"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="formOptions">
                <label className="checkboxLabel">
                  <input 
                    type="checkbox" 
                    className="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Recordarme</span>
                </label>
              </div>

              <button type="submit" className="submitButton" disabled={isLoading}>
                {isLoading ? 'Iniciando...' : 'Iniciar sesión'}
              </button>

              {message && (
                <p className={`message ${message.includes('correcto') ? 'success' : 'error'}`}>
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}