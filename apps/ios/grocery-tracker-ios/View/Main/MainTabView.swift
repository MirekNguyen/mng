import SwiftUI

struct MainTabView: View {
    @StateObject private var networkManager = NetworkManager.shared
    @StateObject private var groceryRepository = ReceiptRepository(
        networkManager: NetworkManager2(baseURL: "https://api.mirekng.com/"))
    @StateObject private var foodEntryRepository = FoodEntryRepository(
        networkManager: NetworkManager2(baseURL: "https://api.mirekng.com/"))
    @StateObject private var foodRepository = FoodRepository(
        networkManager: NetworkManager2(baseURL: "https://api.mirekng.com/"))
    @StateObject private var statsRepository = StatsRepository(
        networkManager: NetworkManager2(baseURL: "https://api.mirekng.com/"))

    @State private var selectedTab: Int = 0
    var body: some View {
        TabView(selection: $selectedTab) {
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
            .tag(0)
            
            FoodListView()
                .tabItem { Label("Foods", systemImage: "fork.knife") }
                .tag(1)

            StatsTabView()
                .tabItem { Label("Stats", systemImage: "chart.bar.xaxis") }
                .tag(2)

        }
        .tint(.white)
        .toolbarBackground(Color.red, for: .tabBar)
        .environmentObject(networkManager)
        .environmentObject(groceryRepository)
        .environmentObject(foodEntryRepository)
        .environmentObject(foodRepository)
        .environmentObject(statsRepository)
    }

}
