#!/usr/bin/env python3
"""
Hye Pray content pipeline: builds a SQLite database from structured prayer content.
Usage: python build_db.py [output_path]
"""
import sqlite3
import json
import sys
import os

DB_SCHEMA = """
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    title_hy TEXT NOT NULL,
    title_translit TEXT NOT NULL,
    title_en TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    time_start TEXT,
    time_end TEXT
);

CREATE TABLE IF NOT EXISTS service_tiers (
    service_id TEXT NOT NULL REFERENCES services(id),
    tier_id TEXT NOT NULL,
    tier_name_en TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    PRIMARY KEY (service_id, tier_id)
);

CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL REFERENCES services(id),
    title_hy TEXT,
    title_translit TEXT,
    title_en TEXT,
    sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS chunks (
    id TEXT PRIMARY KEY,
    section_id TEXT NOT NULL REFERENCES sections(id),
    service_id TEXT NOT NULL REFERENCES services(id),
    role TEXT NOT NULL DEFAULT 'congregation',
    sort_order INTEGER NOT NULL,
    text_hy TEXT NOT NULL DEFAULT '',
    text_translit TEXT NOT NULL DEFAULT '',
    text_en TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS chunk_tiers (
    chunk_id TEXT NOT NULL REFERENCES chunks(id),
    tier_id TEXT NOT NULL,
    PRIMARY KEY (chunk_id, tier_id)
);

CREATE INDEX IF NOT EXISTS idx_sections_service ON sections(service_id);
CREATE INDEX IF NOT EXISTS idx_chunks_section ON chunks(section_id);
CREATE INDEX IF NOT EXISTS idx_chunks_service ON chunks(service_id);

CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
    text_hy, text_translit, text_en,
    content=chunks,
    content_rowid=rowid,
    tokenize='unicode61'
);

CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
    INSERT INTO chunks_fts(rowid, text_hy, text_translit, text_en)
    VALUES (new.rowid, new.text_hy, new.text_translit, new.text_en);
END;
"""


def load_content_files(content_dir: str) -> list[dict]:
    files = sorted(f for f in os.listdir(content_dir) if f.endswith(".json"))
    services = []
    for f in files:
        with open(os.path.join(content_dir, f), "r", encoding="utf-8") as fh:
            services.append(json.load(fh))
    return services


def build_database(services: list[dict], db_path: str):
    if os.path.exists(db_path):
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    conn.executescript(DB_SCHEMA)

    for svc in services:
        conn.execute(
            "INSERT INTO services VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                svc["id"],
                svc["title"]["hy"],
                svc["title"]["translit"],
                svc["title"]["en"],
                svc["sort_order"],
                svc.get("time_start"),
                svc.get("time_end"),
            ),
        )

        for tier in svc.get("tiers", []):
            conn.execute(
                "INSERT INTO service_tiers VALUES (?, ?, ?, ?)",
                (svc["id"], tier["id"], tier["name_en"], tier["sort_order"]),
            )

        for si, section in enumerate(svc["sections"]):
            sec_id = f"{svc['id']}/{section['id']}"
            conn.execute(
                "INSERT INTO sections VALUES (?, ?, ?, ?, ?, ?)",
                (
                    sec_id,
                    svc["id"],
                    section["title"].get("hy", ""),
                    section["title"].get("translit", ""),
                    section["title"].get("en", ""),
                    si,
                ),
            )

            for ci, chunk in enumerate(section["chunks"]):
                chunk_id = f"{sec_id}/{chunk['id']}"
                conn.execute(
                    "INSERT INTO chunks VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (
                        chunk_id,
                        sec_id,
                        svc["id"],
                        chunk.get("role", "congregation"),
                        ci,
                        chunk["hy"],
                        chunk["translit"],
                        chunk["en"],
                    ),
                )

                for tier_id in chunk.get("tiers", []):
                    conn.execute(
                        "INSERT INTO chunk_tiers VALUES (?, ?)",
                        (chunk_id, tier_id),
                    )

    conn.commit()

    row_count = conn.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]
    svc_count = conn.execute("SELECT COUNT(*) FROM services").fetchone()[0]
    sec_count = conn.execute("SELECT COUNT(*) FROM sections").fetchone()[0]
    print(f"Built {db_path}: {svc_count} services, {sec_count} sections, {row_count} chunks")

    conn.execute("VACUUM")
    conn.execute("ANALYZE")
    conn.close()


def main():
    out_path = sys.argv[1] if len(sys.argv) > 1 else "hye_pray.db"
    content_dir = os.path.join(os.path.dirname(__file__), "content")
    services = load_content_files(content_dir)
    build_database(services, out_path)


if __name__ == "__main__":
    main()
