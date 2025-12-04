import SwiftUI

// MARK: - 1. Design Tokens (Constants)

/// A centralized struct holding all the core design system values for the Luma-inspired UI.
/// This follows HIG best practices for "design tokens" and makes the UI consistent.
struct LumaStyles {
    
    // MARK: Layout & Spacing
    
    /// Standard horizontal padding for screen content.
    static let screenPadding: CGFloat = 20
    
    /// Spacing between major UI groups (e.g., between "Ticketing" and "Options").
    static let sectionSpacing: CGFloat = 32
    
    /// Spacing between elements *within* a group (e.g., between "Start" and "End" rows).
    static let itemSpacing: CGFloat = 16
    
    // MARK: Corner Radii
    
    /// Corner radius for grouped input lists and secondary "squircle" buttons.
    /// Used for: `Create Event` grouped list, `My Ticket` button.
    static let inputGroupRadius: CGFloat = 16
    
    /// A larger radius for primary cards and modal elements.
    /// Used for: Event image cards, Map cards.
    static let cardRadius: CGFloat = 24
    
    /// The pill-shape radius for the floating tab bar.
    static let floatingTabRadius: CGFloat = 32
    
    // MARK: Component Heights
    
    /// Standard height for primary/secondary pill buttons (`Continue with...`).
    static let buttonHeight: CGFloat = 50
    
    /// Standard height for rows within a grouped list (`Start`, `End`, `Location`).
    static let inputRowHeight: CGFloat = 54
    
    /// Height for the larger "Action Grid" buttons (`My Ticket`, `Contact`).
    static let actionGridHeight: CGFloat = 64
    
    /// Height for the floating tab bar.
    static let floatingTabHeight: CGFloat = 68
}

// MARK: - 2. Color Palette

/// Extends `Color` to include the specific Luma palette.
extension Color {
    
    /// The true black background, perfect for OLED displays (HIG-recommended).
    static let lumaBackground = Color(red: 25/255, green: 20/255, blue: 30/255)
    
    /// A very dark gray used for input fields and secondary button backgrounds.
    /// Equivalent to `UIColor.systemGray5` in dark mode.
    static let lumaSurface = Color(white: 1.0, opacity: 0.1)
    
    /// The translucent "frosted glass" material for floating elements.
    static let lumaGlass = Material.ultraThin
    
    /// Primary text and high-contrast UI elements (e.g., primary button fill).
    static let lumaTextPrimary = Color.white
    
    /// Secondary text color, used for subtitles and list item titles.
    /// Equivalent to `UIColor.secondaryLabel`.
    static let lumaTextSecondary = Color.gray
    
    /// Tertiary text color, for placeholders like "Event Name".
    /// Equivalent to `UIColor.tertiaryLabel`.
    static let lumaTextPlaceholder = Color(white: 0.6)

    // Background gradient colors adjusted to match image more closely
    static let lumaGradientStart = Color(red: 40/255, green: 25/255, blue: 50/255) // Darker purple
    static let lumaGradientMid = Color(red: 80/255, green: 30/255, blue: 90/255) // More vibrant purple
    static let lumaGradientEnd = Color(red: 160/255, green: 50/255, blue: 140/255) // Rosy purple/pink
    
    // Event image placeholder color
    static let lumaEventImagePlaceholder = Color(red: 230/255, green: 50/255, blue: 70/255) // Bright red/pink
}

// MARK: - 3. Typography

/// Extends `Font` to create semantic, Dynamic Type-ready styles.
extension Font {
    
    /// For huge, impactful display text (e.g., "Delightful events").
    static let lumaDisplayTitle: Font = .system(size: 36, weight: .bold)
    
    /// For standard screen titles (e.g., "Enter Verification Code").
    static let lumaScreenTitle: Font = .system(size: 18, weight: .semibold)
    
    /// For body text and text inside inputs.
    static let lumaBody: Font = .body // 17pt, respects Dynamic Type
    
    /// For text inside primary/secondary buttons.
    static let lumaButton: Font = .body.bold()
    
