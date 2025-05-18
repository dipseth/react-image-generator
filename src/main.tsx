import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Re-enable StrictMode now that we've fixed the Zustand infinite loop issue
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
