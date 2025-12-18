import SwiftUI

struct ProfileView: View {
    @StateObject private var repository: UserProfileRepository
    
    init(networkManager: NetworkManager2) {
        _repository = StateObject(wrappedValue: UserProfileRepository(networkManager: networkManager))
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
                        .tint(.orange)
                } else if let profile = repository.profile {
                    profileContent(profile: profile)
                } else {
                    errorView
                }
            }
            .navigationTitle("Profile")
            .task {
                await repository.fetchProfile()
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
                }
                .padding(.vertical, 20)
            }
            .listRowInsets(EdgeInsets())
            .listRowSeparator(.hidden)
            .listRowBackground(Color.clear)
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
    }
    
    private var incompleteProfileBanner: some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 32))
                .foregroundColor(.orange)
            
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
            
            Button(action: { /* TODO: Navigate to profile setup */ }) {
                Text("Complete Profile")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.orange)
                    )
            }
        }
        .padding(.vertical, 28)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 4)
        )
    }
    
    private func profileHeader(profile: UserProfile) -> some View {
        VStack(spacing: 20) {
            ZStack {
                Circle()
                    .fill(
                        AngularGradient(
                            colors: [
                                Color(red: 1.0, green: 0.7, blue: 0.3),
                                Color(red: 1.0, green: 0.6, blue: 0.2),
                                Color(red: 1.0, green: 0.65, blue: 0.25)
                            ],
                            center: .center
                        )
                    )
                    .frame(width: 100, height: 100)
                    .shadow(color: .orange.opacity(0.3), radius: 10, x: 0, y: 4)
                
                Text(profile.name.prefix(2).uppercased())
                    .font(.system(size: 42, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
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
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 4)
        )
    }
    
    private func statsCards(profile: UserProfile) -> some View {
        HStack(spacing: 16) {
            statCard(
                title: "Streak",
                value: "\(profile.streak)",
                subtitle: "days",
                icon: "flame.fill",
                color: .orange
            )
            
            statCard(
                title: "Entries",
                value: "\(profile.totalEntries)",
                subtitle: "logged",
                icon: "list.bullet",
                color: .blue
            )
        }
    }
    
    private func statCard(title: String, value: String, subtitle: String, icon: String, color: Color) -> some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(color)
            
            VStack(spacing: 4) {
                Text(value)
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundColor(.primary)
                
                Text(subtitle)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.secondary)
            }
            
            Text(title)
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(.primary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(color.opacity(0.3), lineWidth: 1)
        )
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
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 4)
        )
    }
    
    private func metricRow(label: String, value: String, icon: String) -> some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(.orange)
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
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 4)
        )
    }
    
    private var errorView: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.crop.circle.badge.exclamationmark")
                .font(.system(size: 64))
                .foregroundColor(.orange)
            
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
                    .background(Color.orange)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
    }
}
