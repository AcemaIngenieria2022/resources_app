'use client';

import { useState } from 'react';
import './page.css';
import '@/components/dashboard/insights/DashboardInsights.css';
import {
  faChartLine,
  faCalendarCheck,
  faCalendarDays,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import DashboardCard from '@/components/dashboard/cards/DashboardCard';
import DashboardInsights from '@/components/dashboard/insights/DashboardInsights';
import { useAuthContext } from '@/context/AuthContext';

// Configura los accesos rápidos visibles en el panel principal del sistema.
const dashboardCards = [
  {
    href: '/summary',
    icon: faChartLine,
    title: 'Resumen diario',
    description: 'Consulta el estado de asistencia del día.',
  },
  {
    href: '/attendance',
    icon: faCalendarCheck,
    title: 'Registros de asistencia',
    description: 'Revisa las marcaciones recibidas de los dispositivos.',
  },
  {
    href: '/date-range',
    icon: faCalendarDays,
    title: 'Asistencia por rango',
    description: 'Analiza la asistencia entre dos fechas.',
  },
  {
    href: '/collaborators',
    icon: faUsers,
    title: 'Colaboradores',
    description: 'Consulta y administra el equipo registrado.',
  },
];

// Página principal del dashboard con tarjetas de acceso y panel de insights de asistencia.
export default function DashboardPage() {
  const [cardOrder, setCardOrder] = useState(dashboardCards.map((card) => card.href));
  const [draggedCard, setDraggedCard] = useState(null);
  const { user, hydrated } = useAuthContext();
  const userName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.email || 'Usuario'
    : 'Usuario';
  const normalizedRole = String(user?.role || '').toLowerCase().replace(/[.\s]/g, '');
  const isHumanResources = normalizedRole === 'hr' || normalizedRole === 'rrhh';
  const visibleCards = hydrated && isHumanResources
    ? dashboardCards.filter((card) => card.href !== '/collaborators')
    : hydrated
      ? dashboardCards
      : [];

  const moveCard = (targetHref) => {
    if (!draggedCard || draggedCard === targetHref) return;
    setCardOrder((current) => {
      const next = [...current];
      const draggedIndex = next.indexOf(draggedCard);
      const targetIndex = next.indexOf(targetHref);
      [next[draggedIndex], next[targetIndex]] = [next[targetIndex], next[draggedIndex]];
      return next;
    });
    setDraggedCard(null);
  };

  return (
    <main className="dashboardMain">
      <p className="dashboardText">Bienvenido {userName} al panel principal.</p>
      <section className="dashboardCards" aria-label="Accesos principales">
        {visibleCards.map((card) => (
          <DashboardCard
            key={card.href}
            {...card}
            draggable
            onDragStart={() => setDraggedCard(card.href)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => moveCard(card.href)}
            style={{ order: cardOrder.indexOf(card.href) }}
          />
        ))}
      </section>
      <DashboardInsights />
    </main>
  );
}
