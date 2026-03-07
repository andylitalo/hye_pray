import SwiftUI

struct ContentView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        @Bindable var state = appState
        NavigationSplitView {
            SidebarView()
        } detail: {
            if let service = appState.selectedService {
                ServiceReaderView(service: service)
            } else {
                ContentUnavailableView(
                    "Select a Service",
                    systemImage: "book.closed",
                    description: Text("Choose a prayer service from the sidebar.")
                )
            }
        }
        .sheet(isPresented: $state.showSettings) {
            SettingsPanel()
        }
    }
}
