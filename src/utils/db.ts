/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Habit,
  Goal,
  HealthRecord,
  Meal,
  PregnancyRecord,
  FamilyMember,
  Transaction,
  Budget,
  Company,
  Employee,
  Payroll,
  Product,
  Inventory,
  Customer,
  Sale,
  Report,
  AiHistory,
  Notification,
  Subscription,
  Profile,
  EBook,
  EmergencyFund,
  Debt,
  FinancialCard,
  PaidDebtLog,
  DashboardType,
  CalendarEvent,
  WallpaperConfig,
  WeeklyRoutineState,
  WeeklyRoutineTask,
  WeeklyDayRoutine
} from '../types/schema';

// Helper to generate UUIDs
const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Isolated User Default Initializers (Clean Empty States for Every New Account)
export const createDefaultProfile = (userId?: string, email?: string, fullName?: string): Profile => ({
  id: userId || 'user-anonymous',
  updated_at: new Date().toISOString(),
  username: email ? email.split('@')[0] : 'user',
  full_name: fullName || '',
  avatar_url: '',
  role: 'owner',
});

export const createDefaultSubscription = (userId?: string): Subscription => ({
  id: uuid(),
  user_id: userId || 'user-anonymous',
  status: 'active',
  price_id: 'free_starter',
  cancel_at_period_end: false,
  current_period_start: new Date().toISOString(),
  current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  tier_name: 'Free',
});

export const createDefaultEmergencyFund = (userId?: string): EmergencyFund => ({
  id: uuid(),
  user_id: userId || 'user-anonymous',
  target_amount: 0,
  current_balance: 0,
  deadline: '',
  purpose: 'unexpected',
  notes: '',
  created_at: new Date().toISOString(),
});

// Pristine Empty Defaults for New Users (Zero Inherited Data)
const DEFAULT_HABITS: Habit[] = [];
const DEFAULT_GOALS: Goal[] = [];
const DEFAULT_HEALTH: HealthRecord[] = [];
const DEFAULT_PREGNANCY: PregnancyRecord[] = [];
const DEFAULT_MEALS: Meal[] = [];
const DEFAULT_FAMILY: FamilyMember[] = [];
const DEFAULT_TRANSACTIONS: Transaction[] = [];
const DEFAULT_BUDGETS: Budget[] = [];
const DEFAULT_COMPANIES: Company[] = [];
const DEFAULT_EMPLOYEES: Employee[] = [];
const DEFAULT_PAYROLL: Payroll[] = [];
const DEFAULT_PRODUCTS: Product[] = [];
const DEFAULT_INVENTORY: Inventory[] = [];
const DEFAULT_CUSTOMERS: Customer[] = [];
const DEFAULT_SALES: Sale[] = [];
const DEFAULT_REPORTS: Report[] = [];
const DEFAULT_AI_HISTORY: AiHistory[] = [];
const DEFAULT_NOTIFICATIONS: Notification[] = [];
const DEFAULT_DEBTS: Debt[] = [];
const DEFAULT_CARDS: FinancialCard[] = [];
const DEFAULT_PAID_DEBTS: PaidDebtLog[] = [];
const DEFAULT_CALENDAR_EVENTS: CalendarEvent[] = [];

const DEFAULT_WALLPAPER_CONFIG: WallpaperConfig = {
  theme: 'midnight_gold',
  template: 'daily_dashboard',
  mode: 'balanced',
  showNetWorth: true,
  showBalance: true,
  showIncome: true,
  showExpenses: true,
  showSavingsGoal: true,
  showHabitStreak: true,
  showQuote: true,
  showUserTag: true,
  showUpcomingEvents: true,
  showPaycheckCountdown: true,
  showTodayFocus: true,
  showDailyTracking: true,
  selectedHabitIds: [],
  maskPrivateData: false,
  autoUpdate: true,
  updateFrequency: 'data_change',
  customFocusText: ''
};

// Database Init & Storage Layer with Strict User-Level Scoping & Isolation
export class LocalDatabase {
  private static currentUserId: string | null = null;
  private static currentUserEmail: string | null = null;
  private static currentUserName: string | null = null;
  private static memoryStore = new Map<string, string>();

