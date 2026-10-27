import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive,
  Building2,
  CalendarRange,
  Download,
  Home,
  Layers,
  ListChecks,
  type LucideIcon,
  PenSquare,
  PieChart,
  Plus,
  Radio,
  Sparkles,
  Target,
} from 'lucide-react';
import { AppPage, InputStep, PerformanceTab } from '../types/content';

interface NavbarProps {
  activePage: AppPage;
  onChangePage: (page: AppPage) => void;
  inputStep: InputStep;
  onChangeInputStep: (step: InputStep) => void;
  perfTab: PerformanceTab;
  onChangePerfTab: (tab: PerformanceTab) => void;
  totalSaved: number;
  todayTodoBadge: string;
  onQuickInputToday: () => void;
  onExportCSV: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onChangePage,
  inputStep,
  onChangeInputStep,
  perfTab,
  onChangePerfTab,
  totalSaved,
  todayTodoBadge,
  onQuickInputToday,
  onExportCSV,
}) => {
  const mainNavItems: {
    id: AppPage;
    label: string;
    icon: LucideIcon;
    badge?: number | string;
  }[] = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'todo', label: 'Todo Harian', icon: ListChecks, badge: todayTodoBadge },
    { id: 'input', label: 'Input Harian', icon: PenSquare },
    { id: 'performa', label: 'Performa', icon: PieChart },
    { id: 'riwayat', label: 'Riwayat', icon: Archive, badge: totalSaved },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-light)',
      }}
    >
      {/* PRIMARY NAVBAR */}
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '64px',
          gap: '12px',
          flexWrap: 'wrap',
          paddingTop: '8px',
          paddingBottom: '8px',
        }}
      >
        <button
          type="button"
          onClick={() => onChangePage('beranda')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--text-primary)',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              backgroundColor: '#1d1d1f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0,
            }}
          >
            <Building2 size={17} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontWeight: 700, fontSize: '0.98rem', letterSpacing: '-0.03em' }}>
              PropPulse
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Marketing OS
            </span>
          </div>
        </button>

        {/* Page Switcher Pills */}
        <nav
          aria-label="Navigasi Utama"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'var(--bg-secondary)',
            padding: '4px',
            borderRadius: '9999px',
            border: '1px solid var(--border-light)',
            overflowX: 'auto',
          }}
        >
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangePage(item.id)}
                style={{
                  position: 'relative',
                  padding: '7px 15px',
                  borderRadius: '9999px',
                  fontSize: '0.83rem',
                  fontWeight: 600,
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  backgroundColor: isActive ? '#1d1d1f' : 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s ease',
                }}
              >
                <Icon size={14} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className="tabular-num"
                    style={{
                      padding: '1px 7px',
                      borderRadius: '9999px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#e5e5e7',
                      color: isActive ? '#ffffff' : 'var(--text-primary)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Right Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {totalSaved > 0 && (
            <button
              type="button"
              onClick={onExportCSV}
              className="btn-secondary"
              style={{ padding: '7px 13px', fontSize: '0.8rem' }}
              title="Unduh Rekap Excel / CSV"
            >
              <Download size={14} />
              <span>CSV</span>
            </button>
          )}
          {activePage !== 'input' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onQuickInputToday}
              className="btn-primary"
              style={{ padding: '8px 15px', fontSize: '0.82rem' }}
            >
              <Plus size={14} />
              <span>Input Hari Ini</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* SECONDARY MULTI-NAVBAR (SUB-SECTIONS FOR INPUT & PERFORMA) */}
      <AnimatePresence mode="wait">
        {activePage === 'input' && (
          <motion.div
            key="subnav-input"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              borderTop: '1px solid var(--border-light)',
              backgroundColor: 'rgba(245, 245, 247, 0.78)',
              overflow: 'hidden',
            }}
          >
            <div
              className="container"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                paddingTop: '8px',
                paddingBottom: '8px',
                overflowX: 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {(
                  [
                    { id: 'distribusi', label: '1. Unit & Distribusi Sosmed', icon: Layers },
                    { id: 'engagement', label: '2. Engagement TT / IG / FB', icon: Sparkles },
                    { id: 'prospek', label: '3. Live & Prospek Properti', icon: Radio },
                  ] as { id: InputStep; label: string; icon: LucideIcon }[]
                ).map((s) => {
                  const Icon = s.icon;
                  const active = inputStep === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onChangeInputStep(s.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        fontSize: '0.79rem',
                        fontWeight: 600,
                        backgroundColor: active ? '#ffffff' : 'transparent',
                        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                        border: active ? '1px solid var(--border-strong)' : '1px solid transparent',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Icon size={13} />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Formulir Bertahap &bull; Auto-Save Draft
              </span>
            </div>
          </motion.div>
        )}

        {activePage === 'performa' && (
          <motion.div
            key="subnav-performa"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              borderTop: '1px solid var(--border-light)',
              backgroundColor: 'rgba(245, 245, 247, 0.78)',
              overflow: 'hidden',
            }}
          >
            <div
              className="container"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                paddingTop: '8px',
                paddingBottom: '8px',
                overflowX: 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {(
                  [
                    { id: 'satuan', label: 'Performa Satu-Satu', icon: Target },
                    { id: 'mingguan', label: 'Performa Mingguan', icon: CalendarRange },
                    { id: 'gabungan', label: 'Performa Gabungan', icon: PieChart },
                  ] as { id: PerformanceTab; label: string; icon: LucideIcon }[]
                ).map((t) => {
                  const Icon = t.icon;
                  const active = perfTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onChangePerfTab(t.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        fontSize: '0.79rem',
                        fontWeight: 600,
                        backgroundColor: active ? '#ffffff' : 'transparent',
                        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                        border: active ? '1px solid var(--border-strong)' : '1px solid transparent',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Icon size={13} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Wheel Interaktif &bull; Klik segmen untuk detail
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
