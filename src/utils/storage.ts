import {
  DailyContentEntry,
  DailyTargets,
  PlatformEngagement,
  PropertyCategory,
} from '../types/content';

const STORAGE_KEY = 'proppulse_daily_entries_v1';
const DRAFT_KEY = 'proppulse_daily_draft_v1';
const TARGETS_KEY = 'proppulse_daily_targets_v1';
const PROJECTS_KEY = 'proppulse_saved_projects_v1';

export const CONTENT_TYPE_PRESETS = [
  'Video Tour Rumah',
  'Simulasi KPR & Cicilan',
  'Promo DP / All-In',
  'Progress Bangunan',
  'Testimoni Akad',
  'Edukasi Subsidi vs Komersil',
];

export function createEmptyPlatformEngagement(): PlatformEngagement {
  return {
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    waLinkClicks: 0,
  };
}

export function syncTotalEngagement(entry: DailyContentEntry): DailyContentEntry {
  const tt = entry.engagementByPlatform.tiktok;
  const ig = entry.engagementByPlatform.instagram;
  const fb = entry.engagementByPlatform.facebook;

  return {
    ...entry,
    views: (tt.views || 0) + (ig.views || 0) + (fb.views || 0),
    likes: (tt.likes || 0) + (ig.likes || 0) + (fb.likes || 0),
    comments: (tt.comments || 0) + (ig.comments || 0) + (fb.comments || 0),
    shares: (tt.shares || 0) + (ig.shares || 0) + (fb.shares || 0),
    saves: (tt.saves || 0) + (ig.saves || 0) + (fb.saves || 0),
    waLinkClicks: (tt.waLinkClicks || 0) + (ig.waLinkClicks || 0) + (fb.waLinkClicks || 0),
  };
}

export function normalizeEntry(raw: Partial<DailyContentEntry>): DailyContentEntry {
  const fallback = createEmptyEntry(raw.date || getTodayDateString());
  const hasPerPlatform = Boolean(raw.engagementByPlatform);

  const engagementByPlatform = hasPerPlatform
    ? {
        tiktok: { ...createEmptyPlatformEngagement(), ...raw.engagementByPlatform?.tiktok },
        instagram: { ...createEmptyPlatformEngagement(), ...raw.engagementByPlatform?.instagram },
        facebook: { ...createEmptyPlatformEngagement(), ...raw.engagementByPlatform?.facebook },
      }
    : {
        tiktok: {
          views: raw.views || 0,
          likes: raw.likes || 0,
          comments: raw.comments || 0,
          shares: raw.shares || 0,
          saves: raw.saves || 0,
          waLinkClicks: raw.waLinkClicks || 0,
        },
        instagram: createEmptyPlatformEngagement(),
        facebook: createEmptyPlatformEngagement(),
      };

  return syncTotalEngagement({
    ...fallback,
    ...raw,
    platforms: {
      tiktok: raw.platforms?.tiktok ?? fallback.platforms.tiktok,
      instagram: raw.platforms?.instagram ?? fallback.platforms.instagram,
      facebook: raw.platforms?.facebook ?? fallback.platforms.facebook,
    },
    engagementByPlatform,
  });
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createEmptyEntry(date: string = getTodayDateString()): DailyContentEntry {
  const iso = new Date().toISOString();
  return {
    id: `entry-${date}-${Math.random().toString(36).slice(2, 8)}`,
    date,
    propertyCategory: 'subsidi',
    projectName: '',
    contentTypes: ['Video Tour Rumah'],
    contentCreated: 1,
    platforms: {
      tiktok: { active: true, posts: 1 },
      instagram: { active: true, posts: 1 },
      facebook: { active: true, posts: 1 },
    },
    groupsShared: 0,
    marketplacePosted: 0,
    isLive: false,
    livePlatforms: [],
    liveDurationMinutes: 60,
    liveViewers: 0,
    engagementByPlatform: {
      tiktok: createEmptyPlatformEngagement(),
      instagram: createEmptyPlatformEngagement(),
      facebook: createEmptyPlatformEngagement(),
    },
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    waLinkClicks: 0,
    hasProspect: false,
    prospectTotal: 0,
    prospectSubsidi: 0,
    prospectKomersil: 0,
    surveyCount: 0,
    bookingCount: 0,
    notes: '',
    createdAt: iso,
    updatedAt: iso,
  };
}

export function loadEntries(): DailyContentEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeEntry(item))
      .sort(
        (a: DailyContentEntry, b: DailyContentEntry) =>
          b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt)
      );
  } catch {
    return [];
  }
}

export function saveEntries(entries: DailyContentEntry[]): void {
  const sorted = entries
    .map((item) => syncTotalEngagement(item))
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
}

export function loadDraft(): DailyContentEntry | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return normalizeEntry(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveDraft(entry: DailyContentEntry): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(syncTotalEngagement(entry)));
  } catch {
    // ignore storage quota errors
  }
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}

