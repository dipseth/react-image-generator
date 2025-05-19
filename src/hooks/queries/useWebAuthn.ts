/**
 * WebAuthn Hooks
 *
 * This module provides React hooks for WebAuthn (Web Authentication) operations:
 * - Registration: Creating new passkeys
 * - Authentication: Verifying existing passkeys
 * - Verification: Checking authentication status
 * - Logout: Removing authentication
 *
 * These hooks use React Query for data fetching and caching, and integrate
 * with the global state management to track authentication status.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { authService, type RegistrationOptions, type AuthenticationOptions } from '../../services/auth';
import useStore from '../../store';

/**
 * Hook for WebAuthn passkey registration
 *
 * This hook:
 * 1. Manages the registration state (loading, error)
 * 2. Handles the WebAuthn registration flow via authService
 * 3. Updates the global state with user information on success
 * 4. Stores the authentication token in localStorage
 *
 * @returns A mutation object for registering a new passkey
 */
export function useWebAuthnRegistration() {
  const queryClient = useQueryClient();
  
  // Get store actions
  const setUser = useCallback(useStore.getState().setUser, []);
  const setRegistering = useCallback(useStore.getState().setRegistering, []);
  const setError = useCallback(useStore.getState().setError, []);
  
  return useMutation({
    mutationKey: ['webauthn', 'register'],
    mutationFn: async (options: RegistrationOptions) => {
      try {
        return await authService.startRegistration(options);
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Registration failed');
      }
    },
    onMutate: () => {
      setRegistering(true);
      setError(null);
    },
    onSuccess: (data) => {
      // Store the auth token
      localStorage.setItem('auth_token', data.token);
      
      // Update user in store
      setUser(data.user);
      
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
    onSettled: () => {
      setRegistering(false);
    },
    retry: 0,
  });
}

/**
 * Hook for WebAuthn passkey authentication
 *
 * This hook:
 * 1. Manages the authentication state (loading, error)
 * 2. Handles the WebAuthn authentication flow via authService
 * 3. Updates the global state with user information on success
 * 4. Stores the authentication token in localStorage
 *
 * @returns A mutation object for authenticating with a passkey
 */
export function useWebAuthnAuthentication() {
  const queryClient = useQueryClient();
  
  // Get store actions
  const setUser = useCallback(useStore.getState().setUser, []);
  const setAuthenticating = useCallback(useStore.getState().setAuthenticating, []);
  const setError = useCallback(useStore.getState().setError, []);
  
  return useMutation({
    mutationKey: ['webauthn', 'authenticate'],
    mutationFn: async (options: AuthenticationOptions) => {
      try {
        return await authService.startAuthentication(options);
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Authentication failed');
      }
    },
    onMutate: () => {
      setAuthenticating(true);
      setError(null);
    },
    onSuccess: (data) => {
      // Store the auth token
      localStorage.setItem('auth_token', data.token);
      
      // Update user in store
      setUser(data.user);
      
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
    onSettled: () => {
      setAuthenticating(false);
    },
    retry: 0,
  });
}

/**
 * Hook to verify authentication status
 *
 * This hook:
 * 1. Checks if the user has a valid authentication token
 * 2. Updates the global state with user information if authenticated
 * 3. Clears user information if not authenticated
 * 4. Automatically refetches on window focus, mount, and reconnect
 *
 * Used for:
 * - Initial app load to restore authentication state
 * - Periodic verification to ensure token hasn't expired
 *
 * @returns A query object with authentication status
 */
export function useAuthVerification() {
  console.log("[useAuthVerification] Hook initializing");
  
  const setUser = useCallback(useStore.getState().setUser, []);
  const setLoading = useCallback(useStore.getState().setLoading, []);
  const setError = useCallback(useStore.getState().setError, []);
  const setAuthenticated = useCallback(useStore.getState().setAuthenticated, []);
  
  const query = useQuery({
    queryKey: ['auth', 'verify'],
    queryFn: async () => {
      console.log("[useAuthVerification] Starting verification query");
      try {
        const result = await authService.verifyAuth();
        console.log("[useAuthVerification] Verification successful:", result ? "Has result" : "No result");
        return result;
      } catch (error) {
        console.log("[useAuthVerification] Verification failed:", error);
        
        // Handle "No authentication token found" as an expected state, not an error
        if (error instanceof Error && error.message === 'No authentication token found') {
          console.log("[useAuthVerification] No token found - this is an expected state for new users");
          setUser(null);
          setAuthenticated(false);
          // Return null instead of throwing to prevent React Query from treating this as an error
          return null;
        }
        
        // For other errors, clear user and throw
        setUser(null);
        
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Authentication verification failed');
      }
    },
    retry: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  console.log("[useAuthVerification] Query state:", {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ? query.error.message : null,
    isSuccess: query.isSuccess,
    data: query.data ? "Has data" : "No data"
  });
  
  // Use useEffect to handle state updates outside of render phase
  useEffect(() => {
    // Handle success
    if (query.data) {
      console.log("[useAuthVerification] Setting user from query data:", query.data.user);
      setUser(query.data.user);
      setAuthenticated(true);
    }
    
    // Handle errors (except "No authentication token found" which is handled in queryFn)
    if (query.error instanceof Error) {
      console.log("[useAuthVerification] Error detected:", query.error.message);
      setError(query.error.message);
      setAuthenticated(false);
    }
  }, [query.data, query.error, setUser, setAuthenticated, setError]);
  
  return query;
}

/**
 * Hook for logging out
 *
 * This hook:
 * 1. Removes the authentication token from localStorage
 * 2. Clears the user information from global state
 * 3. Invalidates authentication queries to trigger refetches
 *
 * @returns A mutation object for logging out
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const logout = useCallback(useStore.getState().logout, []);
  
  return useMutation({
    mutationKey: ['auth', 'logout'],
    mutationFn: async () => {
      authService.logout();
      return true;
    },
    onSuccess: () => {
      logout();
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}