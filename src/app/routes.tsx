import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import ProtectedRoute, { PageFallback } from './components/ProtectedRoute';

const StartPage = lazy(() => import('./pages/StartPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AddWalletPage = lazy(() => import('./pages/AddWalletPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const SavingsPage = lazy(() => import('./pages/SavingsPage'));
const CreditsPage = lazy(() => import('./pages/Credits/CreditsPage'));
const BudgetPage = lazy(() => import('./pages/BudgetPage'));
const SubscriptionsPage = lazy(() => import('./pages/SubscriptionsPage'));
const ArchivePage = lazy(() => import('./pages/ArchivePage'));
const PlannedExpensesPage = lazy(() => import('./pages/PlannedExpensesPage'));
const BudgetAnalyticsPage = lazy(() => import('./pages/BudgetAnalyticsPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Suspense fallback={<PageFallback />}><StartPage /></Suspense>,
  },
  {
    path: '/signup',
    element: <Suspense fallback={<PageFallback />}><SignupPage /></Suspense>,
  },
  {
    path: '/login',
    element: <Suspense fallback={<PageFallback />}><LoginPage /></Suspense>,
  },
  {
    path: '/add-wallet',
    element: <ProtectedRoute><AddWalletPage /></ProtectedRoute>,
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
  },
  {
    path: '/transactions',
    element: <ProtectedRoute><TransactionsPage /></ProtectedRoute>,
  },
  {
    path: '/categories',
    element: <ProtectedRoute><CategoriesPage /></ProtectedRoute>,
  },
  {
    path: '/savings',
    element: <ProtectedRoute><SavingsPage /></ProtectedRoute>,
  },
  {
    path: '/credits',
    element: <ProtectedRoute><CreditsPage /></ProtectedRoute>,
  },
  {
    path: '/budget',
    element: <ProtectedRoute><BudgetPage /></ProtectedRoute>,
  },
  {
    path: '/subscriptions',
    element: <ProtectedRoute><SubscriptionsPage /></ProtectedRoute>,
  },
  {
    path: '/archive',
    element: <ProtectedRoute><ArchivePage /></ProtectedRoute>,
  },
  {
    path: '/planned-expenses',
    element: <ProtectedRoute><PlannedExpensesPage /></ProtectedRoute>,
  },
  {
    path: '/budget/analytics/:categoryId',
    element: <ProtectedRoute><BudgetAnalyticsPage /></ProtectedRoute>,
  },
]);
