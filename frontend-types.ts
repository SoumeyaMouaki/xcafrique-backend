/**
 * Types TypeScript pour l'API XC Afrique Backend
 * À copier dans votre projet frontend React
 */

// ============================================
// Types de base
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
  error?: string;
  stack?: string;
  details?: string;
}

export interface PaginatedResponse<T> {
  success: true;
  count: number;
  total: number;
  page: number;
  pages: number;
  data: T[];
}

// ============================================
// Article
// ============================================

export interface CategoryInfo {
  _id: string;
  name: string;
  slug: string;
  color: string;
  description?: string;
}

export interface Article {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: CategoryInfo;
  author: string;
  featuredImage: string;
  tags: string[];
  publishedAt: string; // ISO date string
  views: number;
  status: 'published';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface ArticleListParams {
  page?: number;
  limit?: number;
  category?: string; // Slug ou ID
  search?: string;
}

export interface ArticleListResponse extends PaginatedResponse<Article> {}

export interface ArticleDetailResponse extends ApiResponse<Article> {
  success: true;
  data: Article;
}

// ============================================
// Category
// ============================================

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  isActive: boolean;
  articleCount: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface CategoryListResponse extends ApiResponse<Category[]> {
  success: true;
  count: number;
  data: Category[];
}

export interface CategoryDetailResponse extends ApiResponse<Category> {
  success: true;
  data: Category;
}

// ============================================
// Erreurs
// ============================================

export interface ApiError {
  success: false;
  message: string;
  error?: string;
  stack?: string;
  details?: string;
}

// ============================================
// Helpers
// ============================================

export type ArticleStatus = 'published' | 'draft';

export interface PaginationInfo {
  page: number;
  pages: number;
  total: number;
  count: number;
}

