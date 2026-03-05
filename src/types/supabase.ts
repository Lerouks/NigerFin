export interface Database {
  public: {
    Tables: {
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tier: string;
          status: string;
          started_at: string;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          tier: string;
          status?: string;
          started_at?: string;
          expires_at?: string | null;
        };
        Update: Partial<{
          tier: string;
          status: string;
          expires_at: string | null;
        }>;
      };
      article_access_log: {
        Row: {
          id: string;
          user_id: string;
          article_id: string;
          is_premium: boolean;
          accessed_at: string;
        };
        Insert: {
          user_id: string;
          article_id: string;
          is_premium: boolean;
        };
        Update: never;
      };
      comments: {
        Row: {
          id: string;
          article_id: string;
          user_id: string;
          user_name: string;
          content: string;
          likes: number;
          created_at: string;
        };
        Insert: {
          article_id: string;
          user_id: string;
          user_name: string;
          content: string;
        };
        Update: Partial<{
          content: string;
          likes: number;
        }>;
      };
    };
  };
}
