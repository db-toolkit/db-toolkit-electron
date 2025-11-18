import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import dbtoolkit 1.0

Rectangle {
    id: mobileNav
    height: Theme.toolbarHeight
    color: Theme.surface
    border.color: Theme.border
    border.width: 1
    
    property string currentView: "connections"
    
    signal viewChanged(string view)
    
    RowLayout {
        anchors.fill: parent
        anchors.margins: Theme.spacing
        spacing: 0
        
        Repeater {
            model: [
                { id: "connections", icon: "🔗", title: "Connections" },
                { id: "explorer", icon: "🗂️", title: "Explorer" },
                { id: "query", icon: "📝", title: "Query" },
                { id: "data", icon: "📊", title: "Data" }
            ]
            
            Button {
                Layout.fillWidth: true
                Layout.fillHeight: true
                flat: true
                
                background: Rectangle {
                    color: currentView === modelData.id ? Theme.primary + "20" : "transparent"
                    radius: Theme.radiusSmall
                }
                
                contentItem: Column {
                    spacing: Theme.spacingSmall
                    
                    Text {
                        text: modelData.icon
                        font.pixelSize: Theme.fontSizeLarge
                        anchors.horizontalCenter: parent.horizontalCenter
                    }
                    
                    Text {
                        text: modelData.title
                        font.pixelSize: Theme.fontSizeSmall
                        color: currentView === modelData.id ? Theme.primary : Theme.textSecondary
                        anchors.horizontalCenter: parent.horizontalCenter
                    }
                }
                
                onClicked: {
                    currentView = modelData.id
                    mobileNav.viewChanged(modelData.id)
                }
            }
        }
    }
}