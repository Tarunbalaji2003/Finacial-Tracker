// FinanceHub - Main Application
const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('token');
let currentUser = null;

// State
const state = {
    transactions: [],
    budgets: [],
    goals: [],
    portfolio: [],
    loans: [],
    groups: [],
    habits: [],
    salary: null
};

// API Helper
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (!response.ok) throw new Error(await response.text());
    return response.json();
}

// Auth Functions
document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        showApp();
        loadAllData();
    } else {
        showAuth();
    }
    
    initEventListeners();
});

function showAuth() {
    document.getElementById('authScreen').classList.add('active');
    document.getElementById('appScreen').classList.remove('active');
}

function showApp() {
    document.getElementById('authScreen').classList.remove('active');
    document.getElementById('appScreen').classList.add('active');
}

function initEventListeners() {
    // Auth tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}Form`).classList.add('active');
        });
    });
    
    // Auth forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Navigation
    document.querySelectorAll('.nav-item:not(.logout)').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            item.classList.add('active');
            document.getElementById(`${item.dataset.view}View`).classList.add('active');
            
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('active');
            }
        });
    });
    
    // Mobile nav toggle
    document.getElementById('navToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });
    
    // Quick add expense
    document.getElementById('quickAddExpense').addEventListener('click', () => openTransactionModal());
    
    // Transaction buttons
    document.getElementById('addTransactionBtn').addEventListener('click', () => openTransactionModal());
    document.getElementById('importCSV').addEventListener('click', importCSV);
    document.getElementById('exportCSV').addEventListener('click', exportCSV);
    
    // Filters
    document.getElementById('filterType').addEventListener('change', renderTransactions);
    document.getElementById('filterCategory').addEventListener('change', renderTransactions);
    document.getElementById('filterMonth').addEventListener('change', renderTransactions);
    
    // Budget
    document.getElementById('addBudgetBtn').addEventListener('click', () => openBudgetModal());
    
    // Goals
    document.getElementById('calcSIP').addEventListener('click', calculateSIP);
    document.getElementById('addGoalBtn').addEventListener('click', () => openGoalModal());
    
    // Portfolio
    document.getElementById('addPortfolioBtn').addEventListener('click', () => openPortfolioModal());
    
    // Loans
    document.getElementById('calcEMI').addEventListener('click', calculateEMI);
    document.getElementById('addLoanBtn').addEventListener('click', () => openLoanModal());
    
    // Groups
    document.getElementById('addGroupBtn').addEventListener('click', () => openGroupModal());
    
    // Habits
    document.getElementById('addHabitBtn').addEventListener('click', () => openHabitModal());
    
    // Salary
    document.getElementById('saveSalary').addEventListener('click', saveSalary);
    
    // Reports
    document.getElementById('downloadPDF').addEventListener('click', downloadPDF);
    
    // Modal close
    document.querySelector('.close').addEventListener('click', closeModal);
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const data = await apiCall('/auth/login', 'POST', { email, password });
        token = data.token;
        currentUser = data.user;
        localStorage.setItem('token', token);
        showApp();
        loadAllData();
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    try {
        const data = await apiCall('/auth/signup', 'POST', { name, email, password });
        token = data.token;
        currentUser = data.user;
        localStorage.setItem('token', token);
        showApp();
        loadAllData();
    } catch (error) {
        alert('Signup failed: ' + error.message);
    }
}

function handleLogout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    showAuth();
}

// Data Loading
async function loadAllData() {
    try {
        const [transactions, budgets, goals, portfolio, loans, groups, habits, salary, dashboard] = await Promise.all([
            apiCall('/transactions'),
            apiCall('/budgets'),
            apiCall('/goals'),
            apiCall('/portfolio'),
            apiCall('/loans'),
            apiCall('/groups'),
            apiCall('/habits'),
            apiCall('/salary'),
            apiCall('/dashboard')
        ]);
        
        state.transactions = transactions;
        state.budgets = budgets;
        state.goals = goals;
        state.portfolio = portfolio;
        state.loans = loans;
        state.groups = groups;
        state.habits = habits;
        state.salary = salary;
        
        updateDashboard(dashboard);
        renderTransactions();
        renderBudgets();
        renderGoals();
        renderPortfolio();
        renderLoans();
        renderGroups();
        renderHabits();
        renderSalary();
    } catch (error) {
        console.error('Failed to load data:', error);
    }
}

