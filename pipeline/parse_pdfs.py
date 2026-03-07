#!/usr/bin/env python3
"""
Parse Armenian prayer PDFs into structured JSON content files.

Uses pdfplumber word-level extraction to separate the 3-column layout
(Armenian | Transliteration | English) and produce structured JSON
compatible with build_db.py.
"""
import json
import os
import re
import sys
from collections import defaultdict

import pdfplumber

GAP_THRESHOLD = 4.0  # vertical gap between rows that signals a new chunk


def deduplicate_word(word: str) -> str:
    """Fix PDF bold-simulation where each character is doubled: 'OOFF' -> 'OF'."""
    if len(word) < 4:
        return word
    result = []
    i = 0
    while i < len(word):
        if i + 1 < len(word) and word[i] == word[i + 1]:
            result.append(word[i])
            i += 2
        else:
            result.append(word[i])
            i += 1
    candidate = "".join(result)
    if len(candidate) >= 2 and len(candidate) < len(word):
        return candidate
    return word


def is_doubled_text(text: str) -> bool:
    words = text.split()
    doubled_count = sum(1 for w in words if len(w) >= 4 and all(
        w[j] == w[j+1] for j in range(0, len(w)-1, 2)
    ) and len(w) % 2 == 0)
    return doubled_count > len(words) * 0.5


def clean_doubled(text: str) -> str:
    if not is_doubled_text(text):
        return text
    return " ".join(deduplicate_word(w) for w in text.split())


def extract_rows(pdf_path: str) -> list[dict]:
    """Extract text organized by rows from a 3-column PDF.
    
    Returns list of: {"hy": str, "translit": str, "en": str, "top": float, "page": int}
    """
    rows = []

    with pdfplumber.open(pdf_path) as pdf:
        page_offset = 0.0
        for page_num, page in enumerate(pdf.pages):
            words = page.extract_words(keep_blank_chars=False)
            if not words:
                continue

            pw = page.width
            col1_max = pw * 0.33
            col2_max = pw * 0.66

            lines_by_top = defaultdict(list)
            for w in words:
                rounded_top = round(w["top"] / 2.5) * 2.5
                lines_by_top[rounded_top].append(w)

            for top in sorted(lines_by_top.keys()):
                lw = sorted(lines_by_top[top], key=lambda w: w["x0"])

                col1 = " ".join(w["text"] for w in lw if w["x0"] < col1_max).strip()
                col2 = " ".join(w["text"] for w in lw if col1_max <= w["x0"] < col2_max).strip()
                col3 = " ".join(w["text"] for w in lw if w["x0"] >= col2_max).strip()

                if col1 or col2 or col3:
                    rows.append({
                        "hy": col1,
                        "translit": col2,
                        "en": col3,
                        "top": page_offset + top,
                        "page": page_num + 1,
                    })

            page_offset += page.height + 50

    return rows


def should_skip_row(row: dict) -> bool:
    combined = f"{row['hy']} {row['translit']} {row['en']}"
    if re.search(r"Armenian Apostolic Church", combined):
        return True
    if re.search(r"Morning Praise.*Armenian|Divine Liturgy.*Armenian", combined):
        return True
    en = row["en"].strip()
    if re.match(r"^\d+$", en):
        return True
    translit = row["translit"].strip()
    if re.match(r"^\d+$", translit) and not row["hy"].strip():
        return True
    if "Jump to" in combined or "(Jump to" in combined:
        return True
    if combined.strip() in ("Observe carefully",):
        return True
    credit_patterns = [r"Պatras.*Ծ\.Ք", r"Patras", r"Կarapet.*Ծ\.Ք", r"Telfeyan"]
    for pat in credit_patterns:
        if re.search(pat, combined, re.IGNORECASE):
            return True
    hy = row["hy"].strip()
    if re.match(r"^ՀAYASTANDAYTS|^ԳISHES|^ՀAYASTAND", hy) and re.match(r"^\d+$", translit):
        return True
    return False


def is_section_header(row: dict) -> bool:
    hy = row["hy"].strip()
    translit = row["translit"].strip()
    en = row["en"].strip()

    if not translit and not en:
        return False

    if is_doubled_text(translit) or is_doubled_text(en):
        return True

    def looks_like_title(text: str) -> bool:
        cleaned = re.sub(r"[♰\s\.\(\)0-9,\-—:•]", "", text)
        if not cleaned:
            return False
        if cleaned.isascii():
            return cleaned == cleaned.upper() and len(cleaned) > 2
        return False

    tr_is_title = looks_like_title(translit) if translit else False
    en_is_title = looks_like_title(en) if en else False

    if tr_is_title and en_is_title:
        return True

    if hy and tr_is_title and not en:
        return True

    title_markers = [
        r"^PSALM", r"^INTROIT", r"^SONG", r"^PRAYER", r"^PROCLAMATION",
        r"^TRISAGION", r"^BIDDING", r"^PREPARATION", r"^VESTING",
        r"^LITANY", r"^MORNING", r"^RENUNCIATION", r"^CONFESSION",
        r"^ABSOLUTION", r"^THE SANCTUS", r"^HOLY COMMUNION",
        r"^LORD'S PRAYER", r"^DOXOLOGY", r"^EPIK?CLESIS",
        r"^INTERCESSIONS", r"^PREFACE", r"^PROLOGUE",
    ]
    for pat in title_markers:
        if re.match(pat, en, re.IGNORECASE):
            return True

    return False


