import re
from typing import List, Dict, Any, Tuple
from urllib.parse import urlparse

class EntityExtractor:
    """
    Extracts observable entities (IPs, Emails, Domains, URLs) from digital payloads.
    Returns a list of tuples: (entity_type, value_canonical)
    """

    @classmethod
    def extract_from_context(cls, module: str, context: Dict[str, Any]) -> List[Tuple[str, str]]:
        entities = set()
        
        # Generic extractions from context
        if "url" in context:
            url = context["url"]
            if url:
                entities.add(("url", url))
                try:
                    parsed = urlparse(url)
                    if parsed.netloc:
                        # Extract domain without port
                        domain = parsed.netloc.split(":")[0].lower()
                        entities.add(("domain", domain))
                except Exception:
                    pass

        if "email" in context:
            email = context["email"]
            if email:
                entities.add(("email", email.lower()))
                domain = email.split("@")[-1].lower() if "@" in email else None
                if domain:
                    entities.add(("domain", domain))
                    
        if "ip_address" in context:
            ip = context["ip_address"]
            if ip:
                entities.add(("ip", ip))
                
        # Parse text/html snippets for generic IPs
        snippet = context.get("html_snippet", "") or context.get("message", "")
        if isinstance(snippet, str) and len(snippet) > 0:
            # Simple IP regex
            ips = re.findall(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', snippet)
            for ip in ips:
                entities.add(("ip", ip))

        # Authentication Module specific: extract IPs and usernames from events
        if module == "authentication" and "events" in context:
            for event in context["events"]:
                if "ip" in event:
                    entities.add(("ip", event["ip"]))
                if "user" in event:
                    entities.add(("username", event["user"].lower()))

        # System Activity Module specific: extract file paths or processes
        if module == "system_activity" and "events" in context:
            for event in context["events"]:
                if "process" in event:
                    entities.add(("process", event["process"].lower()))
                if "path" in event:
                    entities.add(("file_path", event["path"]))
                if "ip" in event:
                    entities.add(("ip", event["ip"]))

        return list(entities)
