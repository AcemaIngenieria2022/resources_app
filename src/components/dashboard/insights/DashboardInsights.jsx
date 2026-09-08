'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Users, 
  ArrowUpRight,
  ArrowDownRight,
  CircleCheck,
  CircleX,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const emptyMetrics = {
  totalUsers: 0,
  registeredUsers: 0,
  absentUsers: 0,
  noRecordUsers: 0,
  totalMarkings: 0,
  totalEntries: 0,
  totalExits: 0,
  attendanceAverage: 0,
  departments: [],
  dailyEntries: [],
  dailyMarkings: [],
};

const buildMetrics = (records, dailyRecords = []) => {
  const totalUsers = records.length;
  const registeredUsers = records.filter((record) => Number(record.record_count) > 0).length;
  const absentUsers = records.filter((record) => !record.first_entry).length;
  const noRecordUsers = records.filter((record) => Number(record.record_count) === 0).length;
  const totalMarkings = records.reduce((total, record) => total + Number(record.record_count || 0), 0);
  const totalEntries = records.reduce((total, record) => total + String(record.record_times || '').split('||').filter((item) => item.endsWith('|EXTERNO')).length, 0);
  const totalExits = records.reduce((total, record) => total + String(record.record_times || '').split('||').filter((item) => item.endsWith('|INTERNO')).length, 0);
  const departmentsMap = records.reduce((map, record) => {
    const department = record.department_name || 'Sin departamento';
    const current = map.get(department) || { users: 0, absences: 0 };
    current.users += 1;
    if (!record.first_entry) current.absences += 1;
    map.set(department, current);
    return map;
  }, new Map());
  const departments = [...departmentsMap.entries()]
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => b.users - a.users);
  const dailyEntries = dailyRecords.map(({ date, records: dateRecords }) => ({
    date,
    entries: dateRecords.filter((record) => record.first_entry).length,
    exits: dateRecords.filter((record) => record.last_exit).length,
  }));

  return {
    totalUsers,
    registeredUsers,
    absentUsers,
    noRecordUsers,
    totalMarkings,
    totalEntries,
    totalExits,
    attendanceAverage: totalUsers ? Math.round((registeredUsers / totalUsers) * 100) : 0,
    departments,
    dailyEntries,
    dailyMarkings: dailyEntries,
  };
};

const getWeekdays = (selectedDate) => {
  const monday = new Date(`${selectedDate}T12:00:00`);
  const day = monday.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  monday.setDate(monday.getDate() - daysSinceMonday);

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
};

// Componente de número animado
function AnimatedNumber({ value, duration = 850, suffix = '', prefix = '' }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      return undefined;
    }

    const startValue = displayValue;
    const difference = value - startValue;
    const startedAt = performance.now();
    let frameId;

    const animate = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + difference * easedProgress));
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return (
    <span className="animated-number">
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

// Componente de anillo de asistencia
function AttendanceRing({ percentage }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div key={percentage} className="attendanceRingWrapper">
      <svg
        viewBox="0 0 120 120"
        width="140"
        height="140"
        className="attendanceRingSvg"
        role="img"
        aria-label={`Promedio de asistencia: ${percentage}%`}
      >
        <circle
          className="ringBackground"
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="8"
        />
        <circle
          className="ringProgress"
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="#36bba7"
          strokeWidth="8"
          strokeDasharray={circumference}
          style={{ '--ring-target': offset, strokeDashoffset: offset }}
        />
        <text x="60" y="58" textAnchor="middle" className="ringPercentage">
          <tspan>{percentage}</tspan>
          <tspan className="ringPercentSign">%</tspan>
        </text>
      </svg>
    </div>
  );
}

