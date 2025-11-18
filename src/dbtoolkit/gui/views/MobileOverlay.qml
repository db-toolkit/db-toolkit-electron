import QtQuick 2.15
import QtQuick.Controls 2.15
import dbtoolkit 1.0

Rectangle {
    id: overlay
    anchors.fill: parent
    color: "#80000000"
    visible: false
    
    property alias sidebarVisible: overlay.visible
    
    signal closeRequested()
    
    MouseArea {
        anchors.fill: parent
        onClicked: overlay.closeRequested()
    }
    
    // Mobile sidebar toggle button
    Button {
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.margins: Theme.spacing
        width: Theme.buttonHeight
        height: Theme.buttonHeight
        text: "☰"
        
        background: Rectangle {
            color: Theme.surface
            radius: Theme.radiusSmall
            border.color: Theme.border
            border.width: 1
        }
        
        contentItem: Text {
            text: parent.text
            font.pixelSize: Theme.fontSizeLarge
            color: Theme.onSurface
            horizontalAlignment: Text.AlignHCenter
            verticalAlignment: Text.AlignVCenter
        }
        
        onClicked: overlay.closeRequested()
    }
}