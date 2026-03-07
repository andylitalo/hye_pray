# Hye Pray

Armenian prayer and devotional application.

## Demo

This is a demo version with three services parsed from PDF prayer books:

1. **Beginning Prayers** — Renunciation, Confession of Faith, Confession of Guilt, Absolution
2. **Night & Morning Worship** — Psalms, Hymns, Proclamations, Prayers, Trisagion
3. **Divine Liturgy (Badarak)** — The complete liturgical service

### Features

- **Multi-language display**: Krapar (Armenian script), transliteration, and English
- **Column or stacked layout**: View translations side-by-side or stacked
- **Abbreviation tiers**: Full, Standard, or Abbreviated service length
- **Today's Worship flow**: Navigate through services in liturgical order
- **Sidebar navigation**: Jump to any service directly
- **Role-based styling**: Priest (blue), Deacon (green), Congregation, Rubrics (red)
- **Adjustable text size**

## Building

### Prerequisites

- Xcode 16+ with iOS 17+ SDK
- Python 3.10+ (for content pipeline)
- `pdfplumber` Python package (`pip install pdfplumber`)
- `xcodegen` (`brew install xcodegen`)

### Content Pipeline

To rebuild the SQLite database from source PDFs:

```bash
# Copy prayer PDFs to pipeline/source_pdfs/
# Then parse and build:
pip install pdfplumber
python3 pipeline/parse_pdfs.py
python3 pipeline/build_db.py ios/HyePray/HyePray/Resources/hye_pray.db
```

### iOS App

```bash
cd ios/HyePray

# Generate Xcode project (after any project.yml changes)
xcodegen generate

# Build for simulator
xcodebuild -project HyePray.xcodeproj \
  -scheme HyePray \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  build

# Or open in Xcode
open HyePray.xcodeproj
```

## Project Structure

```
hye_pray/
├── pipeline/
│   ├── parse_pdfs.py          # PDF → structured JSON parser
│   ├── build_db.py            # JSON → SQLite database builder
│   ├── content/               # Generated JSON content files
│   └── source_pdfs/           # Source PDF prayer books (not committed)
├── ios/
│   └── HyePray/
│       ├── project.yml        # xcodegen project definition
│       ├── HyePray/
│       │   ├── HyePrayApp.swift
│       │   ├── Models/        # Data models + app state
│       │   ├── Database/      # SQLite reader
│       │   ├── Views/         # SwiftUI views
│       │   └── Resources/     # SQLite DB + assets
│       └── HyePray.xcodeproj/
└── docs/                      # Design documentation
```

## License

This project is licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
