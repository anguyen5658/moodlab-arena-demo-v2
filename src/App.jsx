import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import { router } from './router/index.jsx';

/**
 * App — top-level. Only renders Provider + RouterProvider.
 * All context consumers live in AppShell (a child of the router).
 */
export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}