// Dashboard
function updateDashboard(data) {
    document.getElementById('monthlySpending').textContent = formatCurrency(data.monthlyExpenses);
    document.getElementById('budgetRemaining').textContent = formatCurrency(data.budgetRemaining);
    document.getElementById('monthlyIncome').textContent = formatCurrency(data.monthlyIncome);
    
    renderExpenseChart();
}

function renderExpenseChart() {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;
    
    const categories = {};
    state.transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + parseFloat(t.amount);
        });
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Transactions
function renderTransactions() {
    const list = document.getElementById('transactionsList');
    let filtered = [...state.transactions];
    
    const typeFilter = document.getElementById('filterType').value;
    const categoryFilter = document.getElementById('filterCategory').value;
    const monthFilter = document.getElementById('filterMonth').value;
    
    if (typeFilter) filtered = filtered.filter(t => t.type === typeFilter);
    if (categoryFilter) filtered = filtered.filter(t => t.category === categoryFilter);
    if (monthFilter) {
        filtered = filtered.filter(t => t.date.startsWith(monthFilter));
    }
    
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state">No transactions found</div>';
        return;
    }
    
    list.innerHTML = filtered.map(t => `
        <div class="transaction-item">
            <div class="item-info">
                <div class="item-title">${t.description}</div>
                <div class="item-meta">${t.category} • ${formatDate(t.date)}</div>
                ${t.notes ? `<div class="item-meta">${t.notes}</div>` : ''}
            </div>
            <div class="item-amount ${t.type}">${formatCurrency(t.amount)}</div>
            <div class="item-actions">
                <button class="btn-small btn-edit" onclick="editTransaction('${t.id}')">Edit</button>
                <button class="btn-small btn-delete" onclick="deleteTransaction('${t.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function openTransactionModal(transaction = null) {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h3>${transaction ? 'Edit' : 'Add'} Transaction</h3>
        <form class="modal-form" onsubmit="saveTransaction(event, ${transaction ? `'${transaction.id}'` : 'null'})">
            <input type="number" id="txAmount" placeholder="Amount" value="${transaction?.amount || ''}" required>
            <input type="text" id="txDescription" placeholder="Description" value="${transaction?.description || ''}" required>
            <select id="txType" required>
                <option value="income" ${transaction?.type === 'income' ? 'selected' : ''}>Income</option>
                <option value="expense" ${transaction?.type === 'expense' ? 'selected' : ''}>Expense</option>
            </select>
            <select id="txCategory" required>
                <option value="Food">Food</option>
                <option value="Rent">Rent</option>
                <option value="Travel">Travel</option>
                <option value="Petrol">Petrol</option>
                <option value="Bills">Bills</option>
                <option value="Shopping">Shopping</option>
                <option value="Salary">Salary</option>
                <option value="Other">Other</option>
            </select>
            <input type="date" id="txDate" value="${transaction?.date || new Date().toISOString().split('T')[0]}" required>
            <textarea id="txNotes" placeholder="Notes (optional)">${transaction?.notes || ''}</textarea>
            <button type="submit" class="btn-primary">Save</button>
        </form>
    `;
    
    if (transaction) {
        document.getElementById('txCategory').value = transaction.category;
    }
    
    document.getElementById('modal').classList.add('active');
}

async function saveTransaction(e, id) {
    e.preventDefault();
    
    const data = {
        amount: document.getElementById('txAmount').value,
        description: document.getElementById('txDescription').value,
        type: document.getElementById('txType').value,
        category: document.getElementById('txCategory').value,
        date: document.getElementById('txDate').value,
        notes: document.getElementById('txNotes').value
    };
    
    try {
        if (id) {
            await apiCall(`/transactions/${id}`, 'PUT', data);
        } else {
            await apiCall('/transactions', 'POST', data);
        }
        closeModal();
        loadAllData();
    } catch (error) {
        alert('Failed to save transaction: ' + error.message);
    }
}

async function deleteTransaction(id) {
    if (!confirm('Delete this transaction?')) return;
    
    try {
        await apiCall(`/transactions/${id}`, 'DELETE');
        loadAllData();
    } catch (error) {
        alert('Failed to delete: ' + error.message);
    }
}

function editTransaction(id) {
    const transaction = state.transactions.find(t => t.id === id);
    openTransactionModal(transaction);
}

