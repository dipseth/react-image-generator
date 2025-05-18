import type { AppConfig } from '../../types/config';
import type { ImageGenerationProvider } from '../../types';
import { OpenAIProvider } from './openai';

export function getImageProvider(config: AppConfig): ImageGenerationProvider {
  switch (config.imageProvider) {
    case 'openai':
      return new OpenAIProvider();
    case 'stabilityai':
      throw new Error('StabilityAI provider not implemented yet');
    default:
      return new OpenAIProvider();
  }
}