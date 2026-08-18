package vn.iflux.app.core.model

data class IfxStock(
    val ticker: String,
    val name: String? = null,
    val price: Double? = null,
    val changePct: Double? = null,
    val volume: String? = null
)

data class IfxSector(
    val id: Int,
    val name: String,
    val ig: Double,
    val pg: Double,
    val breadthUp: Int,
    val breadthDown: Int
)

data class IfxMarketSnapshot(
    val ig: Double,
    val pg: Double,
    val breadthUp: Int,
    val breadthDown: Int
)

data class IfxFlowSummary(
    val buyPct: Double,
    val sellPct: Double,
    val netLabel: String
)

data class IfxUser(
    val id: String,
    val email: String? = null,
    val phone: String? = null,
    val displayName: String,
    val tier: String,
    val tierLabel: String? = null
)

data class IfxSession(val user: IfxUser, val token: String? = null)

data class EntitySnapshot(
    val stocks: Map<String, IfxStock>,
    val sectors: Map<Int, IfxSector>,
    val ecosystems: Map<Int, IfxSector>,
    val market: IfxMarketSnapshot,
    val flow: Map<String, IfxFlowSummary>
)
