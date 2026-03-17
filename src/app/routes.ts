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
    Component: AddWalletPage,
  },
  {
    path: '/dashboard',
    Component: DashboardPage,
  },
  {
    path: '/transactions',
    Component: TransactionsPage,
  },
  {
    path: '/categories',
    Component: CategoriesPage,
  },
  {
    path: '/savings',
    Component: SavingsPage,
  },
  {
    path: '/credits',
    Component: CreditsPage,
  },
  {
    path: '/budget',
    Component: BudgetPage,
  },
]);
