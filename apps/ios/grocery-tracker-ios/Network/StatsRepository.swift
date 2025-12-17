import Combine
import Foundation

final class StatsRepository: ObservableObject {
    @Published var stats: Stats?
    @Published var errorMessage: String?
    @Published var isLoading = false
    
    private let networkManager: NetworkManager2
    
    init(networkManager: NetworkManager2) {
        self.networkManager = networkManager
    }
    
    func fetchStats(startDate: Date, endDate: Date) async {
        await MainActor.run { isLoading = true }
        
        do {
            let dateFormatter = ISO8601DateFormatter()
            let startDateString = dateFormatter.string(from: startDate)
            let endDateString = dateFormatter.string(from: endDate)
            
            let fetched: Stats = try await networkManager.get(
                endpoint: "/stats?startDate=\(startDateString)&endDate=\(endDateString)"
            )
            await MainActor.run {
                self.stats = fetched
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }
}
