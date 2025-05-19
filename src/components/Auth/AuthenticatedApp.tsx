/**
 * AuthenticatedApp Component
 *
 * This component provides authentication-based conditional rendering.
 * It acts as a security boundary for protected content, ensuring that
 * only authenticated users can access certain parts of the application.
 *
 * Key features:
 * - Automatically verifies authentication status on mount
 * - Shows loading state during verification
 * - Renders protected content only when authenticated
 * - Provides customizable fallback UI for unauthenticated users
 * - Can be configured to always show content (for optional authentication)
 *
 * Usage examples:
 * 1. Wrap protected content:
 *    <AuthenticatedApp>
 *      <ProtectedContent />
 *    </AuthenticatedApp>
 *
 * 2. With custom fallback:
 *    <AuthenticatedApp fallback={<CustomLoginPrompt />}>
 *      <ProtectedContent />
 *    </AuthenticatedApp>
 *
 * 3. Optional authentication (always shows content):
 *    <AuthenticatedApp requireAuth={false}>
 *      <ContentVisibleToAll />
 *    </AuthenticatedApp>
 */
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Paper, Text, Button, Center, Stack, Loader } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import useStore from '../../store';
import { useAuthVerification } from '../../hooks/queries/useWebAuthn';

/**
 * Props for the AuthenticatedApp component
 */
interface AuthenticatedAppProps {
  children: ReactNode;       // Content to render when authenticated
  fallback?: ReactNode;      // Optional custom UI to show when not authenticated
  requireAuth?: boolean;     // If true, only shows content when authenticated
}

/**
 * Default fallback component shown to unauthenticated users
 */
function DefaultFallback() {
  return (
    <Paper p="xl" withBorder>
      <Center>
        <Stack align="center" gap="md">
          <IconLock size={48} color="var(--mantine-color-blue-6)" />
          <Text size="lg" fw={500}>Authentication Required</Text>
          <Text size="sm" c="dimmed" ta="center">
            Please login or register to access this content.
          </Text>
        </Stack>
      </Center>
    </Paper>
  );
}

export function AuthenticatedApp({
  children,
  fallback = <DefaultFallback />,
  requireAuth = true
}: AuthenticatedAppProps) {
  // Get authentication state from store
  const { isAuthenticated, operationState: { isLoading } } = useStore();
  
  // Use the verification hook with proper dependency management to prevent infinite loops
  const authVerification = useAuthVerification();
  
  // If authentication is not required, always render children
  if (!requireAuth) {
    return <>{children}</>;
  }
  
  // Show loading state
  if (isLoading || authVerification.isLoading) {
    return (
      <Center p="xl">
        <Stack align="center" gap="md">
          <Loader size="md" />
          <Text size="sm" color="dimmed">Verifying authentication...</Text>
        </Stack>
      </Center>
    );
  }
  
  // Show children when authenticated, fallback otherwise
  return isAuthenticated ? <>{children}</> : <>{fallback}</>;
}