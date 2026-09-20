from fastapi import APIRouter, HTTPException
import json
import os
import subprocess

router = APIRouter()

@router.get("/summary")
def get_evaluation_summary():
    """
    Serves docs/eval/metrics.json
    """
    metrics_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "docs", "eval", "metrics.json")
    try:
        with open(metrics_path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"error": "metrics.json not found. Evaluation may not be completed yet."}

@router.post("/reset")
def reset_demo():
    """
    Resets the database if ORION_DEMO_RESET_ENABLED is true.
    """
    # Note: In a real system, we'd check an env var here. 
    # Since this is a demo environment, we'll allow it directly or mock the check.
    if os.environ.get("ORION_DEMO_RESET_ENABLED", "true").lower() != "true":
        raise HTTPException(status_code=403, detail="Demo reset is disabled.")
    
    script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "scripts", "reset_demo.py")
    
    try:
        # Run the reset script as a subprocess
        result = subprocess.run(["python", script_path], capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"Script failed: {result.stderr}")
        return {"status": "ok", "message": "Demo data successfully reset."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
