import Foundation

struct Service: Identifiable, Hashable {
    let id: String
    let titleHy: String
    let titleTranslit: String
    let titleEn: String
    let sortOrder: Int
    let timeStart: String?
    let timeEnd: String?
}

struct ServiceTier: Identifiable, Hashable {
    var id: String { "\(serviceId)/\(tierId)" }
    let serviceId: String
    let tierId: String
    let tierNameEn: String
    let sortOrder: Int
}

struct Section: Identifiable, Hashable {
    let id: String
    let serviceId: String
    let titleHy: String?
    let titleTranslit: String?
    let titleEn: String?
    let sortOrder: Int
}

struct Chunk: Identifiable, Hashable {
    let id: String
    let sectionId: String
    let serviceId: String
    let role: ChunkRole
    let sortOrder: Int
    let textHy: String
    let textTranslit: String
    let textEn: String
    var tierIds: [String] = []

    var isAlwaysShown: Bool { tierIds.isEmpty }
}

enum ChunkRole: String, CaseIterable {
    case priest
    case deacon
    case congregation
    case choir
    case rubric

    var displayName: String {
        switch self {
        case .priest: return "Priest"
        case .deacon: return "Deacon"
        case .congregation: return "Congregation"
        case .choir: return "Choir"
        case .rubric: return "Rubric"
        }
    }
}

enum Language: String, CaseIterable, Identifiable {
    case hy = "Krapar"
    case translit = "Transliteration"
    case en = "English"

    var id: String { rawValue }
}

enum AbbreviationTier: String, CaseIterable, Identifiable {
    case short
    case medium
    case full

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .short: return "Abbreviated"
        case .medium: return "Standard"
        case .full: return "Full Service"
        }
    }
}

enum LayoutMode: String, CaseIterable, Identifiable {
    case stacked
    case columns

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .stacked: return "Stacked"
        case .columns: return "Side by Side"
        }
    }
}
