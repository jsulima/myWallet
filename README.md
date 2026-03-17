# MyWallet - Personal Finance App

A comprehensive personal finance management application built with React, TypeScript, and Tailwind CSS.

## Features

- 💰 **Multi-Currency Wallet Management** - Support for USD and Ukrainian Hryvnia (UAH)
- 📊 **Transaction Tracking** - Categorized income and expense management
- 🎯 **Savings Goals** - Set and track your financial goals
- 💳 **Credit/Loan Management** - Monitor your debts and payment schedules
- 📅 **Monthly Budget Planning** - Create and manage your monthly budgets
- 🔐 **User Authentication** - Secure signup and login flows
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Navigation and routing
- **Tailwind CSS v4** - Styling
- **Radix UI** - Accessible component primitives
- **Material UI** - Additional UI components
- **Lucide React** - Icons
- **Recharts** - Data visualization

## Getting Started

### Prerequisites

- Node.js 18+ or higher
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd mywallet-finance-app
   ```

2. **Install dependencies**
   
   Using pnpm (recommended):
   ```bash
   pnpm install
   ```
   
   Or using npm:
   ```bash
   npm install
   ```

3. **Start the development server**
   
   Using pnpm:
   ```bash
   pnpm dev
   ```
   
   Or using npm:
   ```bash
   npm run dev
   ```

4. **Open your browser**
   
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

### Build for Production

To create a production build:

Using pnpm:
```bash
pnpm build
```

Or using npm:
```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

To preview the production build locally:

Using pnpm:
```bash
pnpm preview
```

Or using npm:
```bash
npm run preview
```

## Project Structure

```
mywallet-finance-app/
├── src/
│   ├── app/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context for state management
│   │   ├── pages/          # Page components
│   │   ├── routes.ts       # Route configuration
│   │   └── App.tsx         # Main app component
│   ├── styles/             # Global styles and themes
│   └── main.tsx            # Application entry point
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
└── README.md               # This file
```

## Application Flow

1. **Start Page** - Introduction to MyWallet
2. **Signup/Login** - User authentication
3. **Create Wallet** - Set up wallet with currency selection
4. **Dashboard** - Overview of finances with charts and recent transactions
5. **Transactions** - Manage income and expenses
6. **Savings** - Track savings goals
7. **Credits** - Monitor loans and debts
8. **Budget** - Plan monthly budgets
9. **Categories** - Manage transaction categories

## Current State

This is a **frontend mockup** using local state management (React Context). All data is stored in memory and will reset on page refresh. This serves as a comprehensive prototype for the complete user flow.

## Future Enhancements

- Backend integration with a database (e.g., Supabase)
- Persistent data storage
- User authentication with real credentials
- Multi-device synchronization
- Export/import data functionality
- Advanced analytics and insights

## License

This project is private and proprietary.

## Contributing

This is a personal project. If you have suggestions or find bugs, please open an issue.
