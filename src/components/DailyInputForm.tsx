import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Building,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  Eye,
  Heart,
  Layers,
  type LucideIcon,
  MessageCircle,
  Minus,
  PhoneCall,
  Plus,
  Radio,
  RotateCcw,
  Save,
  Send,
  SlidersHorizontal,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  DailyContentEntry,
  DailyTargets,
  InputStep,
  LivePlatform,
  PlatformEngagement,
  PropertyCategory,
  SocialPlatformKey,
} from '../types/content';
import {
  CONTENT_TYPE_PRESETS,
  calculateEngagementRate,
  calculatePlatformER,
  formatDateID,
  formatLiveDuration,
  formatNumberID,
  getActivePlatformCount,
  getActivePlatformNames,
  getCategoryLabel,
  getPlatformInteractions,
  getTodayDateString,
  getTotalInteractions,
  getTotalPostsPublished,
  shiftDateString,
  syncTotalEngagement,
} from '../utils/storage';

interface DailyInputFormProps {
  form: DailyContentEntry;
  step: InputStep;
  onChangeStep: (step: InputStep) => void;
  isEditingExisting: boolean;
  existingForSelectedDate?: DailyContentEntry;
  savedProjects: string[];
  targets: DailyTargets;
  onChangeForm: (updater: (prev: DailyContentEntry) => DailyContentEntry) => void;
  onSave: () => void;
  onResetNew: () => void;
  onLoadExistingDate: (entry: DailyContentEntry) => void;
  onCopyWhatsApp: (entry: DailyContentEntry) => void;
  onUpdateTargets: (targets: DailyTargets) => void;
}

const METRIC_FIELDS: {
  key: keyof PlatformEngagement;
  label: string;
  icon: LucideIcon;
}[] = [
  { key: 'views', label: 'Views (Tayangan)', icon: Eye },
  { key: 'likes', label: 'Likes (Suka)', icon: Heart },
  { key: 'comments', label: 'Comments (Komentar)', icon: MessageCircle },
  { key: 'shares', label: 'Shares (Bagikan)', icon: Send },
  { key: 'saves', label: 'Saves (Favorit)', icon: Bookmark },
  { key: 'waLinkClicks', label: 'Klik Link WA / DM', icon: PhoneCall },
];

const PLATFORM_META: { key: SocialPlatformKey; short: string; label: string }[] = [
  { key: 'tiktok', short: 'TT', label: 'TikTok (TT)' },
  { key: 'instagram', short: 'IG', label: 'Instagram (IG)' },
  { key: 'facebook', short: 'FB', label: 'Facebook (FB)' },
];

const NumberStepper: React.FC<{
  value: number;
  onChange: (val: number) => void;
  min?: number;
  step?: number;
}> = ({ value, onChange, min = 0, step = 1 }) => {
  const safeVal = Number.isFinite(value) ? value : 0;
  return (
    <div className="stepper-box">
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(Math.max(min, safeVal - step))}
        aria-label="Kurangi"
      >
        <Minus size={15} />
      </button>
      <input
        type="number"
        min={min}
        placeholder="0"
        className="stepper-input"
        value={safeVal === 0 ? '' : safeVal}
        onChange={(e) => {
          const parsed = parseInt(e.target.value, 10);
          onChange(Number.isNaN(parsed) ? 0 : Math.max(min, parsed));
        }}
      />
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(safeVal + step)}
        aria-label="Tambah"
      >
        <Plus size={15} />
      </button>
    </div>
  );
};

