import { Link } from 'react-router';
import { Wallet, TrendingUp, Shield, PiggyBank } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function StartPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-full">
              <Wallet className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">MyWallet</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Take control of your finances with our comprehensive personal finance management app
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <TrendingUp className="h-10 w-10 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Track Expenses</h3>
            <p className="text-gray-600">
              Monitor your spending across multiple categories and wallets
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <PiggyBank className="h-10 w-10 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Save Money</h3>
            <p className="text-gray-600">
              Set savings goals and track your progress toward financial freedom
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Shield className="h-10 w-10 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Budget Planning</h3>
            <p className="text-gray-600">
              Plan your monthly expenses and stay within your budget
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to="/signup">Create Account</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center text-gray-600">
          <p className="text-sm">
            Support for multiple currencies including USD and UAH 🇺🇦
          </p>
        </div>
      </div>
    </div>
  );
}