export function loadTargets(): DailyTargets {
  try {
    const raw = localStorage.getItem(TARGETS_KEY);
    if (!raw) return { dailyContent: 3, dailyGroups: 15, dailyPosts: 3 };
    return JSON.parse(raw) as DailyTargets;
  } catch {
    return { dailyContent: 3, dailyGroups: 15, dailyPosts: 3 };
  }
}

export function saveTargets(targets: DailyTargets): void {
  localStorage.setItem(TARGETS_KEY, JSON.stringify(targets));
}

export function loadSavedProjects(): string[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return ['Rumah Subsidi FLPP', 'Cluster Komersil Utama'];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return ['Rumah Subsidi FLPP', 'Cluster Komersil Utama'];
  }
}

export function addSavedProject(name: string): string[] {
  const trimmed = name.trim();
  if (!trimmed) return loadSavedProjects();
  const existing = loadSavedProjects();
  if (existing.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
    return existing;
  }
  const next = [trimmed, ...existing].slice(0, 8);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(next));
  return next;
}

export function getCategoryLabel(cat: PropertyCategory): string {
  if (cat === 'subsidi') return 'Rumah Subsidi';
  if (cat === 'komersil') return 'Rumah Komersil';
  return 'Subsidi & Komersil';
}

export function getActivePlatformCount(entry: DailyContentEntry): number {
  let count = 0;
  if (entry.platforms.tiktok.active && entry.platforms.tiktok.posts > 0) count++;
  if (entry.platforms.instagram.active && entry.platforms.instagram.posts > 0) count++;
  if (entry.platforms.facebook.active && entry.platforms.facebook.posts > 0) count++;
  return count;
}

export function getActivePlatformNames(entry: DailyContentEntry): string[] {
  const names: string[] = [];
  if (entry.platforms.tiktok.active && entry.platforms.tiktok.posts > 0) names.push('TT');
  if (entry.platforms.instagram.active && entry.platforms.instagram.posts > 0) names.push('IG');
  if (entry.platforms.facebook.active && entry.platforms.facebook.posts > 0) names.push('FB');
  return names;
}

export function getTotalPostsPublished(entry: DailyContentEntry): number {
  const tt = entry.platforms.tiktok.active ? entry.platforms.tiktok.posts : 0;
  const ig = entry.platforms.instagram.active ? entry.platforms.instagram.posts : 0;
  const fb = entry.platforms.facebook.active ? entry.platforms.facebook.posts : 0;
  return tt + ig + fb;
}

export function getPlatformInteractions(m: PlatformEngagement): number {
  return m.likes + m.comments + m.shares + m.saves;
}

export function calculatePlatformER(m: PlatformEngagement): string {
  const inter = getPlatformInteractions(m);
  if (m.views <= 0) return '0.0%';
  return `${((inter / m.views) * 100).toFixed(1)}%`;
}

export function getTotalInteractions(entry: DailyContentEntry): number {
  return entry.likes + entry.comments + entry.shares + entry.saves;
}

export function calculateEngagementRate(entry: DailyContentEntry): string {
  const interactions = getTotalInteractions(entry);
  if (entry.views <= 0) return '0.0%';
  const rate = (interactions / entry.views) * 100;
  return `${rate.toFixed(1)}%`;
}

export function formatDateID(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatNumberID(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num || 0);
}

