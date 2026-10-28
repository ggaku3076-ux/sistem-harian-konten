import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, Check, Copy, Download, X } from 'lucide-react';
import { DailyContentEntry, DailyTodoLog } from '../types/content';
import { formatExecutiveReport, formatNumberID } from '../utils/storage';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: DailyContentEntry[];
  todoLogs: DailyTodoLog[];
  onShowToast?: (msg: string) => void;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  entries,
  todoLogs,
  onShowToast,
}) => {
  const [periodDays, setPeriodDays] = useState<'7d' | '30d' | 'all'>('7d');
  const [copied, setCopied] = useState(false);

  const filteredEntries = useMemo(() => {
    if (periodDays === 'all') return entries;
    const days = periodDays === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return entries.filter((e) => e.date >= cutoffStr);
  }, [entries, periodDays]);

  const periodLabel =
    periodDays === '7d'
      ? 'Laporan Eksekutif Mingguan (7 Hari)'
      : periodDays === '30d'
      ? 'Laporan Eksekutif Bulanan (30 Hari)'
      : 'Laporan Eksekutif Keseluruhan';

  const reportText = useMemo(() => {
    return formatExecutiveReport(filteredEntries, todoLogs, periodLabel);
  }, [filteredEntries, todoLogs, periodLabel]);

  // Executive KPI summary calculations
  const kpi = useMemo(() => {
    const totalContent = filteredEntries.reduce((acc, e) => acc + (e.contentCreated || 0), 0);
    const totalViews = filteredEntries.reduce((acc, e) => acc + (e.views || 0), 0);
    const totalLeads = filteredEntries.reduce(
      (acc, e) => acc + (e.hasProspect ? e.prospectTotal || 0 : 0),
      0
    );
    const totalSurveys = filteredEntries.reduce(
      (acc, e) => acc + (e.hasProspect ? e.surveyCount || 0 : 0),
      0
    );
    const totalBookings = filteredEntries.reduce(
      (acc, e) => acc + (e.hasProspect ? e.bookingCount || 0 : 0),
      0
    );
    return { totalContent, totalViews, totalLeads, totalSurveys, totalBookings };
  }, [filteredEntries]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    if (onShowToast) {
      onShowToast('Laporan eksekutif berhasil disalin');
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-eksekutif-properti-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onShowToast) {
      onShowToast('Berkas laporan eksekutif (.txt) berhasil diunduh');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(6px)',
          }}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ duration: 0.22 }}
          style={{
            position: 'relative',
            zIndex: 121,
            width: '100%',
            maxWidth: '720px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            border: '1px solid var(--border-light)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  backgroundColor: '#1d1d1f',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Briefcase size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  Generator Laporan Eksekutif
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Format resmi berkas laporan mingguan/bulanan untuk direksi atau owner developer
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              style={{ padding: '6px', borderRadius: '9999px' }}
              aria-label="Tutup modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Period Filter Selector */}
          <div
            style={{
              padding: '14px 24px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-secondary)',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Pilih Rentang Waktu:
            </span>
            <div className="segmented-group" style={{ margin: 0 }}>
              <button
                type="button"
                className={`segmented-btn ${periodDays === '7d' ? 'active' : ''}`}
                onClick={() => setPeriodDays('7d')}
              >
                7 Hari Terakhir
              </button>
              <button
                type="button"
                className={`segmented-btn ${periodDays === '30d' ? 'active' : ''}`}
                onClick={() => setPeriodDays('30d')}
              >
                30 Hari Terakhir
              </button>
              <button
                type="button"
                className={`segmented-btn ${periodDays === 'all' ? 'active' : ''}`}
                onClick={() => setPeriodDays('all')}
              >
                Semua Data
              </button>
            </div>
          </div>

          {/* KPI Strip */}
          <div
            style={{
              padding: '14px 24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '8px',
              backgroundColor: '#ffffff',
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '10px',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                Total Konten
              </span>
              <strong className="tabular-num" style={{ fontSize: '1.1rem', color: '#1d1d1f' }}>
                {formatNumberID(kpi.totalContent)}
              </strong>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '10px',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                Total Views
              </span>
              <strong className="tabular-num" style={{ fontSize: '1.1rem', color: '#1d1d1f' }}>
                {formatNumberID(kpi.totalViews)}
              </strong>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '10px',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                Leads WA
              </span>
              <strong className="tabular-num" style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>
                {formatNumberID(kpi.totalLeads)}
              </strong>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '10px',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                Janji Survey
              </span>
              <strong className="tabular-num" style={{ fontSize: '1.1rem', color: '#8b5cf6' }}>
                {formatNumberID(kpi.totalSurveys)}
              </strong>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '10px',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                Booking/Berkas
              </span>
              <strong className="tabular-num" style={{ fontSize: '1.1rem', color: '#166534' }}>
                {formatNumberID(kpi.totalBookings)}
              </strong>
            </div>
          </div>

          {/* Report Preview Textarea */}
          <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
            <label className="apple-label" style={{ marginBottom: '8px' }}>
              Pratinjau Teks Laporan
            </label>
            <textarea
              readOnly
              className="apple-input tabular-num"
              rows={14}
              value={reportText}
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '0.8rem',
                lineHeight: 1.6,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                resize: 'none',
              }}
            />
          </div>

          {/* Action Footer */}
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {filteredEntries.length} data laporan harian teranalisis
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.8rem' }}
              >
                <Download size={14} />
                <span>Unduh .TXT</span>
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.8rem' }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Tersalin!' : 'Salin Laporan (WA)'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
