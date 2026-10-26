import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  Clock,
  Film,
  Heart,
  PenSquare,
  PieChart,
  Radio,
  Share2,
  UserCheck,
} from 'lucide-react';
import { AppPage, DailyContentEntry, PerformanceTab, PeriodFilter } from '../types/content';
import {
  formatDateID,
  formatNumberID,
  getTodayDateString,
  getTotalInteractions,
  getTotalPostsPublished,
} from '../utils/storage';

interface HeroOverviewProps {
  entries: DailyContentEntry[];
  period: PeriodFilter;
  onChangePeriod: (p: PeriodFilter) => void;
  onNavigate: (page: AppPage, perfTab?: PerformanceTab) => void;
}

export const HeroOverview: React.FC<HeroOverviewProps> = ({
  entries,
  period,
  onChangePeriod,
  onNavigate,
}) => {
  const todayStr = getTodayDateString();
  const hasTodayEntry = useMemo(
    () => entries.some((e) => e.date === todayStr),
    [entries, todayStr]
  );

  const filteredEntries = useMemo(() => {
    if (period === 'all') return entries;
    if (period === 'today') return entries.filter((e) => e.date === todayStr);

    const days = period === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (days - 1));
    const y = cutoff.getFullYear();
    const m = String(cutoff.getMonth() + 1).padStart(2, '0');
    const d = String(cutoff.getDate()).padStart(2, '0');
    const cutoffStr = `${y}-${m}-${d}`;

    return entries.filter((e) => e.date >= cutoffStr);
  }, [entries, period, todayStr]);

  const stats = useMemo(() => {
    return filteredEntries.reduce(
      (acc, item) => {
        acc.contentCreated += item.contentCreated;
        acc.totalPosts += getTotalPostsPublished(item);
        acc.groupsShared += item.groupsShared;
        acc.liveDays += item.isLive ? 1 : 0;
        acc.liveMinutes += item.isLive ? item.liveDurationMinutes : 0;
        acc.views += item.views;
        acc.interactions += getTotalInteractions(item);
        acc.prospects += item.hasProspect ? item.prospectTotal : 0;
        acc.subsidiLeads += item.hasProspect ? item.prospectSubsidi : 0;
        acc.komersilLeads += item.hasProspect ? item.prospectKomersil : 0;
        acc.surveys += item.hasProspect ? item.surveyCount : 0;
        return acc;
      },
      {
        contentCreated: 0,
        totalPosts: 0,
        groupsShared: 0,
        liveDays: 0,
        liveMinutes: 0,
        views: 0,
        interactions: 0,
        prospects: 0,
        subsidiLeads: 0,
        komersilLeads: 0,
        surveys: 0,
      }
    );
  }, [filteredEntries]);

  return (
    <section
      style={{
        paddingTop: '56px',
        paddingBottom: '68px',
        backgroundColor: '#ffffff',
      }}
    >
      <div className="container">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 44px' }}
        >
          <div style={{ marginBottom: '20px' }}>
            <div className="apple-release-pill">
              <span className="apple-release-tag">PROPERTY MARKETING</span>
              <span
                style={{
                  fontSize: '0.83rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                }}
              >
                Sistem Konten Harian{' '}
                <span style={{ color: 'var(--text-muted)' }}>
                  &mdash; Rumah Subsidi &amp; Komersil
                </span>
              </span>
            </div>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
              marginBottom: '16px',
            }}
          >
            Sistem konten harian.
            <br />
            <span style={{ color: 'var(--text-muted)' }}>Ringkas, terukur, fokus closing.</span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(0.98rem, 1.7vw, 1.12rem)',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto 26px',
              lineHeight: 1.5,
            }}
          >
            Ruang kerja minimalis untuk mencatat produksi konten properti, distribusi TikTok/IG/FB,
            sebaran grup, live streaming, dan pipeline prospek KPR tanpa menumpuk di satu halaman.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('input')}
              className="btn-primary"
            >
              <span>{hasTodayEntry ? 'Edit Laporan Hari Ini' : 'Mulai Input Hari Ini'}</span>
              <ArrowRight size={16} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('performa', 'gabungan')}
              className="btn-secondary"
            >
              <PieChart size={15} />
              <span>Lihat Wheel Performa</span>
            </motion.button>

            <span
              className={`pill-badge ${hasTodayEntry ? 'pill-green' : 'pill-neutral'}`}
              style={{ padding: '10px 16px', fontSize: '0.82rem' }}
            >
              {hasTodayEntry ? (
                <>
                  <CheckCircle2 size={15} />
                  <span>{formatDateID(todayStr)} tercatat</span>
                </>
              ) : (
                <>
                  <Clock size={15} />
                  <span>{formatDateID(todayStr)} belum diinput</span>
                </>
              )}
            </span>
          </div>
        </motion.div>

        {/* Period Switcher + 4 KPI Cards */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Ringkasan Cepat ({filteredEntries.length} hari tercatat)
          </div>

          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-secondary)',
              padding: '4px',
              borderRadius: '9999px',
              border: '1px solid var(--border-light)',
              gap: '4px',
            }}
          >
            {(
              [
                { id: 'today', label: 'Hari Ini' },
                { id: '7d', label: '7 Hari' },
                { id: '30d', label: '30 Hari' },
                { id: 'all', label: 'Semua' },
              ] as { id: PeriodFilter; label: string }[]
            ).map((tab) => {
              const active = period === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onChangePeriod(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    backgroundColor: active ? '#1d1d1f' : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.18s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="kpi-grid" style={{ marginBottom: '28px' }}>
          <div className="bento-card-soft">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Konten Dibuat
              </span>
              <Film size={17} color="#1d1d1f" />
            </div>
            <div className="tabular-num" style={{ fontSize: '2.05rem', fontWeight: 700, marginBottom: '6px' }}>
              {formatNumberID(stats.contentCreated)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{formatNumberID(stats.totalPosts)}</strong> post TT, IG, FB
            </div>
          </div>

          <div className="bento-card-soft">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Sebaran Grup &amp; Live
              </span>
              <Share2 size={17} color="#1d1d1f" />
            </div>
            <div className="tabular-num" style={{ fontSize: '2.05rem', fontWeight: 700, marginBottom: '6px' }}>
              {formatNumberID(stats.groupsShared)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Radio size={13} color={stats.liveDays > 0 ? '#166534' : '#86868b'} />
              <span>
                <strong style={{ color: 'var(--text-primary)' }}>{stats.liveDays}x</strong> Live ({stats.liveMinutes} mnt)
              </span>
            </div>
          </div>

          <div className="bento-card-soft">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Interaksi Sosmed
              </span>
              <Heart size={17} color="#1d1d1f" />
            </div>
            <div className="tabular-num" style={{ fontSize: '2.05rem', fontWeight: 700, marginBottom: '6px' }}>
              {formatNumberID(stats.interactions)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Dari <strong style={{ color: 'var(--text-primary)' }}>{formatNumberID(stats.views)}</strong> tayangan
            </div>
          </div>

          <div className="bento-card-soft">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Prospek Properti
              </span>
              <UserCheck size={17} color="#0066cc" />
            </div>
            <div
              className="tabular-num"
              style={{
                fontSize: '2.05rem',
                fontWeight: 700,
                marginBottom: '6px',
                color: stats.prospects > 0 ? '#0066cc' : 'var(--text-primary)',
              }}
            >
              {formatNumberID(stats.prospects)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Sub <strong style={{ color: 'var(--text-primary)' }}>{stats.subsidiLeads}</strong> &bull; Kom{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{stats.komersilLeads}</strong> &bull; Survey{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{stats.surveys}</strong>
            </div>
          </div>
        </div>

        {/* 3 Clean Workspace Shortcut Cards */}
        <div className="insights-grid">
          <motion.div
            whileHover={{ y: -2 }}
            onClick={() => onNavigate('input')}
            className="bento-card"
            style={{ cursor: 'pointer' }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}
            >
              <PenSquare size={18} color="#1d1d1f" />
            </div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 700, marginBottom: '6px' }}>
              Input Harian Bertahap
            </h3>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Formulir rapi 3 bagian: Distribusi Sosmed/Grup, Engagement per Aplikasi, serta Live &amp; Prospek.
            </p>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              Buka Formulir <ArrowRight size={14} />
            </span>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            onClick={() => onNavigate('performa', 'satuan')}
            className="bento-card"
            style={{ cursor: 'pointer' }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}
            >
              <PieChart size={18} color="#0066cc" />
            </div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 700, marginBottom: '6px' }}>
              Wheel Performa Lengkap
            </h3>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Analisis Satu-Satu (TT/IG/FB &amp; Harian), Performa Mingguan, serta Performa Gabungan interaktif.
            </p>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              Buka Analitik <ArrowRight size={14} />
            </span>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            onClick={() => onNavigate('riwayat')}
            className="bento-card"
            style={{ cursor: 'pointer' }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}
            >
              <Archive size={18} color="#1d1d1f" />
            </div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 700, marginBottom: '6px' }}>
              Riwayat, Format WA, &amp; CSV
            </h3>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Kelola {entries.length} laporan tersimpan, salin format WA 1-klik, unduh Excel CSV, atau backup JSON.
            </p>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              Buka Riwayat <ArrowRight size={14} />
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
