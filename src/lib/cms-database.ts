export type CmsDatabase = {
  public: {
    Tables: {
      storyguide_categories: {
        Row: { slug: string; name: string; description: string; sort_order: number; visible: boolean; updated_at: string };
        Insert: { slug: string; name: string; description?: string; sort_order?: number; visible?: boolean; updated_at?: string };
        Update: { slug?: string; name?: string; description?: string; sort_order?: number; visible?: boolean; updated_at?: string };
        Relationships: [];
      };
      storyguide_books: {
        Row: { id: string; slug: string; title: string; category: string; subtitle: string; description: string; audience: string; themes: string[]; experience: string; cover_url: string; small_cover_url: string; pdf_path: string | null; published: boolean; sort_order: number; created_at: string; updated_at: string };
        Insert: { id?: string; slug: string; title: string; category: string; subtitle?: string; description?: string; audience?: string; themes?: string[]; experience?: string; cover_url?: string; small_cover_url?: string; pdf_path?: string | null; published?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Update: { id?: string; slug?: string; title?: string; category?: string; subtitle?: string; description?: string; audience?: string; themes?: string[]; experience?: string; cover_url?: string; small_cover_url?: string; pdf_path?: string | null; published?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      storyguide_site_content: {
        Row: { key: string; content: Record<string, string>; updated_at: string };
        Insert: { key: string; content?: Record<string, string>; updated_at?: string };
        Update: { key?: string; content?: Record<string, string>; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: { is_editor: { Args: Record<string, never>; Returns: boolean } };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
