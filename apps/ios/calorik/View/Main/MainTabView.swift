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
    @StateObject private var userProfileRepository = UserProfileRepository(
        networkManager: NetworkManager2(baseURL: "https://api.mirekng.com/"))

    @EnvironmentObject private var analysisManager: BackgroundAnalysisManager

    @State private var selectedTab: Int = 0
    @State private var showOnboarding: Bool = false

    private var showAccessory: Bool { analysisManager.isAnalyzing || analysisManager.pendingResult != nil }

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                ZStack {
                    FoodEntryView()
                        .foregroundColor(Styles.Colors.primaryText)
                }
                .background(
                    Image("Wallpaper")
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .edgesIgnoringSafeArea(.all)
                )
            }
            .tabItem { Label("Home", systemImage: "house.fill") }
            .tag(0)
            
            FoodListView()
                .tabItem { Label("Foods", systemImage: "fork.knife") }
                .tag(1)

            StatsTabView()
                .tabItem { Label("Stats", systemImage: "chart.bar.xaxis") }
                .tag(2)
            
            ProfileView(repository: userProfileRepository)
                .tabItem { Label("Profile", systemImage: "person.fill") }
                .tag(3)

        }
        .tint(.accentColor)
        .tabViewBottomAccessory(isEnabled: showAccessory) {
            AnalysisBannerView(manager: analysisManager, onReview: {
                selectedTab = 0
                foodEntryRepository.shouldShowConfirmEntry = true
                foodEntryRepository.pendingEntry = analysisManager.pendingResult
                analysisManager.clearResult()
            })
        }
        .environmentObject(networkManager)
        .environmentObject(groceryRepository)
        .environmentObject(foodEntryRepository)
        .environmentObject(foodRepository)
        .environmentObject(statsRepository)
        .environmentObject(userProfileRepository)
        .sheet(isPresented: $showOnboarding) {
            CompleteProfileView(repository: userProfileRepository, profile: userProfileRepository.profile)
                .interactiveDismissDisabled(true)
        }
        .task {
            await userProfileRepository.fetchProfile()
            if let profile = userProfileRepository.profile, !profile.isProfileComplete {
                showOnboarding = true
            }
        }
    }

}
