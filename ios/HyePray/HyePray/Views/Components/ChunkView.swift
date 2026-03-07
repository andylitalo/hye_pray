import SwiftUI

struct ChunkView: View {
    @Environment(AppState.self) private var appState
    let chunk: Chunk

    var body: some View {
        if appState.layoutMode == .columns && appState.visibleLanguages.count > 1 {
            columnsLayout
        } else {
            stackedLayout
        }
    }

    private var stackedLayout: some View {
        VStack(alignment: .leading, spacing: 6) {
            if appState.visibleLanguages.contains(.hy) && !chunk.textHy.isEmpty {
                textView(chunk.textHy, language: .hy)
            }
            if appState.visibleLanguages.contains(.translit) && !chunk.textTranslit.isEmpty {
                textView(chunk.textTranslit, language: .translit)
            }
            if appState.visibleLanguages.contains(.en) && !chunk.textEn.isEmpty {
                textView(chunk.textEn, language: .en)
            }
        }
        .padding(.vertical, 4)
        .padding(.leading, roleIndent)
        .overlay(alignment: .leading) {
            roleIndicator
        }
    }

    private var columnsLayout: some View {
        HStack(alignment: .top, spacing: 12) {
            if appState.visibleLanguages.contains(.hy) && !chunk.textHy.isEmpty {
                textView(chunk.textHy, language: .hy)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            if appState.visibleLanguages.contains(.translit) && !chunk.textTranslit.isEmpty {
                textView(chunk.textTranslit, language: .translit)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            if appState.visibleLanguages.contains(.en) && !chunk.textEn.isEmpty {
                textView(chunk.textEn, language: .en)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(.vertical, 4)
        .padding(.leading, roleIndent)
        .overlay(alignment: .leading) {
            roleIndicator
        }
    }

    @ViewBuilder
    private func textView(_ text: String, language: Language) -> some View {
        Text(text)
            .font(fontForLanguage(language))
            .foregroundStyle(foregroundForRole)
            .fontWeight(chunk.role == .congregation ? .medium : .regular)
            .fixedSize(horizontal: false, vertical: true)
    }

    private func fontForLanguage(_ language: Language) -> Font {
        switch language {
        case .hy:
            return .system(size: appState.fontSize)
        case .translit:
            return .system(size: appState.fontSize - 1, design: .serif).italic()
        case .en:
            return .system(size: appState.fontSize)
        }
    }

    private var foregroundForRole: Color {
        switch chunk.role {
        case .priest: return .blue
        case .deacon: return .green.opacity(0.85)
        case .congregation: return .primary
        case .choir: return .purple
        case .rubric: return .red.opacity(0.7)
        }
    }

    private var roleIndent: CGFloat {
        switch chunk.role {
        case .rubric: return 8
        case .priest: return 8
        default: return 0
        }
    }

    @ViewBuilder
    private var roleIndicator: some View {
        switch chunk.role {
        case .priest:
            Rectangle()
                .fill(Color.blue.opacity(0.4))
                .frame(width: 3)
        case .deacon:
            Rectangle()
                .fill(Color.green.opacity(0.4))
                .frame(width: 3)
        case .rubric:
            Rectangle()
                .fill(Color.red.opacity(0.3))
                .frame(width: 3)
        default:
            EmptyView()
        }
    }
}
