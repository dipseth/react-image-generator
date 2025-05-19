import type { GeneratedImage } from '../types';
import { config } from '../config';

/**
 * Posts a generated image to the TV server via proxy
 * @param image The generated image to post
 * @param notifyUrl Optional override URL for the proxy server
 * @throws Error if TV integration is not configured or the request fails
 *
 * Note: Requests are sent through a local proxy server to handle CORS/SSL issues.
 * The proxy forwards requests to the TV server and adds necessary headers.
 */
export async function notifyTV(image: GeneratedImage, notifyUrl?: string): Promise<void> {
  const serverUrl = notifyUrl || config.tv?.serverUrl;

  if (!config.tv?.enabled || !serverUrl) {
    throw new Error('TV integration is not enabled or configured');
  }

  try {
    // Check if the URL is a data URL (base64 encoded image)
    const isDataUrl = image.url.startsWith('data:');
    console.log('[notifyTV] Image URL type:', typeof image.url);
    console.log('[notifyTV] Is data URL:', isDataUrl);
    
    // Get the image URL to use (either original or hosted)
    let imageUrl = image.url;
    
    // If it's a data URL, we need to host it temporarily
    if (isDataUrl) {
      console.log('[notifyTV] Converting data URL to hosted URL...');
      try {
        // Use the same server URL for hosting images
        // This ensures we're using the same proxy server
        const hostImageUrl = serverUrl.replace('/api/tv/notify', '/api/host-image');
        
        // Send the image data to be hosted
        const response = await fetch(hostImageUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageData: image.url }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to host image: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        imageUrl = data.url;
        console.log('[notifyTV] Image hosted successfully at:', imageUrl);
      } catch (error) {
        console.error('[notifyTV] Error hosting image:', error);
        console.log('[notifyTV] Error type:', typeof error, 'Has message property:', error instanceof Error);
        throw new Error(
          'Failed to convert data URL to hosted URL. ' +
          'Please use an image URL that is accessible from the TV network. ' +
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    
    // Build payload matching TV server requirements
    const payload = {
      duration: 20,
      position: 0,
      title: image.prompt || '',
      titleColor: '#50BFF2',
      titleSize: 10,
      message: image.revised_prompt || image.prompt || '',
      messageColor: '#fbf5f5',
      messageSize: 14,
      backgroundColor: '#0f0e0e',
      media: {
        image: {
          uri: imageUrl,
          width: 640
        }
      }
    };
    // Diagnostic log: Output the payload being sent to the TV server
    console.log('[notifyTV] Sending payload to TV server:', JSON.stringify(payload, null, 2));

    // Log the full fetch options for debugging
    console.log('[notifyTV] Fetching:', serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    let response: Response | undefined = undefined;
    try {
      response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (fetchError) {
      // This block is hit for network errors or if the proxy server is down
      console.error('[notifyTV] Fetch failed (proxy/network error):', fetchError);
      throw new Error(
        '[notifyTV] Proxy or network error - ensure proxy server is running: ' +
          (fetchError instanceof Error ? fetchError.message : String(fetchError))
      );
    }

    // Diagnostic log: Output the response status and text
    console.log('[notifyTV] TV server response status:', response.status);
    let responseText = '';
    try {
      responseText = await response.text();
      console.log('[notifyTV] TV server response body:', responseText);
    } catch (e) {
      console.log('[notifyTV] Could not read response body:', e);
    }

    if (!response.ok) {
      throw new Error(`Failed to notify TV server: ${response.statusText} - ${responseText}`);
    }
  } catch (error) {
    // Diagnostic log: Output the error
    console.error('[notifyTV] Error posting to TV server:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to post image to TV: ${error.message}`);
    }
    throw new Error('Failed to post image to TV: Unknown error');
  }
}