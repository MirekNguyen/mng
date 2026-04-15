import SwiftUI

struct CompleteProfileView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var repository: UserProfileRepository
    
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var age = ""
    @State private var selectedGender = "male"
    @State private var height = ""
    @State private var weight = ""
    @State private var targetWeight = ""
    @State private var selectedActivityLevel = "moderate"
    @State private var selectedGoal = "maintain"
    @State private var dailyCalorieTarget = ""
    
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    let genders = ["male", "female", "other"]
    let activityLevels = ["sedentary", "light", "moderate", "active", "very_active"]
    let goals = ["lose", "maintain", "gain"]
    
    init(repository: UserProfileRepository, profile: UserProfile?) {
        self.repository = repository
        
        if let profile = profile {
            _firstName = State(initialValue: profile.name.components(separatedBy: " ").first ?? "")
            _lastName = State(initialValue: profile.name.components(separatedBy: " ").dropFirst().joined(separator: " "))
            _age = State(initialValue: profile.age.map { String($0) } ?? "")
            _selectedGender = State(initialValue: profile.gender ?? "male")
            _height = State(initialValue: profile.height.map { String($0) } ?? "")
            _weight = State(initialValue: profile.weight.map { String(format: "%.1f", $0) } ?? "")
            _targetWeight = State(initialValue: profile.targetWeight.map { String(format: "%.1f", $0) } ?? "")
            _selectedActivityLevel = State(initialValue: profile.activityLevel ?? "moderate")
            _selectedGoal = State(initialValue: profile.goal ?? "maintain")
            _dailyCalorieTarget = State(initialValue: profile.dailyCalorieTarget.map { String($0) } ?? "")
        }
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                Image("Wallpaper")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .edgesIgnoringSafeArea(.all)
                    .background(Color.black)
                
                List {
                    Group {
                        VStack(spacing: 24) {
                            headerSection
                            basicInfoSection
                            bodyMetricsSection
                            goalsSection
                            
                            if let error = errorMessage {
                                errorBanner(message: error)
                            }
                            
                            saveButton
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
            .navigationTitle("Complete Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(.orange)
                }
            }
        }
    }
    
    private var headerSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "person.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(.orange)
            
            Text("Let's personalize your experience")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
            
            Text("Fill in your details to get accurate nutrition tracking")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.white.opacity(0.7))
                .multilineTextAlignment(.center)
        }
        .padding(.vertical, 20)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 4)
        )
    }
    
    private var basicInfoSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            sectionTitle("Basic Information")
            
            VStack(spacing: 16) {
                HStack(spacing: 12) {
                    inputField(label: "First Name", text: $firstName, icon: "person")
                    inputField(label: "Last Name", text: $lastName, icon: "person")
                }
                
                inputField(label: "Age", text: $age, icon: "calendar", keyboardType: .numberPad)
                
                pickerField(label: "Gender", selection: $selectedGender, options: genders, icon: "person.2")
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 4)
        )
    }
    
    private var bodyMetricsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            sectionTitle("Body Metrics")
            
            VStack(spacing: 16) {
                inputField(label: "Height (cm)", text: $height, icon: "ruler", keyboardType: .numberPad)
                inputField(label: "Current Weight (kg)", text: $weight, icon: "scalemass", keyboardType: .decimalPad)
                inputField(label: "Target Weight (kg)", text: $targetWeight, icon: "target", keyboardType: .decimalPad)
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 4)
        )
    }
    
    private var goalsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            sectionTitle("Goals & Activity")
            
            VStack(spacing: 16) {
                pickerField(label: "Goal", selection: $selectedGoal, options: goals, icon: "flag.fill")
                pickerField(label: "Activity Level", selection: $selectedActivityLevel, options: activityLevels, icon: "figure.walk")
                inputField(label: "Daily Calorie Target", text: $dailyCalorieTarget, icon: "flame", keyboardType: .numberPad)
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 4)
        )
    }
    
    private var saveButton: some View {
        Button(action: saveProfile) {
            HStack {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else {
                    Text("Save Profile")
                        .font(.system(size: 17, weight: .semibold))
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.orange)
            )
            .foregroundColor(.white)
        }
        .disabled(isLoading)
    }
    
    private func sectionTitle(_ title: String) -> some View {
        Text(title)
            .font(.system(size: 18, weight: .bold))
            .foregroundColor(.white)
    }
    
    private func inputField(label: String, text: Binding<String>, icon: String, keyboardType: UIKeyboardType = .default) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(.orange)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(label)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.white.opacity(0.6))
                
                TextField("", text: text)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.white)
                    .keyboardType(keyboardType)
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.white.opacity(0.05))
        )
    }
    
    private func pickerField(label: String, selection: Binding<String>, options: [String], icon: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(.orange)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(label)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.white.opacity(0.6))
                
                Picker("", selection: selection) {
                    ForEach(options, id: \.self) { option in
                        Text(option.replacingOccurrences(of: "_", with: " ").capitalized)
                            .tag(option)
                    }
                }
                .pickerStyle(.menu)
                .tint(.white)
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.white.opacity(0.05))
        )
    }
    
    private func errorBanner(message: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.red)
            
            Text(message)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.white)
            
            Spacer()
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.red.opacity(0.2))
        )
    }
    
    private func saveProfile() {
        errorMessage = nil
        isLoading = true
        
        Task {
            do {
                await repository.updateProfile(
                    firstName: firstName.isEmpty ? nil : firstName,
                    lastName: lastName.isEmpty ? nil : lastName,
                    age: Int(age),
                    gender: selectedGender,
                    height: Int(height),
                    weight: Double(weight),
                    targetWeight: Double(targetWeight),
                    activityLevel: selectedActivityLevel,
                    goal: selectedGoal,
                    dailyCalorieTarget: Int(dailyCalorieTarget)
                )
                
                await MainActor.run {
                    isLoading = false
                    if repository.errorMessage == nil {
                        dismiss()
                    } else {
                        errorMessage = repository.errorMessage
                    }
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                    errorMessage = "Failed to save profile"
                }
            }
        }
    }
}
