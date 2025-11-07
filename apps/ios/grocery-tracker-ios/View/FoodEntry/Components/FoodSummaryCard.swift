import SwiftUI

struct FoodSummaryCard: View {
    let name: String
    let amount: Double
    let color: Color
    let unit: String

    var body: some View {
        VStack {
            Text(name)
                .font(.footnote)
                .foregroundColor(color)
                .bold()
            Text("\(Int(amount)) \(unit)")
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity, minHeight: 66)
        .padding(.vertical, 2)
        // .background(color.opacity(0.10))
        .glassEffect(.regular.tint(color.opacity(0.10)).interactive(), in: .rect(cornerRadius: 12))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
