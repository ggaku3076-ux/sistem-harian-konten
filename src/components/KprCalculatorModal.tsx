import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calculator, Check, Copy, X } from 'lucide-react';
import { calculateKpr, formatCurrencyID, formatKprWhatsAppSummary } from '../utils/storage';
import { PropertyCategory } from '../types/content';

interface KprCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: PropertyCategory;
  projectName?: string;
  onShowToast?: (msg: string) => void;
}

export const KprCalculatorModal: React.FC<KprCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'subsidi',
  projectName = '',
  onShowToast,
}) => {
  const [kprType, setKprType] = useState<'subsidi' | 'komersil'>(
    initialCategory === 'komersil' ? 'komersil' : 'subsidi'
  );
  const [housePrice, setHousePrice] = useState<number>(
    initialCategory === 'komersil' ? 385000000 : 185000000
  );
  const [dpAmount, setDpAmount] = useState<number>(
    initialCategory === 'komersil' ? 38500000 : 1850000
  );
  const [tenorYears, setTenorYears] = useState<number>(20);
  const [customRate, setCustomRate] = useState<number>(kprType === 'subsidi' ? 5.0 : 7.75);
  const [copied, setCopied] = useState(false);

  const calculation = calculateKpr(kprType, housePrice, dpAmount, tenorYears, customRate);

  const handleTypeChange = (nextType: 'subsidi' | 'komersil') => {
    setKprType(nextType);
    if (nextType === 'subsidi') {
      setHousePrice(185000000);
      setDpAmount(1850000); // 1% DP Subsidi
      setCustomRate(5.0);
    } else {
      setHousePrice(385000000);
      setDpAmount(38500000); // 10% DP Komersil
      setCustomRate(7.75);
    }
  };

  const handleCopySimulation = () => {
    const text = formatKprWhatsAppSummary(calculation, kprType, projectName);
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (onShowToast) {
      onShowToast('Simulasi KPR berhasil disalin ke clipboard');
    }
    setTimeout(() => setCopied(false), 2200);
  };

  const setDpQuickPercent = (pct: number) => {
    const calculatedDp = Math.round((housePrice * pct) / 100);
    setDpAmount(calculatedDp);
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
            maxWidth: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid var(--border-light)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border-light)',
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
                <Calculator size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  Kalkulator Simulasi KPR
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Hitung cepat cicilan bulanan Subsidi FLPP 5% flat atau Komersil
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

          {/* Type Selector (Subsidi vs Komersil) */}
          <div style={{ marginBottom: '18px' }}>
            <span className="apple-label">Skema Pembiayaan Rumah</span>
            <div className="segmented-group">
              <button
                type="button"
                className={`segmented-btn ${kprType === 'subsidi' ? 'active' : ''}`}
                onClick={() => handleTypeChange('subsidi')}
              >
                Rumah Subsidi (FLPP 5% Flat)
              </button>
              <button
                type="button"
                className={`segmented-btn ${kprType === 'komersil' ? 'active' : ''}`}
                onClick={() => handleTypeChange('komersil')}
              >
                Rumah Komersil (Anuitas)
              </button>
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px',
              marginBottom: '18px',
            }}
          >
            {/* Harga Rumah */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <label className="apple-label" style={{ marginBottom: 0 }}>
                  Harga Rumah (Rp)
                </label>
                {kprType === 'subsidi' && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }}>
                    Maks 185 Jt
                  </span>
                )}
              </div>
              <input
                type="number"
                min={0}
                step={1000000}
                className="apple-input tabular-num"
                style={{ fontWeight: 700 }}
                value={housePrice === 0 ? '' : housePrice}
                onChange={(e) => setHousePrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
              />
              <span
                style={{
                  display: 'block',
                  fontSize: '0.74rem',
                  color: 'var(--text-muted)',
                  marginTop: '4px',
                }}
              >
                {formatCurrencyID(housePrice)}
              </span>
            </div>

            {/* Uang Muka (DP) */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <label className="apple-label" style={{ marginBottom: 0 }}>
                  Uang Muka / DP (Rp)
                </label>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {calculation.dpPercent.toFixed(1)}%
                </span>
              </div>
              <input
                type="number"
                min={0}
                max={housePrice}
                step={500000}
                className="apple-input tabular-num"
                style={{ fontWeight: 700 }}
                value={dpAmount === 0 ? '' : dpAmount}
                onChange={(e) => setDpAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                {(kprType === 'subsidi' ? [0, 1, 5] : [5, 10, 20]).map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDpQuickPercent(pct)}
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    DP {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tenor & Bunga */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px',
              marginBottom: '20px',
            }}
          >
            {/* Tenor Selector */}
            <div>
              <label className="apple-label">Jangka Waktu (Tenor)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {[10, 15, 20, 25].map((yrs) => {
                  const sel = tenorYears === yrs;
                  return (
                    <button
                      key={yrs}
                      type="button"
                      onClick={() => setTenorYears(yrs)}
                      style={{
                        padding: '8px 0',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: sel ? '#1d1d1f' : 'var(--bg-secondary)',
                        color: sel ? '#ffffff' : 'var(--text-secondary)',
                        border: '1px solid var(--border-light)',
                        textAlign: 'center',
                      }}
                    >
                      {yrs} Thn
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Suku Bunga Pertahun */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <label className="apple-label" style={{ marginBottom: 0 }}>
                  Suku Bunga (% / Tahun)
                </label>
                {kprType === 'subsidi' && (
                  <span className="pill-badge pill-green" style={{ fontSize: '0.68rem' }}>
                    FLPP Fixed
                  </span>
                )}
              </div>
              <input
                type="number"
                step={0.1}
                min={1}
                max={20}
                className="apple-input tabular-num"
                style={{ fontWeight: 700 }}
                value={customRate}
                disabled={kprType === 'subsidi'}
                onChange={(e) => setCustomRate(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Output Result Card (Apple Minimalist Solid Dark Box) */}
          <div
            style={{
              backgroundColor: '#1d1d1f',
              color: '#ffffff',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#a1a1a6',
                }}
              >
                Estimasi Cicilan Bulanan ({calculation.tenorYears} Tahun)
              </span>
              <span
                className="tabular-num"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                }}
              >
                Plafon: {formatCurrencyID(calculation.loanAmount)}
              </span>
            </div>

            <div
              className="tabular-num"
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.3rem)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                marginBottom: '14px',
              }}
            >
              {formatCurrencyID(calculation.monthlyInstallment)}
              <span style={{ fontSize: '1rem', fontWeight: 500, color: '#a1a1a6', marginLeft: '6px' }}>
                / bulan
              </span>
            </div>

            <div
              style={{
                paddingTop: '14px',
                borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                fontSize: '0.8rem',
              }}
            >
              <div>
                <span style={{ color: '#a1a1a6', display: 'block', fontSize: '0.72rem' }}>
                  Total Pembayaran ({calculation.tenorYears * 12}x)
                </span>
                <span className="tabular-num" style={{ fontWeight: 600 }}>
                  {formatCurrencyID(calculation.totalPayment)}
                </span>
              </div>
              <div>
                <span style={{ color: '#a1a1a6', display: 'block', fontSize: '0.72rem' }}>
                  Estimasi Rekomendasi Gaji (DSR 30%)
                </span>
                <span className="tabular-num" style={{ fontWeight: 600, color: '#4ade80' }}>
                  Min. {formatCurrencyID(calculation.recommendedMinIncome)} / bln
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '9px 18px' }}>
              Tutup
            </button>
            <button
              type="button"
              onClick={handleCopySimulation}
              className="btn-primary"
              style={{ padding: '9px 20px' }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Tersalin!' : 'Salin Format WA'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
