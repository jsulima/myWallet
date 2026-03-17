import { Link, useNavigate } from 'react-router';
import { 
  Wallet, 
  LayoutDashboard, 
  Receipt, 
  Tag, 
  PiggyBank, 
  CreditCard, 
  Calendar,
  LogOut
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { user, logout } = useApp();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/transactions', icon: Receipt, label: 'Transactions' },
    { to: '/categories', icon: Tag, label: 'Categories' },
    { to: '/savings', icon: PiggyBank, label: 'Savings' },
    { to: '/credits', icon: CreditCard, label: 'Credits' },
    { to: '/budget', icon: Calendar, label: 'Budget' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-full">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">MyWallet</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:inline">
                {user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow p-4 sticky top-6">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Mobile Navigation */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
            <div className="grid grid-cols-6 gap-1 p-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center gap-1 py-2 text-gray-600 hover:text-indigo-600"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 pb-20 md:pb-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
