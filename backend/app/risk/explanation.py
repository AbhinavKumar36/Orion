from typing import List, Dict, Any
from backend.app.models.domain import Evidence, Explanation, Factor

TEMPLATES: Dict[str, str] = {
    # Phishing
    "ip_host": "URL uses an IP address instead of a domain name.",
    "brand_lookalike": "Domain name visually resembles a known brand.",
    "credential_request_text": "Message text contains requests for credentials or passwords.",
    "payment_request_text": "Message text contains requests for payment or financial transactions.",
    "punycode": "Domain name uses Punycode characters to obfuscate its true origin.",
    "credential_path": "URL path contains keywords typically associated with credential harvesting (e.g., 'login', 'secure').",
    "impersonation_language": "Message uses language patterns indicative of impersonation.",
    "urgency_language": "Message attempts to create a false sense of urgency.",
    "suspicious_port": "URL specifies a non-standard or suspicious port.",
    "excessive_subdomains": "URL contains an unusually high number of subdomains.",
    "redirect_param": "URL contains parameters commonly used for malicious redirection.",
    "no_https": "URL does not use secure HTTPS encryption.",
    "suspicious_tld": "Domain uses a Top-Level Domain (TLD) frequently associated with malicious activity.",
    "suspicious_cta": "Message contains a highly suspicious Call-To-Action (CTA).",
    "special_char_ratio_high": "URL contains an unusually high ratio of special characters.",
    "long_url": "URL is unusually long, a technique often used to hide the true destination.",
    "link_text_mismatch": "The displayed link text does not match the actual destination URL.",
    "fake_login_form": "Page contains a suspected fake login form.",
    "form_action_cross_domain": "Login form submits data to a different, potentially untrusted domain.",
    "spf_fail": "Sender Policy Framework (SPF) validation failed.",
    "dkim_fail": "DomainKeys Identified Mail (DKIM) signature validation failed.",
    "dmarc_fail": "Domain-based Message Authentication, Reporting, and Conformance (DMARC) validation failed.",
    "reply_to_mismatch": "The 'Reply-To' address differs significantly from the 'From' address.",
    "first_time_sender": "This is the first time receiving communication from this sender.",
    "domain_age_young": "The sender's domain was registered very recently.",
    "cert_anomaly": "The SSL/TLS certificate exhibits anomalous characteristics.",
    "qr_source": "The source was identified via a QR code.",
    "homoglyph_domain": "The domain name uses homoglyph characters (visually similar characters from different scripts) to deceive.",
    "url_userinfo_at": "URL contains user info (e.g. user@) before the domain, which can obscure the real destination.",
    "url_encoding_obfuscation": "URL employs excessive encoding to obfuscate its contents.",
    
    # Authentication
    "impossible_travel": "Login attempts occurred from geographically distant locations in an impossibly short timeframe.",
    "success_after_failures": "A successful login occurred immediately following multiple failed attempts.",
    "password_spraying": "Pattern matches a password spraying attack (slow, distributed brute-force).",
    "failed_burst": "A rapid burst of failed login attempts was observed.",
    "new_location": "Login originated from a location previously unseen for this user.",
    "sudden_behavior_change": "A sudden and significant deviation from established user behavior baselines.",
    "new_device": "Login originated from a device previously unseen for this user.",
    "session_anomaly": "Anomalous characteristics were detected within the active session.",
    "login_velocity": "Unusually high frequency of logins for this account.",
    "ip_novelty": "Login originated from an IP address not previously associated with this user or organization.",
    "unusual_time": "Login occurred at an unusual time of day based on historical patterns.",
    "unrecognized_user_agent": "Login used a User-Agent string not previously seen for this user.",

    # Media
    "lookalike_sender_identity": "Sender identity visually mimics a known entity.",
    "adapter_manipulation_flag": "Media adapter manipulation or tampering detected.",
    "identity_mismatch": "The claimed identity does not match the observed characteristics.",
    "file_signature_mismatch": "The file's magic number/signature does not match its stated extension.",
    "ela_inconsistency": "Error Level Analysis (ELA) reveals inconsistencies suggesting image manipulation.",
    "payment_or_urgent_request_context": "The context involves a payment request or extreme urgency.",
    "audio_spectral_artifacts": "Spectral analysis reveals artifacts typical of synthetic or altered audio.",
    "container_metadata_anomaly": "Anomalies found within the media container's metadata.",
    "video_frame_inconsistency": "Inconsistencies detected between video frames, suggesting tampering or deepfake generation.",
    "editing_software_tag": "Metadata indicates the file was processed by known editing software.",
    "exif_missing": "Expected EXIF metadata is completely missing.",

    # Impersonation
    "display_name_spoof": "The display name is spoofing a known individual or brand.",
    "official_domain_mismatch": "The sender claims an official identity but the domain does not match.",
    "executive_claim": "The sender claims to be a company executive.",
    "authority_claim": "The sender claims to be a person of authority.",
    "new_contact_claim": "The sender claims to be a new or previously unknown contact.",
    "style_deviation": "The communication style deviates significantly from the claimed identity's baseline.",
    
    # System Activity
    "outbound_volume_spike": "A sudden, anomalous spike in outbound data transfer volume.",
    "new_external_destination": "Data transfer to a previously unseen external destination.",
    "rate_spike": "A sudden spike in API or system request rates.",
    "endpoint_enumeration": "Pattern suggests systematic enumeration or scanning of API endpoints.",
    "token_reuse_multi_ip": "The same authentication token is being used from multiple distinct IP addresses.",
    "bulk_file_access": "Unusually large volume of files accessed in a short period.",
    "off_hours_transfer": "Data transfer occurred outside of normal business hours.",
    "beaconing_periodicity": "Network traffic exhibits regular, periodic patterns typical of malware beaconing.",
    "port_scan_pattern": "Network traffic pattern is indicative of port scanning activity.",
    "error_burst": "A sudden burst of system or application errors.",
    "rare_port_usage": "Communication over rarely used or non-standard network ports.",
    "privileged_action_anomaly": "A privileged action was performed in an anomalous context.",
    "known_malicious_hash": "File hash matches a known malicious indicator.",
    
    # Context (General)
    "privileged_recipient": "The recipient holds privileged access rights.",
    "executive_recipient": "The recipient is a company executive.",
    "finance_or_brand_target": "The target is related to finance or brand management.",
    "sandbox_or_test": "The activity occurred within a sandbox or testing environment.",
    "privileged_account": "The involved account has privileged access.",
    "finance_or_pii_role": "The role handles finance or Personally Identifiable Information (PII).",
    "public_authority": "The target or claimed identity is a public authority.",
    "executive_or_official": "The target or claimed identity is an executive or official.",
    "mission_critical_service": "The activity involves a mission-critical service.",
    "sensitive_service": "The activity involves a sensitive service.",
    "ioc_match_confirmed": "A confirmed match with known Indicators of Compromise (IOC).",
    "allowlist_match": "The entity matched a known allowlist entry."
}

def generate_explanation(evidence_items: List[Evidence], ml_insight: Dict[str, Any] | None = None) -> Explanation:
    """
    Generate the Explanation object from a list of Evidence objects.
    Evidence objects should already have their contribution computed.
    """
    # Sort evidence by contribution descending
    sorted_ev = sorted(
        [e for e in evidence_items if e.contribution is not None], 
        key=lambda x: x.contribution or 0.0, 
        reverse=True
    )
    
    factors = []
    top_factors = []
    
    for e in sorted_ev:
        desc = TEMPLATES.get(e.type, f"Evidence of type {e.type} detected.")
        factors.append(Factor(evidence_ids=[e.evidence_id], description=desc))
        
    # Top factors (up to 3)
    top_factors = [f.evidence_ids[0] for f in factors[:3]]
    
    return Explanation(
        factors=factors,
        top_factors=top_factors,
        ml_insight=ml_insight
    )