export default function DashboardInsights() {
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [recentMarkings, setRecentMarkings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [insightOrder, setInsightOrder] = useState(['attendance', 'markings', 'types', 'departments', 'daily', 'line']);
  const [draggedInsight, setDraggedInsight] = useState(null);

  const moveInsight = (targetId) => {
    if (!draggedInsight || draggedInsight === targetId) return;
    setInsightOrder((current) => {
      const next = [...current];
      const draggedIndex = next.indexOf(draggedInsight);
      const targetIndex = next.indexOf(targetId);
      [next[draggedIndex], next[targetIndex]] = [next[targetIndex], next[draggedIndex]];
      return next;
    });
    setDraggedInsight(null);
  };

  const loadMetrics = useCallback(async () => {
    try {
      const dates = getWeekdays(selectedDate);
      const [selectedResponse, ...dailyResponses] = await Promise.all(
        [selectedDate, ...dates].map((date) => fetch(`/api/summary?date=${date}`))
      );
      const recentResponse = await fetch(`/api/attlog?date=${selectedDate}&limit=5&sortBy=authDateTime&sortDir=desc`);
      const dailyRecords = await Promise.all(
        dailyResponses.map(async (response, index) => ({
          date: dates[index],
          records: response.ok ? await response.json() : [],
        }))
      );
      const selectedRecords = selectedResponse.ok ? await selectedResponse.json() : [];
      setMetrics(buildMetrics(Array.isArray(selectedRecords) ? selectedRecords : [], dailyRecords));
      setRecentMarkings(recentResponse.ok ? (await recentResponse.json()) : []);
    } catch {
      setMetrics(emptyMetrics);
      setRecentMarkings([]);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadMetrics();
    const refreshTimer = window.setInterval(loadMetrics, 30000);
    return () => window.clearInterval(refreshTimer);
  }, [loadMetrics]);

  const handleDateChange = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().slice(0, 10));
  };

  const maxDepartmentCount = useMemo(
    () => Math.max(...metrics.departments.map((department) => department.users), 1),
    [metrics.departments]
  );
  const maxDailyMarkings = useMemo(
    () => Math.max(...metrics.dailyMarkings.flatMap((item) => [item.entries, item.exits]), 1),
    [metrics.dailyMarkings]
  );
  const maxTypeMarkings = Math.max(metrics.totalEntries, metrics.totalExits, 1);

  const linePoints = (key) =>
    metrics.dailyMarkings
      .map((item, index) => `${index * 25 + 5},${100 - ((item[key] / maxDailyMarkings) * 82)}`)
      .join(' ');

  return (
    <section className="dashboardInsights" aria-label="Indicadores de asistencia">
      <div className="dashboardHeader">
        <div className="dashboardControls">
          <div className="dashboardDatePicker">
            <button 
              className="dateNavBtn"
              onClick={() => handleDateChange(-1)}
              aria-label="Día anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="dateDisplay">
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </div>
            <button 
              className="dateNavBtn"
              onClick={() => handleDateChange(1)}
              aria-label="Día siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="insightsGrid">
        {/* Attendance Card */}
        <div 
          className="insightGridItem"
          draggable
          onDragStart={() => setDraggedInsight('attendance')}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => moveInsight('attendance')}
          style={{ order: insightOrder.indexOf('attendance') + 1 }}
        >
          <div className="insightCard attendanceInsight card-enter" style={{ animationDelay: '0s' }}>
            <div className="insightHeader">
              <div>
                <h2>Promedio de asistencia</h2>
                <p>Usuarios que registraron el día seleccionado</p>
              </div>
              <span className="insightBadge">
                <Users size={14} />
                {metrics.totalUsers} usuarios
              </span>
            </div>
            <div className="attendanceMetric">
              <AttendanceRing percentage={metrics.attendanceAverage} />
              <div className="metricLegend">
                <span className="legend-item" style={{ animationDelay: '0.3s' }}>
                  <CircleCheck size={14} className="legendDot presentDot" />
                  Registraron <strong><AnimatedNumber value={metrics.registeredUsers} /></strong>
                </span>
                <span className="legend-item" style={{ animationDelay: '0.4s' }}>
                  <CircleX size={14} className="legendDot absentDot" />
                  Ausentes <strong><AnimatedNumber value={metrics.absentUsers} /></strong>
                </span>
                <span className="legend-item" style={{ animationDelay: '0.5s' }}>
                  <AlertCircle size={14} className="legendDot warningDot" />
                  Sin registro <strong><AnimatedNumber value={metrics.noRecordUsers} /></strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Markings Card */}
        <div 
          className="insightGridItem"
          draggable
          onDragStart={() => setDraggedInsight('markings')}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => moveInsight('markings')}
          style={{ order: insightOrder.indexOf('markings') + 1 }}
        >
          <div className="insightCard statusInsight card-enter" style={{ animationDelay: '0.1s' }}>
            <div className="insightHeader">
              <div>
                <h2>Marcaciones totales</h2>
                <p>Registros del día</p>
              </div>
              <span className="trendArrow">
                <AnimatedNumber value={metrics.totalMarkings} />
              </span>
            </div>
            <div className="totalMarkings">
              <strong className="number-pop">
                <AnimatedNumber value={metrics.totalMarkings} />
              </strong>
              <span>marcaciones</span>
            </div>
            <div className="markingSummary">
              <span>Base activa</span>
              <strong><AnimatedNumber value={metrics.totalUsers} /> usuarios</strong>
            </div>
            <div className="statusTrack">
              <span
                key={`total-markings-${metrics.totalMarkings}`}
                style={{
                  '--bar-target': `${Math.min(metrics.totalMarkings * 4, 100)}%`,
                  width: `${Math.min(metrics.totalMarkings * 4, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Marking Types Card */}
        <div 
          className="insightGridItem"
          draggable
          onDragStart={() => setDraggedInsight('types')}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => moveInsight('types')}
          style={{ order: insightOrder.indexOf('types') + 1 }}
        >
          <div className="insightCard markingTypesInsight card-enter" style={{ animationDelay: '0.2s' }}>
            <div className="insightHeader">
              <div>
                <h2>Ingresos y salidas</h2>
                <p>Detalle de las marcaciones del día</p>
              </div>
            </div>
            <div className="markingTypes">
              <div className="type-item" style={{ animationDelay: '0.3s' }}>
                <span className="typeIcon entryIcon">
                  <ArrowUpRight size={18} />
                </span>
                <span>Ingresos</span>
                <strong><AnimatedNumber value={metrics.totalEntries} /></strong>
                <div className="typeBar"><span key={`entries-${metrics.totalEntries}`} style={{ '--bar-target': `${(metrics.totalEntries / maxTypeMarkings) * 100}%`, width: `${(metrics.totalEntries / maxTypeMarkings) * 100}%` }} /></div>
              </div>
              <div className="type-item" style={{ animationDelay: '0.4s' }}>
                <span className="typeIcon exitIcon">
                  <ArrowDownRight size={18} />
                </span>
                <span>Salidas</span>
                <strong><AnimatedNumber value={metrics.totalExits} /></strong>
                <div className="typeBar exitTypeBar"><span key={`exits-${metrics.totalExits}`} style={{ '--bar-target': `${(metrics.totalExits / maxTypeMarkings) * 100}%`, width: `${(metrics.totalExits / maxTypeMarkings) * 100}%` }} /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Departments Card */}
        <div 
          className="insightGridItem"
          draggable
          onDragStart={() => setDraggedInsight('departments')}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => moveInsight('departments')}
          style={{ order: insightOrder.indexOf('departments') + 1 }}
        >
          <div className="insightCard trendInsight card-enter" style={{ animationDelay: '0.3s' }}>
            <div className="insightHeader">
              <div>
                <h2>Usuarios por departamento</h2>
                <p>Usuarios y ausencias del día seleccionado</p>
              </div>
            </div>
            <div className="departmentChart">
              {metrics.departments.length ? (
                metrics.departments.map((department, index) => (
                  <div
                    className="departmentRow"
                    key={department.name}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    title={`${department.name}: ${department.users} usuarios, ${department.absences} ausencias`}
                  >
                    <div>
                      <span>{department.name}</span>
                      <strong>
                        <AnimatedNumber value={department.users} /> usuarios ·{' '}
                        <AnimatedNumber value={department.absences} /> ausencias
                      </strong>
                    </div>
                    <div className="departmentTracks">
                      <div className="statusTrack">
                        <span style={{ width: `${(department.users / maxDepartmentCount) * 100}%` }} />
                      </div>
                      <div className="statusTrack absenceTrack">
                        <span style={{ width: `${(department.absences / maxDepartmentCount) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="emptyChart">Sin departamentos para mostrar</p>
              )}
            </div>
          </div>
        </div>

        {/* Daily Chart Card */}
        <div 
          className="insightGridItem"
          draggable
          onDragStart={() => setDraggedInsight('daily')}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => moveInsight('daily')}
          style={{ order: insightOrder.indexOf('daily') + 1 }}
        >
          <div className="insightCard dailyInsight card-enter" style={{ animationDelay: '0.4s' }}>
            <div className="insightHeader">
              <div>
                <h2>Promedio de ingresos vs. salidas</h2>
                <p>Primer registro externo vs. último interno</p>
              </div>
              <div className="dailyAverages">
                <span className="dailyAverageEntry">I <AnimatedNumber value={Math.round(metrics.dailyEntries.reduce((sum, item) => sum + item.entries, 0) / (metrics.dailyEntries.length || 1))} /></span>
                <span className="dailyAverageExit">S <AnimatedNumber value={Math.round(metrics.dailyEntries.reduce((sum, item) => sum + item.exits, 0) / (metrics.dailyEntries.length || 1))} /></span>
              </div>
            </div>
            <div className="barChart dailyChart">
              {metrics.dailyEntries.map((item, index) => (
                <div
                  className="barColumn"
                  key={item.date}
                  style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                  title={`${new Date(`${item.date}T12:00:00`).toLocaleDateString('es-CO', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}: ${item.entries} ingresos y ${item.exits} salidas`}
                >
                  <div className="dailyBarGroup">
                    <div className="barTrack entryDailyTrack" title={`${item.entries} ingresos`}>
                      <span style={{ height: `${Math.max((item.entries / maxDailyMarkings) * 100, 3)}%` }} />
                    </div>
                    <div className="barTrack exitDailyTrack" title={`${item.exits} salidas`}>
                      <span style={{ height: `${Math.max((item.exits / maxDailyMarkings) * 100, 3)}%` }} />
                    </div>
                  </div>
                  <span className="barLabel">
                    {new Date(`${item.date}T12:00:00`).toLocaleDateString('es-CO', { 
                      weekday: 'short' 
                    }).replace('.', '')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Line Chart Card */}
        <div 
          className="insightGridItem"
          draggable
          onDragStart={() => setDraggedInsight('line')}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => moveInsight('line')}
          style={{ order: insightOrder.indexOf('line') + 1 }}
        >
          <div className="insightCard lineInsight card-enter" style={{ animationDelay: '0.5s' }}>
            <div className="insightHeader">
              <div>
                <h2>Ingresos vs. salidas</h2>
                <p>Comparación de marcaciones por día laboral</p>
              </div>
              <div className="lineLegend">
                <span><CircleCheck size={12} className="legendDot presentDot" />Ingresos</span>
                <span><AlertCircle size={12} className="legendDot warningDot" />Salidas</span>
              </div>
            </div>
            <div className="lineChart">
              <svg viewBox="0 0 110 110" role="img" aria-hidden="true" preserveAspectRatio="none">
                <line x1="5" y1="18" x2="105" y2="18" className="gridLine" />
                <line x1="5" y1="59" x2="105" y2="59" className="gridLine" />
                <line x1="5" y1="100" x2="105" y2="100" className="gridLine" />
                <polyline className="entryLine" points={linePoints('entries')} />
                <polyline className="exitLine" points={linePoints('exits')} />
                {metrics.dailyMarkings.map((item, index) => {
                  const x = index * 25 + 5;
                  const entryY = 100 - ((item.entries / maxDailyMarkings) * 82);
                  const exitY = 100 - ((item.exits / maxDailyMarkings) * 82);
                  return (
                    <g key={item.date}>
                      <circle className="entryPoint" cx={x} cy={entryY} r="2.5">
                        <title>{`${item.entries} ingresos el ${item.date}`}</title>
                      </circle>
                      <circle className="exitPoint" cx={x} cy={exitY} r="2.5">
                        <title>{`${item.exits} salidas el ${item.date}`}</title>
                      </circle>
                    </g>
                  );
                })}
              </svg>
              <div className="lineLabels">
                {metrics.dailyMarkings.map((item) => (
                  <span key={item.date}>
                    {new Date(`${item.date}T12:00:00`).toLocaleDateString('es-CO', { 
                      weekday: 'short' 
                    }).replace('.', '')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="recentMarkings" aria-label="Últimas marcaciones">
        <div className="recentMarkingsHeader">
          <div>
            <h2>Últimas marcaciones</h2>
            <p>Los 5 registros más recientes del día seleccionado</p>
          </div>
          <span>{recentMarkings.length}/5</span>
        </div>
        <div className="recentMarkingsList">
          {recentMarkings.length ? recentMarkings.map((marking, index) => (
            <div className="recentMarking" key={`${marking.employeedID}-${marking.authDateTime}-${marking.diviceName}-${index}`}>
              <div className="recentMarkingTime">{marking.authTime || new Date(marking.authDateTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
              <div className="recentMarkingPerson">
                <strong>{marking.personName || 'Usuario sin nombre'}</strong>
                <span className={`recentMarkingType ${String(marking.diviceName).toLowerCase()}`}>
                  {String(marking.diviceName).toLowerCase() === 'externo' ? 'Ingreso' : 'Salida'}
                </span>
              </div>
              <span className={`recentMarkingDevice ${String(marking.diviceName).toLowerCase()}`}>{String(marking.diviceName || 'Equipo').toUpperCase()}</span>
            </div>
          )) : <p className="recentMarkingsEmpty">No hay marcaciones para esta fecha.</p>}
        </div>
      </section>

      
    </section>
  );
}

