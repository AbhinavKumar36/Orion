from typing import List, Set
from backend.app.models.domain import RecommendedAction, Evidence

def generate_responses(
    threat_type: str, 
    severity: str, 
    assessment: str, 
    module: str, 
    evidence: List[Evidence]
) -> List[RecommendedAction]:
    """
    Generate deterministic recommended actions based on the incident classification.
    """
    actions = []
    fired_types = {e.type for e in evidence}
    
    if assessment == "inconclusive":
        actions.append(
            RecommendedAction(
                action="Request manual verification",
                priority=1,
                rationale="The assessment was inconclusive due to low confidence. Manual review is required.",
            )
        )
        return actions

    if assessment == "benign":
        return actions

    # Base actions by module
    if module == "phishing":
        actions.append(
            RecommendedAction(
                action="Block URL at gateway",
                priority=1,
                rationale="Prevent users from accessing the malicious URL.",
            )
        )
        if "credential_request_text" in fired_types or "fake_login_form" in fired_types:
            actions.append(
                RecommendedAction(
                    action="Force password reset for recipient",
                    priority=2,
                    rationale="Mitigate risk of credential harvesting.",
                )
            )

    elif module == "authentication":
        actions.append(
            RecommendedAction(
                action="Revoke active sessions",
                priority=1,
                rationale="Terminate potentially compromised sessions.",
            )
        )
        actions.append(
            RecommendedAction(
                action="Require MFA for next login",
                priority=2,
                rationale="Ensure the legitimate user re-authenticates securely.",
            )
        )

    elif module == "impersonation":
        actions.append(
            RecommendedAction(
                action="Quarantine sender email",
                priority=1,
                rationale="Prevent further impersonation emails from reaching the inbox.",
            )
        )
        if "executive_claim" in fired_types:
            actions.append(
                RecommendedAction(
                    action="Notify targeted executive's team",
                    priority=2,
                    rationale="High-profile impersonation detected.",
                )
            )

    elif module == "media":
        actions.append(
            RecommendedAction(
                action="Flag media as synthetic",
                priority=1,
                rationale="Warn users that the media has been digitally altered or generated.",
            )
        )

    elif module == "system_activity":
        actions.append(
            RecommendedAction(
                action="Isolate affected host",
                priority=1,
                rationale="Prevent lateral movement and further data exfiltration.",
            )
        )

    # General actions by severity
    if severity == "CRITICAL":
        actions.append(
            RecommendedAction(
                action="Escalate to SOC Tier 3",
                priority=1,
                rationale="Critical severity requires immediate expert analysis.",
            )
        )

    return sorted(actions, key=lambda a: a.priority)
