'use client';

import { useEffect, useMemo, useState } from 'react';

const parseMinutes = (value) => {
  if (!value) return null;
  const match = String(value).match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const parseRecordTimes = (value) => {
  if (!value) return [];

  return String(value)
    .split('||')
    .map((item) => {
      const [time, device] = item.split('|');
      return {
        time: time?.trim() || '',
        device: device?.trim().toUpperCase() || 'UNKNOWN',
      };
    })
    .filter((record) => record.device === 'INTERNO' || record.device === 'EXTERNO');
};

const buildMetrics = (summary = []) => {
  const activeEmployees = summary.length;
  const presentEmployees = summary.filter((row) => row.record_count > 0 || row.first_entry).length;
  const absentEmployees = activeEmployees - presentEmployees;
  const lateEmployees = summary.filter((row) => row.first_entry && parseMinutes(row.first_entry) > 7 * 60 + 5).length;
  const earlyEntryEmployees = summary.filter((row) => row.first_entry && parseMinutes(row.first_entry) <= 7 * 60 + 5).length;
  const entryEmployees = lateEmployees + earlyEntryEmployees;
  const exitEmployees = summary.filter((row) => row.last_exit).length;
  const earlyExitEmployees = summary.filter((row) => row.last_exit && parseMinutes(row.last_exit) < 16 * 60 + 25).length;
  const lateExitEmployees = summary.filter((row) => row.last_exit && parseMinutes(row.last_exit) >= 16 * 60 + 25).length;
  const internalMarkings = summary.reduce((accumulator, row) => accumulator + Number(row.internal_count || parseRecordTimes(row.record_times).filter((record) => record.device === 'INTERNO').length), 0);
  const externalMarkings = summary.reduce((accumulator, row) => accumulator + Number(row.external_count || parseRecordTimes(row.record_times).filter((record) => record.device === 'EXTERNO').length), 0);
  const totalMarkings = internalMarkings + externalMarkings;
  const attendanceRate = activeEmployees ? Math.round((presentEmployees / activeEmployees) * 100) : 0;
  const lateRate = entryEmployees ? Math.round((lateEmployees / entryEmployees) * 100) : 0;
  const earlyRate = entryEmployees ? Math.round((earlyEntryEmployees / entryEmployees) * 100) : 0;
  const earlyExitRate = exitEmployees ? Math.round((earlyExitEmployees / exitEmployees) * 100) : 0;
  const lateExitRate = exitEmployees ? Math.round((lateExitEmployees / exitEmployees) * 100) : 0;

  const recentMarkings = summary
    .flatMap((row) =>
      parseRecordTimes(row.record_times).map((record) => ({
        time: record.time,
        person: row.personName || row.employeedID || 'Colaborador',
        device: record.device,
      }))
    )
    .sort((left, right) => left.time.localeCompare(right.time))
    .slice(0, 5);

  const departmentData = Object.values(
    summary.reduce((accumulator, row) => {
      const key = row.department_name || 'Sin departamento';
      if (!accumulator[key]) {
        accumulator[key] = {
          name: key,
          total: 0,
          absent: 0,
        };
      }

      accumulator[key].total += 1;
      if (!row.record_count && !row.first_entry) {
        accumulator[key].absent += 1;
      }
      return accumulator;
    }, {})
  ).sort((left, right) => right.total - left.total);

  return {
    activeEmployees,
    totalMarkings,
    internalMarkings,
    externalMarkings,
    attendanceRate,
    earlyRate,
    lateRate,
    earlyExitRate,
    lateExitRate,
    presentEmployees,
    absentEmployees,
    lateEmployees,
    earlyEntryEmployees,
    entryEmployees,
    exitEmployees,
    earlyExitEmployees,
    lateExitEmployees,
    recentMarkings,
    departmentData,
    lineData: {
      entry: [],
      exit: [],
    },
    dailyData: [],
  };
};

const formatTrendLabel = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '').slice(0, 1).toUpperCase();
};

const getBusinessDayDates = (selectedDate) => {
  const result = [];
  const currentDate = new Date(`${selectedDate}T00:00:00`);
  let cursor = new Date(currentDate);

  while (result.length < 5) {
    const dayOfWeek = cursor.getDay();

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      result.unshift(cursor.toISOString().slice(0, 10));
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return result;
};

const buildTrendData = (dailySummaries = []) => {
  const trend = dailySummaries.map((entry) => {
    const metrics = buildMetrics(entry.summary);
    return {
      label: formatTrendLabel(entry.date),
      entry: Math.max(0, Math.min(100, metrics.earlyRate)),
      exit: Math.max(0, Math.min(100, metrics.lateRate)),
    };
  });

  return {
    dailyData: trend.map((day) => ({
      label: day.label,
      entry: day.entry,
      exit: day.exit,
    })),
    lineData: {
      entry: trend.map((day) => day.entry),
      exit: trend.map((day) => day.exit),
    },
  };
};

export const useDashboard = (selectedDate = new Date().toISOString().slice(0, 10)) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadMetrics = async () => {
      setLoading(true);

      try {
        const requestDates = getBusinessDayDates(selectedDate);

        const [employeesResponse, ...summaryResponses] = await Promise.all([
          fetch('/api/employees'),
          ...requestDates.map(async (date) => {
            const response = await fetch(`/api/summary?date=${date}`);

            if (!response.ok) {
              throw new Error('No se pudo cargar el resumen del dashboard');
            }

            const data = await response.json();
            return { date, summary: Array.isArray(data) ? data : [] };
          })
        ]);

        if (!employeesResponse.ok) {
          throw new Error('No se pudo cargar la cantidad total de empleados');
        }

        const employeesPayload = await employeesResponse.json();
        const registeredEmployees = Number(
          employeesPayload?.meta?.total ??
          employeesPayload?.total ??
          (Array.isArray(employeesPayload?.data) ? employeesPayload.data.length : 0)
        );

        const currentSummary = summaryResponses[summaryResponses.length - 1]?.summary ?? [];
        const currentMetrics = buildMetrics(currentSummary);
        const trendMetrics = buildTrendData(summaryResponses);

        if (isMounted) {
          setMetrics({
            ...currentMetrics,
            registeredEmployees,
            ...trendMetrics,
          });
          setLoading(false);
        }
      } catch (error) {
        console.error('Dashboard metrics error:', error);
        if (isMounted) {
          setMetrics({
            ...buildMetrics([]),
            lineData: { entry: [], exit: [] },
            dailyData: [],
          });
          setLoading(false);
        }
      }
    };

    loadMetrics();

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  return useMemo(
    () => ({
      metrics: metrics ?? buildMetrics([]),
      loading,
    }),
    [loading, metrics]
  );
};

export default useDashboard;