export const DailyInputForm: React.FC<DailyInputFormProps> = ({
  form,
  step,
  onChangeStep,
  isEditingExisting,
  existingForSelectedDate,
  savedProjects,
  targets,
  onChangeForm,
  onSave,
  onResetNew,
  onLoadExistingDate,
  onCopyWhatsApp,
  onUpdateTargets,
}) => {
  const [showTargetConfig, setShowTargetConfig] = useState(false);
  const [activeMetricTab, setActiveMetricTab] = useState<SocialPlatformKey | 'all'>('tiktok');
  const [durationMode, setDurationMode] = useState<'menit' | 'jam_menit'>('menit');

  const activePlatformCount = getActivePlatformCount(form);
  const activePlatformNames = getActivePlatformNames(form);
  const totalPosts = getTotalPostsPublished(form);
  const totalInteractions = getTotalInteractions(form);
  const engagementRate = calculateEngagementRate(form);

  const togglePlatform = (key: SocialPlatformKey) => {
    onChangeForm((prev) => {
      const curr = prev.platforms[key];
      const nextActive = !curr.active;
      return {
        ...prev,
        platforms: {
          ...prev.platforms,
          [key]: {
            active: nextActive,
            posts: nextActive && curr.posts === 0 ? 1 : curr.posts,
          },
        },
      };
    });
  };

  const setPlatformPosts = (key: SocialPlatformKey, posts: number) => {
    onChangeForm((prev) => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [key]: {
          active: posts > 0,
          posts: Math.max(0, posts),
        },
      },
    }));
  };

  const updatePlatformMetric = (
    platformKey: SocialPlatformKey,
    metricKey: keyof PlatformEngagement,
    value: number
  ) => {
    onChangeForm((prev) => {
      const updated: DailyContentEntry = {
        ...prev,
        engagementByPlatform: {
          ...prev.engagementByPlatform,
          [platformKey]: {
            ...prev.engagementByPlatform[platformKey],
            [metricKey]: Math.max(0, value),
          },
        },
      };
      return syncTotalEngagement(updated);
    });
  };

  const toggleContentType = (label: string) => {
    onChangeForm((prev) => {
      const exists = prev.contentTypes.includes(label);
      return {
        ...prev,
        contentTypes: exists
          ? prev.contentTypes.filter((t) => t !== label)
          : [...prev.contentTypes, label],
      };
    });
  };

  const toggleLivePlatform = (platform: LivePlatform) => {
    onChangeForm((prev) => {
      const exists = prev.livePlatforms.includes(platform);
      return {
        ...prev,
        livePlatforms: exists
          ? prev.livePlatforms.filter((p) => p !== platform)
          : [...prev.livePlatforms, platform],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  };

  const contentProgress = Math.min(
    100,
    Math.round((form.contentCreated / Math.max(1, targets.dailyContent)) * 100)
  );
  const groupProgress = Math.min(
    100,
    Math.round((form.groupsShared / Math.max(1, targets.dailyGroups)) * 100)
  );

  const visibleMetricPlatforms: SocialPlatformKey[] =
    activeMetricTab === 'all' ? ['tiktok', 'instagram', 'facebook'] : [activeMetricTab];

  return (
    <section
      style={{
        paddingTop: '40px',
        paddingBottom: '68px',
        backgroundColor: 'var(--bg-secondary)',
        minHeight: 'calc(100vh - 140px)',
      }}
    >
      <div className="container">
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
            <span
              className="pill-badge pill-dark"
              style={{ marginBottom: '8px', letterSpacing: '0.05em', fontSize: '0.7rem' }}
            >
              INPUT DATA HARIAN
            </span>
            <h1 style={{ fontSize: 'clamp(1.55rem, 3vw, 2.05rem)', fontWeight: 700 }}>
              {step === 'distribusi' && 'Bagian 1 — Unit Properti & Distribusi Sosmed'}
              {step === 'engagement' && 'Bagian 2 — Metrik Engagement per Aplikasi'}
              {step === 'prospek' && 'Bagian 3 — Live Streaming & Prospek Properti'}
            </h1>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ffffff',
                padding: '7px 11px',
                borderRadius: '16px',
                border: '1px solid var(--border-light)',
              }}
            >
              <Calendar size={15} color="#1d1d1f" />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Tgl Laporan:
              </span>
              <button
                type="button"
                onClick={() =>
                  onChangeForm((prev) => ({ ...prev, date: shiftDateString(prev.date, -1) }))
                }
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
                value={form.date}
                onChange={(e) => {
                  if (e.target.value) {
                    onChangeForm((prev) => ({ ...prev, date: e.target.value }));
                  }
                }}
              />
              <button
                type="button"
                onClick={() =>
                  onChangeForm((prev) => ({ ...prev, date: shiftDateString(prev.date, 1) }))
                }
                className="btn-ghost"
                style={{ padding: '4px 6px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}
                title="Maju 1 Hari"
              >
                <ChevronRight size={14} />
              </button>
              {form.date !== getTodayDateString() && (
                <button
                  type="button"
                  onClick={() =>
                    onChangeForm((prev) => ({ ...prev, date: getTodayDateString() }))
                  }
                  className="btn-ghost"
                  style={{ padding: '4px 9px', fontSize: '0.75rem' }}
                >
                  Hari Ini
                </button>
              )}
            </div>

            {isEditingExisting && (
              <>
                <span className="pill-badge pill-blue" style={{ padding: '7px 14px' }}>
                  <Edit3 size={14} />
                  Mode Edit: {formatDateID(form.date)}
                </span>
                <button
                  type="button"
                  onClick={onResetNew}
                  className="btn-secondary"
                  style={{ backgroundColor: '#ffffff', padding: '7px 14px', fontSize: '0.82rem' }}
                >
                  Buat Baru
                </button>
              </>
            )}
          </div>
        </div>

        {/* Existing Date Banner */}
        <AnimatePresence>
          {existingForSelectedDate && existingForSelectedDate.id !== form.id && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-strong)',
                borderRadius: '18px',
                padding: '14px 20px',
                marginBottom: '20px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                <strong>Tanggal {formatDateID(form.date)} sudah memiliki data tersimpan.</strong>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>
                  Muat data tersebut agar mudah diperbarui?
                </span>
              </div>
              <button
                type="button"
                onClick={() => onLoadExistingDate(existingForSelectedDate)}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
              >
                <Edit3 size={14} />
                <span>Muat &amp; Edit Data Tanggal Ini</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="form-two-col">
          {/* LEFT COLUMN: ONLY ACTIVE STEP SHOWN SO PAGE IS CLEAN & UNCLUTTERED */}
          <AnimatePresence mode="wait">
            {step === 'distribusi' && (
              <motion.div
                key="step-distribusi"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                {/* TANGGAL & FOKUS PROPERTI */}
                <div className="bento-card">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--bg-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Calendar size={17} color="#1d1d1f" />
                      </div>
                      <div>
                        <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                          Tanggal &amp; Fokus Unit Properti
                        </h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Pilih tanggal laporan dan kategori rumah yang dipasarkan
                        </p>
                      </div>
                    </div>

                    {form.date !== getTodayDateString() && (
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() =>
                          onChangeForm((prev) => ({ ...prev, date: getTodayDateString() }))
                        }
                      >
                        Set Hari Ini
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    <div>
                      <label className="apple-label" htmlFor="entry-date">
                        Tanggal Laporan
                      </label>
                      <input
                        id="entry-date"
                        type="date"
                        required
                        className="apple-input tabular-num"
                        value={form.date}
                        onChange={(e) =>
                          onChangeForm((prev) => ({ ...prev, date: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label className="apple-label" htmlFor="project-name">
                        Nama Perumahan / Cluster (Opsional)
                      </label>
                      <input
                        id="project-name"
                        type="text"
                        placeholder="Contoh: Griya Harmoni Subsidi"
                        className="apple-input"
                        value={form.projectName}
                        onChange={(e) =>
                          onChangeForm((prev) => ({ ...prev, projectName: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  {savedProjects.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '18px',
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '4px' }}>
                        Pilih cepat:
                      </span>
                      {savedProjects.map((proj) => {
                        const selected = form.projectName === proj;
                        return (
                          <button
                            key={proj}
                            type="button"
                            onClick={() =>
                              onChangeForm((prev) => ({ ...prev, projectName: proj }))
                            }
                            style={{
                              padding: '4px 11px',
                              borderRadius: '9999px',
                              fontSize: '0.76rem',
                              fontWeight: 500,
                              backgroundColor: selected ? '#1d1d1f' : 'var(--bg-secondary)',
                              color: selected ? '#ffffff' : 'var(--text-secondary)',
                              border: '1px solid var(--border-light)',
                            }}
                          >
                            {proj}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ marginBottom: '18px' }}>
                    <span className="apple-label">Kategori Pemasaran Properti</span>
                    <div className="segmented-group">
                      {(
                        [
                          { key: 'subsidi', label: 'Rumah Subsidi' },
                          { key: 'komersil', label: 'Rumah Komersil' },
                          { key: 'keduanya', label: 'Subsidi & Komersil' },
                        ] as { key: PropertyCategory; label: string }[]
                      ).map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          className={`segmented-btn ${form.propertyCategory === item.key ? 'active' : ''}`}
                          onClick={() =>
                            onChangeForm((prev) => ({ ...prev, propertyCategory: item.key }))
                          }
                        >
                          <Building size={14} />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="apple-label">Tema / Jenis Konten Hari Ini</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {CONTENT_TYPE_PRESETS.map((preset) => {
                        const active = form.contentTypes.includes(preset);
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => toggleContentType(preset)}
                            style={{
                              padding: '7px 13px',
                              borderRadius: '9999px',
                              fontSize: '0.8rem',
                              fontWeight: 500,
                              backgroundColor: active ? '#1d1d1f' : 'var(--bg-secondary)',
                              color: active ? '#ffffff' : 'var(--text-secondary)',
                              border: active ? '1px solid #1d1d1f' : '1px solid var(--border-light)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            {active && <Check size={13} />}
                            <span>{preset}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* PRODUKSI & DISTRIBUSI SOSMED + GRUP */}
                <div className="bento-card">
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--bg-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Layers size={17} color="#1d1d1f" />
                      </div>
                      <div>
                        <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                          Produksi Konten, Sosmed (TT/IG/FB), &amp; Grup
                        </h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Berapa konten dibuat, diposting ke mana saja, dan dikirim ke berapa grup
                        </p>
                      </div>
                    </div>

                    <span className="pill-badge pill-neutral">
                      {activePlatformCount}/3 Sosmed &bull; {totalPosts} Post
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '16px',
                      marginBottom: '20px',
                    }}
                  >
                    <div>
                      <label className="apple-label">Jumlah Konten Dibuat Hari Ini</label>
                      <NumberStepper
                        value={form.contentCreated}
                        onChange={(val) =>
                          onChangeForm((prev) => ({ ...prev, contentCreated: val }))
                        }
                      />
                    </div>

                    <div>
                      <label className="apple-label">Listing FB Marketplace / Portal</label>
                      <NumberStepper
                        value={form.marketplacePosted}
                        onChange={(val) =>
                          onChangeForm((prev) => ({ ...prev, marketplacePosted: val }))
                        }
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <span className="apple-label">
                      Diposting ke Sosial Media (TikTok, Instagram, Facebook)
                    </span>
                    <div className="platform-grid">
                      {(
                        [
                          { key: 'tiktok', title: 'TikTok (TT)', subtitle: 'VT / Konten Properti' },
                          { key: 'instagram', title: 'Instagram (IG)', subtitle: 'Reels / Feed / Story' },
                          { key: 'facebook', title: 'Facebook (FB)', subtitle: 'Reels / Fanpage / Profil' },
                        ] as { key: SocialPlatformKey; title: string; subtitle: string }[]
                      ).map((plat) => {
                        const data = form.platforms[plat.key];
                        return (
                          <div
                            key={plat.key}
                            style={{
                              borderRadius: '18px',
                              padding: '16px',
                              backgroundColor: data.active ? '#ffffff' : 'var(--bg-secondary)',
                              border: data.active
                                ? '1.5px solid #1d1d1f'
                                : '1px solid var(--border-light)',
                            }}
                          >
                            <div
                              onClick={() => togglePlatform(plat.key)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                marginBottom: '12px',
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                                  {plat.title}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                  {plat.subtitle}
                                </div>
                              </div>
                              <div
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '9999px',
                                  backgroundColor: data.active ? '#1d1d1f' : '#e5e5e7',
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {data.active && <Check size={14} />}
                              </div>
                            </div>

                            <div style={{ opacity: data.active ? 1 : 0.45 }}>
                              <div
                                style={{
                                  fontSize: '0.73rem',
                                  color: 'var(--text-secondary)',
                                  marginBottom: '6px',
                                  fontWeight: 600,
                                }}
                              >
                                Jumlah Video / Post
                              </div>
                              <NumberStepper
                                value={data.active ? data.posts : 0}
                                onChange={(val) => setPlatformPosts(plat.key, val)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sebaran Grup Video */}
                  <div
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '18px',
                      padding: '16px',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        marginBottom: '10px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                          Jumlah Grup yang Sudah Dikirim Video
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Grup FB jual-beli rumah / grup komunitas WA properti
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[5, 10, 15, 25].map((inc) => (
                          <button
                            key={inc}
                            type="button"
                            onClick={() =>
                              onChangeForm((prev) => ({
                                ...prev,
                                groupsShared: prev.groupsShared + inc,
                              }))
                            }
                            style={{
                              padding: '5px 11px',
                              borderRadius: '9999px',
                              backgroundColor: '#ffffff',
                              border: '1px solid var(--border-light)',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                            }}
                          >
                            +{inc} Grup
                          </button>
                        ))}
                        {form.groupsShared > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              onChangeForm((prev) => ({ ...prev, groupsShared: 0 }))
                            }
                            style={{
                              padding: '5px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ maxWidth: '280px' }}>
                      <NumberStepper
                        value={form.groupsShared}
                        onChange={(val) =>
                          onChangeForm((prev) => ({ ...prev, groupsShared: val }))
                        }
                      />
                    </div>
                  </div>

                  {/* Step Navigation Footer */}
                  <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => onChangeStep('engagement')}
                      className="btn-primary"
                    >
                      <span>Lanjut ke Engagement TT/IG/FB</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'engagement' && (
              <motion.div
                key="step-engagement"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bento-card">
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      marginBottom: '18px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--bg-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Sparkles size={17} color="#1d1d1f" />
                      </div>
                      <div>
                        <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                          Metrik Engagement Terpisah per Aplikasi
                        </h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Salin angka dari TikTok, Instagram, dan Facebook — totalnya dijumlahkan otomatis
                        </p>
                      </div>
                    </div>

                    <span className="pill-badge pill-neutral tabular-num">
                      ER Gabungan {engagementRate} &bull; {formatNumberID(totalInteractions)} Interaksi
                    </span>
                  </div>

                  <div className="segmented-group" style={{ marginBottom: '18px', flexWrap: 'wrap' }}>
                    {PLATFORM_META.map((pm) => {
                      const pMetrics = form.engagementByPlatform[pm.key];
                      const isSelected = activeMetricTab === pm.key;
                      return (
                        <button
                          key={pm.key}
                          type="button"
                          className={`segmented-btn ${isSelected ? 'active' : ''}`}
                          onClick={() => setActiveMetricTab(pm.key)}
                        >
                          <span>{pm.label}</span>
                          <span
                            className="tabular-num"
                            style={{
                              fontSize: '0.72rem',
                              padding: '1px 7px',
                              borderRadius: '9999px',
                              backgroundColor: isSelected ? '#1d1d1f' : '#e5e5e7',
                              color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                            }}
                          >
                            {formatNumberID(pMetrics.views)}v
                          </span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className={`segmented-btn ${activeMetricTab === 'all' ? 'active' : ''}`}
                      onClick={() => setActiveMetricTab('all')}
                    >
                      <span>Tampil Semua</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {visibleMetricPlatforms.map((pKey) => {
                      const meta = PLATFORM_META.find((m) => m.key === pKey)!;
                      const pData = form.engagementByPlatform[pKey];
                      const pInter = getPlatformInteractions(pData);
                      const pEr = calculatePlatformER(pData);
                      const isPosted = form.platforms[pKey].active;

                      return (
                        <div
                          key={pKey}
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: '18px',
                            padding: '16px',
                            border: '1px solid var(--border-light)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              marginBottom: '12px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.94rem' }}>{meta.label}</span>
                              {!isPosted && (
                                <span className="pill-badge pill-amber" style={{ fontSize: '0.7rem' }}>
                                  Belum ditandai posting
                                </span>
                              )}
                            </div>
                            <span
                              className="tabular-num"
                              style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}
                            >
                              ER {meta.short}: <strong style={{ color: '#1d1d1f' }}>{pEr}</strong> ({formatNumberID(pInter)} interaksi)
                            </span>
                          </div>

                          <div className="metrics-grid">
                            {METRIC_FIELDS.map((metric) => {
                              const IconComp = metric.icon;
                              const val = pData[metric.key];
                              return (
                                <div
                                  key={metric.key}
                                  style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '14px',
                                    padding: '12px',
                                    border: '1px solid var(--border-light)',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      marginBottom: '6px',
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                      }}
                                    >
                                      {metric.label}
                                    </span>
                                    <IconComp size={13} color="#86868b" />
                                  </div>
                                  <input
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    className="apple-input tabular-num"
                                    style={{
                                      backgroundColor: 'var(--bg-secondary)',
                                      padding: '9px 11px',
                                      fontSize: '1rem',
                                      fontWeight: 700,
                                    }}
                                    value={val === 0 ? '' : val}
                                    onChange={(e) => {
                                      const parsed = Math.max(0, parseInt(e.target.value, 10) || 0);
                                      updatePlatformMetric(pKey, metric.key, parsed);
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Auto-Calculated Total Summary Strip */}
                  <div
                    style={{
                      marginTop: '16px',
                      backgroundColor: '#1d1d1f',
                      color: '#ffffff',
                      borderRadius: '18px',
                      padding: '15px 18px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: '#a1a1a6',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Total Akumulasi Otomatis (TT + IG + FB)
                      </div>
                      <div className="tabular-num" style={{ fontSize: '0.94rem', fontWeight: 700, marginTop: '3px' }}>
                        {formatNumberID(form.views)} Views &bull; {formatNumberID(form.likes)} Likes &bull;{' '}
                        {formatNumberID(form.comments)} Komen &bull; {formatNumberID(form.shares)} Share &bull;{' '}
                        {formatNumberID(form.saves)} Save &bull; {formatNumberID(form.waLinkClicks)} Klik WA
                      </div>
                    </div>
                    <span
                      className="tabular-num"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.14)',
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                    >
                      ER: {engagementRate}
                    </span>
                  </div>

                  {/* Step Navigation Footer */}
                  <div
                    style={{
                      marginTop: '22px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onChangeStep('distribusi')}
                      className="btn-secondary"
                    >
                      <ArrowLeft size={15} />
                      <span>Kembali</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeStep('prospek')}
                      className="btn-primary"
                    >
                      <span>Lanjut ke Live &amp; Prospek</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'prospek' && (
              <motion.div
                key="step-prospek"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                {/* LIVE STREAMING */}
                <div className="bento-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        backgroundColor: form.isLive ? 'var(--success-bg)' : 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Radio size={17} color={form.isLive ? '#166534' : '#1d1d1f'} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                        Sesi Live Streaming Properti
                      </h2>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Apakah hari ini melakukan Live review lokasi / Q&amp;A KPR?
                      </p>
                    </div>
                  </div>

                  <div className="segmented-group" style={{ maxWidth: '420px' }}>
                    <button
                      type="button"
                      className={`segmented-btn ${!form.isLive ? 'active' : ''}`}
                      onClick={() => onChangeForm((prev) => ({ ...prev, isLive: false }))}
                    >
                      Tidak Live
                    </button>
                    <button
                      type="button"
                      className={`segmented-btn ${form.isLive ? 'active' : ''}`}
                      onClick={() =>
                        onChangeForm((prev) => ({
                          ...prev,
                          isLive: true,
                          livePlatforms:
                            prev.livePlatforms.length === 0 ? ['TikTok'] : prev.livePlatforms,
                        }))
                      }
                    >
                      <Radio size={14} color={form.isLive ? '#166534' : 'currentColor'} />
                      <span>Sudah Live Hari Ini</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {form.isLive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div
                          style={{
                            marginTop: '18px',
                            paddingTop: '18px',
                            borderTop: '1px solid var(--border-light)',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '16px',
                          }}
                        >
                          <div>
                            <span className="apple-label">Platform Live</span>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {(['TikTok', 'Instagram', 'Facebook'] as LivePlatform[]).map((lp) => {
                                const selected = form.livePlatforms.includes(lp);
                                return (
                                  <button
                                    key={lp}
                                    type="button"
                                    onClick={() => toggleLivePlatform(lp)}
                                    style={{
                                      padding: '8px 14px',
                                      borderRadius: '9999px',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      backgroundColor: selected ? '#1d1d1f' : 'var(--bg-secondary)',
                                      color: selected ? '#ffffff' : 'var(--text-secondary)',
                                      border: '1px solid var(--border-light)',
                                    }}
                                  >
                                    {lp}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '8px',
                                gap: '8px',
                              }}
                            >
                              <span className="apple-label" style={{ marginBottom: 0 }}>
                                Durasi Live (Custom)
                              </span>
                              <div
                                style={{
                                  display: 'inline-flex',
                                  backgroundColor: 'var(--bg-secondary)',
                                  padding: '2px',
                                  borderRadius: '9999px',
                                  border: '1px solid var(--border-light)',
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => setDurationMode('menit')}
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    backgroundColor:
                                      durationMode === 'menit' ? '#1d1d1f' : 'transparent',
                                    color:
                                      durationMode === 'menit' ? '#ffffff' : 'var(--text-secondary)',
                                  }}
                                >
                                  Menit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDurationMode('jam_menit')}
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    backgroundColor:
                                      durationMode === 'jam_menit' ? '#1d1d1f' : 'transparent',
                                    color:
                                      durationMode === 'jam_menit'
                                        ? '#ffffff'
                                        : 'var(--text-secondary)',
                                  }}
                                >
                                  Jam + Menit
                                </button>
                              </div>
                            </div>

                            {durationMode === 'menit' ? (
                              <div>
                                <div style={{ position: 'relative' }}>
                                  <input
                                    type="number"
                                    min={0}
                                    placeholder="Ketik bebas (misal: 42)"
                                    className="apple-input tabular-num"
                                    style={{ paddingRight: '58px', fontWeight: 700 }}
                                    value={
                                      form.liveDurationMinutes === 0 ? '' : form.liveDurationMinutes
                                    }
                                    onChange={(e) =>
                                      onChangeForm((prev) => ({
                                        ...prev,
                                        liveDurationMinutes: Math.max(
                                          0,
                                          parseInt(e.target.value, 10) || 0
                                        ),
                                      }))
                                    }
                                  />
                                  <span
                                    style={{
                                      position: 'absolute',
                                      right: '14px',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      fontSize: '0.78rem',
                                      fontWeight: 600,
                                      color: 'var(--text-muted)',
                                      pointerEvents: 'none',
                                    }}
                                  >
                                    menit
                                  </span>
                                </div>
                                {form.liveDurationMinutes >= 60 && (
                                  <div
                                    className="tabular-num"
                                    style={{
                                      fontSize: '0.74rem',
                                      color: 'var(--text-secondary)',
                                      marginTop: '5px',
                                    }}
                                  >
                                    Setara <strong>{formatLiveDuration(form.liveDurationMinutes)}</strong>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                  <div style={{ position: 'relative' }}>
                                    <input
                                      type="number"
                                      min={0}
                                      placeholder="0"
                                      className="apple-input tabular-num"
                                      style={{ paddingRight: '42px', fontWeight: 700 }}
                                      value={
                                        Math.floor(form.liveDurationMinutes / 60) === 0
                                          ? ''
                                          : Math.floor(form.liveDurationMinutes / 60)
                                      }
                                      onChange={(e) => {
                                        const hrs = Math.max(0, parseInt(e.target.value, 10) || 0);
                                        const remMins = form.liveDurationMinutes % 60;
                                        onChangeForm((prev) => ({
                                          ...prev,
                                          liveDurationMinutes: hrs * 60 + remMins,
                                        }));
                                      }}
                                    />
                                    <span
                                      style={{
                                        position: 'absolute',
                                        right: '11px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: 'var(--text-muted)',
                                        pointerEvents: 'none',
                                      }}
                                    >
                                      jam
                                    </span>
                                  </div>
                                  <div style={{ position: 'relative' }}>
                                    <input
                                      type="number"
                                      min={0}
                                      max={59}
                                      placeholder="0"
                                      className="apple-input tabular-num"
                                      style={{ paddingRight: '42px', fontWeight: 700 }}
                                      value={
                                        form.liveDurationMinutes % 60 === 0
                                          ? ''
                                          : form.liveDurationMinutes % 60
                                      }
                                      onChange={(e) => {
                                        const mins = Math.min(
                                          59,
                                          Math.max(0, parseInt(e.target.value, 10) || 0)
                                        );
                                        const hrs = Math.floor(form.liveDurationMinutes / 60);
                                        onChangeForm((prev) => ({
                                          ...prev,
                                          liveDurationMinutes: hrs * 60 + mins,
                                        }));
                                      }}
                                    />
                                    <span
                                      style={{
                                        position: 'absolute',
                                        right: '11px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: 'var(--text-muted)',
                                        pointerEvents: 'none',
                                      }}
                                    >
                                      mnt
                                    </span>
                                  </div>
                                </div>
                                {form.liveDurationMinutes > 0 && (
                                  <div
                                    className="tabular-num"
                                    style={{
                                      fontSize: '0.74rem',
                                      color: 'var(--text-secondary)',
                                      marginTop: '5px',
                                    }}
                                  >
                                    Total <strong>{form.liveDurationMinutes} menit</strong>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="apple-label">Total / Peak Penonton Live</label>
                            <input
                              type="number"
                              min={0}
                              className="apple-input tabular-num"
                              placeholder="0"
                              value={form.liveViewers === 0 ? '' : form.liveViewers}
                              onChange={(e) =>
                                onChangeForm((prev) => ({
                                  ...prev,
                                  liveViewers: Math.max(0, parseInt(e.target.value, 10) || 0),
                                }))
                              }
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* PROSPEK & KONVERSI PROPERTI */}
                <div className="bento-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        backgroundColor: form.hasProspect ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Users size={17} color={form.hasProspect ? '#0066cc' : '#1d1d1f'} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                        Status Prospek &amp; Konversi Properti
                      </h2>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Catat leads WA masuk, minat Rumah Subsidi/Komersil, cek lokasi, hingga booking
                      </p>
                    </div>
                  </div>

                  <div className="segmented-group" style={{ maxWidth: '440px', marginBottom: '16px' }}>
                    <button
                      type="button"
                      className={`segmented-btn ${!form.hasProspect ? 'active' : ''}`}
                      onClick={() => onChangeForm((prev) => ({ ...prev, hasProspect: false }))}
                    >
                      Belum Ada Prospek
                    </button>
                    <button
                      type="button"
                      className={`segmented-btn ${form.hasProspect ? 'active' : ''}`}
                      onClick={() =>
                        onChangeForm((prev) => ({
                          ...prev,
                          hasProspect: true,
                          prospectTotal: prev.prospectTotal === 0 ? 1 : prev.prospectTotal,
                        }))
                      }
                    >
                      <Users size={14} color={form.hasProspect ? '#0066cc' : 'currentColor'} />
                      <span>Ada Prospek Masuk</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {form.hasProspect && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div
                          style={{
                            paddingTop: '16px',
                            paddingBottom: '18px',
                            borderTop: '1px solid var(--border-light)',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
                            gap: '14px',
                          }}
                        >
                          <div>
                            <label className="apple-label">Total Leads / Chat WA</label>
                            <NumberStepper
                              value={form.prospectTotal}
                              onChange={(val) =>
                                onChangeForm((prev) => ({ ...prev, prospectTotal: val }))
                              }
                            />
                          </div>
                          <div>
                            <label className="apple-label">Minat Rumah Subsidi</label>
                            <NumberStepper
                              value={form.prospectSubsidi}
                              onChange={(val) =>
                                onChangeForm((prev) => ({
                                  ...prev,
                                  prospectSubsidi: val,
                                  prospectTotal: Math.max(
                                    prev.prospectTotal,
                                    val + prev.prospectKomersil
                                  ),
                                }))
                              }
                            />
                          </div>
                          <div>
                            <label className="apple-label">Minat Rumah Komersil</label>
                            <NumberStepper
                              value={form.prospectKomersil}
                              onChange={(val) =>
                                onChangeForm((prev) => ({
                                  ...prev,
                                  prospectKomersil: val,
                                  prospectTotal: Math.max(
                                    prev.prospectTotal,
                                    prev.prospectSubsidi + val
                                  ),
                                }))
                              }
                            />
                          </div>
                          <div>
                            <label className="apple-label">Janji Survey Lokasi</label>
                            <NumberStepper
                              value={form.surveyCount}
                              onChange={(val) =>
                                onChangeForm((prev) => ({ ...prev, surveyCount: val }))
                              }
                            />
                          </div>
                          <div>
                            <label className="apple-label">Booking / Berkas KPR</label>
                            <NumberStepper
                              value={form.bookingCount}
                              onChange={(val) =>
                                onChangeForm((prev) => ({ ...prev, bookingCount: val }))
                              }
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="apple-label" htmlFor="daily-notes">
                      Catatan Prospek / Evaluasi Konten Harian (Opsional)
                    </label>
                    <textarea
                      id="daily-notes"
                      rows={3}
                      className="apple-input"
                      placeholder="Contoh: Video simulasi cicilan 1 jutaan ramai di TikTok, 2 prospek janji survey Sabtu pagi..."
                      value={form.notes}
                      onChange={(e) =>
                        onChangeForm((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  {/* Step Navigation Footer */}
                  <div
                    style={{
                      marginTop: '22px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onChangeStep('engagement')}
                      className="btn-secondary"
                    >
                      <ArrowLeft size={15} />
                      <span>Kembali ke Engagement</span>
                    </button>
                    <button type="submit" className="btn-primary">
                      <Save size={16} />
                      <span>
                        {isEditingExisting ? 'Simpan Perubahan' : 'Simpan Data Harian'}
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* RIGHT COLUMN: STICKY LIVE SUMMARY + SAVE ALWAYS ACCESSIBLE */}
          <div style={{ position: 'sticky', top: '124px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="bento-card" style={{ border: '1px solid var(--border-strong)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Pratinjau Laporan
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>
                    {formatDateID(form.date)}
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    <input
                      type="date"
                      aria-label="Edit Tanggal Laporan"
                      className="apple-input tabular-num"
                      style={{ width: 'auto', padding: '4px 8px', fontSize: '0.78rem' }}
                      value={form.date}
                      onChange={(e) => {
                        if (e.target.value) {
                          onChangeForm((prev) => ({ ...prev, date: e.target.value }));
                        }
                      }}
                    />
                  </div>
                </div>
                <span className="pill-badge pill-neutral">
                  {getCategoryLabel(form.propertyCategory)}
                </span>
              </div>

              {/* Target Progress Bars */}
              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '16px',
                  padding: '14px',
                  marginBottom: '16px',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Target Harian</span>
                  <button
                    type="button"
                    onClick={() => setShowTargetConfig((s) => !s)}
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--accent)',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <SlidersHorizontal size={12} />
                    <span>Atur</span>
                  </button>
                </div>

                {showTargetConfig && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      marginBottom: '12px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid var(--border-light)',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Konten/Hari
                      </span>
                      <input
                        type="number"
                        min={1}
                        className="apple-input tabular-num"
                        style={{ backgroundColor: '#ffffff', padding: '6px 10px', marginTop: '4px' }}
                        value={targets.dailyContent}
                        onChange={(e) =>
                          onUpdateTargets({
                            ...targets,
                            dailyContent: Math.max(1, parseInt(e.target.value, 10) || 1),
                          })
                        }
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Share Grup/Hari
                      </span>
                      <input
                        type="number"
                        min={1}
                        className="apple-input tabular-num"
                        style={{ backgroundColor: '#ffffff', padding: '6px 10px', marginTop: '4px' }}
                        value={targets.dailyGroups}
                        onChange={(e) =>
                          onUpdateTargets({
                            ...targets,
                            dailyGroups: Math.max(1, parseInt(e.target.value, 10) || 1),
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Konten Dibuat</span>
                    <span className="tabular-num" style={{ fontWeight: 700 }}>
                      {form.contentCreated}/{targets.dailyContent} ({contentProgress}%)
                    </span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#e5e5e7', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${contentProgress}%`,
                        height: '100%',
                        backgroundColor: contentProgress >= 100 ? '#166534' : '#1d1d1f',
                        borderRadius: '9999px',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Sebaran Grup</span>
                    <span className="tabular-num" style={{ fontWeight: 700 }}>
                      {form.groupsShared}/{targets.dailyGroups} ({groupProgress}%)
                    </span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#e5e5e7', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${groupProgress}%`,
                        height: '100%',
                        backgroundColor: groupProgress >= 100 ? '#166534' : '#0066cc',
                        borderRadius: '9999px',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '9px',
                  fontSize: '0.84rem',
                  marginBottom: '18px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Sosmed Aktif</span>
                  <strong className="tabular-num">
                    {activePlatformCount}/3 ({activePlatformNames.join(', ') || '-'})
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Views TT / IG / FB</span>
                  <strong className="tabular-num">
                    {formatNumberID(form.engagementByPlatform.tiktok.views)} /{' '}
                    {formatNumberID(form.engagementByPlatform.instagram.views)} /{' '}
                    {formatNumberID(form.engagementByPlatform.facebook.views)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Views &amp; ER</span>
                  <strong className="tabular-num">
                    {formatNumberID(form.views)} ({engagementRate})
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Live &amp; Prospek</span>
                  <strong className="tabular-num">
                    {form.isLive
                      ? `Live (${formatLiveDuration(form.liveDurationMinutes)})`
                      : 'No Live'}{' '}
                    &bull; {form.hasProspect ? `${form.prospectTotal} Leads` : '0 Leads'}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', padding: '13px 18px', fontSize: '0.93rem' }}
                >
                  <Save size={16} />
                  <span>{isEditingExisting ? 'Simpan Perubahan' : 'Simpan Data Harian'}</span>
                </motion.button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => onCopyWhatsApp(form)}
                    className="btn-secondary"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '0.83rem' }}
                  >
                    <Copy size={14} />
                    <span>Salin WA</span>
                  </button>
                  <button
                    type="button"
                    onClick={onResetNew}
                    className="btn-secondary"
                    style={{ padding: '10px 13px' }}
                    title="Reset Formulir"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};
