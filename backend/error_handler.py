"""
Error Handler - Provides robust error handling with retry logic
"""
import time
import traceback
from typing import Callable, Any, Optional
from functools import wraps

class ErrorHandler:
    """Handles errors with retry logic and graceful degradation"""
    
    @staticmethod
    def retry_with_exponential_backoff(
        func: Callable,
        max_retries: int = 3,
        initial_delay: float = 1.0,
        max_delay: float = 10.0,
        exponential_base: float = 2.0
    ) -> Any:
        """
        Retry a function with exponential backoff
        
        Args:
            func: Function to retry
            max_retries: Maximum number of retry attempts
            initial_delay: Initial delay in seconds
            max_delay: Maximum delay in seconds
            exponential_base: Base for exponential backoff
        
        Returns:
            Result of the function call
        
        Raises:
            Last exception if all retries fail
        """
        delay = initial_delay
        last_exception = None
        
        for attempt in range(max_retries + 1):
            try:
                return func()
            except Exception as e:
                last_exception = e
                
                if attempt < max_retries:
                    print(f"Attempt {attempt + 1} failed: {str(e)}. Retrying in {delay}s...")
                    time.sleep(delay)
                    delay = min(delay * exponential_base, max_delay)
                else:
                    print(f"All {max_retries + 1} attempts failed.")
        
        raise last_exception
    
    @staticmethod
    def get_user_friendly_error_message(error: Exception) -> str:
        """
        Convert technical errors to user-friendly messages
        """
        error_str = str(error).lower()
        error_type = type(error).__name__
        
        # API key errors
        if "api key" in error_str or "authentication" in error_str or "unauthorized" in error_str:
            return "I'm having trouble connecting to my AI brain. Please check that your API key is configured correctly in the .env file."
        
        # Network errors
        if "connection" in error_str or "timeout" in error_str or "network" in error_str:
            return "I'm having trouble connecting to the internet. Please check your connection and try again."
        
        # Rate limiting
        if "rate limit" in error_str or "too many requests" in error_str:
            return "I'm being rate limited. Please wait a moment and try again."
        
        # Invalid input
        if "invalid" in error_str or "validation" in error_str:
            return "There was an issue with your request. Could you try rephrasing it?"
        
        # JSON parsing errors
        if "json" in error_str or error_type == "JSONDecodeError":
            return "I had trouble understanding the response. Let me try again."
        
        # Database errors
        if "database" in error_str or "sqlite" in error_str:
            return "I encountered a database error. Your data should be safe, but please try again."
        
        # Generic fallback
        return "I encountered an unexpected error. Please try again, and if the problem persists, check the console for details."
    
    @staticmethod
    def log_error(error: Exception, context: str = ""):
        """
        Log error with context
        """
        print(f"\n{'='*60}")
        print(f"ERROR in {context}")
        print(f"{'='*60}")
        print(f"Type: {type(error).__name__}")
        print(f"Message: {str(error)}")
        print(f"\nTraceback:")
        traceback.print_exc()
        print(f"{'='*60}\n")
    
    @staticmethod
    def safe_execute(func: Callable, fallback_value: Any = None, context: str = "") -> Any:
        """
        Execute a function safely with error handling
        
        Args:
            func: Function to execute
            fallback_value: Value to return if function fails
            context: Context string for logging
        
        Returns:
            Function result or fallback value
        """
        try:
            return func()
        except Exception as e:
            ErrorHandler.log_error(e, context)
            return fallback_value


def with_retry(max_retries: int = 3, initial_delay: float = 1.0):
    """
    Decorator for retrying functions with exponential backoff
    
    Usage:
        @with_retry(max_retries=3)
        def my_function():
            # ... code that might fail
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            return ErrorHandler.retry_with_exponential_backoff(
                lambda: func(*args, **kwargs),
                max_retries=max_retries,
                initial_delay=initial_delay
            )
        return wrapper
    return decorator


def safe_api_call(fallback_response: dict):
    """
    Decorator for safe API calls with fallback
    
    Usage:
        @safe_api_call(fallback_response={"reply": "Error occurred", "company": {}})
        def my_api_function():
            # ... API call code
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                ErrorHandler.log_error(e, func.__name__)
                error_message = ErrorHandler.get_user_friendly_error_message(e)
                
                # Merge error message into fallback
                result = fallback_response.copy()
                if "reply" in result:
                    result["reply"] = error_message
                
                return result
        return wrapper
    return decorator
