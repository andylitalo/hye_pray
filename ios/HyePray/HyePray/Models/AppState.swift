import SwiftUI

@Observable
final class AppState {
    var services: [Service] = []
    var selectedServiceId: String?
    var showSettings = false
    var todayServiceIndex = 0

    // Settings
    var visibleLanguages: Set<Language> = [.hy, .translit, .en]
    var layoutMode: LayoutMode = .stacked
    var abbreviationTier: AbbreviationTier = .full
    var fontSize: CGFloat = 16

    // Cached data per service
    private var sectionCache: [String: [Section]] = [:]
    private var chunkCache: [String: [Chunk]] = [:]

    init() {
        loadServices()
        if let first = services.first {
            selectedServiceId = first.id
        }
    }

    func loadServices() {
        services = DatabaseManager.shared.fetchServices()
    }

    var selectedService: Service? {
        services.first { $0.id == selectedServiceId }
    }

    var todayService: Service? {
        guard todayServiceIndex < services.count else { return nil }
        return services[todayServiceIndex]
    }

    var hasNextService: Bool {
        todayServiceIndex < services.count - 1
    }

    func advanceToNextService() {
        if todayServiceIndex < services.count - 1 {
            todayServiceIndex += 1
            selectedServiceId = services[todayServiceIndex].id
        }
    }

    func selectService(_ service: Service) {
        selectedServiceId = service.id
        todayServiceIndex = services.firstIndex(where: { $0.id == service.id }) ?? 0
    }

    func sections(for serviceId: String) -> [Section] {
        if let cached = sectionCache[serviceId] { return cached }
        let sections = DatabaseManager.shared.fetchSections(serviceId: serviceId)
        sectionCache[serviceId] = sections
        return sections
    }

    func chunks(for serviceId: String) -> [Chunk] {
        if let cached = chunkCache[serviceId] { return cached }
        let chunks = DatabaseManager.shared.fetchChunks(serviceId: serviceId)
        chunkCache[serviceId] = chunks
        return chunks
    }

    func filteredChunks(for serviceId: String) -> [Chunk] {
        let allChunks = chunks(for: serviceId)
        let tier = abbreviationTier.rawValue
        return allChunks.filter { chunk in
            if chunk.isAlwaysShown { return true }
            return chunk.tierIds.contains(tier)
        }
    }

    func chunksGroupedBySections(serviceId: String) -> [(section: Section, chunks: [Chunk])] {
        let allSections = sections(for: serviceId)
        let filtered = filteredChunks(for: serviceId)
        let chunksBySection = Dictionary(grouping: filtered, by: \.sectionId)

        return allSections.compactMap { section in
            guard let sectionChunks = chunksBySection[section.id], !sectionChunks.isEmpty else {
                return nil
            }
            return (section: section, chunks: sectionChunks.sorted { $0.sortOrder < $1.sortOrder })
        }
    }

    func toggleLanguage(_ lang: Language) {
        if visibleLanguages.contains(lang) {
            if visibleLanguages.count > 1 {
                visibleLanguages.remove(lang)
            }
        } else {
            visibleLanguages.insert(lang)
        }
    }
}
