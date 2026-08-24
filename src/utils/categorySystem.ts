/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinancialCategory, CategoryGroup } from '../types/category';

// Master List of 72 Everyday Standard Categories (American English)
export const STANDARD_CATEGORIES: FinancialCategory[] = [
  // --- INCOME (14 Categories) ---
  { id: 'cat-inc-paycheck', name: 'Paycheck', group: 'Income', color: '#10b981', iconName: 'DollarSign', type: 'income' },
  { id: 'cat-inc-freelance', name: 'Freelance Income', group: 'Income', color: '#059669', iconName: 'Laptop', type: 'income' },
  { id: 'cat-inc-business', name: 'Business Income', group: 'Income', color: '#047857', iconName: 'Building', type: 'income' },
  { id: 'cat-inc-sidehustle', name: 'Side Hustle', group: 'Income', color: '#34d399', iconName: 'Zap', type: 'income' },
  { id: 'cat-inc-commission', name: 'Commission', group: 'Income', color: '#0284c7', iconName: 'TrendingUp', type: 'income' },
  { id: 'cat-inc-bonus', name: 'Bonus', group: 'Income', color: '#f59e0b', iconName: 'Award', type: 'income' },
  { id: 'cat-inc-tips', name: 'Tips', group: 'Income', color: '#14b8a6', iconName: 'Coins', type: 'income' },
  { id: 'cat-inc-interest', name: 'Interest Income', group: 'Income', color: '#6366f1', iconName: 'Percent', type: 'income' },
  { id: 'cat-inc-dividend', name: 'Dividend Income', group: 'Income', color: '#8b5cf6', iconName: 'PieChart', type: 'income' },
  { id: 'cat-inc-rental', name: 'Rental Income', group: 'Income', color: '#ec4899', iconName: 'Home', type: 'income' },
  { id: 'cat-inc-refunds', name: 'Refunds', group: 'Income', color: '#06b6d4', iconName: 'RotateCcw', type: 'income' },
  { id: 'cat-inc-benefits', name: 'Government Benefits', group: 'Income', color: '#64748b', iconName: 'Landmark', type: 'income' },
  { id: 'cat-inc-gifts', name: 'Gifts Received', group: 'Income', color: '#f43f5e', iconName: 'Gift', type: 'income' },
  { id: 'cat-inc-other', name: 'Other Income', group: 'Income', color: '#10b981', iconName: 'PlusCircle', type: 'income' },

  // --- HOME & BILLS (11 Categories) ---
  { id: 'cat-home-housing', name: 'Housing', group: 'Home & Bills', color: '#3b82f6', iconName: 'Home', type: 'expense' },
  { id: 'cat-home-rent', name: 'Rent', group: 'Home & Bills', color: '#2563eb', iconName: 'Key', type: 'expense' },
  { id: 'cat-home-mortgage', name: 'Mortgage', group: 'Home & Bills', color: '#1d4ed8', iconName: 'Landmark', type: 'expense' },
  { id: 'cat-home-electricity', name: 'Electricity', group: 'Home & Bills', color: '#eab308', iconName: 'Zap', type: 'expense' },
  { id: 'cat-home-water', name: 'Water', group: 'Home & Bills', color: '#06b6d4', iconName: 'Droplets', type: 'expense' },
  { id: 'cat-home-gas', name: 'Gas Utility', group: 'Home & Bills', color: '#f97316', iconName: 'Flame', type: 'expense' },
  { id: 'cat-home-internet', name: 'Internet', group: 'Home & Bills', color: '#8b5cf6', iconName: 'Wifi', type: 'expense' },
  { id: 'cat-home-phone', name: 'Phone', group: 'Home & Bills', color: '#a855f7', iconName: 'Smartphone', type: 'expense' },
  { id: 'cat-home-maintenance', name: 'Home Maintenance', group: 'Home & Bills', color: '#64748b', iconName: 'Wrench', type: 'expense' },
  { id: 'cat-home-supplies', name: 'Home Supplies', group: 'Home & Bills', color: '#6b7280', iconName: 'Package', type: 'expense' },
  { id: 'cat-home-insurance', name: 'Insurance', group: 'Home & Bills', color: '#0284c7', iconName: 'ShieldCheck', type: 'expense' },

  // --- FOOD & DINING (6 Categories) ---
  { id: 'cat-food-groceries', name: 'Groceries', group: 'Food & Dining', color: '#84cc16', iconName: 'ShoppingBag', type: 'expense' },
  { id: 'cat-food-restaurants', name: 'Restaurants', group: 'Food & Dining', color: '#ef4444', iconName: 'Utensils', type: 'expense' },
  { id: 'cat-food-fastfood', name: 'Fast Food', group: 'Food & Dining', color: '#f97316', iconName: 'Flame', type: 'expense' },
  { id: 'cat-food-coffee', name: 'Coffee', group: 'Food & Dining', color: '#b45309', iconName: 'Coffee', type: 'expense' },
  { id: 'cat-food-delivery', name: 'Food Delivery', group: 'Food & Dining', color: '#10b981', iconName: 'Truck', type: 'expense' },
  { id: 'cat-food-snacks', name: 'Snacks', group: 'Food & Dining', color: '#f59e0b', iconName: 'Cookie', type: 'expense' },

  // --- TRANSPORTATION (7 Categories) ---
  { id: 'cat-trans-fuel', name: 'Fuel', group: 'Transportation', color: '#f97316', iconName: 'Fuel', type: 'expense' },
  { id: 'cat-trans-public', name: 'Public Transportation', group: 'Transportation', color: '#0284c7', iconName: 'Bus', type: 'expense' },
  { id: 'cat-trans-rideshare', name: 'Taxi & Ride Share', group: 'Transportation', color: '#eab308', iconName: 'Car', type: 'expense' },
  { id: 'cat-trans-carpayment', name: 'Car Payment', group: 'Transportation', color: '#3b82f6', iconName: 'CreditCard', type: 'expense' },
  { id: 'cat-trans-carmaint', name: 'Car Maintenance', group: 'Transportation', color: '#64748b', iconName: 'Wrench', type: 'expense' },
  { id: 'cat-trans-parking', name: 'Parking', group: 'Transportation', color: '#8b5cf6', iconName: 'SquareP', type: 'expense' },
  { id: 'cat-trans-tolls', name: 'Tolls', group: 'Transportation', color: '#6366f1', iconName: 'Navigation', type: 'expense' },

  // --- PERSONAL & FAMILY (7 Categories) ---
  { id: 'cat-pers-clothing', name: 'Clothing', group: 'Personal & Family', color: '#ec4899', iconName: 'Shirt', type: 'expense' },
  { id: 'cat-pers-personalcare', name: 'Personal Care', group: 'Personal & Family', color: '#f43f5e', iconName: 'Scissors', type: 'expense' },
  { id: 'cat-pers-family', name: 'Family', group: 'Personal & Family', color: '#8b5cf6', iconName: 'Users', type: 'expense' },
  { id: 'cat-pers-childcare', name: 'Childcare', group: 'Personal & Family', color: '#a855f7', iconName: 'Baby', type: 'expense' },
  { id: 'cat-pers-pets', name: 'Pets', group: 'Personal & Family', color: '#f59e0b', iconName: 'Dog', type: 'expense' },
  { id: 'cat-pers-gifts', name: 'Gifts', group: 'Personal & Family', color: '#14b8a6', iconName: 'Gift', type: 'expense' },
  { id: 'cat-pers-donations', name: 'Donations', group: 'Personal & Family', color: '#10b981', iconName: 'HeartHandshake', type: 'expense' },

  // --- HEALTH & WELLNESS (5 Categories) ---
  { id: 'cat-health-care', name: 'Healthcare', group: 'Health & Wellness', color: '#ef4444', iconName: 'Stethoscope', type: 'expense' },
  { id: 'cat-health-medicine', name: 'Medicine', group: 'Health & Wellness', color: '#06b6d4', iconName: 'Pill', type: 'expense' },
  { id: 'cat-health-dental', name: 'Dental', group: 'Health & Wellness', color: '#3b82f6', iconName: 'Smile', type: 'expense' },
  { id: 'cat-health-fitness', name: 'Fitness', group: 'Health & Wellness', color: '#10b981', iconName: 'Dumbbell', type: 'expense' },
  { id: 'cat-health-mental', name: 'Mental Wellness', group: 'Health & Wellness', color: '#8b5cf6', iconName: 'Brain', type: 'expense' },

  // --- LIFESTYLE (9 Categories) ---
  { id: 'cat-life-entertainment', name: 'Entertainment', group: 'Lifestyle', color: '#8b5cf6', iconName: 'Film', type: 'expense' },
  { id: 'cat-life-streaming', name: 'Streaming', group: 'Lifestyle', color: '#ef4444', iconName: 'Tv', type: 'expense' },
  { id: 'cat-life-gaming', name: 'Gaming', group: 'Lifestyle', color: '#a855f7', iconName: 'Gamepad2', type: 'expense' },
  { id: 'cat-life-hobbies', name: 'Hobbies', group: 'Lifestyle', color: '#f59e0b', iconName: 'Palette', type: 'expense' },
  { id: 'cat-life-travel', name: 'Travel', group: 'Lifestyle', color: '#0284c7', iconName: 'Plane', type: 'expense' },
  { id: 'cat-life-vacation', name: 'Vacations', group: 'Lifestyle', color: '#06b6d4', iconName: 'Sun', type: 'expense' },
  { id: 'cat-life-education', name: 'Education', group: 'Lifestyle', color: '#3b82f6', iconName: 'GraduationCap', type: 'expense' },
  { id: 'cat-life-books', name: 'Books', group: 'Lifestyle', color: '#b45309', iconName: 'BookOpen', type: 'expense' },
  { id: 'cat-life-subscriptions', name: 'Subscriptions', group: 'Lifestyle', color: '#6366f1', iconName: 'Repeat', type: 'expense' },

  // --- FINANCIAL (8 Categories) ---
  { id: 'cat-fin-savings', name: 'Savings', group: 'Financial', color: '#10b981', iconName: 'PiggyBank', type: 'both' },
  { id: 'cat-fin-emergency', name: 'Emergency Fund', group: 'Financial', color: '#f43f5e', iconName: 'ShieldCheck', type: 'both' },
  { id: 'cat-fin-investments', name: 'Investments', group: 'Financial', color: '#6366f1', iconName: 'TrendingUp', type: 'both' },
  { id: 'cat-fin-ccpayment', name: 'Credit Card Payment', group: 'Financial', color: '#ec4899', iconName: 'CreditCard', type: 'expense' },
  { id: 'cat-fin-loanpayment', name: 'Loan Payment', group: 'Financial', color: '#f59e0b', iconName: 'FileText', type: 'expense' },
  { id: 'cat-fin-debt', name: 'Debt Repayment', group: 'Financial', color: '#ef4444', iconName: 'ArrowDownLeft', type: 'expense' },
  { id: 'cat-fin-bankfees', name: 'Bank Fees', group: 'Financial', color: '#64748b', iconName: 'Receipt', type: 'expense' },
  { id: 'cat-fin-taxes', name: 'Taxes', group: 'Financial', color: '#1e293b', iconName: 'Scale', type: 'expense' },

  // --- BUSINESS (5 Categories) ---
  { id: 'cat-biz-expenses', name: 'Business Expenses', group: 'Business', color: '#0284c7', iconName: 'Briefcase', type: 'expense' },
  { id: 'cat-biz-advertising', name: 'Advertising', group: 'Business', color: '#a855f7', iconName: 'Megaphone', type: 'expense' },
  { id: 'cat-biz-software', name: 'Software', group: 'Business', color: '#06b6d4', iconName: 'Code', type: 'expense' },
  { id: 'cat-biz-equipment', name: 'Equipment', group: 'Business', color: '#64748b', iconName: 'Monitor', type: 'expense' },
  { id: 'cat-biz-supplies', name: 'Office Supplies', group: 'Business', color: '#3b82f6', iconName: 'Paperclip', type: 'expense' },
];

