import SwiftUI

struct FoodEntryView: View {
    @EnvironmentObject var foodEntryRepository: FoodEntryRepository
    @EnvironmentObject var userProfileRepository: UserProfileRepository
    @Environment(\.scenePhase) var scenePhase: ScenePhase

    @State var selectedDate = Date()
    @State private var showAddSheet = false
    @State private var showPhotosSheet = false
    @State private var showSummarySheet = false
    @State private var entryToEdit: FoodEntry?
    @State private var selectedEntry: FoodEntry?
    @State private var selectedMacro: MacroType?
    @State private var showProfileSheet = false

    var entries: [FoodEntry] {
        (foodEntryRepository.foodEntries ?? []).sorted {
            $0.entryTime < $1.entryTime
        }
    }
    // (Keep your totalCalories / macros computed properties here)
    var totalCalories: Double { entries.reduce(0) { $0 + $1.calories } }
    var totalProtein: Double { entries.reduce(0) { $0 + $1.protein } }
    var totalCarbs: Double { entries.reduce(0) { $0 + $1.carbs } }
    var totalFat: Double { entries.reduce(0) { $0 + $1.fat } }

    func loadData() async {
        await foodEntryRepository.getEntries(date: selectedDate)
    }

    var body: some View {
        // 1. One List controls the whole page scrolling
        List {

            // MARK: - Header Section
            // We put the header INSIDE the list as the first group
            Group {
                VStack(spacing: 24) {
                    CalorieGaugeView(
                        selectedDate: $selectedDate,
                        currentCalories: totalCalories,
                        targetCalories: 2000
                    )

                    HStack(spacing: 12) {
                        FoodSummaryCard(
                            name: "Protein", amount: totalProtein, color: .blue, unit: "g",
                            onTap: { selectedMacro = .protein })
                        FoodSummaryCard(
                            name: "Carbs", amount: totalCarbs, color: .green, unit: "g",
                            onTap: { selectedMacro = .carbs })
                        FoodSummaryCard(
                            name: "Fat", amount: totalFat, color: .red, unit: "g",
                            onTap: { selectedMacro = .fat })
                    }

                    HStack(spacing: 36) {
                        ActionButton(
                            text: "Add entry", icon: "plus", action: { showAddSheet = true })
                        ActionButton(
                            text: "Analyze", icon: "camera.fill", action: { showPhotosSheet = true }
                        )
                    }
                }
                .animation(.easeInOut(duration: 0.35), value: totalCalories)
                .padding(.bottom, 20)
            }
            .listRowInsets(EdgeInsets())  // Remove default padding for header
            .listRowSeparator(.hidden)  // Hide divider below header
            .listRowBackground(Color.clear)  // Transparent background for header

            // MARK: - Entries Section (Glass Card)
            // This section automatically becomes a rounded card because of .insetGrouped style
            Section {
                if entries.isEmpty {
                    VStack(spacing: 24) {
                        Image(systemName: "fork.knife.circle.fill")
                            .font(.system(size: 64))
                            .foregroundStyle(.white.opacity(0.9))
                            .symbolEffect(.bounce, value: entries.isEmpty)
                        
                        VStack(spacing: 8) {
                            Text("No entries yet")
                                .font(.title2.weight(.semibold))
                                .foregroundColor(.white)
                            
                            Text("Start tracking your meals by adding an entry or analyzing a photo")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.7))
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 32)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 60)
                    .listRowInsets(EdgeInsets())
                    .listRowSeparator(.hidden)
                    .listRowBackground(
                        Rectangle()
                            .fill(.ultraThinMaterial)
                    )
                } else {
                    ForEach(entries) { foodEntry in
                        FoodItemRow(
                            weight: foodEntry.formattedAmount,
                            foodName: foodEntry.foodName,
                            protein: "\(String(format: "%.0f", foodEntry.protein))g",
                            calories: "\(String(format: "%.0f", foodEntry.calories)) kcal",
                            time: foodEntry.entryTime
                        )
                        .listRowInsets(EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16))
                        .listRowSeparator(.hidden)
                        .transition(
                            .asymmetric(
                                insertion: .move(edge: .trailing).combined(with: .opacity),
                                removal: .opacity)
                        )
                        .contentShape(Rectangle())
                        .onTapGesture {
                            selectedEntry = foodEntry
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            Button(role: .destructive) {
                                Task { await foodEntryRepository.deleteEntry(id: foodEntry.id) }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }.tint(.red)

                            Button {
                                entryToEdit = foodEntry
                            } label: {
                                Label("Edit", systemImage: "pencil")
                            }.tint(.blue)
                        }
                    }
                    // Apply Glass Effect to the rows
                    .listRowBackground(
                        Rectangle()
                            .fill(.ultraThinMaterial)  // Gives the glass look
                        //.glassEffect(.regular, in: .rect(cornerRadius: 0)) // Use your custom modifier here if preferred
                    )
                    .animation(.spring(response: 0.45, dampingFraction: 0.75), value: entries.count)
                }
            }
        }
        // 2. This style creates the "Revolut" floating card look automatically
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)  // Removes default system gray background

        // ... (Toolbar, Sheets, Task, etc. remain unchanged) ...
        .toolbar {
            ToolbarItem(placement: .principal) {
                if let profile = userProfileRepository.profile {
                    Text("Welcome, \(profile.firstName ?? "Guest")!").font(.headline).fontWeight(.semibold)
                } else {
                    Text("Welcome!").font(.headline).fontWeight(.semibold)
                }
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showProfileSheet = true }) {
                    if let profile = userProfileRepository.profile,
                       let avatarUrlString = profile.avatarUrl,
                       let avatarUrl = URL(string: avatarUrlString) {
                        AsyncImage(url: avatarUrl) { phase in
                            switch phase {
                            case .empty:
                                Circle()
                                    .fill(Color.gray.opacity(0.3))
                                    .frame(width: 32, height: 32)
                                    .overlay(ProgressView().tint(.white))
                            case .success(let image):
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                                    .frame(width: 32, height: 32)
                                    .clipShape(Circle())
                            case .failure:
                                profileInitialsButton
                            @unknown default:
                                profileInitialsButton
                            }
                        }
                    } else {
                        profileInitialsButton
                    }
                }
            }
        }
        .fullScreenCover(isPresented: $showAddSheet, onDismiss: { Task { await loadData() } }) {
            FoodEntryForm(selectedDate: $selectedDate).presentationBackground(.clear)
        }
        .fullScreenCover(isPresented: $showPhotosSheet, onDismiss: { Task { await loadData() } }) {
            ImageUploadView().scrollContentBackground(.hidden).background(.ultraThinMaterial)
                .presentationBackground(.clear)
        }
        .fullScreenCover(item: $entryToEdit) { entry in
            NavigationStack { EditEntryForm(foodEntry: entry) }
        }
        .sheet(item: $selectedEntry) { entry in
            FoodEntryDetailView(
                foodEntry: entry,
                onEdit: {
                    entryToEdit = entry
                },
                onDelete: {
                    Task { await foodEntryRepository.deleteEntry(id: entry.id) }
                }
            )
            .presentationBackground(.ultraThinMaterial)

        }
        .sheet(item: $selectedMacro) { macro in
            MacroDetailSheet(macroType: macro, entries: entries)
                .presentationBackground(.clear)
        }
        .sheet(isPresented: $showSummarySheet) {
            DailySummarySheet(date: selectedDate)
        }
        .sheet(isPresented: $showProfileSheet) {
            NavigationStack {
                ProfileView(repository: userProfileRepository)
            }
        }
        .navigationTitle("Overview")
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button(action: { showSummarySheet = true }) {
                    Label("AI Summary", systemImage: "sparkles")
                        .font(.system(size: 16, weight: .medium))
                }
                .disabled(entries.isEmpty)
            }
        }
        .task {
            await loadData()
            if userProfileRepository.profile == nil {
                await userProfileRepository.fetchProfile()
            }
        }
        .refreshable { await loadData() }
        .onChange(of: selectedDate) { Task { await loadData() } }
    }
    
    private var profileInitialsButton: some View {
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
            .frame(width: 32, height: 32)
            .overlay(
                Text(userProfileRepository.profile?.name.prefix(2).uppercased() ?? "?")
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
            )
    }
}
