pragma Singleton
import QtQuick 2.15
import QtQuick.Controls 2.15

QtObject {
    id: theme
    
    readonly property bool isDark: Qt.styleHints.colorScheme === Qt.Dark
    
    // Colors
    readonly property color background: isDark ? "#1e1e1e" : "#ffffff"
    readonly property color surface: isDark ? "#2d2d2d" : "#f5f5f5"
    readonly property color surfaceVariant: isDark ? "#3d3d3d" : "#e0e0e0"
    readonly property color primary: "#007acc"
    readonly property color primaryVariant: isDark ? "#005a9e" : "#0099ff"
    readonly property color secondary: "#6c757d"
    readonly property color accent: "#17a2b8"
    readonly property color error: "#dc3545"
    readonly property color warning: "#ffc107"
    readonly property color success: "#28a745"
    readonly property color info: "#17a2b8"
    
    // Text colors
    readonly property color onBackground: isDark ? "#ffffff" : "#000000"
    readonly property color onSurface: isDark ? "#e0e0e0" : "#212529"
    readonly property color onPrimary: "#ffffff"
    readonly property color onSecondary: "#ffffff"
    readonly property color textSecondary: isDark ? "#b0b0b0" : "#6c757d"
    readonly property color textDisabled: isDark ? "#666666" : "#adb5bd"
    
    // Border colors
    readonly property color border: isDark ? "#404040" : "#dee2e6"
    readonly property color borderFocus: primary
    readonly property color borderError: error
    
    // Shadows
    readonly property color shadow: isDark ? "#000000" : "#00000020"
    
    // Spacing
    readonly property int spacing: 8
    readonly property int spacingSmall: 4
    readonly property int spacingLarge: 16
    readonly property int spacingXLarge: 24
    
    // Sizes
    readonly property int buttonHeight: 36
    readonly property int inputHeight: 40
    readonly property int headerHeight: 56
    readonly property int toolbarHeight: 48
    readonly property int sidebarWidth: 280
    readonly property int sidebarWidthCollapsed: 56
    
    // Radii
    readonly property int radiusSmall: 4
    readonly property int radius: 8
    readonly property int radiusLarge: 12
    
    // Typography
    readonly property int fontSizeSmall: 12
    readonly property int fontSize: 14
    readonly property int fontSizeLarge: 16
    readonly property int fontSizeXLarge: 18
    readonly property int fontSizeTitle: 20
    readonly property int fontSizeHeader: 24
    
    readonly property string fontFamily: Qt.application.font.family
    readonly property string fontFamilyMono: "Consolas, Monaco, 'Courier New', monospace"
    
    // Animations
    readonly property int animationDuration: 200
    readonly property int animationDurationFast: 100
    readonly property int animationDurationSlow: 300
    
    // Responsive breakpoints
    readonly property int breakpointMobile: 768
    readonly property int breakpointTablet: 1024
    readonly property int breakpointDesktop: 1200
    
    // Mobile detection
    function isMobile(width) {
        return width < breakpointMobile
    }
    
    function isTablet(width) {
        return width >= breakpointMobile && width < breakpointTablet
    }
    
    function isDesktop(width) {
        return width >= breakpointTablet
    }
    
    // Responsive values
    function responsiveValue(width, mobile, tablet, desktop) {
        if (isMobile(width)) return mobile
        if (isTablet(width)) return tablet || mobile
        return desktop || tablet || mobile
    }
}