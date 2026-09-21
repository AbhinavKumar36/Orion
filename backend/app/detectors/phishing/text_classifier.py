import numpy as np
import joblib
from pathlib import Path
from typing import List, Dict

class PhishingTextClassifier:
    """
    Loads a pre-trained TF-IDF + LogisticRegression pipeline from artifacts.
    Provides genuine offline ML inference.
    """
    def __init__(self):
        model_path = Path("backend/models/artifacts/phishing_text_model.pkl")
        if not model_path.exists():
            raise FileNotFoundError(f"Missing model artifact: {model_path}")
            
        model_data = joblib.load(model_path)
        self.vectorizer = model_data["vectorizer"]
        self.clf = model_data["classifier"]
        self.feature_names = model_data["feature_names"]
        self.coefs = model_data["coefs"]

    def predict_proba(self, text: str) -> float:
        if not text:
            return 0.0
        X_vec = self.vectorizer.transform([text])
        proba = self.clf.predict_proba(X_vec)[0][1]
        return float(proba)

    def get_ml_insight(self, text: str) -> List[Dict[str, float]]:
        if not text:
            return []
            
        X_vec = self.vectorizer.transform([text]).toarray()[0]
        contributions = X_vec * self.coefs
        
        top_indices = np.argsort(contributions)[-5:][::-1]
        
        insights = []
        for idx in top_indices:
            if contributions[idx] > 0:
                insights.append({
                    "feature": self.feature_names[idx],
                    "weight": float(contributions[idx])
                })
        return insights

text_classifier = PhishingTextClassifier()
