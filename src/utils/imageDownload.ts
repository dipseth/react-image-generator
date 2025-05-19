/**
 * Utility functions for downloading images
 */

/**
 * Converts an image URL to a downloadable blob
 * @param url - The URL of the image to download
 * @returns Promise that resolves to a Blob of the image
 */
export const convertImageUrlToBlob = async (url: string): Promise<Blob> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    return await response.blob();
  } catch (error) {
    console.error('Error converting image URL to blob:', error);
    throw error;
  }
};

/**
 * Triggers the download of an image with a custom filename
 * @param blob - The image blob to download
 * @param filename - The filename to use for the download
 */
export const downloadImage = (blob: Blob, filename: string): void => {
  // Create a URL for the blob
  const blobUrl = URL.createObjectURL(blob);
  
  // Create a temporary anchor element
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  
  // Append to the document, click it, and remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the blob URL
  URL.revokeObjectURL(blobUrl);
};

/**
 * Convenience function to download an image from a URL with a custom filename
 * @param url - The URL of the image to download
 * @param filename - The filename to use for the download
 */
export const downloadImageFromUrl = async (url: string, filename: string): Promise<void> => {
  try {
    const blob = await convertImageUrlToBlob(url);
    downloadImage(blob, filename);
  } catch (error) {
    console.error('Error downloading image from URL:', error);
    throw error;
  }
};

/**
 * Generates a filename for an image based on its prompt
 * @param prompt - The prompt used to generate the image
 * @param extension - The file extension to use (default: 'png')
 * @returns A sanitized filename
 */
export const generateFilenameFromPrompt = (prompt: string, extension = 'png'): string => {
  // Sanitize the prompt to create a valid filename
  // Remove invalid characters and limit length
  const sanitized = prompt
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .substring(0, 50); // Limit length
  
  // Add timestamp to ensure uniqueness
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  return `${sanitized}-${timestamp}.${extension}`;
};