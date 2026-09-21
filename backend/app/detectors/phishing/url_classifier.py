import numpy as np
import joblib
from pathlib import Path
from typing import Set, List, Dict

URL_FEATURES_LIST = [
    "punycode", "excessive_subdomains", "suspicious_port", "long_url", 
    "special_char_ratio_high", "url_userinfo_at", "url_encoding_obfuscation", 
    "no_https", "suspicious_tld", "ip_host", "credential_path", "redirect_param"
]

class PhishingURLClassifier:
    """
    Loads a pre-trained LogisticRegression pipeline from artifacts.
    Provides genuine offline ML inference on extracted URL features.
    """
    def __init__(self):
        model_path = Path("backend/models/artifacts/phishing_url_model.pkl")
        if not model_path.exists():
            raise FileNotFoundError(f"Missing model artifact: {model_path}")
            
        model_data = joblib.load(model_path)
        self.clf = model_data["classifier"]
        self.coefs = model_data["coefs"]

    def _vectorize(self, features: Set[str]) -> np.ndarray:
        vec = np.zeros(len(URL_FEATURES_LIST))
        for i, feat in enumerate(URL_FEATURES_LIST):
            if feat in features:
                vec[i] = 1.0
        return vec

    def predict_proba(self, features: Set[str]) -> float:
        if not features:
            return 0.0
        X_vec = self._vectorize(features).reshape(1, -1)
        proba = self.clf.predict_proba(X_vec)[0][1]
        return float(proba)

    def get_ml_insight(self, features: Set[str]) -> List[Dict[str, float]]:
        if not features:
            return []
            
        X_vec = self._vectorize(features)
        contributions = X_vec * self.coefs
        
        top_indices = np.argsort(contributions)[-5:][::-1]
        
        insights = []
        for idx in top_indices:
            if contributions[idx] > 0:
                insights.append({
                    "feature": URL_FEATURES_LIST[idx],
                    "weight": float(contributions[idx])
                })
        return insights

url_classifier = PhishingURLClassifier()
