import {
  ContentItemEngagement,
  DailyContentEntry,
  DailyTargets,
  DailyTodoLog,
  LeadStatus,
  PlatformEngagement,
  PropertyCategory,
  TodoCategory,
  TodoItem,
} from '../types/content';

const STORAGE_KEY = 'proppulse_daily_entries_v1';
const DRAFT_KEY = 'proppulse_daily_draft_v1';
const TARGETS_KEY = 'proppulse_daily_targets_v1';
const PROJECTS_KEY = 'proppulse_saved_projects_v1';
const TODO_LOGS_KEY = 'proppulse_daily_todos_v1';
const TODO_TEMPLATE_KEY = 'proppulse_todo_template_v1';

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

export function createEmptyContentItem(index: number): ContentItemEngagement {
  return {
    id: `konten-${index + 1}-${Math.random().toString(36).slice(2, 7)}`,
    title: '',
    engagementByPlatform: {
      tiktok: createEmptyPlatformEngagement(),
      instagram: createEmptyPlatformEngagement(),
      facebook: createEmptyPlatformEngagement(),
    },
  };
}

export function resizeContentItems(
  existing: ContentItemEngagement[] | undefined,
  targetCount: number
): ContentItemEngagement[] {
  const safeCount = Math.max(0, Math.floor(targetCount || 0));
  const current = Array.isArray(existing) ? existing : [];
  if (current.length === safeCount) return current;
  if (current.length > safeCount) return current.slice(0, safeCount);

  const next = [...current];
  for (let i = current.length; i < safeCount; i++) {
    next.push(createEmptyContentItem(i));
  }
  return next;
}

export function getContentItemTotals(item: ContentItemEngagement): PlatformEngagement {
  const tt = item.engagementByPlatform.tiktok;
  const ig = item.engagementByPlatform.instagram;
  const fb = item.engagementByPlatform.facebook;
  return {
    views: (tt.views || 0) + (ig.views || 0) + (fb.views || 0),
    likes: (tt.likes || 0) + (ig.likes || 0) + (fb.likes || 0),
    comments: (tt.comments || 0) + (ig.comments || 0) + (fb.comments || 0),
    shares: (tt.shares || 0) + (ig.shares || 0) + (fb.shares || 0),
    saves: (tt.saves || 0) + (ig.saves || 0) + (fb.saves || 0),
    waLinkClicks: (tt.waLinkClicks || 0) + (ig.waLinkClicks || 0) + (fb.waLinkClicks || 0),
  };
}

function sumPlatformMetrics(items: PlatformEngagement[]): PlatformEngagement {
  return items.reduce(
    (acc, m) => ({
      views: acc.views + (m.views || 0),
      likes: acc.likes + (m.likes || 0),
      comments: acc.comments + (m.comments || 0),
      shares: acc.shares + (m.shares || 0),
      saves: acc.saves + (m.saves || 0),
      waLinkClicks: acc.waLinkClicks + (m.waLinkClicks || 0),
    }),
    createEmptyPlatformEngagement()
  );
}

export function syncTotalEngagement(entry: DailyContentEntry): DailyContentEntry {
  const resizedItems = resizeContentItems(entry.contentItems, entry.contentCreated);

  const tt = sumPlatformMetrics(resizedItems.map((it) => it.engagementByPlatform.tiktok));
  const ig = sumPlatformMetrics(resizedItems.map((it) => it.engagementByPlatform.instagram));
  const fb = sumPlatformMetrics(resizedItems.map((it) => it.engagementByPlatform.facebook));

  return {
    ...entry,
    contentItems: resizedItems,
    engagementByPlatform: {
      tiktok: tt,
      instagram: ig,
      facebook: fb,
    },
    views: tt.views + ig.views + fb.views,
    likes: tt.likes + ig.likes + fb.likes,
    comments: tt.comments + ig.comments + fb.comments,
    shares: tt.shares + ig.shares + fb.shares,
    saves: tt.saves + ig.saves + fb.saves,
    waLinkClicks: tt.waLinkClicks + ig.waLinkClicks + fb.waLinkClicks,
  };
}

