import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import { PERMISSIONS } from '../constants/permissions.js';
import ApplicationDetailsPage from '../features/applications/pages/ApplicationDetailsPage.jsx';
import ApplicationsPage from '../features/applications/pages/ApplicationsPage.jsx';
import CreateApplicationPage from '../features/applications/pages/CreateApplicationPage.jsx';
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import DashboardPage from '../features/dashboard/pages/DashboardPage.jsx';
import PlaceholderPage from '../features/dashboard/pages/PlaceholderPage.jsx';
import PermissionRoute from '../guards/PermissionRoute.jsx';
import ProtectedRoute from '../guards/ProtectedRoute.jsx';
import PublicRoute from '../guards/PublicRoute.jsx';

import ChargesReceipts from '../features/rm/pages/ChargesReceipts.jsx';
import CreateLead from '../features/rm/pages/CreateLead.jsx';
import FieldVisits from '../features/rm/pages/FieldVisits.jsx';
import GeoVerification from '../features/rm/pages/GeoVerification.jsx';
import KycDocuments from '../features/rm/pages/KycDocuments.jsx';
import MyLeads from '../features/rm/pages/MyLeads.jsx';
import PaymentManagement from '../features/rm/pages/PaymentManagement.jsx';
import RMDashboard from '../features/rm/pages/RMDashboard.jsx';
import SubmitToBM from '../features/rm/pages/SubmitToBM.jsx';


import AdminDashboard from '../features/ADMIN/pages/AdminDashboard.jsx';
import RolesAccess from '../features/ADMIN/pages/rolesAccess.jsx';

import BmDashboard from '../features/BM/pages/BmDashboard.jsx'
import BMReview from '../features/BM/pages/BMReview.jsx';
import BMApproved from '../features/BM/pages/BmApproved.jsx';
// import BMReviewQueue from '../features/BM/pages/ReviewQueue.jsx';

const protectedChildren = [
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/applications', element: <ApplicationsPage /> },
  { path: '/applications/create', element: <CreateApplicationPage /> },
  { path: '/applications/:applicationId', element: <ApplicationDetailsPage /> },

  // RM routes (wired to Sidebar.jsx)
  { path: '/rmDashboard', element: <RMDashboard /> },
  { path: '/adminDashboard', element: <AdminDashboard /> },
  { path: '/bmDashboard', element: <BmDashboard /> },
  { path: '/bmReview', element: <BMReview /> },
  {path: "/bmReview/:applicationId", element: <BMReview />,},
  { path: '/roles-access', element: <RolesAccess /> },
  {path: "/bmApproved", element: <BMApproved />,},


  { path: '/my-leads', element: <MyLeads /> },
  { path: '/create-lead', element: <CreateLead /> },
  { path: '/create-lead/:applicationId', element: <CreateLead /> },
  { path: '/customer-visit/:applicationId?', element: <FieldVisits /> },
  { path: '/field-visits/:applicationId', element: <FieldVisits /> },
  { path: '/geo-verification/:applicationId?', element: <GeoVerification /> },
  { path: '/kyc-documents/:applicationId?', element: <KycDocuments /> },

{ path: '/charges-receipts', element: <ChargesReceipts /> },
{ path: '/charges-receipts/:applicationId', element: <ChargesReceipts /> },

 { path: '/payment-management', element: <PaymentManagement /> },
{ path: '/payment-management/:applicationId', element: <PaymentManagement /> },

  { path: '/submit-bm/:applicationId?', element: <SubmitToBM /> },

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
