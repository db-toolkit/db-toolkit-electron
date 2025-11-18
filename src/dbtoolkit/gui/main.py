"""Main entry point for the DB Toolkit GUI application."""

import sys
from pathlib import Path
from PySide6.QtGui import QGuiApplication
from PySide6.QtQml import qmlRegisterType
from PySide6.QtQuickControls2 import QQuickStyle
from PySide6.QtCore import QUrl
from PySide6.QtQml import QQmlApplicationEngine
from .controllers.connection_controller import ConnectionController
from .controllers.schema_controller import SchemaController
from .controllers.query_controller import QueryController
from .controllers.data_controller import DataController
from .controllers.csv_controller import CSVController
from .controllers.session_controller import SessionController
from .models.tree_model import TreeModel
from ..utils.constants import QML_IMPORT_NAME, QML_IMPORT_MAJOR_VERSION


def main():
    """Initialize and run the DB Toolkit application."""
    app = QGuiApplication(sys.argv)
    
    # Set application properties
    app.setApplicationName("DB Toolkit")
    app.setApplicationVersion("0.1.0")
    app.setOrganizationName("DB Toolkit")
    
    # Set Material style for modern UI
    QQuickStyle.setStyle("Material")
    
    # Register QML types
    qmlRegisterType(ConnectionController, QML_IMPORT_NAME, QML_IMPORT_MAJOR_VERSION, 0, "ConnectionController")
    qmlRegisterType(SchemaController, QML_IMPORT_NAME, QML_IMPORT_MAJOR_VERSION, 0, "SchemaController")
    qmlRegisterType(QueryController, QML_IMPORT_NAME, QML_IMPORT_MAJOR_VERSION, 0, "QueryController")
    qmlRegisterType(DataController, QML_IMPORT_NAME, QML_IMPORT_MAJOR_VERSION, 0, "DataController")
    qmlRegisterType(CSVController, QML_IMPORT_NAME, QML_IMPORT_MAJOR_VERSION, 0, "CSVController")
    qmlRegisterType(SessionController, QML_IMPORT_NAME, QML_IMPORT_MAJOR_VERSION, 0, "SessionController")
    qmlRegisterType(TreeModel, QML_IMPORT_NAME, QML_IMPORT_MAJOR_VERSION, 0, "TreeModel")
    
    # Create QML engine
    engine = QQmlApplicationEngine()
    
    # Get the directory containing this file
    current_dir = Path(__file__).parent
    qml_file = current_dir / "views" / "main.qml"
    
    # Load main QML file
    engine.load(QUrl.fromLocalFile(str(qml_file)))
    
    if not engine.rootObjects():
        return -1
    
    return app.exec()


if __name__ == "__main__":
    sys.exit(main())