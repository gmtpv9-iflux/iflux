package vn.iflux.app.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import vn.iflux.app.ui.screens.MainShell
import vn.iflux.app.ui.theme.IfxColors

@Composable
fun IFluxAppRoot() {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = IfxColors.BrandPrimary,
            background = IfxColors.Surface,
            surface = IfxColors.SurfaceElevated
        )
    ) {
        MainShell()
    }
}
