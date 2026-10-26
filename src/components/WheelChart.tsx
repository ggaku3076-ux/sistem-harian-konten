import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatNumberID } from '../utils/storage';

export interface WheelSegment {
  id: string;
  label: string;
  value: number;
  color: string;
  helper?: string;
}

interface InteractiveWheelProps {
  title: string;
  subtitle?: string;
  segments: WheelSegment[];
  centerLabel: string;
  centerUnit?: string;
  size?: number;
  strokeWidth?: number;
}

export const InteractiveWheel: React.FC<InteractiveWheelProps> = ({
  title,
  subtitle,
  segments,
  centerLabel,
  centerUnit = '',
  size = 196,
  strokeWidth = 22,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const nonZeroCount = segments.filter((s) => s.value > 0).length;

  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - strokeWidth - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const gapPx = nonZeroCount > 1 ? 3.5 : 0;

  let cumulativeLength = 0;
  const computedArcs = segments.map((seg, idx) => {
    const val = Math.max(0, seg.value);
    const ratio = total > 0 ? val / total : 0;
    const rawLen = ratio * circumference;
    const visibleLen = val > 0 ? Math.max(2, rawLen - gapPx) : 0;
    const dashOffset = -cumulativeLength;
    cumulativeLength += rawLen;
    return {
      ...seg,
      idx,
      ratio,
      pct: total > 0 ? Math.round(ratio * 100) : 0,
      visibleLen,
      dashOffset,
    };
  });

  const activeItem = activeIndex !== null ? computedArcs[activeIndex] : null;

  return (
    <div
      className="bento-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      }}
    >
      <div style={{ marginBottom: '18px' }}>
        <h3 style={{ fontSize: '1.02rem', fontWeight: 700 }}>{title}</h3>
        {subtitle && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* SVG Donut Wheel */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          margin: '4px auto 20px',
          width: size,
          height: size,
        }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track Ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#ededf0"
            strokeWidth={strokeWidth}
          />

          {/* Segments rotated to start at 12 o'clock */}
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {computedArcs.map((arc) => {
              if (arc.visibleLen <= 0) return null;
              const isHovered = activeIndex === arc.idx;
              const isDimmed = activeIndex !== null && activeIndex !== arc.idx;

              return (
                <motion.circle
                  key={arc.id}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${arc.visibleLen} ${circumference}`}
                  strokeDashoffset={arc.dashOffset}
                  strokeLinecap={nonZeroCount === 1 ? 'round' : 'butt'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isDimmed ? 0.35 : 1 }}
                  transition={{ duration: 0.2 }}
                  style={{ cursor: 'pointer', transition: 'stroke-width 0.18s ease' }}
                  onMouseEnter={() => setActiveIndex(arc.idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={() =>
                    setActiveIndex((prev) => (prev === arc.idx ? null : arc.idx))
                  }
                />
              );
            })}
          </g>
        </svg>

        {/* Center Readout */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            padding: '0 28px',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.02em',
            }}
          >
            {activeItem ? activeItem.label : centerLabel}
          </span>
          <span
            className="tabular-num"
            style={{
              fontSize: '1.45rem',
              fontWeight: 700,
              lineHeight: 1.15,
              color: 'var(--text-primary)',
              marginTop: '2px',
            }}
          >
            {formatNumberID(activeItem ? activeItem.value : total)}
          </span>
          <span
            className="tabular-num"
            style={{
              fontSize: '0.73rem',
              fontWeight: 600,
              color: activeItem ? activeItem.color : 'var(--text-secondary)',
              marginTop: '2px',
            }}
          >
            {activeItem ? `${activeItem.pct}% porsi` : centerUnit || 'Total'}
          </span>
        </div>
      </div>

      {/* Legend List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {computedArcs.map((arc) => {
          const isSelected = activeIndex === arc.idx;
          return (
            <div
              key={arc.id}
              onMouseEnter={() => setActiveIndex(arc.idx)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={() =>
                setActiveIndex((prev) => (prev === arc.idx ? null : arc.idx))
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 11px',
                borderRadius: '12px',
                backgroundColor: isSelected ? 'var(--bg-secondary)' : '#fbfbfd',
                border: isSelected
                  ? '1px solid var(--border-strong)'
                  : '1px solid var(--border-light)',
                cursor: 'pointer',
                transition: 'all 0.16s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '9999px',
                    backgroundColor: arc.color,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{arc.label}</div>
                  {arc.helper && (
                    <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>
                      {arc.helper}
                    </div>
                  )}
                </div>
              </div>

              <div
                className="tabular-num"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  {formatNumberID(arc.value)}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    backgroundColor: '#ededf0',
                    color: 'var(--text-secondary)',
                    minWidth: '42px',
                    textAlign: 'center',
                  }}
                >
                  {arc.pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export interface RingMetric {
  id: string;
  label: string;
  current: number;
  target: number;
  color: string;
  trackColor: string;
}

export const ConcentricTargetWheel: React.FC<{
  title: string;
  subtitle?: string;
  rings: RingMetric[];
}> = ({ title, subtitle, rings }) => {
  const size = 204;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 14;
  const gap = 6;

  const avgPct =
    rings.length > 0
      ? Math.round(
          rings.reduce(
            (acc, r) => acc + Math.min(100, (r.current / Math.max(1, r.target)) * 100),
            0
          ) / rings.length
        )
      : 0;

  return (
    <div
      className="bento-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.02rem', fontWeight: 700 }}>{title}</h3>
        {subtitle && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          margin: '0 auto 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {rings.map((ring, index) => {
              const r = (size - strokeWidth) / 2 - index * (strokeWidth + gap) - 4;
              const c = 2 * Math.PI * r;
              const pct = Math.min(1, Math.max(0, ring.current / Math.max(1, ring.target)));
              const dash = pct * c;

              return (
                <g key={ring.id}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={ring.trackColor}
                    strokeWidth={strokeWidth}
                  />
                  {pct > 0 && (
                    <motion.circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      stroke={ring.color}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      initial={{ strokeDasharray: `0 ${c}` }}
                      animate={{ strokeDasharray: `${dash} ${c}` }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        <div
          style={{
            position: 'absolute',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div className="tabular-num" style={{ fontSize: '1.35rem', fontWeight: 700 }}>
            {avgPct}%
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Skor Target
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {rings.map((r) => {
          const pct = Math.round((r.current / Math.max(1, r.target)) * 100);
          return (
            <div
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 11px',
                borderRadius: '12px',
                backgroundColor: '#fbfbfd',
                border: '1px solid var(--border-light)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '9999px',
                    backgroundColor: r.color,
                  }}
                />
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{r.label}</span>
              </div>
              <span className="tabular-num" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                {formatNumberID(r.current)}/{formatNumberID(r.target)}{' '}
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
