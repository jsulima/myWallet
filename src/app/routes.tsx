import { createBrowserRouter } from 'react-router';
import StartPage from './pages/StartPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import AddWalletPage from './pages/AddWalletPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import CategoriesPage from './pages/CategoriesPage';
import SavingsPage from './pages/SavingsPage';
import CreditsPage from './pages/CreditsPage';
import BudgetPage from './pages/BudgetPage';
import ArchivePage from './pages/ArchivePage';
import ProtectedRoute from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: StartPage,
  },
  {
    path: '/signup',
    Component: SignupPage,
  },
  {
    path: '/login',
    Component: LoginPage,
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
    path: '/archive',
    element: <ProtectedRoute><ArchivePage /></ProtectedRoute>,
  },
]);
