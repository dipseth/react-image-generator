/**
 * AuthButton Component
 *
 * This component provides the main user interface for authentication actions.
 * It dynamically changes based on the user's authentication state:
 *
 * 1. When not authenticated:
 *    - Shows Login and Register buttons
 *    - Opens the PasskeyAuthModal when clicked
 *
 * 2. When authenticated:
 *    - Shows user information (avatar, name, username)
 *    - Provides a dropdown menu with logout option
 *
 * 3. During authentication operations:
 *    - Shows loading indicators
 *
 * This component is typically placed in the application header for easy access.
 */
import { useState } from 'react';
import { Button, Group, Menu, Avatar, Text, Loader } from '@mantine/core';
import { IconLogin, IconUserPlus, IconLogout, IconUser } from '@tabler/icons-react';
import { PasskeyAuthModal } from './PasskeyAuthModal';
import useStore from '../../store';
import { useLogout } from '../../hooks/queries/useWebAuthn';

export function AuthButton() {
  // State for controlling the authentication modal
  const [modalOpened, setModalOpened] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'register'>('login');
  
  // Get authentication state from store
  const {
    user,
    isAuthenticated,
    operationState: { isAuthenticating, isRegistering, isLoading }
  } = useStore();
  
  // Get logout mutation
  const logoutMutation = useLogout();
  
  /**
   * Opens the authentication modal in the specified mode
   * @param mode - 'login' or 'register'
   */
  const openModal = (mode: 'login' | 'register') => {
    setModalMode(mode);
    setModalOpened(true);
  };
  
  /**
   * Handle logout
   */
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Show loading state
  if (isLoading || isAuthenticating || isRegistering || logoutMutation.isPending) {
    return (
      <Button variant="subtle" disabled>
        <Loader size="xs" mr="xs" /> Loading...
      </Button>
    );
  }
  
  // Show user menu when authenticated
  if (isAuthenticated && user) {
    return (
      <>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Button variant="subtle">
              <Group gap="xs">
                <Avatar size="sm" color="blue" radius="xl">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                </Avatar>
                <Text size="sm">{user.displayName || user.username}</Text>
              </Group>
            </Button>
          </Menu.Target>
          
          <Menu.Dropdown>
            <Menu.Label>Account</Menu.Label>
            <Menu.Item leftSection={<IconUser size={14} />}>Profile</Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconLogout size={14} />}
              color="red"
              onClick={handleLogout}
            >
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </>
    );
  }
  
  // Show login/register buttons when not authenticated
  return (
    <>
      <Group gap="xs">
        <Button
          variant="default"
          leftSection={<IconLogin size={16} />}
          onClick={() => openModal('login')}
        >
          Login
        </Button>
        
        <Button
          variant="filled"
          leftSection={<IconUserPlus size={16} />}
          onClick={() => openModal('register')}
        >
          Register
        </Button>
      </Group>
      
      <PasskeyAuthModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
      />
    </>
  );
}