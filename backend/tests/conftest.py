import os
import tempfile
import pytest
from pathlib import Path

# Override the database path for tests before importing anything else
test_db_fd, test_db_path = tempfile.mkstemp(suffix=".db")
os.environ["ORION_DB_PATH"] = test_db_path

from backend.app.core.database import init_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """
    Session-level fixture that ensures the database is initialized
    before any tests run, fixing the 'no such table' errors.
    """
    # Initialize the test schema
    init_db(schema_path="backend/app/models/schema.sql")
    
    yield
    
    # Cleanup after tests are done
    try:
        os.close(test_db_fd)
        os.remove(test_db_path)
    except OSError:
        pass
