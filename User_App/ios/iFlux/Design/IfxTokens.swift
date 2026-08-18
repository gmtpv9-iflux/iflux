import SwiftUI

/// Design tokens — mirror 06_DESIGN_SYSTEM + Admin iflux-admin-ui.css
enum IfxTokens {
    static let brandPrimary = Color(red: 0.341, green: 0.353, blue: 1.0) // #575aff
    static let brandOnPrimary = Color.white
    static let surface = Color(red: 0.06, green: 0.07, blue: 0.10)
    static let surfaceElevated = Color(red: 0.10, green: 0.11, blue: 0.15)
    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.65)
    static let positive = Color(red: 0.18, green: 0.80, blue: 0.44)
    static let negative = Color(red: 0.96, green: 0.26, blue: 0.37)
    static let border = Color.white.opacity(0.08)

    static let radiusSm: CGFloat = 8
    static let radiusMd: CGFloat = 12
    static let radiusBrand: CGFloat = 6 // 30% of ~20px brand pill

    static let space1: CGFloat = 4
    static let space2: CGFloat = 8
    static let space3: CGFloat = 12
    static let space4: CGFloat = 16
    static let space5: CGFloat = 24
}
