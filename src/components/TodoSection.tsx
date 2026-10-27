import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookmarkCheck,
  Calendar,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Edit3,
  ListChecks,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { DailyTodoLog, TodoCategory, TodoItem } from '../types/content';
import { formatDateID, getTodayDateString, shiftDateString } from '../utils/storage';

interface TodoSectionProps {
  currentLog: DailyTodoLog;
  allLogs: DailyTodoLog[];
  onChangeDate: (date: string) => void;
  onMoveLogDate: (oldDate: string, newDate: string) => void;
  onCopyLogToDate: (sourceLog: DailyTodoLog, targetDate: string) => void;
  onUpdateCurrentLog: (updater: (prev: DailyTodoLog) => DailyTodoLog) => void;
  onSaveLog: () => void;
  onSaveAsTemplate: () => void;
  onCopyTodoWA: (log: DailyTodoLog) => void;
  onDeleteLogDate: (date: string) => void;
}

const TODO_CATEGORIES: TodoCategory[] = [
  'Konten',
  'Sosmed',
  'Grup & Iklan',
  'Live',
  'Prospek & Survey',
  'Lainnya',
];

function getNowTimeHHMM(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export const TodoSection: React.FC<TodoSectionProps> = ({
  currentLog,
  allLogs,
  onChangeDate,
  onMoveLogDate,
  onCopyLogToDate,
  onUpdateCurrentLog,
  onSaveLog,
  onSaveAsTemplate,
  onCopyTodoWA,
  onDeleteLogDate,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TodoCategory>('Konten');
  const [statusFilter, setStatusFilter] = useState<'all' | 'done' | 'pending'>('all');

  // State for editing/moving the current report's date to ANY date
  const [isEditingReportDate, setIsEditingReportDate] = useState(false);
  const [draftReportDate, setDraftReportDate] = useState(currentLog.date);

  // State for inline editing an archive item's date
  const [editingArchiveDate, setEditingArchiveDate] = useState<string | null>(null);
  const [archiveDraftDate, setArchiveDraftDate] = useState('');

  // State for inline editing a todo task title
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemTitle, setEditingItemTitle] = useState('');

  useEffect(() => {
    setDraftReportDate(currentLog.date);
    setIsEditingReportDate(false);
  }, [currentLog.date]);

  const todayStr = getTodayDateString();
  const yesterdayStr = shiftDateString(todayStr, -1);

  const completedItems = useMemo(
    () => currentLog.items.filter((i) => i.completed),
    [currentLog.items]
  );
  const totalCount = currentLog.items.length;
  const doneCount = completedItems.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const filteredItems = useMemo(() => {
    if (statusFilter === 'done') return currentLog.items.filter((i) => i.completed);
    if (statusFilter === 'pending') return currentLog.items.filter((i) => !i.completed);
    return currentLog.items;
  }, [currentLog.items, statusFilter]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const item: TodoItem = {
      id: `todo-${currentLog.date}-${Date.now()}`,
      title: trimmed,
      category: newCategory,
      completed: false,
    };
    onUpdateCurrentLog((prev) => ({
      ...prev,
      items: [...prev.items, item],
      updatedAt: new Date().toISOString(),
    }));
    setNewTitle('');
  };

  const toggleItem = (id: string) => {
    const timeStr = getNowTimeHHMM();
    onUpdateCurrentLog((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id
          ? {
              ...item,
              completed: !item.completed,
              completedAt: !item.completed ? timeStr : undefined,
            }
          : item
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  const saveEditedItemTitle = (id: string) => {
    const trimmed = editingItemTitle.trim();
    if (!trimmed) {
      setEditingItemId(null);
      return;
    }
    onUpdateCurrentLog((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, title: trimmed } : item
      ),
      updatedAt: new Date().toISOString(),
    }));
    setEditingItemId(null);
  };

  const deleteItem = (id: string) => {
    onUpdateCurrentLog((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
      updatedAt: new Date().toISOString(),
    }));
  };

  const toggleAll = () => {
    const allDone = totalCount > 0 && doneCount === totalCount;
    const timeStr = getNowTimeHHMM();
    onUpdateCurrentLog((prev) => ({
      ...prev,
      items: prev.items.map((item) => ({
        ...item,
        completed: !allDone,
        completedAt: !allDone ? item.completedAt || timeStr : undefined,
      })),
      updatedAt: new Date().toISOString(),
    }));
  };

  // Ring SVG geometry for right summary
  const ringSize = 112;
  const ringStroke = 10;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDash = (pct / 100) * ringCircumference;

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
        {/* Header + Bebas Pilih / Geser Tanggal Laporan Berapapun */}
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
              CHECKLIST EKSEKUSI HARIAN
            </span>
            <h1 style={{ fontSize: 'clamp(1.55rem, 3vw, 2.1rem)', fontWeight: 700 }}>
              Todo List Harian &amp; Tanggal Laporan
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '4px' }}>
              Pilih atau edit ke tanggal berapapun (mundur, hari ini, maupun maju) sesuai kebutuhan laporan.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              padding: '8px 12px',
              borderRadius: '18px',
              border: '1px solid var(--border-light)',
            }}
          >
            <Calendar size={16} color="#1d1d1f" />
            <span style={{ fontSize: '0.79rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Pilih Tgl:
            </span>

            <button
              type="button"
              onClick={() => onChangeDate(shiftDateString(currentLog.date, -1))}
              className="btn-ghost"
              style={{ padding: '5px 7px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}
              title="Mundur 1 Hari"
            >
              <ChevronLeft size={15} />
            </button>

            <input
              type="date"
              className="apple-input tabular-num"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
              value={currentLog.date}
              onChange={(e) => {
                if (e.target.value) onChangeDate(e.target.value);
              }}
            />

            <button
              type="button"
              onClick={() => onChangeDate(shiftDateString(currentLog.date, 1))}
              className="btn-ghost"
              style={{ padding: '5px 7px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}
              title="Maju 1 Hari"
            >
              <ChevronRight size={15} />
            </button>

            <button
              type="button"
              onClick={() => onChangeDate(yesterdayStr)}
              className="btn-ghost"
              style={{
                padding: '5px 10px',
                fontSize: '0.76rem',
                backgroundColor: currentLog.date === yesterdayStr ? '#1d1d1f' : 'transparent',
                color: currentLog.date === yesterdayStr ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              Kemarin
            </button>

            <button
              type="button"
              onClick={() => onChangeDate(todayStr)}
              className="btn-ghost"
              style={{
                padding: '5px 10px',
                fontSize: '0.76rem',
                backgroundColor: currentLog.date === todayStr ? '#1d1d1f' : 'transparent',
                color: currentLog.date === todayStr ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              Hari Ini
            </button>
          </div>
        </div>

        <div className="form-two-col">
          {/* LEFT COLUMN: ADD TASK + INTERACTIVE CHECKLIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Add New Todo Card */}
            <form onSubmit={handleAddItem} className="bento-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9px',
                    backgroundColor: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={16} color="#1d1d1f" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
                    Tambah Agenda / Pekerjaan ({formatDateID(currentLog.date)})
                  </h2>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '10px',
                  marginBottom: '12px',
                }}
              >
                <input
                  type="text"
                  placeholder="Ketik aktivitas (misal: Take video blok B / Follow-up berkas KPR)..."
                  className="apple-input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <button type="submit" className="btn-primary" style={{ padding: '0 20px' }}>
                  <Plus size={16} />
                  <span>Tambah</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '4px' }}>
                  Kategori:
                </span>
                {TODO_CATEGORIES.map((cat) => {
                  const selected = newCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      style={{
                        padding: '5px 11px',
                        borderRadius: '9999px',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        backgroundColor: selected ? '#1d1d1f' : 'var(--bg-secondary)',
                        color: selected ? '#ffffff' : 'var(--text-secondary)',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </form>

            {/* Checklist Card */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ListChecks size={18} color="#1d1d1f" />
                  <h2 style={{ fontSize: '1.03rem', fontWeight: 700 }}>
                    Daftar Tugas &mdash; {formatDateID(currentLog.date)}
                  </h2>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(
                    [
                      { id: 'all', label: `Semua (${totalCount})` },
                      { id: 'done', label: `Sudah (${doneCount})` },
                      { id: 'pending', label: `Belum (${totalCount - doneCount})` },
                    ] as { id: 'all' | 'done' | 'pending'; label: string }[]
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        fontSize: '0.77rem',
                        fontWeight: 600,
                        backgroundColor:
                          statusFilter === tab.id ? '#1d1d1f' : 'var(--bg-secondary)',
                        color: statusFilter === tab.id ? '#ffffff' : 'var(--text-secondary)',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredItems.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '36px 16px',
                    color: 'var(--text-muted)',
                    fontSize: '0.88rem',
                  }}
                >
                  Tidak ada daftar tugas pada filter ini.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <AnimatePresence initial={false}>
                    {filteredItems.map((item) => {
                      const isEditingThis = editingItemId === item.id;
                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            padding: '13px 16px',
                            borderRadius: '16px',
                            backgroundColor: item.completed ? '#fbfbfd' : 'var(--bg-secondary)',
                            border: item.completed
                              ? '1px solid var(--success-border)'
                              : '1px solid var(--border-light)',
                          }}
                        >
                          {isEditingThis ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                              <input
                                type="text"
                                className="apple-input"
                                style={{ backgroundColor: '#ffffff', padding: '7px 12px', fontSize: '0.88rem' }}
                                value={editingItemTitle}
                                autoFocus
                                onChange={(e) => setEditingItemTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditedItemTitle(item.id);
                                  if (e.key === 'Escape') setEditingItemId(null);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => saveEditedItemTitle(item.id)}
                                className="btn-primary"
                                style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                              >
                                Simpan
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingItemId(null)}
                                className="btn-ghost"
                                style={{ padding: '6px' }}
                              >
                                <X size={15} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div
                                onClick={() => toggleItem(item.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  cursor: 'pointer',
                                  flex: 1,
                                }}
                              >
                                <div
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '9999px',
                                    backgroundColor: item.completed ? '#166534' : '#ffffff',
                                    border: item.completed
                                      ? '1.5px solid #166534'
                                      : '1.5px solid var(--border-strong)',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'all 0.16s ease',
                                  }}
                                >
                                  {item.completed && <Check size={14} />}
                                </div>

                                <div style={{ flex: 1 }}>
                                  <div
                                    style={{
                                      fontSize: '0.92rem',
                                      fontWeight: 600,
                                      color: item.completed
                                        ? 'var(--text-muted)'
                                        : 'var(--text-primary)',
                                      textDecoration: item.completed ? 'line-through' : 'none',
                                    }}
                                  >
                                    {item.title}
                                  </div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      marginTop: '3px',
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        backgroundColor: '#ffffff',
                                        padding: '1px 8px',
                                        borderRadius: '9999px',
                                        border: '1px solid var(--border-light)',
                                      }}
                                    >
                                      {item.category}
                                    </span>
                                    {item.completed && item.completedAt && (
                                      <span
                                        className="tabular-num"
                                        style={{
                                          fontSize: '0.72rem',
                                          color: 'var(--success-text)',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px',
                                          fontWeight: 600,
                                        }}
                                      >
                                        <Clock size={11} />
                                        Selesai {item.completedAt}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingItemId(item.id);
                                    setEditingItemTitle(item.title);
                                  }}
                                  className="btn-ghost"
                                  style={{ padding: '6px', color: 'var(--text-muted)' }}
                                  title="Edit nama tugas"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteItem(item.id)}
                                  className="btn-ghost"
                                  style={{ padding: '6px', color: 'var(--text-muted)' }}
                                  title="Hapus item"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              {/* Bottom Quick Actions & Notes */}
              <div
                style={{
                  marginTop: '18px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-light)',
                }}
              >
                <label className="apple-label" htmlFor="todo-notes">
                  Catatan Tambahan Tanggal Ini (Opsional)
                </label>
                <textarea
                  id="todo-notes"
                  rows={2}
                  placeholder="Contoh: Besok pagi lanjut ambil video rumah contoh tipe 36/60..."
                  className="apple-input"
                  style={{ resize: 'vertical', marginBottom: '14px' }}
                  value={currentLog.notes}
                  onChange={(e) =>
                    onUpdateCurrentLog((prev) => ({
                      ...prev,
                      notes: e.target.value,
                      updatedAt: new Date().toISOString(),
                    }))
                  }
                />

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                    >
                      <CheckCheck size={14} />
                      <span>{doneCount === totalCount && totalCount > 0 ? 'Batal Centang Semua' : 'Centang Semua'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={onSaveAsTemplate}
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                      title="Gunakan daftar item ini sebagai standar otomatis untuk tanggal baru"
                    >
                      <BookmarkCheck size={14} />
                      <span>Jadikan Template Rutin</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SUMMARY + EDIT TANGGAL BERAPAPUN + ARCHIVE */}
          <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="bento-card" style={{ border: '1px solid var(--border-strong)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '14px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      Tanggal Laporan
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftReportDate(currentLog.date);
                        setIsEditingReportDate((v) => !v);
                      }}
                      className="btn-ghost"
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        color: 'var(--accent)',
                        backgroundColor: 'var(--accent-soft)',
                      }}
                    >
                      <Edit3 size={11} />
                      <span>{isEditingReportDate ? 'Tutup' : 'Edit Tanggal'}</span>
                    </button>
                  </div>

                  <div style={{ fontSize: '1.12rem', fontWeight: 700, marginTop: '3px' }}>
                    {formatDateID(currentLog.date)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <strong>{doneCount}</strong> dari <strong>{totalCount}</strong> tugas selesai
                  </div>
                </div>

                {/* Progress Wheel */}
                <div style={{ position: 'relative', width: ringSize, height: ringSize, flexShrink: 0 }}>
                  <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
                    <circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={ringRadius}
                      fill="none"
                      stroke="#ededf0"
                      strokeWidth={ringStroke}
                    />
                    {pct > 0 && (
                      <motion.circle
                        cx={ringSize / 2}
                        cy={ringSize / 2}
                        r={ringRadius}
                        fill="none"
                        stroke={pct === 100 ? '#166534' : '#1d1d1f'}
                        strokeWidth={ringStroke}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                        initial={{ strokeDasharray: `0 ${ringCircumference}` }}
                        animate={{ strokeDasharray: `${ringDash} ${ringCircumference}` }}
                        transition={{ duration: 0.45 }}
                      />
                    )}
                  </svg>
                  <div
                    className="tabular-num"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                    }}
                  >
                    {pct}%
                  </div>
                </div>
              </div>

              {/* Panel Edit / Pindah Tanggal Laporan ke Tanggal Berapapun */}
              <AnimatePresence>
                {isEditingReportDate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '14px',
                        padding: '12px',
                        marginBottom: '14px',
                        border: '1px solid var(--border-strong)',
                      }}
                    >
                      <div style={{ fontSize: '0.77rem', fontWeight: 700, marginBottom: '6px' }}>
                        Ubah / Salin Checklist Ini ke Tanggal Berapapun:
                      </div>
                      <input
                        type="date"
                        className="apple-input tabular-num"
                        style={{ backgroundColor: '#ffffff', padding: '8px 10px', marginBottom: '8px' }}
                        value={draftReportDate}
                        onChange={(e) => setDraftReportDate(e.target.value)}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <button
                          type="button"
                          disabled={!draftReportDate || draftReportDate === currentLog.date}
                          onClick={() => {
                            if (draftReportDate && draftReportDate !== currentLog.date) {
                              onMoveLogDate(currentLog.date, draftReportDate);
                              setIsEditingReportDate(false);
                            }
                          }}
                          className="btn-primary"
                          style={{
                            padding: '8px 10px',
                            fontSize: '0.76rem',
                            opacity: !draftReportDate || draftReportDate === currentLog.date ? 0.45 : 1,
                          }}
                        >
                          Ubah Tanggal
                        </button>
                        <button
                          type="button"
                          disabled={!draftReportDate || draftReportDate === currentLog.date}
                          onClick={() => {
                            if (draftReportDate && draftReportDate !== currentLog.date) {
                              onCopyLogToDate(currentLog, draftReportDate);
                              setIsEditingReportDate(false);
                            }
                          }}
                          className="btn-secondary"
                          style={{
                            padding: '8px 10px',
                            fontSize: '0.76rem',
                            backgroundColor: '#ffffff',
                            opacity: !draftReportDate || draftReportDate === currentLog.date ? 0.45 : 1,
                          }}
                        >
                          Salin ke Tanggal
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Recap List: Hari Ini Sudah Apa Saja */}
              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '16px',
                  padding: '14px',
                  marginBottom: '16px',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '8px' }}>
                  Sudah Dikerjakan ({doneCount}):
                </div>
                {completedItems.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Belum ada aktivitas yang dicentang pada tanggal ini.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {completedItems.map((done) => (
                      <div
                        key={done.id}
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '6px',
                        }}
                      >
                        <Check size={13} color="#166534" style={{ marginTop: '3px', flexShrink: 0 }} />
                        <span>{done.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onSaveLog}
                  className="btn-primary"
                  style={{ width: '100%', padding: '13px 18px' }}
                >
                  <Save size={16} />
                  <span>Simpan Todo ({formatDateID(currentLog.date)})</span>
                </motion.button>

                <button
                  type="button"
                  onClick={() => onCopyTodoWA(currentLog)}
                  className="btn-secondary"
                  style={{ width: '100%', padding: '10px 14px', fontSize: '0.84rem' }}
                >
                  <Copy size={14} />
                  <span>Salin Laporan Todo ke WA</span>
                </button>
              </div>
            </div>

            {/* Saved Todo History by Report Date (with Inline Edit Tanggal) */}
            <div className="bento-card">
              <h3 style={{ fontSize: '0.94rem', fontWeight: 700, marginBottom: '12px' }}>
                Arsip Todo per Tanggal Laporan ({allLogs.length})
              </h3>
              {allLogs.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Klik Simpan Todo untuk menyimpan arsip harian per tanggal laporan.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                  {allLogs.map((log) => {
                    const dCount = log.items.filter((i) => i.completed).length;
                    const tCount = log.items.length;
                    const isCurrent = log.date === currentLog.date;
                    const isEditingThisArch = editingArchiveDate === log.date;

                    return (
                      <div
                        key={log.date}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          padding: '9px 12px',
                          borderRadius: '12px',
                          backgroundColor: isCurrent ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                          border: isCurrent
                            ? '1px solid var(--accent)'
                            : '1px solid var(--border-light)',
                        }}
                      >
                        {isEditingThisArch ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="date"
                              className="apple-input tabular-num"
                              style={{ backgroundColor: '#ffffff', padding: '5px 8px', fontSize: '0.8rem' }}
                              value={archiveDraftDate}
                              onChange={(e) => setArchiveDraftDate(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (archiveDraftDate && archiveDraftDate !== log.date) {
                                  onMoveLogDate(log.date, archiveDraftDate);
                                }
                                setEditingArchiveDate(null);
                              }}
                              className="btn-primary"
                              style={{ padding: '6px 10px', fontSize: '0.74rem' }}
                              title="Simpan tanggal baru"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingArchiveDate(null)}
                              className="btn-ghost"
                              style={{ padding: '4px' }}
                              title="Batal"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => onChangeDate(log.date)}
                              style={{
                                textAlign: 'left',
                                flex: 1,
                                color: 'var(--text-primary)',
                              }}
                            >
                              <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                                {formatDateID(log.date)}
                              </div>
                              <div className="tabular-num" style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                                Selesai {dCount}/{tCount} tugas
                              </div>
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingArchiveDate(log.date);
                                  setArchiveDraftDate(log.date);
                                }}
                                className="btn-ghost"
                                style={{ padding: '5px', color: 'var(--text-muted)' }}
                                title="Edit tanggal laporan arsip ini"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteLogDate(log.date)}
                                className="btn-ghost"
                                style={{ padding: '5px', color: 'var(--text-muted)' }}
                                title="Hapus arsip tanggal ini"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
