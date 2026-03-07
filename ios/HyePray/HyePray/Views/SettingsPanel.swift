import SwiftUI

struct SettingsPanel: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        @Bindable var state = appState
        NavigationStack {
            Form {
                languageSection
                layoutSection
                abbreviationSection
                fontSection
                roleColorsSection
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    private var languageSection: some View {
        SwiftUI.Section("Visible Languages") {
            ForEach(Language.allCases) { lang in
                Toggle(isOn: Binding(
                    get: { appState.visibleLanguages.contains(lang) },
                    set: { _ in appState.toggleLanguage(lang) }
                )) {
                    HStack {
                        languageIcon(lang)
                        Text(lang.rawValue)
                    }
                }
            }
        }
    }

    private var layoutSection: some View {
        @Bindable var state = appState
        return SwiftUI.Section("Layout") {
            Picker("Display Mode", selection: $state.layoutMode) {
                ForEach(LayoutMode.allCases) { mode in
                    Text(mode.displayName).tag(mode)
                }
            }
            .pickerStyle(.segmented)
        }
    }

    private var abbreviationSection: some View {
        @Bindable var state = appState
        return SwiftUI.Section {
            Picker("Service Length", selection: $state.abbreviationTier) {
                ForEach(AbbreviationTier.allCases) { tier in
                    Text(tier.displayName).tag(tier)
                }
            }
            .pickerStyle(.segmented)
        } header: {
            Text("Abbreviation")
        } footer: {
            Text(abbreviationFooter)
        }
    }

    private var abbreviationFooter: String {
        switch appState.abbreviationTier {
        case .short:
            return "Shows only core prayers and essential responses."
        case .medium:
            return "Standard service length with most prayers included."
        case .full:
            return "Complete service with all prayers, rubrics, and extended litanies."
        }
    }

    private var fontSection: some View {
        @Bindable var state = appState
        return SwiftUI.Section("Text Size") {
            HStack {
                Text("A")
                    .font(.caption)
                Slider(value: $state.fontSize, in: 12...28, step: 1)
                Text("A")
                    .font(.title2)
            }
            Text("Preview: \(Int(appState.fontSize))pt")
                .font(.system(size: appState.fontSize))
        }
    }

    private var roleColorsSection: some View {
        SwiftUI.Section("Role Colors") {
            HStack(spacing: 4) {
                Circle().fill(.blue).frame(width: 10, height: 10)
                Text("Priest")
                    .font(.caption)
            }
            HStack(spacing: 4) {
                Circle().fill(.green).frame(width: 10, height: 10)
                Text("Deacon")
                    .font(.caption)
            }
            HStack(spacing: 4) {
                Circle().fill(.primary).frame(width: 10, height: 10)
                Text("Congregation")
                    .font(.caption)
            }
            HStack(spacing: 4) {
                Circle().fill(.red.opacity(0.7)).frame(width: 10, height: 10)
                Text("Rubric (instructions)")
                    .font(.caption)
            }
        }
    }

    @ViewBuilder
    private func languageIcon(_ lang: Language) -> some View {
        switch lang {
        case .hy:
            Text("Ա")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(.blue)
        case .translit:
            Text("Aa")
                .font(.system(size: 14, weight: .medium, design: .serif))
                .foregroundStyle(.orange)
        case .en:
            Text("En")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(.green)
        }
    }
}
