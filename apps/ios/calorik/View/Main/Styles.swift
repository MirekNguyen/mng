import SwiftUI

struct Styles {
    // MARK: - Colors & Text
    struct Colors {
        // Primary text on glass surfaces
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
        /// Large section cards (profile, etc.)
        static let section: CGFloat = 24
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
        static let listRowInsets = EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16)
        static let tabBarClearance: CGFloat = 100
    }
}

// MARK: - Liquid Glass View Modifiers

/// Applies iOS 26 Liquid Glass effect as a card background.
/// Replaces the old `.ultraThinMaterial` + `RoundedRectangle` + stroke pattern.
struct GlassCardModifier: ViewModifier {
    var cornerRadius: CGFloat = Styles.CornerRadius.card

    func body(content: Content) -> some View {
        content
            .glassEffect(.regular, in: .rect(cornerRadius: cornerRadius))
    }
}

/// Applies a tinted glass effect (e.g. for macro summary cards).
struct TintedGlassCardModifier: ViewModifier {
    var tint: Color
    var cornerRadius: CGFloat = Styles.CornerRadius.summaryCard

    func body(content: Content) -> some View {
        content
            .glassEffect(
                .regular.tint(tint.opacity(0.10)).interactive(),
                in: .rect(cornerRadius: cornerRadius)
            )
    }
}

/// Glass circle for icon buttons (dismiss, action buttons).
struct GlassCircleModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .glassEffect(.regular, in: .circle)
    }
}

extension View {
    /// Standard glass card with configurable corner radius.
    func glassCard(cornerRadius: CGFloat = Styles.CornerRadius.card) -> some View {
        modifier(GlassCardModifier(cornerRadius: cornerRadius))
    }

    /// Section-level glass card (larger radius for profile-style sections).
    func glassSectionCard() -> some View {
        modifier(GlassCardModifier(cornerRadius: Styles.CornerRadius.section))
    }

    /// Tinted glass card for macro summaries and accented surfaces.
    func tintedGlassCard(tint: Color, cornerRadius: CGFloat = Styles.CornerRadius.summaryCard) -> some View {
        modifier(TintedGlassCardModifier(tint: tint, cornerRadius: cornerRadius))
    }

    /// Glass circle for small icon buttons.
    func glassCircle() -> some View {
        modifier(GlassCircleModifier())
    }
}
