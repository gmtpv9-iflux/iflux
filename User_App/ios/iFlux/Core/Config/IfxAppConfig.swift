import Foundation

enum IfxAppConfig {
    /// Staging — đổi sang production URL khi phát hành App Store
    #if DEBUG
    static let webBaseURL = URL(string: "http://103.154.177.157:8888")!
    #else
    static let webBaseURL = URL(string: "http://103.154.177.157")!
    #endif

    struct NavItem: Identifiable, Hashable {
        let id: String
        let label: String
        let path: String
        let systemImage: String
    }

    static let mainTabs: [NavItem] = [
        NavItem(id: "home", label: "Nhà của tôi", path: "/User_Web/home/index.html", systemImage: "house.fill"),
        NavItem(id: "market", label: "Thị trường", path: "/User_Web/market/index.html", systemImage: "chart.line.uptrend.xyaxis"),
        NavItem(id: "community", label: "Cộng đồng", path: "/User_Web/community/index.html", systemImage: "person.3.fill"),
        NavItem(id: "pricing", label: "Gói cước", path: "/User_Web/pricing/index.html", systemImage: "crown.fill"),
        NavItem(id: "loyalty", label: "Membership", path: "/User_Web/loyalty/index.html", systemImage: "gift.fill")
    ]

    static let quickActions: [NavItem] = [
        NavItem(id: "search", label: "Tìm kiếm", path: "/User_Web/search/index.html", systemImage: "magnifyingglass"),
        NavItem(id: "alerts", label: "Cảnh báo", path: "/User_Web/alerts/index.html", systemImage: "bell.fill"),
        NavItem(id: "watchlist", label: "Watchlist", path: "/User_Web/watchlist/index.html", systemImage: "star.fill"),
        NavItem(id: "flow", label: "Dòng tiền", path: "/User_Web/flow/index.html", systemImage: "arrow.left.arrow.right"),
        NavItem(id: "faq", label: "FAQ", path: "/User_Web/faq/index.html", systemImage: "questionmark.circle")
    ]

    static let authLoginPath = "/User_Web/auth/login.html"

    static func url(for path: String) -> URL {
        if path.hasPrefix("http://") || path.hasPrefix("https://") {
            return URL(string: path)!
        }
        var base = webBaseURL.absoluteString
        if base.hasSuffix("/") { base.removeLast() }
        let normalized = path.hasPrefix("/") ? path : "/\(path)"
        return URL(string: base + normalized)!
    }
}
