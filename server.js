const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// In-memory database (replace with real DB in production)
const db = {
  users: [],
  transactions: [],
  budgets: [],
  goals: [],
  portfolio: [],
  loans: [],
  groups: [],
  habits: [],
  salaries: []
};

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  
  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: Date.now().toString(),
    email,
    password: hashedPassword,
    name,
    createdAt: new Date()
  };
  
  db.users.push(user);
  const token = jwt.sign({ userId: user.id }, JWT_SECRET);
  
  res.json({ token, user: { id: user.id, email, name } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email);
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ userId: user.id }, JWT_SECRET);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.post('/api/auth/reset-password', authenticate, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = db.users.find(u => u.id === req.userId);
  
  if (!(await bcrypt.compare(oldPassword, user.password))) {
    return res.status(400).json({ error: 'Invalid old password' });
  }
  
  user.password = await bcrypt.hash(newPassword, 10);
  res.json({ message: 'Password updated' });
});

// Transactions
app.get('/api/transactions', authenticate, (req, res) => {
  const transactions = db.transactions.filter(t => t.userId === req.userId);
  res.json(transactions);
});

app.post('/api/transactions', authenticate, (req, res) => {
  const transaction = {
    id: Date.now().toString(),
    userId: req.userId,
    ...req.body,
    createdAt: new Date()
  };
  db.transactions.push(transaction);
  res.json(transaction);
});

app.put('/api/transactions/:id', authenticate, (req, res) => {
  const index = db.transactions.findIndex(t => t.id === req.params.id && t.userId === req.userId);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  
  db.transactions[index] = { ...db.transactions[index], ...req.body };
  res.json(db.transactions[index]);
});

app.delete('/api/transactions/:id', authenticate, (req, res) => {
  const index = db.transactions.findIndex(t => t.id === req.params.id && t.userId === req.userId);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  
  db.transactions.splice(index, 1);
  res.json({ message: 'Deleted' });
});

// Budgets
app.get('/api/budgets', authenticate, (req, res) => {
  const budgets = db.budgets.filter(b => b.userId === req.userId);
  res.json(budgets);
});

app.post('/api/budgets', authenticate, (req, res) => {
  const budget = {
    id: Date.now().toString(),
    userId: req.userId,
    ...req.body
  };
  db.budgets.push(budget);
  res.json(budget);
});

app.put('/api/budgets/:id', authenticate, (req, res) => {
  const index = db.budgets.findIndex(b => b.id === req.params.id && b.userId === req.userId);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  
  db.budgets[index] = { ...db.budgets[index], ...req.body };
  res.json(db.budgets[index]);
});

// Goals
app.get('/api/goals', authenticate, (req, res) => {
  const goals = db.goals.filter(g => g.userId === req.userId);
  res.json(goals);
});

app.post('/api/goals', authenticate, (req, res) => {
  const goal = {
    id: Date.now().toString(),
    userId: req.userId,
    ...req.body,
    createdAt: new Date()
  };
  db.goals.push(goal);
  res.json(goal);
});

app.put('/api/goals/:id', authenticate, (req, res) => {
  const index = db.goals.findIndex(g => g.id === req.params.id && g.userId === req.userId);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  
  db.goals[index] = { ...db.goals[index], ...req.body };
  res.json(db.goals[index]);
});

app.delete('/api/goals/:id', authenticate, (req, res) => {
  const index = db.goals.findIndex(g => g.id === req.params.id && g.userId === req.userId);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  
  db.goals.splice(index, 1);
  res.json({ message: 'Deleted' });
});

// Portfolio
app.get('/api/portfolio', authenticate, (req, res) => {
  const portfolio = db.portfolio.filter(p => p.userId === req.userId);
  res.json(portfolio);
});

app.post('/api/portfolio', authenticate, (req, res) => {
  const item = {
    id: Date.now().toString(),
    userId: req.userId,
    ...req.body
  };
  db.portfolio.push(item);
  res.json(item);
});

app.delete('/api/portfolio/:id', authenticate, (req, res) => {
  const index = db.portfolio.findIndex(p => p.id === req.params.id && p.userId === req.userId);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  
  db.portfolio.splice(index, 1);
  res.json({ message: 'Deleted' });
});

// Loans
app.get('/api/loans', authenticate, (req, res) => {
  const loans = db.loans.filter(l => l.userId === req.userId);
  res.json(loans);
});

app.post('/api/loans', authenticate, (req, res) => {
  const loan = {
    id: Date.now().toString(),
    userId: req.userId,
    ...req.body
  };
  db.loans.push(loan);
  res.json(loan);
});

app.delete('/api/loans/:id', authenticate, (req, res) => {
  const index = db.loans.findIndex(l => l.id === req.params.id && l.userId === req.userId);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  
  db.loans.splice(index, 1);
  res.json({ message: 'Deleted' });
});

// Groups (Expense Sharing)
app.get('/api/groups', authenticate, (req, res) => {
  const groups = db.groups.filter(g => g.members?.includes(req.userId));
  res.json(groups);
});

app.post('/api/groups', authenticate, (req, res) => {
  const group = {
    id: Date.now().toString(),
    createdBy: req.userId,
    members: [req.userId],
    expenses: [],
    ...req.body
  };
  db.groups.push(group);
  res.json(group);
});

app.post('/api/groups/:id/expenses', authenticate, (req, res) => {
  const group = db.groups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Not found' });
  
  const expense = {
    id: Date.now().toString(),
    paidBy: req.userId,
    ...req.body,
    createdAt: new Date()
  };
  
  group.expenses.push(expense);
  res.json(expense);
});

// Habits
app.get('/api/habits', authenticate, (req, res) => {
  const habits = db.habits.filter(h => h.userId === req.userId);
  res.json(habits);
});

app.post('/api/habits', authenticate, (req, res) => {
  const habit = {
    id: Date.now().toString(),
    userId: req.userId,
    streak: 0,
    completedDates: [],
    ...req.body
  };
  db.habits.push(habit);
  res.json(habit);
});

app.post('/api/habits/:id/complete', authenticate, (req, res) => {
  const habit = db.habits.find(h => h.id === req.params.id && h.userId === req.userId);
  if (!habit) return res.status(404).json({ error: 'Not found' });
  
  const today = new Date().toISOString().split('T')[0];
  if (!habit.completedDates.includes(today)) {
    habit.completedDates.push(today);
    habit.streak++;
  }
  
  res.json(habit);
});

// Salary
app.get('/api/salary', authenticate, (req, res) => {
  const salary = db.salaries.find(s => s.userId === req.userId);
  res.json(salary || null);
});

app.post('/api/salary', authenticate, (req, res) => {
  const existing = db.salaries.findIndex(s => s.userId === req.userId);
  const salary = {
    id: Date.now().toString(),
    userId: req.userId,
    ...req.body
  };
  
  if (existing !== -1) {
    db.salaries[existing] = salary;
  } else {
    db.salaries.push(salary);
  }
  
  res.json(salary);
});

// Dashboard stats
app.get('/api/dashboard', authenticate, (req, res) => {
  const transactions = db.transactions.filter(t => t.userId === req.userId);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  
  const income = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  const expenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  const budgets = db.budgets.filter(b => b.userId === req.userId);
  const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
  
  res.json({
    monthlyIncome: income,
    monthlyExpenses: expenses,
    budgetRemaining: totalBudget - expenses,
    totalBudget,
    transactionCount: monthlyTransactions.length
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`FinanceHub server running on port ${PORT}`);
});
