from typing import Dict, Any, List, Tuple, Set
from backend.app.detectors.phishing.url_parser import extract_url_features
from backend.app.detectors.phishing.email_parser import extract_email_features
from backend.app.detectors.phishing.html_parser import extract_html_features
from backend.app.detectors.phishing.text_classifier import text_classifier
from backend.app.detectors.phishing.url_classifier import url_classifier

def analyze_phishing(payload: Dict[str, Any]) -> Tuple[List[str], float, List[Dict[str, Any]]]:
    """
    Module A: Phishing Engine
    Executes offline deterministic parsers and ML classifiers.
    """
    evidence: Set[str] = set()
    url = payload.get("url", "")
    message = payload.get("message", {})
    html_snippet = payload.get("html_snippet", "")
    
    # 1. URL Analysis
    p_url = None
    url_insights = []
    if url:
        url_features = extract_url_features(url)
        evidence.update(url_features)
        
        # URL Classifier
        p_url = url_classifier.predict_proba(url_features)
        url_insights = url_classifier.get_ml_insight(url_features)
        
    # 2. Email Analysis
    if message and message.get("channel") == "email":
        email_features = extract_email_features(
            sender=message.get("sender", ""),
            reply_to=message.get("reply_to", ""),
            headers=message.get("headers", {})
        )
        evidence.update(email_features)
        
    # 3. HTML Snippet Analysis
    if html_snippet:
        html_features = extract_html_features(html_snippet, base_url=url)
        evidence.update(html_features)
        
    # 4. Text Analysis
    p_text = None
    text_insights = []
    body = message.get("body", "") if message else ""
    if body:
        p_text = text_classifier.predict_proba(body)
        text_insights = text_classifier.get_ml_insight(body)
        
        # Add basic regex evidence for text if requested by model?
        # The master spec relies on P for text and maps to risk config. 
        # But we can also add specific keyword rules here if we want them as explicit evidence.
        
    # 5. Combine Probabilities
    # Dual mode: mean of URL and text model probabilities when both apply
    p_model = None
    if p_url is not None and p_text is not None:
        p_model = (p_url + p_text) / 2.0
    elif p_url is not None:
        p_model = p_url
    elif p_text is not None:
        p_model = p_text

    # Default to 0.0 if nothing (helps Orchestrator resolve formula)
    if p_model is None:
        p_model = 0.0

    return list(evidence), p_model, url_insights + text_insights