export function formatWhatsAppReport(entry: DailyContentEntry): string {
  const synced = syncTotalEngagement(entry);
  const tt = synced.engagementByPlatform.tiktok;
  const ig = synced.engagementByPlatform.instagram;
  const fb = synced.engagementByPlatform.facebook;

  const platformSummary =
    [
      synced.platforms.tiktok.active ? `TikTok (${synced.platforms.tiktok.posts})` : null,
      synced.platforms.instagram.active ? `IG (${synced.platforms.instagram.posts})` : null,
      synced.platforms.facebook.active ? `FB (${synced.platforms.facebook.posts})` : null,
    ]
      .filter(Boolean)
      .join(', ') || 'Belum diposting';

  const liveText = synced.isLive
    ? `SUDAH LIVE (${synced.livePlatforms.join('/') || 'Sosmed'} • ${synced.liveDurationMinutes} mnt • ${formatNumberID(synced.liveViewers)} penonton)`
    : 'Tidak Live';

  const prospectText = synced.hasProspect
    ? [
        `ADA PROSPEK (${synced.prospectTotal} Leads WA)`,
        `  - Minat Subsidi: ${synced.prospectSubsidi} | Komersil: ${synced.prospectKomersil}`,
        `  - Jadwal Survey: ${synced.surveyCount} | Booking/Berkas: ${synced.bookingCount}`,
      ].join('\n')
    : 'Belum Ada Prospek Masuk';

  const fmtMetricLine = (name: string, m: PlatformEngagement) =>
    `• ${name}: ${formatNumberID(m.views)} views | ${formatNumberID(m.likes)}L | ${formatNumberID(m.comments)}C | ${formatNumberID(m.shares)}S | ${formatNumberID(m.saves)} save | ${formatNumberID(m.waLinkClicks)} WA`;

  return [
    `*LAPORAN KONTEN HARIAN PEMASARAN PROPERTI*`,
    `Tanggal: ${formatDateID(synced.date)}`,
    `Fokus Unit: ${getCategoryLabel(synced.propertyCategory)}${synced.projectName ? ` — ${synced.projectName}` : ''}`,
    ``,
    `*1. Produksi & Distribusi*`,
    `• Konten Dibuat: ${synced.contentCreated} konten`,
    `• Sosial Media (${getActivePlatformCount(synced)}/3): ${platformSummary}`,
    `• Share Grup Video: ${synced.groupsShared} grup`,
    `• Listing Marketplace: ${synced.marketplacePosted} iklan`,
    `• Live Streaming: ${liveText}`,
    ``,
    `*2. Engagement per Platform*`,
    fmtMetricLine('TikTok', tt),
    fmtMetricLine('Instagram', ig),
    fmtMetricLine('Facebook', fb),
    `• TOTAL: ${formatNumberID(synced.views)} views | ER ${calculateEngagementRate(synced)} | ${formatNumberID(synced.waLinkClicks)} klik WA`,
    ``,
    `*3. Pipeline Prospek Properti*`,
    `• Status: ${prospectText}`,
    synced.notes ? `• Catatan: ${synced.notes}` : '',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

export function exportEntriesToCSV(entries: DailyContentEntry[]): void {
  const headers = [
    'Tanggal',
    'Kategori Properti',
    'Nama Proyek/Cluster',
    'Jenis Konten',
    'Jumlah Konten Dibuat',
    'Jumlah Sosmed Aktif',
    'Post TikTok',
    'Post Instagram',
    'Post Facebook',
    'Grup Dikirim Video',
    'Listing Marketplace',
    'Status Live',
    'Platform Live',
    'Durasi Live (Menit)',
    'Penonton Live',
    'TT Views',
    'TT Likes',
    'TT Comments',
    'TT Shares',
    'TT Saves',
    'TT Klik WA',
    'IG Views',
    'IG Likes',
    'IG Comments',
    'IG Shares',
    'IG Saves',
    'IG Klik WA',
    'FB Views',
    'FB Likes',
    'FB Comments',
    'FB Shares',
    'FB Saves',
    'FB Klik WA',
    'Total Views',
    'Total Likes',
    'Total Comments',
    'Total Shares',
    'Total Saves',
    'Total Klik WA',
    'Engagement Rate',
    'Status Prospek',
    'Total Prospek WA',
    'Prospek Subsidi',
    'Prospek Komersil',
    'Jadwal Survey',
    'Booking/Berkas KPR',
    'Catatan',
  ];

  const escapeCsv = (val: string | number) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = entries.map((raw) => {
    const e = syncTotalEngagement(raw);
    const tt = e.engagementByPlatform.tiktok;
    const ig = e.engagementByPlatform.instagram;
    const fb = e.engagementByPlatform.facebook;
    return [
      e.date,
      getCategoryLabel(e.propertyCategory),
      e.projectName,
      e.contentTypes.join(' | '),
      e.contentCreated,
      getActivePlatformCount(e),
      e.platforms.tiktok.active ? e.platforms.tiktok.posts : 0,
      e.platforms.instagram.active ? e.platforms.instagram.posts : 0,
      e.platforms.facebook.active ? e.platforms.facebook.posts : 0,
      e.groupsShared,
      e.marketplacePosted,
      e.isLive ? 'Ya' : 'Tidak',
      e.livePlatforms.join(' | '),
      e.isLive ? e.liveDurationMinutes : 0,
      e.isLive ? e.liveViewers : 0,
      tt.views,
      tt.likes,
      tt.comments,
      tt.shares,
      tt.saves,
      tt.waLinkClicks,
      ig.views,
      ig.likes,
      ig.comments,
      ig.shares,
      ig.saves,
      ig.waLinkClicks,
      fb.views,
      fb.likes,
      fb.comments,
      fb.shares,
      fb.saves,
      fb.waLinkClicks,
      e.views,
      e.likes,
      e.comments,
      e.shares,
      e.saves,
      e.waLinkClicks,
      calculateEngagementRate(e),
      e.hasProspect ? 'Ada Prospek' : 'Belum Ada',
      e.hasProspect ? e.prospectTotal : 0,
      e.hasProspect ? e.prospectSubsidi : 0,
      e.hasProspect ? e.prospectKomersil : 0,
      e.hasProspect ? e.surveyCount : 0,
      e.hasProspect ? e.bookingCount : 0,
      e.notes,
    ];
  });

  const csvContent =
    '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rekap-konten-properti-${getTodayDateString()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportBackupJSON(entries: DailyContentEntry[]): void {
  const payload = {
    app: 'PropPulse Sistem Konten Harian Properti',
    exportedAt: new Date().toISOString(),
    count: entries.length,
    entries: entries.map((e) => syncTotalEngagement(e)),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backup-konten-properti-${getTodayDateString()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
