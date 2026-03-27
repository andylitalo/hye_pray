import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useSQLiteContext } from "expo-sqlite";
import { fetchServices, fetchSections, fetchChunks } from "./database";
import type {
  Service,
  Section,
  Chunk,
  Language,
  AbbreviationTier,
  LayoutMode,
  SectionWithChunks,
} from "./types";

interface AppState {
  ready: boolean;
  services: Service[];
  todayServiceIndex: number;
  visibleLanguages: Set<Language>;
  layoutMode: LayoutMode;
  abbreviationTier: AbbreviationTier;
  fontSize: number;

  setTodayServiceIndex: (i: number) => void;
  toggleLanguage: (lang: Language) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setAbbreviationTier: (tier: AbbreviationTier) => void;
  setFontSize: (size: number) => void;
  advanceToNextService: () => string | null;
  getSectionsWithChunks: (serviceId: string) => Promise<SectionWithChunks[]>;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [ready, setReady] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [todayServiceIndex, setTodayServiceIndex] = useState(0);
  const [visibleLanguages, setVisibleLanguages] = useState<Set<Language>>(
    () => new Set(["hy", "en"] as Language[])
  );
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("stacked");
  const [abbreviationTier, setAbbreviationTier] =
    useState<AbbreviationTier>("full");
  const [fontSize, setFontSize] = useState(16);

  const sectionsCache = React.useRef<Map<string, Section[]>>(new Map());
  const chunksCache = React.useRef<Map<string, Chunk[]>>(new Map());

  useEffect(() => {
    (async () => {
      const svcs = await fetchServices(db);
      setServices(svcs);
      setReady(true);
    })();
  }, [db]);

  const toggleLanguage = useCallback((lang: Language) => {
    setVisibleLanguages((prev) => {
      const next = new Set(prev);
      if (next.has(lang)) {
        if (next.size > 1) next.delete(lang);
      } else {
        next.add(lang);
      }
      return next;
    });
  }, []);

  const advanceToNextService = useCallback((): string | null => {
    let nextId: string | null = null;
    setTodayServiceIndex((prev) => {
      const next = prev + 1;
      if (next < services.length) {
        nextId = services[next].id;
        return next;
      }
      return prev;
    });
    return nextId;
  }, [services]);

  const getSectionsWithChunks = useCallback(
    async (serviceId: string): Promise<SectionWithChunks[]> => {
      let sections = sectionsCache.current.get(serviceId);
      if (!sections) {
        sections = await fetchSections(db, serviceId);
        sectionsCache.current.set(serviceId, sections);
      }

      let allChunks = chunksCache.current.get(serviceId);
      if (!allChunks) {
        allChunks = await fetchChunks(db, serviceId);
        chunksCache.current.set(serviceId, allChunks);
      }

      const filtered = allChunks.filter((c) =>
        c.tierIds.includes(abbreviationTier)
      );

      const chunksBySection = new Map<string, Chunk[]>();
      for (const chunk of filtered) {
        const arr = chunksBySection.get(chunk.sectionId);
        if (arr) arr.push(chunk);
        else chunksBySection.set(chunk.sectionId, [chunk]);
      }

      return sections
        .map((section) => ({
          section,
          chunks: (chunksBySection.get(section.id) || []).sort(
            (a, b) => a.sortOrder - b.sortOrder
          ),
        }))
        .filter((g) => g.chunks.length > 0);
    },
    [db, abbreviationTier]
  );

  const value = useMemo(
    () => ({
      ready,
      services,
      todayServiceIndex,
      visibleLanguages,
      layoutMode,
      abbreviationTier,
      fontSize,
      setTodayServiceIndex,
      toggleLanguage,
      setLayoutMode,
      setAbbreviationTier,
      setFontSize,
      advanceToNextService,
      getSectionsWithChunks,
    }),
    [
      ready,
      services,
      todayServiceIndex,
      visibleLanguages,
      layoutMode,
      abbreviationTier,
      fontSize,
      toggleLanguage,
      advanceToNextService,
      getSectionsWithChunks,
    ]
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx)
    throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
