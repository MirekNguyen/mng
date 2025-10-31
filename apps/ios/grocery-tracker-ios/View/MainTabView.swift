import SwiftUI

struct MainTabView: View {
    @StateObject private var networkManager = NetworkManager.shared
    @StateObject private var groceryRepository = ReceiptRepository(networkManager: NetworkManager2(baseURL: "https://ysgw44w44gckoocg0o0ggss4.mirekng.com"))
    @StateObject private var foodEntryRepository = FoodEntryRepository(networkManager: NetworkManager2(baseURL: "https://ysgw44w44gckoocg0o0ggss4.mirekng.com"))
    @StateObject private var foodRepository = FoodRepository(networkManager: NetworkManager2(baseURL: "https://ysgw44w44gckoocg0o0ggss4.mirekng.com"))

    @State private var selectedTab: Int = 0
    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                ImageUploader(selectedTab: $selectedTab)
                    .navigationTitle("Upload")
            }
            .tabItem { Label("Upload", systemImage: "photo") }
            .tag(0)

            // NavigationStack {
            //     NewReceiptTab(selectedTab: $selectedTab)
            //         .navigationTitle("New Receipt")
            // }
            // .tabItem { Label("New", systemImage: "plus.app.fill") }
            // .tag(1)

            NavigationStack {
                OverviewView()
                    .navigationTitle("Overview")
                    .task { await networkManager.fetchReceipts() }
            }
            .tabItem { Label("Overview", systemImage: "doc.text.magnifyingglass") }
            .tag(2)

            NavigationStack {
                StatsView()
                    .navigationTitle("Stats")
            }
            .tabItem { Label("Stats", systemImage: "chart.bar.xaxis") }
            .tag(3)

            NavigationStack {
                TestView()
                    .navigationTitle("Test")
            }
            .tabItem { Label("Test", systemImage: "chart.bar.xaxis") }
            .tag(4)
            NavigationStack {
                FoodEntriesView()
                    .navigationTitle("Food Entries")
            }
            .tabItem { Label("Entries", systemImage: "chart.bar.xaxis") }
            .tag(5)
        }
        .environmentObject(networkManager)
        .environmentObject(groceryRepository)
        .environmentObject(foodEntryRepository)
        .environmentObject(foodRepository)
    }

}
