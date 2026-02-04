import { request } from 'undici';

/**
 * LiteLLM HTTP client
 */
export class LiteLLMClient {
  constructor(baseUrl, logger) {
    this.baseUrl = baseUrl;
    this.logger = logger;
  }

  /**
   * Check health endpoint
   * @returns {Promise<object>} Health status
   */
  async health() {
    try {
      const { statusCode, body } = await request(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await body.json();

      return {
        ok: statusCode === 200,
        status: statusCode,
        data
      };
    } catch (error) {
      return {
        ok: false,
        error: error.message
      };
    }
  }

  /**
   * Make a completion request
   * @param {object} request - Completion request
   * @returns {Promise<object>} Completion response
   */
  async completion(completionRequest) {
    const startTime = Date.now();

    try {
      const { statusCode, body } = await request(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer xswarm-local-key`
        },
        body: JSON.stringify(completionRequest)
      });

      const data = await body.json();
      const latency = Date.now() - startTime;

      if (statusCode !== 200) {
        throw new Error(data.error?.message || `LiteLLM error: ${statusCode}`);
      }

      return {
        success: true,
        data,
        latency,
        usage: {
          tokens_in: data.usage?.prompt_tokens || 0,
          tokens_out: data.usage?.completion_tokens || 0,
          total_tokens: data.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      return {
        success: false,
        error: error.message,
        latency
      };
    }
  }

  /**
   * List available models
   * @returns {Promise<Array>} List of models
   */
  async models() {
    try {
      const { statusCode, body } = await request(`${this.baseUrl}/v1/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer xswarm-local-key`
        }
      });

      const data = await body.json();

      if (statusCode !== 200) {
        throw new Error(`Failed to list models: ${statusCode}`);
      }

      return data.data || [];
    } catch (error) {
      this.logger.error(`Failed to list models: ${error.message}`);
      return [];
    }
  }
}
