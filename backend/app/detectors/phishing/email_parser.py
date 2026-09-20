import re
from typing import Dict, Set

def extract_email_features(
    sender: str,
    reply_to: str,
    headers: Dict[str, str],
    is_first_time: bool = False
) -> Set[str]:
    """
    Extract offline email-based indicators from headers.
    """
    features = set()

    # 1. Reply-To Mismatch
    # Often phishers will spoof the sender but route replies to an email they control.
    def extract_email(addr: str) -> str:
        # Simplistic extraction of email from "Name <email@domain.com>"
        match = re.search(r'<([^>]+)>', addr)
        return match.group(1).lower().strip() if match else addr.lower().strip()

    sender_email = extract_email(sender)
    
    if reply_to:
        reply_email = extract_email(reply_to)
        if reply_email and sender_email and reply_email != sender_email:
            features.add("reply_to_mismatch")

    # 2. First Time Sender
    if is_first_time:
        features.add("first_time_sender")

    # 3. Authentication Results (SPF, DKIM, DMARC)
    # E.g., Authentication-Results: mx.google.com; spf=fail (google.com: domain of ...); dkim=neutral ...
    auth_results = headers.get("Authentication-Results", "").lower()
    if auth_results:
        # Check SPF
        if "spf=fail" in auth_results or "spf=softfail" in auth_results or "spf=none" in auth_results:
            features.add("spf_fail")
        
        # Check DKIM
        if "dkim=fail" in auth_results or "dkim=none" in auth_results:
            features.add("dkim_fail")
            
        # Check DMARC
        if "dmarc=fail" in auth_results or "dmarc=none" in auth_results:
            features.add("dmarc_fail")
            
    return features
