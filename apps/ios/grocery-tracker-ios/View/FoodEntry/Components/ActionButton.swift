import SwiftUI

struct ActionButton: View {
    var text: String
    var icon: String
    var action: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            VStack {
                Button(
                    action: {
                        action()
                    },
                    label: {
                        Image(systemName: icon)
                            .font(.title2)
                            .frame(width: 40, height: 40)
                            .clipShape(Circle())

                    }
                )
                .buttonStyle(.glass)
                Text(text)
                    .foregroundColor(Styles.Colors.primaryText)
            }
        }

    }
}