  /**
   * Set the active authenticated Supabase user ID and credentials.
   * Switches the local database storage namespace immediately to ensure 100% data isolation.
   */
  static setCurrentUser(user: { id: string; email?: string | null; full_name?: string | null } | null): void {
    if (user && user.id) {
      this.currentUserId = user.id;
      this.currentUserEmail = user.email || null;
      this.currentUserName = user.full_name || null;
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.setItem('life4billion_active_uid', user.id);
          if (user.email) sessionStorage.setItem('life4billion_active_email', user.email);
          if (user.full_name) sessionStorage.setItem('life4billion_active_name', user.full_name);
        } catch {
          // ignore session storage restrictions
        }
      }
    } else {
      this.currentUserId = null;
      this.currentUserEmail = null;
      this.currentUserName = null;
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.removeItem('life4billion_active_uid');
          sessionStorage.removeItem('life4billion_active_email');
          sessionStorage.removeItem('life4billion_active_name');
        } catch {
          // ignore
        }
      }
    }

    // Trigger sync event to re-render all subscribers with the user's isolated data
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('life4billion_user_switched', { detail: { userId: this.currentUserId } }));
      window.dispatchEvent(new CustomEvent('life4billion_data_sync', { detail: { key: 'all' } }));
    }
  }

  /**
   * Get the current effective user ID (authenticated Supabase auth.uid() or session fallback)
   */
  static getEffectiveUserId(): string {
    if (this.currentUserId) return this.currentUserId;
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('life4billion_active_uid');
        if (stored) {
          this.currentUserId = stored;
          return stored;
        }
      } catch {
        // ignore
      }
    }
    return 'guest';
  }

  /**
   * Build an isolated storage key namespaced by the user's unique Supabase ID.
   */
  static getUserKey(key: string): string {
    const uid = this.getEffectiveUserId();
    if (uid && uid !== 'guest') {
      return `life4billion_u_${uid}_${key}`;
    }
    return `life4billion_guest_${key}`;
  }

  private static getStorageKey(key: string): string {
    return this.getUserKey(key);
  }

  private static cloneDefault<T>(value: T): T {
    if (Array.isArray(value)) {
      return [...value] as unknown as T;
    }
    if (typeof value === 'object' && value !== null) {
      return { ...value } as T;
    }
    return value;
  }

  private static get<T>(key: string, defaultValue: T): T {
    try {
      const storageKey = this.getStorageKey(key);
      let stored: string | null = null;
      if (typeof localStorage !== 'undefined') {
        stored = localStorage.getItem(storageKey);
      }
      if (!stored && this.memoryStore.has(storageKey)) {
        stored = this.memoryStore.get(storageKey) || null;
      }
      if (stored) {
        return JSON.parse(stored);
      }
      return this.cloneDefault(defaultValue);
    } catch {
      return this.cloneDefault(defaultValue);
    }
  }

  private static set<T>(key: string, value: T): void {
    try {
      const storageKey = this.getStorageKey(key);
      const serialized = JSON.stringify(value);
      this.memoryStore.set(storageKey, serialized);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(storageKey, serialized);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('life4billion_data_sync', { detail: { key, value } }));
      }
    } catch (e) {
      console.error('Error writing to localStorage:', e);
    }
  }

  // Subscribe to real-time database mutations across all components
  static subscribe(callback: (detail?: { key: string; value: any }) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      callback(customEvent.detail);
    };
    window.addEventListener('life4billion_data_sync', handler);
    window.addEventListener('life4billion_user_switched', handler);
    return () => {
      window.removeEventListener('life4billion_data_sync', handler);
      window.removeEventListener('life4billion_user_switched', handler);
    };
  }

  // Initializer - Ensures clean zeroed environment for current user
  static init(user?: { id: string; email?: string | null; full_name?: string | null } | null) {
    if (user) {
      this.setCurrentUser(user);
    }

    const uid = this.getEffectiveUserId();
    const initKey = `life4billion_u_${uid}_initialized`;
    
    if (typeof window !== 'undefined' && !localStorage.getItem(initKey)) {
      const email = this.currentUserEmail || (user?.email) || '';
      const name = this.currentUserName || (user?.full_name) || '';
      
      const defaultProfile = createDefaultProfile(uid, email, name);
      const defaultSub = createDefaultSubscription(uid);
      const defaultEmergency = createDefaultEmergencyFund(uid);

      this.set('profile', defaultProfile);
      this.set('subscription', defaultSub);
      this.set('emergency_fund', defaultEmergency);
      this.set('dashboard_type', 'executive');
      
      localStorage.setItem(initKey, 'true');
    }
  }

  // --- Profiles & Users ---
  static getProfile(): Profile {
    const uid = this.getEffectiveUserId();
    const email = this.currentUserEmail || '';
    const name = this.currentUserName || '';
    return this.get<Profile>('profile', createDefaultProfile(uid, email, name));
  }

  static updateProfile(profile: Partial<Profile>): Profile {
    const current = this.getProfile();
    const updated = { ...current, ...profile, updated_at: new Date().toISOString() };
    this.set('profile', updated);
    return updated;
  }

  // --- Subscriptions ---
  static getSubscription(): Subscription {
    const uid = this.getEffectiveUserId();
    return this.get<Subscription>('subscription', createDefaultSubscription(uid));
  }

  static updateSubscription(sub: Partial<Subscription>): Subscription {
    const current = this.getSubscription();
    const updated = { ...current, ...sub };
    this.set('subscription', updated);
    return updated;
  }

  // --- Habits ---
  static getHabits(): Habit[] {
    return this.get<Habit[]>('habits', DEFAULT_HABITS);
  }

  static addHabit(name: string, frequency: 'daily' | 'weekly'): Habit {
    const habits = this.getHabits();
    const newHabit: Habit = {
      id: uuid(),
      user_id: this.getEffectiveUserId(),
      name,
      frequency,
      streak: 0,
      last_completed: null,
      created_at: new Date().toISOString(),
    };
    habits.push(newHabit);
    this.set('habits', habits);
    return newHabit;
  }

  static toggleHabit(id: string): Habit[] {
    const habits = this.getHabits();
    const today = new Date().toISOString().split('T')[0];
    const updated = habits.map(habit => {
      if (habit.id === id) {
        if (habit.last_completed === today) {
          return {
            ...habit,
            last_completed: null,
            streak: Math.max(0, habit.streak - 1)
          };
        } else {
          return {
            ...habit,
            last_completed: today,
            streak: habit.streak + 1
          };
        }
      }
      return habit;
    });
    this.set('habits', updated);
    return updated;
  }

  static deleteHabit(id: string): Habit[] {
    const habits = this.getHabits().filter(h => h.id !== id);
    this.set('habits', habits);
    return habits;
  }

  // --- Goals ---
  static getGoals(): Goal[] {
    return this.get<Goal[]>('goals', DEFAULT_GOALS);
  }

  static addGoal(goal: Omit<Goal, 'id' | 'user_id' | 'status'>): Goal {
    const goals = this.getGoals();
    const newGoal: Goal = {
      ...goal,
      id: uuid(),
      user_id: this.getEffectiveUserId(),
      status: 'in_progress',
    };
    goals.push(newGoal);
    this.set('goals', goals);
    return newGoal;
  }

  static updateGoalProgress(id: string, currentValue: number): Goal[] {
    const goals = this.getGoals();
    const updated = goals.map(g => {
      if (g.id === id) {
        const isCompleted = currentValue >= g.target_value;
        return {
          ...g,
          current_value: currentValue,
          status: isCompleted ? ('completed' as const) : ('in_progress' as const),
        };
      }
      return g;
    });
    this.set('goals', updated);
    return updated;
  }

  static deleteGoal(id: string): Goal[] {
    const goals = this.getGoals().filter(g => g.id !== id);
    this.set('goals', goals);
    return goals;
  }

  // --- Health Records ---
  static getHealthRecords(): HealthRecord[] {
    return this.get<HealthRecord[]>('health_records', DEFAULT_HEALTH).sort((a,b) => b.date.localeCompare(a.date));
  }

  static addHealthRecord(record: Omit<HealthRecord, 'id' | 'user_id'>): HealthRecord {
    const records = this.getHealthRecords();
    const newRec: HealthRecord = {
      ...record,
      id: uuid(),
      user_id: this.getEffectiveUserId()
    };
    records.push(newRec);
    this.set('health_records', records);
    return newRec;
  }

  static deleteHealthRecord(id: string): HealthRecord[] {
    const records = this.getHealthRecords().filter(r => r.id !== id);
    this.set('health_records', records);
    return records;
  }

  // --- Pregnancy Records ---
  static getPregnancyRecords(): PregnancyRecord[] {
    return this.get<PregnancyRecord[]>('pregnancy_records', DEFAULT_PREGNANCY).sort((a,b) => b.date.localeCompare(a.date));
  }

  static addPregnancyRecord(record: Omit<PregnancyRecord, 'id' | 'user_id'>): PregnancyRecord {
    const records = this.getPregnancyRecords();
    const newRec: PregnancyRecord = {
      ...record,
      id: uuid(),
      user_id: this.getEffectiveUserId()
    };
    records.push(newRec);
    this.set('pregnancy_records', records);
    return newRec;
  }

  // --- Meals ---
  static getMeals(): Meal[] {
    return this.get<Meal[]>('meals', DEFAULT_MEALS).sort((a,b) => b.date.localeCompare(a.date));
  }

  static addMeal(meal: Omit<Meal, 'id' | 'user_id'>): Meal {
    const meals = this.getMeals();
    const newMeal: Meal = {
      ...meal,
      id: uuid(),
      user_id: this.getEffectiveUserId()
    };
    meals.push(newMeal);
    this.set('meals', meals);
    return newMeal;
  }

  static deleteMeal(id: string): Meal[] {
    const meals = this.getMeals().filter(m => m.id !== id);
    this.set('meals', meals);
    return meals;
  }

  // --- Family Members ---
  static getFamilyMembers(): FamilyMember[] {
    return this.get<FamilyMember[]>('family_members', DEFAULT_FAMILY);
  }

  static addFamilyMember(member: Omit<FamilyMember, 'id' | 'user_id'>): FamilyMember {
    const family = this.getFamilyMembers();
    const newMem: FamilyMember = {
      ...member,
      id: uuid(),
      user_id: this.getEffectiveUserId()
    };
    family.push(newMem);
    this.set('family_members', family);
    return newMem;
  }

  static deleteFamilyMember(id: string): FamilyMember[] {
    const family = this.getFamilyMembers().filter(f => f.id !== id);
    this.set('family_members', family);
    return family;
  }

  // --- Transactions ---
  static getTransactions(): Transaction[] {
    return this.get<Transaction[]>('transactions', DEFAULT_TRANSACTIONS).sort((a,b) => b.date.localeCompare(a.date));
  }

  static addTransaction(trans: Omit<Transaction, 'id' | 'user_id'>): Transaction {
    const transactions = this.getTransactions();
    const newTrans: Transaction = {
      ...trans,
      id: uuid(),
      user_id: this.getEffectiveUserId()
    };
    transactions.push(newTrans);
    this.set('transactions', transactions);

    // Auto-update matched budget
    const budgets = this.getBudgets();
    const period = trans.date.substring(0, 7);
    if (trans.type === 'expense') {
      const budgetIdx = budgets.findIndex(b => b.category.toLowerCase() === trans.category.toLowerCase() && b.period === period);
      if (budgetIdx !== -1) {
        budgets[budgetIdx].spent_amount += trans.amount;
        this.set('budgets', budgets);
      }
    }

    return newTrans;
  }

  static deleteTransaction(id: string): Transaction[] {
    const transactions = this.getTransactions();
    const target = transactions.find(t => t.id === id);
    if (target && target.type === 'expense') {
      const budgets = this.getBudgets();
      const period = target.date.substring(0, 7);
      const budgetIdx = budgets.findIndex(b => b.category.toLowerCase() === target.category.toLowerCase() && b.period === period);
      if (budgetIdx !== -1) {
        budgets[budgetIdx].spent_amount = Math.max(0, budgets[budgetIdx].spent_amount - target.amount);
        this.set('budgets', budgets);
      }
    }
    const filtered = transactions.filter(t => t.id !== id);
    this.set('transactions', filtered);
    return filtered;
  }

  // --- Budgets ---
  static getBudgets(): Budget[] {
    return this.get<Budget[]>('budgets', DEFAULT_BUDGETS);
  }

  static addBudget(budget: Omit<Budget, 'id' | 'user_id' | 'spent_amount'>): Budget {
    const budgets = this.getBudgets();
    const transactions = this.getTransactions();
    const spent = transactions
      .filter(t => t.type === 'expense' && t.category.toLowerCase() === budget.category.toLowerCase() && t.date.startsWith(budget.period))
      .reduce((sum, t) => sum + t.amount, 0);

    const newBudg: Budget = {
      ...budget,
      id: uuid(),
      user_id: this.getEffectiveUserId(),
      spent_amount: spent,
    };
    budgets.push(newBudg);
    this.set('budgets', budgets);
    return newBudg;
  }

  static deleteBudget(id: string): Budget[] {
    const budgets = this.getBudgets().filter(b => b.id !== id);
    this.set('budgets', budgets);
    return budgets;
  }

  // --- Companies ---
  static getCompanies(): Company[] {
    return this.get<Company[]>('companies', DEFAULT_COMPANIES);
  }

  static addCompany(company: Omit<Company, 'id' | 'owner_id'>): Company {
    const companies = this.getCompanies();
    const newComp: Company = {
      ...company,
      id: uuid(),
      owner_id: this.getEffectiveUserId()
    };
    companies.push(newComp);
    this.set('companies', companies);
    return newComp;
  }

  static updateCompany(company: Partial<Company>): Company {
    const companies = this.getCompanies();
    if (companies.length === 0) {
      const newComp: Company = {
        id: uuid(),
        owner_id: this.getEffectiveUserId(),
        name: company.name || 'Minha Empresa',
        tax_id: company.tax_id || '',
        address: company.address || '',
        website: company.website || ''
      };
      companies.push(newComp);
      this.set('companies', companies);
      return newComp;
    }
    const idx = 0;
    const updated = { ...companies[idx], ...company };
    companies[idx] = updated;
    this.set('companies', companies);
    return updated;
  }

  // --- Employees ---
  static getEmployees(): Employee[] {
    return this.get<Employee[]>('employees', DEFAULT_EMPLOYEES);
  }

  static addEmployee(emp: Omit<Employee, 'id' | 'company_id'>): Employee {
    const employees = this.getEmployees();
    const companies = this.getCompanies();
    const companyId = companies[0]?.id || `comp_${this.getEffectiveUserId()}`;
    const newEmp: Employee = {
      ...emp,
      id: uuid(),
      company_id: companyId
    };
    employees.push(newEmp);
    this.set('employees', employees);
    return newEmp;
  }

  static updateEmployee(id: string, updates: Partial<Employee>): Employee[] {
    const employees = this.getEmployees();
    const updated = employees.map(e => e.id === id ? { ...e, ...updates } : e);
    this.set('employees', updated);
    return updated;
  }

  static deleteEmployee(id: string): Employee[] {
    const employees = this.getEmployees().filter(e => e.id !== id);
    this.set('employees', employees);
    return employees;
  }

  // --- Payroll ---
  static getPayroll(): Payroll[] {
    return this.get<Payroll[]>('payroll', DEFAULT_PAYROLL);
  }

  static addPayroll(payroll: Omit<Payroll, 'id'>): Payroll {
    const payrolls = this.getPayroll();
    const newPay: Payroll = {
      ...payroll,
      id: uuid(),
    };
    payrolls.push(newPay);
    this.set('payroll', payrolls);
    return newPay;
  }

  static processPayroll(employeeId: string, payPeriod: string): Payroll {
    const employees = this.getEmployees();
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) throw new Error('Funcionário não encontrado');

    const baseSalary = employee.salary;
    const bonuses = Math.round(baseSalary * 0.05);
    const deductions = Math.round(baseSalary * 0.22);
    const netPay = baseSalary + bonuses - deductions;

    const payrolls = this.getPayroll();
    const newPay: Payroll = {
      id: uuid(),
      employee_id: employeeId,
      pay_period: payPeriod,
      base_salary: baseSalary,
      bonuses,
      deductions,
      net_pay: netPay,
      status: 'processed',
      processed_at: new Date().toISOString()
    };

    payrolls.push(newPay);
    this.set('payroll', payrolls);

    this.addTransaction({
      type: 'expense',
      amount: netPay,
      category: 'Folha de Pagamento',
      date: new Date().toISOString().split('T')[0],
      description: `Salário Líquido Processado - ${employee.first_name} ${employee.last_name} (${payPeriod})`
    });

    return newPay;
  }

  static updatePayrollStatus(id: string, status: 'pending' | 'processed' | 'paid'): Payroll[] {
    const payrolls = this.getPayroll();
    const updated = payrolls.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status,
          processed_at: status !== 'pending' ? new Date().toISOString() : null
        };
      }
      return p;
    });
    this.set('payroll', updated);
    return updated;
  }

  // --- Products ---
  static getProducts(): Product[] {
    return this.get<Product[]>('products', DEFAULT_PRODUCTS);
  }

  static addProduct(prod: Omit<Product, 'id' | 'company_id'>): Product {
    const products = this.getProducts();
    const companies = this.getCompanies();
    const companyId = companies[0]?.id || `comp_${this.getEffectiveUserId()}`;
    const newProd: Product = {
      ...prod,
      id: uuid(),
      company_id: companyId
    };
    products.push(newProd);
    this.set('products', products);

    const inventory = this.getInventory();
    inventory.push({
      id: uuid(),
      product_id: newProd.id,
      quantity: 50,
      location: 'Estoque Central',
      reorder_point: 5
    });
    this.set('inventory', inventory);

    return newProd;
  }

  static deleteProduct(id: string): Product[] {
    const products = this.getProducts().filter(p => p.id !== id);
    this.set('products', products);
    const inventory = this.getInventory().filter(i => i.product_id !== id);
    this.set('inventory', inventory);
    return products;
  }

  // --- Inventory ---
  static getInventory(): Inventory[] {
    return this.get<Inventory[]>('inventory', DEFAULT_INVENTORY);
  }

  static updateInventory(productId: string, quantity: number): Inventory[] {
    const inventory = this.getInventory();
    const updated = inventory.map(i => i.product_id === productId ? { ...i, quantity } : i);
    this.set('inventory', updated);
    return updated;
  }

  // --- Customers ---
  static getCustomers(): Customer[] {
    return this.get<Customer[]>('customers', DEFAULT_CUSTOMERS);
  }

  static addCustomer(cust: Omit<Customer, 'id' | 'company_id'>): Customer {
    const customers = this.getCustomers();
    const companies = this.getCompanies();
    const companyId = companies[0]?.id || `comp_${this.getEffectiveUserId()}`;
    const newCust: Customer = {
      ...cust,
      id: uuid(),
      company_id: companyId
    };
    customers.push(newCust);
    this.set('customers', customers);
    return newCust;
  }

  static deleteCustomer(id: string): Customer[] {
    const customers = this.getCustomers().filter(c => c.id !== id);
    this.set('customers', customers);
    return customers;
  }

  // --- Sales ---
  static getSales(): Sale[] {
    return this.get<Sale[]>('sales', DEFAULT_SALES).sort((a,b) => b.date.localeCompare(a.date));
  }

  static addSale(sale: Omit<Sale, 'id' | 'company_id' | 'total_amount' | 'date'>): Sale {
    const products = this.getProducts();
    const product = products.find(p => p.id === sale.product_id);
    if (!product) throw new Error('Produto não encontrado');

    const totalAmount = product.price * sale.quantity;
    const companies = this.getCompanies();
    const companyId = companies[0]?.id || `comp_${this.getEffectiveUserId()}`;

    const sales = this.getSales();
    const newSale: Sale = {
      ...sale,
      id: uuid(),
      company_id: companyId,
      total_amount: totalAmount,
      date: new Date().toISOString()
    };
    sales.push(newSale);
    this.set('sales', sales);

    const inventory = this.getInventory();
    const invIdx = inventory.findIndex(i => i.product_id === sale.product_id);
    if (invIdx !== -1 && inventory[invIdx].quantity < 9999) {
      inventory[invIdx].quantity = Math.max(0, inventory[invIdx].quantity - sale.quantity);
      this.set('inventory', inventory);
    }

    this.addTransaction({
      type: 'income',
      amount: totalAmount,
      category: 'Vendas SaaS',
      date: new Date().toISOString().split('T')[0],
      description: `Venda registrada #${newSale.id.substring(0,6).toUpperCase()} - ${product.name} (Qtde: ${sale.quantity})`
    });

    return newSale;
  }

  // --- Reports ---
  static getReports(): Report[] {
    return this.get<Report[]>('reports', DEFAULT_REPORTS);
  }

  static generateReport(type: 'financial' | 'sales' | 'inventory' | 'employees'): Report {
    const reports = this.getReports();
    let name = '';
    let reportData = {};

    if (type === 'financial') {
      name = 'Relatório de Margem e fluxo financeiro';
      const transactions = this.getTransactions();
      const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      reportData = { totalIncome: income, totalExpense: expense, netProfit: income - expense, margin: income > 0 ? ((income - expense) / income * 100).toFixed(1) : '0' };
    } else if (type === 'sales') {
      name = 'Desempenho Geral de Vendas ERP';
      const sales = this.getSales();
      const totalAmount = sales.reduce((sum, s) => sum + s.total_amount, 0);
      reportData = { totalSales: totalAmount, salesCount: sales.length, averageTicket: sales.length > 0 ? (totalAmount / sales.length).toFixed(2) : '0' };
    } else if (type === 'inventory') {
      name = 'Avaliação Física de Estoque de Produtos';
      const inventory = this.getInventory();
      const totalItems = inventory.reduce((sum, i) => sum + i.quantity, 0);
      reportData = { totalStoredItems: totalItems, warningProducts: inventory.filter(i => i.quantity <= i.reorder_point).length };
    } else {
      name = 'Relatório de Folha de Pagamento e Capital Humano';
      const employees = this.getEmployees();
      const activeCount = employees.filter(e => e.status === 'active').length;
      const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0);
      reportData = { totalEmployees: employees.length, activeCount, monthlySalaryCost: totalSalary };
    }

    const companies = this.getCompanies();
    const companyId = companies[0]?.id || `comp_${this.getEffectiveUserId()}`;

    const newRep: Report = {
      id: uuid(),
      company_id: companyId,
      type,
      name,
      data: JSON.stringify(reportData),
      created_at: new Date().toISOString()
    };
    reports.push(newRep);
    this.set('reports', reports);
    return newRep;
  }

  // --- AI History ---
  static getAiHistory(): AiHistory[] {
    return this.get<AiHistory[]>('ai_history', DEFAULT_AI_HISTORY);
  }

  static addAiHistory(prompt: string, response: string, tokensUsed = 150, provider?: string): AiHistory {
    const history = this.getAiHistory();
    const newAi: AiHistory = {
      id: uuid(),
      user_id: this.getEffectiveUserId(),
      prompt,
      response,
      created_at: new Date().toISOString(),
      tokens_used: tokensUsed,
      provider: provider
    };
    history.push(newAi);
    this.set('ai_history', history);
    return newAi;
  }

  // --- Notifications ---
  static getNotifications(): Notification[] {
    return this.get<Notification[]>('notifications', DEFAULT_NOTIFICATIONS);
  }

  static addNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Notification {
    const notifications = this.getNotifications();
    const newNot: Notification = {
      id: uuid(),
      user_id: this.getEffectiveUserId(),
      title,
      message,
      read: false,
      type,
      created_at: new Date().toISOString()
    };
    notifications.unshift(newNot);
    this.set('notifications', notifications);
    return newNot;
  }

  static markNotificationRead(id: string): Notification[] {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    this.set('notifications', updated);
    return updated;
  }

  static clearAllNotifications(): Notification[] {
    this.set('notifications', []);
    return [];
  }

  static markAllNotificationsRead(): Notification[] {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    this.set('notifications', updated);
    return updated;
  }

  // --- EBooks / Learning Hub ---
  static getEBooks(): EBook[] {
    return this.get<EBook[]>('ebooks', []);
  }

  static saveEBooksList(list: EBook[]): void {
    this.set('ebooks', list);
  }

  static saveEBook(ebook: EBook): EBook[] {
    const ebooks = this.getEBooks();
    const index = ebooks.findIndex(b => b.id === ebook.id);
    if (index >= 0) {
      ebooks[index] = { ...ebook, updated_at: new Date().toISOString() };
    } else {
      ebooks.push({
        ...ebook,
        views_count: 0,
        clicks_count: 0,
        recommendations_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    this.set('ebooks', ebooks);
    return ebooks;
  }

  static deleteEBook(id: string): EBook[] {
    const ebooks = this.getEBooks();
    const filtered = ebooks.filter(b => b.id !== id);
    this.set('ebooks', filtered);
    return filtered;
  }

  static incrementEBookView(id: string): void {
    const ebooks = this.getEBooks();
    const updated = ebooks.map(b => {
      if (b.id === id) {
        return { ...b, views_count: (b.views_count || 0) + 1 };
      }
      return b;
    });
    this.set('ebooks', updated);
  }

  static incrementEBookClick(id: string): void {
    const ebooks = this.getEBooks();
    const updated = ebooks.map(b => {
      if (b.id === id) {
        return { ...b, clicks_count: (b.clicks_count || 0) + 1 };
      }
      return b;
    });
    this.set('ebooks', updated);
  }

  static incrementEBookRecommendation(id: string): void {
    const ebooks = this.getEBooks();
    const updated = ebooks.map(b => {
      if (b.id === id) {
        return { ...b, recommendations_count: (b.recommendations_count || 0) + 1 };
      }
      return b;
    });
    this.set('ebooks', updated);
  }

  // --- Dashboard Type Preference ---
  static getDashboardType(): DashboardType {
    return this.get<DashboardType>('dashboard_type', 'executive');
  }

  static setDashboardType(type: DashboardType): DashboardType {
    this.set('dashboard_type', type);
    return type;
  }

  // --- Weekly Goals & Routines (Reference Template from Image) ---
  static getDefaultWeeklyRoutine(lang?: string): WeeklyRoutineState {
    const l = (lang || 'en').toLowerCase();
    const isPt = l.startsWith('pt');
    const isEs = l.startsWith('es');

    const tasksMon = isPt ? [
      { id: 'm1', text: 'Acordar às 06:00', done: false },
      { id: 'm2', text: 'Escrever 10 ideias de conteúdo', done: false },
      { id: 'm3', text: 'Cancelar assinaturas não utilizadas', done: false },
      { id: 'm4', text: 'Treino na academia', done: false },
      { id: 'm5', text: 'Comprar vitaminas', done: false },
      { id: 'm6', text: 'Consulta ao dentista', done: false },
      { id: 'm7', text: 'Fazer compras para o jantar', done: false },
      { id: 'm8', text: 'Cozinhar refeição saudável', done: false },
      { id: 'm9', text: 'Jogar basquete', done: false },
      { id: 'm10', text: 'Banho frio', done: false }
    ] : isEs ? [
      { id: 'm1', text: 'Despertar a las 6:00', done: false },
      { id: 'm2', text: 'Escribir 10 ideas de contenido', done: false },
      { id: 'm3', text: 'Cancelar suscripciones', done: false },
      { id: 'm4', text: 'Gimnasio', done: false },
      { id: 'm5', text: 'Comprar vitaminas', done: false },
      { id: 'm6', text: 'Cita con el dentista', done: false },
      { id: 'm7', text: 'Compras para la cena', done: false },
      { id: 'm8', text: 'Cocinar comida saludable', done: false },
      { id: 'm9', text: 'Jugar baloncesto', done: false },
      { id: 'm10', text: 'Ducha fría', done: false }
    ] : [
      { id: 'm1', text: 'Wake up at 6:00', done: false },
      { id: 'm2', text: 'Write 10 content ideas', done: false },
      { id: 'm3', text: 'Cancel subscriptions', done: false },
      { id: 'm4', text: 'Gym membership', done: false },
      { id: 'm5', text: 'Buy vitamins', done: false },
      { id: 'm6', text: 'Dentist appointment', done: false },
      { id: 'm7', text: 'Shop for dinner', done: false },
      { id: 'm8', text: 'Cook a healthy meal', done: false },
      { id: 'm9', text: 'Play basketball', done: false },
      { id: 'm10', text: 'Cold shower', done: false }
    ];

    const tasksTue = isPt ? [
      { id: 't1', text: 'Processo judicial / audiência', done: false },
      { id: 't2', text: 'Preparar documentos do tribunal', done: false },
      { id: 't3', text: 'Encontro com amigos', done: false },
      { id: 't4', text: 'Redesenhar website', done: false },
      { id: 't5', text: 'Adicionar textos ao site', done: false },
      { id: 't6', text: 'Organizar espaço de trabalho', done: false },
      { id: 't7', text: 'Responder a e-mails', done: false }
    ] : isEs ? [
      { id: 't1', text: 'Caso judicial', done: false },
      { id: 't2', text: 'Preparar documentos del tribunal', done: false },
      { id: 't3', text: 'Reunión con amigos', done: false },
      { id: 't4', text: 'Rediseñar sitio web', done: false },
      { id: 't5', text: 'Agregar textos al sitio web', done: false },
      { id: 't6', text: 'Organizar espacio de trabajo', done: false },
      { id: 't7', text: 'Responder correos', done: false }
    ] : [
      { id: 't1', text: 'Court case', done: false },
      { id: 't2', text: 'Prepare court documents', done: false },
      { id: 't3', text: 'Meet up with friends', done: false },
      { id: 't4', text: 'Redesign website', done: false },
      { id: 't5', text: 'Add text to website', done: false },
      { id: 't6', text: 'Organize workspace', done: false },
      { id: 't7', text: 'Reply to emails', done: false }
    ];

    const tasksWed = isPt ? [
      { id: 'w1', text: 'Preparação de refeições', done: false },
      { id: 'w2', text: 'Ler livro (Capítulo 2)', done: false },
      { id: 'w3', text: 'Verificar finanças', done: false }
    ] : isEs ? [
      { id: 'w1', text: 'Preparación de comidas', done: false },
      { id: 'w2', text: 'Leer libro (Capítulo 2)', done: false },
      { id: 'w3', text: 'Revisar finanzas', done: false }
    ] : [
      { id: 'w1', text: 'Meal prep', done: false },
      { id: 'w2', text: 'Read book (Ch 2)', done: false },
      { id: 'w3', text: 'Check finances', done: false }
    ];

    const tasksThu = isPt ? [
      { id: 'th1', text: 'Planejar o fim de semana', done: false },
      { id: 'th2', text: 'Revisar progresso semanal', done: false },
      { id: 'th3', text: 'Corrida leve', done: false }
    ] : isEs ? [
      { id: 'th1', text: 'Planificar el fin de semana', done: false },
      { id: 'th2', text: 'Revisar progreso', done: false },
      { id: 'th3', text: 'Trote suave', done: false }
    ] : [
      { id: 'th1', text: 'Plan weekend', done: false },
      { id: 'th2', text: 'Review progress', done: false },
      { id: 'th3', text: 'Light jog', done: false }
    ];

    const tasksFri = isPt ? [
      { id: 'f1', text: 'Revisão e fechamento semanal', done: false },
      { id: 'f2', text: 'Zerar caixa de entrada (Inbox Zero)', done: false },
      { id: 'f3', text: 'Pagar contas prioritárias', done: false },
      { id: 'f4', text: 'Reunião de alinhamento de equipe', done: false },
      { id: 'f5', text: 'Treino de força e alongamento', done: false }
    ] : isEs ? [
      { id: 'f1', text: 'Revisión y cierre semanal', done: false },
      { id: 'f2', text: 'Bandeja de entrada en cero', done: false },
      { id: 'f3', text: 'Pagar facturas prioritarias', done: false },
      { id: 'f4', text: 'Reunión de equipo y cierre', done: false },
      { id: 'f5', text: 'Entrenamiento de fuerza y estiramiento', done: false }
    ] : [
      { id: 'f1', text: 'Weekly review & closing', done: false },
      { id: 'f2', text: 'Clear inbox zero', done: false },
      { id: 'f3', text: 'Pay priority bills', done: false },
      { id: 'f4', text: 'Team check-in & wrap-up', done: false },
      { id: 'f5', text: 'Strength workout & stretching', done: false }
    ];

    const tasksSat = isPt ? [
      { id: 's1', text: 'Compras no supermercado e feira', done: false },
      { id: 's2', text: 'Limpeza profunda e lavanderia', done: false },
      { id: 's3', text: 'Caminhada ao ar livre / natureza', done: false },
      { id: 's4', text: 'Tempo com família e amigos', done: false },
      { id: 's5', text: 'Leitura e audiolivros', done: false }
    ] : isEs ? [
      { id: 's1', text: 'Compras en el supermercado y mercado', done: false },
      { id: 's2', text: 'Limpieza profunda y lavandería', done: false },
      { id: 's3', text: 'Paseo al aire libre / naturaleza', done: false },
      { id: 's4', text: 'Tiempo con familia y amigos', done: false },
      { id: 's5', text: 'Lectura y audiolibros', done: false }
    ] : [
      { id: 's1', text: 'Grocery shopping & market', done: false },
      { id: 's2', text: 'Deep cleaning & laundry', done: false },
      { id: 's3', text: 'Outdoor walk / nature', done: false },
      { id: 's4', text: 'Family & friends time', done: false },
      { id: 's5', text: 'Reading & audiobooks', done: false }
    ];

    const tasksSun = isPt ? [
      { id: 'su1', text: 'Preparação de marmitas semanais', done: false },
      { id: 'su2', text: 'Planejar a próxima semana', done: false },
      { id: 'su3', text: 'Revisão de orçamento e finanças', done: false },
      { id: 'su4', text: 'Autocuidado e meditação', done: false },
      { id: 'su5', text: 'Preparar sono cedo', done: false }
    ] : isEs ? [
      { id: 'su1', text: 'Preparación de comidas semanales', done: false },
      { id: 'su2', text: 'Planificar la próxima semana', done: false },
      { id: 'su3', text: 'Revisión de presupuesto y finanzas', done: false },
      { id: 'su4', text: 'Autocuidado y meditación', done: false },
      { id: 'su5', text: 'Preparación para dormir temprano', done: false }
    ] : [
      { id: 'su1', text: 'Weekly meal prep', done: false },
      { id: 'su2', text: 'Plan upcoming week', done: false },
      { id: 'su3', text: 'Budget & finance review', done: false },
      { id: 'su4', text: 'Self-care & meditation', done: false },
      { id: 'su5', text: 'Early sleep preparation', done: false }
    ];

    return {
      weekId: 'current',
      weekRangeLabel: '14.8.26 - 20.8.26',
      days: {
        mon: {
          dayKey: 'mon',
          dayNamePt: 'Segunda-feira',
          dayNameEn: 'Monday',
          dayNameEs: 'Lunes',
          dayShort: isPt ? 'Seg' : isEs ? 'Lun' : 'Mon',
          dateStr: '14.8.26',
          tasks: tasksMon
        },
        tue: {
          dayKey: 'tue',
          dayNamePt: 'Terça-feira',
          dayNameEn: 'Tuesday',
          dayNameEs: 'Martes',
          dayShort: isPt ? 'Ter' : isEs ? 'Mar' : 'Tue',
          dateStr: '15.8.26',
          tasks: tasksTue
        },
        wed: {
          dayKey: 'wed',
          dayNamePt: 'Quarta-feira',
          dayNameEn: 'Wednesday',
          dayNameEs: 'Miércoles',
          dayShort: isPt ? 'Qua' : isEs ? 'Mié' : 'Wed',
          dateStr: '16.8.26',
          tasks: tasksWed
        },
        thu: {
          dayKey: 'thu',
          dayNamePt: 'Quinta-feira',
          dayNameEn: 'Thursday',
          dayNameEs: 'Jueves',
          dayShort: isPt ? 'Qui' : isEs ? 'Jue' : 'Thu',
          dateStr: '17.8.26',
          tasks: tasksThu
        },
        fri: {
          dayKey: 'fri',
          dayNamePt: 'Sexta-feira',
          dayNameEn: 'Friday',
          dayNameEs: 'Viernes',
          dayShort: isPt ? 'Sex' : isEs ? 'Vie' : 'Fri',
          dateStr: '18.8.26',
          tasks: tasksFri
        },
        sat: {
          dayKey: 'sat',
          dayNamePt: 'Sábado',
          dayNameEn: 'Saturday',
          dayNameEs: 'Sábado',
          dayShort: isPt ? 'Sáb' : isEs ? 'Sáb' : 'Sat',
          dateStr: '19.8.26',
          tasks: tasksSat
        },
        sun: {
          dayKey: 'sun',
          dayNamePt: 'Domingo',
          dayNameEn: 'Sunday',
          dayNameEs: 'Domingo',
          dayShort: isPt ? 'Dom' : isEs ? 'Dom' : 'Sun',
          dateStr: '20.8.26',
          tasks: tasksSun
        }
      }
    };
  }

  static getWeeklyRoutine(lang?: string): WeeklyRoutineState {
    const defaultData = this.getDefaultWeeklyRoutine(lang);
    const stored = this.get<WeeklyRoutineState>('weekly_goals_routine', defaultData);
    if (!stored || !stored.days || !stored.days.mon || !stored.days.sun) {
      return defaultData;
    }
    return stored;
  }

  static saveWeeklyRoutine(routine: WeeklyRoutineState): void {
    this.set('weekly_goals_routine', routine);
  }

  // --- Emergency Fund ---
  static getEmergencyFund(): EmergencyFund {
    const uid = this.getEffectiveUserId();
    return this.get<EmergencyFund>('emergency_fund', createDefaultEmergencyFund(uid));
  }

  static updateEmergencyFund(data: Partial<EmergencyFund>): EmergencyFund {
    const current = this.getEmergencyFund();
    const updated: EmergencyFund = { ...current, ...data };
    this.set('emergency_fund', updated);
    return updated;
  }

  // --- Debts ---
  static getDebts(): Debt[] {
    return this.get<Debt[]>('debts', DEFAULT_DEBTS);
  }

  static addDebt(debt: Omit<Debt, 'id' | 'user_id' | 'status'>): Debt {
    const debts = this.getDebts();
    const newDebt: Debt = {
      ...debt,
      id: uuid(),
      user_id: this.getEffectiveUserId(),
      status: debt.paid_amount >= debt.total_amount ? 'paid' : 'active'
    };
    debts.push(newDebt);
    this.set('debts', debts);
    return newDebt;
  }

  static updateDebt(id: string, updates: Partial<Debt>): Debt[] {
    const debts = this.getDebts();
    const updated = debts.map(d => {
      if (d.id === id) {
        const item = { ...d, ...updates };
        if (item.paid_amount >= item.total_amount) {
          item.status = 'paid';
        }
        return item;
      }
      return d;
    });
    this.set('debts', updated);
    return updated;
  }

  static deleteDebt(id: string): Debt[] {
    const debts = this.getDebts().filter(d => d.id !== id);
    this.set('debts', debts);
    return debts;
  }

  static markDebtPaid(id: string): Debt[] {
    const debts = this.getDebts();
    const debtToPay = debts.find(d => d.id === id);
    if (debtToPay) {
      const interestSaved = Math.round((debtToPay.total_amount - debtToPay.paid_amount) * (debtToPay.interest_rate / 100));
      this.addPaidDebtLog({
        creditor: debtToPay.creditor,
        total_paid: debtToPay.total_amount,
        date_completed: new Date().toISOString().split('T')[0],
        interest_saved: Math.max(50, interestSaved),
        category: debtToPay.category
      });
    }

    const updated = debts.map(d => {
      if (d.id === id) {
        return { ...d, paid_amount: d.total_amount, status: 'paid' as const };
      }
      return d;
    });
    this.set('debts', updated);
    return updated;
  }

  // --- Financial Cards ---
  static getCards(): FinancialCard[] {
    return this.get<FinancialCard[]>('cards', DEFAULT_CARDS);
  }

  static addCard(card: Omit<FinancialCard, 'id' | 'user_id' | 'available_credit'>): FinancialCard {
    const cards = this.getCards();
    const available_credit = Math.max(0, card.limit_amount - card.current_balance);
    const newCard: FinancialCard = {
      ...card,
      available_credit,
      id: uuid(),
      user_id: this.getEffectiveUserId()
    };
    cards.push(newCard);
    this.set('cards', cards);
    return newCard;
  }

  static updateCard(id: string, updates: Partial<FinancialCard>): FinancialCard[] {
    const cards = this.getCards();
    const updated = cards.map(c => {
      if (c.id === id) {
        const item = { ...c, ...updates };
        item.available_credit = Math.max(0, item.limit_amount - item.current_balance);
        return item;
      }
      return c;
    });
    this.set('cards', updated);
    return updated;
  }

  static deleteCard(id: string): FinancialCard[] {
    const cards = this.getCards().filter(c => c.id !== id);
    this.set('cards', cards);
    return cards;
  }

  static toggleCardFreeze(id: string): FinancialCard[] {
    const cards = this.getCards();
    const updated = cards.map(c => c.id === id ? { ...c, is_frozen: !c.is_frozen } : c);
    this.set('cards', updated);
    return updated;
  }

  // --- Paid Debt Logs ---
  static getPaidDebts(): PaidDebtLog[] {
    return this.get<PaidDebtLog[]>('paid_debts', DEFAULT_PAID_DEBTS);
  }

  static addPaidDebtLog(log: Omit<PaidDebtLog, 'id' | 'user_id'>): PaidDebtLog {
    const paidList = this.getPaidDebts();
    const newLog: PaidDebtLog = {
      ...log,
      id: uuid(),
      user_id: this.getEffectiveUserId()
    };
    paidList.unshift(newLog);
    this.set('paid_debts', paidList);
    return newLog;
  }

  // --- Smart Calendar Events ---
  static getCalendarEvents(): CalendarEvent[] {
    return this.get<CalendarEvent[]>('calendar_events', DEFAULT_CALENDAR_EVENTS);
  }

  static addCalendarEvent(evt: Omit<CalendarEvent, 'id' | 'user_id'>): CalendarEvent {
    const events = this.getCalendarEvents();
    const newEvt: CalendarEvent = {
      ...evt,
      id: uuid(),
      user_id: this.getEffectiveUserId()
    };
    events.push(newEvt);
    this.set('calendar_events', events);
    return newEvt;
  }

  static updateCalendarEvent(id: string, updates: Partial<CalendarEvent>): CalendarEvent[] {
    const events = this.getCalendarEvents();
    const updated = events.map(e => (e.id === id ? { ...e, ...updates } : e));
    this.set('calendar_events', updated);
    return updated;
  }

  static deleteCalendarEvent(id: string): CalendarEvent[] {
    const events = this.getCalendarEvents().filter(e => e.id !== id);
    this.set('calendar_events', events);
    return events;
  }

  static autoGenerateCalendarEvents(): CalendarEvent[] {
    const existing = this.getCalendarEvents();
    const updatedList = [...existing];
    const uid = this.getEffectiveUserId();

    // 1. Sync from Debts due dates
    const debts = this.getDebts();
    debts.forEach(d => {
      if (d.status === 'active' && d.due_date) {
        const exists = updatedList.some(e => e.type === 'debt_payment' && e.related_id === d.id);
        if (!exists) {
          updatedList.push({
            id: uuid(),
            user_id: uid,
            title: `Debt Payment: ${d.creditor}`,
            amount: d.minimum_payment || d.total_amount,
            date: d.due_date,
            type: 'debt_payment',
            status: 'pending',
            related_id: d.id,
            category: d.category
          });
        }
      }
    });

    // 2. Sync from Financial Cards payment due dates
    const cards = this.getCards();
    cards.forEach(c => {
      if (c.payment_due_date) {
        const exists = updatedList.some(e => e.type === 'bill' && e.related_id === c.id);
        if (!exists) {
          updatedList.push({
            id: uuid(),
            user_id: uid,
            title: `Card Bill: ${c.name}`,
            amount: c.current_balance,
            date: c.payment_due_date,
            type: 'bill',
            status: 'pending',
            related_id: c.id
          });
        }
      }
    });

    // 3. Sync from Financial Goals deadlines
    const goals = this.getGoals();
    goals.forEach(g => {
      if (g.status === 'in_progress' && g.deadline) {
        const exists = updatedList.some(e => e.type === 'goal_milestone' && e.related_id === g.id);
        if (!exists) {
          updatedList.push({
            id: uuid(),
            user_id: uid,
            title: `Goal Target: ${g.name}`,
            amount: g.target_value,
            date: g.deadline,
            type: 'goal_milestone',
            status: 'pending',
            related_id: g.id,
            category: g.category
          });
        }
      }
    });

    // 4. Sync from Transactions
    const txs = this.getTransactions();
    txs.forEach(t => {
      const exists = updatedList.some(e => e.related_id === t.id);
      if (!exists) {
        updatedList.push({
          id: uuid(),
          user_id: uid,
          title: t.description,
          amount: t.amount,
          date: t.date,
          type: t.type === 'income' ? 'payday' : 'bill',
          status: 'completed',
          related_id: t.id,
          category: t.category
        });
      }
    });

    this.set('calendar_events', updatedList);
    return updatedList;
  }

  // --- Wallpaper Config ---
  static getWallpaperConfig(): WallpaperConfig {
    return this.get<WallpaperConfig>('wallpaper_config', DEFAULT_WALLPAPER_CONFIG);
  }

  static updateWallpaperConfig(updates: Partial<WallpaperConfig>): WallpaperConfig {
    const current = this.getWallpaperConfig();
    const updated = { ...current, ...updates };
    this.set('wallpaper_config', updated);
    return updated;
  }
}
