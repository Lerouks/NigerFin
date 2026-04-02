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
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: string;
          stripe_customer_id: string | null;
          avatar_url: string | null;
          created_at: string;
          welcome_email_sent: boolean;
          is_blocked: boolean;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          role?: string;
          stripe_customer_id?: string | null;
          avatar_url?: string | null;
          welcome_email_sent?: boolean;
          is_blocked?: boolean;
        };
        Update: Partial<{
          email: string;
          full_name: string;
          role: string;
          stripe_customer_id: string | null;
          avatar_url: string | null;
          welcome_email_sent: boolean;
          is_blocked: boolean;
        }>;
      };
      articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          excerpt: string | null;
          category: string;
          content_type: string;
          author_id: string;
          main_image_url: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
          read_time: number | null;
          is_published: boolean;
        };
        Insert: {
          title: string;
          slug: string;
          content: string;
          excerpt?: string | null;
          category: string;
          content_type?: string;
          author_id: string;
          main_image_url?: string | null;
          published_at?: string | null;
          read_time?: number | null;
          is_published?: boolean;
        };
        Update: Partial<{
          title: string;
          slug: string;
          content: string;
          excerpt: string | null;
          category: string;
          content_type: string;
          author_id: string;
          main_image_url: string | null;
          published_at: string | null;
          read_time: number | null;
          is_published: boolean;
          updated_at: string;
        }>;
      };
      payment_requests: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          billing_cycle: string;
          status: string;
          payment_method: string;
          phone_number: string | null;
          created_at: string;
          processed_at: string | null;
          processed_by: string | null;
        };
        Insert: {
          user_id: string;
          amount: number;
          billing_cycle: string;
          status?: string;
          payment_method: string;
          phone_number?: string | null;
        };
        Update: Partial<{
          amount: number;
          billing_cycle: string;
          status: string;
          payment_method: string;
          phone_number: string | null;
          processed_at: string | null;
          processed_by: string | null;
        }>;
      };
      audit_log: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          target_user_id: string | null;
          details: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          admin_id: string;
          action: string;
          target_user_id?: string | null;
          details?: Record<string, unknown> | null;
        };
        Update: Partial<{
          admin_id: string;
          action: string;
          target_user_id: string | null;
          details: Record<string, unknown> | null;
        }>;
      };
      page_views: {
        Row: {
          id: string;
          path: string;
          referrer: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          path: string;
          referrer?: string | null;
          user_agent?: string | null;
        };
        Update: Partial<{
          path: string;
          referrer: string | null;
          user_agent: string | null;
        }>;
      };
      messages_contact: {
        Row: {
          id: string;
          name: string;
          email: string;
          subject: string;
          message: string;
          status: string;
          created_at: string;
        };
        Insert: {
          name: string;
          email: string;
          subject: string;
          message: string;
          status?: string;
        };
        Update: Partial<{
          name: string;
          email: string;
          subject: string;
          message: string;
          status: string;
        }>;
      };
    };
  };
}
