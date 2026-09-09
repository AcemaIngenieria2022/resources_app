'use client';

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faChartColumn,
  faClock,
  faRefresh,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { useDashboard } from '@/hooks/useDashboard';

// Panel de insights para mostrar métricas de asistencia y registros recientes del día.
export default function DashboardInsights() {
  const { metrics, loading } = useDashboard();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const cards = useMemo(
    () => [
      {
        title: 'Colaboradores activos',
        value: metrics?.activeEmployees ?? 0,
        hint: 'Con asistencia registrada hoy',
        icon: faUsers,
      },
      {
        title: 'Marcaciones',
        value: metrics?.totalMarkings ?? 0,
        hint: 'Eventos capturados en el día',
        icon: faClock,
      },
      {
        title: 'Tasa de asistencia',
        value: `${metrics?.attendanceRate ?? 0}%`,
        hint: 'Promedio de cumplimiento',
        icon: faChartColumn,
      },
    ],
    [metrics]
  );

  const recentMarkings = [
    { time: '07:03', person: 'Ana Gómez', device: 'INTERNO' },
    { time: '07:12', person: 'Luis Pérez', device: 'EXTERNO' },
    { time: '07:18', person: 'Marta Ruiz', device: 'INTERNO' },
    { time: '08:01', person: 'Carlos Silva', device: 'EXTERNO' },
    { time: '08:30', person: 'Sofía Ortega', device: 'INTERNO' },
  ];

  const goToPreviousDay = () => {
    const nextDate = new Date(`${selectedDate}T00:00:00`);
    nextDate.setDate(nextDate.getDate() - 1);
    setSelectedDate(nextDate.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const nextDate = new Date(`${selectedDate}T00:00:00`);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDate(nextDate.toISOString().split('T')[0]);
  };

  return (
    <section className="dashboardInsights" aria-label="Insights de asistencia">
      <header className="dashboardHeader">
        <h2 className="dashboardTitle">
          <FontAwesomeIcon icon={faChartColumn} />
          <span>Insights</span>
        </h2>

        <div className="dashboardControls">
          <div className="dashboardDatePicker">
            <button type="button" className="dateNavBtn" aria-label="Día anterior" onClick={goToPreviousDay}>
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>

            <label className="dateDisplay" aria-label="Seleccionar fecha">
              <FontAwesomeIcon icon={faClock} />
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </label>

            <button type="button" className="dateNavBtn" aria-label="Día siguiente" onClick={goToNextDay}>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>

          <button type="button" className="refreshBtn" disabled={loading}>
            <FontAwesomeIcon icon={faRefresh} className={loading ? 'spinning' : ''} />
            <span>{loading ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
        </div>
      </header>

      <div className="insightsGrid">
        {cards.map((card) => (
          <div className="insightGridItem" key={card.title}>
            <article className="insightCard">
              <div className="insightIcon" aria-hidden="true">
                <FontAwesomeIcon icon={card.icon} />
              </div>
              <div className="insightText">
                <p className="insightTitle">{card.title}</p>
                <strong className="insightValue">{card.value}</strong>
                <span className="insightHint">{card.hint}</span>
              </div>
            </article>
          </div>
        ))}
      </div>

      <div className="recentMarkings">
        <div className="recentMarkingsHeader">
          <div>
            <h2>Marcaciones recientes</h2>
            <p>Últimos eventos registrados para la fecha seleccionada</p>
          </div>
          <span>{recentMarkings.length} hoy</span>
        </div>

        {recentMarkings.length > 0 ? (
          <div className="recentMarkingsList">
            {recentMarkings.map((entry, index) => (
              <div className="recentMarking" key={`${entry.person}-${entry.time}-${index}`}>
                <span className="recentMarkingTime">{entry.time}</span>
                <div className="recentMarkingPerson">
                  <strong>{entry.person}</strong>
                  <span>{entry.device === 'INTERNO' ? 'Ingreso interno' : 'Ingreso externo'}</span>
                </div>
                <span className={`recentMarkingDevice ${entry.device.toLowerCase()}`}>
                  {entry.device}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="recentMarkingsEmpty">No hay registros recientes para esta fecha.</p>
        )}
      </div>
    </section>
  );
}
