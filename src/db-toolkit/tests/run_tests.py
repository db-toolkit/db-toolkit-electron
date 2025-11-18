"""Test runner script."""

import sys
import unittest
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def run_unit_tests():
    """Run unit tests."""
    loader = unittest.TestLoader()
    suite = loader.discover("tests/unit", pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()


def run_integration_tests():
    """Run integration tests."""
    loader = unittest.TestLoader()
    suite = loader.discover("tests/integration", pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()


def run_all_tests():
    """Run all tests."""
    print("=" * 70)
    print("Running Unit Tests")
    print("=" * 70)
    unit_success = run_unit_tests()

    print("\n" + "=" * 70)
    print("Running Integration Tests")
    print("=" * 70)
    integration_success = run_integration_tests()

    print("\n" + "=" * 70)
    if unit_success and integration_success:
        print("All tests passed!")
        return 0
    else:
        print("Some tests failed!")
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
