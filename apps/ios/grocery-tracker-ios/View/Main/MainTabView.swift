import SwiftUI

struct MainTabView: View {
    @StateObject private var networkManager = NetworkManager.shared
    @StateObject private var groceryRepository = ReceiptRepository(
        networkManager: NetworkManager2(baseURL: "https://mng.dokploy.mirekng.com/"))
    @StateObject private var foodEntryRepository = FoodEntryRepository(
        networkManager: NetworkManager2(baseURL: "https://mng.dokploy.mirekng.com/"))
    @StateObject private var foodRepository = FoodRepository(
        networkManager: NetworkManager2(baseURL: "https://mng.dokploy.mirekng.com/"))

    @State private var selectedTab: Int = 4
    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                ImageUploader(selectedTab: $selectedTab)
                    .navigationTitle("Upload")
            }
            .tabItem { Label("Upload", systemImage: "photo") }
            .tag(0)

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
                ZStack {
                    // GradientBackgroundView()
                    FoodEntryView()
                        // .navigationTitle("Food Entries")
                        .foregroundColor(Styles.Colors.primaryText)
                }
                .background(
                    Image("Wallpaper")
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .edgesIgnoringSafeArea(.all)
                )
            }
            .tabItem { Label("Entries", systemImage: "chart.bar.xaxis") }
            .tag(4)
            NavigationStack {
                CreateEventView()
                    .navigationTitle("Stats")
            }
            .tabItem { Label("Stats", systemImage: "chart.bar.xaxis") }
            .tag(5)
        }
        .tint(.white)
        .toolbarBackground(Color.red, for: .tabBar)
        .environmentObject(networkManager)
        .environmentObject(groceryRepository)
        .environmentObject(foodEntryRepository)
        .environmentObject(foodRepository)
    }

}
