"""Unit tests for connection manager."""

import asyncio
import unittest

from core.models import DatabaseConnection, DatabaseType
from operations.connection_manager import ConnectionManager


class TestConnectionManager(unittest.TestCase):
    """Test ConnectionManager class."""

    def setUp(self):
        """Set up test fixtures."""
        self.manager = ConnectionManager()
        self.test_connection = DatabaseConnection(
            id="test-123",
            name="Test SQLite",
            db_type=DatabaseType.SQLITE,
            database=":memory:",
        )

    def test_get_all_active_connections_empty(self):
        """Test getting active connections when none exist."""
        connections = asyncio.run(self.manager.get_all_active_connections())
        self.assertEqual(len(connections), 0)

    def test_get_connection_count(self):
        """Test getting connection count."""
        count = asyncio.run(self.manager.get_connection_count())
        self.assertEqual(count, 0)

    def test_is_connected_false(self):
        """Test is_connected returns False for non-existent connection."""
        result = asyncio.run(self.manager.is_connected("non-existent"))
        self.assertFalse(result)

    def test_get_connector_none(self):
        """Test get_connector returns None for non-existent connection."""
        connector = asyncio.run(self.manager.get_connector("non-existent"))
        self.assertIsNone(connector)

    def test_get_connection_metadata_none(self):
        """Test get_connection returns None for non-existent connection."""
        conn = asyncio.run(self.manager.get_connection("non-existent"))
        self.assertIsNone(conn)


if __name__ == "__main__":
    unittest.main()