def detect_role(hy: str, translit: str, en: str) -> str:
    if "♰" in f"{hy}{translit}{en}":
        return "priest"
    en_lower = en.lower().strip()
    if en_lower.startswith("—") or en_lower.startswith("\u2014"):
        return "congregation"
    combined = f"{translit} {en}".lower()
    if "the deacon" in combined or "sarkavak" in combined or "sargavak" in combined:
        return "deacon"
    if "the priest" in combined or "kahanayn" in combined:
        return "priest"
    if "the faithful" in combined or "havadatsyalk" in combined:
        return "congregation"
    if en_lower.startswith("repeat ") or "shall say" in en_lower or "facing " in en_lower:
        return "rubric"
    if "he shall" in en_lower and len(en) < 80:
        return "rubric"
    if en_lower.startswith("the canon") or en_lower.startswith("here is"):
        return "rubric"
    return "congregation"


def group_rows_into_chunks(rows: list[dict]) -> list[dict]:
    """Group consecutive rows into chunks based on vertical gaps."""
    if not rows:
        return []

    chunks = []
    buf_hy, buf_tr, buf_en = [], [], []
    prev_top = rows[0]["top"]

    def flush():
        hy = " ".join(buf_hy).strip()
        tr = " ".join(buf_tr).strip()
        en = " ".join(buf_en).strip()
        hy = re.sub(r"\s+", " ", hy)
        tr = re.sub(r"\s+", " ", tr)
        en = re.sub(r"\s+", " ", en)
        if hy or tr or en:
            chunks.append({"hy": hy, "translit": tr, "en": en})
        buf_hy.clear()
        buf_tr.clear()
        buf_en.clear()

    for row in rows:
        gap = row["top"] - prev_top
        if gap > GAP_THRESHOLD and (buf_hy or buf_tr or buf_en):
            flush()
        if row["hy"]:
            buf_hy.append(row["hy"])
        if row["translit"]:
            buf_tr.append(row["translit"])
        if row["en"]:
            buf_en.append(row["en"])
        prev_top = row["top"]

    flush()
    return chunks


def parse_pdf(pdf_path: str) -> list[dict]:
    """Parse a PDF into sections with chunks."""
    raw_rows = extract_rows(pdf_path)
    filtered = [r for r in raw_rows if not should_skip_row(r)]

    sections = []
    current_section = None
    current_rows = []
    chunk_counter = 0

    def flush_section():
        nonlocal chunk_counter
        if not current_rows or not current_section:
            current_rows.clear()
            return
        raw_chunks = group_rows_into_chunks(current_rows)
        for rc in raw_chunks:
            chunk_counter += 1
            role = detect_role(rc["hy"], rc["translit"], rc["en"])
            current_section["chunks"].append({
                "id": f"chunk_{chunk_counter:04d}",
                "role": role,
                "hy": rc["hy"],
                "translit": rc["translit"],
                "en": rc["en"],
            })
        current_rows.clear()

    seen_section_ids = set()

    for row in filtered:
        if is_section_header(row):
            flush_section()

            hy_title = clean_doubled(row["hy"]).strip()
            tr_title = clean_doubled(row["translit"]).strip()
            en_title = clean_doubled(row["en"]).strip()

            base_id = tr_title.lower() if tr_title else en_title.lower()
            sec_id = re.sub(r"[^a-z0-9_]", "_", base_id)
            sec_id = re.sub(r"_+", "_", sec_id).strip("_")[:50]
            if not sec_id:
                sec_id = f"section_{len(sections)}"

            if sec_id in seen_section_ids:
                sec_id = f"{sec_id}_{len(sections)}"
            seen_section_ids.add(sec_id)

            current_section = {
                "id": sec_id,
                "title": {"hy": hy_title, "translit": tr_title, "en": en_title},
                "chunks": [],
            }
            sections.append(current_section)
            continue

        if current_section is None:
            current_section = {
                "id": "opening",
                "title": {"hy": "", "translit": "", "en": "Opening"},
                "chunks": [],
            }
            sections.append(current_section)
            seen_section_ids.add("opening")

        current_rows.append(row)

    flush_section()
    return [s for s in sections if s["chunks"]]


