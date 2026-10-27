import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Check,
  Copy,
  Download,
  Edit3,
  FileJson,
  FolderOpen,
  Radio,
  Search,
  Trash2,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import { DailyContentEntry, DailyTodoLog, PropertyCategory } from '../types/content';
import {
  calculateEngagementRate,
  formatDateID,
  formatLiveDuration,
  formatNumberID,
  getActivePlatformCount,
  getCategoryLabel,
} from '../utils/storage';

interface HistorySectionProps {
  entries: DailyContentEntry[];
  todoLogs: DailyTodoLog[];
  onEditEntry: (entry: DailyContentEntry) => void;
  onChangeEntryDate: (id: string, newDate: string) => void;
  onDeleteEntry: (id: string) => void;
  onCopyWhatsApp: (entry: DailyContentEntry) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onImportJSON: (imported: DailyContentEntry[]) => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  entries,
  todoLogs,
  onEditEntry,
  onChangeEntryDate,
  onDeleteEntry,
  onCopyWhatsApp,
  onExportCSV,
  onExportJSON,
  onImportJSON,
}) => {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [catFilter, setCatFilter] = useState<'all' | PropertyCategory>('all');
  const [flagFilter, setFlagFilter] = useState<'all' | 'prospect' | 'live'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [draftDateValue, setDraftDateValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((item) => {
      if (dateFilter && item.date !== dateFilter) return false;
      if (catFilter !== 'all' && item.propertyCategory !== catFilter) return false;
      if (flagFilter === 'prospect' && !item.hasProspect) return false;
      if (flagFilter === 'live' && !item.isLive) return false;
      if (q) {
        const hay = `${item.date} ${formatDateID(item.date)} ${item.projectName} ${item.notes} ${item.contentTypes.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, search, dateFilter, catFilter, flagFilter]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const list = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.entries)
          ? parsed.entries
          : null;
        if (list) {
          onImportJSON(list as DailyContentEntry[]);
        }
      } catch {
        // invalid json ignored cleanly
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <section
      id="riwayat"
      style={{
        paddingTop: '56px',
        paddingBottom: '72px',
        backgroundColor: 'var(--bg-secondary)',
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
              style={{ marginBottom: '10px', fontSize: '0.7rem', letterSpacing: '0.05em' }}
            >
              ARSIP TERSIMPAN
            </span>
            <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2rem)', fontWeight: 700 }}>
              Riwayat Laporan Konten Harian
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '4px' }}>
              Seluruh data tersimpan di browser Anda. Klik <strong>Edit</strong> kapan saja untuk memperbarui metrik atau prospek.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary"
              style={{ backgroundColor: '#ffffff', padding: '9px 15px', fontSize: '0.82rem' }}
            >
              <Upload size={14} />
              <span>Restore JSON</span>
            </button>
            {entries.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={onExportJSON}
                  className="btn-secondary"
                  style={{ backgroundColor: '#ffffff', padding: '9px 15px', fontSize: '0.82rem' }}
                >
                  <FileJson size={14} />
                  <span>Backup JSON</span>
                </button>
                <button
                  type="button"
                  onClick={onExportCSV}
                  className="btn-primary"
                  style={{ padding: '9px 16px', fontSize: '0.82rem' }}
                >
                  <Download size={14} />
                  <span>Unduh Excel (CSV)</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div
          className="bento-card"
          style={{
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', flex: '1 1 380px' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '340px' }}>
              <Search
                size={15}
                color="#86868b"
                style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Cari tanggal, perumahan, catatan..."
                className="apple-input"
                style={{
                  paddingLeft: '36px',
                  paddingRight: '14px',
                  paddingTop: '9px',
                  paddingBottom: '9px',
                  fontSize: '0.86rem',
                }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="date"
                aria-label="Filter Tanggal Laporan"
                className="apple-input tabular-num"
                style={{ width: 'auto', padding: '8px 10px', fontSize: '0.82rem' }}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="btn-ghost"
                  style={{ padding: '6px 10px', fontSize: '0.76rem' }}
                >
                  Semua Tgl
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            {(
              [
                { id: 'all', label: 'Semua Unit' },
                { id: 'subsidi', label: 'Subsidi' },
                { id: 'komersil', label: 'Komersil' },
                { id: 'keduanya', label: 'Keduanya' },
              ] as { id: 'all' | PropertyCategory; label: string }[]
            ).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCatFilter(c.id)}
                style={{
                  padding: '6px 13px',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: catFilter === c.id ? '#1d1d1f' : 'var(--bg-secondary)',
                  color: catFilter === c.id ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-light)',
                }}
              >
                {c.label}
              </button>
            ))}

            <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-light)' }} />

            {(
              [
                { id: 'all', label: 'Semua Status' },
                { id: 'prospect', label: 'Ada Prospek' },
                { id: 'live', label: 'Sudah Live' },
              ] as { id: 'all' | 'prospect' | 'live'; label: string }[]
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFlagFilter(f.id)}
                style={{
                  padding: '6px 13px',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: flagFilter === f.id ? '#0066cc' : 'var(--bg-secondary)',
                  color: flagFilter === f.id ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-light)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filtered.length === 0 ? (
          <div
            className="bento-card"
            style={{
              textAlign: 'center',
              padding: '56px 24px',
            }}
          >
            <FolderOpen size={34} color="#86868b" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
              {entries.length === 0
                ? 'Belum ada laporan harian yang disimpan'
                : 'Tidak ada laporan yang cocok dengan filter'}
            </h3>
            <p
              style={{
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                maxWidth: '460px',
                margin: '0 auto',
              }}
            >
              {entries.length === 0
                ? 'Isi formulir di atas lalu klik "Simpan Data Harian" untuk mulai membangun rekap pemasaran properti Anda.'
                : 'Coba ubah kata kunci pencarian atau reset filter kategori di atas.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filtered.map((entry) => {
              const activeCount = getActivePlatformCount(entry);
              const er = calculateEngagementRate(entry);
              const isConfirming = confirmDeleteId === entry.id;
              const tt = entry.engagementByPlatform.tiktok;
              const ig = entry.engagementByPlatform.instagram;
              const fb = entry.engagementByPlatform.facebook;
              const matchedTodo = todoLogs.find((t) => t.date === entry.date);
              const doneTodos = matchedTodo ? matchedTodo.items.filter((i) => i.completed) : [];

              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bento-card"
                  style={{ padding: '20px 24px' }}
                >
                  {/* Top Header Row */}
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                      {editingDateId === entry.id ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="date"
                            className="apple-input tabular-num"
                            style={{ width: 'auto', padding: '5px 9px', fontSize: '0.82rem' }}
                            value={draftDateValue}
                            onChange={(e) => setDraftDateValue(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (draftDateValue && draftDateValue !== entry.date) {
                                onChangeEntryDate(entry.id, draftDateValue);
                              }
                              setEditingDateId(null);
                            }}
                            className="btn-primary"
                            style={{ padding: '6px 11px', fontSize: '0.76rem' }}
                          >
                            Simpan Tgl
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingDateId(null)}
                            className="btn-ghost"
                            style={{ padding: '5px' }}
                            title="Batal"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                            {formatDateID(entry.date)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDateId(entry.id);
                              setDraftDateValue(entry.date);
                            }}
                            className="btn-ghost"
                            style={{
                              padding: '3px 8px',
                              fontSize: '0.73rem',
                              color: 'var(--accent)',
                              backgroundColor: 'var(--accent-soft)',
                            }}
                            title="Edit tanggal laporan ke tanggal berapapun"
                          >
                            <Calendar size={12} />
                            <span>Ubah Tgl</span>
                          </button>
                        </>
                      )}
                      <span className="pill-badge pill-neutral">
                        {getCategoryLabel(entry.propertyCategory)}
                      </span>
                      {entry.projectName && (
                        <span className="pill-badge pill-dark">{entry.projectName}</span>
                      )}
                      {entry.isLive ? (
                        <span className="pill-badge pill-green">
                          <Radio size={12} />
                          Live ({formatLiveDuration(entry.liveDurationMinutes)})
                        </span>
                      ) : (
                        <span className="pill-badge pill-neutral">Tidak Live</span>
                      )}
                      {entry.hasProspect ? (
                        <span className="pill-badge pill-blue">
                          <UserCheck size={12} />
                          {entry.prospectTotal} Prospek WA
                        </span>
                      ) : (
                        <span className="pill-badge pill-neutral">0 Prospek</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => onCopyWhatsApp(entry)}
                        className="btn-ghost"
                        title="Salin Laporan WA"
                      >
                        <Copy size={14} />
                        <span>Salin WA</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditEntry(entry)}
                        className="btn-secondary"
                        style={{ padding: '7px 14px', fontSize: '0.8rem' }}
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                      {isConfirming ? (
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteEntry(entry.id);
                            setConfirmDeleteId(null);
                          }}
                          style={{
                            padding: '7px 13px',
                            borderRadius: '9999px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            backgroundColor: 'var(--danger-bg)',
                            color: 'var(--danger-text)',
                          }}
                        >
                          Yakin Hapus?
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(entry.id)}
                          className="btn-ghost"
                          style={{ color: 'var(--text-muted)' }}
                          title="Hapus Laporan"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metrics Summary Strip */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                      gap: '10px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '16px',
                      padding: '14px 16px',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                        Konten &amp; Sosmed ({activeCount}/3)
                      </div>
                      <div className="tabular-num" style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '2px' }}>
                        {entry.contentCreated} dibuat &bull; TT({entry.platforms.tiktok.active ? entry.platforms.tiktok.posts : 0}) IG({entry.platforms.instagram.active ? entry.platforms.instagram.posts : 0}) FB({entry.platforms.facebook.active ? entry.platforms.facebook.posts : 0})
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                        Views per Sosmed
                      </div>
                      <div className="tabular-num" style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '2px' }}>
                        TT {formatNumberID(tt.views)} &bull; IG {formatNumberID(ig.views)} &bull; FB {formatNumberID(fb.views)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                        Sebaran Grup &amp; Iklan
                      </div>
                      <div className="tabular-num" style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '2px' }}>
                        {entry.groupsShared} grup &bull; {entry.marketplacePosted} marketplace
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                        Total Engagement ({er})
                      </div>
                      <div className="tabular-num" style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '2px' }}>
                        {formatNumberID(entry.views)}v &bull; {formatNumberID(entry.likes)}L / {formatNumberID(entry.comments)}C / {formatNumberID(entry.shares)}S / {formatNumberID(entry.waLinkClicks)} WA
                      </div>
                    </div>

                    {entry.hasProspect && (
                      <div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--accent)', fontWeight: 600 }}>
                          Rincian Prospek
                        </div>
                        <div
                          className="tabular-num"
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            marginTop: '2px',
                            color: 'var(--accent)',
                          }}
                        >
                          Sub:{entry.prospectSubsidi} Kom:{entry.prospectKomersil} &bull; Survey:{entry.surveyCount} Book:{entry.bookingCount}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Completed Todos for this Report Date */}
                  {doneTodos.length > 0 && (
                    <div
                      style={{
                        marginTop: '12px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Todo Selesai ({doneTodos.length}/{matchedTodo!.items.length}):
                      </span>
                      {doneTodos.map((td) => (
                        <span
                          key={td.id}
                          className="pill-badge pill-green"
                          style={{ fontSize: '0.72rem', padding: '2px 9px' }}
                        >
                          <Check size={11} />
                          {td.title}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Optional Tags & Notes */}
                  {(entry.contentTypes.length > 0 || entry.notes) && (
                    <div
                      style={{
                        marginTop: '12px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {entry.notes && (
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>Catatan:</strong>{' '}
                          {entry.notes}
                        </div>
                      )}
                      {entry.contentTypes.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {entry.contentTypes.map((ct) => (
                            <span
                              key={ct}
                              style={{
                                fontSize: '0.72rem',
                                padding: '2px 9px',
                                borderRadius: '9999px',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-muted)',
                              }}
                            >
                              {ct}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
