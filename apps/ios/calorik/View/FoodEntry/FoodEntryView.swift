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
    @State private var showConfirmEntry = false
    @State private var showProfileSheet = false
    @State private var pendingDeleteEntry: FoodEntry?
    @State private var showUndoSnackbar = false
    @State private var undoTask: Task<Void, Never>?

    var entries: [FoodEntry] {
        (foodEntryRepository.foodEntries ?? []).sorted {
            $0.entryTime < $1.entryTime
        }
    }
    
    private let mealOrder = ["breakfast", "lunch", "dinner", "snack"]
    
    var groupedEntries: [(mealType: String, entries: [FoodEntry])] {
        let dict = Dictionary(grouping: entries) { $0.mealType.lowercased() }
        let sortedKeys = mealOrder.filter { dict[$0] != nil } + dict.keys.filter { !mealOrder.contains($0) }.sorted()
        return sortedKeys.compactMap { key in
            guard let items = dict[key] else { return nil }
            return (mealType: key, entries: items)
        }
    }
    var totalCalories: Double { entries.reduce(0) { $0 + $1.calories } }
    var totalProtein: Double { entries.reduce(0) { $0 + $1.protein } }
    var totalCarbs: Double { entries.reduce(0) { $0 + $1.carbs } }
    var totalFat: Double { entries.reduce(0) { $0 + $1.fat } }

    func loadData() async {
        await foodEntryRepository.getEntries(date: selectedDate)
    }

    var body: some View {
        List {

            Group {
                VStack(spacing: 16) {
                    CalorieGaugeView(
                        selectedDate: $selectedDate,
                        currentCalories: totalCalories,
                        targetCalories: Double(userProfileRepository.profile?.dailyCalorieTarget ?? 2000)
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

                    HStack(spacing: 12) {
                        Button(action: { showPhotosSheet = true }) {
                            Label("Analyze", systemImage: "camera.fill")
                                .font(.system(size: 14, weight: .semibold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                        }
                        .buttonStyle(.glass)
                        .buttonBorderShape(.capsule)
                        
                        Button(action: { showAddSheet = true }) {
                            Label("Add Entry", systemImage: "plus")
                                .font(.system(size: 14, weight: .semibold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                        }
                        .buttonStyle(.glass)
                        .buttonBorderShape(.capsule)
                    }
                }
                .animation(.easeInOut(duration: 0.35), value: totalCalories)
                .padding(.bottom, 12)
            }
            .listRowInsets(EdgeInsets())
            .listRowSeparator(.hidden)
            .listRowBackground(Color.clear)

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
                            .fill(.clear)
                            .glassEffect(.regular, in: .rect)
                    )
                }
            }
            
            ForEach(groupedEntries, id: \.mealType) { group in
                Section(header:
                    Text(group.mealType.capitalized)
                        .font(.caption.weight(.semibold))
                        .foregroundColor(.white.opacity(0.6))
                        .textCase(nil)
                        .padding(.horizontal, 4)
                ) {
                    ForEach(group.entries) { foodEntry in
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
                                scheduleDeletion(of: foodEntry)
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
                    .listRowBackground(
                        Rectangle()
                            .fill(.clear)
                            .glassEffect(.regular, in: .rect)
                    )
                    .animation(.spring(response: 0.45, dampingFraction: 0.75), value: group.entries.count)
                }
            }
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
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
        .fullScreenCover(isPresented: $showConfirmEntry, onDismiss: {
            foodEntryRepository.pendingEntry = nil
            foodEntryRepository.shouldShowConfirmEntry = false
            Task { await loadData() }
        }) {
            if let entryData = foodEntryRepository.pendingEntry {
                ConfirmEntryView(data: entryData, repository: foodEntryRepository, onSave: {
                    showConfirmEntry = false
                })
            }
        }
        .onChange(of: foodEntryRepository.pendingEntry) { _, newEntry in
            if newEntry != nil {
                showConfirmEntry = true
            }
        }
        .onChange(of: foodEntryRepository.shouldShowConfirmEntry) { _, shouldShow in
            if shouldShow {
                showConfirmEntry = true
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
        .overlay(alignment: .top) {
            if let error = foodEntryRepository.errorMessage {
                ErrorToastView(message: error) {
                    foodEntryRepository.errorMessage = nil
                }
                .transition(.move(edge: .top).combined(with: .opacity))
                .animation(.spring(response: 0.4, dampingFraction: 0.75), value: foodEntryRepository.errorMessage)
                .padding(.top, 8)
            }
        }
        .overlay(alignment: .bottom) {
            if showUndoSnackbar, let entry = pendingDeleteEntry {
                HStack(spacing: 12) {
                    Text("\(entry.foodName) deleted")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white)
                        .lineLimit(1)
                    
                    Spacer()
                    
                    Button(action: cancelDeletion) {
                        Text("Undo")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.accentColor)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(Color.black.opacity(0.85))
                        .shadow(color: .black.opacity(0.25), radius: 12, x: 0, y: 4)
                )
                .padding(.horizontal, 16)
                .padding(.bottom, 8)
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.75), value: showUndoSnackbar)
    }
    
    private func scheduleDeletion(of entry: FoodEntry) {
        // Cancel any existing pending deletion — commit it immediately
        if let previous = pendingDeleteEntry {
            undoTask?.cancel()
            Task { await foodEntryRepository.deleteEntry(id: previous.id) }
        }
        
        pendingDeleteEntry = entry
        withAnimation { showUndoSnackbar = true }
        
        undoTask = Task {
            try? await Task.sleep(nanoseconds: 4_000_000_000)
            guard !Task.isCancelled else { return }
            await MainActor.run {
                if let entry = pendingDeleteEntry {
                    Task { await foodEntryRepository.deleteEntry(id: entry.id) }
                }
                withAnimation {
                    pendingDeleteEntry = nil
                    showUndoSnackbar = false
                }
            }
        }
    }
    
    private func cancelDeletion() {
        undoTask?.cancel()
        withAnimation {
            pendingDeleteEntry = nil
            showUndoSnackbar = false
        }
        Task { await loadData() }
    }
    
    private var profileInitialsButton: some View {
        Circle()
            .fill(Color.accentColor)
            .frame(width: 32, height: 32)
            .overlay(
                Text(userProfileRepository.profile?.name.prefix(2).uppercased() ?? "?")
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
            )
    }
}
