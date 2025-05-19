/**
 * PasskeyAuthModal Component
 *
 * This component provides the user interface for WebAuthn passkey registration and authentication.
 * It uses the WebAuthn API (via SimpleWebAuthn) to create and verify passkeys, which are
 * more secure alternatives to passwords.
 *
 * The component has two tabs:
 * 1. Login - For authenticating with an existing passkey
 * 2. Register - For creating a new passkey
 *
 * Security features:
 * - Uses the WebAuthn API which leverages platform authenticators (biometrics, security keys)
 * - Credentials are stored securely on the user's device
 * - Authentication is resistant to phishing as it's tied to the origin
 * - No shared secrets are transmitted over the network
 */
import { useState, useEffect } from 'react';
import { Modal, Button, TextInput, Group, Stack, Text, Tabs, Alert } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useWebAuthnRegistration, useWebAuthnAuthentication } from '../../hooks/queries/useWebAuthn';
import useStore from '../../store';

interface PasskeyAuthModalProps {
  opened: boolean;  // Controls modal visibility
  onClose: () => void;  // Callback when modal is closed
}

export function PasskeyAuthModal({ opened, onClose }: PasskeyAuthModalProps) {
  // Form state
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>('login');
  
  // Get store state
  const {
    operationState: { isRegistering, isAuthenticating, error },
    isAuthenticated
  } = useStore();
  
  // Get WebAuthn mutations
  const registerMutation = useWebAuthnRegistration();
  const authMutation = useWebAuthnAuthentication();
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'register') {
      // Register new passkey
      registerMutation.mutate({
        username,
        displayName: displayName || undefined
      });
    } else {
      // Authenticate with existing passkey
      authMutation.mutate({
        username
      });
    }
  };
  
  // Close modal when authentication is successful
  useEffect(() => {
    if (isAuthenticated && opened) {
      onClose();
    }
  }, [isAuthenticated, opened, onClose]);
  
  // Determine if operation is in progress
  const isLoading = isRegistering || isAuthenticating ||
                    registerMutation.isPending || authMutation.isPending;
  
  // Determine if there's an error to display
  const errorMessage = error ||
                      registerMutation.error?.message ||
                      authMutation.error?.message;
  
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Passkey Authentication"
      centered
      size="md"
    >
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List grow>
          <Tabs.Tab value="login">Login</Tabs.Tab>
          <Tabs.Tab value="register">Register</Tabs.Tab>
        </Tabs.List>
        
        {errorMessage && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Authentication Error"
            color="red"
            mt="md"
          >
            {errorMessage}
          </Alert>
        )}
        
        {isAuthenticated && (
          <Alert
            icon={<IconCheck size={16} />}
            title="Success"
            color="green"
            mt="md"
          >
            Authentication successful!
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Tabs.Panel value="login" pt="md">
            <Stack>
              <TextInput
                label="Username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
              
              <Group justify="flex-end" mt="md">
                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={!username || isLoading}
                >
                  Authenticate with Passkey
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>
          
          <Tabs.Panel value="register" pt="md">
            <Stack>
              <TextInput
                label="Username"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
              
              <TextInput
                label="Display Name"
                placeholder="Your full name (optional)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
              />
              
              <Group justify="flex-end" mt="md">
                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={!username || isLoading}
                >
                  Register with Passkey
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>
        </form>
      </Tabs>
      
      <Text size="sm" c="dimmed" mt="lg">
        Passkeys provide a more secure alternative to passwords. Your device will create and store a unique passkey that only works with this site.
      </Text>
    </Modal>
  );
}