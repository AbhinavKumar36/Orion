import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from typing import Tuple, List, Dict

class PhishingTextClassifier:
    """
    A lightweight, deterministic text classifier.
    Fits a simple TF-IDF + LogisticRegression on a synthetic dataset at initialization.
    """
    def __init__(self):
        # Synthetic dataset for urgency, credential, payment, and impersonation
        X_train = [
            "urgent action required your account is suspended",
            "please verify your login credentials immediately",
            "invoice attached please pay the outstanding amount",
            "wire transfer request from the ceo",
            "hello team, let's meet at 4pm",
            "can we reschedule our sync to tomorrow?",
            "here is the project report for Q3",
            "sounds good, thanks!",
            "what time is the lunch?"
        ]
        y_train = [1, 1, 1, 1, 0, 0, 0, 0, 0]
        
        self.vectorizer = TfidfVectorizer(lowercase=True, stop_words="english", max_features=100)
        self.clf = LogisticRegression(class_weight="balanced", random_state=42)
        
        X_vec = self.vectorizer.fit_transform(X_train)
        self.clf.fit(X_vec, y_train)
        
        self.feature_names = self.vectorizer.get_feature_names_out()
        self.coefs = self.clf.coef_[0]

    def predict_proba(self, text: str) -> float:
        if not text:
            return 0.0
        X_vec = self.vectorizer.transform([text])
        proba = self.clf.predict_proba(X_vec)[0][1] # Probability of class 1
        return float(proba)

    def get_ml_insight(self, text: str) -> List[Dict[str, float]]:
        """
        Extract top features driving the score (coefficient * tfidf_value).
        """
        if not text:
            return []
            
        X_vec = self.vectorizer.transform([text]).toarray()[0]
        contributions = X_vec * self.coefs
        
        # Get top 5 positive contributions
        top_indices = np.argsort(contributions)[-5:][::-1]
        
        insights = []
        for idx in top_indices:
            if contributions[idx] > 0:
                insights.append({
                    "feature": self.feature_names[idx],
                    "weight": float(contributions[idx])
                })
        return insights

# Singleton instance for deterministic usage
text_classifier = PhishingTextClassifier()
