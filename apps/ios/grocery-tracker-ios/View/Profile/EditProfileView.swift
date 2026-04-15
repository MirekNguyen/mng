import SwiftUI

struct EditProfileView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var repository: UserProfileRepository

    // MARK: - Form State
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

    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showSuccessBanner = false

    // MARK: - Options
    let genders = ["male", "female", "other"]
    let activityLevels = ["sedentary", "light", "moderate", "active", "very_active"]
    let goals = ["lose", "maintain", "gain"]

    // MARK: - Init
    init(repository: UserProfileRepository) {
        self.repository = repository
        if let profile = repository.profile {
            _firstName = State(initialValue: profile.firstName ?? "")
            _lastName = State(initialValue: profile.lastName ?? "")
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

    // MARK: - Body
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
                            avatarSection
                            basicInfoSection
                            bodyMetricsSection
                            goalsSection

                            if let error = errorMessage {
                                errorBanner(message: error)
                            }

                            saveButton
                        }
                        .padding(.top, 8)
                        .padding(.bottom, 32)
                        .padding(.horizontal, 16)
                    }
                    .listRowInsets(EdgeInsets())
                    .listRowSeparator(.hidden)
                    .listRowBackground(Color.clear)
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)

                // Success overlay
                if showSuccessBanner {
                    VStack {
                        Spacer()
                        successBanner
                            .padding(.horizontal, 24)
                            .padding(.bottom, 40)
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                    }
                }
            }
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundColor(.orange)
                        .disabled(isSaving)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: saveProfile) {
                        if isSaving {
                            ProgressView()
                                .tint(.orange)
                        } else {
                            Text("Save")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.orange)
                        }
                    }
                    .disabled(isSaving)
                }
            }
        }
    }

    // MARK: - Sections

    private var avatarSection: some View {
        VStack(spacing: 16) {
            avatarDisplay
            Text("Profile Photo")
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.white.opacity(0.6))
        }
        .padding(.vertical, 28)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 4)
        )
    }

    @ViewBuilder
    private var avatarDisplay: some View {
        ZStack(alignment: .bottomTrailing) {
            if let profile = repository.profile,
               let urlStr = profile.avatarUrl,
               let url = URL(string: urlStr) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: 100, height: 100)
                            .clipShape(Circle())
                            .shadow(color: .orange.opacity(0.3), radius: 10, x: 0, y: 4)
                    default:
                        initialsCircle
                    }
                }
            } else {
                initialsCircle
            }

            // Camera badge
            Circle()
                .fill(Color.orange)
                .frame(width: 30, height: 30)
                .overlay(
                    Image(systemName: "camera.fill")
                        .font(.system(size: 13))
                        .foregroundColor(.white)
                )
                .shadow(color: .black.opacity(0.2), radius: 4, x: 0, y: 2)
                .offset(x: 4, y: 4)
        }
    }

    private var initialsCircle: some View {
        let initials: String = {
            let first = firstName.prefix(1).uppercased()
            let last = lastName.prefix(1).uppercased()
            let combined = first + last
            return combined.isEmpty ? "?" : combined
        }()

        return ZStack {
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

            Text(initials)
                .font(.system(size: 38, weight: .bold, design: .rounded))
                .foregroundColor(.white)
        }
    }

    private var basicInfoSection: some View {
        formSection(title: "Basic Information") {
            HStack(spacing: 12) {
                inputField(label: "First Name", text: $firstName, icon: "person", placeholder: "Enter first name")
                inputField(label: "Last Name", text: $lastName, icon: "person", placeholder: "Enter last name")
            }
            inputField(label: "Age", text: $age, icon: "calendar", placeholder: "e.g. 28", keyboardType: .numberPad)
            pickerField(label: "Gender", selection: $selectedGender, options: genders, icon: "person.2")
        }
    }

    private var bodyMetricsSection: some View {
        formSection(title: "Body Metrics") {
            inputField(label: "Height (cm)", text: $height, icon: "ruler", placeholder: "e.g. 175", keyboardType: .numberPad)
            inputField(label: "Current Weight (kg)", text: $weight, icon: "scalemass", placeholder: "e.g. 70.0", keyboardType: .decimalPad)
            inputField(label: "Target Weight (kg)", text: $targetWeight, icon: "target", placeholder: "e.g. 65.0", keyboardType: .decimalPad)
        }
    }

    private var goalsSection: some View {
        formSection(title: "Goals & Activity") {
            pickerField(label: "Goal", selection: $selectedGoal, options: goals, icon: "flag.fill")
            pickerField(label: "Activity Level", selection: $selectedActivityLevel, options: activityLevels, icon: "figure.walk")
            inputField(label: "Daily Calorie Target", text: $dailyCalorieTarget, icon: "flame", placeholder: "e.g. 2000", keyboardType: .numberPad)
        }
    }

    private var saveButton: some View {
        Button(action: saveProfile) {
            HStack(spacing: 10) {
                if isSaving {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else {
                    Image(systemName: "checkmark")
                        .font(.system(size: 15, weight: .semibold))
                    Text("Save Changes")
                        .font(.system(size: 17, weight: .semibold))
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(isSaving ? Color.orange.opacity(0.5) : Color.orange)
            )
            .foregroundColor(.white)
        }
        .disabled(isSaving)
    }

    private var successBanner: some View {
        HStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 22))
                .foregroundColor(.green)

            Text("Profile updated successfully")
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(.white)

            Spacer()
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.15), radius: 12, x: 0, y: 4)
        )
    }

    // MARK: - Reusable Components

    private func formSection<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.white.opacity(0.5))
                .textCase(.uppercase)
                .tracking(0.8)
                .padding(.horizontal, 4)

            VStack(spacing: 12) {
                content()
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 4)
        )
    }

    private func inputField(
        label: String,
        text: Binding<String>,
        icon: String,
        placeholder: String = "",
        keyboardType: UIKeyboardType = .default
    ) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(.orange)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 4) {
                Text(label)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.white.opacity(0.5))

                TextField(placeholder, text: text)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.white)
                    .keyboardType(keyboardType)
                    .accentColor(.orange)
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.white.opacity(0.06))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .strokeBorder(.white.opacity(0.08), lineWidth: 1)
                )
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
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.white.opacity(0.5))

                Picker("", selection: selection) {
                    ForEach(options, id: \.self) { option in
                        Text(option.replacingOccurrences(of: "_", with: " ").capitalized)
                            .tag(option)
                    }
                }
                .pickerStyle(.menu)
                .tint(.white)
                .padding(.leading, -8)
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.white.opacity(0.06))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .strokeBorder(.white.opacity(0.08), lineWidth: 1)
                )
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

    // MARK: - Actions

    private func saveProfile() {
        errorMessage = nil
        isSaving = true

        Task {
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
                isSaving = false
                if let repoError = repository.errorMessage {
                    errorMessage = repoError
                } else {
                    // Show success banner, then dismiss
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                        showSuccessBanner = true
                    }
                    Task {
                        try? await Task.sleep(nanoseconds: 1_500_000_000)
                        await MainActor.run {
                            dismiss()
                        }
                    }
                }
            }
        }
    }
}
