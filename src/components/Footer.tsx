import React from 'react';
import { Building2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--border-light)',
        padding: '32px 0',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>
          <Building2 size={15} />
          <span>PropPulse &mdash; Sistem Konten Harian Pemasaran Properti</span>
        </div>
        <div>Rumah Subsidi &amp; Komersil &bull; Data tersimpan aman secara lokal</div>
      </div>
    </footer>
  );
};
