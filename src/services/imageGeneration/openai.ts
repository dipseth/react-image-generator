import OpenAI from 'openai';
import type {
  ImageGenerationProvider,
  GenerateImageOptions,
  EditImageOptions,
  CreateVariationOptions,
  GeneratedImage,
  ImageSize,
  ImageFormat,
  ImageQuality,
  ImageModel
} from '../../types';

export class OpenAIProvider implements ImageGenerationProvider {
  private client: OpenAI;
  private static SUPPORTED_SIZES: ImageSize[] = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'];
  private static SUPPORTED_FORMATS: ImageFormat[] = ['url', 'png', 'jpeg', 'webp'];
  private static GPT_IMAGE_QUALITIES: ImageQuality[] = ['low', 'medium', 'high', 'auto'];
  private static DALLE_QUALITIES: ImageQuality[] = ['standard', 'hd'];
  private static MAX_IMAGES_PER_REQUEST = 1;
  private static DEFAULT_MODEL: ImageModel = 'gpt-image-1';

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
    n = 1,
    model = OpenAIProvider.DEFAULT_MODEL,
    quality = model === 'gpt-image-1' ? 'auto' : 'standard',
    format = 'url',
    transparency = false
  }: GenerateImageOptions): Promise<GeneratedImage> {
    try {
      this.validatePrompt(prompt);

      // Handle parameters based on the model
      const params: any = {
        model,
        prompt,
        n: Math.min(n, this.getMaxImagesPerRequest()),
        size: size as any
      };
      
      // Add model-specific parameters
      if (model === 'gpt-image-1') {
        // GPT Image model expects 'low', 'medium', 'high', or 'auto'
        params.quality = quality;
        // GPT Image model returns base64 by default without needing response_format
      } else {
        // Only add response_format, style, and quality for non-gpt-image-1 models
        params.response_format = format as any;
        params.style = 'natural';
        params.quality = quality;
      }
      
      // Add transparency only for PNG format
      if (transparency && format === 'png') {
        params.transparent = true;
      }
      
      const response = await this.client.images.generate(params);

      const image = response.data?.[0];
      if (!image) {
        throw new Error('No image was generated');
      }

      let imageUrl: string;
      
      // Handle different response formats
      if (image.b64_json) {
        // For base64 responses (GPT-image-1)
        const mimeType = format === 'jpeg' ? 'image/jpeg' :
                         format === 'webp' ? 'image/webp' :
                         'image/png';
        imageUrl = `data:${mimeType};base64,${image.b64_json}`;
      } else if (image.url) {
        // For URL responses (DALL-E)
        imageUrl = image.url;
      } else {
        throw new Error('No image data found in the response');
      }

      return {
        id: response.created.toString(),
        url: imageUrl,
        prompt,
        revised_prompt: image.revised_prompt,
        createdAt: new Date(),
        quality,
        format,
        transparency: transparency && format === 'png',
        model
      };
    } catch (error: any) {
      this.handleApiError(error);
    }
  }

  async editImage({
    image,
    prompt,
    mask,
    size = '1024x1024',
    model = OpenAIProvider.DEFAULT_MODEL,
    quality = model === 'gpt-image-1' ? 'auto' : 'standard',
    format = 'url',
    transparency = false
  }: EditImageOptions): Promise<GeneratedImage> {
    try {
      this.validatePrompt(prompt);
      
      if (!image) {
        throw new Error('Image is required for editing');
      }

      // Handle parameters based on the model
      const params: any = {
        image: this.prepareImageForApi(image),
        prompt,
        size: size as any
      };
      
      // Add mask if provided
      if (mask) {
        params.mask = this.prepareImageForApi(mask);
      }
      
      // Add model-specific parameters
      if (model === 'gpt-image-1') {
        params.model = model;
        // GPT Image model expects 'low', 'medium', 'high', or 'auto'
        params.quality = quality;
        // GPT Image model returns base64 by default without needing response_format
      } else {
        // Only add response_format and quality for non-gpt-image-1 models
        params.response_format = format as any;
        params.quality = quality;
      }
      
      // Add transparency only for PNG format
      if (transparency && format === 'png') {
        params.transparent = true;
      }
      
      const response = await this.client.images.edit(params);

      const resultImage = response.data?.[0];
      if (!resultImage) {
        throw new Error('No image was generated from edit');
      }

      let imageUrl: string;
      
      // Handle different response formats
      if (resultImage.b64_json) {
        // For base64 responses (GPT-image-1)
        const mimeType = format === 'jpeg' ? 'image/jpeg' :
                         format === 'webp' ? 'image/webp' :
                         'image/png';
        imageUrl = `data:${mimeType};base64,${resultImage.b64_json}`;
      } else if (resultImage.url) {
        // For URL responses (DALL-E)
        imageUrl = resultImage.url;
      } else {
        throw new Error('No image data found in the response');
      }

      return {
        id: response.created.toString(),
        url: imageUrl,
        prompt,
        revised_prompt: resultImage.revised_prompt,
        createdAt: new Date(),
        quality,
        format,
        transparency: transparency && format === 'png',
        model
      };
    } catch (error: any) {
      this.handleApiError(error);
    }
  }

  async createVariation({
    image,
    n = 1,
    size = '1024x1024',
    model = OpenAIProvider.DEFAULT_MODEL,
    quality = model === 'gpt-image-1' ? 'auto' : 'standard',
    format = 'url',
    transparency = false
  }: CreateVariationOptions): Promise<GeneratedImage> {
    try {
      if (!image) {
        throw new Error('Image is required for creating variations');
      }

      // The createVariation method doesn't support the quality parameter directly
      // We'll handle this differently based on the model
      // Handle parameters for variation
      const params: any = {
        image: this.prepareImageForApi(image),
        n: Math.min(n, this.getMaxImagesPerRequest()),
        size: size as any
      };
      
      // Add transparency only for PNG format
      if (transparency && format === 'png') {
        params.transparent = true;
      }
      
      // Set response format based on model
      if (model === 'gpt-image-1') {
        // GPT Image model returns base64 by default without needing response_format
      } else {
        params.response_format = format as any;
      }
      
      const response = await this.client.images.createVariation(params);

      const resultImage = response.data?.[0];
      if (!resultImage) {
        throw new Error('No variation was generated');
      }

      let imageUrl: string;
      
      // Handle different response formats
      if (resultImage.b64_json) {
        // For base64 responses (GPT-image-1)
        const mimeType = format === 'jpeg' ? 'image/jpeg' :
                         format === 'webp' ? 'image/webp' :
                         'image/png';
        imageUrl = `data:${mimeType};base64,${resultImage.b64_json}`;
      } else if (resultImage.url) {
        // For URL responses (DALL-E)
        imageUrl = resultImage.url;
      } else {
        throw new Error('No image data found in the response');
      }

      return {
        id: response.created.toString(),
        url: imageUrl,
        prompt: 'Variation of original image',
        createdAt: new Date(),
        quality,
        format,
        transparency: transparency && format === 'png',
        model
      };
    } catch (error: any) {
      this.handleApiError(error);
    }
  }

  getSupportedSizes(): ImageSize[] {
    return OpenAIProvider.SUPPORTED_SIZES;
  }

  getSupportedFormats(): ImageFormat[] {
    return OpenAIProvider.SUPPORTED_FORMATS;
  }

  getSupportedQualities(model: ImageModel = OpenAIProvider.DEFAULT_MODEL): ImageQuality[] {
    return model === 'gpt-image-1'
      ? OpenAIProvider.GPT_IMAGE_QUALITIES
      : OpenAIProvider.DALLE_QUALITIES;
  }

  getMaxImagesPerRequest(): number {
    return OpenAIProvider.MAX_IMAGES_PER_REQUEST;
  }

  private validatePrompt(prompt: string): void {
    if (!prompt || prompt.length < 3) {
      throw new Error('Prompt must be at least 3 characters long');
    }
  }

  private prepareImageForApi(image: string): any {
    // If the image is a URL, fetch it and convert to base64
    if (image.startsWith('http')) {
      // In a real implementation, we would fetch the image and convert it
      // For now, we'll just throw an error
      throw new Error('URL images are not supported yet. Please provide a base64 encoded image.');
    }
    
    // If it's already a base64 string, return it
    // In a real implementation, we would validate the base64 string
    return image;
  }

  private handleApiError(error: any): never {
    // Handle specific GPT Image model errors
    if (error?.response?.data?.error?.code) {
      const errorCode = error.response.data.error.code;
      
      switch (errorCode) {
        case 'content_policy_violation':
          throw new Error('The image content violates OpenAI\'s content policy');
        case 'rate_limit_exceeded':
          throw new Error('Rate limit exceeded. Please try again later');
        case 'invalid_api_key':
          throw new Error('Invalid API key. Please check your API key and try again');
        case 'insufficient_quota':
          throw new Error('Insufficient quota. Please check your plan and billing details');
        default:
          throw new Error(error.response.data?.error?.message || 'Failed to process image request');
      }
    }
    
    if (error?.response) {
      throw new Error(error.response.data?.error?.message || 'Failed to process image request');
    }
    
    throw error;
  }
}