export function normalizeEntry(raw: Partial<DailyContentEntry>): DailyContentEntry {
  const fallback = createEmptyEntry(raw.date || getTodayDateString());
  const hasPerPlatform = Boolean(raw.engagementByPlatform);

  const legacyEngagementByPlatform = hasPerPlatform
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

  const count = typeof raw.contentCreated === 'number' ? Math.max(0, raw.contentCreated) : 1;

  let normalizedItems: ContentItemEngagement[];
  if (Array.isArray(raw.contentItems) && raw.contentItems.length > 0) {
    normalizedItems = resizeContentItems(
      raw.contentItems.map((ci, idx) => ({
        id: ci.id || `konten-${idx + 1}-${Math.random().toString(36).slice(2, 7)}`,
        title: ci.title || '',
        engagementByPlatform: {
          tiktok: { ...createEmptyPlatformEngagement(), ...ci.engagementByPlatform?.tiktok },
          instagram: { ...createEmptyPlatformEngagement(), ...ci.engagementByPlatform?.instagram },
          facebook: { ...createEmptyPlatformEngagement(), ...ci.engagementByPlatform?.facebook },
        },
      })),
      count
    );
  } else {
    normalizedItems = resizeContentItems(
      count > 0
        ? [
            {
              id: `konten-1-${Math.random().toString(36).slice(2, 7)}`,
              title: '',
              engagementByPlatform: legacyEngagementByPlatform,
            },
          ]
        : [],
      count
    );
  }

  return syncTotalEngagement({
    ...fallback,
    ...raw,
    contentCreated: count,
    contentItems: normalizedItems,
    platforms: {
      tiktok: raw.platforms?.tiktok ?? fallback.platforms.tiktok,
      instagram: raw.platforms?.instagram ?? fallback.platforms.instagram,
      facebook: raw.platforms?.facebook ?? fallback.platforms.facebook,
    },
    leadsList: Array.isArray(raw.leadsList) ? raw.leadsList : [],
    engagementByPlatform: legacyEngagementByPlatform,
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
    contentItems: [createEmptyContentItem(0)],
    platforms: {
      tiktok: { active: true, posts: 1 },
      instagram: { active: true, posts: 1 },
      facebook: { active: true, posts: 1 },
    },
    groupsShared: 0,
    marketplacePosted: 0,
    isLive: false,
    livePlatforms: [],
    liveDurationMinutes: 0,
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
    leadsList: [],
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

export function shiftDateString(dateStr: string, deltaDays: number): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return getTodayDateString();
  }
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + deltaDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

export function formatLiveDuration(minutes: number): string {
  const m = Math.max(0, Math.floor(minutes || 0));
  if (m === 0) return '0 mnt';
  if (m < 60) return `${m} mnt`;
  const hrs = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${hrs} jam` : `${hrs}j ${rem}m`;
}

export function getLeadStatusLabel(status: LeadStatus): string {
  switch (status) {
    case 'chat_masuk':
      return 'Chat Masuk';
    case 'jadwal_survey':
      return 'Jadwal Survey';
    case 'sudah_survey':
      return 'Sudah Survey';
    case 'pemberkasan_kpr':
      return 'Pemberkasan KPR';
    case 'booking_akad':
      return 'Booking / Akad';
    default:
      return status;
  }
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
    ? `SUDAH LIVE (${synced.livePlatforms.join('/') || 'Sosmed'} • ${formatLiveDuration(synced.liveDurationMinutes)} • ${formatNumberID(synced.liveViewers)} penonton)`
    : 'Tidak Live';

  const leadsDetail =
    synced.hasProspect && Array.isArray(synced.leadsList) && synced.leadsList.length > 0
      ? [
          `  Daftar Follow-up Leads (${synced.leadsList.length} orang):`,
          ...synced.leadsList.map(
            (l, idx) =>
              `  ${idx + 1}. ${l.name} (${l.phone}) - [${getLeadStatusLabel(l.status)}] [${l.category.toUpperCase()}]${
                l.notes ? ` - "${l.notes}"` : ''
              }`
          ),
        ].join('\n')
      : '';

  const prospectText = synced.hasProspect
    ? [
        `ADA PROSPEK (${synced.prospectTotal} Leads WA)`,
        `  - Minat Subsidi: ${synced.prospectSubsidi} | Komersil: ${synced.prospectKomersil}`,
        `  - Jadwal Survey: ${synced.surveyCount} | Booking/Berkas: ${synced.bookingCount}`,
        leadsDetail,
      ]
        .filter(Boolean)
        .join('\n')
    : 'Belum Ada Prospek Masuk';

  const fmtMetricLine = (name: string, m: PlatformEngagement) =>
    `• ${name}: ${formatNumberID(m.views)} views | ${formatNumberID(m.likes)}L | ${formatNumberID(m.comments)}C | ${formatNumberID(m.shares)}S | ${formatNumberID(m.saves)} save | ${formatNumberID(m.waLinkClicks)} WA`;

  const todoForDate = loadTodoLogs().find((t) => t.date === synced.date);
  const doneTodos = todoForDate ? todoForDate.items.filter((i) => i.completed) : [];
  const todoBlock =
    doneTodos.length > 0
      ? [
          ``,
          `*4. Todo Selesai (${doneTodos.length}/${todoForDate!.items.length})*`,
          ...doneTodos.map((t) => `✓ ${t.title}`),
        ].join('\n')
      : '';

  const perContentLines =
    synced.contentItems.length > 1
      ? [
          `*Rincian per Konten (${synced.contentItems.length} Konten):*`,
          ...synced.contentItems.map((ci, idx) => {
            const sub = getContentItemTotals(ci);
            const label = ci.title ? `Konten #${idx + 1} (${ci.title})` : `Konten #${idx + 1}`;
            return `• ${label}: ${formatNumberID(sub.views)} views | ${formatNumberID(sub.likes)}L | ${formatNumberID(sub.comments)}C | ${formatNumberID(sub.shares)}S | ${formatNumberID(sub.waLinkClicks)} WA`;
          }),
        ].join('\n')
      : '';

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
    `*2. Engagement Konten & Platform*`,
    perContentLines,
    fmtMetricLine('TikTok', tt),
    fmtMetricLine('Instagram', ig),
    fmtMetricLine('Facebook', fb),
    `• TOTAL: ${formatNumberID(synced.views)} views | ER ${calculateEngagementRate(synced)} | ${formatNumberID(synced.waLinkClicks)} klik WA`,
    ``,
    `*3. Pipeline Prospek Properti*`,
    `• Status: ${prospectText}`,
    synced.notes ? `• Catatan: ${synced.notes}` : '',
    todoBlock,
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
    todos: loadTodoLogs(),
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

