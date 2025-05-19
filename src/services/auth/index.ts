/**
 * Authentication Service
 *
 * This service implements WebAuthn (Web Authentication) for passwordless authentication
 * using the SimpleWebAuthn library. WebAuthn is a W3C standard that allows servers to
 * register and authenticate users using public key cryptography instead of passwords.
 *
 * Security benefits:
 * - Eliminates password-related vulnerabilities (phishing, reuse, weak passwords)
 * - Credentials are stored securely on user devices (not on servers)
 * - Authentication is bound to the origin, preventing phishing attacks
 * - Uses asymmetric cryptography (public/private key pairs)
 * - Can leverage platform biometrics and security keys
 *
 * The authentication flow consists of:
 * 1. Registration: Create a new credential (passkey)
 * 2. Authentication: Verify an existing credential
 * 3. Verification: Check if the user's token is valid
 * 4. Logout: Remove the authentication token
 */
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON
} from '@simplewebauthn/types';

// Base API URL - should be configurable in a real app
const API_BASE_URL = '/webauthn';

/**
 * Options for passkey registration
 */
export interface RegistrationOptions {
  username: string;      // Required unique identifier for the user
  displayName?: string;  // Optional human-readable name
}

/**
 * Options for passkey authentication
 */
export interface AuthenticationOptions {
  username: string;      // Username to authenticate
}

/**
 * Server response after successful authentication or registration
 */
export interface AuthResponse {
  user: {
    id: string;          // Server-side user ID
    username: string;    // Username
    displayName?: string; // Display name if provided
  };
  token: string;         // JWT or other auth token for session
}

class AuthService {
  /**
   * Start the WebAuthn registration process
   *
   * WebAuthn registration flow:
   * 1. Request challenge from server
   * 2. Pass challenge to browser's credential creation API
   * 3. Browser creates a new credential (public/private key pair)
   * 4. Send public key and attestation to server for verification
   * 5. Server stores the credential for future authentications
   *
   * @param options - Registration options with username and optional display name
   * @returns Promise resolving to auth response with user info and token
   */
  async startRegistration(options: RegistrationOptions): Promise<AuthResponse> {
    // 1. Request registration options from the server
    const optionsResponse = await fetch(`${API_BASE_URL}/register/options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });
    
    if (!optionsResponse.ok) {
      const error = await optionsResponse.json();
      throw new Error(error.message || 'Failed to get registration options');
    }
    
    const publicKeyOptions: PublicKeyCredentialCreationOptionsJSON = await optionsResponse.json();
    
    // 2. Pass the options to the browser's WebAuthn API
    let registrationResponse: RegistrationResponseJSON;
    try {
      // Pass options in the expected format for the current SimpleWebAuthn version
      registrationResponse = await startRegistration({
        optionsJSON: publicKeyOptions
      });
    } catch (error) {
      console.error('WebAuthn registration error:', error);
      throw new Error('WebAuthn registration failed');
    }
    
    // 3. Send the response to the server for verification
    const verificationResponse = await fetch(`${API_BASE_URL}/register/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: options.username,
        attestationResponse: registrationResponse
      }),
    });
    
    if (!verificationResponse.ok) {
      const error = await verificationResponse.json();
      throw new Error(error.message || 'Failed to verify registration');
    }
    
    return verificationResponse.json();
  }
  
  /**
   * Start the WebAuthn authentication process
   *
   * WebAuthn authentication flow:
   * 1. Request challenge from server with username
   * 2. Server looks up user's registered credentials and creates challenge
   * 3. Pass challenge to browser's credential request API
   * 4. Browser prompts user to use their passkey (biometric/PIN/security key)
   * 5. Browser creates a signed assertion using the private key
   * 6. Send assertion to server for verification
   * 7. Server verifies signature and issues auth token
   *
   * @param options - Authentication options with username
   * @returns Promise resolving to auth response with user info and token
   */
  async startAuthentication(options: AuthenticationOptions): Promise<AuthResponse> {
    // 1. Request authentication options from the server
    const optionsResponse = await fetch(`${API_BASE_URL}/authenticate/options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });
    
    if (!optionsResponse.ok) {
      const error = await optionsResponse.json();
      throw new Error(error.message || 'Failed to get authentication options');
    }
    
    const publicKeyOptions: PublicKeyCredentialRequestOptionsJSON = await optionsResponse.json();
    
    // 2. Pass the options to the browser's WebAuthn API
    let authenticationResponse: AuthenticationResponseJSON;
    try {
      // Pass options in the expected format for the current SimpleWebAuthn version
      authenticationResponse = await startAuthentication({
        optionsJSON: publicKeyOptions
      });
    } catch (error) {
      console.error('WebAuthn authentication error:', error);
      throw new Error('WebAuthn authentication failed');
    }
    
    // 3. Send the response to the server for verification
    const verificationResponse = await fetch(`${API_BASE_URL}/authenticate/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: options.username,
        assertionResponse: authenticationResponse
      }),
    });
    
    if (!verificationResponse.ok) {
      const error = await verificationResponse.json();
      throw new Error(error.message || 'Failed to verify authentication');
    }
    
    return verificationResponse.json();
  }
  
  /**
   * Verify if the user is authenticated
   *
   * This method:
   * 1. Checks for an auth token in localStorage
   * 2. Sends the token to the server for validation
   * 3. Returns user information if token is valid
   * 4. Removes the token if invalid
   *
   * Used for:
   * - Initial app load to restore authentication state
   * - Periodic verification to ensure token hasn't expired
   * - Before accessing protected resources
   *
   * @returns Promise resolving to auth response with user info and token
   * @throws Error if no token found or token is invalid
   */
  async verifyAuth(): Promise<AuthResponse | null> {
    console.log("[authService] verifyAuth: Starting verification");
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      console.log("[authService] verifyAuth: No token found in localStorage - this is normal for new users");
      // Instead of throwing an error, we'll return null to indicate no authentication
      // This allows the application to handle this case more gracefully
      throw new Error('No authentication token found');
    }
    
    console.log("[authService] verifyAuth: Token found, making API request");
    try {
      const response = await fetch(`${API_BASE_URL}/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log("[authService] verifyAuth: Response status:", response.status);
      
      if (!response.ok) {
        console.log("[authService] verifyAuth: Response not OK, removing token");
        localStorage.removeItem('auth_token');
        throw new Error('Invalid or expired token');
      }
      
      const data = await response.json();
      console.log("[authService] verifyAuth: Verification successful");
      return data;
    } catch (error) {
      console.error("[authService] verifyAuth: Error during verification:", error);
      throw error;
    }
  }
  
  /**
   * Logout the user
   *
   * This method:
   * 1. Removes the authentication token from localStorage
   * 2. Does not invalidate the token on the server (would require additional API call)
   *
   * Note: In a production environment, consider also invalidating the token
   * on the server side to prevent token reuse.
   */
  logout(): void {
    localStorage.removeItem('auth_token');
  }
}

export const authService = new AuthService();