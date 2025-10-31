import SwiftUI

struct MacroSummary {
    let calories: Int

    var body: some View {
        VStack(spacing: 12) {
            Text("Today's summary")
            HStack {
                Label("Total calories", systemImage: "flame.fill")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                Spacer()
                HStack(alignment: .firstTextBaseline, spacing: 1) {
                    Text("\(calories)")
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                        .foregroundColor(Color.blue)
                    Text("kcal")
                        .font(.title3)
                        .foregroundColor(Color(.systemBlue).opacity(0.6))
                        .padding(.leading, 2)
                }

            }
        }
    }
}
