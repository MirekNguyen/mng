import SwiftUI

/// A dismissible error toast that slides in from the top.
struct ErrorToastView: View {
    let message: String
    let onDismiss: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.red)
                .font(.system(size: 16, weight: .semibold))

            Text(message)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.white)
                .lineLimit(2)
                .frame(maxWidth: .infinity, alignment: .leading)

            Button(action: onDismiss) {
                Image(systemName: "xmark")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.white.opacity(0.7))
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
    }
}
