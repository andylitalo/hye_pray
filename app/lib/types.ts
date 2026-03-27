export interface Service {
  id: string;
  titleHy: string;
  titleTranslit: string;
  titleEn: string;
  sortOrder: number;
  timeStart: string | null;
  timeEnd: string | null;
}

export interface Section {
  id: string;
  serviceId: string;
  titleHy: string | null;
  titleTranslit: string | null;
  titleEn: string | null;
  sortOrder: number;
}

export interface Chunk {
  id: string;
  sectionId: string;
  serviceId: string;
  role: ChunkRole;
  sortOrder: number;
  textHy: string;
  textTranslit: string;
  textEn: string;
  tierIds: string[];
}

export type ChunkRole = "priest" | "deacon" | "congregation" | "choir" | "rubric";

export type Language = "hy" | "translit" | "en";

export type AbbreviationTier = "short" | "medium" | "full";

export type LayoutMode = "stacked" | "columns";

export const LANGUAGE_LABELS: Record<Language, string> = {
  hy: "Krapar",
  translit: "Transliteration",
  en: "English",
};

export const TIER_LABELS: Record<AbbreviationTier, string> = {
  short: "Abbreviated",
  medium: "Standard",
  full: "Full Service",
};

export const ROLE_COLORS: Record<ChunkRole, string> = {
  priest: "#1a6fc4",
  deacon: "#c43a1a",
  congregation: "#1a1a1a",
  choir: "#7b1ac4",
  rubric: "#888888",
};

export interface SectionWithChunks {
  section: Section;
  chunks: Chunk[];
}
