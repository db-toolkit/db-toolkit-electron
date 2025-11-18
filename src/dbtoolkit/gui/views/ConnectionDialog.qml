import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Controls.Material 2.15
import QtQuick.Layouts 1.15
import Qt5Compat.GraphicalEffects

Dialog {
    id: dialog
    title: "🔗 Add Database Connection"
    modal: true
    width: 520
    height: 650
    
    Material.theme: Material.Light
    Material.primary: Material.Indigo
    
    background: Rectangle {
        color: "white"
        radius: 16
        
        layer.enabled: true
        layer.effect: DropShadow {
            horizontalOffset: 0
            verticalOffset: 8
            radius: 24
            samples: 32
            color: "#40000000"
        }
    }
    
    property alias connectionName: nameField.text
    property alias databaseType: typeCombo.currentText
    property alias host: hostField.text
    property alias port: portField.text
    property alias username: usernameField.text
    property alias password: passwordField.text
    property alias database: databaseField.text
    property alias filePath: filePathField.text
    
    signal connectionAdded(string name, string dbType, string host, string username, 
                          int port, string password, string database, string filePath)
    
    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 20
        spacing: 15
        
        // Connection name with icon
        RowLayout {
            Layout.fillWidth: true
            spacing: 10
            
            Text {
                text: "🏷️"
                font.pixelSize: 16
            }
            
            TextField {
                id: nameField
                placeholderText: "Connection Name (e.g., Production DB)"
                Layout.fillWidth: true
                Material.accent: Material.Indigo
                selectByMouse: true
            }
        }
        
        // Database type with icon
        RowLayout {
            Layout.fillWidth: true
            spacing: 10
            
            Text {
                text: "📊"
                font.pixelSize: 16
            }
            
            ComboBox {
                id: typeCombo
                Layout.fillWidth: true
                model: [
                    "🐘 PostgreSQL",
                    "🐬 MySQL", 
                    "🗄 SQLite",
                    "🍃 MongoDB"
                ]
                currentIndex: 0
                Material.accent: Material.Indigo
                
                property var dbTypes: ["postgresql", "mysql", "sqlite", "mongodb"]
                property string selectedType: dbTypes[currentIndex]
            }
        }
        
        TextField {
            id: hostField
            placeholderText: "Host"
            text: "localhost"
            Layout.fillWidth: true
            enabled: !typeCombo.currentText.includes("SQLite")
        }
        
        TextField {
            id: portField
            placeholderText: "Port"
            text: getDefaultPort()
            Layout.fillWidth: true
            enabled: !typeCombo.currentText.includes("SQLite")
            validator: IntValidator { bottom: 1; top: 65535 }
            
            function getDefaultPort() {
                if (typeCombo.currentText.includes("PostgreSQL")) return "5432"
                if (typeCombo.currentText.includes("MySQL")) return "3306"
                if (typeCombo.currentText.includes("MongoDB")) return "27017"
                return ""
            }
        }
        
        TextField {
            id: usernameField
            placeholderText: "Username"
            Layout.fillWidth: true
            enabled: !typeCombo.currentText.includes("SQLite")
        }
        
        TextField {
            id: passwordField
            placeholderText: "Password"
            echoMode: TextInput.Password
            Layout.fillWidth: true
            enabled: !typeCombo.currentText.includes("SQLite")
        }
        
        TextField {
            id: databaseField
            placeholderText: "Database Name"
            Layout.fillWidth: true
            enabled: !typeCombo.currentText.includes("SQLite")
        }
        
        TextField {
            id: filePathField
            placeholderText: "SQLite File Path"
            Layout.fillWidth: true
            enabled: typeCombo.currentText.includes("SQLite")
        }
        
        Item {
            Layout.fillHeight: true
        }
    }
    
    standardButtons: Dialog.Ok | Dialog.Cancel
    
    onAccepted: {
        connectionAdded(
            nameField.text,
            typeCombo.selectedType,
            hostField.text,
            usernameField.text,
            parseInt(portField.text) || 0,
            passwordField.text,
            databaseField.text,
            filePathField.text
        )
    }
    
    onOpened: {
        nameField.forceActiveFocus()
    }
}