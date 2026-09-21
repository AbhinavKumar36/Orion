# ORION AI Model Cards

This document outlines the primary machine learning and heuristic models deployed within the ORION architecture (CYBERGUARD PS09). These model cards provide transparency on intended use, performance metrics, and inherent limitations.

---

## 1. Phishing & Malicious URL Classifier (Module A)

### Model Details
- **Architecture**: Scikit-Learn Logistic Regression & TF-IDF Text Vectorization.
- **Version**: 1.2
- **Input**: Raw text extracted from emails, SMS, and scraped webpage DOMs.
- **Output**: Probability score ($p \in [0, 1]$) representing the likelihood of malicious intent.

### Intended Use
- **Primary Use Case**: Identifying credential harvesting links, malware delivery URLs, and highly persuasive social engineering text.
- **Out-of-Scope**: General spam classification or intent classification outside of cybersecurity threats.

### Metrics & Evaluation
- **Dataset**: Evaluated on a combined dataset of PhishTank URLs and Nazario Phishing Corpora.
- **F1 Score**: 1.00 (Measured on a sanitized subset of 100 benchmark examples).
- **Latency**: < 10ms per inference (offline).

### Limitations
- The model relies heavily on lexical features (e.g., presence of words like "urgent", "login") and URL characteristics (e.g., length, subdomains). It may struggle against highly targeted spear-phishing that lacks typical trigger words.

---

## 2. Authentication Anomaly Detector (Module C)

### Model Details
- **Architecture**: Scikit-Learn Isolation Forest (Unsupervised Anomaly Detection).
- **Version**: 1.0
- **Input**: A stream of authentication events (timestamp, IP, username, success/failure).
- **Output**: Anomaly score scaled to a probability $p$.

### Intended Use
- **Primary Use Case**: Detecting behavioral deviations from baseline authentication patterns (e.g., password spraying, brute force, impossible travel).
- **Out-of-Scope**: Detecting malware executing locally after successful authentication.

### Metrics & Evaluation
- **Dataset**: Evaluated on synthetic enterprise VPN logs.
- **Accuracy**: High precision on clustered failures.
- **Latency**: ~15ms per batch.

### Limitations
- The model requires a stable baseline. Environments with highly dynamic IPs (e.g., mobile users without VPNs) may trigger false positives for "impossible travel" scenarios unless allowlisted.

---

## 3. Media Authenticity & Impersonation Engine (Module B1 & B2)

### Model Details
- **Architecture**: OpenCV-based Heuristic Engine & Error Level Analysis (ELA) Mock.
- **Version**: 0.9 (Tier 0 Validation)
- **Input**: Image binaries (`multipart/form-data`) and text claims.
- **Output**: Multi-class boolean flags mapping to Evidence items (e.g., `exif_metadata_scrubbed`, `ela_discrepancy_detected`).

### Intended Use
- **Primary Use Case**: Detecting deepfakes, synthetic media manipulation, and VIP impersonation.
- **Out-of-Scope**: Audio voice cloning detection (slated for Phase 7).

### Metrics & Evaluation
- **Dataset**: Curated deepfake images.
- **Accuracy**: Dependent heavily on EXIF stripping and statistical noise variance.
- **Latency**: 50-100ms.

### Limitations
- Currently operating in Tier-0 validation mode. Deep pixel-level generative adversarial network (GAN) traces might evade the heuristic ELA bounds if heavily compressed (e.g., sent via WhatsApp).

---

*Compiled in adherence with XAI transparency guidelines for the ORION platform.*
