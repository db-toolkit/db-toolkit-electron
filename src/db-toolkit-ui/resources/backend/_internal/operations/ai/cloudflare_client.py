"""Cloudflare Workers AI client for DBAssist."""
import httpx
from typing import Optional, Dict, Any, List


class CloudflareAIClient:
    """Client for Cloudflare Workers AI API."""
    
    def __init__(self, account_id: str, api_token: str):
        """Initialize Cloudflare AI client.
        
        Args:
            account_id: Cloudflare account ID
            api_token: Cloudflare API token
        """
        self.account_id = account_id
        self.api_token = api_token
        self.base_url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run"
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }
    
    async def generate(
        self,
        prompt: str,
        model: str = "@cf/meta/llama-3.1-70b-instruct",
        max_tokens: int = 2048,
        temperature: float = 0.7,
        system_prompt: Optional[str] = None
    ) -> str:
        """Generate text using Cloudflare Workers AI.
        
        Args:
            prompt: User prompt
            model: Model to use (default: Llama 3.1 70B)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0-1)
            system_prompt: Optional system prompt
            
        Returns:
            Generated text
        """
        messages = []
        
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })
        
        messages.append({
            "role": "user",
            "content": prompt
        })
        
        payload = {
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/{model}",
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            
            # Extract response from Cloudflare format
            if "result" in result and "response" in result["result"]:
                return result["result"]["response"]
            elif "result" in result and isinstance(result["result"], dict):
                # Handle different response formats
                if "text" in result["result"]:
                    return result["result"]["text"]
                elif "content" in result["result"]:
                    return result["result"]["content"]
            
            # Fallback: return raw result
            return str(result.get("result", ""))
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "@cf/meta/llama-3.1-70b-instruct",
        max_tokens: int = 2048,
        temperature: float = 0.7
    ) -> str:
        """Chat with multi-turn conversation support.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model to use
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            
        Returns:
            Generated response
        """
        payload = {
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/{model}",
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            
            if "result" in result and "response" in result["result"]:
                return result["result"]["response"]
            elif "result" in result and isinstance(result["result"], dict):
                if "text" in result["result"]:
                    return result["result"]["text"]
                elif "content" in result["result"]:
                    return result["result"]["content"]
            
            return str(result.get("result", ""))


# Available Cloudflare AI models
CLOUDFLARE_MODELS = {
    "llama-3.1-70b": "@cf/meta/llama-3.1-70b-instruct",  # Best for SQL/code
    "llama-3.1-8b": "@cf/meta/llama-3.1-8b-instruct",    # Faster, less capable
    "llama-3-8b": "@cf/meta/llama-3-8b-instruct",        # Legacy
    "mistral-7b": "@cf/mistral/mistral-7b-instruct-v0.1", # Alternative
    "codellama-7b": "@hf/thebloke/codellama-7b-instruct-awq" # Code-specific
}
