import Foundation

/// Mock market data — mirror User_Web/iflux-web-ui/mock-market.js
enum MockMarketService {
    static func loadSnapshot() -> MockMarketSnapshot {
        let stockSeeds: [(String, String, Double, Double)] = [
            ("HPG", "Hòa Phát", 28.45, 2.57),
            ("VCB", "Vietcombank", 92.1, 1.82),
            ("FPT", "FPT", 128.5, 1.45),
            ("MWG", "Thế Giới Di Động", 71.2, 0.98),
            ("VHM", "Vinhomes", 42.8, 0.71),
            ("VIC", "Vingroup", 38.2, -1.24),
            ("SSI", "SSI", 29.7, -3.01),
            ("TCB", "Techcombank", 28.9, 2.15),
            ("MBB", "MB Bank", 24.3, 1.62),
            ("HCM", "CK TP.HCM", 18.4, -2.45)
        ]

        var stocks: [String: IfxStock] = [:]
        let ts = ISO8601DateFormatter().string(from: Date())
        for (ticker, name, price, change) in stockSeeds {
            stocks[ticker] = IfxStock(
                ticker: ticker,
                name: name,
                price: price,
                changePct: change,
                volume: "4.2M",
                ts: ts,
                sticker: IfxSticker(sectorRank: Int.random(in: 1...10), sectorPg: change, trend: change >= 0 ? "up" : "down")
            )
        }

        let sectors: [Int: IfxSector] = [
            1: IfxSector(id: 1, name: "Ngân hàng", ig: 102.4, pg: 1.2, breadthUp: 8, breadthDown: 3, ts: ts),
            2: IfxSector(id: 2, name: "Thép", ig: 98.6, pg: -0.8, breadthUp: 2, breadthDown: 5, ts: ts),
            3: IfxSector(id: 3, name: "BĐS", ig: 101.1, pg: 0.4, breadthUp: 5, breadthDown: 4, ts: ts),
            4: IfxSector(id: 4, name: "Công nghệ", ig: 105.3, pg: 2.1, breadthUp: 9, breadthDown: 1, ts: ts),
            5: IfxSector(id: 5, name: "Chứng khoán", ig: 97.2, pg: -1.5, breadthUp: 1, breadthDown: 6, ts: ts),
            6: IfxSector(id: 6, name: "Bán lẻ", ig: 100.5, pg: 0.6, breadthUp: 4, breadthDown: 3, ts: ts)
        ]

        let ecosystems: [Int: IfxSector] = [
            1: IfxSector(id: 1, name: "Họ Vingroup", ig: 103.8, pg: 0.9, breadthUp: 6, breadthDown: 2, ts: ts),
            2: IfxSector(id: 2, name: "Họ FPT", ig: 104.2, pg: 1.8, breadthUp: 7, breadthDown: 1, ts: ts),
            3: IfxSector(id: 3, name: "Họ HPG", ig: 99.1, pg: -0.3, breadthUp: 3, breadthDown: 4, ts: ts)
        ]

        let market = IfxMarketSnapshot(ig: 1124.5, pg: 0.42, breadthUp: 156, breadthDown: 98)
        let flow: [String: IfxFlowSummary] = [
            "foreign": IfxFlowSummary(buyPct: 52, sellPct: 48, netLabel: "Mua ròng"),
            "proprietary": IfxFlowSummary(buyPct: 45, sellPct: 55, netLabel: "Bán ròng"),
            "institutional": IfxFlowSummary(buyPct: 51, sellPct: 49, netLabel: "Mua ròng"),
            "retail": IfxFlowSummary(buyPct: 48, sellPct: 52, netLabel: "Cân bằng")
        ]

        return MockMarketSnapshot(
            stocks: stocks,
            sectors: sectors,
            ecosystems: ecosystems,
            market: market,
            flow: flow
        )
    }

    static func topMovers(from stocks: [String: IfxStock], limit: Int = 5) -> [IfxStock] {
        Array(stocks.values)
            .sorted { ($0.changePct ?? 0) > ($1.changePct ?? 0) }
            .prefix(limit)
            .map { $0 }
    }
}
