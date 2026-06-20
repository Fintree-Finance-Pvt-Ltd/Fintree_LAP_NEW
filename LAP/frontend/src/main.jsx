import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './app/providers.jsx';
import { router } from './app/router.jsx';
import ToastRoot from './toast/ToastRoot.jsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProviders>
      <ToastRoot />
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>
);