function importCSV() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        const text = await file.text();
        const lines = text.split('\n').slice(1);
        
        for (const line of lines) {
            const [date, description, amount, type, category] = line.split(',');
            if (date && amount) {
                await apiCall('/transactions', 'POST', {
                    date: date.trim(),
                    description: description.trim(),
                    amount: parseFloat(amount.trim()),
                    type: type.trim(),
                    category: category.trim()
                });
            }
        }
        
        loadAllData();
    };
    input.click();
}

function exportCSV() {
    const csv = ['Date,Description,Amount,Type,Category'];
    state.transactions.forEach(t => {
        csv.push(`${t.date},${t.description},${t.amount},${t.type},${t.category}`);
    });
    
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
}

// Budget
function renderBudgets() {
    const list = document.getElementById('budgetList');
    
    if (state.budgets.length === 0) {
        list.innerHTML = '<div class="empty-state">No budgets set</div>';
        return;
    }
    
    list.innerHTML = state.budgets.map(b => {
        const spent = state.transactions
            .filter(t => t.type === 'expense' && t.category === b.category)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        const percentage = (spent / b.amount) * 100;
        const status = percentage > 100 ? 'danger' : percentage > 80 ? 'warning' : '';
        
        return `
            <div class="budget-item">
                <div class="item-info">
                    <div class="item-title">${b.category}</div>
                    <div class="item-meta">Budget: ${formatCurrency(b.amount)} | Spent: ${formatCurrency(spent)}</div>
                    <div class="progress-bar">
                        <div class="progress-fill ${status}" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    ${percentage > 100 ? '<div class="alert alert-danger">Budget exceeded!</div>' : ''}
                    ${percentage > 80 && percentage <= 100 ? '<div class="alert alert-warning">Approaching budget limit</div>' : ''}
                </div>
                <button class="btn-small btn-delete" onclick="deleteBudget('${b.id}')">Delete</button>
            </div>
        `;
    }).join('');
}

