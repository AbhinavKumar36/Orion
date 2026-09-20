# Datasets

ORION's detection logic is validated on a mix of public, synthetic, and seeded datasets. No live network retrieval or unauthorized scanning occurs.

## Source Splits
- **Phishing URLs:** Validated against subsets of PhishTank (malicious) and Tranco (benign). The dataset is strictly source-split to ensure no domain family leakage between dev and test sets.
- **Message Text:** Tested on combinations of the UCI SMS Spam Collection, Nazario phishing corpus, and Enron corpus (benign email).
- **Authentication & System Activity:** Tested exclusively on synthetic generators that utilize fixed seeds to prove deterministic reproducibility rather than real-world accuracy.
- **Media (Images):** Tested on a highly constrained, authorized subset of manually manipulated images to prove the functionality of Tier 0 ELA detection.

## Privacy & Safety
- All personal data is scrubbed or hashed. 
- All external data handling strictly complies with the requirement for offline demo capabilities.
