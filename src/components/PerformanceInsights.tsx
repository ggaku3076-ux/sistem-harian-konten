import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Film,
  PhoneCall,
  Radio,
  Share2,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import {
  DailyContentEntry,
  DailyTargets,
  PerformanceTab,
  PropertyCategory,
  SocialPlatformKey,
} from '../types/content';
import {
  calculateEngagementRate,
  formatDateID,
  formatNumberID,
  getCategoryLabel,
  getTotalInteractions,
  getTotalPostsPublished,
} from '../utils/storage';
import { ConcentricTargetWheel, InteractiveWheel } from './WheelChart';

interface PerformanceInsightsProps {
  entries: DailyContentEntry[];
  targets: DailyTargets;
  activeTab: PerformanceTab;
}

function getMondayOfWeek(offsetWeeks: number): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const day = now.getDay(); // 0 Sun .. 6 Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + offsetWeeks * 7);
  return monday;
}

function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatGrowthDelta(curr: number, prev: number): { label: string; up: boolean } {
  if (prev === 0) {
    if (curr === 0) return { label: '0% vs mgg lalu', up: true };
    return { label: '+100% baru', up: true };
  }
  const pct = Math.round(((curr - prev) / prev) * 100);
  return {
    label: `${pct >= 0 ? '+' : ''}${pct}% vs mgg lalu`,
    up: pct >= 0,
  };
}

