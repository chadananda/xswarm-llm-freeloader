import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Generate LiteLLM config.yaml from accounts
 */
export class LiteLLMConfigGenerator {
  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
  }

  /**
   * Generate LiteLLM config from database accounts
   * @param {string} outputPath - Path to write config.yaml
   * @returns {Promise<void>}
   */
  async generate(outputPath) {
    this.logger.info('Generating LiteLLM configuration...');

    // Get all active accounts
    const accounts = this.db.accounts.getAll({ status: 'active' });

    if (accounts.length === 0) {
      this.logger.warn('No active accounts found, generating empty config');
    }

    // Group accounts by provider
    const byProvider = {};
    for (const account of accounts) {
      if (!byProvider[account.provider]) {
        byProvider[account.provider] = [];
      }
      byProvider[account.provider].push(account);
    }

    // Build model list
    const modelList = [];

    for (const [providerName, providerAccounts] of Object.entries(byProvider)) {
      const provider = this.db.providers.getByName(providerName);
      const models = this.db.models.getByProvider(providerName);

      if (!provider || models.length === 0) {
        this.logger.warn(`Skipping provider ${providerName} (no provider or models found)`);
        continue;
      }

      // Add each model with each account
      for (const model of models) {
        for (const account of providerAccounts) {
          const litellmModelName = this._getLiteLLMModelName(providerName, model.name);
          const litellmProvider = this._getLiteLLMProvider(providerName);

          modelList.push({
            model_name: litellmModelName,
            litellm_params: {
              model: `${litellmProvider}/${model.name}`,
              api_key: account.api_key,
              api_base: provider.endpoint || undefined
            }
          });
        }
      }
    }

    // Build config object
    const config = {
      model_list: modelList,
      general_settings: {
        master_key: 'xswarm-local-key', // For local use only
        database_url: 'sqlite:///tmp/litellm.db', // Separate from xSwarm DB
        max_parallel_requests: 100
      }
    };

    // Write config file
    const configYaml = yaml.dump(config, {
      indent: 2,
      lineWidth: -1
    });

    fs.writeFileSync(outputPath, configYaml, 'utf8');
    this.logger.info(`LiteLLM config written to ${outputPath}`);
    this.logger.info(`Configured ${modelList.length} model endpoints`);
  }

  /**
   * Get LiteLLM model name format
   * @private
   */
  _getLiteLLMModelName(provider, modelName) {
    // Format: provider/model-name
    return `${provider}/${modelName}`;
  }

  /**
   * Get LiteLLM provider identifier
   * @private
   */
  _getLiteLLMProvider(provider) {
    // Map xSwarm provider names to LiteLLM provider names
    const providerMap = {
      'anthropic': 'anthropic',
      'openai': 'openai',
      'google': 'vertex_ai',
      'cohere': 'cohere',
      'local': 'ollama'
    };

    return providerMap[provider] || provider;
  }
}
