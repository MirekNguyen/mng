import SwiftUI

struct FoodItemRow: View {
    let weight: String
    let foodName: String
    let protein: String
    let calories: String
    //    let onDelete: () -> Void

    var body: some View {
        HStack(spacing: 16) {
            // Weight container
            Text(weight)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.gray)
                .frame(width: 70, height: 32)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.gray.opacity(0.1))
                        .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                )

            // Food info
            VStack(alignment: .leading, spacing: 2) {
                Text(foodName)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.black)

                HStack(spacing: 4) {
                    Circle()
                        .fill(Color.orange)
                        .frame(width: 8, height: 8)

                    Text(protein)
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                }
            }

            Spacer()

            // Calories
            Text(calories)
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.gray)
        }
        // .padding(.horizontal, 20)
        .padding(.vertical, 16)
        // .background(
        //     RoundedRectangle(cornerRadius: 16)
        //         .fill(Color.white)
        //         .stroke(Color.green.opacity(0.6), lineWidth: 2)
        // )
    }
}
