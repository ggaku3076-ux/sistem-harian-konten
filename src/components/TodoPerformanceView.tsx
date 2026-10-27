import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Calendar,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  ListChecks,
  PieChart,
  Target,
} from 'lucide-react';
import { DailyTodoLog, TodoCategory, TodoTab } from '../types/content';
import {
  formatDateID,
  formatNumberID,
  getTodayDateString,
  shiftDateString,
} from '../utils/storage';
import { ConcentricTargetWheel, InteractiveWheel, WheelSegment } from './WheelChart';

interface TodoPerformanceViewProps {
  activeTab: Exclude<TodoTab, 'checklist'>;
  currentLog: DailyTodoLog;
  allLogs: DailyTodoLog[];
  onChangeDate: (date: string) => void;
  onChangeTab: (tab: TodoTab) => void;
}

const CATEGORY_ORDER: { key: TodoCategory; color: string }[] = [
  { key: 'Konten', color: '#1d1d1f' },
  { key: 'Sosmed', color: '#0066cc' },
  { key: 'Grup & Iklan', color: '#166534' },
  { key: 'Live', color: '#0f766e' },
  { key: 'Prospek & Survey', color: '#b45309' },
  { key: 'Lainnya', color: '#6e6e73' },
];

export const TodoPerformanceView: React.FC<TodoPerformanceViewProps> = ({
  activeTab,
  currentLog,
  allLogs,
  onChangeDate,
  onChangeTab,
}) => {
  const todayStr = getTodayDateString();
  const yesterdayStr = shiftDateString(todayStr, -1);

  // Merge currentLog with saved allLogs so performance is always live & accurate
  const mergedLogs = useMemo(() => {
    const map = new Map<string, DailyTodoLog>();
    for (const log of allLogs) {
      map.set(log.date, log);
    }
    map.set(currentLog.date, currentLog);
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [allLogs, currentLog]);

  // ================= 1. SATU-SATU (PER TANGGAL & PER KATEGORI) =================
  const singleStats = useMemo(() => {
    const total = currentLog.items.length;
    const done = currentLog.items.filter((i) => i.completed).length;
    const pending = Math.max(0, total - done);
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const byCategory = CATEGORY_ORDER.map((c) => {
      const catItems = currentLog.items.filter((i) => i.category === c.key);
      const catDone = catItems.filter((i) => i.completed).length;
      const catTotal = catItems.length;
      const catPct = catTotal > 0 ? Math.round((catDone / catTotal) * 100) : 0;
      return {
        category: c.key,
        color: c.color,
        done: catDone,
        total: catTotal,
        pct: catPct,
        items: catItems,
      };
    });

    const activeCatFinished = byCategory.filter((c) => c.total > 0 && c.done === c.total).length;
    const activeCatCount = byCategory.filter((c) => c.total > 0).length;

    const statusSegments: WheelSegment[] = [
      {
        id: 'done',
        label: 'Sudah Dikerjakan',
        value: done,
        color: '#166534',
        helper: `${pct}% tugas selesai`,
      },
      {
        id: 'pending',
        label: 'Belum Selesai',
        value: pending,
        color: '#d2d2d7',
        helper: `${100 - pct}% tersisa`,
      },
    ];

    const categorySegments: WheelSegment[] = byCategory.map((c) => ({
      id: c.category,
      label: c.category,
      value: c.done,
      color: c.color,
      helper: `${c.done}/${c.total} selesai (${c.pct}%)`,
    }));

    return {
      total,
      done,
      pending,
      pct,
      byCategory,
      activeCatFinished,
      activeCatCount,
      statusSegments,
      categorySegments,
    };
  }, [currentLog]);

  // ================= 2. MINGGUAN (7 HARI TERAKHIR DARI TANGGAL AKTIF) =================
  const weeklyStats = useMemo(() => {
    const days: {
      date: string;
      shortLabel: string;
      done: number;
      total: number;
      pct: number;
      hasRecord: boolean;
    }[] = [];

    for (let offset = -6; offset <= 0; offset++) {
      const dStr = shiftDateString(currentLog.date, offset);
      const found = mergedLogs.find((l) => l.date === dStr);
      const parts = dStr.split('-').map(Number);
      const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      const shortLabel = dateObj.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
      });

      const done = found ? found.items.filter((i) => i.completed).length : 0;
      const total = found ? found.items.length : 0;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

      days.push({
        date: dStr,
        shortLabel,
        done,
        total,
        pct,
        hasRecord: Boolean(found && done > 0),
      });
    }

    const totalDoneWeek = days.reduce((s, d) => s + d.done, 0);
    const recordedDays = days.filter((d) => d.total > 0);
    const totalTasksWeek = recordedDays.reduce((s, d) => s + d.total, 0);
    const avgPctWeek =
      recordedDays.length > 0
        ? Math.round(recordedDays.reduce((s, d) => s + d.pct, 0) / recordedDays.length)
        : 0;
    const perfectDaysWeek = days.filter((d) => d.total > 0 && d.done === d.total).length;
    const productiveDaysWeek = days.filter((d) => d.done > 0).length;

    const bestDay = [...days].sort((a, b) => b.pct - a.pct || b.done - a.done)[0];

    // Weekly category totals across those 7 dates
    const dateSet = new Set(days.map((d) => d.date));
    const weekLogs = mergedLogs.filter((l) => dateSet.has(l.date));
    const catTotals = CATEGORY_ORDER.map((c) => {
      let done = 0;
      let total = 0;
      for (const wl of weekLogs) {
        for (const it of wl.items) {
          if (it.category === c.key) {
            total++;
            if (it.completed) done++;
          }
        }
      }
      return { ...c, done, total };
    });

    return {
      days,
      startDate: days[0].date,
      endDate: days[days.length - 1].date,
      totalDoneWeek,
      totalTasksWeek,
      avgPctWeek,
      perfectDaysWeek,
      productiveDaysWeek,
      bestDay,
      catTotals,
    };
  }, [currentLog.date, mergedLogs]);

  // ================= 3. GABUNGAN (SELURUH TANGGAL LAPORAN) =================
  const combinedStats = useMemo(() => {
    let totalDone = 0;
    let totalItems = 0;
    let perfectDays = 0;

    const catMap = new Map<TodoCategory, { done: number; total: number }>();
    for (const c of CATEGORY_ORDER) {
      catMap.set(c.key, { done: 0, total: 0 });
    }

    for (const log of mergedLogs) {
      const d = log.items.filter((i) => i.completed).length;
      const t = log.items.length;
      totalDone += d;
      totalItems += t;
      if (t > 0 && d === t) perfectDays++;

      for (const it of log.items) {
        const entry = catMap.get(it.category) || { done: 0, total: 0 };
        entry.total += 1;
        if (it.completed) entry.done += 1;
        catMap.set(it.category, entry);
      }
    }

    const overallPct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

    // Calculate consecutive active streak (days with >= 1 completed task from latest date backwards)
    const activeDatesDesc = mergedLogs
      .filter((l) => l.items.some((i) => i.completed))
      .map((l) => l.date)
      .sort((a, b) => b.localeCompare(a));

    let streak = 0;
    if (activeDatesDesc.length > 0) {
      streak = 1;
      let cursor = activeDatesDesc[0];
      const activeSet = new Set(activeDatesDesc);
      while (activeSet.has(shiftDateString(cursor, -1))) {
        streak++;
        cursor = shiftDateString(cursor, -1);
      }
    }

    const categoryBreakdown = CATEGORY_ORDER.map((c) => {
      const rec = catMap.get(c.key) || { done: 0, total: 0 };
      const pct = rec.total > 0 ? Math.round((rec.done / rec.total) * 100) : 0;
      return {
        category: c.key,
        color: c.color,
        done: rec.done,
        total: rec.total,
        pct,
      };
    });

    const topCategory = [...categoryBreakdown].sort((a, b) => b.done - a.done)[0];

    const execSegments: WheelSegment[] = [
      {
        id: 'all-done',
        label: 'Total Tugas Selesai',
        value: totalDone,
        color: '#166534',
        helper: `${overallPct}% dari seluruh agenda`,
      },
      {
        id: 'all-pending',
        label: 'Belum Tercapai',
        value: Math.max(0, totalItems - totalDone),
        color: '#d2d2d7',
        helper: `${100 - overallPct}% belum dicentang`,
      },
    ];

    const catSegments: WheelSegment[] = categoryBreakdown.map((c) => ({
      id: `comb-${c.category}`,
      label: c.category,
      value: c.done,
      color: c.color,
      helper: `${c.done}/${c.total} tugas (${c.pct}%)`,
    }));

    return {
      totalDays: mergedLogs.length,
      totalDone,
      totalItems,
      overallPct,
      perfectDays,
      streak,
      topCategory,
      execSegments,
      catSegments,
      categoryBreakdown,
    };
  }, [mergedLogs]);

  return (
    <div>
      {/* Top Mode & Date Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '22px',
        }}
      >
        <div>
          <span
            className="pill-badge pill-dark"
            style={{ marginBottom: '8px', letterSpacing: '0.05em', fontSize: '0.7rem' }}
          >
            PERFORMA KHUSUS TODO HARIAN
          </span>
          <h1 style={{ fontSize: 'clamp(1.55rem, 3vw, 2.1rem)', fontWeight: 700 }}>
            {activeTab === 'satuan' && 'Performa Todo Satu-Satu (Per Tanggal & Kategori)'}
            {activeTab === 'mingguan' && 'Performa Todo Mingguan (7 Hari)'}
            {activeTab === 'gabungan' && 'Performa Todo Gabungan (Seluruh Tanggal)'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Murni mengukur disiplin checklist kerja harian Anda &mdash; terpisah dari performa likes &amp; views sosmed.
          </p>
        </div>

        {/* Date Picker & Quick Back to Checklist */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              padding: '7px 11px',
              borderRadius: '16px',
              border: '1px solid var(--border-light)',
            }}
          >
            <Calendar size={15} color="#1d1d1f" />
            <button
              type="button"
              onClick={() => onChangeDate(shiftDateString(currentLog.date, -1))}
              className="btn-ghost"
              style={{ padding: '4px 6px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}
              title="Mundur 1 Hari"
            >
              <ChevronLeft size={14} />
            </button>
            <input
              type="date"
              className="apple-input tabular-num"
              style={{ width: 'auto', padding: '5px 9px', fontSize: '0.84rem' }}
              value={currentLog.date}
              onChange={(e) => {
                if (e.target.value) onChangeDate(e.target.value);
              }}
            />
            <button
              type="button"
              onClick={() => onChangeDate(shiftDateString(currentLog.date, 1))}
              className="btn-ghost"
              style={{ padding: '4px 6px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}
              title="Maju 1 Hari"
            >
              <ChevronRight size={14} />
            </button>
            {currentLog.date !== yesterdayStr && (
              <button
                type="button"
                onClick={() => onChangeDate(yesterdayStr)}
                className="btn-ghost"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              >
                Kemarin
              </button>
            )}
            {currentLog.date !== todayStr && (
              <button
                type="button"
                onClick={() => onChangeDate(todayStr)}
                className="btn-ghost"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              >
                Hari Ini
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => onChangeTab('checklist')}
            className="btn-primary"
            style={{ padding: '9px 16px', fontSize: '0.82rem' }}
          >
            <ListChecks size={15} />
            <span>Isi / Edit Checklist</span>
          </button>
        </div>
      </div>

      {/* Inline Sub-Tab Switcher Pills */}
      <div
        style={{
          display: 'inline-flex',
          flexWrap: 'wrap',
          gap: '6px',
          backgroundColor: '#ffffff',
          padding: '5px',
          borderRadius: '9999px',
          border: '1px solid var(--border-light)',
          marginBottom: '22px',
        }}
      >
        {(
          [
            { id: 'satuan', label: 'Performa Satu-Satu', icon: Target },
            { id: 'mingguan', label: 'Performa Mingguan', icon: CalendarRange },
            { id: 'gabungan', label: 'Performa Gabungan', icon: PieChart },
          ] as { id: Exclude<TodoTab, 'checklist'>; label: string; icon: React.FC<{ size?: number }> }[]
        ).map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              style={{
                padding: '7px 15px',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: selected ? '#1d1d1f' : 'transparent',
                color: selected ? '#ffffff' : 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= VIEW 1: SATU-SATU ================= */}
      {activeTab === 'satuan' && (
        <motion.div
          key="todo-perf-satuan"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          {/* 4 KPI Cards for Selected Date */}
          <div className="hero-kpi-grid">
            <div className="bento-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Skor Eksekusi ({formatDateID(currentLog.date)})
              </div>
              <div className="tabular-num" style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '6px' }}>
                {singleStats.pct}%
              </div>
              <div style={{ fontSize: '0.76rem', color: singleStats.pct === 100 ? '#166534' : 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>
                {singleStats.pct === 100 ? 'Target Harian Tuntas Penuh' : 'Persentase tugas dicentang'}
              </div>
            </div>

            <div className="bento-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Tugas Selesai
              </div>
              <div className="tabular-num" style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '6px', color: '#166534' }}>
                {singleStats.done}
                <span style={{ fontSize: '1.05rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  /{singleStats.total}
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Pekerjaan beres pada tanggal ini
              </div>
            </div>

            <div className="bento-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Belum Dikerjakan
              </div>
              <div className="tabular-num" style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '6px' }}>
                {singleStats.pending}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Agenda tersisa belum dicentang
              </div>
            </div>

            <div className="bento-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Kategori Tuntas
              </div>
              <div className="tabular-num" style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '6px' }}>
                {singleStats.activeCatFinished}
                <span style={{ fontSize: '1.05rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  /{singleStats.activeCatCount}
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Bidang kerja 100% beres
              </div>
            </div>
          </div>

          {/* 2 Interactive Wheels for Selected Date */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <InteractiveWheel
              title={`Wheel Penyelesaian — ${formatDateID(currentLog.date)}`}
              subtitle="Perbandingan tugas yang sudah dikerjakan vs belum selesai"
              segments={singleStats.statusSegments}
              centerLabel="Total Tugas"
              centerUnit={`${singleStats.pct}% Selesai`}
            />

            <InteractiveWheel
              title="Wheel Tugas Selesai per Kategori"
              subtitle="Distribusi fokus eksekusi harian per bidang kerja properti"
              segments={singleStats.categorySegments}
              centerLabel="Tugas Selesai"
              centerUnit="Item Tuntas"
            />
          </div>

          {/* Per-Category Detailed Breakdown */}
          <div className="bento-card">
            <h3 style={{ fontSize: '1.02rem', fontWeight: 700, marginBottom: '16px' }}>
              Rincian Performa Satu-Satu per Kategori ({formatDateID(currentLog.date)})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {singleStats.byCategory.map((cat) => (
                <div
                  key={cat.category}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '9999px',
                          backgroundColor: cat.color,
                        }}
                      />
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{cat.category}</span>
                    </div>
                    <span className="tabular-num" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                      {cat.done}/{cat.total} ({cat.pct}%)
                    </span>
                  </div>

                  {/* Solid Progress Bar */}
                  <div
                    style={{
                      width: '100%',
                      height: '7px',
                      backgroundColor: '#e5e5e7',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                      marginBottom: '10px',
                    }}
                  >
                    <div
                      style={{
                        width: `${cat.pct}%`,
                        height: '100%',
                        backgroundColor: cat.pct === 100 && cat.total > 0 ? '#166534' : cat.color,
                        borderRadius: '9999px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {cat.items.length === 0 ? (
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Tidak ada item di kategori ini.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {cat.items.map((it) => (
                        <div
                          key={it.id}
                          style={{
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                            color: it.completed ? 'var(--text-primary)' : 'var(--text-muted)',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <Check
                              size={12}
                              color={it.completed ? '#166534' : '#c7c7cc'}
                            />
                            <span>{it.title}</span>
                          </span>
                          {it.completed && it.completedAt && (
                            <span className="tabular-num" style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 600 }}>
                              {it.completedAt}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ================= VIEW 2: MINGGUAN (7 HARI) ================= */}
      {activeTab === 'mingguan' && (
        <motion.div
          key="todo-perf-mingguan"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          <div className="hero-kpi-grid">
            <div className="bento-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Rata-Rata Penyelesaian 7 Hari
              </div>
              <div className="tabular-num" style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '6px' }}>
                {weeklyStats.avgPctWeek}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {formatDateID(weeklyStats.startDate)} &ndash; {formatDateID(weeklyStats.endDate)}
              </div>
            </div>

            <div className="bento-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Total Tugas Selesai (7 Hari)
              </div>
              <div className="tabular-num" style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '6px', color: '#166534' }}>
                {formatNumberID(weeklyStats.totalDoneWeek)}
                <span style={{ fontSize: '1.05rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  /{formatNumberID(weeklyStats.totalTasksWeek)}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Akumulasi checklist selesai seminggu
              </div>
            </div>

            <div className="bento-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Hari Aktif &amp; Tuntas 100%
              </div>
              <div className="tabular-num" style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '6px' }}>
                {weeklyStats.productiveDaysWeek}/7
              </div>
              <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600, marginTop: '4px' }}>
                {weeklyStats.perfectDaysWeek} hari tuntas sempurna (100%)
              </div>
            </div>

            <div className="bento-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Hari Paling Produktif
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '8px' }}>
                {weeklyStats.bestDay && weeklyStats.bestDay.done > 0
                  ? formatDateID(weeklyStats.bestDay.date)
                  : 'Belum Ada Data'}
              </div>
              <div className="tabular-num" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                {weeklyStats.bestDay && weeklyStats.bestDay.done > 0
                  ? `${weeklyStats.bestDay.done}/${weeklyStats.bestDay.total} selesai (${weeklyStats.bestDay.pct}%)`
                  : 'Centang todo untuk melihat rekor'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* 7-Day Bar Chart */}
            <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 700 }}>
                  Grafik Konsistensi Todo 7 Hari
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  Klik salah satu batang tanggal untuk memilih atau mengedit tanggal tersebut
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '10px',
                  alignItems: 'end',
                  height: '210px',
                  marginTop: '24px',
                  paddingTop: '18px',
                }}
              >
                {weeklyStats.days.map((d) => {
                  const isSelected = d.date === currentLog.date;
                  const barHeight = d.total > 0 ? Math.max(8, d.pct) : 6;
                  const barColor =
                    d.pct === 100 && d.total > 0
                      ? '#166534'
                      : isSelected
                      ? '#0066cc'
                      : d.done > 0
                      ? '#1d1d1f'
                      : '#e5e5e7';

                  return (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => onChangeDate(d.date)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        height: '100%',
                        gap: '6px',
                        padding: '4px 2px',
                        borderRadius: '12px',
                        backgroundColor: isSelected ? 'var(--accent-soft)' : 'transparent',
                      }}
                      title={`${formatDateID(d.date)}: ${d.done}/${d.total} selesai (${d.pct}%)`}
                    >
                      <span className="tabular-num" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {d.total > 0 ? `${d.pct}%` : '-'}
                      </span>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '32px',
                          height: '130px',
                          backgroundColor: '#f0f0f3',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'flex-end',
                          overflow: 'hidden',
                        }}
                      >
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${barHeight}%` }}
                          transition={{ duration: 0.35 }}
                          style={{
                            width: '100%',
                            backgroundColor: barColor,
                            borderRadius: '10px',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: isSelected ? 700 : 600,
                          color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                          textAlign: 'center',
                          lineHeight: 1.15,
                        }}
                      >
                        {d.shortLabel}
                      </span>
                      <span className="tabular-num" style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                        {d.done}/{d.total}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Concentric Target Wheel for Top 3 Categories This Week */}
            <ConcentricTargetWheel
              title="Wheel Pencapaian Kategori Mingguan"
              subtitle="Penyelesaian 3 pilar utama pemasaran properti dalam 7 hari"
              rings={[
                {
                  id: 'wk-konten',
                  label: 'Konten & Sosmed',
                  current:
                    (weeklyStats.catTotals.find((c) => c.key === 'Konten')?.done || 0) +
                    (weeklyStats.catTotals.find((c) => c.key === 'Sosmed')?.done || 0),
                  target: Math.max(
                    1,
                    (weeklyStats.catTotals.find((c) => c.key === 'Konten')?.total || 0) +
                      (weeklyStats.catTotals.find((c) => c.key === 'Sosmed')?.total || 0)
                  ),
                  color: '#1d1d1f',
                  trackColor: '#ededf0',
                },
                {
                  id: 'wk-grup',
                  label: 'Grup, Iklan & Live',
                  current:
                    (weeklyStats.catTotals.find((c) => c.key === 'Grup & Iklan')?.done || 0) +
                    (weeklyStats.catTotals.find((c) => c.key === 'Live')?.done || 0),
                  target: Math.max(
                    1,
                    (weeklyStats.catTotals.find((c) => c.key === 'Grup & Iklan')?.total || 0) +
                      (weeklyStats.catTotals.find((c) => c.key === 'Live')?.total || 0)
                  ),
                  color: '#0066cc',
                  trackColor: '#e8f2ff',
                },
                {
                  id: 'wk-prospek',
                  label: 'Prospek & Survey',
                  current: weeklyStats.catTotals.find((c) => c.key === 'Prospek & Survey')?.done || 0,
                  target: Math.max(
                    1,
                    weeklyStats.catTotals.find((c) => c.key === 'Prospek & Survey')?.total || 0
                  ),
                  color: '#166534',
                  trackColor: '#eaf6ed',
                },
              ]}
            />
          </div>
        </motion.div>
      )}

      {/* ================= VIEW 3: GABUNGAN (SELURUH TANGGAL) ================= */}
      {activeTab === 'gabungan' && (
        <motion.div
          key="todo-perf-gabungan"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          {/* 4 Combined KPI Cards */}
          <div className="hero-kpi-grid">
            <div className="bento-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Skor Disiplin Gabungan
                </span>
                <CheckCircle2 size={16} color="#166534" />
              </div>
              <div className="tabular-num" style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '6px' }}>
                {combinedStats.overallPct}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Dari {combinedStats.totalDays} tanggal laporan tercatat
              </div>
            </div>

            <div className="bento-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Total Tugas Diselesaikan
                </span>
                <ListChecks size={16} color="#1d1d1f" />
              </div>
              <div className="tabular-num" style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '6px', color: '#166534' }}>
                {formatNumberID(combinedStats.totalDone)}
                <span style={{ fontSize: '1.05rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  /{formatNumberID(combinedStats.totalItems)}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Akumulasi seluruh pekerjaan tuntas
              </div>
            </div>

            <div className="bento-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Streak &amp; Hari 100%
                </span>
                <Flame size={16} color="#b45309" />
              </div>
              <div className="tabular-num" style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '6px' }}>
                {combinedStats.streak} Hari
              </div>
              <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600, marginTop: '4px' }}>
                {combinedStats.perfectDays} tanggal selesai 100%
              </div>
            </div>

            <div className="bento-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Kategori Terkuat
                </span>
                <Award size={16} color="#0066cc" />
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '8px' }}>
                {combinedStats.topCategory && combinedStats.topCategory.done > 0
                  ? combinedStats.topCategory.category
                  : 'Belum Ada'}
              </div>
              <div className="tabular-num" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                {combinedStats.topCategory && combinedStats.topCategory.done > 0
                  ? `${combinedStats.topCategory.done} tugas selesai (${combinedStats.topCategory.pct}%)`
                  : 'Centang checklist untuk mulai'}
              </div>
            </div>
          </div>

          {/* 2 Interactive Combined Wheels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <InteractiveWheel
              title="Wheel Eksekusi Todo Gabungan"
              subtitle="Rasio keseluruhan tugas selesai vs tertunda lintas semua tanggal"
              segments={combinedStats.execSegments}
              centerLabel="Semua Tugas"
              centerUnit={`${combinedStats.overallPct}% Tuntas`}
            />

            <InteractiveWheel
              title="Wheel Porsi Kategori Gabungan"
              subtitle="Kontribusi penyelesaian tugas per kategori kerja pemasaran"
              segments={combinedStats.catSegments}
              centerLabel="Total Selesai"
              centerUnit="Tugas Beres"
            />
          </div>

          {/* All Dates Todo Completion Leaderboard / Table */}
          <div className="bento-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 700 }}>
                Rekap Performa Todo per Tanggal Laporan ({mergedLogs.length})
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Klik Buka Checklist untuk edit tanggal mana saja
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mergedLogs.map((log) => {
                const d = log.items.filter((i) => i.completed).length;
                const t = log.items.length;
                const p = t > 0 ? Math.round((d / t) * 100) : 0;
                const isSelected = log.date === currentLog.date;

                return (
                  <div
                    key={log.date}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '14px',
                      backgroundColor: isSelected ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-light)',
                    }}
                  >
                    <div style={{ minWidth: '170px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        {formatDateID(log.date)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <Clock size={11} />
                        <span>{d} dari {t} tugas selesai</span>
                      </div>
                    </div>

                    <div style={{ flex: '1 1 200px', maxWidth: '360px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Progres Eksekusi</span>
                        <strong className="tabular-num" style={{ color: p === 100 && t > 0 ? '#166534' : 'var(--text-primary)' }}>
                          {p}%
                        </strong>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '7px',
                          backgroundColor: '#e5e5e7',
                          borderRadius: '9999px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${p}%`,
                            height: '100%',
                            backgroundColor: p === 100 && t > 0 ? '#166534' : '#1d1d1f',
                            borderRadius: '9999px',
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onChangeDate(log.date);
                        onChangeTab('checklist');
                      }}
                      className="btn-secondary"
                      style={{ backgroundColor: '#ffffff', padding: '7px 14px', fontSize: '0.78rem' }}
                    >
                      Buka Checklist
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
