import SwiftUI

struct SidebarView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        List {
            todaySection
            allServicesSection
        }
        .navigationDestination(for: Service.self) { service in
            ServiceReaderView(service: service)
                .onAppear { appState.selectService(service) }
        }
        .navigationTitle("Hye Pray")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    appState.showSettings = true
                } label: {
                    Image(systemName: "gearshape")
                }
            }
        }
    }

    private var todaySection: some View {
        SwiftUI.Section("Today's Worship") {
            ForEach(Array(appState.services.enumerated()), id: \.element.id) { index, service in
                NavigationLink(value: service) {
                    HStack(spacing: 12) {
                        Image(systemName: index <= appState.todayServiceIndex ? "checkmark.circle.fill" : "circle")
                            .foregroundStyle(index <= appState.todayServiceIndex ? .green : .secondary)
                            .font(.title3)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(service.titleEn)
                                .font(.headline)
                                .foregroundStyle(.primary)
                            if let time = service.timeStart {
                                Text(time)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
                .listRowBackground(
                    service.id == appState.selectedServiceId
                        ? Color.accentColor.opacity(0.1) : Color.clear
                )
            }
        }
    }

    private var allServicesSection: some View {
        SwiftUI.Section("All Services") {
            ForEach(appState.services) { service in
                NavigationLink(value: service) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(service.titleEn)
                            .font(.body)
                        Text(service.titleTranslit)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 2)
                }
            }
        }
    }
}
