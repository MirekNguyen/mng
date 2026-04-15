import SwiftUI

struct FoodDetailView: View {
    let food: Food
    @Environment(\.dismiss) private var dismiss
    var onEdit: () -> Void
    var onDelete: () -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Button(action: { dismiss() }) {
                    Image(systemName: "xmark")
                        .font(.body.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .frame(width: 44, height: 44)
                        .background(
                            Circle()
                                .fill(.ultraThinMaterial)
                        )
                }
                
                Spacer()
                
                Menu {
                    Button(action: {
                        dismiss()
                        onEdit()
                    }) {
                        Label("Edit Food", systemImage: "pencil")
                    }
                    
                    Button(role: .destructive, action: {
                        dismiss()
                        onDelete()
                    }) {
                        Label("Delete Food", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.body.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .frame(width: 44, height: 44)
                        .background(
                            Circle()
                                .fill(.ultraThinMaterial)
                        )
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            
            ScrollView(showsIndicators: false) {
                VStack(spacing: 24) {
                    // Icon and Title
                    VStack(spacing: 16) {
                        ZStack {
                            Circle()
                                .fill(.green)
                                .frame(width: 72, height: 72)
                                .shadow(color: .green.opacity(0.6), radius: 60, x: 0, y: 10)
                            
                            Image(systemName: "fork.knife")
                                .font(.system(size: 28, weight: .medium))
                                .foregroundColor(.white)
                        }
                        .padding(.top, 20)
                        
                        Text(food.name)
                            .font(.title3.weight(.semibold))
                            .foregroundColor(.primary)
                    }
                    
                    // Hero Calories
                    VStack(spacing: 4) {
                        Text(String(format: "%.0f", food.calories))
                            .font(.system(size: 56, weight: .bold))
                            .foregroundColor(.primary)
                        
                        Text("calories")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .textCase(.uppercase)
                            .tracking(0.5)
                    }
                    .padding(.vertical, 8)
                    
                    // Unit info
                    if let unit = food.unit {
                        Text("per \(unit)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    // Macros Section
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Macros")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .padding(.horizontal, 20)
                        
                        VStack(spacing: 0) {
                            MacroDetailRow(label: "Protein", value: String(format: "%.1f g", food.protein), color: .blue)
                            Divider()
                                .padding(.leading, 20)
                            MacroDetailRow(label: "Carbs", value: String(format: "%.1f g", food.carbs), color: .green)
                            Divider()
                                .padding(.leading, 20)
                            MacroDetailRow(label: "Fat", value: String(format: "%.1f g", food.fat), color: .red)
                        }
                        .background(
                            RoundedRectangle(cornerRadius: 16)
                                .fill(.ultraThinMaterial)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(Color.primary.opacity(0.1), lineWidth: 0.5)
                        )
                        .padding(.horizontal, 20)
                    }
                    
                    // Additional Info
                    if food.caffeine != nil || food.description != nil {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Additional Info")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .padding(.horizontal, 20)
                            
                            VStack(spacing: 0) {
                                if let caffeine = food.caffeine, caffeine > 0 {
                                    InfoDetailRow(label: "Caffeine", value: String(format: "%.1f mg", caffeine))
                                    if food.description != nil {
                                        Divider()
                                            .padding(.leading, 20)
                                    }
                                }
                                
                                if let description = food.description {
                                    InfoDetailRow(label: "Description", value: description)
                                }
                            }
                            .background(
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(.ultraThinMaterial)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(Color.primary.opacity(0.1), lineWidth: 0.5)
                            )
                            .padding(.horizontal, 20)
                        }
                    }
                    
                    Spacer()
                        .frame(height: 32)
                }
            }
        }
        .presentationCornerRadius(32)
        .presentationDragIndicator(.hidden)
    }
}

struct MacroDetailRow: View {
    let label: String
    let value: String
    let color: Color
    
    var body: some View {
        HStack {
            HStack(spacing: 10) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(color)
                    .frame(width: 3, height: 16)
                
                Text(label)
                    .font(.body)
                    .foregroundColor(.primary)
            }
            
            Spacer()
            
            Text(value)
                .font(.body)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
    }
}

struct InfoDetailRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack(alignment: .top) {
            Text(label)
                .font(.body)
                .foregroundColor(.primary)
            
            Spacer()
            
            Text(value)
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.trailing)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
    }
}
