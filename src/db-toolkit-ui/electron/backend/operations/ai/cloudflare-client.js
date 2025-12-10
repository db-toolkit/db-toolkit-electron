/**
 * Cloudflare Workers AI client for DBAssist.
 */

const axios = require('axios');

class CloudflareAIClient {
  constructor(accountId, apiToken) {
    this.accountId = accountId;
    this.apiToken = apiToken;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run`;
    this.headers = {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    };
  }

  async generate(prompt, model = '@cf/meta/llama-3.1-70b-instruct', maxTokens = 2048, temperature = 0.7, systemPrompt = null) {
    const messages = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });
    
    const payload = {
      messages,
      max_tokens: maxTokens,
      temperature
    };
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/${model}`,
        payload,
        { 
          headers: this.headers,
          timeout: 60000
        }
      );
      
      const result = response.data;
      
      if (result.result && result.result.response) {
        return result.result.response;
      } else if (result.result && typeof result.result === 'object') {
        if (result.result.text) {
          return result.result.text;
        } else if (result.result.content) {
          return result.result.content;
        }
      }
      
      return String(result.result || '');
    } catch (error) {
      throw new Error(`Cloudflare AI request failed: ${error.message}`);
    }
  }

  async chat(messages, model = '@cf/meta/llama-3.1-70b-instruct', maxTokens = 2048, temperature = 0.7) {
    const payload = {
      messages,
      max_tokens: maxTokens,
      temperature
    };
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/${model}`,
        payload,
        { 
          headers: this.headers,
          timeout: 60000
        }
      );
      
      const result = response.data;
      
      if (result.result && result.result.response) {
        return result.result.response;
      } else if (result.result && typeof result.result === 'object') {
        if (result.result.text) {
          return result.result.text;
        } else if (result.result.content) {
          return result.result.content;
        }
      }
      
      return String(result.result || '');
    } catch (error) {
      throw new Error(`Cloudflare AI request failed: ${error.message}`);
    }
  }
}

// Available Cloudflare AI models
const CLOUDFLARE_MODELS = {
  'llama-3.1-70b': '@cf/meta/llama-3.1-70b-instruct',
  'llama-3.1-8b': '@cf/meta/llama-3.1-8b-instruct',
  'llama-3-8b': '@cf/meta/llama-3-8b-instruct',
  'mistral-7b': '@cf/mistral/mistral-7b-instruct-v0.1',
  'codellama-7b': '@hf/thebloke/codellama-7b-instruct-awq'
};

module.exports = { CloudflareAIClient, CLOUDFLARE_MODELS };
