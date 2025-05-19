/**
 * Authentication State Management
 *
 * This module defines the authentication slice for the Zustand store.
 * It manages user information, authentication status, and operation states
 * (loading, errors) for the WebAuthn authentication system.
 *
 * The state is used throughout the application to:
 * - Determine if a user is authenticated
 * - Display user information
 * - Show loading states during authentication operations
 * - Display error messages
 * - Control access to protected content
 */
import type { StateCreator } from 'zustand';

/**
 * User information returned from authentication
 */
export interface User {
  id: string;           // Unique identifier from the server
  username: string;     // Username used for authentication
  displayName?: string; // Optional display name
}

/**
 * State for tracking authentication operations
 */
export interface AuthOperationState {
  isRegistering: boolean;    // Whether registration is in progress
  isAuthenticating: boolean; // Whether authentication is in progress
  error: string | null;      // Current error message, if any
  isLoading: boolean;        // General loading state
}

/**
 * Complete authentication slice interface
 */
export interface AuthSlice {
  // State
  user: User | null;                // Current authenticated user or null
  isAuthenticated: boolean;         // Whether user is authenticated
  operationState: AuthOperationState; // Operation states
  
  // Actions
  setUser: (user: User | null) => void;                // Set the current user
  setAuthenticated: (status: boolean) => void;         // Set authentication status
  setRegistering: (status: boolean) => void;           // Set registration state
  setAuthenticating: (status: boolean) => void;        // Set authentication state
  setError: (error: string | null) => void;            // Set error message
  setLoading: (status: boolean) => void;               // Set loading state
  logout: () => void;                                  // Clear authentication state
}

/**
 * Creates the authentication slice for the Zustand store
 *
 * This function defines:
 * 1. Initial state values
 * 2. Actions to update the state
 * 3. Side effects of those actions
 *
 * @param set - Zustand's state setter function
 * @returns The authentication slice
 */
export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  operationState: {
    isRegistering: false,
    isAuthenticating: false,
    error: null,
    isLoading: false
  },

  // Actions with implementation
  
  /**
   * Set the current user and update authentication status
   * Authentication status is derived from the presence of a user
   */
  setUser: (user) =>
    set(() => ({
      user,
      isAuthenticated: !!user
    })),

  /**
   * Explicitly set authentication status
   * Typically, this is handled by setUser, but this allows
   * for edge cases where we need to control it separately
   */
  setAuthenticated: (status) =>
    set(() => ({
      isAuthenticated: status
    })),

  /**
   * Set registration in-progress state
   * Used to show loading indicators during registration
   */
  setRegistering: (status) =>
    set((state) => ({
      operationState: {
        ...state.operationState,
        isRegistering: status
      }
    })),

  /**
   * Set authentication in-progress state
   * Used to show loading indicators during login
   */
  setAuthenticating: (status) =>
    set((state) => ({
      operationState: {
        ...state.operationState,
        isAuthenticating: status
      }
    })),

  /**
   * Set error message and reset operation states
   * When an error occurs, we clear all loading states
   */
  setError: (error) =>
    set((state) => ({
      operationState: {
        ...state.operationState,
        error,
        isRegistering: false,
        isAuthenticating: false,
        isLoading: false
      }
    })),

  /**
   * Set general loading state
   * Used for operations that aren't specifically registration or authentication
   */
  setLoading: (status) =>
    set((state) => ({
      operationState: {
        ...state.operationState,
        isLoading: status
      }
    })),

  /**
   * Reset all authentication state
   * Called when user logs out or token is invalidated
   */
  logout: () =>
    set(() => ({
      user: null,
      isAuthenticated: false,
      operationState: {
        isRegistering: false,
        isAuthenticating: false,
        error: null,
        isLoading: false
      }
    }))
});