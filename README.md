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
- **Lucide React** - Icons
- **Recharts** - Data visualization
- **Fetch API** - Backend communication
- **JWT** - Authentication persistence

## Getting Started

### Prerequisites

- Node.js 18+
- **myWallet Backend API** running on `http://localhost:4000`

### Installation

1. **Clone the repository**
   ```bash
   cd myWallet
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## Project Structure

```
myWallet/
├── src/
│   ├── app/
│   │   ├── components/     # UI & Layout components
│   │   ├── context/        # AppContext for global state & API calls
│   │   ├── pages/          # Page components
│   │   ├── services/       # api.ts (backend wrapper)
│   │   ├── routes.tsx      # Route configuration (Protected)
│   │   └── App.tsx         # Main app component
│   └── main.tsx            # Entry point
```

## Application Flow

1. **Start Page** - Introduction to MyWallet
2. **Signup/Login** - Real JWT-based authentication
3. **Dashboard** - Real-time financial overview
4. **Transactions** - CRUD with automated balance updates
5. **Budgets/Savings/Credits** - Fully integrated tracking

## Current State

The application is **fully integrated with the backend**. Local state is synchronized with the PostgreSQL database via the Node.js API. Authentication persists via JWT in localStorage.

## License

This project is private and proprietary.

This project is private and proprietary.

## Contributing

This is a personal project. If you have suggestions or find bugs, please open an issue.
