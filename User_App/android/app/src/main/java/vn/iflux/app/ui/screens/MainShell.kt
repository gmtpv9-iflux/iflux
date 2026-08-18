package vn.iflux.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.sp
import vn.iflux.app.core.config.IfxAppConfig
import vn.iflux.app.ui.components.IfxBrandName
import vn.iflux.app.ui.components.IfxWebView
import vn.iflux.app.ui.theme.IfxColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainShell() {
    var selectedTab by remember { mutableStateOf("home") }
    var overlayPath by remember { mutableStateOf<String?>(null) }
    var showMenu by remember { mutableStateOf(false) }

    val currentPath = IfxAppConfig.mainTabs.firstOrNull { it.id == selectedTab }?.path
        ?: IfxAppConfig.mainTabs.first().path

    if (overlayPath != null) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("iFlux") },
                    navigationIcon = {
                        IconButton(onClick = { overlayPath = null }) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Quay lại")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = IfxColors.SurfaceElevated)
                )
            },
            containerColor = IfxColors.Surface
        ) { padding ->
            IfxWebView(overlayPath!!, Modifier.padding(padding))
        }
        return
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { IfxBrandName() },
                actions = {
                    IconButton(onClick = { showMenu = true }) {
                        Icon(Icons.Default.MoreVert, contentDescription = "Menu")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = IfxColors.SurfaceElevated)
            )
        },
        bottomBar = {
            NavigationBar(containerColor = IfxColors.SurfaceElevated) {
                IfxAppConfig.mainTabs.forEach { tab ->
                    NavigationBarItem(
                        selected = selectedTab == tab.id,
                        onClick = { selectedTab = tab.id },
                        icon = { Icon(Icons.Default.Home, null) },
                        label = { Text(tab.label, fontSize = 9.sp, maxLines = 1) }
                    )
                }
            }
        },
        containerColor = IfxColors.Surface
    ) { padding ->
        IfxWebView(currentPath, Modifier.padding(padding))
    }

    if (showMenu) {
        AlertDialog(
            onDismissRequest = { showMenu = false },
            confirmButton = { TextButton({ showMenu = false }) { Text("Đóng") } },
            title = { Text("Truy cập nhanh") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    IfxAppConfig.quickActions.forEach { action ->
                        TextButton(onClick = {
                            showMenu = false
                            overlayPath = action.path
                        }) { Text(action.label) }
                    }
                    TextButton(onClick = {
                        showMenu = false
                        overlayPath = "/User_Web/home/index.html?tab=account"
                    }) { Text("Hồ sơ & cài đặt") }
                    TextButton(onClick = {
                        showMenu = false
                        overlayPath = "/User_Web/account/checkout.html"
                    }) { Text("Thanh toán gói") }
                }
            }
        )
    }
}
