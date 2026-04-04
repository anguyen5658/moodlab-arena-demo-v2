import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppStateProvider } from './state/appState';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppStateProvider>
      <App />
    </AppStateProvider>
  </React.StrictMode>,
);