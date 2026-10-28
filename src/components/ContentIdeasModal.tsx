import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Lightbulb, Plus, Sparkles, X } from 'lucide-react';
import { PROPERTY_CONTENT_IDEAS, PropertyIdeaItem } from '../utils/storage';
import { TodoCategory } from '../types/content';

interface ContentIdeasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTodo?: (title: string, category: TodoCategory) => void;
  onShowToast?: (msg: string) => void;
}

export const ContentIdeasModal: React.FC<ContentIdeasModalProps> = ({
  isOpen,
  onClose,
  onAddTodo,
  onShowToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [addedTodoId, setAddedTodoId] = useState<string | null>(null);

  const categories = [
    'Semua',
    'Tour & Showcase',
    'Edukasi KPR',
    'Promo & Penawaran',
    'Social Proof',
    'Perbandingan',
  ];

  const filteredIdeas =
    selectedCategory === 'Semua'
      ? PROPERTY_CONTENT_IDEAS
      : PROPERTY_CONTENT_IDEAS.filter((i) => i.category === selectedCategory);

  const handleCopyIdea = (item: PropertyIdeaItem) => {
    const text = [
      `💡 *IDE KONTEN PROPERTI: ${item.title.toUpperCase()}*`,
      `Kategori: ${item.category}`,
      ``,
      `🎯 *Hook 3 Detik Pertama:*`,
      `"${item.hook}"`,
      ``,
      `📝 *Struktur Alur Video:*`,
      ...item.scriptOutline.map((step, idx) => `${idx + 1}. ${step}`),
      ``,
      `📢 *Call to Action (CTA):*`,
      `"${item.callToAction}"`,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    if (onShowToast) {
      onShowToast(`Skrip & hook "${item.title}" disalin`);
    }
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddAsTodo = (item: PropertyIdeaItem) => {
    if (onAddTodo) {
      onAddTodo(`Take & edit video: ${item.title}`, 'Konten');
      setAddedTodoId(item.id);
      if (onShowToast) {
        onShowToast(`Ditambahkan ke Todo Harian`);
      }
      setTimeout(() => setAddedTodoId(null), 2000);
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
            maxWidth: '780px',
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
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Lightbulb size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  Bank Ide &amp; Skrip Hook Viral Properti
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Swipe file formula konten properti berkonversi tinggi untuk TikTok, Reels, &amp; FB
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

          {/* Category Filter Tabs */}
          <div
            style={{
              padding: '12px 24px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            {categories.map((cat) => {
              const sel = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    backgroundColor: sel ? '#1d1d1f' : '#ffffff',
                    color: sel ? '#ffffff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* List of Ideas */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {filteredIdeas.map((item) => {
              const isCopied = copiedId === item.id;
              const isAdded = addedTodoId === item.id;

              return (
                <div
                  key={item.id}
                  style={{
                    borderRadius: '18px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-light)',
                    padding: '18px',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  {/* Item Header */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="pill-badge pill-neutral" style={{ fontSize: '0.72rem' }}>
                        {item.category}
                      </span>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0 }}>
                        {item.title}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {onAddTodo && (
                        <button
                          type="button"
                          onClick={() => handleAddAsTodo(item)}
                          className="btn-secondary"
                          style={{
                            padding: '5px 12px',
                            fontSize: '0.75rem',
                            backgroundColor: isAdded ? 'var(--success-bg)' : '#ffffff',
                            color: isAdded ? '#166534' : 'var(--text-primary)',
                          }}
                        >
                          {isAdded ? <Check size={13} /> : <Plus size={13} />}
                          <span>{isAdded ? 'Tersimpan ke Todo' : '+ Jadikan Todo'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopyIdea(item)}
                        className="btn-primary"
                        style={{ padding: '5px 13px', fontSize: '0.75rem' }}
                      >
                        {isCopied ? <Check size={13} /> : <Copy size={13} />}
                        <span>{isCopied ? 'Tersalin' : 'Salin Skrip'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Hook Box */}
                  <div
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      marginBottom: '12px',
                      borderLeft: '3px solid #1d1d1f',
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '3px',
                      }}
                    >
                      Hook Pembuka (0-3 Detik Pertama)
                    </span>
                    <p
                      style={{
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: '#1d1d1f',
                        margin: 0,
                        fontStyle: 'italic',
                      }}
                    >
                      &ldquo;{item.hook}&rdquo;
                    </p>
                  </div>

                  {/* Script Outline */}
                  <div style={{ marginBottom: '10px' }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        marginBottom: '6px',
                      }}
                    >
                      Struktur Alur Konten:
                    </span>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: '18px',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      {item.scriptOutline.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.76rem',
                      color: 'var(--accent)',
                      fontWeight: 600,
                    }}
                  >
                    <Sparkles size={13} />
                    <span>CTA: &ldquo;{item.callToAction}&rdquo;</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
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
              Menampilkan {filteredIdeas.length} formula skrip siap pakai
            </span>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '7px 18px', fontSize: '0.82rem' }}
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
