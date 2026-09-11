'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faChartColumn,
  faClock,
  faRefresh,
  faUsers,
  faGripVertical,
} from '@fortawesome/free-solid-svg-icons';
import { useDashboard } from '@/hooks/useDashboard';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Hook personalizado para animación de números sincronizada
const useAnimatedNumber = (targetValue, duration = 1200) => {
  const [currentValue, setCurrentValue] = useState(0);
  const previousTargetRef = useRef(targetValue);
  const animationRef = useRef(null);

  useEffect(() => {
    if (previousTargetRef.current === targetValue) return;
    
    previousTargetRef.current = targetValue;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startValue = currentValue;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (targetValue - startValue) * easeOutCubic;
      setCurrentValue(Math.round(current));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetValue);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration]);

  return currentValue;
};

// Componente de card individual con drag
const DraggableInsightCard = ({ 
  id, 
  index, 
  moveCard, 
  children, 
  className = '' 
}) => {
  const ref = useRef(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'CARD',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'CARD',
    hover: (item, monitor) => {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      
      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <div 
      ref={ref} 
      className={`insightGridItem ${className} ${isDragging ? 'dragging' : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="dragHandle">
        <FontAwesomeIcon icon={faGripVertical} />
      </div>
      {children}
    </div>
  );
};

const DEFAULT_CARD_ORDER = [
  'colaboradores',
  'marcaciones',
  'tasa-asistencia',
  'asistencia',
  'estados-asistencia',
  'tipos-marcacion',
  'departamento',
  'promedio-diario',
  'tendencia'
];

// Componente principal
export default function DashboardInsights() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const { metrics, loading } = useDashboard(selectedDate);

  // Estado para el orden de las cards
  const [cardOrder, setCardOrder] = useState(DEFAULT_CARD_ORDER);
  const [cardOrderLoaded, setCardOrderLoaded] = useState(false);

  // Refs para animaciones
  const ringRef = useRef(null);
  const lineEntryRef = useRef(null);
  const lineExitRef = useRef(null);
  const barRefs = useRef(new Map());
  const [barValues, setBarValues] = useState({});

  const safeMetrics = useMemo(
    () => ({
      activeEmployees: 0,
      totalMarkings: 0,
      attendanceRate: 0,
      presentEmployees: 0,
      absentEmployees: 0,
      lateEmployees: 0,
      recentMarkings: [],
      departmentData: [],
      dailyData: [],
      lineData: {
        entry: [],
        exit: [],
      },
      ...(metrics ?? {}),
    }),
    [metrics]
  );

  const attendanceRate = Math.min(100, Math.max(0, Number(safeMetrics.attendanceRate ?? 0)));
  const attendanceRingTarget = 282.74 * (1 - attendanceRate / 100);

  const metricBars = {
    active: {
      width: safeMetrics.activeEmployees > 0 ? 100 : 0,
      label: 'Capacidad activa',
    },
    markings: {
      width: safeMetrics.activeEmployees > 0
        ? Math.min(100, (safeMetrics.totalMarkings / Math.max(1, safeMetrics.activeEmployees)) * 100)
        : 0,
      label: `${safeMetrics.totalMarkings} registros`,
    },
    attendance: {
      width: attendanceRate,
      label: `${attendanceRate}% completado`,
    },
  };
  
  // Números animados sincronizados
  const animatedActiveEmployees = useAnimatedNumber(safeMetrics.registeredEmployees ?? safeMetrics.activeEmployees);
  const animatedTotalMarkings = useAnimatedNumber(safeMetrics.totalMarkings);
  const animatedAttendanceRate = useAnimatedNumber(attendanceRate);
  const animatedPresentEmployees = useAnimatedNumber(safeMetrics.presentEmployees);
  const animatedAbsentEmployees = useAnimatedNumber(safeMetrics.absentEmployees);
  const animatedLateEmployees = useAnimatedNumber(safeMetrics.lateEmployees);
  const animatedInternalMarkings = useAnimatedNumber(safeMetrics.internalMarkings ?? 0);
  const animatedExternalMarkings = useAnimatedNumber(safeMetrics.externalMarkings ?? 0);

  // Porcentajes sincronizados
  const animatedPresentPercent = useAnimatedNumber(
    Math.round((safeMetrics.presentEmployees / Math.max(1, safeMetrics.activeEmployees)) * 100)
  );
  const animatedAbsentPercent = useAnimatedNumber(
    Math.round((safeMetrics.absentEmployees / Math.max(1, safeMetrics.activeEmployees)) * 100)
  );

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

  const departmentMax = Math.max(...(safeMetrics.departmentData?.map((item) => item.total) ?? []), 1);

  // Función para mover cards
  const moveCard = useCallback((dragIndex, hoverIndex) => {
    setCardOrder((prevOrder) => {
      const newOrder = [...prevOrder];
      const [removed] = newOrder.splice(dragIndex, 1);
      newOrder.splice(hoverIndex, 0, removed);
      return newOrder;
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const savedOrder = window.localStorage.getItem('dashboard-card-order');

      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);

        if (Array.isArray(parsedOrder) && parsedOrder.length === DEFAULT_CARD_ORDER.length) {
          setCardOrder(parsedOrder);
        }
      }
    } catch (error) {
      console.warn('No se pudo cargar el orden guardado de las cards del dashboard:', error);
    } finally {
      setCardOrderLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!cardOrderLoaded || typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('dashboard-card-order', JSON.stringify(cardOrder));
  }, [cardOrder, cardOrderLoaded]);

  // Efecto para animar el anillo de asistencia
  useEffect(() => {
    if (ringRef.current) {
      ringRef.current.style.transition = 'none';
      ringRef.current.style.strokeDashoffset = '282.74';
      
      requestAnimationFrame(() => {
        if (ringRef.current) {
          ringRef.current.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
          ringRef.current.style.strokeDashoffset = `${attendanceRingTarget}`;
        }
      });
    }
  }, [attendanceRingTarget]);

  // Efecto para animar las líneas de tendencia
  useEffect(() => {
    const animateLine = (element, points) => {
      if (!element) return;
      
      const currentPoints = element.getAttribute('points');
      if (currentPoints === points) return;

      element.style.transition = 'none';
      element.setAttribute('points', points);
      
      void element.offsetHeight;
      
      element.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    };

    const entryPoints = (safeMetrics.lineData?.entry ?? [])
      .map((value, index) => `${index * 26 + 12},${90 - value}`)
      .join(' ');
    
    const exitPoints = (safeMetrics.lineData?.exit ?? [])
      .map((value, index) => `${index * 26 + 12},${90 - value}`)
      .join(' ');

    animateLine(lineEntryRef.current, entryPoints);
    animateLine(lineExitRef.current, exitPoints);
  }, [safeMetrics.lineData]);

  // Efecto para actualizar las barras sincronizadas
  useEffect(() => {
    // Actualizar barra de presentes
    const presentBar = barRefs.current.get('present');
    if (presentBar) {
      presentBar.style.width = `${animatedPresentPercent}%`;
    }

    // Actualizar barra de ausentes
    const absentBar = barRefs.current.get('absent');
    if (absentBar) {
      absentBar.style.width = `${animatedAbsentPercent}%`;
    }
  }, [animatedPresentPercent, animatedAbsentPercent]);

  // Función para registrar referencias de barras
  const registerBarRef = useCallback((key, element) => {
    if (element) {
      barRefs.current.set(key, element);
    }
  }, []);

  const linePoints = {
    entry: (safeMetrics.lineData?.entry ?? [])
      .map((value, index) => `${index * 26 + 12},${90 - value}`)
      .join(' '),
    exit: (safeMetrics.lineData?.exit ?? [])
      .map((value, index) => `${index * 26 + 12},${90 - value}`)
      .join(' '),
  };

  // Mapeo de cards por ID
  const cardComponents = {
    'colaboradores': (
      <div className="insightCard">
        <div className="insightHeader">
          <div>
            <h2>Colaboradores registrados</h2>
            <p>Total de colaboradores en el sistema</p>
          </div>
          <span className="insightBadge">
            <span className="insightIcon">
              <FontAwesomeIcon icon={faUsers} />
            </span>
            Colaboradores
          </span>
        </div>
        <div className="totalMarkings">
          <strong className="number-pop">{animatedActiveEmployees}</strong>
        </div>

        <div className="metricBar">
          <div className="metricBarLabel">
            <span>{metricBars.active.label}</span>
          </div>
          <div className="metricBarTrack">
            <span
              className="metricBarFill activeFill"
              style={{ width: `${metricBars.active.width}%` }}
            />
          </div>
        </div>
      </div>
    ),
    'marcaciones': (
      <div className="insightCard">
        <div className="insightHeader">
          <div>
            <h2>Marcaciones</h2>
            <p>Eventos capturados en el día</p>
          </div>
          <span className="insightBadge">
            <span className="insightIcon">
              <FontAwesomeIcon icon={faClock} />
            </span>
            Marcaciones
          </span>
        </div>
        <div className="totalMarkings">
          <strong className="number-pop">{animatedTotalMarkings}</strong>
        </div>

        <div className="metricBar">
          <div className="metricBarLabel">
            <span>{metricBars.markings.label}</span>
          </div>
          <div className="metricBarTrack">
            <span
              className="metricBarFill markingsFill"
              style={{ width: `${metricBars.markings.width}%` }}
            />
          </div>
        </div>
      </div>
    ),
    'tasa-asistencia': (
      <div className="insightCard">
        <div className="insightHeader">
          <div>
            <h2>Salidas</h2>
            <p>Antes de horario vs post horario</p>
          </div>
          <span className="insightBadge">
            <span className="insightIcon">
              <FontAwesomeIcon icon={faChartColumn} />
            </span>
            Salidas
          </span>
        </div>

        <div className="attendanceComparison">
          <div className="attendanceComparisonRow">
            <div className="attendanceComparisonMeta">
              <span className="legendDot warningDot">●</span>
              <span>Antes de horario</span>
            </div>
            <strong>{safeMetrics.earlyRate ?? 0}%</strong>
          </div>

          <div className="attendanceComparisonRow">
            <div className="attendanceComparisonMeta">
              <span className="legendDot presentDot">●</span>
              <span>Post horario</span>
            </div>
            <strong>{safeMetrics.lateRate ?? 0}%</strong>
          </div>
        </div>

        <div className="attendanceComparisonBars">
          <div className="metricBar compactMetricBar">
            <div className="metricBarTrack">
              <span
                className="metricBarFill attendanceFill"
                style={{ width: `${Math.max(0, Math.min(100, safeMetrics.earlyRate ?? 0))}%` }}
              />
            </div>
          </div>

          <div className="metricBar compactMetricBar">
            <div className="metricBarTrack">
              <span
                className="metricBarFill activeFill"
                style={{ width: `${Math.max(0, Math.min(100, safeMetrics.lateRate ?? 0))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    ),
    'asistencia': (
      <div className="insightCard">
        <div className="insightHeader">
          <div>
            <h2>Asistencia</h2>
            <p>Porcentaje del día</p>
          </div>
          <span className="insightBadge">Hoy</span>
        </div>

        <div className="attendanceRingWrapper">
          <svg className="attendanceRingSvg" viewBox="0 0 120 120" aria-label="Tasa de asistencia">
            <circle cx="60" cy="60" r="45" className="ringBackground" fill="none" strokeWidth="12" />
            <circle
              ref={ringRef}
              cx="60"
              cy="60"
              r="45"
              className="ringProgress"
              fill="none"
              strokeWidth="12"
              stroke="#36bba7"
              strokeDasharray="282.74"
              strokeDashoffset="282.74"
              style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
            <text x="60" y="60" className="ringPercentage">
              {animatedAttendanceRate}
            </text>
            <text x="78" y="58" className="ringPercentSign">
              %
            </text>
          </svg>
        </div>

        <div className="attendanceMetric">
          <div className="metricLegend">
            <span className="legend-item">
              <span className="legendDot presentDot">●</span>
              {animatedPresentEmployees} presentes
            </span>
            <span className="legend-item">
              <span className="legendDot warningDot">●</span>
              {animatedLateEmployees} tardías
            </span>
            <span className="legend-item">
              <span className="legendDot absentDot">●</span>
              {animatedAbsentEmployees} ausentes
            </span>
          </div>
        </div>
      </div>
    ),
    'estados-asistencia': (
      <div className="insightCard">
        <div className="insightHeader">
          <div>
            <h2>Estados de asistencia</h2>
            <p>Resumen del día</p>
          </div>
          <span className="insightBadge">{Math.round(animatedPresentPercent)}%</span>
        </div>

        <div className="markingSummary">
          <span>Presentes</span>
          <strong>{animatedPresentEmployees}</strong>
        </div>
        <div className="statusInsight">
          <div className="statusTrack">
            <span 
              ref={(el) => registerBarRef('present', el)}
              style={{ 
                width: '0%', 
                background: '#36bba7', 
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </div>
        </div>

        <div className="markingSummary" style={{ marginTop: '0.75rem' }}>
          <span>Ausentes</span>
          <strong>{animatedAbsentEmployees}</strong>
        </div>
        <div className="statusInsight">
          <div className="statusTrack">
            <span 
              ref={(el) => registerBarRef('absent', el)}
              style={{ 
                width: '0%', 
                background: '#f2b84b', 
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </div>
        </div>
      </div>
    ),
    'tipos-marcacion': (
      <div className="insightCard">
        <div className="insightHeader">
          <div>
            <h2>Tipos de marcación</h2>
            <p>Internas vs externas</p>
          </div>
          <span className="insightBadge">Hoy</span>
        </div>

        <div className="markingTypes">
          <div className="type-item">
            <span className="typeIcon entryIcon">
              <FontAwesomeIcon icon={faClock} />
            </span>
            <span>Internos</span>
            <strong>{animatedInternalMarkings}</strong>
            <div className="typeBar">
              <span 
                ref={(el) => registerBarRef('internal', el)}
                style={{ 
                  width: `${safeMetrics.totalMarkings > 0 ? Math.min(100, (safeMetrics.internalMarkings / safeMetrics.totalMarkings) * 100) : 0}%`,
                  transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>
          </div>

          <div className="type-item">
            <span className="typeIcon exitIcon">
              <FontAwesomeIcon icon={faRefresh} />
            </span>
            <span>Externos</span>
            <strong>{animatedExternalMarkings}</strong>
            <div className="typeBar exitTypeBar">
              <span 
                ref={(el) => registerBarRef('external', el)}
                style={{ 
                  width: `${safeMetrics.totalMarkings > 0 ? Math.min(100, (safeMetrics.externalMarkings / safeMetrics.totalMarkings) * 100) : 0}%`,
                  transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    ),
    'departamento': (
      <div className="insightCard">
        <div className="insightHeader">
          <div>
            <h2>Departamento</h2>
            <p>Asistencia por área</p>
          </div>
          <span className="insightBadge">Área</span>
        </div>

        <div className="departmentChart">
          {safeMetrics.departmentData.map((department) => {
            const percent = Math.round((department.total / departmentMax) * 100);
            const absentPercentValue = Math.min(100, Math.max(5, (department.absent / Math.max(department.total, 1)) * 100));
            const barKey = `dept-${department.name}`;
            
            return (
              <div className="departmentRow" key={department.name}>
                <div>
                  <span>{department.name}</span>
                  <strong>{department.total} registros</strong>
                </div>
                <div className="departmentTracks">
                  <div className="statusTrack">
                    <span 
                      ref={(el) => registerBarRef(`${barKey}-present`, el)}
                      style={{ 
                        width: `${percent}%`, 
                        background: '#36bba7',
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  </div>
                  <div className="statusTrack absenceTrack">
                    <span 
                      ref={(el) => registerBarRef(`${barKey}-absent`, el)}
                      style={{ 
                        width: `${absentPercentValue}%`, 
                        background: '#f2b84b',
                        transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ),
    'promedio-diario': (
      <div className="insightCard">
        <div className="insightHeader">
          <div>
            <h2>Promedio diario</h2>
            <p>Comparación semanal</p>
          </div>
          <span className="insightBadge">Semana</span>
        </div>

        <div className="barChart">
          {safeMetrics.dailyData.map((day, index) => {
            const entryHeight = Math.min(100, day.entry * 10);
            const exitHeight = Math.min(100, day.exit * 10);
            const barKey = `daily-${day.label}-${index}`;
            
            return (
              <div
                className="barColumn"
                key={barKey}
                title={`${day.label}: Llegadas temprano ${day.entry}%, Llegadas tarde ${day.exit}%`}
              >
                <div className="dailyBarPercentages">
                  <span className="dailyBarPercent greenPercent">{day.entry}%</span>
                  <span className="dailyBarPercent yellowPercent">{day.exit}%</span>
                </div>
                <div className="dailyBarGroup">
                  <div className="barTrack" title={`Llegadas temprano ${day.label}: ${day.entry}%`}>
                    <span 
                      ref={(el) => registerBarRef(`${barKey}-entry`, el)}
                      style={{ 
                        height: `${entryHeight}%`, 
                        transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  </div>
                  <div className="barTrack exitDailyTrack" title={`Llegadas tarde ${day.label}: ${day.exit}%`}>
                    <span 
                      ref={(el) => registerBarRef(`${barKey}-exit`, el)}
                      style={{ 
                        height: `${exitHeight}%`, 
                        transition: 'height 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  </div>
                </div>
                <span className="barLabel">{day.label}</span>
              </div>
            );
          })}
        </div>

        <div className="dailyAverages">
          <span className="dailyAverageEntry">Temprano: {safeMetrics.earlyRate ?? 0}%</span>
          <span className="dailyAverageExit">Tarde: {safeMetrics.lateRate ?? 0}%</span>
        </div>
      </div>
    ),
    'tendencia': (
      <div className="insightCard">
        <div className="insightHeader">
          <div>
            <h2>Tendencia</h2>
            <p>Últimos 5 días</p>
          </div>
          <span className="insightBadge">Evolución</span>
        </div>

        <div className="lineChart">
          <svg viewBox="0 0 130 100" preserveAspectRatio="none" role="img" aria-label="Tendencia de asistencia y llegadas tarde">
            <g>
              {[0, 25, 50, 75, 100].map((value) => (
                <line key={value} className="gridLine" x1="0" y1={value} x2="130" y2={value} />
              ))}
            </g>
            <polyline 
              ref={lineEntryRef}
              className="entryLine" 
              points={linePoints.entry}
              style={{ transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
            <polyline 
              ref={lineExitRef}
              className="exitLine" 
              points={linePoints.exit}
              style={{ transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
            {safeMetrics.lineData.entry.map((value, index) => (
              <circle 
                key={`entry-${index}`} 
                className="entryPoint" 
                cx={index * 26 + 12} 
                cy={90 - value} 
                r="2.5"
                style={{ transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                title={`Asistencia ${index + 1}: ${value}%`}
              >
                <title>{`Asistencia ${index + 1}: ${value}%`}</title>
              </circle>
            ))}
            {safeMetrics.lineData.exit.map((value, index) => (
              <circle 
                key={`exit-${index}`} 
                className="exitPoint" 
                cx={index * 26 + 12} 
                cy={90 - value} 
                r="2.5"
                style={{ transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                title={`Llegadas tarde ${index + 1}: ${value}%`}
              >
                <title>{`Llegadas tarde ${index + 1}: ${value}%`}</title>
              </circle>
            ))}
          </svg>
          <div className="lineLabels">
            {['L', 'M', 'M', 'J', 'V'].map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
          <div className="lineLegend">
            <span><span className="legendDot presentDot">●</span> Llegadas temprano</span>
            <span><span className="legendDot warningDot">●</span> Llegadas tarde</span>
          </div>
        </div>
      </div>
    )
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <section className="dashboardInsights" aria-label="Insights de asistencia">
        <header className="dashboardHeader">
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

          </div>
        </header>

        <div className="insightsGrid">
          {cardOrder.map((cardId, index) => (
            <DraggableInsightCard
              key={cardId}
              id={cardId}
              index={index}
              moveCard={moveCard}
            >
              {cardComponents[cardId]}
            </DraggableInsightCard>
          ))}
        </div>

        <div className="recentMarkings">
          <div className="recentMarkingsHeader">
            <div>
              <h2>Marcaciones recientes</h2>
              <p>Últimos eventos registrados para la fecha seleccionada</p>
            </div>
            <span>{safeMetrics.recentMarkings.length} hoy</span>
          </div>

          {safeMetrics.recentMarkings.length > 0 ? (
            <div className="recentMarkingsList">
              {safeMetrics.recentMarkings.map((entry, index) => (
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
    </DndProvider>
  );
}