    /// For subtitles below titles (e.g., "Sign in or sign up...").
    static let lumaCallout: Font = .callout // 16pt, respects Dynamic Type
    
    /// For section headers (e.g., "Ticketing", "Options").
    static let lumaSectionHeader: Font = .footnote.weight(.medium) // 13pt
    
    /// For icon labels in the Action Grid (`My Ticket`).
    static let lumaCaption: Font = .caption2 // 11pt
}


// MARK: - 5. View Modifiers (Containers)

/// Modifier for the inset grouped list style.
struct LumaGroupedList: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(.horizontal, LumaStyles.itemSpacing)
            .background(Color.lumaSurface)
            .cornerRadius(LumaStyles.inputGroupRadius)
    }
}

/// Extension to make ViewModifiers easier to call.
extension View {
    func lumaGroupedList() -> some View {
        self.modifier(LumaGroupedList())
    }
}

// MARK: - 6. Create Event View

/// A preview screen showing how to use all the defined styles.
/// This mimics the "Create Event" screen.
struct CreateEventView: View {
    @State private var eventName: String = ""
    @State private var requireApproval: Bool = true
    
    var body: some View {
        ZStack {
            // 1. Background Gradient
            LinearGradient(
                gradient: Gradient(colors: [.lumaGradientStart, .lumaGradientMid, .lumaGradientEnd]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            // 2. Content
            VStack(spacing: 0) {
                
                // --- Top Navigation Bar ---
                HStack {
                    // Profile Icon
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 36))
                        .foregroundColor(.gray)
                        .overlay(
                            Image(systemName: "chevron.down")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .padding(4)
                                .background(Color.gray.opacity(0.8))
                                .clipShape(Circle())
                                .offset(x: 12, y: 12)
                        )
                    
                    Spacer()
                    
                    // Title
                    Text("Create Event")
                        .font(.lumaScreenTitle)
                        .foregroundColor(.lumaTextPrimary)
                    
                    Spacer()
                    
                    // Checkmark Button
                    Button(action: {}) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.lumaTextPrimary)
                            .padding(8)
                            .background(Color.white.opacity(0.1))
                            .clipShape(Circle())
                    }
                }
                .padding(.horizontal, LumaStyles.screenPadding)
                .padding(.vertical, 10)

                // --- Main Content ScrollView ---
                ScrollView {
                    VStack(alignment: .leading, spacing: LumaStyles.sectionSpacing) {
                        
                        // --- Restore Draft Chip (if visible) ---
                        // Re-enable this if you want the "Restore Draft?" chip
                        /*
                        Button(action: {}) {
                            HStack(spacing: 4) {
                                Image(systemName: "arrow.counterclockwise")
                                Text("Restore Draft?")
                                Image(systemName: "xmark")
                            }
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color.white.opacity(0.15))
                            .clipShape(Capsule())
                        }
                        .frame(maxWidth: .infinity, alignment: .center)
                        */
                        
                        // --- Event Image ---
                        ZStack(alignment: .bottomTrailing) {
                            RoundedRectangle(cornerRadius: LumaStyles.cardRadius)
                                .fill(Color.lumaEventImagePlaceholder) // Use the defined placeholder color
                                .aspectRatio(1.5, contentMode: .fit) // Adjusted aspect ratio for the image
                                .overlay(
                                    Image(systemName: "photo.on.rectangle.angled") // Placeholder for image
                                        .font(.system(size: 100))
                                        .foregroundColor(.black.opacity(0.3))
                                )
                            
                            Button(action: {}) {
                                Image(systemName: "photo.badge.plus")
                                    .font(.system(size: 20))
                                    .foregroundColor(.white)
                                    .padding(10)
                                    .background(Color.black.opacity(0.5))
                                    .clipShape(Circle())
                            }
                            .padding(10)
                        }
                        
                        // --- FIRST GROUPED LIST: Event Name, Start, End ---
                        VStack(alignment: .leading, spacing: 0) {
                            // Text Field
                            TextField("", text: $eventName)
                                .font(.lumaBody.bold())
                                .foregroundColor(.lumaTextPrimary)
                                .placeholder(when: eventName.isEmpty) {
                                    Text("Event Name")
                                        .font(.lumaBody.bold())
                                        .foregroundColor(.lumaTextPlaceholder)
                                }
                                .frame(height: LumaStyles.inputRowHeight)
                            
                            Divider().background(Color.lumaTextPlaceholder.opacity(0.5))
                            
                            // Row Item: Start
                            HStack {
                                Text("Start")
                                    .font(.lumaBody)
                                    .foregroundColor(.lumaTextSecondary)
                                Spacer()
                                Text("Tue, Nov 11 at 11:00 PM")
                                    .font(.lumaBody.weight(.medium))
                                    .foregroundColor(.lumaTextPrimary)
                            }
                            .frame(height: LumaStyles.inputRowHeight)
                            
                            Divider().background(Color.lumaTextPlaceholder.opacity(0.5))

                            // Row Item: End
                            HStack {
                                Text("End")
                                    .font(.lumaBody)
                                    .foregroundColor(.lumaTextSecondary)
                                Spacer()
                                Text("Wed, Nov 12 at 12:00 AM")
                                    .font(.lumaBody.weight(.medium))
                                    .foregroundColor(.lumaTextPrimary)
                            }
                            .frame(height: LumaStyles.inputRowHeight)
                        }
                        .lumaGroupedList() // <-- Apply modifier to THIS VStack
                        
                        // --- SECOND GROUPED LIST: Choose Location, Add Description ---
                        VStack(spacing: 0) {
                            HStack {
                                Image(systemName: "mappin.and.ellipse")
                                    .foregroundColor(.lumaTextSecondary)
                                Text("Choose Location")
                                    .font(.lumaBody)
                                    .foregroundColor(.lumaTextSecondary)
                                Spacer()
                            }
                            .frame(height: LumaStyles.inputRowHeight)
                            
                            Divider().background(Color.lumaTextPlaceholder.opacity(0.5))

                            HStack {
                                Image(systemName: "doc.plaintext")
                                    .foregroundColor(.lumaTextSecondary)
                                Text("Add Description")
                                    .font(.lumaBody)
                                    .foregroundColor(.lumaTextSecondary)
                                Spacer()
                            }
                            .frame(height: LumaStyles.inputRowHeight)
                        }
                        .lumaGroupedList() // <-- Apply modifier to THIS VStack
                        
                        // --- Ticketing Section Header ---
                        Text("Ticketing")
                            .font(.lumaSectionHeader)
                            .foregroundColor(.lumaTextSecondary)
                            .padding(.horizontal, LumaStyles.itemSpacing) // Aligns with grouped list padding
                        
                        // --- THIRD GROUPED LIST: Require Approval ---
                        VStack(spacing: 0) {
                            Toggle(isOn: $requireApproval) {
                                Image(systemName: "lock")
                                    .foregroundColor(.lumaTextSecondary)
                                Text("Require Approval")
                                    .font(.lumaBody)
                                    .foregroundColor(.lumaTextPrimary)
                            }
                            .tint(.white) // Use .white for the toggle color
                            .frame(height: LumaStyles.inputRowHeight)
                        }
                        .lumaGroupedList()
                        
                        // --- Rest of the content (Price, Options) would go here ---
                        // For brevity, not including them as they are not in the provided image
                        // but you can add them similarly to the 'UsageExample' file.
                        
                    }
                    .padding(.horizontal, LumaStyles.screenPadding)
                    .padding(.bottom, 40) // Adjust bottom padding as needed
                }
            }
        }
    }
}

/// Helper extension for placeholder text in SwiftUI
extension View {
    func placeholder<Content: View>(
        when shouldShow: Bool,
        alignment: Alignment = .leading,
        @ViewBuilder placeholder: () -> Content) -> some View {

        ZStack(alignment: alignment) {
            placeholder().opacity(shouldShow ? 1 : 0)
            self
        }
    }
}

/// The preview provider to see the example in Xcode.
#if DEBUG
struct CreateEventView_Previews: PreviewProvider {
    static var previews: some View {
        CreateEventView()
    }
}
#endif