export const PerformanceInsights: React.FC<PerformanceInsightsProps> = ({
  entries,
  targets,
  activeTab,
}) => {
  // State for "Performa Satu-Satu"
  const [singleMode, setSingleMode] = useState<'platform' | 'tanggal'>('platform');
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatformKey>('tiktok');
  const [selectedEntryId, setSelectedEntryId] = useState<string>(entries[0]?.id || '');

  // State for "Performa Mingguan"
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [weeklyBarMetric, setWeeklyBarMetric] = useState<
    'views' | 'content' | 'groups' | 'prospects'
  >('views');

  // State for "Performa Gabungan"
  const [combinedCat, setCombinedCat] = useState<'all' | PropertyCategory>('all');

  // ================= 1. PERFORMA SATU-SATU COMPUTATION =================
  const singlePlatformStats = useMemo(() => {
    const metaMap: Record<SocialPlatformKey, { name: string; color: string }> = {
      tiktok: { name: 'TikTok (TT)', color: '#1d1d1f' },
      instagram: { name: 'Instagram (IG)', color: '#0066cc' },
      facebook: { name: 'Facebook (FB)', color: '#166534' },
    };

    let posts = 0;
    let activeDays = 0;
    let views = 0;
    let likes = 0;
    let comments = 0;
    let shares = 0;
    let saves = 0;
    let waClicks = 0;
    let allPlatformsViews = 0;
    let bestDayDate = '';
    let bestDayViews = 0;

    for (const e of entries) {
      const pPost = e.platforms[selectedPlatform];
      const pEng = e.engagementByPlatform[selectedPlatform];
      if (pPost.active && pPost.posts > 0) {
        posts += pPost.posts;
        activeDays += 1;
      }
      views += pEng.views;
      likes += pEng.likes;
      comments += pEng.comments;
      shares += pEng.shares;
      saves += pEng.saves;
      waClicks += pEng.waLinkClicks;
      allPlatformsViews += e.views;

      if (pEng.views > bestDayViews) {
        bestDayViews = pEng.views;
        bestDayDate = e.date;
      }
    }

    const interactions = likes + comments + shares + saves;
    const er = views > 0 ? ((interactions / views) * 100).toFixed(1) : '0.0';
    const avgViewsPerPost = posts > 0 ? Math.round(views / posts) : 0;
    const otherViews = Math.max(0, allPlatformsViews - views);

    return {
      meta: metaMap[selectedPlatform],
      posts,
      activeDays,
      views,
      likes,
      comments,
      shares,
      saves,
      waClicks,
      interactions,
      er,
      avgViewsPerPost,
      otherViews,
      bestDayDate,
      bestDayViews,
    };
  }, [entries, selectedPlatform]);

  const inspectedSingleEntry = useMemo(() => {
    if (entries.length === 0) return null;
    return entries.find((e) => e.id === selectedEntryId) || entries[0];
  }, [entries, selectedEntryId]);

  // ================= 2. PERFORMA MINGGUAN COMPUTATION =================
  const weeklyData = useMemo(() => {
    const monday = getMondayOfWeek(weekOffset);
    const prevMonday = getMondayOfWeek(weekOffset - 1);

    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = toISODateLocal(d);
      const found = entries.find((e) => e.date === dateStr);
      return {
        dayLabel: dayNames[i],
        dateStr,
        entry: found || null,
        views: found?.views || 0,
        content: found?.contentCreated || 0,
        groups: found?.groupsShared || 0,
        prospects: found?.hasProspect ? found.prospectTotal : 0,
      };
    });

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const prevSunday = new Date(prevMonday);
    prevSunday.setDate(prevMonday.getDate() + 6);

    const startStr = toISODateLocal(monday);
    const endStr = toISODateLocal(sunday);
    const prevStartStr = toISODateLocal(prevMonday);
    const prevEndStr = toISODateLocal(prevSunday);

    const currEntries = entries.filter((e) => e.date >= startStr && e.date <= endStr);
    const prevEntries = entries.filter((e) => e.date >= prevStartStr && e.date <= prevEndStr);

    const summarize = (list: DailyContentEntry[]) =>
      list.reduce(
        (acc, e) => {
          acc.content += e.contentCreated;
          acc.groups += e.groupsShared;
          acc.views += e.views;
          acc.prospects += e.hasProspect ? e.prospectTotal : 0;
          acc.ttViews += e.engagementByPlatform.tiktok.views;
          acc.igViews += e.engagementByPlatform.instagram.views;
          acc.fbViews += e.engagementByPlatform.facebook.views;
          acc.liveSessions += e.isLive ? 1 : 0;
          return acc;
        },
        {
          content: 0,
          groups: 0,
          views: 0,
          prospects: 0,
          ttViews: 0,
          igViews: 0,
          fbViews: 0,
          liveSessions: 0,
        }
      );

    return {
      rangeLabel: `${monday.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      })} – ${sunday.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`,
      days,
      activeDaysCount: currEntries.length,
      curr: summarize(currEntries),
      prev: summarize(prevEntries),
    };
  }, [entries, weekOffset]);

  // ================= 3. PERFORMA GABUNGAN COMPUTATION =================
  const combinedData = useMemo(() => {
    const list =
      combinedCat === 'all'
        ? entries
        : entries.filter((e) => e.propertyCategory === combinedCat);

    const acc = {
      days: list.length,
      content: 0,
      posts: 0,
      groups: 0,
      marketplace: 0,
      liveCount: 0,
      liveMinutes: 0,
      ttViews: 0,
      igViews: 0,
      fbViews: 0,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      waClicks: 0,
      prospects: 0,
      subsidi: 0,
      komersil: 0,
      surveys: 0,
      bookings: 0,
    };

    for (const e of list) {
      acc.content += e.contentCreated;
      acc.posts += getTotalPostsPublished(e);
      acc.groups += e.groupsShared;
      acc.marketplace += e.marketplacePosted;
      if (e.isLive) {
        acc.liveCount += 1;
        acc.liveMinutes += e.liveDurationMinutes;
      }
      acc.ttViews += e.engagementByPlatform.tiktok.views;
      acc.igViews += e.engagementByPlatform.instagram.views;
      acc.fbViews += e.engagementByPlatform.facebook.views;
      acc.views += e.views;
      acc.likes += e.likes;
      acc.comments += e.comments;
      acc.shares += e.shares;
      acc.saves += e.saves;
      acc.waClicks += e.waLinkClicks;
      if (e.hasProspect) {
        acc.prospects += e.prospectTotal;
        acc.subsidi += e.prospectSubsidi;
        acc.komersil += e.prospectKomersil;
        acc.surveys += e.surveyCount;
        acc.bookings += e.bookingCount;
      }
    }

    const totalInter = acc.likes + acc.comments + acc.shares + acc.saves;
    const er = acc.views > 0 ? ((totalInter / acc.views) * 100).toFixed(1) : '0.0';

    return { ...acc, totalInter, er };
  }, [entries, combinedCat]);

  return (
    <section
      style={{
        paddingTop: '40px',
        paddingBottom: '72px',
        backgroundColor: 'var(--bg-secondary)',
        minHeight: 'calc(100vh - 140px)',
      }}
    >
      <div className="container">
        <AnimatePresence mode="wait">
          {/* ================================================================= */}
          {/* VIEW 1: PERFORMA SATU-SATU                                        */}
          {/* ================================================================= */}
          {activeTab === 'satuan' && (
            <motion.div
              key="perf-satuan"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <span className="pill-badge pill-dark" style={{ marginBottom: '8px', fontSize: '0.7rem' }}>
                    PERFORMA SATU-SATU
                  </span>
                  <h1 style={{ fontSize: 'clamp(1.55rem, 3vw, 2.1rem)', fontWeight: 700 }}>
                    Bedah Performa Individual
                  </h1>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Lihat kekuatan masing-masing aplikasi sosmed satu per satu atau bedah laporan per tanggal.
                  </p>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    backgroundColor: '#ffffff',
                    padding: '4px',
                    borderRadius: '9999px',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSingleMode('platform')}
                    style={{
                      padding: '7px 15px',
                      borderRadius: '9999px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      backgroundColor: singleMode === 'platform' ? '#1d1d1f' : 'transparent',
                      color: singleMode === 'platform' ? '#ffffff' : 'var(--text-secondary)',
                    }}
                  >
                    Per Sosial Media
                  </button>
                  <button
                    type="button"
                    onClick={() => setSingleMode('tanggal')}
                    style={{
                      padding: '7px 15px',
                      borderRadius: '9999px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      backgroundColor: singleMode === 'tanggal' ? '#1d1d1f' : 'transparent',
                      color: singleMode === 'tanggal' ? '#ffffff' : 'var(--text-secondary)',
                    }}
                  >
                    Per Tanggal Laporan
                  </button>
                </div>
              </div>

              {singleMode === 'platform' ? (
                <>
                  {/* Platform Selector Pills */}
                  <div className="segmented-group" style={{ maxWidth: '520px', marginBottom: '22px', backgroundColor: '#ffffff' }}>
                    {(
                      [
                        { key: 'tiktok', label: 'TikTok (TT)' },
                        { key: 'instagram', label: 'Instagram (IG)' },
                        { key: 'facebook', label: 'Facebook (FB)' },
                      ] as { key: SocialPlatformKey; label: string }[]
                    ).map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setSelectedPlatform(p.key)}
                        className={`segmented-btn ${selectedPlatform === p.key ? 'active' : ''}`}
                        style={{
                          backgroundColor: selectedPlatform === p.key ? '#1d1d1f' : 'transparent',
                          color: selectedPlatform === p.key ? '#ffffff' : 'var(--text-secondary)',
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* 4 Individual Platform KPI Cards */}
                  <div className="kpi-grid" style={{ marginBottom: '22px' }}>
                    <div className="bento-card">
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Total Views {singlePlatformStats.meta.name}
                      </span>
                      <div className="tabular-num" style={{ fontSize: '1.9rem', fontWeight: 700, margin: '8px 0 4px' }}>
                        {formatNumberID(singlePlatformStats.views)}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Rata-rata <strong>{formatNumberID(singlePlatformStats.avgViewsPerPost)}</strong> views/post
                      </span>
                    </div>

                    <div className="bento-card">
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Video / Post Tayang
                      </span>
                      <div className="tabular-num" style={{ fontSize: '1.9rem', fontWeight: 700, margin: '8px 0 4px' }}>
                        {formatNumberID(singlePlatformStats.posts)}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Aktif dalam <strong>{singlePlatformStats.activeDays}</strong> hari laporan
                      </span>
                    </div>

                    <div className="bento-card">
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Engagement Rate
                      </span>
                      <div className="tabular-num" style={{ fontSize: '1.9rem', fontWeight: 700, margin: '8px 0 4px' }}>
                        {singlePlatformStats.er}%
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Total <strong>{formatNumberID(singlePlatformStats.interactions)}</strong> interaksi
                      </span>
                    </div>

                    <div className="bento-card">
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Klik WA dari {singlePlatformStats.meta.name}
                      </span>
                      <div
                        className="tabular-num"
                        style={{ fontSize: '1.9rem', fontWeight: 700, margin: '8px 0 4px', color: '#0066cc' }}
                      >
                        {formatNumberID(singlePlatformStats.waClicks)}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {singlePlatformStats.bestDayDate
                          ? `Rekor: ${formatDateID(singlePlatformStats.bestDayDate)}`
                          : 'Belum ada rekor harian'}
                      </span>
                    </div>
                  </div>

                  {/* 2 Interactive Wheels for Selected Platform */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
                      gap: '20px',
                    }}
                  >
                    <InteractiveWheel
                      title={`Wheel Interaksi ${singlePlatformStats.meta.name}`}
                      subtitle="Klik segmen wheel untuk melihat porsi Likes, Komentar, Share, Save, & Klik WA"
                      centerLabel="Aksi User"
                      centerUnit={singlePlatformStats.meta.name}
                      segments={[
                        { id: 'likes', label: 'Likes (Suka)', value: singlePlatformStats.likes, color: '#1d1d1f' },
                        { id: 'comments', label: 'Comments (Tanya Info)', value: singlePlatformStats.comments, color: '#0066cc' },
                        { id: 'shares', label: 'Shares (Bagikan)', value: singlePlatformStats.shares, color: '#166534' },
                        { id: 'saves', label: 'Saves (Favorit)', value: singlePlatformStats.saves, color: '#d97706' },
                        { id: 'wa', label: 'Klik Link WA / DM', value: singlePlatformStats.waClicks, color: '#6e6e73' },
                      ]}
                    />

                    <InteractiveWheel
                      title={`Kontribusi Tayangan ${singlePlatformStats.meta.name}`}
                      subtitle="Perbandingan tayangan aplikasi ini dibanding gabungan sosmed lainnya"
                      centerLabel="Total Views"
                      centerUnit="Semua Sosmed"
                      segments={[
                        {
                          id: 'selected',
                          label: singlePlatformStats.meta.name,
                          value: singlePlatformStats.views,
                          color: singlePlatformStats.meta.color,
                          helper: 'Aplikasi yang sedang dipilih',
                        },
                        {
                          id: 'others',
                          label: 'Sosmed Lainnya',
                          value: singlePlatformStats.otherViews,
                          color: '#c7c7cc',
                          helper: 'Akumulasi 2 platform lainnya',
                        },
                      ]}
                    />
                  </div>
                </>
              ) : (
                /* INSPEKSI SATU-SATU PER TANGGAL */
                <div>
                  {!inspectedSingleEntry ? (
                    <div className="bento-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                      Belum ada laporan harian yang disimpan untuk dibedah per tanggal.
                    </div>
                  ) : (
                    <>
                      <div
                        className="bento-card"
                        style={{
                          marginBottom: '20px',
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '14px',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            Pilih Tanggal Laporan
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                            <select
                              className="apple-input"
                              style={{ width: 'auto', minWidth: '240px', padding: '9px 14px' }}
                              value={inspectedSingleEntry.id}
                              onChange={(e) => setSelectedEntryId(e.target.value)}
                            >
                              {entries.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {formatDateID(item.date)} — {getCategoryLabel(item.propertyCategory)}
                                </option>
                              ))}
                            </select>
                            {inspectedSingleEntry.projectName && (
                              <span className="pill-badge pill-dark">
                                {inspectedSingleEntry.projectName}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="pill-badge pill-neutral">
                            {inspectedSingleEntry.contentCreated} Konten &bull;{' '}
                            {inspectedSingleEntry.groupsShared} Grup
                          </span>
                          <span className={`pill-badge ${inspectedSingleEntry.isLive ? 'pill-green' : 'pill-neutral'}`}>
                            {inspectedSingleEntry.isLive
                              ? `Live ${inspectedSingleEntry.liveDurationMinutes}m`
                              : 'Tidak Live'}
                          </span>
                          <span className={`pill-badge ${inspectedSingleEntry.hasProspect ? 'pill-blue' : 'pill-neutral'}`}>
                            {inspectedSingleEntry.hasProspect
                              ? `${inspectedSingleEntry.prospectTotal} Prospek WA`
                              : '0 Prospek'}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
                          gap: '20px',
                        }}
                      >
                        <InteractiveWheel
                          title={`Wheel Views ${formatDateID(inspectedSingleEntry.date)}`}
                          subtitle="Porsi tayangan TikTok, Instagram, dan Facebook pada tanggal ini"
                          centerLabel="Views Harian"
                          centerUnit={`ER ${calculateEngagementRate(inspectedSingleEntry)}`}
                          segments={[
                            {
                              id: 'tt',
                              label: 'TikTok (TT)',
                              value: inspectedSingleEntry.engagementByPlatform.tiktok.views,
                              color: '#1d1d1f',
                            },
                            {
                              id: 'ig',
                              label: 'Instagram (IG)',
                              value: inspectedSingleEntry.engagementByPlatform.instagram.views,
                              color: '#0066cc',
                            },
                            {
                              id: 'fb',
                              label: 'Facebook (FB)',
                              value: inspectedSingleEntry.engagementByPlatform.facebook.views,
                              color: '#166534',
                            },
                          ]}
                        />

                        <InteractiveWheel
                          title={`Wheel Interaksi ${formatDateID(inspectedSingleEntry.date)}`}
                          subtitle="Rincian respons audiens properti pada tanggal terpilih"
                          centerLabel="Interaksi"
                          centerUnit={`${formatNumberID(getTotalInteractions(inspectedSingleEntry))} aksi`}
                          segments={[
                            { id: 'l', label: 'Likes', value: inspectedSingleEntry.likes, color: '#1d1d1f' },
                            { id: 'c', label: 'Comments', value: inspectedSingleEntry.comments, color: '#0066cc' },
                            { id: 's', label: 'Shares', value: inspectedSingleEntry.shares, color: '#166534' },
                            { id: 'sv', label: 'Saves', value: inspectedSingleEntry.saves, color: '#d97706' },
                            { id: 'wa', label: 'Klik WA', value: inspectedSingleEntry.waLinkClicks, color: '#6e6e73' },
                          ]}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* VIEW 2: PERFORMA MINGGUAN                                         */}
          {/* ================================================================= */}
          {activeTab === 'mingguan' && (
            <motion.div
              key="perf-mingguan"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <span className="pill-badge pill-dark" style={{ marginBottom: '8px', fontSize: '0.7rem' }}>
                    EVALUASI MINGGUAN
                  </span>
                  <h1 style={{ fontSize: 'clamp(1.55rem, 3vw, 2.1rem)', fontWeight: 700 }}>
                    Performa Mingguan ({weeklyData.rangeLabel})
                  </h1>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Pantau konsistensi Senin–Minggu dan pertumbuhan dibanding minggu sebelumnya.
                  </p>
                </div>

                {/* Week Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setWeekOffset((w) => w - 1)}
                    className="btn-secondary"
                    style={{ backgroundColor: '#ffffff', padding: '8px 12px' }}
                    title="Minggu Sebelumnya"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekOffset(0)}
                    className="btn-secondary"
                    style={{
                      backgroundColor: weekOffset === 0 ? '#1d1d1f' : '#ffffff',
                      color: weekOffset === 0 ? '#ffffff' : 'var(--text-primary)',
                      padding: '8px 16px',
                      fontSize: '0.82rem',
                    }}
                  >
                    Minggu Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekOffset((w) => Math.min(0, w + 1))}
                    disabled={weekOffset === 0}
                    className="btn-secondary"
                    style={{
                      backgroundColor: '#ffffff',
                      padding: '8px 12px',
                      opacity: weekOffset === 0 ? 0.4 : 1,
                    }}
                    title="Minggu Berikutnya"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* 4 Weekly KPI Cards with Growth vs Previous Week */}
              <div className="kpi-grid" style={{ marginBottom: '22px' }}>
                {[
                  {
                    label: 'Konten Minggu Ini',
                    curr: weeklyData.curr.content,
                    prev: weeklyData.prev.content,
                  },
                  {
                    label: 'Share Grup Video',
                    curr: weeklyData.curr.groups,
                    prev: weeklyData.prev.groups,
                  },
                  {
                    label: 'Views Mingguan',
                    curr: weeklyData.curr.views,
                    prev: weeklyData.prev.views,
                  },
                  {
                    label: 'Prospek WA Masuk',
                    curr: weeklyData.curr.prospects,
                    prev: weeklyData.prev.prospects,
                  },
                ].map((card) => {
                  const delta = formatGrowthDelta(card.curr, card.prev);
                  return (
                    <div key={card.label} className="bento-card">
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {card.label}
                      </span>
                      <div className="tabular-num" style={{ fontSize: '1.9rem', fontWeight: 700, margin: '8px 0 6px' }}>
                        {formatNumberID(card.curr)}
                      </div>
                      <span
                        className={`pill-badge ${delta.up ? 'pill-green' : 'pill-neutral'}`}
                        style={{ fontSize: '0.72rem', padding: '2px 9px' }}
                      >
                        {delta.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {delta.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Weekly Wheels + Mon-Sun Bar Chart */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
                  gap: '20px',
                  marginBottom: '20px',
                }}
              >
                <ConcentricTargetWheel
                  title="Wheel Target Mingguan"
                  subtitle="Pencapaian terhadap 7x target harian Anda"
                  rings={[
                    {
                      id: 'content-ring',
                      label: 'Produksi Konten',
                      current: weeklyData.curr.content,
                      target: targets.dailyContent * 7,
                      color: '#1d1d1f',
                      trackColor: '#e5e5e7',
                    },
                    {
                      id: 'group-ring',
                      label: 'Sebaran Grup Video',
                      current: weeklyData.curr.groups,
                      target: targets.dailyGroups * 7,
                      color: '#0066cc',
                      trackColor: '#e3effc',
                    },
                    {
                      id: 'active-ring',
                      label: 'Hari Konsisten Input',
                      current: weeklyData.activeDaysCount,
                      target: 7,
                      color: '#166534',
                      trackColor: '#e2f3e8',
                    },
                  ]}
                />

                <InteractiveWheel
                  title="Wheel Sosmed Minggu Ini"
                  subtitle="Kontribusi tayangan TikTok, IG, dan FB pada minggu terpilih"
                  centerLabel="Views Minggu Ini"
                  centerUnit={`${weeklyData.curr.liveSessions}x Sesi Live`}
                  segments={[
                    { id: 'w-tt', label: 'TikTok (TT)', value: weeklyData.curr.ttViews, color: '#1d1d1f' },
                    { id: 'w-ig', label: 'Instagram (IG)', value: weeklyData.curr.igViews, color: '#0066cc' },
                    { id: 'w-fb', label: 'Facebook (FB)', value: weeklyData.curr.fbViews, color: '#166534' },
                  ]}
                />
              </div>

              {/* Clean Apple Screen-Time Style Mon-Sun Daily Chart */}
              <div className="bento-card">
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '22px',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 700 }}>
                      Rincian Harian (Senin – Minggu)
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Grafik ritme aktivitas harian sepanjang minggu ini
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'inline-flex',
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '4px',
                      borderRadius: '9999px',
                      gap: '4px',
                    }}
                  >
                    {(
                      [
                        { id: 'views', label: 'Views' },
                        { id: 'content', label: 'Konten' },
                        { id: 'groups', label: 'Grup' },
                        { id: 'prospects', label: 'Prospek' },
                      ] as { id: 'views' | 'content' | 'groups' | 'prospects'; label: string }[]
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setWeeklyBarMetric(m.id)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '9999px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          backgroundColor: weeklyBarMetric === m.id ? '#1d1d1f' : 'transparent',
                          color: weeklyBarMetric === m.id ? '#ffffff' : 'var(--text-secondary)',
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(() => {
                  const maxVal = Math.max(
                    1,
                    ...weeklyData.days.map((d) => d[weeklyBarMetric])
                  );
                  return (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '10px',
                        alignItems: 'end',
                        height: '190px',
                        paddingTop: '24px',
                      }}
                    >
                      {weeklyData.days.map((d) => {
                        const val = d[weeklyBarMetric];
                        const heightPct = val > 0 ? Math.max(8, Math.round((val / maxVal) * 100)) : 4;
                        return (
                          <div
                            key={d.dateStr}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              height: '100%',
                              gap: '8px',
                            }}
                          >
                            <span
                              className="tabular-num"
                              style={{
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                color: val > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                              }}
                            >
                              {formatNumberID(val)}
                            </span>
                            <div
                              style={{
                                width: '100%',
                                maxWidth: '44px',
                                height: '120px',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'flex-end',
                                overflow: 'hidden',
                              }}
                            >
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${heightPct}%` }}
                                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                                style={{
                                  width: '100%',
                                  backgroundColor: val > 0 ? '#1d1d1f' : '#e5e5e7',
                                  borderRadius: '10px',
                                }}
                              />
                            </div>
                            <div style={{ textAlign: 'center', lineHeight: 1.15 }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{d.dayLabel}</div>
                              <div className="tabular-num" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                {d.dateStr.slice(8, 10)}/{d.dateStr.slice(5, 7)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* VIEW 3: PERFORMA GABUNGAN                                         */}
          {/* ================================================================= */}
          {activeTab === 'gabungan' && (
            <motion.div
              key="perf-gabungan"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <span className="pill-badge pill-dark" style={{ marginBottom: '8px', fontSize: '0.7rem' }}>
                    PERFORMA GABUNGAN
                  </span>
                  <h1 style={{ fontSize: 'clamp(1.55rem, 3vw, 2.1rem)', fontWeight: 700 }}>
                    Ekosistem Konten &amp; Prospek Keseluruhan
                  </h1>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Akumulasi penuh dari seluruh platform sosial media, grup, live, dan konversi properti.
                  </p>
                </div>

                {/* Property Segment Filter */}
                <div
                  style={{
                    display: 'inline-flex',
                    backgroundColor: '#ffffff',
                    padding: '4px',
                    borderRadius: '9999px',
                    border: '1px solid var(--border-light)',
                    gap: '4px',
                    flexWrap: 'wrap',
                  }}
                >
                  {(
                    [
                      { id: 'all', label: 'Semua Unit' },
                      { id: 'subsidi', label: 'Subsidi' },
                      { id: 'komersil', label: 'Komersil' },
                      { id: 'keduanya', label: 'Campuran' },
                    ] as { id: 'all' | PropertyCategory; label: string }[]
                  ).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCombinedCat(c.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: combinedCat === c.id ? '#1d1d1f' : 'transparent',
                        color: combinedCat === c.id ? '#ffffff' : 'var(--text-secondary)',
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 Interactive Combined Wheels */}
              <div className="insights-grid" style={{ marginBottom: '22px' }}>
                <InteractiveWheel
                  title="Wheel Porsi Views (TT/IG/FB)"
                  subtitle="Distribusi jangkauan video dari semua sosial media"
                  centerLabel="Total Views"
                  centerUnit={`ER ${combinedData.er}%`}
                  segments={[
                    { id: 'c-tt', label: 'TikTok (TT)', value: combinedData.ttViews, color: '#1d1d1f' },
                    { id: 'c-ig', label: 'Instagram (IG)', value: combinedData.igViews, color: '#0066cc' },
                    { id: 'c-fb', label: 'Facebook (FB)', value: combinedData.fbViews, color: '#166534' },
                  ]}
                />

                <InteractiveWheel
                  title="Wheel Komposisi Interaksi"
                  subtitle="Proporsi total respons audiens terhadap konten"
                  centerLabel="Total Aksi"
                  centerUnit={`${combinedData.days} hari laporan`}
                  segments={[
                    { id: 'c-like', label: 'Likes', value: combinedData.likes, color: '#1d1d1f' },
                    { id: 'c-com', label: 'Comments', value: combinedData.comments, color: '#0066cc' },
                    { id: 'c-shr', label: 'Shares', value: combinedData.shares, color: '#166534' },
                    { id: 'c-sav', label: 'Saves', value: combinedData.saves, color: '#d97706' },
                    { id: 'c-wa', label: 'Klik WA / DM', value: combinedData.waClicks, color: '#6e6e73' },
                  ]}
                />

                <InteractiveWheel
                  title="Wheel Prospek Properti"
                  subtitle="Perbandingan minat Rumah Subsidi vs Rumah Komersil"
                  centerLabel="Leads Segmen"
                  centerUnit={`${combinedData.bookings} Booking KPR`}
                  segments={[
                    {
                      id: 'p-sub',
                      label: 'Rumah Subsidi',
                      value: combinedData.subsidi,
                      color: '#0066cc',
                      helper: 'Segmen KPR FLPP / Subsidi',
                    },
                    {
                      id: 'p-kom',
                      label: 'Rumah Komersil',
                      value: combinedData.komersil,
                      color: '#1d1d1f',
                      helper: 'Segmen Cluster Komersil',
                    },
                    {
                      id: 'p-sur',
                      label: 'Jadwal Survey Unit',
                      value: combinedData.surveys,
                      color: '#166534',
                      helper: 'Janji temu cek lokasi',
                    },
                  ]}
                />
              </div>

              {/* Combined Executive Funnel Strip */}
              <div className="bento-card">
                <h3 style={{ fontSize: '1.02rem', fontWeight: 700, marginBottom: '16px' }}>
                  Rekap Funnel Eksekusi ke Closing Properti
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {[
                    {
                      label: 'Konten & Post',
                      val: `${formatNumberID(combinedData.content)} konten`,
                      sub: `${formatNumberID(combinedData.posts)} post tayang`,
                      icon: Film,
                    },
                    {
                      label: 'Sebaran Grup',
                      val: `${formatNumberID(combinedData.groups)} grup`,
                      sub: `${formatNumberID(combinedData.marketplace)} iklan marketplace`,
                      icon: Share2,
                    },
                    {
                      label: 'Live Streaming',
                      val: `${combinedData.liveCount} sesi`,
                      sub: `${formatNumberID(combinedData.liveMinutes)} total menit`,
                      icon: Radio,
                    },
                    {
                      label: 'Engagement',
                      val: `${formatNumberID(combinedData.totalInter)} aksi`,
                      sub: `Rata-rata ER ${combinedData.er}%`,
                      icon: Sparkles,
                    },
                    {
                      label: 'Klik WA & Leads',
                      val: `${formatNumberID(combinedData.prospects)} leads`,
                      sub: `${formatNumberID(combinedData.waClicks)} klik link WA`,
                      icon: PhoneCall,
                    },
                    {
                      label: 'Survey & Booking',
                      val: `${formatNumberID(combinedData.surveys)} survey`,
                      sub: `${formatNumberID(combinedData.bookings)} booking / berkas`,
                      icon: UserCheck,
                    },
                  ].map((f) => {
                    const Icon = f.icon;
                    return (
                      <div
                        key={f.label}
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: '16px',
                          padding: '14px',
                          border: '1px solid var(--border-light)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {f.label}
                          </span>
                          <Icon size={14} color="#86868b" />
                        </div>
                        <div className="tabular-num" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                          {f.val}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {f.sub}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
