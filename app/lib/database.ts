import type { SQLiteDatabase } from "expo-sqlite";
import type { Service, Section, Chunk, ChunkRole } from "./types";

export async function fetchServices(db: SQLiteDatabase): Promise<Service[]> {
  const rows = await db.getAllAsync<{
    id: string;
    title_hy: string;
    title_translit: string;
    title_en: string;
    sort_order: number;
    time_start: string | null;
    time_end: string | null;
  }>(
    "SELECT id, title_hy, title_translit, title_en, sort_order, time_start, time_end FROM services ORDER BY sort_order"
  );

  return rows.map((r) => ({
    id: r.id,
    titleHy: r.title_hy,
    titleTranslit: r.title_translit,
    titleEn: r.title_en,
    sortOrder: r.sort_order,
    timeStart: r.time_start,
    timeEnd: r.time_end,
  }));
}

export async function fetchSections(
  db: SQLiteDatabase,
  serviceId: string
): Promise<Section[]> {
  const rows = await db.getAllAsync<{
    id: string;
    service_id: string;
    title_hy: string | null;
    title_translit: string | null;
    title_en: string | null;
    sort_order: number;
  }>(
    "SELECT id, service_id, title_hy, title_translit, title_en, sort_order FROM sections WHERE service_id = ? ORDER BY sort_order",
    [serviceId]
  );

  return rows.map((r) => ({
    id: r.id,
    serviceId: r.service_id,
    titleHy: r.title_hy || null,
    titleTranslit: r.title_translit || null,
    titleEn: r.title_en || null,
    sortOrder: r.sort_order,
  }));
}

export async function fetchChunks(
  db: SQLiteDatabase,
  serviceId: string
): Promise<Chunk[]> {
  const rows = await db.getAllAsync<{
    id: string;
    section_id: string;
    service_id: string;
    role: string;
    sort_order: number;
    text_hy: string;
    text_translit: string;
    text_en: string;
  }>(
    "SELECT id, section_id, service_id, role, sort_order, text_hy, text_translit, text_en FROM chunks WHERE service_id = ? ORDER BY section_id, sort_order",
    [serviceId]
  );

  const chunkIds = rows.map((r) => r.id);
  const tierMap = await fetchChunkTiersBatch(db, chunkIds);

  return rows.map((r) => ({
    id: r.id,
    sectionId: r.section_id,
    serviceId: r.service_id,
    role: (r.role as ChunkRole) || "congregation",
    sortOrder: r.sort_order,
    textHy: r.text_hy,
    textTranslit: r.text_translit,
    textEn: r.text_en,
    tierIds: tierMap.get(r.id) || [],
  }));
}

async function fetchChunkTiersBatch(
  db: SQLiteDatabase,
  chunkIds: string[]
): Promise<Map<string, string[]>> {
  if (chunkIds.length === 0) return new Map();

  const result = new Map<string, string[]>();
  const batchSize = 500;

  for (let i = 0; i < chunkIds.length; i += batchSize) {
    const batch = chunkIds.slice(i, i + batchSize);
    const placeholders = batch.map(() => "?").join(",");
    const rows = await db.getAllAsync<{
      chunk_id: string;
      tier_id: string;
    }>(
      `SELECT chunk_id, tier_id FROM chunk_tiers WHERE chunk_id IN (${placeholders})`,
      batch
    );

    for (const r of rows) {
      const existing = result.get(r.chunk_id);
      if (existing) {
        existing.push(r.tier_id);
      } else {
        result.set(r.chunk_id, [r.tier_id]);
      }
    }
  }

  return result;
}
