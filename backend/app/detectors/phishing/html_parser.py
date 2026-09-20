from html.parser import HTMLParser
from urllib.parse import urlparse
from typing import Set

class PhishingHTMLParser(HTMLParser):
    def __init__(self, base_url: str):
        super().__init__()
        self.base_url = base_url
        self.base_domain = urlparse(base_url).hostname if base_url else ""
        self.features = set()
        
        # State tracking
        self.in_form = False
        self.form_action = None
        self.in_anchor = False
        self.anchor_href = None
        self.anchor_text = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        
        if tag == "form":
            self.in_form = True
            action = attrs_dict.get("action", "")
            if action:
                self.form_action = action
                action_parsed = urlparse(action)
                action_domain = action_parsed.hostname
                
                # If action has a domain, and it's different from the base domain
                if action_domain and self.base_domain and action_domain != self.base_domain:
                    self.features.add("form_action_cross_domain")
                    
        elif tag == "input" and self.in_form:
            input_type = attrs_dict.get("type", "").lower()
            if input_type == "password":
                self.features.add("fake_login_form")
                
        elif tag == "a":
            self.in_anchor = True
            self.anchor_href = attrs_dict.get("href", "")
            self.anchor_text = []

    def handle_data(self, data):
        if self.in_anchor:
            self.anchor_text.append(data)

    def handle_endtag(self, tag):
        if tag == "form":
            self.in_form = False
            self.form_action = None
            
        elif tag == "a":
            self.in_anchor = False
            visible_text = "".join(self.anchor_text).strip()
            
            # Check for link text mismatch
            # If the visible text looks like a domain/URL but doesn't match the href domain
            if visible_text and self.anchor_href:
                # Basic check: text contains a dot, no spaces (looks like domain)
                if "." in visible_text and " " not in visible_text:
                    href_domain = urlparse(self.anchor_href).hostname or ""
                    # Remove protocols/www for loose matching
                    clean_text = visible_text.lower().replace("http://", "").replace("https://", "").replace("www.", "")
                    clean_href = href_domain.replace("www.", "")
                    
                    if clean_text and clean_href and clean_href not in clean_text and clean_text not in clean_href:
                        self.features.add("link_text_mismatch")
                        
            self.anchor_href = None
            self.anchor_text = []

def extract_html_features(html_content: str, base_url: str = "") -> Set[str]:
    """
    Extract offline indicators from HTML snippets.
    """
    if not html_content:
        return set()
        
    parser = PhishingHTMLParser(base_url)
    try:
        parser.feed(html_content)
    except Exception:
        # Ignore malformed HTML errors
        pass
        
    return parser.features