// ================= DAILY TODO LIST HELPERS =================

export const DEFAULT_TODO_TEMPLATE: { title: string; category: TodoCategory }[] = [
  { title: 'Take & edit video konten properti hari ini', category: 'Konten' },
  { title: 'Posting video ke TikTok (TT)', category: 'Sosmed' },
  { title: 'Posting Reels / Feed ke Instagram (IG)', category: 'Sosmed' },
  { title: 'Posting video ke Facebook (FB)', category: 'Sosmed' },
  { title: 'Share video ke grup jual-beli properti / komunitas', category: 'Grup & Iklan' },
  { title: 'Pasang / perbarui iklan FB Marketplace', category: 'Grup & Iklan' },
  { title: 'Sesi Live Streaming review unit / Q&A KPR', category: 'Live' },
  { title: 'Balas & follow-up chat WA prospek (Subsidi / Komersil)', category: 'Prospek & Survey' },
];

export function loadTodoTemplate(): { title: string; category: TodoCategory }[] {
  try {
    const raw = localStorage.getItem(TODO_TEMPLATE_KEY);
    if (!raw) return DEFAULT_TODO_TEMPLATE;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TODO_TEMPLATE;
  } catch {
    return DEFAULT_TODO_TEMPLATE;
  }
}

export function saveTodoTemplate(items: TodoItem[]): void {
  const template = items.map((i) => ({ title: i.title, category: i.category }));
  localStorage.setItem(TODO_TEMPLATE_KEY, JSON.stringify(template));
}