function openBudgetModal() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h3>Set Budget</h3>
        <form class="modal-form" onsubmit="saveBudget(event)">
            <select id="budgetCategory" required>
                <option value="Food">Food</option>
                <option value="Rent">Rent</option>
                <option value="Travel">Travel</option>
                <option value="Petrol">Petrol</option>
                <option value="Bills">Bills</option>
                <option value="Shopping">Shopping</option>
                <option value="Other">Other</option>
            </select>
            <input type="number" id="budgetAmount" placeholder="Monthly Budget Amount" required>
            <button type="submit" class="btn-primary">Save</button>
        </form>
    `;
    document.getElementById('modal').classList.add('active');
}

async function saveBudget(e) {
    e.preventDefault();
    
    const data = {
        category: document.getElementById('budgetCategory').value,
        amount: document.getElementById('budgetAmount').value
    };
    
    try {
        await apiCall('/budgets', 'POST', data);
        closeModal();
        loadAllData();
    } catch (error) {
        alert('Failed to save budget: ' + error.message);
    }
}

async function deleteBudget(id) {
    if (!confirm('Delete this budget?')) return;
    
    try {
        await apiCall(`/budgets/${id}`, 'DELETE');
        loadAllData();
    } catch (error) {
        alert('Failed to delete: ' + error.message);
    }
}

// Goals & SIP
function calculateSIP() {
    const monthly = parseFloat(document.getElementById('sipMonthly').value);
    const rate = parseFloat(document.getElementById('sipRate').value) / 100 / 12;
    const months = parseFloat(document.getElementById('sipYears').value) * 12;
    
    if (!monthly || !rate || !months) {
        alert('Please fill all fields');
        return;
    }
    
    const maturity = monthly * (((Math.pow(1 + rate, months) - 1) / rate) * (1 + rate));
    const invested = monthly * months;
    const returns = maturity - invested;
    
    document.getElementById('sipResult').innerHTML = `
        <strong>Maturity Amount:</strong> ${formatCurrency(maturity)}<br>
        <strong>Invested:</strong> ${formatCurrency(invested)}<br>
        <strong>Returns:</strong> ${formatCurrency(returns)}
    `;
}

function renderGoals() {
    const list = document.getElementById('goalsList');
    
    if (state.goals.length === 0) {
        list.innerHTML = '<div class="empty-state">No goals set</div>';
        return;
    }
    
    list.innerHTML = state.goals.map(g => {
        const progress = (g.currentAmount / g.targetAmount) * 100;
        
        return `
            <div class="goal-item">
                <div class="item-info">
                    <div class="item-title">${g.name}</div>
                    <div class="item-meta">Target: ${formatCurrency(g.targetAmount)} | Current: ${formatCurrency(g.currentAmount)}</div>
                    <div class="item-meta">Monthly SIP: ${formatCurrency(g.monthlySIP || 0)}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn-small btn-edit" onclick="updateGoalProgress('${g.id}')">Update</button>
                    <button class="btn-small btn-delete" onclick="deleteGoal('${g.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function openGoalModal() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h3>Add Goal</h3>
        <form class="modal-form" onsubmit="saveGoal(event)">
            <input type="text" id="goalName" placeholder="Goal Name (e.g., Buy House)" required>
            <input type="number" id="goalTarget" placeholder="Target Amount" required>
            <input type="number" id="goalCurrent" placeholder="Current Amount" value="0" required>
            <input type="number" id="goalMonths" placeholder="Months to Achieve" required>
            <input type="number" id="goalRate" placeholder="Expected Return (%)" value="12" required>
            <button type="submit" class="btn-primary">Calculate & Save</button>
        </form>
    `;
    document.getElementById('modal').classList.add('active');
}

async function saveGoal(e) {
    e.preventDefault();
    
    const target = parseFloat(document.getElementById('goalTarget').value);
    const current = parseFloat(document.getElementById('goalCurrent').value);
    const months = parseFloat(document.getElementById('goalMonths').value);
    const rate = parseFloat(document.getElementById('goalRate').value) / 100 / 12;
    
    const remaining = target - current;
    const monthlySIP = remaining / (((Math.pow(1 + rate, months) - 1) / rate) * (1 + rate));
    
    const data = {
        name: document.getElementById('goalName').value,
        targetAmount: target,
        currentAmount: current,
        months: months,
        monthlySIP: monthlySIP
    };
    
    try {
        await apiCall('/goals', 'POST', data);
        closeModal();
        loadAllData();
    } catch (error) {
        alert('Failed to save goal: ' + error.message);
    }
}

function updateGoalProgress(id) {
    const goal = state.goals.find(g => g.id === id);
    const amount = prompt('Enter current amount:', goal.currentAmount);
    
    if (amount !== null) {
        apiCall(`/goals/${id}`, 'PUT', { currentAmount: parseFloat(amount) })
            .then(() => loadAllData())
            .catch(err => alert('Failed to update: ' + err.message));
    }
}

async function deleteGoal(id) {
    if (!confirm('Delete this goal?')) return;
    
    try {
        await apiCall(`/goals/${id}`, 'DELETE');
        loadAllData();
    } catch (error) {
        alert('Failed to delete: ' + error.message);
    }
}

// Portfolio
function renderPortfolio() {
    const list = document.getElementById('portfolioList');
    
    if (state.portfolio.length === 0) {
        list.innerHTML = '<div class="empty-state">No investments added</div>';
        return;
    }
    
    list.innerHTML = state.portfolio.map(p => {
        const currentValue = p.units * p.currentPrice;
        const invested = p.units * p.buyPrice;
        const returns = ((currentValue - invested) / invested) * 100;
        
        return `
            <div class="transaction-item">
                <div class="item-info">
                    <div class="item-title">${p.name}</div>
                    <div class="item-meta">Units: ${p.units} | Buy: ${formatCurrency(p.buyPrice)} | Current: ${formatCurrency(p.currentPrice)}</div>
                    <div class="item-meta">Risk: ${p.risk || 'Medium'}</div>
                </div>
                <div>
                    <div class="item-amount ${returns >= 0 ? 'income' : 'expense'}">${returns.toFixed(2)}%</div>
                    <div class="item-meta">${formatCurrency(currentValue)}</div>
                </div>
                <button class="btn-small btn-delete" onclick="deletePortfolio('${p.id}')">Delete</button>
            </div>
        `;
    }).join('');
    
    renderPortfolioChart();
}

function renderPortfolioChart() {
    const ctx = document.getElementById('portfolioChart');
    if (!ctx || state.portfolio.length === 0) return;
    
    const data = state.portfolio.map(p => ({
        name: p.name,
        value: p.units * p.currentPrice
    }));
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                data: data.map(d => d.value),
                backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
            }]
        }
    });
}

function openPortfolioModal() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h3>Add Investment</h3>
        <form class="modal-form" onsubmit="savePortfolio(event)">
            <input type="text" id="portName" placeholder="Fund/Investment Name" required>
            <input type="number" id="portUnits" placeholder="Units" required>
            <input type="number" id="portBuyPrice" placeholder="Buy Price" required>
            <input type="number" id="portCurrentPrice" placeholder="Current Price" required>
            <select id="portRisk" required>
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
            </select>
            <input type="date" id="portDate" required>
            <button type="submit" class="btn-primary">Save</button>
        </form>
    `;
    document.getElementById('modal').classList.add('active');
}

