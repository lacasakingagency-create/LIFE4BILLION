/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CategoryGroup =
  | 'Income'
  | 'Home & Bills'
  | 'Food & Dining'
  | 'Transportation'
  | 'Personal & Family'
  | 'Health & Wellness'
  | 'Lifestyle'
  | 'Financial'
  | 'Business';

export interface FinancialCategory {
  id: string;
  name: string;
  group: CategoryGroup;
  color: string; // Hex color code
  iconName: string; // Lucide icon name or vector sticker identifier
  type: 'income' | 'expense' | 'both';
  isCustom?: boolean;
}

export interface FinancialTransfer {
  id: string;
  user_id: string;
  from_account_id: string;
  from_account_name: string;
  to_account_id: string;
  to_account_name: string;
  amount: number;
  date: string;
  description: string;
  created_at: string;
}

export type TimePeriod =
  | 'day'
  | 'week'
  | 'month'
  | 'year'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'q4'
  | 'semester'
  | 'bimester';

export interface UnifiedFilterOptions {
  period: TimePeriod;
  selectedDate?: string;
  selectedMonth?: string; // YYYY-MM
  selectedYear?: number;
  categoryGroup?: string;
  category?: string;
  type?: 'all' | 'income' | 'expense' | 'transfer';
  accountId?: string;
  cardId?: string;
  searchQuery?: string;
}
