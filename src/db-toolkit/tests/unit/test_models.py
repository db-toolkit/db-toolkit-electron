"""Unit tests for data models."""

import unittest

from core.models import DatabaseConnection, DatabaseType


class TestDatabaseConnection(unittest.TestCase):
    """Test DatabaseConnection model."""

    def test_create_sqlite_connection(self):
        """Test creating SQLite connection."""
        conn = DatabaseConnection(
            id="test-1",
            name="Test SQLite",
            db_type=DatabaseType.SQLITE,
            database="/path/to/db.sqlite",
        )

        self.assertEqual(conn.id, "test-1")
        self.assertEqual(conn.name, "Test SQLite")
        self.assertEqual(conn.db_type, DatabaseType.SQLITE)
        self.assertEqual(conn.database, "/path/to/db.sqlite")

    def test_create_postgres_connection(self):
        """Test creating PostgreSQL connection."""
        conn = DatabaseConnection(
            id="test-2",
            name="Test Postgres",
            db_type=DatabaseType.POSTGRESQL,
            host="localhost",
            port=5432,
            database="testdb",
            username="user",
            password="pass",
        )

        self.assertEqual(conn.db_type, DatabaseType.POSTGRESQL)
        self.assertEqual(conn.host, "localhost")
        self.assertEqual(conn.port, 5432)
        self.assertEqual(conn.username, "user")

    def test_create_mongodb_connection(self):
        """Test creating MongoDB connection."""
        conn = DatabaseConnection(
            id="test-3",
            name="Test MongoDB",
            db_type=DatabaseType.MONGODB,
            host="localhost",
            port=27017,
            database="testdb",
        )

        self.assertEqual(conn.db_type, DatabaseType.MONGODB)
        self.assertEqual(conn.port, 27017)


if __name__ == "__main__":
    unittest.main()
