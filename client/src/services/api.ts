import axios, { AxiosError } from "axios";
import type {
  AdminStats,
  Article,
  ArticleDetailResponse,
  ArticleListResponse,
  ArticleStatus,
  ArticleType,
  Category,
  DashboardData,
  PublicStats,
  SearchResponse,
  TagItem,
  User,
} from "../types";

/**
 * API location.
 *
 * Local development and single-service deployments use the relative `/api`
 * path (Vite proxies it to :5000). A split deployment — Netlify frontend,
 * Render backend — sets VITE_API_URL to the backend origin, e.g.
 * https://cyber-journal-api.onrender.com/api
 */
const rawBase = ((import.meta.env.VITE_API_URL as string | undefined) || "").trim();
const API_BASE = (rawBase || "/api").replace(/\/+$/, "");
const API_ORIGIN = /^https?:\/\//i.test(API_BASE) ? API_BASE.replace(/\/api$/, "") : "";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

/**
 * Uploaded covers and screenshots are stored as `/uploads/...` on the API
 * host. When the frontend is on another origin those relative paths would
 * point at Netlify, so resolve them against the API origin.
 */
export function assetUrl(path?: string | null) {
  if (!path) return "";
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) return path;
  if (!API_ORIGIN) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function errorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (error.code === "ERR_NETWORK" || error.code === "ECONNABORTED") {
      return "Cannot reach the journal API. Check that the server is running and VITE_API_URL is correct.";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export interface ArticleFilters {
  page?: number;
  limit?: number;
  platform?: string;
  difficulty?: string;
  category?: string;
  tag?: string;
  articleType?: ArticleType | `${ArticleType},${ArticleType}` | string;
  sort?: string;
}

/** Payload accepted by the article create/update endpoints. */
export interface ArticlePayload {
  title?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  category?: string;
  articleType?: ArticleType;
  platform?: string;
  difficulty?: string;
  operatingSystem?: string;
  skills?: string[];
  tags?: string[];
  toolsUsed?: string[];
  featured?: boolean;
  status?: ArticleStatus;
  seoTitle?: string;
  seoDescription?: string;
  source?: { name?: string; url?: string };
  isSample?: boolean;
}

function cleanParams(params: object) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== "" && value !== undefined && value !== null,
    ),
  );
}

export const articlesApi = {
  async list(filters: ArticleFilters = {}) {
    const { data } = await api.get<ArticleListResponse>("/articles", {
      params: cleanParams(filters),
    });
    return data;
  },
  async featured() {
    const { data } = await api.get<{ article: Article | null }>("/articles/featured");
    return data.article;
  },
  async stats() {
    const { data } = await api.get<PublicStats>("/articles/stats");
    return data;
  },
  async bySlug(slug: string) {
    const { data } = await api.get<ArticleDetailResponse>(`/articles/${slug}`);
    return data;
  },
  async search(term: string) {
    const { data } = await api.get<SearchResponse>("/articles/search", { params: { q: term } });
    return data;
  },
  async categories() {
    const { data } = await api.get<{ categories: Category[] }>("/categories");
    return data.categories;
  },
  async tags() {
    const { data } = await api.get<{ tags: TagItem[] }>("/tags");
    return data.tags;
  },
};

export const authApi = {
  async login(identifier: string, password: string) {
    const { data } = await api.post<{ user: User }>("/auth/login", { identifier, password });
    return data.user;
  },
  async me() {
    const { data } = await api.get<{ user: User }>("/auth/me");
    return data.user;
  },
  async logout() {
    await api.post("/auth/logout");
  },
};

export const adminApi = {
  async dashboard() {
    const { data } = await api.get<DashboardData>("/admin/dashboard");
    return data;
  },
  async stats() {
    const { data } = await api.get<AdminStats>("/admin/stats");
    return data;
  },
  async articles(params: { page?: number; status?: string; q?: string; limit?: number } = {}) {
    const { data } = await api.get<ArticleListResponse>("/admin/articles", {
      params: cleanParams(params),
    });
    return data;
  },
  async article(id: string) {
    const { data } = await api.get<{ article: Article }>(`/admin/articles/${id}`);
    return data.article;
  },
  async create(payload: ArticlePayload) {
    const { data } = await api.post<{ article: Article }>("/articles", payload);
    return data.article;
  },
  async update(id: string, payload: ArticlePayload) {
    const { data } = await api.put<{ article: Article }>(`/articles/${id}`, payload);
    return data.article;
  },
  async remove(id: string) {
    await api.delete(`/articles/${id}`);
  },
  async createCategory(payload: { name: string; description?: string }) {
    const { data } = await api.post<{ category: Category }>("/categories", payload);
    return data.category;
  },
  async updateCategory(id: string, payload: { name?: string; description?: string }) {
    const { data } = await api.put<{ category: Category }>(`/categories/${id}`, payload);
    return data.category;
  },
  async removeCategory(id: string) {
    await api.delete(`/categories/${id}`);
  },
  async createTag(name: string) {
    const { data } = await api.post<{ tag: TagItem }>("/tags", { name });
    return data.tag;
  },
  async removeTag(id: string) {
    await api.delete(`/tags/${id}`);
  },
};

export async function uploadImage(file: File) {
  const form = new FormData();
  form.append("image", file);
  const { data } = await api.post<{ url: string }>("/uploads", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
