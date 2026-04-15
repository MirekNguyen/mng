import SwiftUI

struct Styles {
    // MARK: - Colors & Text
    struct Colors {
        // Primary text on glass (.ultraThinMaterial) surfaces
        static let primaryText = Color.white
        // Secondary / supporting text on glass
        static let secondaryText = Color.white.opacity(0.7)
        // Tertiary / metadata on glass
        static let tertiaryText = Color.white.opacity(0.5)
    }

    // MARK: - Spacing (8pt base unit)
    struct Spacing {
        /// 4pt — micro gaps (label-to-value)
        static let xs: CGFloat = 4
        /// 8pt — inter-element gaps in a row
        static let s: CGFloat = 8
        /// 12pt — card internal padding (top/bottom)
        static let m: CGFloat = 12
        /// 16pt — standard horizontal padding
        static let l: CGFloat = 16
        /// 20pt — screen edge padding
        static let xl: CGFloat = 20
        /// 24pt — section gap
        static let xxl: CGFloat = 24
        /// 32pt — large section separation
        static let xxxl: CGFloat = 32
    }

    // MARK: - Corner Radii
    struct CornerRadius {
        /// Row cards and form group containers
        static let card: CGFloat = 16
        /// Macro summary cards
        static let summaryCard: CGFloat = 12
        /// Small icon badges
        static let badge: CGFloat = 8
        /// Primary CTA buttons
        static let button: CGFloat = 16
        /// System form submit buttons
        static let formButton: CGFloat = 10
    }

    // MARK: - Button Tap Targets
    struct Button {
        /// 44pt — standard minimum tap target (HIG requirement)
        static let primarySize = 44
        /// 36pt — compact secondary actions
        static let secondarySize = 36
        /// 30pt — icon-only small buttons
        static let smallSize = 30
        /// Primary CTA button height
        static let primaryHeight: CGFloat = 52
    }

    // MARK: - Input
    struct Input {
        static let inputRowHeight: CGFloat = 34
    }

    // MARK: - Layout
    struct Layout {
        /// List row edge insets (top:12, leading:16, bottom:12, trailing:16)
        static let listRowInsets = EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16)
        /// Bottom clearance for tab bar overlay
        static let tabBarClearance: CGFloat = 100
        /// Bottom clearance for floating banners
        static let bannerClearance: CGFloat = 90
    }
}
