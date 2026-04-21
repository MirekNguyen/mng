import SwiftUI

struct ProfileView: View {
    @ObservedObject var repository: UserProfileRepository
    @EnvironmentObject var statsRepository: StatsRepository
    @State private var showCompleteProfile = false
    @State private var showEditProfile = false
    
    init(repository: UserProfileRepository) {
        self.repository = repository
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                Image("Wallpaper")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .edgesIgnoringSafeArea(.all)
                    .background(Color.black)
                
                if repository.isLoading {
                    ProgressView()
                        .scaleEffect(1.5)
                        .tint(.accentColor)
                } else if let profile = repository.profile {
                    profileContent(profile: profile)
                } else {
                    errorView
                }
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    if repository.profile != nil {
                        Button(action: { showEditProfile = true }) {
                            Image(systemName: "pencil")
                                .font(.system(size: 15, weight: .medium))
                                .foregroundColor(.accentColor)
                        }
                    }
                }
            }
            .task {
                await repository.fetchProfile()
            }
            .sheet(isPresented: $showCompleteProfile) {
                CompleteProfileView(repository: repository, profile: repository.profile)
            }
            .sheet(isPresented: $showEditProfile) {
                EditProfileView(repository: repository)
            }
        }
    }
    
    private func profileContent(profile: UserProfile) -> some View {
        List {
            Group {
                VStack(spacing: 20) {
                    profileHeader(profile: profile)
                    
                    if !profile.isProfileComplete {
                        incompleteProfileBanner
                    }
                    
                    if profile.height != nil || profile.weight != nil || profile.targetWeight != nil || profile.age != nil || profile.gender != nil {
                        bodyMetrics(profile: profile)
                    }
                    
                    if profile.goal != nil || profile.activityLevel != nil || profile.dailyCalorieTarget != nil {
                        goalSection(profile: profile)
                    }
                    
                    if profile.bmr != nil || profile.tdee != nil {
                        metabolismSection(profile: profile)
                    }
                    
                    ProfileStatsSection(statsRepository: statsRepository)
                }
                // Use a fixed top padding so the profile card has consistent breathing room
                // regardless of whether the large nav title is expanded or collapsed.
                .padding(.top, 16)
                .padding(.bottom, 20)
                .padding(.horizontal, 16)
            }
            .listRowInsets(EdgeInsets())
            .listRowSeparator(.hidden)
            .listRowBackground(Color.clear)
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
    }
    
    private var incompleteProfileBanner: some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 32))
                .foregroundColor(.accentColor)
            
            VStack(spacing: 6) {
                Text("Complete Your Profile")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.white)
                
                Text("Add your details to get personalized nutrition tracking and better insights")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white.opacity(0.7))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 20)
            }
            
            Button(action: { showCompleteProfile = true }) {
                Text("Complete Profile")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.accentColor)
                    )
            }
        }
        .padding(.vertical, 28)
        .frame(maxWidth: .infinity)
        .glassSectionCard()
    }
    
    private func profileHeader(profile: UserProfile) -> some View {
        VStack(spacing: 20) {
            if let avatarUrlString = profile.avatarUrl, let avatarUrl = URL(string: avatarUrlString) {
                AsyncImage(url: avatarUrl) { phase in
                    switch phase {
                    case .empty:
                        ZStack {
                            Circle()
                                .fill(Color.gray.opacity(0.3))
                                .frame(width: 100, height: 100)
                            ProgressView()
                                .tint(.accentColor)
                        }
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: 100, height: 100)
                            .clipShape(Circle())
                            .shadow(color: Color.accentColor.opacity(0.3), radius: 10, x: 0, y: 4)
                    case .failure:
                        avatarInitials(profile: profile)
                    @unknown default:
                        avatarInitials(profile: profile)
                    }
                }
            } else {
                avatarInitials(profile: profile)
            }
            
            VStack(spacing: 8) {
                Text(profile.name)
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.white)
                
                Text(profile.email)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.white.opacity(0.7))
            }
        }
        .padding(.vertical, 32)
        .frame(maxWidth: .infinity)
        .glassSectionCard()
    }
    
    private func avatarInitials(profile: UserProfile) -> some View {
        ZStack {
            Circle()
                .fill(Color.accentColor)
                .frame(width: 100, height: 100)
                .shadow(color: Color.accentColor.opacity(0.3), radius: 10, x: 0, y: 4)
            
            Text(profile.name.prefix(2).uppercased())
                .font(.system(size: 42, weight: .bold, design: .rounded))
                .foregroundColor(.white)
        }
    }
    
    private func bodyMetrics(profile: UserProfile) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Body Metrics")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.white)
                .padding(.horizontal, 20)
                .padding(.top, 24)
                .padding(.bottom, 20)
            
            VStack(spacing: 0) {
                if let height = profile.height {
                    metricRow(label: "Height", value: "\(height) cm", icon: "ruler")
                    if profile.weight != nil || profile.targetWeight != nil || profile.age != nil || profile.gender != nil {
                        Divider().opacity(0.15).padding(.leading, 60)
                    }
                }
                
                if let weight = profile.weight {
                    metricRow(label: "Current Weight", value: String(format: "%.1f kg", weight), icon: "scalemass")
                    if profile.targetWeight != nil || profile.age != nil || profile.gender != nil {
                        Divider().opacity(0.15).padding(.leading, 60)
                    }
                }
                
                if let targetWeight = profile.targetWeight {
                    metricRow(label: "Target Weight", value: String(format: "%.1f kg", targetWeight), icon: "target")
                    if profile.age != nil || profile.gender != nil {
                        Divider().opacity(0.15).padding(.leading, 60)
                    }
                }
                
                if let age = profile.age {
                    metricRow(label: "Age", value: "\(age) years", icon: "calendar")
                    if profile.gender != nil {
                        Divider().opacity(0.15).padding(.leading, 60)
                    }
                }
                
                if let gender = profile.gender {
                    metricRow(label: "Gender", value: gender.capitalized, icon: "person")
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 24)
        }
        .glassSectionCard()
    }
    
    private func metricRow(label: String, value: String, icon: String) -> some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(.accentColor)
                .frame(width: 24)
            
            Text(label)
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.white)
            
            Spacer()
            
            Text(value)
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.white.opacity(0.7))
        }
        .padding(.vertical, 14)
    }
    
    private func metricRowWithTip(label: String, value: String, icon: String, tip: String) -> some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(.accentColor)
                .frame(width: 24)
            
            HStack(spacing: 4) {
                Text(label)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.white)
                
                Image(systemName: "info.circle")
                    .font(.system(size: 12))
                    .foregroundColor(.white.opacity(0.4))
                    .help(tip)
            }
            
            Spacer()
            
            Text(value)
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.white.opacity(0.7))
        }
        .padding(.vertical, 14)
    }
    
    private func goalSection(profile: UserProfile) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Goals & Activity")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.white)
                .padding(.horizontal, 20)
                .padding(.top, 24)
                .padding(.bottom, 20)
            
            VStack(spacing: 0) {
                if let goal = profile.goal {
                    metricRow(label: "Goal", value: goal.capitalized, icon: "flag.fill")
                    if profile.activityLevel != nil || profile.dailyCalorieTarget != nil {
                        Divider().opacity(0.15).padding(.leading, 60)
                    }
                }
                
                if let activityLevel = profile.activityLevel {
                    metricRow(label: "Activity Level", value: activityLevel.capitalized, icon: "figure.walk")
                    if profile.dailyCalorieTarget != nil {
                        Divider().opacity(0.15).padding(.leading, 60)
                    }
                }
                
                if let dailyCalorieTarget = profile.dailyCalorieTarget {
                    metricRow(label: "Daily Target", value: "\(dailyCalorieTarget) kcal", icon: "flame")
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 24)
        }
        .glassSectionCard()
    }
    
    private func metabolismSection(profile: UserProfile) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Metabolism")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.white)
                .padding(.horizontal, 20)
                .padding(.top, 24)
                .padding(.bottom, 20)
            
            VStack(spacing: 0) {
                if let bmr = profile.bmr {
                    metricRowWithTip(
                        label: "BMR", value: "\(Int(bmr)) kcal/day", icon: "heart.fill",
                        tip: "Basal Metabolic Rate — calories your body burns at rest to maintain basic functions like breathing and circulation."
                    )
                    if profile.tdee != nil {
                        Divider().opacity(0.15).padding(.leading, 60)
                    }
                }
                
                if let tdee = profile.tdee {
                    metricRowWithTip(
                        label: "TDEE", value: "\(Int(tdee)) kcal/day", icon: "flame.fill",
                        tip: "Total Daily Energy Expenditure — your BMR plus calories burned through daily activity and exercise."
                    )
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 24)
        }
        .glassSectionCard()
    }
    
    private var errorView: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.crop.circle.badge.exclamationmark")
                .font(.system(size: 64))
                .foregroundColor(.accentColor)
            
            Text("Failed to load profile")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(.primary)
            
            if let error = repository.errorMessage {
                Text(error)
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
            
            Button(action: { Task { await repository.fetchProfile() } }) {
                Text("Retry")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 32)
                    .padding(.vertical, 12)
                    .background(Color.accentColor)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
    }
}
