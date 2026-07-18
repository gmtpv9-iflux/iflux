package vn.iflux.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import vn.iflux.app.core.model.IfxSector
import vn.iflux.app.core.model.IfxStock
import vn.iflux.app.ui.theme.IfxColors

@Composable
fun IfxBrandName() {
    Text(
        text = "iFlux",
        color = IfxColors.TextPrimary,
        fontSize = 20.sp,
        fontWeight = FontWeight.Bold,
        modifier = Modifier
            .background(IfxColors.BrandPrimary, RoundedCornerShape(6.dp))
            .padding(horizontal = 6.dp, vertical = 2.dp)
    )
}

@Composable
fun IfxStockRow(stock: IfxStock, modifier: Modifier = Modifier) {
    Row(modifier = modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(stock.ticker, color = IfxColors.TextPrimary, fontWeight = FontWeight.SemiBold)
            stock.name?.let { Text(it, color = IfxColors.TextSecondary, fontSize = 12.sp) }
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(
                stock.price?.let { String.format("%.2f", it) } ?: "—",
                color = IfxColors.TextPrimary,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold
            )
            val change = stock.changePct ?: 0.0
            Text(
                String.format("%+.2f%%", change),
                color = if (change >= 0) IfxColors.Positive else IfxColors.Negative,
                fontSize = 12.sp,
                fontFamily = FontFamily.Monospace
            )
        }
    }
}

@Composable
fun IfxSectorCard(sector: IfxSector) {
    Column(
        Modifier
            .fillMaxWidth()
            .background(IfxColors.SurfaceElevated, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Text(sector.name, color = IfxColors.TextPrimary, fontWeight = FontWeight.SemiBold)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Ig ${"%.1f".format(sector.ig)}", color = IfxColors.TextSecondary, fontSize = 13.sp)
            Text(
                String.format("%+.2f%%", sector.pg),
                color = if (sector.pg >= 0) IfxColors.Positive else IfxColors.Negative,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
fun IfxPrimaryButton(text: String, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.buttonColors(containerColor = IfxColors.BrandPrimary)
    ) {
        Text(text)
    }
}
