"""
Input Validator - Validates and sanitizes user inputs
"""
import re
from typing import Tuple, List, Optional

class InputValidator:
    """Validates user inputs and detects edge cases"""
    
    # Common company name patterns
    COMPANY_SUFFIXES = ["inc", "corp", "corporation", "llc", "ltd", "limited", "co", "company"]
    
    # Capability boundaries
    CAPABILITIES = [
        "research companies",
        "generate account plans",
        "update company information",
        "compare companies",
        "analyze competitors",
        "provide company insights"
    ]
    
    OUT_OF_SCOPE_KEYWORDS = [
        "stock price", "predict", "forecast", "guarantee",
        "legal advice", "financial advice", "investment",
        "personal data", "private information", "hack",
        "illegal", "unethical"
    ]
    
    def validate_company_name(self, name: str) -> Tuple[bool, str, List[str]]:
        """
        Validate company name
        
        Returns:
            (is_valid, message, suggestions)
        """
        if not name or not name.strip():
            return False, "Please provide a company name.", []
        
        name = name.strip()
        
        # Check length
        if len(name) < 2:
            return False, "Company name is too short. Please provide a valid company name.", []
        
        if len(name) > 100:
            return False, "Company name is too long. Please provide a shorter name.", []
        
        # Check for gibberish (too many consonants in a row)
        if re.search(r'[bcdfghjklmnpqrstvwxyz]{6,}', name.lower()):
            return False, "This doesn't look like a valid company name. Could you clarify?", []
        
        # Check for obvious test/invalid inputs
        invalid_patterns = [
            r'^test\d*$',
            r'^asdf+',
            r'^qwerty',
            r'^\d+$',  # Only numbers
            r'^[^a-zA-Z0-9\s]+$'  # Only special characters
        ]
        
        for pattern in invalid_patterns:
            if re.match(pattern, name.lower()):
                return False, "This doesn't appear to be a real company name. Please provide a valid company name.", []
        
        # Valid
        return True, "Valid company name.", []
    
    def detect_ambiguity(self, prompt: str) -> Tuple[bool, str, List[str]]:
        """
        Detect if the prompt is ambiguous
        
        Returns:
            (is_ambiguous, reason, clarifying_questions)
        """
        prompt_lower = prompt.lower().strip()
        
        # Very short prompts
        if len(prompt) < 5:
            return True, "Your request is very brief.", [
                "What would you like me to help you with?",
                "Are you looking to research a company?",
                "Would you like to see what I can do?"
            ]
        
        # Vague pronouns without context
        vague_pronouns = ["it", "that", "this", "them", "those"]
        if any(prompt_lower.startswith(pronoun) for pronoun in vague_pronouns):
            return True, "I'm not sure what you're referring to.", [
                "Which company are you asking about?",
                "Could you be more specific?"
            ]
        
        # Generic requests
        generic_terms = [
            "something", "anything", "stuff", "things",
            "help me", "i need", "can you"
        ]
        
        if any(term in prompt_lower for term in generic_terms) and len(prompt) < 30:
            return True, "Your request is a bit vague.", [
                "What specific company would you like to research?",
                "What information are you looking for?",
                "Would you like to see some examples of what I can do?"
            ]
        
        # Multiple questions
        question_count = prompt.count("?")
        if question_count > 2:
            return True, "You've asked multiple questions.", [
                "Which question would you like me to answer first?",
                "Let's tackle these one at a time. What's most important?"
            ]
        
        return False, "", []
    
    def is_within_capabilities(self, prompt: str) -> Tuple[bool, str, List[str]]:
        """
        Check if the request is within system capabilities
        
        Returns:
            (is_capable, message, alternatives)
        """
        prompt_lower = prompt.lower()
        
        # Check for out-of-scope keywords
        for keyword in self.OUT_OF_SCOPE_KEYWORDS:
            if keyword in prompt_lower:
                return False, f"I can't help with {keyword}. I'm designed for company research and account planning.", [
                    "I can research companies and generate account plans",
                    "I can analyze competitors and market positioning",
                    "I can help you compare multiple companies"
                ]
        
        # Check for impossible requests
        impossible_patterns = [
            (r"predict.*future", "I can't predict the future, but I can analyze current trends."),
            (r"guarantee|promise", "I can't make guarantees, but I can provide data-driven insights."),
            (r"hack|crack|break", "I can't help with that. I'm designed for legitimate business research."),
            (r"personal.*data|private.*information", "I only work with publicly available business information.")
        ]
        
        for pattern, message in impossible_patterns:
            if re.search(pattern, prompt_lower):
                return False, message, [
                    "Would you like to research a company instead?",
                    "I can help you analyze publicly available business data."
                ]
        
        return True, "", []
    
    def sanitize_input(self, text: str) -> str:
        """
        Clean and normalize input text
        """
        if not text:
            return ""
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Trim
        text = text.strip()
        
        # Remove control characters
        text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\r\t')
        
        # Limit length
        max_length = 1000
        if len(text) > max_length:
            text = text[:max_length]
        
        return text
    
    def validate_prompt(self, prompt: str) -> Tuple[bool, str, Optional[List[str]]]:
        """
        Comprehensive prompt validation
        
        Returns:
            (is_valid, message, suggestions)
        """
        # Sanitize first
        prompt = self.sanitize_input(prompt)
        
        if not prompt:
            return False, "Please provide a message.", ["What would you like to know?"]
        
        # Check capabilities
        is_capable, cap_message, cap_alternatives = self.is_within_capabilities(prompt)
        if not is_capable:
            return False, cap_message, cap_alternatives
        
        # Check ambiguity
        is_ambiguous, amb_reason, clarifying_questions = self.detect_ambiguity(prompt)
        if is_ambiguous:
            return False, amb_reason, clarifying_questions
        
        return True, "Valid prompt.", None
    
    def extract_company_name_from_prompt(self, prompt: str) -> Optional[str]:
        """
        Try to extract a company name from the prompt
        """
        prompt = prompt.strip()
        
        # Pattern: "research <company>"
        match = re.search(r'research\s+([a-zA-Z0-9\s&.]+?)(?:\s|$|\.)', prompt, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        
        # Pattern: "tell me about <company>"
        match = re.search(r'tell me about\s+([a-zA-Z0-9\s&.]+?)(?:\s|$|\.)', prompt, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        
        # Pattern: "look up <company>"
        match = re.search(r'look up\s+([a-zA-Z0-9\s&.]+?)(?:\s|$|\.)', prompt, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        
        # Pattern: "find <company>"
        match = re.search(r'find\s+(?:information\s+(?:on|about)\s+)?([a-zA-Z0-9\s&.]+?)(?:\s|$|\.)', prompt, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        
        return None