export function createDefaultTodoLog(date: string = getTodayDateString()): DailyTodoLog {
  const template = loadTodoTemplate();
  return {
    date,
    items: template.map((t, idx) => ({
      id: `todo-${date}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      title: t.title,
      category: t.category,
      completed: false,
    })),
    notes: '',
    updatedAt: new Date().toISOString(),
  };
}

export function loadTodoLogs(): DailyTodoLog[] {
  try {
    const raw = localStorage.getItem(TODO_LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a: DailyTodoLog, b: DailyTodoLog) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

export function saveTodoLogs(logs: DailyTodoLog[]): void {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  localStorage.setItem(TODO_LOGS_KEY, JSON.stringify(sorted));
}

export function formatTodoWhatsAppReport(log: DailyTodoLog): string {
  const done = log.items.filter((i) => i.completed);
  const pending = log.items.filter((i) => !i.completed);
  const pct =
    log.items.length > 0 ? Math.round((done.length / log.items.length) * 100) : 0;

  return [
    `*LAPORAN TODO HARIAN PEMASARAN PROPERTI*`,
    `Tanggal Laporan: ${formatDateID(log.date)}`,
    `Progres: ${done.length}/${log.items.length} Selesai (${pct}%)`,
    ``,
    `*Sudah Dikerjakan Hari Ini:*`,
    ...(done.length > 0
      ? done.map((i) => `✅ ${i.title}${i.completedAt ? ` (${i.completedAt})` : ''}`)
      : ['• Belum ada tugas ditandai selesai']),
    ...(pending.length > 0
      ? [
          ``,
          `*Belum / Lanjut:*`,
          ...pending.map((i) => `⬜ ${i.title}`),
        ]
      : []),
    log.notes ? `\n*Catatan:* ${log.notes}` : '',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

// ================= SIMULATOR KPR (SUBSIDI & KOMERSIL) =================

export function formatCurrencyID(val: number): string {
  const safe = Math.round(Number(val) || 0);
  return 'Rp ' + safe.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export interface KprCalculationResult {
  housePrice: number;
  dpAmount: number;
  dpPercent: number;
  loanAmount: number;
  tenorYears: number;
  annualInterestRate: number;
  monthlyInstallment: number;
  totalPayment: number;
  totalInterest: number;
  recommendedMinIncome: number;
}

export function calculateKpr(
  type: 'subsidi' | 'komersil',
  housePrice: number,
  dpAmount: number,
  tenorYears: number,
  customInterestRate?: number
): KprCalculationResult {
  const safePrice = Math.max(0, housePrice);
  const safeDp = Math.max(0, Math.min(safePrice, dpAmount));
  const loanAmount = Math.max(0, safePrice - safeDp);
  const safeTenor = Math.max(1, tenorYears);
  const totalMonths = safeTenor * 12;
  const dpPercent = safePrice > 0 ? (safeDp / safePrice) * 100 : 0;

  if (loanAmount <= 0) {
    return {
      housePrice: safePrice,
      dpAmount: safeDp,
      dpPercent,
      loanAmount: 0,
      tenorYears: safeTenor,
      annualInterestRate: 0,
      monthlyInstallment: 0,
      totalPayment: safeDp,
      totalInterest: 0,
      recommendedMinIncome: 0,
    };
  }

  let annualInterestRate: number;
  let monthlyInstallment: number;

  if (type === 'subsidi') {
    // Subsidi FLPP: 5.0% flat fixed
    annualInterestRate = customInterestRate ?? 5.0;
    const monthlyPrincipal = loanAmount / totalMonths;
    const monthlyInterest = (loanAmount * (annualInterestRate / 100)) / 12;
    monthlyInstallment = Math.round(monthlyPrincipal + monthlyInterest);
  } else {
    // Komersil: Anuitas standar
    annualInterestRate = customInterestRate ?? 7.75;
    const monthlyRate = annualInterestRate / 100 / 12;
    if (monthlyRate === 0) {
      monthlyInstallment = Math.round(loanAmount / totalMonths);
    } else {
      const pmt =
        (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);
      monthlyInstallment = Math.round(pmt);
    }
  }

  const totalPayment = monthlyInstallment * totalMonths;
  const totalInterest = Math.max(0, totalPayment - loanAmount);
  const recommendedMinIncome = Math.round(monthlyInstallment / 0.3);

  return {
    housePrice: safePrice,
    dpAmount: safeDp,
    dpPercent,
    loanAmount,
    tenorYears: safeTenor,
    annualInterestRate,
    monthlyInstallment,
    totalPayment,
    totalInterest,
    recommendedMinIncome,
  };
}

export function formatKprWhatsAppSummary(
  kpr: KprCalculationResult,
  type: 'subsidi' | 'komersil',
  projectName?: string
): string {
  const typeLabel = type === 'subsidi' ? 'RUMAH SUBSIDI (FLPP 5% FLAT)' : 'RUMAH KOMERSIL';
  return [
    `*SIMULASI ESTIMASI KPR ${typeLabel}*`,
    projectName ? `Perumahan: ${projectName}` : '',
    `----------------------------------------`,
    `• Harga Rumah: ${formatCurrencyID(kpr.housePrice)}`,
    `• Uang Muka (DP): ${formatCurrencyID(kpr.dpAmount)} (${kpr.dpPercent.toFixed(1)}%)`,
    `• Plafon KPR (Pokok): ${formatCurrencyID(kpr.loanAmount)}`,
    `• Tenor Pembiayaan: ${kpr.tenorYears} Tahun (${kpr.tenorYears * 12} Bulan)`,
    `• Suku Bunga: ${kpr.annualInterestRate}% per tahun${type === 'subsidi' ? ' (Fixed sampai lunas)' : ''}`,
    `----------------------------------------`,
    `*ESTIMASI CICILAN: ${formatCurrencyID(kpr.monthlyInstallment)} / bulan*`,
    `• Rekomendasi Gaji Bersih/Joint Income: Min. ${formatCurrencyID(kpr.recommendedMinIncome)} / bln`,
    `----------------------------------------`,
    `_Catatan: Simulasi perkiraan awal. Biaya provisi, administrasi, asuransi jiwa & kebakaran mengikuti ketentuan bank penyalur._`,
  ]
    .filter(Boolean)
    .join('\n');
}

// ================= BANK IDE & SCRIPT HOOK KONTEN PROPERTI =================

export interface PropertyIdeaItem {
  id: string;
  category: 'Tour & Showcase' | 'Edukasi KPR' | 'Promo & Penawaran' | 'Social Proof' | 'Perbandingan';
  title: string;
  hook: string;
  scriptOutline: string[];
  callToAction: string;
}

export const PROPERTY_CONTENT_IDEAS: PropertyIdeaItem[] = [
  {
    id: 'idea-1',
    category: 'Tour & Showcase',
    title: 'Tour Rumah Subsidi Cicilan Setara Jajan Harian',
    hook: 'Stop scroll! Rumah 100 jutaan cicilan setara 30 ribu sehari, bentuk aslinya seluas ini?!',
    scriptOutline: [
      'Visual hook: Kamera jalan cepat dari depan gerbang cluster ke carport & ruang tamu.',
      'Jelaskan spesifikasi: 2 Kamar Tidur, 1 Kamar Mandi, sisa tanah belakang sudah diplester.',
      'Tunjukkan fasilitas: Jalan paving 6 meter, dekat musholla/taman bermain.',
      'Sebutkan harga & cicilan: Cukup 1 jutaan flat sampai lunas tanpa cemas bunga naik.',
    ],
    callToAction: 'Ketik "MAU TOUR" di komentar atau klik link di bio untuk jadwal survey akhir pekan ini!',
  },
  {
    id: 'idea-2',
    category: 'Edukasi KPR',
    title: '3 Penyebab Utama Gagal Lolos BI Checking / SLIK OJK',
    hook: 'Jangan asal booking rumah kalau belum cek 3 hal ini, bisa-bisa DP hangus!',
    scriptOutline: [
      'Penyebab 1: Pernah telat bayar paylater/pinjol walau cuma 50 ribu (kolektibilitas 2 ke atas).',
      'Penyebab 2: Kartu kredit sering mentok limit dan cuma bayar minimum payment.',
      'Penyebab 3: Rekening koran tidak rapi / banyak transaksi tidak jelas.',
      'Solusi: Cara pemutihan SLIK dan optimasi mutasi rekening 3 bulan terakhir sebelum akad.',
    ],
    callToAction: 'Konsultasi SLIK & kelayakan KPR gratis, klik tombol WhatsApp di bio kami.',
  },
  {
    id: 'idea-3',
    category: 'Promo & Penawaran',
    title: 'Promo All-In 1 Juta Terima Kunci (Free Biaya)',
    hook: 'Gak pake tipu-tipu: Cuma modal 1 juta udah langsung serah terima kunci rumah subsidi!',
    scriptOutline: [
      'Bongkar rincian biaya yang digratiskan developer: Free BPHTB, Free AJB, Free BBN, Free Biaya KPR.',
      'Tegaskan tidak ada biaya siluman di belakang.',
      'Tampilkan stok unit hook / unit depan yang sisa 3 unit lagi.',
    ],
    callToAction: 'Slot promo terbatas 5 peminat pertama minggu ini. Chat admin sekarang via link di profil!',
  },
  {
    id: 'idea-4',
    category: 'Perbandingan',
    title: 'Hitung-hitungan: Ngontrak 1.5 Jt vs Cicil Rumah Sendiri',
    hook: '5 tahun ngontrak habis 90 juta dan tetap numpang. Kenapa ga dipake nyicil rumah ini?',
    scriptOutline: [
      'Tulis tabel sederhana: Ngontrak Rp 1.500.000 x 60 bulan = Rp 90.000.000 (uang hilang tanpa sertifikat).',
      'Cicilan Rumah Subsidi: Rp 1.100.000/bln -> Uang jadi aset milik keluarga sendiri + SHM.',
      'Rumah makin tahun makin naik harganya, nunggu nanti malah makin gak kebeli.',
    ],
    callToAction: 'Jangan tunda lagi masa depan keluarga. Klik link WA di bio untuk simulasi cicilan resmi.',
  },
  {
    id: 'idea-5',
    category: 'Social Proof',
    title: 'Testimoni Haru: Pasangan Muda 22 Tahun Resmi Akad',
    hook: 'Siapa bilang umur 20-an belum bisa punya rumah? Buktinya mereka berdua berhasil akad hari ini!',
    scriptOutline: [
      'Tampilkan foto/video senyum pembeli memegang map akad dan kunci simbolis.',
      'Wawancara singkat 10 detik: "Awalnya ragu berkas wiraswasta ditolak, tapi dibantu developer sampai tuntas."',
      'Beri semangat bahwa siapapun yang punya kemauan pasti bisa dibantu.',
    ],
    callToAction: 'Mau dibantu prosesnya sampai serah terima kunci? Langsung DM atau WA admin kami.',
  },
  {
    id: 'idea-6',
    category: 'Edukasi KPR',
    title: 'Wiraswasta / Dagang Bisa Punya KPR Subsidi? Ini Caranya',
    hook: 'Bukan PNS atau karyawan tetap? Tenang, pedagang dan online shop pun bisa lolos KPR subsidi!',
    scriptOutline: [
      'Syarat 1: Buat SKU (Surat Keterangan Usaha) dari kelurahan setempat.',
      'Syarat 2: Wajib setor omset harian ke rekening bank selama minimal 3-6 bulan.',
      'Syarat 3: Siapkan pembukuan kas harian/nota belanja sederhana.',
      'Bank BTN & Bank Syariah menyediakan jalur KPR mikro untuk wirausaha.',
    ],
    callToAction: 'Mau cek berkas usaha Anda? Kirim pesan ke WhatsApp kami, tim marketing siap bantu.',
  },
  {
    id: 'idea-7',
    category: 'Tour & Showcase',
    title: 'Update Progress Pembangunan Cluster Blok C',
    hook: 'Intip progres pembangunan perumahan kita minggu ini! Yang sudah booking yuk merapat...',
    scriptOutline: [
      'Kamera menyorot dinding bata hebel yang kokoh, rangka atap baja ringan, dan genteng terpasang.',
      'Tunjukkan saluran air / drainase tertutup dan jalan cor beton rapi.',
      'Estimasi serah terima kunci bulan depan sesuai jadwal.',
    ],
    callToAction: 'Unit tahap 1 sisa 4 lagi. Segera amankan nomor kavling Anda sebelum kehabisan!',
  },
  {
    id: 'idea-8',
    category: 'Promo & Penawaran',
    title: 'Bonus AC & Kanopi Khusus Booking Survey Hari Ini',
    hook: 'Khusus yang survey lokasi hari ini dan langsung booking, kami pasangkan kanopi gratis!',
    scriptOutline: [
      'Visual kanopi cantik terpasang di carport unit contoh.',
      'Jelaskan hemat biaya renovasi hingga 7 juta rupiah.',
      'Syarat mudah: Cukup survey bersama tim kami dan lock unit.',
    ],
    callToAction: 'Jadwalkan kedatangan Anda via WA sekarang, link ada di bio.',
  },
];

// ================= GENERATOR LAPORAN EKSEKUTIF =================

export function formatExecutiveReport(
  entries: DailyContentEntry[],
  todoLogs: DailyTodoLog[],
  periodLabel: string = 'Laporan Eksekutif Pemasaran Properti'
): string {
  if (entries.length === 0) {
    return 'Belum ada data laporan harian untuk periode ini.';
  }

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const startDate = sorted[0].date;
  const endDate = sorted[sorted.length - 1].date;

  const totalContent = sorted.reduce((acc, e) => acc + (e.contentCreated || 0), 0);
  const totalViews = sorted.reduce((acc, e) => acc + (e.views || 0), 0);
  const totalLikes = sorted.reduce((acc, e) => acc + (e.likes || 0), 0);
  const totalComments = sorted.reduce((acc, e) => acc + (e.comments || 0), 0);
  const totalShares = sorted.reduce((acc, e) => acc + (e.shares || 0), 0);
  const totalSaves = sorted.reduce((acc, e) => acc + (e.saves || 0), 0);
  const totalWaClicks = sorted.reduce((acc, e) => acc + (e.waLinkClicks || 0), 0);
  const totalInteractions = totalLikes + totalComments + totalShares + totalSaves + totalWaClicks;
  const avgER = totalViews > 0 ? ((totalInteractions / totalViews) * 100).toFixed(2) + '%' : '0.00%';

  const ttViews = sorted.reduce((acc, e) => acc + (e.engagementByPlatform?.tiktok?.views || 0), 0);
  const igViews = sorted.reduce((acc, e) => acc + (e.engagementByPlatform?.instagram?.views || 0), 0);
  const fbViews = sorted.reduce((acc, e) => acc + (e.engagementByPlatform?.facebook?.views || 0), 0);

  const totalGroups = sorted.reduce((acc, e) => acc + (e.groupsShared || 0), 0);
  const totalMarketplace = sorted.reduce((acc, e) => acc + (e.marketplacePosted || 0), 0);
  const liveDays = sorted.filter((e) => e.isLive).length;
  const totalLiveDuration = sorted.reduce((acc, e) => acc + (e.isLive ? e.liveDurationMinutes || 0 : 0), 0);

  const totalProspects = sorted.reduce((acc, e) => acc + (e.hasProspect ? e.prospectTotal || 0 : 0), 0);
  const totalSubsidi = sorted.reduce((acc, e) => acc + (e.hasProspect ? e.prospectSubsidi || 0 : 0), 0);
  const totalKomersil = sorted.reduce((acc, e) => acc + (e.hasProspect ? e.prospectKomersil || 0 : 0), 0);
  const totalSurveys = sorted.reduce((acc, e) => acc + (e.hasProspect ? e.surveyCount || 0 : 0), 0);
  const totalBookings = sorted.reduce((acc, e) => acc + (e.hasProspect ? e.bookingCount || 0 : 0), 0);

  const convLeadToSurvey = totalProspects > 0 ? ((totalSurveys / totalProspects) * 100).toFixed(1) + '%' : '0%';
  const convSurveyToBooking = totalSurveys > 0 ? ((totalBookings / totalSurveys) * 100).toFixed(1) + '%' : '0%';

  // Todos
  const allTodoItems = todoLogs.flatMap((l) => l.items);
  const doneTodos = allTodoItems.filter((i) => i.completed).length;
  const totalTodos = allTodoItems.length;
  const todoPct = totalTodos > 0 ? Math.round((doneTodos / totalTodos) * 100) : 0;

  return [
    `========================================`,
    `🏢 *${periodLabel.toUpperCase()}*`,
    `Periode: ${formatDateID(startDate)} s/d ${formatDateID(endDate)} (${sorted.length} Hari Laporan)`,
    `========================================`,
    ``,
    `📊 *1. RINGKASAN PRODUKSI & DISTRIBUSI KONTEN*`,
    `• Total Konten Diproduksi: ${formatNumberID(totalContent)} video/konten`,
    `• Total Share Grup Properti: ${formatNumberID(totalGroups)} postingan`,
    `• Total Iklan FB Marketplace: ${formatNumberID(totalMarketplace)} listing aktif`,
    `• Sesi Live Streaming: ${liveDays} sesi (${formatLiveDuration(totalLiveDuration)})`,
    ``,
    `🔥 *2. PERFORMA & ENGAGEMENT DIGITAL*`,
    `• Total Penayangan (Views): ${formatNumberID(totalViews)} views`,
    `  - TikTok Views: ${formatNumberID(ttViews)}`,
    `  - Instagram Reels Views: ${formatNumberID(igViews)}`,
    `  - Facebook Video Views: ${formatNumberID(fbViews)}`,
    `• Total Interaksi Penonton: ${formatNumberID(totalInteractions)} (Likes: ${formatNumberID(totalLikes)}, Komen: ${formatNumberID(totalComments)}, Share: ${formatNumberID(totalShares)})`,
    `• Total Klik Tautan WhatsApp: ${formatNumberID(totalWaClicks)} klik`,
    `• Rata-rata Engagement Rate (ER): ${avgER}`,
    ``,
    `🎯 *3. PIPELINE LEADS & KONVERSI PENJUALAN*`,
    `• Total Leads / Chat WA Masuk: ${formatNumberID(totalProspects)} leads`,
    `  - Minat Rumah Subsidi: ${formatNumberID(totalSubsidi)} prospek`,
    `  - Minat Rumah Komersil: ${formatNumberID(totalKomersil)} prospek`,
    `• Total Janji Survey Lokasi: ${formatNumberID(totalSurveys)} calon buyer`,
    `• Total Booking / Berkas KPR Diajukan: ${formatNumberID(totalBookings)} unit`,
    `• Rasio Konversi Leads -> Survey: ${convLeadToSurvey}`,
    `• Rasio Konversi Survey -> Booking: ${convSurveyToBooking}`,
    ``,
    `✅ *4. KEDISIPLINAN EKSEKUSI TUGAS (TODO HARIAN)*`,
    `• Tingkat Penyelesaian Checklist: ${doneTodos}/${totalTodos} tugas (${todoPct}%)`,
    ``,
    `========================================`,
    `_Laporan diekspor secara otomatis melalui PropPulse Digital Marketing System._`,
  ].join('\n');
}
