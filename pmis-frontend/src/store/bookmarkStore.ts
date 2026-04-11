import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Recommendation } from '../types';

interface BookmarkState {
  bookmarks: Recommendation[];
  addBookmark: (rec: Recommendation) => void;
  removeBookmark: (internshipId: number) => void;
  isBookmarked: (internshipId: number) => boolean;
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      addBookmark: (rec: Recommendation) => {
        const current = get().bookmarks;
        if (current.length >= 10) {
          alert('Remove a saved internship to add another.');
          return;
        }
        if (!current.some(b => b.internship_id === rec.internship_id)) {
          set({ bookmarks: [...current, rec] });
        }
      },
      removeBookmark: (internshipId: number) => {
        set(state => ({
          bookmarks: state.bookmarks.filter(b => b.internship_id !== internshipId)
        }));
      },
      isBookmarked: (internshipId: number) => {
        return get().bookmarks.some(b => b.internship_id === internshipId);
      }
    }),
    {
      name: 'pmis_bookmarks',
    }
  )
);
