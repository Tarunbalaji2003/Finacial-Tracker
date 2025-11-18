# FinanceHub - All-in-One Financial Management App

A comprehensive personal finance management web application with email/password authentication.

## Features

### Core Modules
- **Dashboard** - Monthly spending, budget tracking, income overview
- **Transactions** - Add/edit/delete income & expenses with CSV import/export
- **Budget Manager** - Set category budgets with alerts
- **Goals & SIP Calculator** - Track financial goals with SIP calculations
- **Portfolio Analyzer** - Track mutual funds & investments with returns
- **Loans & EMI** - EMI calculator and loan tracking
- **Expense Sharing** - Split bills with groups (Splitwise-style)
- **Financial Habits** - Track daily habits with streaks
- **Salary Planner** - 50/30/20 rule allocation
- **Reports** - Monthly/yearly reports with charts

### Technical Features
- Email + password authentication (JWT)
- Offline support with IndexedDB
- Mobile-first responsive design
- REST API backend
- Chart.js visualizations

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update JWT_SECRET in `.env` file

4. Start the server:
```bash
npm start
```

5. Open browser: `http://localhost:3000`

## Development

```bash
npm run dev
```

## API Endpoints

### Auth
- POST `/api/auth/signup` - Register new user
- POST `/api/auth/login` - Login user
- POST `/api/auth/reset-password` - Reset password

### Transactions
- GET `/api/transactions` - Get all transactions
- POST `/api/transactions` - Create transaction
- PUT `/api/transactions/:id` - Update transaction
- DELETE `/api/transactions/:id` - Delete transaction

### Budgets
- GET `/api/budgets` - Get budgets
- POST `/api/budgets` - Create budget
- PUT `/api/budgets/:id` - Update budget

### Goals
- GET `/api/goals` - Get goals
- POST `/api/goals` - Create goal
- PUT `/api/goals/:id` - Update goal
- DELETE `/api/goals/:id` - Delete goal

### Portfolio
- GET `/api/portfolio` - Get investments
- POST `/api/portfolio` - Add investment
- DELETE `/api/portfolio/:id` - Delete investment

### Loans
- GET `/api/loans` - Get loans
- POST `/api/loans` - Add loan
- DELETE `/api/loans/:id` - Delete loan

### Groups
- GET `/api/groups` - Get groups
- POST `/api/groups` - Create group
- POST `/api/groups/:id/expenses` - Add group expense

### Habits
- GET `/api/habits` - Get habits
- POST `/api/habits` - Create habit
- POST `/api/habits/:id/complete` - Mark habit complete

### Salary
- GET `/api/salary` - Get salary plan
- POST `/api/salary` - Save salary plan

### Dashboard
- GET `/api/dashboard` - Get dashboard stats

## Production Deployment

1. Replace in-memory database with MongoDB/PostgreSQL
2. Add proper password reset flow with email
3. Set strong JWT_SECRET
4. Enable HTTPS
5. Add rate limiting
6. Configure CORS properly
7. Add input validation
8. Implement proper error handling

## Tech Stack

- **Frontend**: Vanilla JavaScript, Chart.js
- **Backend**: Node.js, Express
- **Auth**: JWT, bcryptjs
- **Storage**: In-memory (replace with DB for production)
- **Offline**: IndexedDB, Service Worker

## License

MIT
