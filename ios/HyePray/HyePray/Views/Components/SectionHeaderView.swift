import SwiftUI

struct SectionHeaderView: View {
    @Environment(AppState.self) private var appState
    let section: Section

    var body: some View {
        let hasTitle = (section.titleEn ?? "").count > 0
            || (section.titleHy ?? "").count > 0
            || (section.titleTranslit ?? "").count > 0

        if hasTitle {
            VStack(alignment: .leading, spacing: 4) {
                if appState.visibleLanguages.contains(.hy), let hy = section.titleHy, !hy.isEmpty {
                    Text(hy)
                        .font(.system(size: appState.fontSize + 1, weight: .bold))
                        .foregroundStyle(.primary)
                }
                if appState.visibleLanguages.contains(.translit), let tr = section.titleTranslit, !tr.isEmpty {
                    Text(tr)
                        .font(.system(size: appState.fontSize, weight: .semibold, design: .serif))
                        .foregroundStyle(.primary.opacity(0.85))
                        .italic()
                }
                if appState.visibleLanguages.contains(.en), let en = section.titleEn, !en.isEmpty {
                    Text(en)
                        .font(.system(size: appState.fontSize + 1, weight: .bold))
                        .foregroundStyle(.primary)
                }
            }
            .padding(.vertical, 8)
            .padding(.horizontal, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }
}
