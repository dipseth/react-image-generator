# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

## Passkey Authentication System

This application implements a secure passwordless authentication system using WebAuthn (Web Authentication) passkeys. Passkeys provide a more secure alternative to traditional passwords by leveraging public key cryptography and platform authenticators.

### Features

- **Passwordless Authentication**: No passwords to remember, share, or be stolen
- **Phishing Resistant**: Credentials are bound to the origin, preventing phishing attacks
- **Enhanced Security**: Uses public key cryptography and platform authenticators (biometrics, security keys)
- **User-Friendly**: Simple registration and login process with clear UI
- **Cross-Platform Support**: Works across modern browsers and devices

### Components

The authentication system consists of the following components:

#### 1. PasskeyAuthModal

A modal dialog that provides the user interface for registration and authentication.

```tsx
<PasskeyAuthModal
  opened={boolean}  // Controls visibility
  onClose={() => {}} // Callback when closed
/>
```

#### 2. AuthButton

A button component that changes based on authentication state:
- When not authenticated: Shows login/register buttons
- When authenticated: Shows user info and logout option
- During operations: Shows loading state

```tsx
<AuthButton />
```

#### 3. AuthenticatedApp

A wrapper component that conditionally renders content based on authentication status.

```tsx
// Only show content when authenticated
<AuthenticatedApp>
  <ProtectedContent />
</AuthenticatedApp>

// With custom fallback UI
<AuthenticatedApp fallback={<CustomLoginPrompt />}>
  <ProtectedContent />
</AuthenticatedApp>

// Optional authentication (always shows content)
<AuthenticatedApp requireAuth={false}>
  <ContentVisibleToAll />
</AuthenticatedApp>
```

### Authentication State Management

The authentication state is managed using Zustand and includes:

- **User Information**: Current authenticated user data
- **Authentication Status**: Whether a user is authenticated
- **Operation States**: Loading, error, and operation-specific states

You can access the authentication state in any component:

```tsx
import useStore from './store';

function MyComponent() {
  const { user, isAuthenticated } = useStore(state => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated
  }));
  
  return isAuthenticated ? (
    <div>Welcome, {user.displayName || user.username}!</div>
  ) : (
    <div>Please log in</div>
  );
}
```

### WebAuthn Hooks

The system provides several React hooks for authentication operations:

- **useWebAuthnRegistration**: For registering new passkeys
- **useWebAuthnAuthentication**: For authenticating with existing passkeys
- **useAuthVerification**: For verifying authentication status
- **useLogout**: For logging out

Example usage:

```tsx
import { useWebAuthnAuthentication } from './hooks/queries/useWebAuthn';

function LoginComponent() {
  const [username, setUsername] = useState('');
  const authMutation = useWebAuthnAuthentication();
  
  const handleLogin = async () => {
    try {
      await authMutation.mutateAsync({ username });
      // Success - user is now logged in
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    <form onSubmit={handleLogin}>
      {/* Form fields */}
    </form>
  );
}
```

### Troubleshooting

Common issues and solutions:

1. **Browser Compatibility**: Ensure you're using a modern browser that supports WebAuthn (Chrome, Firefox, Safari, Edge).

2. **Registration Fails**:
   - Check if the username is already taken
   - Ensure the browser has permission to use authenticators
   - Try a different authenticator if available

3. **Authentication Fails**:
   - Verify you're using the correct username
   - Ensure you're using the same device/browser used for registration
   - Check if the passkey was removed from your device

4. **Cross-Device Usage**:
   - Passkeys may be synced across devices depending on the platform and settings
   - Some platforms (Apple, Google) support passkey syncing via the cloud
   - For devices without syncing, you may need to register on each device

5. **Server Issues**:
   - Verify the server is properly configured for WebAuthn
   - Check server logs for detailed error messages
   - Ensure the server's origin matches the client's origin
