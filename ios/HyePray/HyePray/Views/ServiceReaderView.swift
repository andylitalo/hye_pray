import SwiftUI

struct ServiceReaderView: View {
    @Environment(AppState.self) private var appState
    let service: Service

    @State private var scrollPosition: String?

    private var groupedContent: [(section: Section, chunks: [Chunk])] {
        appState.chunksGroupedBySections(serviceId: service.id)
    }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 0) {
                    serviceHeader

                    ForEach(Array(groupedContent.enumerated()), id: \.element.section.id) { _, group in
                        sectionView(group.section, chunks: group.chunks)
                    }

                    if appState.hasNextService {
                        nextServiceButton
                    }

                    Spacer(minLength: 100)
                }
                .padding(.horizontal, 16)
            }
        }
        .navigationTitle(service.titleEn)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    appState.showSettings = true
                } label: {
                    Image(systemName: "textformat.size")
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    ForEach(AbbreviationTier.allCases) { tier in
                        Button {
                            appState.abbreviationTier = tier
                        } label: {
                            HStack {
                                Text(tier.displayName)
                                if appState.abbreviationTier == tier {
                                    Image(systemName: "checkmark")
                                }
                            }
                        }
                    }
                } label: {
                    Image(systemName: "line.3.horizontal.decrease.circle")
                }
            }
        }
    }

    private var serviceHeader: some View {
        VStack(alignment: .center, spacing: 8) {
            Text("☩")
                .font(.largeTitle)
                .foregroundStyle(.secondary)

            if appState.visibleLanguages.contains(.hy) {
                Text(service.titleHy)
                    .font(.system(size: appState.fontSize + 2))
                    .multilineTextAlignment(.center)
            }
            if appState.visibleLanguages.contains(.translit) {
                Text(service.titleTranslit)
                    .font(.system(size: appState.fontSize, design: .serif))
                    .italic()
                    .multilineTextAlignment(.center)
            }
            if appState.visibleLanguages.contains(.en) {
                Text(service.titleEn)
                    .font(.system(size: appState.fontSize + 2, weight: .semibold))
                    .multilineTextAlignment(.center)
            }

            Divider()
                .padding(.top, 8)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
    }

    private func sectionView(_ section: Section, chunks: [Chunk]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeaderView(section: section)
                .id(section.id)

            ForEach(chunks) { chunk in
                ChunkView(chunk: chunk)
                    .id(chunk.id)
            }

            Divider()
                .padding(.vertical, 8)
        }
    }

    private var nextServiceButton: some View {
        Button {
            withAnimation {
                appState.advanceToNextService()
            }
        } label: {
            HStack {
                VStack(alignment: .leading) {
                    Text("Continue to Next Service")
                        .font(.headline)
                    if let next = appState.services[safe: appState.todayServiceIndex + 1] {
                        Text(next.titleEn)
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.8))
                    }
                }
                Spacer()
                Image(systemName: "arrow.right.circle.fill")
                    .font(.title2)
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(Color.accentColor)
            .foregroundStyle(.white)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .padding(.vertical, 24)
    }
}

extension Array {
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
