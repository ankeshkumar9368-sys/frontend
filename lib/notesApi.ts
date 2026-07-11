export type BookmarkCategory = "Important" | "Revision" | "Formula" | "Definition" | "Example" | "Favorite";

export interface ChapterNotes {
  title?: string;
  subtitle?: string;
  subject?: string;
  classLevel?: string;
  pdfUrl?: string;
  totalPages?: number;
  estimatedReadingMinutes?: number;
}

export interface Bookmark {
  id: string;
  page: number;
  category: BookmarkCategory;
  chapterId: string;
}

export interface HighlightItem {
  id: string;
  page: number;
  color: string;
  text: string;
}

export interface StickyNote {
  id: string;
  chapterId: string;
  page: number;
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: string;
}

export interface AIResponse {
  result: string;
}

export const getChapterNotes = async (chapterId: string): Promise<ChapterNotes> => ({});
export const getBookmarks = async (chapterId: string): Promise<Bookmark[]> => ([]);
export const addBookmark = async (chapterId: string, data: any): Promise<Bookmark> => ({} as Bookmark);
export const removeBookmark = async (chapterId: string, id: string): Promise<void> => {};
export const getHighlights = async (chapterId: string): Promise<HighlightItem[]> => ([]);
export const addHighlight = async (chapterId: string, data: any): Promise<HighlightItem> => ({} as HighlightItem);
export const removeHighlight = async (chapterId: string, id: string): Promise<void> => {};
export const getStickyNotes = async (chapterId: string): Promise<StickyNote[]> => ([]);
export const saveStickyNotes = async (chapterId: string, notes: StickyNote[]): Promise<void> => {};
export const saveProgress = async (chapterId: string, page: number, scrollProgress: number): Promise<void> => {};
export const getProgress = async (chapterId: string): Promise<{ page: number } | null> => (null);
export const requestAIAssist = async (chapterId: string, selectedText: string, action: string): Promise<AIResponse> => ({ result: '' });
export const searchNotes = async (chapterId: string, query: string): Promise<any[]> => ([]);