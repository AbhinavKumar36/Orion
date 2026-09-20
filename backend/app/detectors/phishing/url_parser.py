import re
import ipaddress
from urllib.parse import urlparse, unquote
from typing import List, Set

SUSPICIOUS_TLDS = {".xyz", ".top", ".info", ".tk", ".ml", ".ga", ".cf", ".gq", ".biz", ".icu"}
SUSPICIOUS_PORTS = {21, 22, 23, 25, 53, 110, 135, 137, 138, 139, 445, 1433, 3306, 3389}
CREDENTIAL_KEYWORDS = {"login", "signin", "secure", "auth", "account", "update", "verify", "banking", "billing"}
REDIRECT_PARAMS = {"url", "redirect", "next", "return", "goto", "out", "link"}

def is_ip_host(hostname: str) -> bool:
    if not hostname:
        return False
    try:
        ipaddress.ip_address(hostname)
        return True
    except ValueError:
        return False

def extract_url_features(url: str) -> Set[str]:
    features = set()
    if not url:
        return features

    # Basic parsing
    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    path = parsed.path.lower()
    query = parsed.query.lower()

    # Protocol
    if parsed.scheme and parsed.scheme != "https":
        features.add("no_https")

    # Hostname checks
    if is_ip_host(hostname):
        features.add("ip_host")
    
    if "xn--" in hostname.lower():
        features.add("punycode")
        
    parts = hostname.split('.')
    if len(parts) > 4: # e.g. a.b.c.example.com
        features.add("excessive_subdomains")
        
    if parsed.port and parsed.port in SUSPICIOUS_PORTS:
        features.add("suspicious_port")
        
    if any(hostname.endswith(tld) for tld in SUSPICIOUS_TLDS):
        features.add("suspicious_tld")

    # Length and characters
    if len(url) > 100:
        features.add("long_url")
        
    special_chars = len(re.findall(r'[^a-zA-Z0-9\.\-\/:]', url))
    if len(url) > 0 and (special_chars / len(url)) > 0.15:
        features.add("special_char_ratio_high")
        
    if "@" in parsed.netloc:
        features.add("url_userinfo_at")
        
    # URL encoding check (if heavily encoded)
    if url.count('%') > 5:
        features.add("url_encoding_obfuscation")
        
    # Path/Query checks
    if any(keyword in path for keyword in CREDENTIAL_KEYWORDS):
        features.add("credential_path")
        
    # Look for redirect parameters e.g. url=http://bad.com
    for param in REDIRECT_PARAMS:
        if f"{param}=" in query or f"{param}=http" in query:
            features.add("redirect_param")
            
    # Simple homoglyph check (looks for cyrillic or strange unicode in unquoted path/host, though punycode catches IDN)
    # This is a basic mock for homoglyph_domain
    if re.search(r'[а-яА-Яα-ωΑ-Ω]', unquote(url)):
        features.add("homoglyph_domain")

    return features
