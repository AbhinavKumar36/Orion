import os
import sys
from pathlib import Path

# Add project root to python path
sys.path.append(str(Path(__file__).parent.parent))

from backend.app.core.database import get_db_path, init_db

def reset_demo():
    print("Resetting demo database...")
    db_path = get_db_path()
    
    if db_path.exists():
        try:
            os.remove(db_path)
            print(f"Deleted existing database at {db_path}")
        except Exception as e:
            print(f"Failed to delete database: {e}")
            sys.exit(1)
            
    try:
        init_db()
        print("Database re-initialized successfully.")
    except Exception as e:
        print(f"Failed to initialize database: {e}")
        sys.exit(1)
        
    print("Demo reset complete.")

if __name__ == "__main__":
    reset_demo()
