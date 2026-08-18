package vn.iflux.app.core.service

import vn.iflux.app.core.model.EntitySnapshot
import vn.iflux.app.core.model.IfxFlowSummary
import vn.iflux.app.core.model.IfxMarketSnapshot
import vn.iflux.app.core.model.IfxSector
import vn.iflux.app.core.model.IfxStock

object MockMarketService {
    fun loadSnapshot(): EntitySnapshot {
        val stocks = linkedMapOf(
            "HPG" to IfxStock("HPG", "Hòa Phát", 28.45, 2.57, "12.4M"),
            "VCB" to IfxStock("VCB", "Vietcombank", 92.1, 1.82, "3.2M"),
            "FPT" to IfxStock("FPT", "FPT", 128.5, 1.45, "1.8M"),
            "SSI" to IfxStock("SSI", "SSI", 29.7, -3.01, "6.3M"),
            "TCB" to IfxStock("TCB", "Techcombank", 28.9, 2.15, "4.8M")
        )
        val sectors = mapOf(
            1 to IfxSector(1, "Ngân hàng", 102.4, 1.2, 8, 3),
            2 to IfxSector(2, "Thép", 98.6, -0.8, 2, 5),
            3 to IfxSector(3, "BĐS", 101.1, 0.4, 5, 4),
            4 to IfxSector(4, "Công nghệ", 105.3, 2.1, 9, 1)
        )
        val ecosystems = mapOf(
            1 to IfxSector(1, "Họ Vingroup", 103.8, 0.9, 6, 2),
            2 to IfxSector(2, "Họ FPT", 104.2, 1.8, 7, 1)
        )
        val market = IfxMarketSnapshot(1124.5, 0.42, 156, 98)
        val flow = mapOf(
            "foreign" to IfxFlowSummary(52.0, 48.0, "Mua ròng"),
            "proprietary" to IfxFlowSummary(45.0, 55.0, "Bán ròng"),
            "institutional" to IfxFlowSummary(51.0, 49.0, "Mua ròng"),
            "retail" to IfxFlowSummary(48.0, 52.0, "Cân bằng")
        )
        return EntitySnapshot(stocks, sectors, ecosystems, market, flow)
    }

    fun topMovers(stocks: Map<String, IfxStock>, limit: Int = 5): List<IfxStock> =
        stocks.values.sortedByDescending { it.changePct ?: 0.0 }.take(limit)
}
