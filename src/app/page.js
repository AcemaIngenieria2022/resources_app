import { redirect } from 'next/navigation';

// Redirige la ruta raíz a la pantalla de login.
export default function Home() {
  redirect('/login');
}
