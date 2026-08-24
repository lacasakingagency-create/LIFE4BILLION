/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Database Schema Interfaces representing all 21 requested PostgreSQL tables.
// This structure is fully aligned with a Supabase PostgreSQL backend.

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Profile {
  id: string; // references users.id
  updated_at: string;
  username: string;
  full_name: string;
  avatar_url: string;
  role: 'admin' | 'owner' | 'member' | 'guest';
  phone?: string;
  email?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  status: 'active' | 'trialing' | 'canceled' | 'past_due';
  price_id: string;
  cancel_at_period_end: boolean;
  current_period_start: string;
  current_period_end: string;
  tier_name: 'Free' | 'Pro Plan' | 'Enterprise';
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  last_completed: string | null; // ISO Date String
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string;
  category: 'personal' | 'fitness' | 'business' | 'financial';
  status: 'in_progress' | 'completed' | 'failed';
}

export interface HealthRecord {
  id: string;
  user_id: string;
  date: string;
  weight: number | null; // kg
  systolic: number | null; // Blood pressure
  diastolic: number | null;
  sleep_hours: number | null;
  symptoms: string;
  notes: string;
}

export interface Meal {
  id: string;
  user_id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
}

export interface PregnancyRecord {
  id: string;
  user_id: string;
  date: string;
  week_number: number;
  weight: number | null; // kg
  symptoms: string;
  baby_size_estimate: string; // e.g., "Tamanho de um limão"
  doctor_notes: string;
}

export interface FamilyDocument {
  name: string;
  size: string;
  type: string;
  content: string; // base64 representation
}

export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  birth_date: string;
  notes: string;
  documents?: FamilyDocument[];
  avatar_url?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
  expense_type?: 'fixed' | 'variable';
  subcategory?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  spent_amount: number;
  period: string; // e.g. "2026-07"
}

export interface Company {
  id: string;
  owner_id: string;
  name: string;
  tax_id: string; // CNPJ / NIF / Tax ID
  address: string;
  website: string;
}

export interface Employee {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  hire_date: string;
  salary: number;
  status: 'active' | 'suspended' | 'terminated';
  avatar_url?: string;
  documents?: { name: string; type: string; content: string; size?: string }[];
}

export interface Payroll {
  id: string;
  employee_id: string;
  pay_period: string; // e.g., "2026-07"
  base_salary: number;
  bonuses: number;
  deductions: number;
  net_pay: number;
  status: 'pending' | 'processed' | 'paid';
  processed_at: string | null;
}

export interface Product {
  id: string;
  company_id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  description: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  quantity: number;
  location: string;
  reorder_point: number;
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
}

export interface Sale {
  id: string;
  company_id: string;
  customer_id: string;
  product_id: string;
  quantity: number;
  total_amount: number;
  date: string;
  status: 'completed' | 'pending' | 'refunded';
}

export interface Report {
  id: string;
  company_id: string;
  type: 'financial' | 'sales' | 'inventory' | 'employees';
  name: string;
  data: string; // JSON String representing rich aggregated metrics
  created_at: string;
}

export interface AiHistory {
  id: string;
  user_id: string;
  prompt: string;
  response: string;
  created_at: string;
  tokens_used: number;
  provider?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
  date?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'owner' | 'member' | 'guest';
  created_at: string;
}

export interface EBook {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  product_url: string;
  category: string;
  price?: number;
  tags: string[];
  status: 'published' | 'draft';
  is_featured?: boolean;
  ai_recommendation_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
  views_count?: number;
  clicks_count?: number;
  recommendations_count?: number;
}

export type DashboardType = 'executive' | 'financial_health' | 'bi' | 'minimal' | 'ai_smart';

export interface EmergencyFund {
  id: string;
  user_id: string;
  target_amount: number;
  current_balance: number;
  deadline: string;
  purpose: 'medical' | 'job_loss' | 'family' | 'unexpected' | 'custom';
  custom_purpose?: string;
  notes?: string;
  created_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  creditor: string;
  total_amount: number;
  paid_amount: number;
  interest_rate: number; // annual %
  minimum_payment: number;
  due_date: string;
  category: 'credit_card' | 'personal_loan' | 'mortgage' | 'student_loan' | 'other';
  status: 'active' | 'paid';
}

export interface FinancialCard {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  type: 'credit' | 'debit';
  brand?: 'visa' | 'master_black' | 'master_gold' | 'other';
  limit_amount: number;
  current_balance: number;
  available_credit: number;
  payment_due_date: string;
  interest_rate: number;
  is_frozen: boolean;
  last_4: string;
  cardholder_name?: string;
  expiry_date?: string;
  color?: string;
}

export interface PaidDebtLog {
  id: string;
  user_id: string;
  creditor: string;
  total_paid: number;
  date_completed: string;
  interest_saved: number;
  category: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  amount?: number;
  date: string; // YYYY-MM-DD
  time?: string; // e.g., "09:00"
  type: 'payday' | 'bill' | 'subscription' | 'debt_payment' | 'savings_deposit' | 'financial_deadline' | 'goal_milestone' | 'habit_schedule' | 'appointment' | 'custom' | 'reminder';
  status: 'pending' | 'completed' | 'postponed' | 'canceled';
  related_id?: string;
  category?: string;
  notes?: string;
  is_recurring?: boolean;
  recurrence_frequency?: 'weekly' | 'monthly' | 'yearly';
}

export interface WallpaperConfig {
  theme: 'midnight_gold' | 'executive_blue' | 'emerald_luxury' | 'pure_light' | 'dark_premium' | 'minimal' | 'motivational';
  template: 'minimal' | 'financial' | 'motivational' | 'dark_premium' | 'clean' | 'goal_focused' | 'daily_dashboard';
  mode?: 'balanced' | 'full' | 'minimal';
  showNetWorth: boolean;
  showBalance: boolean;
  showIncome: boolean;
  showExpenses: boolean;
  showSavingsGoal: boolean;
  showHabitStreak: boolean;
  showQuote: boolean;
  showUserTag: boolean;
  showUpcomingEvents: boolean;
  showPaycheckCountdown: boolean;
  showTodayFocus?: boolean;
  showDailyTracking?: boolean;
  selectedHabitIds?: string[];
  maskPrivateData: boolean;
  autoUpdate: boolean;
  updateFrequency: 'data_change' | 'daily' | 'weekly';
  customFocusText?: string;
  lastGeneratedAt?: string;
}

export interface WeeklyRoutineTask {
  id: string;
  text: string;
  done: boolean;
  category?: string;
}

export interface WeeklyDayRoutine {
  dayKey: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  dayNamePt: string;
  dayNameEn: string;
  dayNameEs: string;
  dayShort: string;
  dateStr: string; // e.g. "14.8.26"
  tasks: WeeklyRoutineTask[];
}

export interface WeeklyRoutineState {
  weekId: string; // e.g. "2026-W33"
  weekRangeLabel: string;
  days: Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', WeeklyDayRoutine>;
  notes?: string;
}


