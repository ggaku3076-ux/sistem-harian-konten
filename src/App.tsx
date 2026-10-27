import React, { useEffect, useMemo, useRef, useState } from 'react';
import Lenis from 'lenis';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import {
  AppPage,
  DailyContentEntry,
  DailyTargets,
  DailyTodoLog,
  InputStep,
  PerformanceTab,
  PeriodFilter,
} from './types/content';
import {
  addSavedProject,
  clearDraft,
  createDefaultTodoLog,
  createEmptyEntry,
  exportBackupJSON,
  exportEntriesToCSV,
  formatDateID,
  formatTodoWhatsAppReport,
  formatWhatsAppReport,
  getTodayDateString,
  loadDraft,
  loadEntries,
  loadSavedProjects,
  loadTargets,
  loadTodoLogs,
  normalizeEntry,
  saveDraft,
  saveEntries,
  saveTargets,
  saveTodoLogs,
  saveTodoTemplate,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { HeroOverview } from './components/HeroOverview';
import { TodoSection } from './components/TodoSection';
import { DailyInputForm } from './components/DailyInputForm';
import { PerformanceInsights } from './components/PerformanceInsights';
import { HistorySection } from './components/HistorySection';
import { Footer } from './components/Footer';

function parseHashToPage(): AppPage {
  const h = window.location.hash.replace('#', '').toLowerCase();
  if (
    h === 'todo' ||
    h === 'input' ||
    h === 'performa' ||
    h === 'riwayat' ||
    h === 'beranda'
  ) {
    return h;
  }
  return 'beranda';
}

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<AppPage>(() => parseHashToPage());
  const [inputStep, setInputStep] = useState<InputStep>('distribusi');
  const [perfTab, setPerfTab] = useState<PerformanceTab>('satuan');

  const [entries, setEntries] = useState<DailyContentEntry[]>(() => loadEntries());
  const [targets, setTargets] = useState<DailyTargets>(() => loadTargets());
  const [savedProjects, setSavedProjects] = useState<string[]>(() => loadSavedProjects());
  const [period, setPeriod] = useState<PeriodFilter>('30d');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Daily Todo State
  const [todoLogs, setTodoLogs] = useState<DailyTodoLog[]>(() => loadTodoLogs());
  const [currentTodoLog, setCurrentTodoLog] = useState<DailyTodoLog>(() => {
    const today = getTodayDateString();
    const found = loadTodoLogs().find((l) => l.date === today);
    return found || createDefaultTodoLog(today);
  });

  const lenisRef = useRef<Lenis | null>(null);

  const [form, setForm] = useState<DailyContentEntry>(() => {
    const draft = loadDraft();
    if (draft) return draft;
    const existingToday = loadEntries().find((e) => e.date === getTodayDateString());
    if (existingToday) return existingToday;
    return createEmptyEntry(getTodayDateString());
  });

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });
    lenisRef.current = lenis;

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    const onHashChange = () => {
      setActivePage(parseHashToPage());
    };
    window.addEventListener('hashchange', onHashChange);

    return () => {
      window.removeEventListener('hashchange', onHashChange);
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  const navigateTo = (page: AppPage, nextPerfTab?: PerformanceTab) => {
    setActivePage(page);
    if (nextPerfTab) setPerfTab(nextPerfTab);
    window.history.replaceState(null, '', `#${page}`);
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: false });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Auto-save form draft
  useEffect(() => {
    saveDraft(form);
  }, [form]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Todo Handlers
  const persistTodoLog = (log: DailyTodoLog) => {
    const others = todoLogs.filter((l) => l.date !== log.date);
    const next = [log, ...others];
    saveTodoLogs(next);
    setTodoLogs(loadTodoLogs());
  };

  const handleChangeTodoDate = (date: string) => {
    const existing = todoLogs.find((l) => l.date === date);
    setCurrentTodoLog(existing || createDefaultTodoLog(date));
  };

  const handleMoveTodoDate = (oldDate: string, newDate: string) => {
    const source =
      oldDate === currentTodoLog.date
        ? currentTodoLog
        : todoLogs.find((l) => l.date === oldDate) || createDefaultTodoLog(oldDate);

    const movedLog: DailyTodoLog = {
      ...source,
      date: newDate,
      items: source.items.map((item, idx) => ({
        ...item,
        id: `todo-${newDate}-${idx}-${Date.now()}`,
      })),
      updatedAt: new Date().toISOString(),
    };

    const remaining = todoLogs.filter((l) => l.date !== oldDate && l.date !== newDate);
    const next = [movedLog, ...remaining];
    saveTodoLogs(next);
    setTodoLogs(loadTodoLogs());
    setCurrentTodoLog(movedLog);
    showToast(`Tanggal laporan Todo diubah ke ${formatDateID(newDate)}`);
  };

  const handleCopyTodoToDate = (sourceLog: DailyTodoLog, targetDate: string) => {
    const copiedLog: DailyTodoLog = {
      ...sourceLog,
      date: targetDate,
      items: sourceLog.items.map((item, idx) => ({
        ...item,
        id: `todo-${targetDate}-${idx}-${Date.now()}`,
      })),
      updatedAt: new Date().toISOString(),
    };
    const remaining = todoLogs.filter((l) => l.date !== targetDate);
    const next = [copiedLog, ...remaining];
    saveTodoLogs(next);
    setTodoLogs(loadTodoLogs());
    setCurrentTodoLog(copiedLog);
    showToast(`Checklist disalin ke tanggal ${formatDateID(targetDate)}`);
  };

  const handleUpdateCurrentTodo = (updater: (prev: DailyTodoLog) => DailyTodoLog) => {
    setCurrentTodoLog((prev) => {
      const updated = updater(prev);
      persistTodoLog(updated);
      return updated;
    });
  };

  const handleSaveTodoLog = () => {
    persistTodoLog({ ...currentTodoLog, updatedAt: new Date().toISOString() });
    showToast(`Todo tanggal ${formatDateID(currentTodoLog.date)} berhasil disimpan`);
  };

  const handleSaveTodoTemplate = () => {
    saveTodoTemplate(currentTodoLog.items);
    showToast('Daftar tugas disimpan sebagai template harian');
  };

  const handleDeleteTodoDate = (date: string) => {
    const next = todoLogs.filter((l) => l.date !== date);
    saveTodoLogs(next);
    setTodoLogs(loadTodoLogs());
    if (currentTodoLog.date === date) {
      setCurrentTodoLog(createDefaultTodoLog(date));
    }
    showToast(`Arsip todo ${formatDateID(date)} dihapus`);
  };

  const copyTextToClipboard = async (text: string, successMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMsg);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast(successMsg);
    }
  };

  const todayTodoBadge = useMemo(() => {
    const done = currentTodoLog.items.filter((i) => i.completed).length;
    return `${done}/${currentTodoLog.items.length}`;
  }, [currentTodoLog]);

  const isEditingExisting = useMemo(
    () => entries.some((e) => e.id === form.id),
    [entries, form.id]
  );

  const existingForSelectedDate = useMemo(
    () => entries.find((e) => e.date === form.date),
    [entries, form.date]
  );

  const handleQuickInputToday = () => {
    const today = getTodayDateString();
    const todaySaved = entries.find((e) => e.date === today);
    if (todaySaved) {
      setForm(todaySaved);
    } else {
      setForm((prev) => ({ ...prev, date: today }));
    }
    setInputStep('distribusi');
    navigateTo('input');
  };

  const handleSave = () => {
    const nowIso = new Date().toISOString();
    let updatedList: DailyContentEntry[];
    let savedRecord: DailyContentEntry;

    const matchById = entries.find((e) => e.id === form.id);
    const matchByDate = entries.find((e) => e.date === form.date);

    if (matchById) {
      savedRecord = { ...form, updatedAt: nowIso };
      updatedList = entries
        .filter((e) => e.id === form.id || e.date !== form.date)
        .map((e) => (e.id === form.id ? savedRecord : e));
    } else if (matchByDate) {
      savedRecord = {
        ...form,
        id: matchByDate.id,
        createdAt: matchByDate.createdAt,
        updatedAt: nowIso,
      };
      updatedList = entries.map((e) => (e.id === matchByDate.id ? savedRecord : e));
    } else {
      savedRecord = { ...form, createdAt: nowIso, updatedAt: nowIso };
      updatedList = [savedRecord, ...entries];
    }

    saveEntries(updatedList);
    setEntries(loadEntries());
    setForm(savedRecord);
    clearDraft();

    if (form.projectName.trim()) {
      setSavedProjects(addSavedProject(form.projectName));
    }

    showToast(`Laporan ${formatDateID(savedRecord.date)} berhasil disimpan`);
  };

  const handleResetNew = () => {
    const fresh = createEmptyEntry(getTodayDateString());
    setForm(fresh);
    setInputStep('distribusi');
    clearDraft();
    showToast('Formulir direset ke pengaturan awal');
  };

  const handleEditEntry = (entry: DailyContentEntry) => {
    setForm(entry);
    setInputStep('distribusi');
    navigateTo('input');
    showToast(`Memuat laporan ${formatDateID(entry.date)} untuk diedit`);
  };

  const handleChangeEntryDate = (id: string, newDate: string) => {
    const target = entries.find((e) => e.id === id);
    if (!target) return;
    const updatedRecord: DailyContentEntry = {
      ...target,
      date: newDate,
      updatedAt: new Date().toISOString(),
    };
    const next = entries
      .filter((e) => e.id === id || e.date !== newDate)
      .map((e) => (e.id === id ? updatedRecord : e));
    saveEntries(next);
    setEntries(loadEntries());
    if (form.id === id) {
      setForm(updatedRecord);
    }
    showToast(`Tanggal laporan diubah ke ${formatDateID(newDate)}`);
  };

  const handleDeleteEntry = (id: string) => {
    const next = entries.filter((e) => e.id !== id);
    saveEntries(next);
    setEntries(loadEntries());
    if (form.id === id) {
      setForm(createEmptyEntry(getTodayDateString()));
    }
    showToast('Laporan harian berhasil dihapus');
  };

  const handleCopyWhatsApp = (entry: DailyContentEntry) => {
    copyTextToClipboard(
      formatWhatsAppReport(entry),
      'Format laporan WhatsApp berhasil disalin'
    );
  };

  const handleCopyTodoWA = (log: DailyTodoLog) => {
    copyTextToClipboard(
      formatTodoWhatsAppReport(log),
      'Laporan Todo WhatsApp berhasil disalin'
    );
  };

  const handleUpdateTargets = (nextTargets: DailyTargets) => {
    setTargets(nextTargets);
    saveTargets(nextTargets);
  };

  const handleImportJSON = (imported: DailyContentEntry[]) => {
    const map = new Map<string, DailyContentEntry>();
    for (const item of entries) {
      map.set(item.date, item);
    }
    for (const item of imported) {
      if (item && typeof item.date === 'string') {
        map.set(item.date, normalizeEntry(item));
      }
    }
    const merged = Array.from(map.values());
    saveEntries(merged);
    setEntries(loadEntries());
    showToast(`${imported.length} data laporan berhasil diimpor`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      <Navbar
        activePage={activePage}
        onChangePage={(p) => navigateTo(p)}
        inputStep={inputStep}
        onChangeInputStep={(s) => {
          setInputStep(s);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        perfTab={perfTab}
        onChangePerfTab={(t) => {
          setPerfTab(t);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        totalSaved={entries.length}
        todayTodoBadge={todayTodoBadge}
        onQuickInputToday={handleQuickInputToday}
        onExportCSV={() => exportEntriesToCSV(entries)}
      />

      <main style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          {activePage === 'beranda' && (
            <motion.div
              key="page-beranda"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
            >
              <HeroOverview
                entries={entries}
                todayTodo={currentTodoLog}
                onChangeTodoDate={handleChangeTodoDate}
                period={period}
                onChangePeriod={setPeriod}
                onNavigate={navigateTo}
              />
            </motion.div>
          )}

          {activePage === 'todo' && (
            <motion.div
              key="page-todo"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
            >
              <TodoSection
                currentLog={currentTodoLog}
                allLogs={todoLogs}
                onChangeDate={handleChangeTodoDate}
                onMoveLogDate={handleMoveTodoDate}
                onCopyLogToDate={handleCopyTodoToDate}
                onUpdateCurrentLog={handleUpdateCurrentTodo}
                onSaveLog={handleSaveTodoLog}
                onSaveAsTemplate={handleSaveTodoTemplate}
                onCopyTodoWA={handleCopyTodoWA}
                onDeleteLogDate={handleDeleteTodoDate}
              />
            </motion.div>
          )}

          {activePage === 'input' && (
            <motion.div
              key="page-input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
            >
              <DailyInputForm
                form={form}
                step={inputStep}
                onChangeStep={(s) => {
                  setInputStep(s);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                isEditingExisting={isEditingExisting}
                existingForSelectedDate={existingForSelectedDate}
                savedProjects={savedProjects}
                targets={targets}
                onChangeForm={(updater) => setForm((prev) => updater(prev))}
                onSave={handleSave}
                onResetNew={handleResetNew}
                onLoadExistingDate={handleEditEntry}
                onCopyWhatsApp={handleCopyWhatsApp}
                onUpdateTargets={handleUpdateTargets}
              />
            </motion.div>
          )}

          {activePage === 'performa' && (
            <motion.div
              key="page-performa"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
            >
              <PerformanceInsights
                entries={entries}
                targets={targets}
                activeTab={perfTab}
              />
            </motion.div>
          )}

          {activePage === 'riwayat' && (
            <motion.div
              key="page-riwayat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
            >
              <HistorySection
                entries={entries}
                todoLogs={todoLogs}
                onEditEntry={handleEditEntry}
                onChangeEntryDate={handleChangeEntryDate}
                onDeleteEntry={handleDeleteEntry}
                onCopyWhatsApp={handleCopyWhatsApp}
                onExportCSV={() => exportEntriesToCSV(entries)}
                onExportJSON={() => exportBackupJSON(entries)}
                onImportJSON={handleImportJSON}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />

      {/* Apple Clean Pill Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
              backgroundColor: '#1d1d1f',
              color: '#ffffff',
              padding: '11px 20px',
              borderRadius: '9999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
              fontSize: '0.85rem',
              fontWeight: 600,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.16)',
              whiteSpace: 'nowrap',
            }}
          >
            <CheckCircle2 size={16} color="#4ade80" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
