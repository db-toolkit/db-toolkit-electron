"""Unit tests for cache utility."""

import time
import unittest

from utils.cache import Cache


class TestCache(unittest.TestCase):
    """Test Cache class."""

    def setUp(self):
        """Set up test fixtures."""
        self.cache = Cache(default_ttl=1)

    def tearDown(self):
        """Clean up test fixtures."""
        self.cache.clear()

    def test_set_and_get(self):
        """Test setting and getting cache values."""
        self.cache.set("key1", "value1")
        self.assertEqual(self.cache.get("key1"), "value1")

    def test_get_nonexistent(self):
        """Test getting non-existent key returns None."""
        self.assertIsNone(self.cache.get("nonexistent"))

    def test_ttl_expiration(self):
        """Test cache expiration with TTL."""
        self.cache.set("key1", "value1", ttl=1)
        self.assertEqual(self.cache.get("key1"), "value1")

        time.sleep(1.1)
        self.assertIsNone(self.cache.get("key1"))

    def test_delete(self):
        """Test deleting cache entry."""
        self.cache.set("key1", "value1")
        result = self.cache.delete("key1")
        self.assertTrue(result)
        self.assertIsNone(self.cache.get("key1"))

    def test_clear(self):
        """Test clearing all cache entries."""
        self.cache.set("key1", "value1")
        self.cache.set("key2", "value2")
        self.cache.clear()
        self.assertEqual(len(self.cache.get_keys()), 0)

    def test_get_keys(self):
        """Test getting all cache keys."""
        self.cache.set("key1", "value1")
        self.cache.set("key2", "value2")
        keys = self.cache.get_keys()
        self.assertEqual(len(keys), 2)
        self.assertIn("key1", keys)
        self.assertIn("key2", keys)


if __name__ == "__main__":
    unittest.main()
