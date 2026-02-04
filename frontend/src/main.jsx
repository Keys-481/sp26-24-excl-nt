/**
 * Entry point of the React application.
 * Renders the root component <App /> inside a <StrictMode> wrapper
 * to help identify potential problems in the application.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthProvider';

// Create a root and render the App component into the #root DOM element
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
