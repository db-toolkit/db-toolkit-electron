"""Integration tests for API endpoints."""

import unittest

from fastapi.testclient import TestClient

from main import app


class TestAPIEndpoints(unittest.TestCase):
    """Test API endpoints."""

    def setUp(self):
        """Set up test client."""
        self.client = TestClient(app)

    def test_health_check(self):
        """Test health check endpoint."""
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")

    def test_get_connections_empty(self):
        """Test getting connections when none exist."""
        response = self.client.get("/api/v1/connections")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_get_session_state(self):
        """Test getting session state."""
        response = self.client.get("/api/v1/session/state")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("active_connections", data)
        self.assertIn("total_connections", data)


if __name__ == "__main__":
    unittest.main()
