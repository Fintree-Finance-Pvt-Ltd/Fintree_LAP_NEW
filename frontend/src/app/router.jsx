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
import RoleDashboardRedirect from '../components/layout/RoleDashboardRedirect.jsx';

import AdminDashboard from '../features/ADMIN/pages/AdminDashboard.jsx';
import RolesAccess from '../features/ADMIN/pages/rolesAccess.jsx';

import BmDashboard from '../features/BM/pages/BmDashboard.jsx'
import BMReview from '../features/BM/pages/BMReview.jsx';
import BMApproved from '../features/BM/pages/BmApproved.jsx';
import ChargesApproved from '../features/BM/pages/ChargesApproved.jsx';

import CmPreliminaryCreditScreening from "../features/credit/pages/CmPreliminaryCreditScreening.jsx";
import CreditManagerDashboard from '../features/credit/pages/CreditManagerDashboard.jsx';
import CMApplicationData from "../features/credit/pages/CMApplicationData.jsx";
import CreditMakerProposal from "../features/credit/pages/CreditMakerProposal.jsx";
import CreditCheckerReview from "../features/credit/pages/CreditCheckerReview.jsx";

import ValuationDashboard from "../features/valuation/pages/ValuationDashboard.jsx";
import ValuationPage from "../features/valuation/pages/ValuationPage.jsx";

// Legal Dashboard
import LegalDashboard from "../features/Legal/pages/LegalDashboard.jsx";
import LegalQueue from "../features/Legal/pages/LegalQueue.jsx";

import LmsLoanAccounts from "../features/lms/pages/LmsLoanAccounts.jsx";
import LmsDisbursements from "../features/lms/pages/LmsDisbursements.jsx";
import LmsRepayments from "../features/lms/pages/LmsRepayments.jsx";
import LmsUtrUpload from "../features/lms/pages/LmsUtrUpload.jsx";
import LmsNach from "../features/lms/pages/LmsNach.jsx";

import LmsCollections from "../features/lms/pages/LmsCollections.jsx";


// import BMReviewQueue from '../features/BM/pages/ReviewQueue.jsx';

/*Operations pages */
import OperationsDashboard from '../features/OPERATION/pages/OperationsDashboard.jsx';
import OpsChecker from "../features/OPERATION/pages/OpsChecker.jsx";
import OpsMaker from "../features/OPERATION/pages/OpsMaker.jsx";
// MIS Reports
import MISReports from "../features/applications/pages/MISReports.jsx";
import OPSReview from '../features/Operation/pages/OpsReview.jsx';
import LegalCleared from '../features/Operation/pages/LegalCleared.jsx';
import OpsHead from '../features/Operation/pages/OpsHead.jsx';


import LmsDashboard from "../features/lms/pages/LmsDashboard.jsx";

const protectedChildren = [
  { path: '/dashboard', element: <RoleDashboardRedirect /> },
  { path: '/applications', element: <ApplicationsPage /> },
  { path: '/applications/create', element: <CreateApplicationPage /> },
  { path: '/applications/:applicationId', element: <ApplicationDetailsPage /> },

  // RM routes (wired to Sidebar.jsx)
  { path: '/rmDashboard', element: <RMDashboard /> },
  { path: '/adminDashboard', element: <AdminDashboard /> },

  // BM routes (wired to Sidebar.jsx)
  { path: '/bmDashboard', element: <BmDashboard /> },
  { path: '/bmReview', element: <BMReview /> },
  { path: "/bmReview/:applicationId", element: <BMReview />, },
  { path: '/roles-access', element: <RolesAccess /> },
  { path: "/bmApproved", element: <BMApproved />, },
  { path: "/chargesApproved", element: <ChargesApproved />, },

  // Operations routes
  {path: "/operationsDashboard", element: <OperationsDashboard />,},
  {path: "/operations/maker/:applicationId", element: <OpsMaker />,},
  {path: "/operations/checker/:applicationId", element: <OpsChecker />,},
  {
  path : "/operations/legal-cleared",
  element: <LegalCleared/>,
},

  {path: "/operations/head/:applicationId", element: <OpsHead />,},
  // Common MIS and reports route
  { path: "/reports",element: <MISReports />, },

  {path: "/operations-review", element: <OPSReview />, },

  { path: "/field-visits", element: <FieldVisits /> },
  { path: "/field-visits/:applicationId", element: <FieldVisits /> },
  { path: "/field-visits/:applicationId", element: <FieldVisits /> },

  { path: "/geo-verification", element: <GeoVerification /> },
  { path: "/geo-verification/:applicationId", element: <GeoVerification /> },

  { path: "/geo-verification/:applicationId?", element: <GeoVerification /> },
  // Credit Manager routes

  { path: '/credit-dashboard', element: <CreditManagerDashboard /> },
  { path: '/credit/maker', element: <CreditManagerDashboard /> },
  { path: '/credit/checker', element: <CreditManagerDashboard /> },
  { path: "/cm-screening", element: <CmPreliminaryCreditScreening /> },
  { path: "/cm-screening/:applicationId", element: <CmPreliminaryCreditScreening /> },
  { path: "/cm-application-data", element: <CMApplicationData /> },
  { path: "/cm-application-data/:applicationId", element: <CMApplicationData /> },
  { path: "/credit-maker", element: <CreditMakerProposal /> },
  { path: "/credit-maker/:applicationId", element: <CreditMakerProposal /> },
  { path: "/credit-checker", element: <CreditCheckerReview /> },
  { path: "/credit-checker/:applicationId", element: <CreditCheckerReview /> },

  // Legal Officer route
  { path: "/legal-dashboard", element: <LegalDashboard /> },
  { path: "/legal-queue", element: <LegalQueue /> },


  // valuation 
  { path: "/valuation-dashboard", element: <ValuationDashboard /> },
  { path: "/valuation", element: <ValuationPage /> },
  { path: "/valuation/:applicationId", element: <ValuationPage /> },

  // LMS routes
  { path: "/lms-dashboard", element: <LmsDashboard /> },
{ path: "/lms/loan-accounts", element: <LmsLoanAccounts /> },
{ path: "/lms/disbursements", element: <LmsDisbursements /> },
{ path: "/lms/repayments", element: <LmsRepayments /> },
{ path: "/lms/utr-upload", element: <LmsUtrUpload /> },
{ path: "/lms/nach", element: <LmsNach /> },
// { path: "/lms/soa", element: <LmsSoa /> },
{ path: "/lms/collections", element: <LmsCollections /> },
// { path: "/lms/reports", element: <LmsReports /> },




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
    '/operations/head',
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
