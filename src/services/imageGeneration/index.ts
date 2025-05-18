import type { AppConfig } from '../../types/config';
import type { ImageGenerationProvider, ImageModel } from '../../types';
import { OpenAIProvider } from './openai';

/**
 * Factory function to get the appropriate image generation provider based on configuration.
 *
 * @param config The application configuration
 * @returns An instance of the configured image generation provider
 */
export function getImageProvider(config: AppConfig): ImageGenerationProvider {
  // Default to GPT Image model
  const defaultModel: ImageModel = 'gpt-image-1';
  
  switch (config.imageProvider) {
    case 'openai':
      // Use the OpenAI provider with the configured model
      return new OpenAIProvider();
    case 'stabilityai':
      // StabilityAI provider is not implemented yet
      throw new Error('StabilityAI provider not implemented yet');
    default:
      // Default to OpenAI provider with GPT Image model
      return new OpenAIProvider();
  }
}