def assign_abbreviation_tiers(sections: list[dict]) -> None:
    """Assign abbreviation tiers at the section level.
    
    Untagged chunks = always shown (included in short/medium/full).
    Tagged ["medium","full"] = shown in medium and full only.
    Tagged ["full"] = shown only in full service.
    
    The first ~20% and last ~10% of sections are always shown (opening/closing).
    Psalm, song, litany sections in the middle get medium/full tags.
    """
    n = len(sections)
    if n == 0:
        return

    core_section_keywords = [
        "opening", "renunciation", "confession", "absolution", "trisagion",
        "preparation", "vesting", "communion", "dismissal", "lord's prayer",
        "our father", "creed",
    ]

    for si, section in enumerate(sections):
        sec_title_lower = section.get("title", {}).get("en", "").lower()
        sec_id_lower = section.get("id", "").lower()
        combined = f"{sec_title_lower} {sec_id_lower}"
        progress = si / max(n - 1, 1)

        is_core_section = any(kw in combined for kw in core_section_keywords)
        is_bookend = progress < 0.15 or progress > 0.88

        if is_core_section or is_bookend:
            continue  # all chunks always shown

        is_psalm = "psalm" in combined or "saghmos" in combined
        is_song = "song" in combined or "yerk" in combined
        is_litany = "litany" in combined or "proclamation" in combined or "karoz" in combined
        is_extended = is_psalm or is_song or is_litany

        for i, chunk in enumerate(section["chunks"]):
            if chunk["role"] == "rubric":
                chunk["tiers"] = ["full"]
            elif is_extended:
                if i < 3:
                    chunk["tiers"] = ["medium", "full"]
                else:
                    chunk["tiers"] = ["full"]
            else:
                chunk["tiers"] = ["medium", "full"]


SERVICE_CONFIGS = [
    {
        "filename": "1_beginning.pdf",
        "id": "beginning",
        "title": {"hy": "Սdelays Աdelays", "translit": "Skizb Aghotkits", "en": "Beginning Prayers"},
        "sort_order": 0,
        "time_start": "06:00",
        "time_end": "07:00",
    },
    {
        "filename": "2_morning_worship.pdf",
        "id": "morning_worship",
        "title": {"hy": "Գdelays ԵV Aṙdelays", "translit": "Kisherayin yev Aravotyan Jhamk", "en": "Night & Morning Worship"},
        "sort_order": 1,
        "time_start": "07:00",
        "time_end": "09:00",
    },
    {
        "filename": "3_badarak.pdf",
        "id": "badarak",
        "title": {"hy": "Delays Badarak", "translit": "Srpazan Badarak", "en": "Divine Liturgy"},
        "sort_order": 2,
        "time_start": "10:00",
        "time_end": "12:00",
    },
]


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    source_dir = os.path.join(script_dir, "source_pdfs")
    output_dir = os.path.join(script_dir, "content")
    os.makedirs(output_dir, exist_ok=True)

    for config in SERVICE_CONFIGS:
        pdf_path = os.path.join(source_dir, config["filename"])
        if not os.path.exists(pdf_path):
            print(f"WARNING: {pdf_path} not found")
            continue

        print(f"Processing {config['filename']}...")
        sections = parse_pdf(pdf_path)
        if not sections:
            print(f"  No sections parsed")
            continue

        tiers = [
            {"id": "short", "name_en": "Abbreviated", "sort_order": 0},
            {"id": "medium", "name_en": "Standard", "sort_order": 1},
            {"id": "full", "name_en": "Full Service", "sort_order": 2},
        ]
        assign_abbreviation_tiers(sections)

        service = {
            "id": config["id"],
            "title": config["title"],
            "sort_order": config["sort_order"],
            "time_start": config.get("time_start"),
            "time_end": config.get("time_end"),
            "tiers": tiers,
            "sections": sections,
        }

        total = sum(len(s["chunks"]) for s in sections)
        print(f"  {len(sections)} sections, {total} chunks")
        for s in sections[:10]:
            print(f"    [{s['id'][:30]}] {s['title'].get('en','')[:40]} — {len(s['chunks'])} chunks")
        if len(sections) > 10:
            print(f"    ... and {len(sections)-10} more sections")

        out = os.path.join(output_dir, f"{config['sort_order']}_{config['id']}.json")
        with open(out, "w", encoding="utf-8") as f:
            json.dump(service, f, ensure_ascii=False, indent=2)
        print(f"  -> {out}")

    print("\nDone! Run: python3 pipeline/build_db.py")


if __name__ == "__main__":
    main()
