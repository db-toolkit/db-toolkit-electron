import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import Qt5Compat.GraphicalEffects
import DBToolkit 1.0
import dbtoolkit 1.0

ApplicationWindow {
    id: window
    width: 1200
    height: 800
    minimumWidth: 320
    minimumHeight: 480
    visible: true
    title: "DB Toolkit"
    
    color: Theme.background
    
    property bool isMobile: Theme.isMobile(width)
    property bool isTablet: Theme.isTablet(width)
    property bool isDesktop: Theme.isDesktop(width)
    property bool sidebarCollapsed: isMobile
    

    
    property string selectedConnectionId: ""
    
    ConnectionController {
        id: connectionController
    }
    
    RowLayout {
        anchors.fill: parent
        anchors.margins: isMobile ? Theme.spacing : Theme.spacingLarge
        spacing: isMobile ? Theme.spacing : Theme.spacingLarge
        
        // Left panel - Connections
        Rectangle {
            Layout.preferredWidth: Theme.responsiveValue(width, width - Theme.spacingLarge * 2, 300, 300)
            Layout.fillHeight: true
            color: Theme.surface
            radius: Theme.radius
            border.color: Theme.border
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
                    height: Theme.headerHeight
                    radius: Theme.radius
                    color: Theme.primary
                    
                    RowLayout {
                        anchors.fill: parent
                        anchors.margins: 15
                        
                        Text {
                            text: "🔗 Connections"
                            font.pixelSize: Theme.fontSizeLarge
                            font.bold: true
                            color: Theme.onPrimary
                            Layout.fillWidth: true
                        }
                        
                        Button {
                            text: "+"
                            font.bold: true
                            onClicked: connectionDialog.open()
                            
                            background: Rectangle {
                                color: Theme.onPrimary
                                radius: Theme.radiusSmall
                            }
                            
                            contentItem: Text {
                                text: parent.text
                                font: parent.font
                                color: Theme.primary
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
                        color: selectedConnectionId === modelData.id ? Theme.primaryVariant + "20" : Theme.surface
                        border.color: selectedConnectionId === modelData.id ? Theme.primary : Theme.border
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
                            color: Theme.success
                            anchors.right: parent.right
                            anchors.top: parent.top
                            anchors.margins: Theme.spacing
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
                                        default: return Material.color(Material.Grey)
                                    }
                                }
                            }
                            
                            ColumnLayout {
                                Layout.fillWidth: true
                                spacing: 4
                                
                                Text {
                                    text: modelData.name
                                    font.bold: true
                                    font.pixelSize: Theme.fontSize
                                    color: selectedConnectionId === modelData.id ? Theme.primary : Theme.onSurface
                                }
                                
                                Text {
                                    text: modelData.db_type.toUpperCase() + " • " + (modelData.host || modelData.file_path || "")
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: Theme.textSecondary
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
                Layout.preferredWidth: Theme.responsiveValue(width, 0, 350, 350)
                Layout.fillHeight: true
                connectionId: selectedConnectionId
                visible: !isMobile
            }
            
            // Query/Data area
            Rectangle {
                Layout.fillWidth: true
                Layout.fillHeight: true
                color: Theme.surface
                radius: Theme.radius
                border.color: Theme.border
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
                        color: selectedConnectionId ? Theme.accent + "20" : Theme.surfaceVariant
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
                        font.pixelSize: Theme.fontSizeHeader
                        font.bold: true
                        color: Theme.onSurface
                        Layout.alignment: Qt.AlignHCenter
                    }
                    
                    Text {
                        text: selectedConnectionId ? "✨ Ready to execute queries" : "🔗 Select a connection to get started"
                        font.pixelSize: Theme.fontSizeLarge
                        color: Theme.textSecondary
                        Layout.alignment: Qt.AlignHCenter
                    }
                    
                    // Action button
                    Button {
                        text: selectedConnectionId ? "Open Query Editor" : "Add Connection"
                        font.bold: true
                        Layout.alignment: Qt.AlignHCenter
                        enabled: true
                        
                        background: Rectangle {
                            color: selectedConnectionId ? Theme.accent : Theme.primary
                            radius: Theme.radiusSmall
                        }
                        
                        contentItem: Text {
                            text: parent.text
                            font: parent.font
                            color: Theme.onPrimary
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
    
    // Mobile navigation
    MobileNavigation {
        id: mobileNav
        anchors.bottom: parent.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        visible: isMobile
        
        onViewChanged: function(view) {
            console.log("Mobile view changed to:", view)
        }
    }
    
    // Mobile overlay for sidebar
    MobileOverlay {
        id: mobileOverlay
        sidebarVisible: isMobile && !sidebarCollapsed
        
        onCloseRequested: sidebarCollapsed = true
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