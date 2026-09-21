import os
import joblib
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import IsolationForest

def train_text_model():
    X_train = [
        "urgent action required your account is suspended",
        "please verify your login credentials immediately",
        "invoice attached please pay the outstanding amount",
        "wire transfer request from the ceo",
        "update your billing information to avoid service interruption",
        "security alert: unauthorized login attempt",
        "claim your prize now click here",
        "hello team, let's meet at 4pm",
        "can we reschedule our sync to tomorrow?",
        "here is the project report for Q3",
        "sounds good, thanks!",
        "what time is the lunch?",
        "please review the attached meeting notes",
        "see you at the conference next week"
    ]
    y_train = [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0]
    
    vectorizer = TfidfVectorizer(lowercase=True, stop_words="english", max_features=100)
    clf = LogisticRegression(class_weight="balanced", random_state=42)
    
    X_vec = vectorizer.fit_transform(X_train)
    clf.fit(X_vec, y_train)
    
    model_data = {
        "vectorizer": vectorizer,
        "classifier": clf,
        "feature_names": vectorizer.get_feature_names_out(),
        "coefs": clf.coef_[0]
    }
    
    out_path = Path("backend/models/artifacts/phishing_text_model.pkl")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model_data, out_path)
    print(f"Saved phishing text model to {out_path}")

def train_url_model():
    # URL features:
    # punycode, excessive_subdomains, suspicious_port, long_url, special_char_ratio_high, url_userinfo_at, url_encoding_obfuscation, no_https, suspicious_tld, ip_host, credential_path, redirect_param
    X_train = [
        [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],  # Malicious
        [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0],  # Malicious
        [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],  # Malicious
        [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1],  # Malicious
        [1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0],  # Malicious
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],  # Clean
        [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],  # Clean
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],  # Clean
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],  # Clean
    ]
    y_train = [1, 1, 1, 1, 1, 0, 0, 0, 0]
    
    clf = LogisticRegression(class_weight="balanced", random_state=42)
    clf.fit(X_train, y_train)
    
    model_data = {
        "classifier": clf,
        "coefs": clf.coef_[0]
    }
    
    out_path = Path("backend/models/artifacts/phishing_url_model.pkl")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model_data, out_path)
    print(f"Saved phishing URL model to {out_path}")

def train_auth_model():
    # Isolation forest for authentication anomalies
    # features: failures_in_10m, distinct_ips_in_1h, distinct_devices_in_1h, logins_per_minute
    X_train = [
        [0, 1, 1, 0.05], # normal
        [1, 1, 1, 0.1],  # normal
        [0, 1, 2, 0.02], # normal
        [2, 1, 1, 0.05], # normal
        [0, 2, 1, 0.08], # normal
        [8, 1, 1, 0.0],  # anomaly (high failures)
        [0, 5, 4, 1.2],  # anomaly (many IPs/devices, high rate)
        [5, 3, 2, 0.8],  # anomaly (brute force pattern)
    ]
    
    clf = IsolationForest(n_estimators=50, contamination=0.2, random_state=42)
    clf.fit(X_train)
    
    model_data = {
        "classifier": clf
    }
    
    out_path = Path("backend/models/artifacts/auth_anomaly_model.pkl")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model_data, out_path)
    print(f"Saved authentication anomaly model to {out_path}")

if __name__ == "__main__":
    train_text_model()
    train_url_model()
    train_auth_model()
