'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ThreeBounceLoader from '@/components/ui/ThreeBounceLoader/ThreeBounceLoader';
import './page.css';

// Contenido de carga para redirigir al usuario a la siguiente vista después de iniciar o cerrar sesión.
function LoadingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPage = searchParams.get('next') || '/dashboard';
  const isLoginFlow = nextPage === '/dashboard';

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace(nextPage);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [nextPage, router]);

  return (
    <main className="loadingPage">
      <div className="loadingCard">
        <ThreeBounceLoader label={isLoginFlow ? 'Iniciando sesión' : 'Cerrando sesión'} size={16} className="loadingLoader" color="#0f766e" />
        <p className="loadingText">{isLoginFlow ? 'Iniciando sesión...' : 'Cerrando sesión...'}</p>
      </div>
    </main>
  );
}

// Página intermedia de carga con spinner mientras se redirige entre rutas del sistema.
export default function LoadingPage() {
  return (
    <Suspense fallback={
      <main className="loadingPage">
        <div className="loadingCard">
          <ThreeBounceLoader size={16} className="loadingLoader" color="#0f766e" />
          <p className="loadingText">Cargando...</p>
        </div>
      </main>
    }>
      <LoadingPageContent />
    </Suspense>
  );
}
