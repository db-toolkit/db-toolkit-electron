"""Unit tests for connection storage."""

import asyncio
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from core.models import DatabaseType
from core.storage import ConnectionStorage


class TestConnectionStorage(unittest.TestCase):
    """Test ConnectionStorage class."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = TemporaryDirectory()
        self.storage_path = Path(self.temp_dir.name) / "test_connections.json"
        self.storage = ConnectionStorage(self.storage_path)

    def tearDown(self):
        """Clean up test fixtures."""
        self.temp_dir.cleanup()

    def test_add_connection(self):
        """Test adding a connection."""
        conn = asyncio.run(
            self.storage.add_connection(
                name="Test DB", db_type=DatabaseType.SQLITE, database=":memory:"
            )
        )

        self.assertIsNotNone(conn.id)
        self.assertEqual(conn.name, "Test DB")
        self.assertEqual(conn.db_type, DatabaseType.SQLITE)

    def test_get_connection(self):
        """Test retrieving a connection."""
        conn = asyncio.run(
            self.storage.add_connection(
                name="Test DB", db_type=DatabaseType.SQLITE, database=":memory:"
            )
        )

        retrieved = asyncio.run(self.storage.get_connection(conn.id))
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.id, conn.id)

    def test_get_all_connections(self):
        """Test retrieving all connections."""
        asyncio.run(
            self.storage.add_connection(
                name="DB1", db_type=DatabaseType.SQLITE, database=":memory:"
            )
        )
        asyncio.run(
            self.storage.add_connection(
                name="DB2", db_type=DatabaseType.SQLITE, database=":memory:"
            )
        )

        connections = asyncio.run(self.storage.get_all_connections())
        self.assertEqual(len(connections), 2)

    def test_remove_connection(self):
        """Test removing a connection."""
        conn = asyncio.run(
            self.storage.add_connection(
                name="Test DB", db_type=DatabaseType.SQLITE, database=":memory:"
            )
        )

        result = asyncio.run(self.storage.remove_connection(conn.id))
        self.assertTrue(result)

        retrieved = asyncio.run(self.storage.get_connection(conn.id))
        self.assertIsNone(retrieved)


if __name__ == "__main__":
    unittest.main()
