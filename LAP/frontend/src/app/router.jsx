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

import RMDashboard from '../features/rm/pages/RMDashboard.jsx';
import MyLeads from '../features/rm/pages/MyLeads.jsx';
import CreateLead from '../features/rm/pages/CreateLead.jsx';
import FieldVisits from '../features/rm/pages/FieldVisits.jsx';
import GeoVerification from '../features/rm/pages/GeoVerification.jsx';
import KycDocuments from '../features/rm/pages/KycDocuments.jsx';
import ChargesReceipts from '../features/rm/pages/ChargesReceipts.jsx';
import PaymentManagement from '../features/rm/pages/PaymentManagement.jsx';
import SubmitToBM from '../features/rm/pages/SubmitToBM.jsx';

const protectedChildren = [
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/applications', element: <ApplicationsPage /> },
  { path: '/applications/create', element: <CreateApplicationPage /> },
  { path: '/applications/:applicationId', element: <ApplicationDetailsPage /> },

  // RM routes (wired to Sidebar.jsx)
  { path: '/rmDashboard', element: <RMDashboard /> },
  { path: '/my-leads', element: <MyLeads /> },
  { path: '/create-lead', element: <CreateLead /> },
  { path: '/customer-visit', element: <FieldVisits /> },
  { path: '/geo-verification', element: <GeoVerification /> },
  { path: '/kyc-documents', element: <KycDocuments /> },
  { path: '/charges-receipts', element: <ChargesReceipts /> },
  { path: '/payment-management', element: <PaymentManagement /> },
  { path: '/submit-bm', element: <SubmitToBM /> },

  ...[
    '/applications/:applicationId/applicants',
    '/applications/:applicationId/visits',
    '/applications/:applicationId/geo',
    '/applications/:applicationId/kyc',
    '/applications/:applicationId/documents',
    '/applications/:applicationId/bm-review',
    '/applications/:applicationId/cm-screening',
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
