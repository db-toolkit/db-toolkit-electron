import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Controls.Material 2.15
import QtQuick.Layouts 1.15
import DBToolkit 1.0

Rectangle {
    id: root
    color: Material.color(Material.Grey, Material.Shade50)
    
    property string connectionId: ""
    
    SchemaController {
        id: schemaController
    }
    
    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 10
        spacing: 10
        
        // Header
        RowLayout {
            Layout.fillWidth: true
            
            Text {
                text: "Schema Explorer"
                font.pixelSize: 16
                font.bold: true
                Layout.fillWidth: true
            }
            
            Button {
                text: "Refresh"
                enabled: !schemaController.loading && root.connectionId !== ""
                onClicked: schemaController.refresh_schema()
            }
        }
        
        // Loading indicator
        Rectangle {
            Layout.fillWidth: true
            height: 40
            visible: schemaController.loading
            color: Material.color(Material.Blue, Material.Shade100)
            radius: 4
            
            RowLayout {
                anchors.centerIn: parent
                spacing: 10
                
                BusyIndicator {
                    running: schemaController.loading
                    Material.accent: Material.Blue
                }
                
                Text {
                    text: "Loading schema..."
                    color: Material.color(Material.Blue)
                }
            }
        }
        
        // Error message
        Rectangle {
            Layout.fillWidth: true
            height: 40
            visible: schemaController.error !== ""
            color: Material.color(Material.Red, Material.Shade100)
            radius: 4
            
            Text {
                anchors.centerIn: parent
                text: schemaController.error
                color: Material.color(Material.Red)
                wrapMode: Text.WordWrap
            }
        }
        
        // Schema tree view
        ScrollView {
            Layout.fillWidth: true
            Layout.fillHeight: true
            
            ListView {
                id: schemaTreeView
                anchors.fill: parent
                model: schemaController.schemaModel
                
                delegate: Rectangle {
                    width: schemaTreeView.width
                    height: 35
                    color: mouseArea.containsMouse ? Material.color(Material.Grey, Material.Shade100) : "transparent"
                    
                    RowLayout {
                        anchors.fill: parent
                        anchors.leftMargin: 10 + (model.level * 20)
                        anchors.rightMargin: 10
                        anchors.topMargin: 5
                        anchors.bottomMargin: 5
                        spacing: 8
                        
                        // Expand/collapse indicator
                        Text {
                            text: model.hasChildren ? (model.expanded ? "▼" : "▶") : "  "
                            font.pixelSize: 10
                            color: Material.color(Material.Grey)
                            Layout.preferredWidth: 15
                            visible: model.hasChildren
                        }
                        
                        // Type icon
                        Text {
                            text: getIcon()
                            font.pixelSize: 14
                            
                            function getIcon() {
                                switch(model.type) {
                                    case "schema": return "🗂️"
                                    case "table": return "📋"
                                    case "column": return "📄"
                                    default: return "📁"
                                }
                            }
                        }
                        
                        // Name
                        Text {
                            text: model.name
                            font.pixelSize: 13
                            Layout.fillWidth: true
                            elide: Text.ElideRight
                        }
                        
                        // Data type for columns
                        Text {
                            text: model.dataType
                            font.pixelSize: 11
                            color: Material.color(Material.Grey)
                            visible: model.type === "column" && model.dataType
                        }
                    }
                    
                    MouseArea {
                        id: mouseArea
                        anchors.fill: parent
                        hoverEnabled: true
                        
                        onClicked: {
                            if (model.hasChildren) {
                                schemaController.toggle_item(index)
                            }
                        }
                        
                        onDoubleClicked: {
                            if (model.type === "table") {
                                console.log("Load table data:", model.name)
                            }
                        }
                    }
                }
            }
        }
        
        // Empty state
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            visible: !schemaController.loading && schemaController.error === "" && root.connectionId === ""
            color: "transparent"
            
            ColumnLayout {
                anchors.centerIn: parent
                spacing: 15
                
                Text {
                    text: "🔍"
                    font.pixelSize: 48
                    Layout.alignment: Qt.AlignHCenter
                }
                
                Text {
                    text: "Select a connection to explore schema"
                    font.pixelSize: 14
                    color: Material.color(Material.Grey)
                    Layout.alignment: Qt.AlignHCenter
                }
            }
        }
    }
    
    onConnectionIdChanged: {
        if (connectionId !== "") {
            schemaController.load_schema(connectionId)
        }
    }
}