async function savePortfolio(e) {
    e.preventDefault();
    
    const data = {
        name: document.getElementById('portName').value,
        units: parseFloat(document.getElementById('portUnits').value),
        buyPrice: parseFloat(document.getElementById('portBuyPrice').value),
        currentPrice: parseFloat(document.getElementById('portCurrentPrice').value),
        risk: document.getElementById('portRisk').value,
        date: document.getElementById('portDate').value
    };
    
    try {
        await apiCall('/portfolio', 'POST', data);
        closeModal();
        loadAllData();
    } catch (error) {
        alert('Failed to save: ' + error.message);
    }
}

async function deletePortfolio(id) {
    if (!confirm('Delete this investment?')) return;
    
    try {
        await apiCall(`/portfolio/${id}`, 'DELETE');
        loadAllData();
    } catch (error) {
        alert('Failed to delete: ' + error.message);
    }
}

// Loans & EMI
function calculateEMI() {
    const principal = parseFloat(document.getElementById('loanAmount').value);
    const rate = parseFloat(document.getElementById('loanRate').value) / 100 / 12;
    const tenure = parseFloat(document.getElementById('loanTenure').value);
    
    if (!principal || !rate || !tenure) {
        alert('Please fill all fields');
        return;
    }
    
    const emi = (principal * rate * Math.pow(1 + rate, tenure)) / (Math.pow(1 + rate, tenure) - 1);
    const total = emi * tenure;
    const interest = total - principal;
    
    document.getElementById('emiResult').innerHTML = `
        <strong>Monthly EMI:</strong> ${formatCurrency(emi)}<br>
        <strong>Total Payment:</strong> ${formatCurrency(total)}<br>
        <strong>Total Interest:</strong> ${formatCurrency(interest)}
    `;
}

function renderLoans() {
    const list = document.getElementById('loansList');
    
    if (state.loans.length === 0) {
        list.innerHTML = '<div class="empty-state">No loans added</div>';
        return;
    }
    
    list.innerHTML = state.loans.map(l => {
        const progress = ((l.amount - l.outstanding) / l.amount) * 100;
        
        return `
            <div class="loan-item">
                <div class="item-info">
                    <div class="item-title">${l.name}</div>
                    <div class="item-meta">EMI: ${formatCurrency(l.emi)} | Rate: ${l.rate}%</div>
                    <div class="item-meta">Outstanding: ${formatCurrency(l.outstanding)} / ${formatCurrency(l.amount)}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                <button class="btn-small btn-delete" onclick="deleteLoan('${l.id}')">Delete</button>
            </div>
        `;
    }).join('');
}

