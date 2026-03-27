# Hye Pray

Armenian prayer and devotional application.

Two client apps share the same SQLite database: a **native SwiftUI iOS app** (`ios/`) and a **cross-platform Expo (React Native) app** (`app/`).

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

## Project Structure

```
hye_pray/
├── pipeline/                         # Content pipeline (PDF → JSON → SQLite)
│   ├── parse_pdfs.py                 # PDF → structured JSON parser
│   ├── build_db.py                   # JSON → SQLite database builder
│   ├── content/                      # Generated JSON content files
│   └── source_pdfs/                  # Source PDF prayer books (not committed)
├── ios/                              # Native SwiftUI iOS app
│   └── HyePray/
│       ├── project.yml               # XcodeGen project definition
│       ├── HyePray/
│       │   ├── HyePrayApp.swift
│       │   ├── Models/               # Data models (AppState, Models)
│       │   ├── Database/             # SQLite reader (DatabaseManager)
│       │   ├── Views/                # SwiftUI views
│       │   │   ├── ContentView.swift
│       │   │   ├── SidebarView.swift
│       │   │   ├── ServiceReaderView.swift
│       │   │   ├── SettingsPanel.swift
│       │   │   └── Components/       # ChunkView, SectionHeaderView
│       │   └── Resources/            # SQLite DB + asset catalog
│       └── HyePray.xcodeproj/
└── app/                              # Cross-platform Expo (React Native) app
    ├── app.json                      # Expo config
    ├── package.json
    ├── app/                          # expo-router file-based routes
    │   ├── _layout.tsx               # Root stack layout
    │   ├── settings.tsx              # Settings modal
    │   ├── (drawer)/                 # Drawer navigation
    │   │   ├── _layout.tsx
    │   │   └── index.tsx             # Home: Today's Worship + All Services
    │   └── service/
    │       └── [id].tsx              # Service reader
    ├── components/                   # ChunkView, SectionHeader
    ├── lib/                          # Context, database helpers, types
    └── assets/                       # Bundled SQLite DB + icons
```

## Building

### Prerequisites

**Content pipeline:**
- Python 3.10+
- `pdfplumber` (`pip install pdfplumber`)

**iOS app:**
- Xcode 16+ with iOS 17+ SDK
- `xcodegen` (`brew install xcodegen`)

**Expo app:**
- Node.js 18+
- npm

### Content Pipeline

To rebuild the SQLite database from source PDFs:

```bash
# Copy prayer PDFs to pipeline/source_pdfs/
# Then parse and build:
pip install pdfplumber
python3 pipeline/parse_pdfs.py
python3 pipeline/build_db.py ios/HyePray/HyePray/Resources/hye_pray.db

# Copy the database to the Expo app as well
cp ios/HyePray/HyePray/Resources/hye_pray.db app/assets/hye_pray.db
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

### Expo App

```bash
cd app

# Install dependencies
npm install

# Start the dev server
npx expo start
```

## License

This project is licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
