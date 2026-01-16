"""
Retry utilities with exponential backoff for handling Google API rate limits.
"""
import asyncio
import functools
import random
import time
from typing import Callable, Type, Tuple
import gspread.exceptions


class RateLimitError(Exception):
    """Custom exception for rate limiting with retry-after info."""
    def __init__(self, retry_after: int = 60, message: str = "Rate limited"):
        self.retry_after = retry_after
        super().__init__(f"{message}. Retry after {retry_after} seconds.")


# Google API error codes that indicate rate limiting
RATE_LIMIT_CODES = (429, 503)


def is_rate_limit_error(exception: Exception) -> bool:
    """Check if an exception is a rate limit error."""
    # gspread wraps HTTP errors
    if isinstance(exception, gspread.exceptions.APIError):
        response = getattr(exception, 'response', None)
        if response is not None and hasattr(response, 'status_code'):
            return response.status_code in RATE_LIMIT_CODES
    return False


def retry_with_backoff(
    max_retries: int = 5,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    jitter: bool = True,
    retryable_exceptions: Tuple[Type[Exception], ...] = (gspread.exceptions.APIError,),
):
    """
    Decorator that retries a function with exponential backoff on rate limit errors.

    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Initial delay in seconds
        max_delay: Maximum delay in seconds
        exponential_base: Base for exponential calculation
        jitter: Add random jitter to prevent thundering herd
        retryable_exceptions: Tuple of exception types to retry on

    Usage:
        @retry_with_backoff(max_retries=3)
        def my_google_api_call():
            ...
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_exception = e
                    
                    # Only retry on rate limit errors
                    if not is_rate_limit_error(e):
                        raise
                    
                    if attempt == max_retries:
                        # Raise a custom RateLimitError on final failure
                        raise RateLimitError(
                            retry_after=int(max_delay),
                            message=f"Rate limited after {max_retries + 1} attempts"
                        )
                    
                    # Calculate delay with exponential backoff
                    delay = min(base_delay * (exponential_base ** attempt), max_delay)
                    
                    # Add jitter (0-25% of delay)
                    if jitter:
                        delay += random.uniform(0, delay * 0.25)
                    
                    print(f"[Retry] Rate limited, waiting {delay:.1f}s before attempt {attempt + 2}/{max_retries + 1}")
                    time.sleep(delay)
            
            # Should not reach here, but just in case
            if last_exception:
                raise last_exception
        
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    # If the function is async, await it
                    result = func(*args, **kwargs)
                    if asyncio.iscoroutine(result):
                        return await result
                    return result
                except retryable_exceptions as e:
                    last_exception = e
                    
                    if not is_rate_limit_error(e):
                        raise
                    
                    if attempt == max_retries:
                        raise RateLimitError(
                            retry_after=int(max_delay),
                            message=f"Rate limited after {max_retries + 1} attempts"
                        )
                    
                    delay = min(base_delay * (exponential_base ** attempt), max_delay)
                    if jitter:
                        delay += random.uniform(0, delay * 0.25)
                    
                    print(f"[Retry] Rate limited, waiting {delay:.1f}s before attempt {attempt + 2}/{max_retries + 1}")
                    await asyncio.sleep(delay)
            
            if last_exception:
                raise last_exception
        
        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


# Pre-configured decorator for Google Sheets API calls
sheets_api_retry = retry_with_backoff(
    max_retries=3,
    base_delay=2.0,
    max_delay=30.0,
)