function openLoanModal() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h3>Add Loan</h3>
        <form class="modal-form" onsubmit="saveLoan(event)">
            <input type="text" id="loanName" placeholder="Loan Name" required>
            <input type="number" id="loanAmt" placeholder="Loan Amount" required>
            <input type="number" id="loanEMI" placeholder="Monthly EMI" required>
            <input type="number" id="loanRt" placeholder="Interest Rate (%)" required>
            <input type="number" id="loanOutstanding" placeholder="Outstanding Amount" required>
            <button type="submit" class="btn-primary">Save</button>
        </form>
    `;
    document.getElementById('modal').classList.add('active');
}

async function saveLoan(e) {
    e.preventDefault();
    
    const data = {
        name: document.getElementById('loanName').value,
        amount: parseFloat(document.getElementById('loanAmt').value),
        emi: parseFloat(document.getElementById('loanEMI').value),
        rate: parseFloat(document.getElementById('loanRt').value),
        outstanding: parseFloat(document.getElementById('loanOutstanding').value)
    };
    
    try {
        await apiCall('/loans', 'POST', data);
        closeModal();
        loadAllData();
    } catch (error) {
        alert('Failed to save loan: ' + error.message);
    }
}

async function deleteLoan(id) {
    if (!confirm('Delete this loan?')) return;
    
    try {
        await apiCall(`/loans/${id}`, 'DELETE');
        loadAllData();
    } catch (error) {
        alert('Failed to delete: ' + error.message);
    }
}

// Groups (Expense Sharing)
function renderGroups() {
    const list = document.getElementById('groupsList');
    
    if (state.groups.length === 0) {
        list.innerHTML = '<div class="empty-state">No groups created</div>';
        return;
    }
    
    list.innerHTML = state.groups.map(g => {
        const totalExpenses = g.expenses?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
        
        return `
            <div class="group-card">
                <div class="group-header">
                    <h3>${g.name}</h3>
                    <button class="btn-small btn-primary" onclick="addGroupExpense('${g.id}')">Add Expense</button>
                </div>
                <div class="item-meta">Members: ${g.members?.length || 0} | Total: ${formatCurrency(totalExpenses)}</div>
                <div class="expense-list">
                    ${g.expenses?.map(e => `
                        <div class="expense-item">
                            <span>${e.description}</span>
                            <span>${formatCurrency(e.amount)}</span>
                        </div>
                    `).join('') || '<p>No expenses yet</p>'}
                </div>
                ${renderBalances(g)}
            </div>
        `;
    }).join('');
}

function renderBalances(group) {
    if (!group.expenses || group.expenses.length === 0) return '';
    
    const balances = {};
    const members = group.members || [];
    
    members.forEach(m => balances[m] = 0);
    
    group.expenses.forEach(e => {
        const perPerson = e.amount / members.length;
        balances[e.paidBy] += e.amount - perPerson;
        members.forEach(m => {
            if (m !== e.paidBy) balances[m] -= perPerson;
        });
    });
    
    return `
        <div class="balance-summary">
            <h4>Balances</h4>
            ${Object.entries(balances).map(([member, amount]) => `
                <div>${member}: ${amount >= 0 ? 'Gets' : 'Owes'} ${formatCurrency(Math.abs(amount))}</div>
            `).join('')}
        </div>
    `;
}

function openGroupModal() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h3>Create Group</h3>
        <form class="modal-form" onsubmit="saveGroup(event)">
            <input type="text" id="groupName" placeholder="Group Name" required>
            <textarea id="groupMembers" placeholder="Member IDs (comma separated)" required></textarea>
            <button type="submit" class="btn-primary">Create</button>
        </form>
    `;
    document.getElementById('modal').classList.add('active');
}

async function saveGroup(e) {
    e.preventDefault();
    
    const members = document.getElementById('groupMembers').value.split(',').map(m => m.trim());
    
    const data = {
        name: document.getElementById('groupName').value,
        members: members
    };
    
    try {
        await apiCall('/groups', 'POST', data);
        closeModal();
        loadAllData();
    } catch (error) {
        alert('Failed to create group: ' + error.message);
    }
}

function addGroupExpense(groupId) {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h3>Add Group Expense</h3>
        <form class="modal-form" onsubmit="saveGroupExpense(event, '${groupId}')">
            <input type="text" id="expDescription" placeholder="Description" required>
            <input type="number" id="expAmount" placeholder="Amount" required>
            <button type="submit" class="btn-primary">Add</button>
        </form>
    `;
    document.getElementById('modal').classList.add('active');
}

async function saveGroupExpense(e, groupId) {
    e.preventDefault();
    
    const data = {
        description: document.getElementById('expDescription').value,
        amount: parseFloat(document.getElementById('expAmount').value)
    };
    
    try {
        await apiCall(`/groups/${groupId}/expenses`, 'POST', data);
        closeModal();
        loadAllData();
    } catch (error) {
        alert('Failed to add expense: ' + error.message);
    }
}

// Habits
function renderHabits() {
    const list = document.getElementById('habitsList');
    
    if (state.habits.length === 0) {
        list.innerHTML = '<div class="empty-state">No habits tracked</div>';
        return;
    }
    
    list.innerHTML = state.habits.map(h => {
        const today = new Date().toISOString().split('T')[0];
        const completedToday = h.completedDates?.includes(today);
        
        return `
            <div class="habit-item">
                <div class="item-info">
                    <div class="item-title">${h.name}</div>
                    <div class="item-meta">Streak: ${h.streak || 0} days</div>
                </div>
                <button class="btn-small ${completedToday ? 'btn-secondary' : 'btn-primary'}" 
                        onclick="completeHabit('${h.id}')" 
                        ${completedToday ? 'disabled' : ''}>
                    ${completedToday ? '✓ Done' : 'Mark Done'}
                </button>
            </div>
        `;
    }).join('');
}

function openHabitModal() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h3>Add Habit</h3>
        <form class="modal-form" onsubmit="saveHabit(event)">
            <input type="text" id="habitName" placeholder="Habit Name (e.g., Daily Savings)" required>
            <button type="submit" class="btn-primary">Save</button>
        </form>
    `;
    document.getElementById('modal').classList.add('active');
}

