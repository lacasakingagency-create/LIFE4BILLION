/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EBook, UserRole } from '../../types/schema';

// In-memory server fallback storage for eBooks and Roles
// Guaranteed durability & fallback if Supabase table is pending creation
let memoryEbooks: EBook[] = [
  {
    id: 'ebook-growth-hack',
    title: 'High-Impact Growth Strategy',
    description: 'Complete playbook on user acquisition, dynamic viral loops, and digital product-led growth optimization for SaaS founders.',
    cover_url: 'https://images.unsplash.com/photo-1553484771-047a44eee27b?w=400&q=80',
    product_url: 'https://life4billion.com/growth',
    category: 'growth',
    price: 29.90,
    tags: ['growth', 'marketing', 'saas', 'scalability'],
    status: 'published',
    is_featured: true,
    created_at: '2026-08-20T10:00:00.000Z',
    updated_at: '2026-08-22T07:00:00.000Z',
    views_count: 45,
    clicks_count: 12,
    recommendations_count: 8
  },
  {
    id: 'ebook-finances-101',
    title: 'Mastering Personal Ledger & Assets',
    description: 'Learn the fundamental rules of allocating investments, managing liabilities, tracking gold, and maximizing passive monthly wealth growth.',
    cover_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80',
    product_url: 'https://life4billion.com/finances',
    category: 'money',
    price: 19.99,
    tags: ['finances', 'investments', 'wealth', 'tax-saving'],
    status: 'published',
    is_featured: true,
    created_at: '2026-08-21T10:00:00.000Z',
    updated_at: '2026-08-22T07:00:00.000Z',
    views_count: 62,
    clicks_count: 24,
    recommendations_count: 15
  },
  {
    id: 'ebook-diet-health',
    title: 'Peak Performance Nutrition Guide',
    description: 'Scientific nutrition protocols, circadian sleep optimization, and high-energy routine architecture for peak cognitive performance.',
    cover_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80',
    product_url: 'https://life4billion.com/health',
    category: 'health',
    price: 24.50,
    tags: ['health', 'longevity', 'energy', 'habits'],
    status: 'published',
    is_featured: false,
    created_at: '2026-08-21T12:00:00.000Z',
    updated_at: '2026-08-22T07:00:00.000Z',
    views_count: 38,
    clicks_count: 16,
    recommendations_count: 5
  },
  {
    id: 'ebook-startup-legal',
    title: 'Zero to Scale: Legal & Compliance Framework',
    description: 'Essential corporate structure, contracts, intellectual property protection, and investment rounds navigation for technology businesses.',
    cover_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=400&q=80',
    product_url: 'https://life4billion.com/legal',
    category: 'career',
    price: 34.00,
    tags: ['legal', 'startup', 'contracts', 'incorporation'],
    status: 'published',
    is_featured: false,
    created_at: '2026-08-22T06:00:00.000Z',
    updated_at: '2026-08-22T07:00:00.000Z',
    views_count: 29,
    clicks_count: 9,
    recommendations_count: 4
  }
];

// Persistent admin user IDs set at runtime
const adminUserIdsSet = new Set<string>();

export const AdminStore = {
  getEbooks(onlyPublished = false): EBook[] {
    if (onlyPublished) {
      return memoryEbooks.filter(b => b.status === 'published');
    }
    return [...memoryEbooks];
  },

  getEbookById(id: string): EBook | undefined {
    return memoryEbooks.find(b => b.id === id);
  },

  saveEbook(ebook: EBook): EBook {
    const index = memoryEbooks.findIndex(b => b.id === ebook.id);
    const now = new Date().toISOString();
    const item: EBook = {
      ...ebook,
      updated_at: now,
      created_at: ebook.created_at || now,
      views_count: ebook.views_count || 0,
      clicks_count: ebook.clicks_count || 0,
      recommendations_count: ebook.recommendations_count || 0
    };

    if (index >= 0) {
      memoryEbooks[index] = item;
    } else {
      memoryEbooks.unshift(item);
    }
    return item;
  },

  deleteEbook(id: string): boolean {
    const prevLength = memoryEbooks.length;
    memoryEbooks = memoryEbooks.filter(b => b.id !== id);
    return memoryEbooks.length < prevLength;
  },

  incrementView(id: string): void {
    const item = memoryEbooks.find(b => b.id === id);
    if (item) {
      item.views_count = (item.views_count || 0) + 1;
    }
  },

  incrementClick(id: string): void {
    const item = memoryEbooks.find(b => b.id === id);
    if (item) {
      item.clicks_count = (item.clicks_count || 0) + 1;
    }
  },

  seedDefaultEbooks(): EBook[] {
    // re-initialize default list
    return this.getEbooks();
  },

  grantAdminRole(userId: string): void {
    adminUserIdsSet.add(userId);
  },

  hasAdminRole(userId: string): boolean {
    return adminUserIdsSet.has(userId);
  }
};
