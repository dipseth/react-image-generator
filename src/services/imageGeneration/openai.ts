import OpenAI from 'openai';
import type { ImageGenerationProvider, GenerateImageOptions, GeneratedImage } from '../../types';

export class OpenAIProvider implements ImageGenerationProvider {
  private client: OpenAI;
  private static SUPPORTED_SIZES = ['256x256', '512x512', '1024x1024'];
  private static SUPPORTED_FORMATS = ['url'];
  private static MAX_IMAGES_PER_REQUEST = 1;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async generateImage({
    prompt,
    size = '1024x1024',
    n = 1
  }: GenerateImageOptions): Promise<GeneratedImage> {
    try {
      if (!prompt || prompt.length < 3) {
        throw new Error('Prompt must be at least 3 characters long');
      }

      const response = await this.client.images.generate({
        model: "dall-e-3",
        prompt,
        n: Math.min(n, this.getMaxImagesPerRequest()),
        size: size as any,
        response_format: "url",
      });

      const image = response.data?.[0];
      if (!image || !image.url) {
        throw new Error('No image was generated');
      }

      return {
        id: response.created.toString(),
        url: image.url,
        prompt,
        revised_prompt: image.revised_prompt,
        createdAt: new Date()
      };
    } catch (error: any) {
      if (error?.response) {
        throw new Error(error.response.data?.error?.message || 'Failed to generate image');
      }
      throw error;
    }
  }

  getSupportedSizes(): string[] {
    return OpenAIProvider.SUPPORTED_SIZES;
  }

  getSupportedFormats(): string[] {
    return OpenAIProvider.SUPPORTED_FORMATS;
  }

  getMaxImagesPerRequest(): number {
    return OpenAIProvider.MAX_IMAGES_PER_REQUEST;
  }
}