export const ALL_CATEGORY_GROUPS: CategoryGroup[] = [
  'Income',
  'Home & Bills',
  'Food & Dining',
  'Transportation',
  'Personal & Family',
  'Health & Wellness',
  'Lifestyle',
  'Financial',
  'Business',
];

// Available Vector Sticker Icons for Sticker Picker
export const STICKER_ICON_OPTIONS = [
  { name: 'DollarSign', label: 'Dollar' },
  { name: 'PiggyBank', label: 'Piggy Bank' },
  { name: 'Home', label: 'Home' },
  { name: 'ShoppingBag', label: 'Groceries' },
  { name: 'Utensils', label: 'Dining' },
  { name: 'Car', label: 'Car' },
  { name: 'Bus', label: 'Bus' },
  { name: 'Fuel', label: 'Fuel' },
  { name: 'Zap', label: 'Electricity' },
  { name: 'Droplets', label: 'Water' },
  { name: 'Wifi', label: 'Internet' },
  { name: 'Smartphone', label: 'Phone' },
  { name: 'CreditCard', label: 'Card' },
  { name: 'Briefcase', label: 'Work' },
  { name: 'Laptop', label: 'Laptop' },
  { name: 'Building', label: 'Building' },
  { name: 'Heart', label: 'Health' },
  { name: 'Pill', label: 'Medicine' },
  { name: 'Dumbbell', label: 'Fitness' },
  { name: 'Shirt', label: 'Clothing' },
  { name: 'Gift', label: 'Gift' },
  { name: 'Plane', label: 'Travel' },
  { name: 'Tv', label: 'Streaming' },
  { name: 'Gamepad2', label: 'Gaming' },
  { name: 'BookOpen', label: 'Books' },
  { name: 'GraduationCap', label: 'Education' },
  { name: 'TrendingUp', label: 'Investment' },
  { name: 'ShieldCheck', label: 'Protection' },
  { name: 'Coffee', label: 'Coffee' },
  { name: 'Baby', label: 'Childcare' },
  { name: 'Dog', label: 'Pets' },
  { name: 'Scissors', label: 'Care' },
  { name: 'Wrench', label: 'Maintenance' },
  { name: 'Award', label: 'Bonus' },
  { name: 'Coins', label: 'Coins' },
];

