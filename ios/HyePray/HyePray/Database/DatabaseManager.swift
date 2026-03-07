import Foundation
import SQLite3

final class DatabaseManager {
    static let shared = DatabaseManager()

    private var db: OpaquePointer?

    private init() {
        openDatabase()
    }

    deinit {
        if let db = db {
            sqlite3_close(db)
        }
    }

    private func openDatabase() {
        guard let dbPath = Bundle.main.path(forResource: "hye_pray", ofType: "db") else {
            print("ERROR: hye_pray.db not found in bundle")
            return
        }
        if sqlite3_open_v2(dbPath, &db, SQLITE_OPEN_READONLY, nil) != SQLITE_OK {
            print("ERROR: Could not open database: \(String(cString: sqlite3_errmsg(db)))")
            db = nil
        }
    }

    // MARK: - Services

    func fetchServices() -> [Service] {
        guard let db = db else { return [] }
        var services: [Service] = []
        let sql = "SELECT id, title_hy, title_translit, title_en, sort_order, time_start, time_end FROM services ORDER BY sort_order"
        var stmt: OpaquePointer?
        if sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK {
            while sqlite3_step(stmt) == SQLITE_ROW {
                services.append(Service(
                    id: columnText(stmt, 0),
                    titleHy: columnText(stmt, 1),
                    titleTranslit: columnText(stmt, 2),
                    titleEn: columnText(stmt, 3),
                    sortOrder: Int(sqlite3_column_int(stmt, 4)),
                    timeStart: columnOptionalText(stmt, 5),
                    timeEnd: columnOptionalText(stmt, 6)
                ))
            }
        }
        sqlite3_finalize(stmt)
        return services
    }

    // MARK: - Tiers

    func fetchTiers(serviceId: String) -> [ServiceTier] {
        guard let db = db else { return [] }
        var tiers: [ServiceTier] = []
        let sql = "SELECT service_id, tier_id, tier_name_en, sort_order FROM service_tiers WHERE service_id = ? ORDER BY sort_order"
        var stmt: OpaquePointer?
        if sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK {
            sqlite3_bind_text(stmt, 1, serviceId, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
            while sqlite3_step(stmt) == SQLITE_ROW {
                tiers.append(ServiceTier(
                    serviceId: columnText(stmt, 0),
                    tierId: columnText(stmt, 1),
                    tierNameEn: columnText(stmt, 2),
                    sortOrder: Int(sqlite3_column_int(stmt, 3))
                ))
            }
        }
        sqlite3_finalize(stmt)
        return tiers
    }

    // MARK: - Sections

    func fetchSections(serviceId: String) -> [Section] {
        guard let db = db else { return [] }
        var sections: [Section] = []
        let sql = "SELECT id, service_id, title_hy, title_translit, title_en, sort_order FROM sections WHERE service_id = ? ORDER BY sort_order"
        var stmt: OpaquePointer?
        if sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK {
            sqlite3_bind_text(stmt, 1, serviceId, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
            while sqlite3_step(stmt) == SQLITE_ROW {
                sections.append(Section(
                    id: columnText(stmt, 0),
                    serviceId: columnText(stmt, 1),
                    titleHy: columnOptionalText(stmt, 2),
                    titleTranslit: columnOptionalText(stmt, 3),
                    titleEn: columnOptionalText(stmt, 4),
                    sortOrder: Int(sqlite3_column_int(stmt, 5))
                ))
            }
        }
        sqlite3_finalize(stmt)
        return sections
    }

    // MARK: - Chunks

    func fetchChunks(serviceId: String) -> [Chunk] {
        guard let db = db else { return [] }
        var chunks: [Chunk] = []
        let sql = """
            SELECT c.id, c.section_id, c.service_id, c.role, c.sort_order,
                   c.text_hy, c.text_translit, c.text_en
            FROM chunks c
            WHERE c.service_id = ?
            ORDER BY c.section_id, c.sort_order
        """
        var stmt: OpaquePointer?
        if sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK {
            sqlite3_bind_text(stmt, 1, serviceId, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
            while sqlite3_step(stmt) == SQLITE_ROW {
                let chunkId = columnText(stmt, 0)
                var chunk = Chunk(
                    id: chunkId,
                    sectionId: columnText(stmt, 1),
                    serviceId: columnText(stmt, 2),
                    role: ChunkRole(rawValue: columnText(stmt, 3)) ?? .congregation,
                    sortOrder: Int(sqlite3_column_int(stmt, 4)),
                    textHy: columnText(stmt, 5),
                    textTranslit: columnText(stmt, 6),
                    textEn: columnText(stmt, 7)
                )
                chunk.tierIds = fetchChunkTiers(chunkId: chunkId)
                chunks.append(chunk)
            }
        }
        sqlite3_finalize(stmt)
        return chunks
    }

    func fetchChunkTiers(chunkId: String) -> [String] {
        guard let db = db else { return [] }
        var tiers: [String] = []
        let sql = "SELECT tier_id FROM chunk_tiers WHERE chunk_id = ?"
        var stmt: OpaquePointer?
        if sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK {
            sqlite3_bind_text(stmt, 1, chunkId, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
            while sqlite3_step(stmt) == SQLITE_ROW {
                tiers.append(columnText(stmt, 0))
            }
        }
        sqlite3_finalize(stmt)
        return tiers
    }

    // MARK: - Helpers

    private func columnText(_ stmt: OpaquePointer?, _ index: Int32) -> String {
        if let cStr = sqlite3_column_text(stmt, index) {
            return String(cString: cStr)
        }
        return ""
    }

    private func columnOptionalText(_ stmt: OpaquePointer?, _ index: Int32) -> String? {
        if sqlite3_column_type(stmt, index) == SQLITE_NULL {
            return nil
        }
        if let cStr = sqlite3_column_text(stmt, index) {
            let s = String(cString: cStr)
            return s.isEmpty ? nil : s
        }
        return nil
    }
}
