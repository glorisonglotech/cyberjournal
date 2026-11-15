export type ArticleType = "ctf-writeup" | "tutorial" | "news" | "research" | "article";
export type ArticleStatus = "draft" | "published";

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  articleCount?: number;
}

export interface TagItem {
  _id: string;
  name: string;
  slug: string;
  articleCount?: number;
}

export interface Author {
  _id: string;
  username: string;
  role?: string;
}

export interface SourceRef {
  name?: string;
  url?: string;
}

export interface ArticleSummary {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  articleType: ArticleType;
  platform: string;
  difficulty: string;
  operatingSystem: string;
  skills: string[];
  tags: string[];
  toolsUsed: string[];
  featured: boolean;
  status: ArticleStatus;
  readingTime: number;
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  isSample?: boolean;
  source?: SourceRef;
  category: Category;
  author?: Author;
}

export interface Article extends ArticleSummary {
  content: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean;
}

export interface ArticleListResponse {
  articles: ArticleSummary[];
  pagination: Pagination;
}

export type ArticleLink = { title: string; slug: string; articleType: ArticleType; platform?: string };

export interface ArticleDetailResponse {
  article: Article;
  related: ArticleSummary[];
  previous: ArticleLink | null;
  next: ArticleLink | null;
}

export interface PublicStats {
  totals: {
    published: number;
    writeups: number;
    tutorials: number;
    platforms: number;
  };
  byType: Array<{ _id: ArticleType; count: number }>;
  byPlatform: Array<{ _id: string; count: number }>;
}

export interface SearchResponse {
  articles: ArticleSummary[];
  total: number;
  term: string;
  took: number;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  role: "admin";
  createdAt?: string;
  lastLoginAt?: string;
}

export interface DashboardData {
  counts: {
    total: number;
    published: number;
    drafts: number;
    featured: number;
    categories: number;
  };
  recent: Array<{
    _id: string;
    title: string;
    slug: string;
    status: ArticleStatus;
    articleType: ArticleType;
    updatedAt: string;
    readingTime: number;
  }>;
  byType: Array<{ _id: ArticleType; count: number }>;
  byPlatform: Array<{ _id: string; count: number }>;
}

export interface AdminStats {
  totals: {
    total: number;
    published: number;
    drafts: number;
    avgReadingTime: number;
  };
  topTags: Array<{ _id: string; count: number }>;
  topTools: Array<{ _id: string; count: number }>;
  latestPublished: {
    title: string;
    slug: string;
    publishedAt: string;
    articleType: ArticleType;
    platform?: string;
  } | null;
}
