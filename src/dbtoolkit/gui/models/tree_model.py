"""Simple tree model for QML ListView."""

from PySide6.QtCore import QAbstractListModel, Qt, QModelIndex, Signal
from PySide6.QtQml import QmlElement
from typing import List, Dict, Any, Optional
from ...utils.constants import QML_IMPORT_NAME, QML_IMPORT_MAJOR_VERSION


class TreeItem:
    """Tree item for hierarchical data."""
    
    def __init__(self, data: Dict[str, Any], parent: Optional['TreeItem'] = None):
        """Initialize tree item."""
        self.data = data
        self.parent = parent
        self.children: List['TreeItem'] = []
        self.expanded = False
    
    def add_child(self, child: 'TreeItem') -> None:
        """Add child item."""
        child.parent = self
        self.children.append(child)
    
    def get_level(self) -> int:
        """Get nesting level."""
        level = 0
        parent = self.parent
        while parent:
            level += 1
            parent = parent.parent
        return level


@QmlElement
class TreeModel(QAbstractListModel):
    """Tree model for QML ListView."""
    
    NameRole = Qt.UserRole + 1
    TypeRole = Qt.UserRole + 2
    LevelRole = Qt.UserRole + 3
    ExpandedRole = Qt.UserRole + 4
    HasChildrenRole = Qt.UserRole + 5
    DataTypeRole = Qt.UserRole + 6
    
    def __init__(self):
        """Initialize tree model."""
        super().__init__()
        self.root_item = TreeItem({"name": "Root", "type": "root"})
        self.flat_items: List[TreeItem] = []
    
    def roleNames(self) -> Dict[int, bytes]:
        """Return role names for QML."""
        return {
            self.NameRole: b"name",
            self.TypeRole: b"type",
            self.LevelRole: b"level",
            self.ExpandedRole: b"expanded",
            self.HasChildrenRole: b"hasChildren",
            self.DataTypeRole: b"dataType"
        }
    
    def rowCount(self, parent: QModelIndex = QModelIndex()) -> int:
        """Return number of visible items."""
        return len(self.flat_items)
    
    def data(self, index: QModelIndex, role: int = Qt.DisplayRole) -> Any:
        """Return data for index and role."""
        if not index.isValid() or index.row() >= len(self.flat_items):
            return None
        
        item = self.flat_items[index.row()]
        
        if role == self.NameRole:
            return item.data.get("name", "")
        elif role == self.TypeRole:
            return item.data.get("type", "")
        elif role == self.LevelRole:
            return item.get_level()
        elif role == self.ExpandedRole:
            return item.expanded
        elif role == self.HasChildrenRole:
            return len(item.children) > 0
        elif role == self.DataTypeRole:
            return item.data.get("data_type", "")
        
        return None
    
    def toggle_expanded(self, row: int) -> None:
        """Toggle expanded state of item."""
        if 0 <= row < len(self.flat_items):
            item = self.flat_items[row]
            if item.children:
                item.expanded = not item.expanded
                self._rebuild_flat_list()
    
    def load_schema_data(self, schema_data: List[Dict[str, Any]]) -> None:
        """Load schema data into tree."""
        self.beginResetModel()
        
        self.root_item = TreeItem({"name": "Database", "type": "root"})
        
        # Group by schema
        schemas = {}
        for item in schema_data:
            schema_name = item.get('schema', 'public')
            if schema_name not in schemas:
                schemas[schema_name] = {}
            
            table_name = item.get('table')
            if table_name:
                if table_name not in schemas[schema_name]:
                    schemas[schema_name][table_name] = []
                schemas[schema_name][table_name].append(item)
        
        # Build tree
        for schema_name, tables in schemas.items():
            schema_item = TreeItem({
                "name": schema_name,
                "type": "schema"
            })
            self.root_item.add_child(schema_item)
            
            for table_name, columns in tables.items():
                table_item = TreeItem({
                    "name": table_name,
                    "type": "table"
                })
                schema_item.add_child(table_item)
                
                for column in columns:
                    if column.get('column_name'):
                        column_item = TreeItem({
                            "name": column['column_name'],
                            "type": "column",
                            "data_type": column.get('data_type', '')
                        })
                        table_item.add_child(column_item)
        
        self._rebuild_flat_list()
        self.endResetModel()
    
    def _rebuild_flat_list(self) -> None:
        """Rebuild flat list of visible items."""
        self.flat_items = []
        self._add_visible_items(self.root_item)
    
    def _add_visible_items(self, item: TreeItem) -> None:
        """Add visible items to flat list."""
        for child in item.children:
            self.flat_items.append(child)
            if child.expanded:
                self._add_visible_items(child)