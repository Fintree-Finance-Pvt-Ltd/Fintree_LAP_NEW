import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import AppLayout from '../components/layout/AppLayout.jsx';
import ProtectedRoute from '../guards/ProtectedRoute.jsx';
import PublicRoute from '../guards/PublicRoute.jsx';
import PermissionRoute from '../guards/PermissionRoute.jsx';
import { PERMISSIONS } from '../constants/permissions.js';
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import DashboardPage from '../features/dashboard/pages/DashboardPage.jsx';
import ApplicationsPage from '../features/applications/pages/ApplicationsPage.jsx';
import CreateApplicationPage from '../features/applications/pages/CreateApplicationPage.jsx';
import ApplicationDetailsPage from '../features/applications/pages/ApplicationDetailsPage.jsx';
import PlaceholderPage from '../features/dashboard/pages/PlaceholderPage.jsx';

const protectedChildren = [
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/applications', element: <ApplicationsPage /> },
  { path: '/applications/create', element: <CreateApplicationPage /> },
  { path: '/applications/:applicationId', element: <ApplicationDetailsPage /> },
  ...[
    '/applications/:applicationId/applicants',
    '/applications/:applicationId/visits',
    '/applications/:applicationId/geo',
    '/applications/:applicationId/kyc',
    '/applications/:applicationId/documents',
    '/applications/:applicationId/bm-review',
    '/applications/:applicationId/cm-screening',
    '/applications/:applicationId/bureau',
    '/applications/:applicationId/banking',
    '/applications/:applicationId/credit',
    '/applications/:applicationId/legal',
    '/applications/:applicationId/valuation',
    '/applications/:applicationId/fees',
    '/applications/:applicationId/payments',
    '/applications/:applicationId/sanction',
    '/applications/:applicationId/pdd',
    '/applications/:applicationId/disbursement',
    '/credit/maker',
    '/credit/checker',
    '/operations/maker',
    '/operations/checker',
    '/payments/reconciliation',
    '/loan-accounts',
    '/loan-accounts/:lan',
    '/loan-accounts/:lan/schedule',
    '/loan-accounts/:lan/transactions',
    '/loan-accounts/:lan/collections',
    '/loan-accounts/:lan/closure',
    '/users',
    '/roles',
    '/organization',
    '/product-policy',
    '/integrations',
    '/reports',
    '/audit'
  ].map((path) => ({ path, element: <PlaceholderPage /> }))
];

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [{ element: <AuthLayout />, children: [{ path: '/login', element: <LoginPage /> }] }]
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          ...protectedChildren,
          {
            element: <PermissionRoute permission={PERMISSIONS.AUDIT_READ} />,
            children: [{ path: '/secure/audit', element: <PlaceholderPage title="Audit" /> }]
          }
        ]
      }
    ]
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> }
]);
