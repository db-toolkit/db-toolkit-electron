import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import Qt5Compat.GraphicalEffects
import DBToolkit 1.0

ApplicationWindow {
    id: window
    width: 1200
    height: 800
    minimumWidth: 320
    minimumHeight: 480
    visible: true
    title: "DB Toolkit"
    
    // Theme properties
    readonly property bool isDark: Qt.styleHints.colorScheme === Qt.Dark
    readonly property color themeBackground: isDark ? "#1e1e1e" : "#ffffff"
    readonly property color themeSurface: isDark ? "#2d2d2d" : "#f5f5f5"
    readonly property color themeSurfaceVariant: isDark ? "#3d3d3d" : "#e0e0e0"
    readonly property color themePrimary: "#007acc"
    readonly property string themePrimaryVariant: isDark ? "#005a9e" : "#0099ff"
    readonly property color themeAccent: "#17a2b8"
    readonly property color themeSuccess: "#28a745"
    readonly property color themeOnSurface: isDark ? "#e0e0e0" : "#212529"
    readonly property color themeOnPrimary: "#ffffff"
    readonly property color themeTextSecondary: isDark ? "#b0b0b0" : "#6c757d"
    readonly property color themeBorder: isDark ? "#404040" : "#dee2e6"
    readonly property int themeSpacing: 8
    readonly property int themeSpacingLarge: 16
    readonly property int themeHeaderHeight: 56
    readonly property int themeRadius: 8
    readonly property int themeRadiusSmall: 4
    readonly property int themeFontSize: 14
    readonly property int themeFontSizeSmall: 12
    readonly property int themeFontSizeLarge: 16
    readonly property int themeFontSizeHeader: 24
    readonly property int breakpointMobile: 768
    
    function isMobile(width) { return width < breakpointMobile }
    function responsiveValue(width, mobile, tablet, desktop) {
        return width < breakpointMobile ? mobile : (desktop || tablet || mobile)
    }
    
    color: themeBackground
    
    property bool isMobile: isMobile(width)
    property bool sidebarCollapsed: isMobile
    

    
    property string selectedConnectionId: ""
    
    ConnectionController {
        id: connectionController
    }
    
    RowLayout {
        anchors.fill: parent
        anchors.margins: isMobile ? theme.spacing : theme.spacingLarge
        spacing: isMobile ? theme.spacing : theme.spacingLarge
        
        // Left panel - Connections
        Rectangle {
            Layout.preferredWidth: theme.responsiveValue(width, width - theme.spacingLarge * 2, 300, 300)
            Layout.fillHeight: true
            color: theme.surface
            radius: theme.radius
            border.color: theme.border
            border.width: 1
            visible: !isMobile || !sidebarCollapsed
            
            // Drop shadow effect
            layer.enabled: true
            layer.effect: DropShadow {
                horizontalOffset: 0
                verticalOffset: 2
                radius: 8
                samples: 16
                color: "#20000000"
            }
            
            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 15
                spacing: 10
                
                // Header
                Rectangle {
                    Layout.fillWidth: true
                    height: theme.headerHeight
                    radius: theme.radius
                    color: theme.primary
                    
                    RowLayout {
                        anchors.fill: parent
                        anchors.margins: 15
                        
                        Text {
                            text: "🔗 Connections"
                            font.pixelSize: theme.fontSizeLarge
                            font.bold: true
                            color: theme.onPrimary
                            Layout.fillWidth: true
                        }
                        
                        Button {
                            text: "+"
                            font.bold: true
                            onClicked: connectionDialog.open()
                            
                            background: Rectangle {
                                color: theme.onPrimary
                                radius: theme.radiusSmall
                            }
                            
                            contentItem: Text {
                                text: parent.text
                                font: parent.font
                                color: theme.primary
                                horizontalAlignment: Text.AlignHCenter
                                verticalAlignment: Text.AlignVCenter
                            }
                            
                            // Hover animation
                            scale: mouseArea.containsMouse ? 1.05 : 1.0
                            Behavior on scale { NumberAnimation { duration: 150 } }
                            
                            MouseArea {
                                id: mouseArea
                                anchors.fill: parent
                                hoverEnabled: true
                                onClicked: parent.clicked()
                            }
                        }
                    }
                }
                
                ListView {
                    id: connectionsList
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    model: connectionController.connections
                    spacing: 8
                    
                    delegate: Rectangle {
                        width: connectionsList.width - 10
                        height: 70
                        anchors.horizontalCenter: parent.horizontalCenter
                        color: selectedConnectionId === modelData.id ? theme.primaryVariant + "20" : theme.surface
                        border.color: selectedConnectionId === modelData.id ? theme.primary : theme.border
                        border.width: selectedConnectionId === modelData.id ? 2 : 1
                        radius: 8
                        
                        // Hover and selection effects
                        scale: mouseArea.containsMouse ? 1.02 : 1.0
                        Behavior on scale { NumberAnimation { duration: 150 } }
                        Behavior on color { ColorAnimation { duration: 200 } }
                        Behavior on border.color { ColorAnimation { duration: 200 } }
                        
                        // Connection status indicator
                        Rectangle {
                            width: 8
                            height: 8
                            radius: 4
                            color: theme.success
                            anchors.right: parent.right
                            anchors.top: parent.top
                            anchors.margins: theme.spacing
                        }
                        
                        RowLayout {
                            anchors.fill: parent
                            anchors.margins: 12
                            spacing: 12
                            
                            // Database type icon
                            Rectangle {
                                width: 40
                                height: 40
                                radius: 20
                                color: getDbColor()
                                
                                Text {
                                    anchors.centerIn: parent
                                    text: getDbIcon()
                                    font.pixelSize: 18
                                    color: "white"
                                }
                                
                                function getDbIcon() {
                                    switch(modelData.db_type) {
                                        case "postgresql": return "🐘"
                                        case "mysql": return "🐬"
                                        case "sqlite": return "🗄"
                                        case "mongodb": return "🍃"
                                        default: return "📊"
                                    }
                                }
                                
                                function getDbColor() {
                                    switch(modelData.db_type) {
                                        case "postgresql": return "#336791"
                                        case "mysql": return "#00758f"
                                        case "sqlite": return "#003b57"
                                        case "mongodb": return "#4db33d"
                                        default: return "#6c757d"
                                    }
                                }
                            }
                            
                            ColumnLayout {
                                Layout.fillWidth: true
                                spacing: 4
                                
                                Text {
                                    text: modelData.name
                                    font.bold: true
                                    font.pixelSize: theme.fontSize
                                    color: selectedConnectionId === modelData.id ? theme.primary : theme.onSurface
                                }
                                
                                Text {
                                    text: modelData.db_type.toUpperCase() + " • " + (modelData.host || modelData.file_path || "")
                                    font.pixelSize: theme.fontSizeSmall
                                    color: theme.textSecondary
                                    elide: Text.ElideRight
                                    Layout.fillWidth: true
                                }
                            }
                        }
                        
                        MouseArea {
                            id: mouseArea
                            anchors.fill: parent
                            hoverEnabled: true
                            onClicked: {
                                selectedConnectionId = modelData.id
                                connectionController.test_connection(modelData.id)
                            }
                        }
                    }
                }
            }
        }
        
        // Main content area
        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 10
            
            // Schema Explorer
            SchemaExplorer {
                id: schemaExplorer
                Layout.preferredWidth: theme.responsiveValue(width, 0, 350, 350)
                Layout.fillHeight: true
                connectionId: selectedConnectionId
                visible: !isMobile
            }
            
            // Query/Data area
            Rectangle {
                Layout.fillWidth: true
                Layout.fillHeight: true
                color: theme.surface
                radius: theme.radius
                border.color: theme.border
                border.width: 1
                
                // Drop shadow
                layer.enabled: true
                layer.effect: DropShadow {
                    horizontalOffset: 0
                    verticalOffset: 2
                    radius: 8
                    samples: 16
                    color: "#20000000"
                }
                
                ColumnLayout {
                    anchors.centerIn: parent
                    spacing: 30
                    
                    // Icon
                    Rectangle {
                        width: 80
                        height: 80
                        radius: 40
                        color: selectedConnectionId ? theme.accent + "20" : theme.surfaceVariant
                        Layout.alignment: Qt.AlignHCenter
                        
                        Text {
                            anchors.centerIn: parent
                            text: selectedConnectionId ? "⚡" : "📝"
                            font.pixelSize: 32
                        }
                        
                        // Pulse animation when connected
                        SequentialAnimation on scale {
                            running: selectedConnectionId !== ""
                            loops: Animation.Infinite
                            NumberAnimation { to: 1.1; duration: 1000; easing.type: Easing.InOutQuad }
                            NumberAnimation { to: 1.0; duration: 1000; easing.type: Easing.InOutQuad }
                        }
                    }
                    
                    Text {
                        text: "Query Editor"
                        font.pixelSize: theme.fontSizeHeader
                        font.bold: true
                        color: theme.onSurface
                        Layout.alignment: Qt.AlignHCenter
                    }
                    
                    Text {
                        text: selectedConnectionId ? "✨ Ready to execute queries" : "🔗 Select a connection to get started"
                        font.pixelSize: theme.fontSizeLarge
                        color: theme.textSecondary
                        Layout.alignment: Qt.AlignHCenter
                    }
                    
                    // Action button
                    Button {
                        text: selectedConnectionId ? "Open Query Editor" : "Add Connection"
                        font.bold: true
                        Layout.alignment: Qt.AlignHCenter
                        enabled: true
                        
                        background: Rectangle {
                            color: selectedConnectionId ? theme.accent : theme.primary
                            radius: theme.radiusSmall
                        }
                        
                        contentItem: Text {
                            text: parent.text
                            font: parent.font
                            color: theme.onPrimary
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                        }
                        
                        onClicked: {
                            if (selectedConnectionId) {
                                console.log("Open query editor for:", selectedConnectionId)
                            } else {
                                connectionDialog.open()
                            }
                        }
                        
                        // Hover effect
                        scale: hovered ? 1.05 : 1.0
                        Behavior on scale { NumberAnimation { duration: 150 } }
                    }
                }
            }
        }
    }
    

    
    ConnectionDialog {
        id: connectionDialog
        anchors.centerIn: parent
        
        onConnectionAdded: {
            connectionController.add_connection(name, dbType, host, username, port, password, database, filePath)
            connectionDialog.close()
        }
    }
    
    Connections {
        target: connectionController
        function onConnectionTestResult(success, message) {
            console.log("Connection test:", success, message)
        }
    }
}