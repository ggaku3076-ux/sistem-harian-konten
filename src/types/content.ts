export type PropertyCategory = 'subsidi' | 'komersil' | 'keduanya';

export type LivePlatform = 'TikTok' | 'Instagram' | 'Facebook';

export type SocialPlatformKey = 'tiktok' | 'instagram' | 'facebook';

export type AppPage = 'beranda' | 'todo' | 'input' | 'performa' | 'riwayat';

export type InputStep = 'distribusi' | 'engagement' | 'prospek';

export type PerformanceTab = 'satuan' | 'mingguan' | 'gabungan';

export type TodoTab = 'checklist' | 'satuan' | 'mingguan' | 'gabungan';

export type TodoCategory =
  | 'Konten'
  | 'Sosmed'
  | 'Grup & Iklan'
  | 'Live'
  | 'Prospek & Survey'
  | 'Lainnya';

export interface TodoItem {
  id: string;
  title: string;
  category: TodoCategory;
  completed: boolean;
  completedAt?: string;
}

export interface DailyTodoLog {
  date: string; // YYYY-MM-DD (Tanggal Laporan)
  items: TodoItem[];
  notes: string;
  updatedAt: string;
}

export interface SocialPlatformEntry {
  active: boolean;
  posts: number;
}

export interface PlatformEngagement {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  waLinkClicks: number;
}

export interface DailyContentEntry {
  id: string;
  date: string; // YYYY-MM-DD
  propertyCategory: PropertyCategory;
  projectName: string;
  contentTypes: string[];

  // Produksi & Distribusi
  contentCreated: number;
  platforms: {
    tiktok: SocialPlatformEntry;
    instagram: SocialPlatformEntry;
    facebook: SocialPlatformEntry;
  };
  groupsShared: number;
  marketplacePosted: number;

  // Live Streaming
  isLive: boolean;
  livePlatforms: LivePlatform[];
  liveDurationMinutes: number;
  liveViewers: number;

  // Metrik Engagement Terpisah per Platform (TT, IG, FB)
  engagementByPlatform: {
    tiktok: PlatformEngagement;
    instagram: PlatformEngagement;
    facebook: PlatformEngagement;
  };

  // Total Akumulasi Otomatis (TT + IG + FB)
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  waLinkClicks: number;

  // Prospek & Pipeline Properti
  hasProspect: boolean;
  prospectTotal: number;
  prospectSubsidi: number;
  prospectKomersil: number;
  surveyCount: number;
  bookingCount: number;
  notes: string;

  createdAt: string;
  updatedAt: string;
}

export interface DailyTargets {
  dailyContent: number;
  dailyGroups: number;
  dailyPosts: number;
}

export type PeriodFilter = 'today' | '7d' | '30d' | 'all';
