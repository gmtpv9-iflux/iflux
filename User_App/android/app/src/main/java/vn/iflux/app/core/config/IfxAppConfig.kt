package vn.iflux.app.core.config

import vn.iflux.app.BuildConfig

object IfxAppConfig {
    val webBaseUrl: String = if (BuildConfig.DEBUG) {
        "http://103.154.177.157:8888"
    } else {
        "http://103.154.177.157"
    }

    data class NavItem(val id: String, val label: String, val path: String)

    val mainTabs = listOf(
        NavItem("home", "Nhà của tôi", "/User_Web/home/index.html"),
        NavItem("market", "Thị trường", "/User_Web/market/index.html"),
        NavItem("community", "Cộng đồng", "/User_Web/community/index.html"),
        NavItem("pricing", "Gói cước", "/User_Web/pricing/index.html"),
        NavItem("loyalty", "Membership", "/User_Web/loyalty/index.html")
    )

    val quickActions = listOf(
        NavItem("search", "Tìm kiếm", "/User_Web/search/index.html"),
        NavItem("alerts", "Cảnh báo", "/User_Web/alerts/index.html"),
        NavItem("watchlist", "Watchlist", "/User_Web/watchlist/index.html"),
        NavItem("flow", "Dòng tiền", "/User_Web/flow/index.html"),
        NavItem("faq", "FAQ", "/User_Web/faq/index.html")
    )

    fun url(path: String): String {
        if (path.startsWith("http")) return path
        val base = webBaseUrl.trimEnd('/')
        val normalized = if (path.startsWith("/")) path else "/$path"
        return base + normalized
    }
}
