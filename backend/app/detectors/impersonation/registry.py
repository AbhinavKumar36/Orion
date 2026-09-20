from typing import Dict, List, Any

# Mock registry for Phase 4
PROTECTED_IDENTITIES = {
    "alice_smith_ceo": {
        "display_names": ["Alice Smith", "A. Smith"],
        "roles": ["CEO", "Chief Executive Officer"],
        "official_domains": ["orion-corp.com"],
        "context_flags": ["executive_or_official"]
    },
    "bob_jones_finance": {
        "display_names": ["Bob Jones", "Robert Jones"],
        "roles": ["CFO", "Director of Finance", "Finance"],
        "official_domains": ["orion-corp.com"],
        "context_flags": ["executive_or_official", "finance_or_pii_role"]
    },
    "irs_gov": {
        "display_names": ["Internal Revenue Service", "IRS"],
        "roles": ["tax", "government"],
        "official_domains": ["irs.gov"],
        "context_flags": ["public_authority"]
    }
}

def get_protected_identities() -> Dict[str, Any]:
    return PROTECTED_IDENTITIES