async function saveHabit(e) {
    e.preventDefault();
    
    const data = {
        name: document.getElementById('habitName').value
    };
    
    try {
        await apiCall('/habits', 'POST', data);
        closeModal();
        loadAllData();
    } catch (error) {
        alert('Failed to save habit: ' + error.message);
    }
}

async function completeHabit(id) {
    try {
        await apiCall(`/habits/${id}/complete`, 'POST');
        loadAllData();
    } catch (error) {
        alert('Failed to complete habit: ' + error.message);
    }
}

// Salary Planner
function renderSalary() {
    const breakdown = document.getElementById('salaryBreakdown');
    
    if (!state.salary) {
        breakdown.innerHTML = '<div class="empty-state">No salary plan set</div>';
        return;
    }
    
    const s = state.salary;
    const needs = (s.amount * s.needsPercent) / 100;
    const wants = (s.amount * s.wantsPercent) / 100;
    const savings = (s.amount * s.savingsPercent) / 100;
    
    breakdown.innerHTML = `
        <h3>Monthly Breakdown</h3>
        <div class="stat-card">
            <h4>Needs (${s.needsPercent}%)</h4>
            <p class="stat-value">${formatCurrency(needs)}</p>
        </div>
        <div class="stat-card">
            <h4>Wants (${s.wantsPercent}%)</h4>
            <p class="stat-value">${formatCurrency(wants)}</p>
        </div>
        <div class="stat-card">
            <h4>Savings (${s.savingsPercent}%)</h4>
            <p class="stat-value income">${formatCurrency(savings)}</p>
        </div>
    `;
}

async function saveSalary() {
    const data = {
        amount: parseFloat(document.getElementById('salaryAmount').value),
        needsPercent: parseFloat(document.getElementById('needsPercent').value),
        wantsPercent: parseFloat(document.getElementById('wantsPercent').value),
        savingsPercent: parseFloat(document.getElementById('savingsPercent').value)
    };
    
    if (data.needsPercent + data.wantsPercent + data.savingsPercent !== 100) {
        alert('Percentages must add up to 100%');
        return;
    }
    
    try {
        await apiCall('/salary', 'POST', data);
        loadAllData();
    } catch (error) {
        alert('Failed to save salary plan: ' + error.message);
    }
}

// Reports
function downloadPDF() {
    const report = generateReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financial-report.txt';
    a.click();
}

function generateReport() {
    const income = state.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const expenses = state.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return `
FINANCIAL REPORT
Generated: ${new Date().toLocaleDateString()}

SUMMARY
Total Income: ${formatCurrency(income)}
Total Expenses: ${formatCurrency(expenses)}
Net Savings: ${formatCurrency(income - expenses)}

TRANSACTIONS: ${state.transactions.length}
BUDGETS: ${state.budgets.length}
GOALS: ${state.goals.length}
INVESTMENTS: ${state.portfolio.length}
LOANS: ${state.loans.length}
    `.trim();
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

// Offline Support with IndexedDB
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// Save to IndexedDB for offline
function saveOffline() {
    if (!window.indexedDB) return;
    
    const request = indexedDB.open('FinanceHub', 1);
    
    request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('data')) {
            db.createObjectStore('data');
        }
    };
    
    request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('data', 'readwrite');
        const store = tx.objectStore('data');
        store.put(state, 'appState');
    };
}

// Auto-save every 30 seconds
setInterval(saveOffline, 30000);
