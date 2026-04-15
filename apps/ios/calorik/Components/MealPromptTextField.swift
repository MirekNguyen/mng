import SwiftUI

/// A multi-line text field for entering a meal description to supplement (or replace) photo capture.
struct MealPromptTextField: View {
    @Binding var text: String
    var isBusy: Bool = false

    @FocusState private var isFocused: Bool

    private let placeholder = "Describe your meal (e.g. \"a bowl of oatmeal with banana and honey\")"
    private let maxLength = 300

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Image(systemName: "text.bubble")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.blue)
                Text("Meal Description")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.primary)
                Spacer()
                if !text.isEmpty {
                    Text("\(text.count)/\(maxLength)")
                        .font(.caption2)
                        .foregroundStyle(text.count > maxLength ? .red : .secondary)
                        .monospacedDigit()
                        .animation(.easeInOut(duration: 0.15), value: text.count)
                }
            }

            ZStack(alignment: .topLeading) {
                // Placeholder text
                if text.isEmpty {
                    Text(placeholder)
                        .font(.body)
                        .foregroundStyle(.tertiary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .allowsHitTesting(false)
                }

                TextEditor(text: $text)
                    .font(.body)
                    .focused($isFocused)
                    .scrollContentBackground(.hidden)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 6)
                    .frame(minHeight: 72, maxHeight: 120)
                    .disabled(isBusy)
                    .onChange(of: text) { _, newValue in
                        if newValue.count > maxLength {
                            text = String(newValue.prefix(maxLength))
                        }
                    }
            }
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(.secondarySystemBackground))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(
                                isFocused ? Color.blue.opacity(0.5) : Color(.systemGray4),
                                lineWidth: isFocused ? 1.5 : 1
                            )
                    )
            )
            .animation(.easeInOut(duration: 0.2), value: isFocused)

            if !text.isEmpty {
                Button {
                    text = ""
                    isFocused = false
                } label: {
                    Label("Clear", systemImage: "xmark.circle.fill")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .transition(.opacity.combined(with: .scale(scale: 0.9, anchor: .leading)))
                .animation(.spring(response: 0.25, dampingFraction: 0.7), value: text.isEmpty)
            }
        }
    }
}

#Preview {
    VStack(spacing: 24) {
        MealPromptTextField(text: .constant(""))
        MealPromptTextField(text: .constant("A bowl of oatmeal with banana and honey"))
    }
    .padding()
}
