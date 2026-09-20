import numpy as np
from sklearn.linear_model import LogisticRegression
from typing import Set, List, Dict

URL_FEATURES_LIST = [
    "punycode", "excessive_subdomains", "suspicious_port", "long_url", 
    "special_char_ratio_high", "url_userinfo_at", "url_encoding_obfuscation", 
    "no_https", "suspicious_tld", "ip_host", "credential_path", "redirect_param"
]

class PhishingURLClassifier:
    """
    A lightweight, deterministic URL classifier.
    Fits LogisticRegression on boolean URL features.
    """
    def __init__(self):
        # Synthetic dataset (Rows = samples, Cols = features in URL_FEATURES_LIST)
        # Sample 1: punycode + no_https
        # Sample 2: ip_host + suspicious_port
        # Sample 3: long_url + excessive_subdomains
        # Sample 4: clean
        # Sample 5: clean but long
        X_train = [
            [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],  # Malicious
            [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0],  # Malicious
            [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],  # Malicious
            [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1],  # Malicious
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],  # Clean
            [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],  # Clean
            [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],  # Clean
        ]
        y_train = [1, 1, 1, 1, 0, 0, 0]
        
        self.clf = LogisticRegression(class_weight="balanced", random_state=42)
        self.clf.fit(X_train, y_train)
        self.coefs = self.clf.coef_[0]

    def _vectorize(self, features: Set[str]) -> np.ndarray:
        vec = np.zeros(len(URL_FEATURES_LIST))
        for i, feat in enumerate(URL_FEATURES_LIST):
            if feat in features:
                vec[i] = 1.0
        return vec

    def predict_proba(self, features: Set[str]) -> float:
        if not features:
            # Empty features -> 0 probabilty
            return 0.0
        X_vec = self._vectorize(features).reshape(1, -1)
        proba = self.clf.predict_proba(X_vec)[0][1]
        return float(proba)

    def get_ml_insight(self, features: Set[str]) -> List[Dict[str, float]]:
        """
        Extract top features driving the score (coefficient * 1).
        """
        if not features:
            return []
            
        X_vec = self._vectorize(features)
        contributions = X_vec * self.coefs
        
        # Get top 5 positive contributions
        top_indices = np.argsort(contributions)[-5:][::-1]
        
        insights = []
        for idx in top_indices:
            if contributions[idx] > 0:
                insights.append({
                    "feature": URL_FEATURES_LIST[idx],
                    "weight": float(contributions[idx])
                })
        return insights

# Singleton instance
url_classifier = PhishingURLClassifier()