export const CATEGORY_COLOR_PRESETS = [
  '#10b981', // Emerald
  '#059669', // Dark Emerald
  '#3b82f6', // Blue
  '#1d4ed8', // Dark Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#84cc16', // Lime
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

/**
 * Gets all categories (Standard + Custom from localStorage)
 */
export function getAllCategories(): FinancialCategory[] {
  let customCategories: FinancialCategory[] = [];
  try {
    const saved = localStorage.getItem('omnisaas_custom_categories');
    if (saved) {
      customCategories = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse custom categories', e);
  }
  return [...STANDARD_CATEGORIES, ...customCategories];
}

/**
 * Finds a category by name or ID (fallback to generic if not found)
 */
export function findCategory(nameOrId: string): FinancialCategory {
  const all = getAllCategories();
  const search = nameOrId.toLowerCase().trim();
  
  const found = all.find(
    (c) => c.id.toLowerCase() === search || c.name.toLowerCase() === search
  );

  if (found) return found;

  // Partial match fallback
  const partial = all.find(
    (c) => search.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(search)
  );
  if (partial) return partial;

  // Generic fallback
  return {
    id: `cat-custom-${search}`,
    name: nameOrId || 'General',
    group: 'Lifestyle',
    color: '#6366f1',
    iconName: 'Tag',
    type: 'both'
  };
}

/**
 * Adds a new custom category and saves it
 */
export function saveCustomCategory(cat: Omit<FinancialCategory, 'id' | 'isCustom'>): FinancialCategory {
  const newCat: FinancialCategory = {
    ...cat,
    id: `custom-cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    isCustom: true
  };

  let existing: FinancialCategory[] = [];
  try {
    const saved = localStorage.getItem('omnisaas_custom_categories');
    if (saved) existing = JSON.parse(saved);
  } catch (e) {
    // Ignore
  }

  existing.push(newCat);
  localStorage.setItem('omnisaas_custom_categories', JSON.stringify(existing));
  return newCat;
}
