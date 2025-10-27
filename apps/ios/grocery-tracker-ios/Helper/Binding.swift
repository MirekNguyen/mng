import SwiftUI

extension Binding where Value == String? {
    func orEmpty() -> Binding<String> {
        Binding<String>(
            get: { self.wrappedValue ?? "" },
            set: { self.wrappedValue = $0.isEmpty ? nil : $0 }
        )
    }
}

// NOTE: The helper must create a Binding <Date> from Binding<Date?>
extension Binding where Value == Date {
    init(unwrapping source: Binding<Date?>, default defaultValue: Date = Date()) {
        self = Binding<Date>(
            get: { source.wrappedValue ?? defaultValue },
            set: { newValue in source.wrappedValue = newValue }
        )
    }
}
