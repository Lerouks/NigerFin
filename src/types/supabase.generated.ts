export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_cache: {
        Row: {
          created_at: string
          data: Json
          expires_at: string
          fetched_at: string
          id: string
          key: string
          source: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          expires_at?: string
          fetched_at?: string
          id?: string
          key: string
          source: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          expires_at?: string
          fetched_at?: string
          id?: string
          key?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      api_health_log: {
        Row: {
          checked_at: string
          error_message: string | null
          id: string
          response_time_ms: number | null
          source: string
          status: string
        }
        Insert: {
          checked_at?: string
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          source: string
          status: string
        }
        Update: {
          checked_at?: string
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      article_access_log: {
        Row: {
          accessed_at: string | null
          article_slug: string
          id: string
          user_id: string
        }
        Insert: {
          accessed_at?: string | null
          article_slug: string
          id?: string
          user_id: string
        }
        Update: {
          accessed_at?: string | null
          article_slug?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      article_likes: {
        Row: {
          article_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_avatar: string | null
          author_name: string
          body: string
          category: string
          content_type: string
          created_at: string
          excerpt: string | null
          featured_order: number | null
          id: string
          is_featured: boolean
          main_image_alt: string | null
          main_image_caption: string | null
          main_image_source: string | null
          main_image_url: string | null
          published_at: string | null
          read_time: number | null
          sections: string[] | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          subtitle: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_avatar?: string | null
          author_name?: string
          body?: string
          category: string
          content_type?: string
          created_at?: string
          excerpt?: string | null
          featured_order?: number | null
          id?: string
          is_featured?: boolean
          main_image_alt?: string | null
          main_image_caption?: string | null
          main_image_source?: string | null
          main_image_url?: string | null
          published_at?: string | null
          read_time?: number | null
          sections?: string[] | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          subtitle?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_avatar?: string | null
          author_name?: string
          body?: string
          category?: string
          content_type?: string
          created_at?: string
          excerpt?: string | null
          featured_order?: number | null
          id?: string
          is_featured?: boolean
          main_image_alt?: string | null
          main_image_caption?: string | null
          main_image_source?: string | null
          main_image_url?: string | null
          published_at?: string | null
          read_time?: number | null
          sections?: string[] | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          subtitle?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_admin_profile_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_attempts: {
        Row: {
          created_at: string
          email: string
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          article_id: string
          content: string
          created_at: string | null
          id: string
          likes: number | null
          parent_comment_id: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          article_id: string
          content: string
          created_at?: string | null
          id?: string
          likes?: number | null
          parent_comment_id?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          article_id?: string
          content?: string
          created_at?: string | null
          id?: string
          likes?: number | null
          parent_comment_id?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_parent_comment"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_comments: {
        Row: {
          content: string
          created_at: string
          discussion_id: string
          id: string
          parent_comment_id: string | null
          user_id: string
          username: string
        }
        Insert: {
          content: string
          created_at?: string
          discussion_id: string
          id?: string
          parent_comment_id?: string | null
          user_id: string
          username: string
        }
        Update: {
          content?: string
          created_at?: string
          discussion_id?: string
          id?: string
          parent_comment_id?: string | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_comments_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      discussions: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          title: string
          user_id: string
          username: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          title: string
          user_id: string
          username: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          title?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      dynamic_pricing: {
        Row: {
          amount: number
          billing_cycle: string
          id: string
          tier: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          billing_cycle: string
          id?: string
          tier: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          billing_cycle?: string
          id?: string
          tier?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      education_categories: {
        Row: {
          available: boolean
          created_at: string
          description: string | null
          icon: string
          id: string
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          available?: boolean
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          available?: boolean
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      education_lessons: {
        Row: {
          access_level: string
          category_id: string
          content: string
          created_at: string
          duration: string
          id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          access_level?: string
          category_id: string
          content?: string
          created_at?: string
          duration?: string
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          access_level?: string
          category_id?: string
          content?: string
          created_at?: string
          duration?: string
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_lessons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "education_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      flash_banner: {
        Row: {
          enabled: boolean
          id: number
          items: Json
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          id?: number
          items?: Json
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          id?: number
          items?: Json
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_xof: number
          billing_cycle: string | null
          created_at: string
          currency: string
          customer: Json
          description: string
          id: string
          invoice_number: string
          issuer: Json
          line_items: Json
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          pdf_path: string | null
          period_end: string | null
          period_start: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_xof: number
          billing_cycle?: string | null
          created_at?: string
          currency?: string
          customer: Json
          description: string
          id?: string
          invoice_number: string
          issuer: Json
          line_items: Json
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          pdf_path?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_xof?: number
          billing_cycle?: string | null
          created_at?: string
          currency?: string
          customer?: Json
          description?: string
          id?: string
          invoice_number?: string
          issuer?: Json
          line_items?: Json
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          pdf_path?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_path_steps: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          path_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          path_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          path_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_steps_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "education_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_steps_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          available: boolean
          created_at: string
          description: string
          difficulty: string
          goal_label: string
          icon: string
          id: string
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          available?: boolean
          created_at?: string
          description?: string
          difficulty?: string
          goal_label?: string
          icon?: string
          id?: string
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          available?: boolean
          created_at?: string
          description?: string
          difficulty?: string
          goal_label?: string
          icon?: string
          id?: string
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      legal_sections: {
        Row: {
          display_order: number
          heading: string
          id: string
          page_slug: string
          text: string
          updated_at: string
        }
        Insert: {
          display_order?: number
          heading: string
          id?: string
          page_slug: string
          text: string
          updated_at?: string
        }
        Update: {
          display_order?: number
          heading?: string
          id?: string
          page_slug?: string
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_data: {
        Row: {
          change: number
          change_percent: number
          created_at: string | null
          description: string | null
          education_link: string | null
          id: string
          name: string
          previous_close: number | null
          source: string | null
          symbol: string
          type: string
          unit: string | null
          updated_at: string
          value: number
        }
        Insert: {
          change?: number
          change_percent?: number
          created_at?: string | null
          description?: string | null
          education_link?: string | null
          id?: string
          name: string
          previous_close?: number | null
          source?: string | null
          symbol: string
          type: string
          unit?: string | null
          updated_at?: string
          value: number
        }
        Update: {
          change?: number
          change_percent?: number
          created_at?: string | null
          description?: string | null
          education_link?: string | null
          id?: string
          name?: string
          previous_close?: number | null
          source?: string | null
          symbol?: string
          type?: string
          unit?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      messages_contact: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          ip_address: string | null
          message: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          ip_address?: string | null
          message: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          ip_address?: string | null
          message?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_events: {
        Row: {
          event_type: string
          id: string
          issue_id: string | null
          meta: Json | null
          occurred_at: string
          subscriber_id: string | null
        }
        Insert: {
          event_type: string
          id?: string
          issue_id?: string | null
          meta?: Json | null
          occurred_at?: string
          subscriber_id?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          issue_id?: string | null
          meta?: Json | null
          occurred_at?: string
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_events_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "newsletter_issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_events_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_issues: {
        Row: {
          audience: string
          bounced_count: number
          clicked_count: number
          content: Json
          created_at: string
          delivered_count: number
          id: string
          number: number
          opened_count: number
          preheader: string | null
          recipients_count: number
          scheduled_at: string | null
          sent_at: string | null
          slug: string
          status: string
          subject: string
          unsubscribed_count: number
          updated_at: string
        }
        Insert: {
          audience?: string
          bounced_count?: number
          clicked_count?: number
          content: Json
          created_at?: string
          delivered_count?: number
          id?: string
          number: number
          opened_count?: number
          preheader?: string | null
          recipients_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          slug: string
          status?: string
          subject: string
          unsubscribed_count?: number
          updated_at?: string
        }
        Update: {
          audience?: string
          bounced_count?: number
          clicked_count?: number
          content?: Json
          created_at?: string
          delivered_count?: number
          id?: string
          number?: number
          opened_count?: number
          preheader?: string | null
          recipients_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          slug?: string
          status?: string
          subject?: string
          unsubscribed_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_preferences: {
        Row: {
          alerts_custom: boolean | null
          alerts_news: boolean | null
          brevo_contact_id: string | null
          created_at: string | null
          id: string
          newsletter_monthly: boolean | null
          newsletter_weekly: boolean | null
          reports_pdf: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alerts_custom?: boolean | null
          alerts_news?: boolean | null
          brevo_contact_id?: string | null
          created_at?: string | null
          id?: string
          newsletter_monthly?: boolean | null
          newsletter_weekly?: boolean | null
          reports_pdf?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alerts_custom?: boolean | null
          alerts_news?: boolean | null
          brevo_contact_id?: string | null
          created_at?: string | null
          id?: string
          newsletter_monthly?: boolean | null
          newsletter_weekly?: boolean | null
          reports_pdf?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          locale: string
          opt_in_at: string
          source: string | null
          status: string
          unsubscribe_token: string
          unsubscribed_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          locale?: string
          opt_in_at?: string
          source?: string | null
          status?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          locale?: string
          opt_in_at?: string
          source?: string | null
          status?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      niger_country_facts: {
        Row: {
          category: string | null
          display_order: number | null
          fact_key: string
          icon: string | null
          id: string
          is_visible: boolean
          label: string
          updated_at: string | null
          value: string
        }
        Insert: {
          category?: string | null
          display_order?: number | null
          fact_key: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          label: string
          updated_at?: string | null
          value: string
        }
        Update: {
          category?: string | null
          display_order?: number | null
          fact_key?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          label?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      niger_economic_indicators: {
        Row: {
          category: string | null
          display_order: number | null
          icon: string | null
          id: string
          indicator_key: string
          is_visible: boolean
          label: string
          previous_value: number | null
          unit: string
          updated_at: string | null
          value: number
        }
        Insert: {
          category?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          indicator_key: string
          is_visible?: boolean
          label: string
          previous_value?: number | null
          unit?: string
          updated_at?: string | null
          value: number
        }
        Update: {
          category?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          indicator_key?: string
          is_visible?: boolean
          label?: string
          previous_value?: number | null
          unit?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      niger_indicator_history: {
        Row: {
          created_at: string | null
          date: string
          id: string
          indicator_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          indicator_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          indicator_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "niger_indicator_history_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "niger_economic_indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      niger_partners: {
        Row: {
          country_code: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          name: string
          type: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          type?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      niger_presentation: {
        Row: {
          id: number
          intro_text: string | null
          intro_title: string | null
          map_image_alt: string | null
          map_image_url: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          intro_text?: string | null
          intro_title?: string | null
          map_image_alt?: string | null
          map_image_url?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          intro_text?: string | null
          intro_title?: string | null
          map_image_alt?: string | null
          map_image_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      niger_regions: {
        Row: {
          area_km2: number | null
          capital: string
          coordinates_x: number | null
          coordinates_y: number | null
          created_at: string | null
          description: string | null
          economic_activities: string[] | null
          id: string
          is_visible: boolean
          name: string
          natural_resources: string[] | null
          population: number | null
          security_level: string | null
          security_note: string | null
          updated_at: string | null
        }
        Insert: {
          area_km2?: number | null
          capital: string
          coordinates_x?: number | null
          coordinates_y?: number | null
          created_at?: string | null
          description?: string | null
          economic_activities?: string[] | null
          id?: string
          is_visible?: boolean
          name: string
          natural_resources?: string[] | null
          population?: number | null
          security_level?: string | null
          security_note?: string | null
          updated_at?: string | null
        }
        Update: {
          area_km2?: number | null
          capital?: string
          coordinates_x?: number | null
          coordinates_y?: number | null
          created_at?: string | null
          description?: string | null
          economic_activities?: string[] | null
          id?: string
          is_visible?: boolean
          name?: string
          natural_resources?: string[] | null
          population?: number | null
          security_level?: string | null
          security_note?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      niger_resource_history: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          production: number | null
          resource_id: string
          unit: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          production?: number | null
          resource_id: string
          unit?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          production?: number | null
          resource_id?: string
          unit?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "niger_resource_history_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "niger_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      niger_resources: {
        Row: {
          active: boolean | null
          created_at: string | null
          economic_importance: string | null
          estimated_production: string | null
          id: string
          importance_description: string | null
          is_visible: boolean
          location_name: string | null
          name: string
          operating_companies: string[] | null
          production_unit: string | null
          region_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          economic_importance?: string | null
          estimated_production?: string | null
          id?: string
          importance_description?: string | null
          is_visible?: boolean
          location_name?: string | null
          name: string
          operating_companies?: string[] | null
          production_unit?: string | null
          region_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          economic_importance?: string | null
          estimated_production?: string | null
          id?: string
          importance_description?: string | null
          is_visible?: boolean
          location_name?: string | null
          name?: string
          operating_companies?: string[] | null
          production_unit?: string | null
          region_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "niger_resources_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "niger_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          article_id: string | null
          id: string
          page_path: string
          referrer: string | null
          viewed_at: string
        }
        Insert: {
          article_id?: string | null
          id?: string
          page_path: string
          referrer?: string | null
          viewed_at?: string
        }
        Update: {
          article_id?: string | null
          id?: string
          page_path?: string
          referrer?: string | null
          viewed_at?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          amount: number
          billing_cycle: string
          created_at: string
          id: string
          payment_method: string
          rejection_reason: string | null
          status: string
          subscription_expires_at: string | null
          tier: string
          transaction_number: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          billing_cycle: string
          created_at?: string
          id?: string
          payment_method: string
          rejection_reason?: string | null
          status?: string
          subscription_expires_at?: string | null
          tier: string
          transaction_number: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          billing_cycle?: string
          created_at?: string
          id?: string
          payment_method?: string
          rejection_reason?: string | null
          status?: string
          subscription_expires_at?: string | null
          tier?: string
          transaction_number?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_user_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paywall_analytics: {
        Row: {
          article_id: string | null
          created_at: string
          event_type: string
          id: string
          overlay_case: string | null
          read_time_seconds: number | null
          scroll_depth: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          overlay_case?: string | null
          read_time_seconds?: number | null
          scroll_depth?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          overlay_case?: string | null
          read_time_seconds?: number | null
          scroll_depth?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      paywall_config: {
        Row: {
          bg_color: string
          counter_message: string
          cta_bg_color: string
          cta_dismiss_text: string
          cta_login_text: string
          cta_subscribe_text: string
          cta_text_color: string
          delay_seconds: number
          dismiss_cookie_hours: number
          enabled: boolean
          id: number
          message: string
          scroll_percent: number
          show_article_counter: boolean
          text_color: string
          title: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          bg_color?: string
          counter_message?: string
          cta_bg_color?: string
          cta_dismiss_text?: string
          cta_login_text?: string
          cta_subscribe_text?: string
          cta_text_color?: string
          delay_seconds?: number
          dismiss_cookie_hours?: number
          enabled?: boolean
          id?: number
          message?: string
          scroll_percent?: number
          show_article_counter?: boolean
          text_color?: string
          title?: string
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          bg_color?: string
          counter_message?: string
          cta_bg_color?: string
          cta_dismiss_text?: string
          cta_login_text?: string
          cta_subscribe_text?: string
          cta_text_color?: string
          delay_seconds?: number
          dismiss_cookie_hours?: number
          enabled?: boolean
          id?: number
          message?: string
          scroll_percent?: number
          show_article_counter?: boolean
          text_color?: string
          title?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      premium_article_tracking: {
        Row: {
          article_id: string
          article_slug: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          article_id: string
          article_slug: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          article_id?: string
          article_slug?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          id: number
          key: string
        }
        Insert: {
          created_at?: string
          id?: never
          key: string
        }
        Update: {
          created_at?: string
          id?: never
          key?: string
        }
        Relationships: []
      }
      strategic_enterprises: {
        Row: {
          brand_color: string | null
          created_at: string
          description: string
          detailed_description: string | null
          display_order: number
          employees: string | null
          founded_year: number | null
          full_name: string | null
          headquarters: string | null
          id: string
          image_url: string | null
          is_visible: boolean
          key_facts: Json | null
          logo_url: string | null
          name: string
          ownership: string | null
          revenue: string | null
          sector: string
          slug: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          description?: string
          detailed_description?: string | null
          display_order?: number
          employees?: string | null
          founded_year?: number | null
          full_name?: string | null
          headquarters?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean
          key_facts?: Json | null
          logo_url?: string | null
          name: string
          ownership?: string | null
          revenue?: string | null
          sector: string
          slug?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          description?: string
          detailed_description?: string | null
          display_order?: number
          employees?: string | null
          founded_year?: number | null
          full_name?: string | null
          headquarters?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean
          key_facts?: Json | null
          logo_url?: string | null
          name?: string
          ownership?: string | null
          revenue?: string | null
          sector?: string
          slug?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string | null
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          price_amount: number | null
          status: string
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_amount?: number | null
          status?: string
          tier?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_amount?: number | null
          status?: string
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tool_pdf_documents: {
        Row: {
          generated_at: string
          id: string
          params: Json
          recipient_civility: string | null
          recipient_name: string | null
          reference: string
          results: Json
          title: string
          tool_slug: string
          user_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          params?: Json
          recipient_civility?: string | null
          recipient_name?: string | null
          reference: string
          results?: Json
          title: string
          tool_slug: string
          user_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          params?: Json
          recipient_civility?: string | null
          recipient_name?: string | null
          reference?: string
          results?: Json
          title?: string
          tool_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      user_lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          last_viewed_at: string
          lesson_id: string
          quiz_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          last_viewed_at?: string
          lesson_id: string
          quiz_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          last_viewed_at?: string
          lesson_id?: string
          quiz_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "education_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          address: string | null
          billing_cycle: string | null
          birth_day: number | null
          birth_month: number | null
          birth_year: number | null
          blocked: boolean | null
          city: string | null
          civility: string | null
          country: string | null
          created_at: string
          email: string
          expiration_warning_sent: boolean | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          newsletter_subscribed: boolean
          phone: string | null
          postal_code: string | null
          premium_articles_read_this_month: number
          premium_articles_reset_at: string | null
          profession: string | null
          profile_completed: boolean | null
          role: string
          subscription_end: string | null
          subscription_granted_by: string | null
          subscription_start: string | null
          subscription_status: string
          subscription_updated_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          billing_cycle?: string | null
          birth_day?: number | null
          birth_month?: number | null
          birth_year?: number | null
          blocked?: boolean | null
          city?: string | null
          civility?: string | null
          country?: string | null
          created_at?: string
          email: string
          expiration_warning_sent?: boolean | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          newsletter_subscribed?: boolean
          phone?: string | null
          postal_code?: string | null
          premium_articles_read_this_month?: number
          premium_articles_reset_at?: string | null
          profession?: string | null
          profile_completed?: boolean | null
          role?: string
          subscription_end?: string | null
          subscription_granted_by?: string | null
          subscription_start?: string | null
          subscription_status?: string
          subscription_updated_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          billing_cycle?: string | null
          birth_day?: number | null
          birth_month?: number | null
          birth_year?: number | null
          blocked?: boolean | null
          city?: string | null
          civility?: string | null
          country?: string | null
          created_at?: string
          email?: string
          expiration_warning_sent?: boolean | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          newsletter_subscribed?: boolean
          phone?: string | null
          postal_code?: string | null
          premium_articles_read_this_month?: number
          premium_articles_reset_at?: string | null
          profession?: string | null
          profile_completed?: boolean | null
          role?: string
          subscription_end?: string | null
          subscription_granted_by?: string | null
          subscription_start?: string | null
          subscription_status?: string
          subscription_updated_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_rate_limits: { Args: never; Returns: undefined }
      generate_invoice_number: { Args: never; Returns: string }
      increment_premium_count: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      next_user_pdf_reference: { Args: { p_user_id: string }; Returns: string }
      reset_market_previous_close: { Args: never; Returns: undefined }
      reset_monthly_premium_count: { Args: never; Returns: undefined }
      set_featured_article: {
        Args: { target_article_id: string }
        Returns: undefined
      }
      unfeature_article: {
        Args: { target_article_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
