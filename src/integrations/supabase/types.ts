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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      _backup_webhook_functions: {
        Row: {
          backed_up_at: string | null
          definition: string | null
          function_name: string | null
          id: number
        }
        Insert: {
          backed_up_at?: string | null
          definition?: string | null
          function_name?: string | null
          id?: number
        }
        Update: {
          backed_up_at?: string | null
          definition?: string | null
          function_name?: string | null
          id?: number
        }
        Relationships: []
      }
      affiliate_audit_log: {
        Row: {
          action: string
          affiliate_id: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_status: string | null
          performed_by: string | null
          previous_status: string | null
        }
        Insert: {
          action: string
          affiliate_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_status?: string | null
          performed_by?: string | null
          previous_status?: string | null
        }
        Update: {
          action?: string
          affiliate_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_status?: string | null
          performed_by?: string | null
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_audit_log_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_pixels: {
        Row: {
          affiliate_id: string
          created_at: string | null
          custom_value_boleto: number | null
          custom_value_card: number | null
          custom_value_pix: number | null
          domain: string | null
          enabled: boolean | null
          fire_on_boleto: boolean | null
          fire_on_card: boolean | null
          fire_on_pix: boolean | null
          id: string
          pixel_id: string
          platform: string
          updated_at: string | null
        }
        Insert: {
          affiliate_id: string
          created_at?: string | null
          custom_value_boleto?: number | null
          custom_value_card?: number | null
          custom_value_pix?: number | null
          domain?: string | null
          enabled?: boolean | null
          fire_on_boleto?: boolean | null
          fire_on_card?: boolean | null
          fire_on_pix?: boolean | null
          id?: string
          pixel_id: string
          platform: string
          updated_at?: string | null
        }
        Update: {
          affiliate_id?: string
          created_at?: string | null
          custom_value_boleto?: number | null
          custom_value_card?: number | null
          custom_value_pix?: number | null
          domain?: string | null
          enabled?: boolean | null
          fire_on_boleto?: boolean | null
          fire_on_card?: boolean | null
          fire_on_pix?: boolean | null
          id?: string
          pixel_id?: string
          platform?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_pixels_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_code: string
          commission_rate: number | null
          created_at: string | null
          credit_card_gateway: string | null
          gateway_credentials: Json | null
          id: string
          pix_gateway: string | null
          product_id: string
          status: string
          total_sales_amount: number | null
          total_sales_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          affiliate_code: string
          commission_rate?: number | null
          created_at?: string | null
          credit_card_gateway?: string | null
          gateway_credentials?: Json | null
          id?: string
          pix_gateway?: string | null
          product_id: string
          status?: string
          total_sales_amount?: number | null
          total_sales_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          affiliate_code?: string
          commission_rate?: number | null
          created_at?: string | null
          credit_card_gateway?: string | null
          gateway_credentials?: Json | null
          id?: string
          pix_gateway?: string | null
          product_id?: string
          status?: string
          total_sales_amount?: number | null
          total_sales_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      buyer_audit_log: {
        Row: {
          action: string
          buyer_id: string | null
          created_at: string | null
          details: Json | null
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean | null
          user_agent: string | null
        }
        Insert: {
          action: string
          buyer_id?: string | null
          created_at?: string | null
          details?: Json | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          buyer_id?: string | null
          created_at?: string | null
          details?: Json | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_audit_log_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_content_access: {
        Row: {
          buyer_id: string
          content_id: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          unlocked_at: string | null
        }
        Insert: {
          buyer_id: string
          content_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          unlocked_at?: string | null
        }
        Update: {
          buyer_id?: string
          content_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_content_access_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_content_access_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "product_member_content"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_content_progress: {
        Row: {
          buyer_id: string
          completed_at: string | null
          content_id: string
          id: string
          last_position_seconds: number | null
          progress_percent: number | null
          started_at: string | null
          updated_at: string | null
          watch_time_seconds: number | null
        }
        Insert: {
          buyer_id: string
          completed_at?: string | null
          content_id: string
          id?: string
          last_position_seconds?: number | null
          progress_percent?: number | null
          started_at?: string | null
          updated_at?: string | null
          watch_time_seconds?: number | null
        }
        Update: {
          buyer_id?: string
          completed_at?: string | null
          content_id?: string
          id?: string
          last_position_seconds?: number | null
          progress_percent?: number | null
          started_at?: string | null
          updated_at?: string | null
          watch_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_content_progress_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_content_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "product_member_content"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_groups: {
        Row: {
          buyer_id: string
          expires_at: string | null
          granted_at: string | null
          group_id: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          buyer_id: string
          expires_at?: string | null
          granted_at?: string | null
          group_id: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          buyer_id?: string
          expires_at?: string | null
          granted_at?: string | null
          group_id?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_groups_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "product_member_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_product_access: {
        Row: {
          access_type: string | null
          buyer_id: string
          expires_at: string | null
          granted_at: string | null
          id: string
          is_active: boolean | null
          order_id: string | null
          product_id: string
          revoked_at: string | null
          revoked_by_event_id: string | null
          revoked_reason: string | null
        }
        Insert: {
          access_type?: string | null
          buyer_id: string
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          is_active?: boolean | null
          order_id?: string | null
          product_id: string
          revoked_at?: string | null
          revoked_by_event_id?: string | null
          revoked_reason?: string | null
        }
        Update: {
          access_type?: string | null
          buyer_id?: string
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          is_active?: boolean | null
          order_id?: string | null
          product_id?: string
          revoked_at?: string | null
          revoked_by_event_id?: string | null
          revoked_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_product_access_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_product_access_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_product_access_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_product_access_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_product_access_revoked_by_event_id_fkey"
            columns: ["revoked_by_event_id"]
            isOneToOne: false
            referencedRelation: "order_lifecycle_events"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_quiz_attempts: {
        Row: {
          answers: Json | null
          buyer_id: string
          completed_at: string | null
          id: string
          passed: boolean | null
          quiz_id: string
          score: number | null
          started_at: string | null
          time_spent_seconds: number | null
          total_points: number | null
        }
        Insert: {
          answers?: Json | null
          buyer_id: string
          completed_at?: string | null
          id?: string
          passed?: boolean | null
          quiz_id: string
          score?: number | null
          started_at?: string | null
          time_spent_seconds?: number | null
          total_points?: number | null
        }
        Update: {
          answers?: Json | null
          buyer_id?: string
          completed_at?: string | null
          id?: string
          passed?: boolean | null
          quiz_id?: string
          score?: number | null
          started_at?: string | null
          time_spent_seconds?: number | null
          total_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_quiz_attempts_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_rate_limits: {
        Row: {
          action: string
          attempts: number | null
          blocked_until: string | null
          created_at: string | null
          first_attempt_at: string | null
          id: string
          identifier: string
          last_attempt_at: string | null
        }
        Insert: {
          action: string
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt_at?: string | null
          id?: string
          identifier: string
          last_attempt_at?: string | null
        }
        Update: {
          action?: string
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt_at?: string | null
          id?: string
          identifier?: string
          last_attempt_at?: string | null
        }
        Relationships: []
      }
      buyer_saved_cards: {
        Row: {
          brand: string | null
          buyer_id: string
          card_holder_name: string | null
          created_at: string | null
          exp_month: number | null
          exp_year: number | null
          gateway: string
          gateway_card_id: string
          id: string
          is_default: boolean | null
          last_four: string | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          buyer_id: string
          card_holder_name?: string | null
          created_at?: string | null
          exp_month?: number | null
          exp_year?: number | null
          gateway: string
          gateway_card_id: string
          id?: string
          is_default?: boolean | null
          last_four?: string | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          buyer_id?: string
          card_holder_name?: string | null
          created_at?: string | null
          exp_month?: number | null
          exp_year?: number | null
          gateway?: string
          gateway_card_id?: string
          id?: string
          is_default?: boolean | null
          last_four?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_saved_cards_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          background_image_url: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          logo_url: string | null
          name: string
          primary_color: string | null
          product_id: string
          secondary_color: string | null
          template_html: string | null
          updated_at: string | null
        }
        Insert: {
          background_image_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          product_id: string
          secondary_color?: string | null
          template_html?: string | null
          updated_at?: string | null
        }
        Update: {
          background_image_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          product_id?: string
          secondary_color?: string | null
          template_html?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_templates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          buyer_id: string
          buyer_name: string
          completion_date: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          pdf_url: string | null
          product_id: string
          product_name: string
          template_id: string | null
          verification_code: string
        }
        Insert: {
          buyer_id: string
          buyer_name: string
          completion_date?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          pdf_url?: string | null
          product_id: string
          product_name: string
          template_id?: string | null
          verification_code: string
        }
        Update: {
          buyer_id?: string
          buyer_name?: string
          completion_date?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          pdf_url?: string | null
          product_id?: string
          product_name?: string
          template_id?: string | null
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_components: {
        Row: {
          component_order: number
          content: Json
          created_at: string | null
          id: string
          row_id: string
          type: string
        }
        Insert: {
          component_order: number
          content?: Json
          created_at?: string | null
          id?: string
          row_id: string
          type: string
        }
        Update: {
          component_order?: number
          content?: Json
          created_at?: string | null
          id?: string
          row_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_components_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: false
            referencedRelation: "checkout_rows"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_links: {
        Row: {
          checkout_id: string
          created_at: string | null
          id: string
          link_id: string
        }
        Insert: {
          checkout_id: string
          created_at?: string | null
          id?: string
          link_id: string
        }
        Update: {
          checkout_id?: string
          created_at?: string | null
          id?: string
          link_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_links_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_links_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: true
            referencedRelation: "payment_links"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_rows: {
        Row: {
          checkout_id: string
          created_at: string | null
          id: string
          layout: string
          row_order: number
        }
        Insert: {
          checkout_id: string
          created_at?: string | null
          id?: string
          layout: string
          row_order: number
        }
        Update: {
          checkout_id?: string
          created_at?: string | null
          id?: string
          layout?: string
          row_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "checkout_rows_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkouts"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_sessions: {
        Row: {
          id: string
          last_seen_at: string
          order_id: string | null
          started_at: string
          status: string
          vendor_id: string
        }
        Insert: {
          id?: string
          last_seen_at?: string
          order_id?: string | null
          started_at?: string
          status?: string
          vendor_id: string
        }
        Update: {
          id?: string
          last_seen_at?: string
          order_id?: string | null
          started_at?: string
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_visits: {
        Row: {
          checkout_id: string
          id: string
          ip_address: string | null
          referrer: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visited_at: string
        }
        Insert: {
          checkout_id: string
          id?: string
          ip_address?: string | null
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visited_at?: string
        }
        Update: {
          checkout_id?: string
          id?: string
          ip_address?: string | null
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visited_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_visits_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkouts"
            referencedColumns: ["id"]
          },
        ]
      }
      checkouts: {
        Row: {
          active_text_color: string | null
          background_color: string | null
          background_image_expand: boolean | null
          background_image_fixed: boolean | null
          background_image_repeat: boolean | null
          background_image_url: string | null
          bottom_components: Json | null
          box_bg_color: string | null
          box_header_bg_color: string | null
          box_header_primary_text_color: string | null
          box_header_secondary_text_color: string | null
          box_primary_text_color: string | null
          box_secondary_text_color: string | null
          button_color: string | null
          button_text_color: string | null
          cc_field_background_color: string | null
          cc_field_border_color: string | null
          cc_field_focus_border_color: string | null
          cc_field_focus_text_color: string | null
          cc_field_placeholder_color: string | null
          cc_field_text_color: string | null
          components: Json | null
          created_at: string | null
          credit_card_gateway:
            | Database["public"]["Enums"]["credit_card_gateway_type"]
            | null
          design: Json | null
          font: string | null
          form_background_color: string | null
          icon_color: string | null
          id: string
          is_default: boolean
          is_mobile_synced: boolean
          mercadopago_public_key: string | null
          mobile_bottom_components: Json | null
          mobile_top_components: Json | null
          name: string
          payment_button_bg_color: string | null
          payment_button_text_color: string | null
          pix_gateway: Database["public"]["Enums"]["pix_gateway_type"] | null
          primary_color: string | null
          primary_text_color: string | null
          product_id: string | null
          secondary_color: string | null
          secondary_text_color: string | null
          selected_box_bg_color: string | null
          selected_box_header_bg_color: string | null
          selected_box_header_primary_text_color: string | null
          selected_box_header_secondary_text_color: string | null
          selected_box_primary_text_color: string | null
          selected_box_secondary_text_color: string | null
          selected_button_bg_color: string | null
          selected_button_icon_color: string | null
          selected_button_text_color: string | null
          selected_payment_color: string | null
          seller_name: string | null
          slug: string | null
          status: string | null
          stripe_public_key: string | null
          text_color: string | null
          theme: string | null
          top_components: Json | null
          unselected_box_bg_color: string | null
          unselected_box_header_bg_color: string | null
          unselected_box_header_primary_text_color: string | null
          unselected_box_header_secondary_text_color: string | null
          unselected_box_primary_text_color: string | null
          unselected_box_secondary_text_color: string | null
          unselected_button_bg_color: string | null
          unselected_button_icon_color: string | null
          unselected_button_text_color: string | null
          updated_at: string | null
          visits_count: number
        }
        Insert: {
          active_text_color?: string | null
          background_color?: string | null
          background_image_expand?: boolean | null
          background_image_fixed?: boolean | null
          background_image_repeat?: boolean | null
          background_image_url?: string | null
          bottom_components?: Json | null
          box_bg_color?: string | null
          box_header_bg_color?: string | null
          box_header_primary_text_color?: string | null
          box_header_secondary_text_color?: string | null
          box_primary_text_color?: string | null
          box_secondary_text_color?: string | null
          button_color?: string | null
          button_text_color?: string | null
          cc_field_background_color?: string | null
          cc_field_border_color?: string | null
          cc_field_focus_border_color?: string | null
          cc_field_focus_text_color?: string | null
          cc_field_placeholder_color?: string | null
          cc_field_text_color?: string | null
          components?: Json | null
          created_at?: string | null
          credit_card_gateway?:
            | Database["public"]["Enums"]["credit_card_gateway_type"]
            | null
          design?: Json | null
          font?: string | null
          form_background_color?: string | null
          icon_color?: string | null
          id?: string
          is_default?: boolean
          is_mobile_synced?: boolean
          mercadopago_public_key?: string | null
          mobile_bottom_components?: Json | null
          mobile_top_components?: Json | null
          name: string
          payment_button_bg_color?: string | null
          payment_button_text_color?: string | null
          pix_gateway?: Database["public"]["Enums"]["pix_gateway_type"] | null
          primary_color?: string | null
          primary_text_color?: string | null
          product_id?: string | null
          secondary_color?: string | null
          secondary_text_color?: string | null
          selected_box_bg_color?: string | null
          selected_box_header_bg_color?: string | null
          selected_box_header_primary_text_color?: string | null
          selected_box_header_secondary_text_color?: string | null
          selected_box_primary_text_color?: string | null
          selected_box_secondary_text_color?: string | null
          selected_button_bg_color?: string | null
          selected_button_icon_color?: string | null
          selected_button_text_color?: string | null
          selected_payment_color?: string | null
          seller_name?: string | null
          slug?: string | null
          status?: string | null
          stripe_public_key?: string | null
          text_color?: string | null
          theme?: string | null
          top_components?: Json | null
          unselected_box_bg_color?: string | null
          unselected_box_header_bg_color?: string | null
          unselected_box_header_primary_text_color?: string | null
          unselected_box_header_secondary_text_color?: string | null
          unselected_box_primary_text_color?: string | null
          unselected_box_secondary_text_color?: string | null
          unselected_button_bg_color?: string | null
          unselected_button_icon_color?: string | null
          unselected_button_text_color?: string | null
          updated_at?: string | null
          visits_count?: number
        }
        Update: {
          active_text_color?: string | null
          background_color?: string | null
          background_image_expand?: boolean | null
          background_image_fixed?: boolean | null
          background_image_repeat?: boolean | null
          background_image_url?: string | null
          bottom_components?: Json | null
          box_bg_color?: string | null
          box_header_bg_color?: string | null
          box_header_primary_text_color?: string | null
          box_header_secondary_text_color?: string | null
          box_primary_text_color?: string | null
          box_secondary_text_color?: string | null
          button_color?: string | null
          button_text_color?: string | null
          cc_field_background_color?: string | null
          cc_field_border_color?: string | null
          cc_field_focus_border_color?: string | null
          cc_field_focus_text_color?: string | null
          cc_field_placeholder_color?: string | null
          cc_field_text_color?: string | null
          components?: Json | null
          created_at?: string | null
          credit_card_gateway?:
            | Database["public"]["Enums"]["credit_card_gateway_type"]
            | null
          design?: Json | null
          font?: string | null
          form_background_color?: string | null
          icon_color?: string | null
          id?: string
          is_default?: boolean
          is_mobile_synced?: boolean
          mercadopago_public_key?: string | null
          mobile_bottom_components?: Json | null
          mobile_top_components?: Json | null
          name?: string
          payment_button_bg_color?: string | null
          payment_button_text_color?: string | null
          pix_gateway?: Database["public"]["Enums"]["pix_gateway_type"] | null
          primary_color?: string | null
          primary_text_color?: string | null
          product_id?: string | null
          secondary_color?: string | null
          secondary_text_color?: string | null
          selected_box_bg_color?: string | null
          selected_box_header_bg_color?: string | null
          selected_box_header_primary_text_color?: string | null
          selected_box_header_secondary_text_color?: string | null
          selected_box_primary_text_color?: string | null
          selected_box_secondary_text_color?: string | null
          selected_button_bg_color?: string | null
          selected_button_icon_color?: string | null
          selected_button_text_color?: string | null
          selected_payment_color?: string | null
          seller_name?: string | null
          slug?: string | null
          status?: string | null
          stripe_public_key?: string | null
          text_color?: string | null
          theme?: string | null
          top_components?: Json | null
          unselected_box_bg_color?: string | null
          unselected_box_header_bg_color?: string | null
          unselected_box_header_primary_text_color?: string | null
          unselected_box_header_secondary_text_color?: string | null
          unselected_box_primary_text_color?: string | null
          unselected_box_secondary_text_color?: string | null
          unselected_button_bg_color?: string | null
          unselected_button_icon_color?: string | null
          unselected_button_text_color?: string | null
          updated_at?: string | null
          visits_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "checkouts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkouts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      content_attachments: {
        Row: {
          content_id: string
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          position: number | null
        }
        Insert: {
          content_id: string
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          position?: number | null
        }
        Update: {
          content_id?: string
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_attachments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "product_member_content"
            referencedColumns: ["id"]
          },
        ]
      }
      content_release_settings: {
        Row: {
          after_content_id: string | null
          content_id: string
          created_at: string | null
          days_after_purchase: number | null
          fixed_date: string | null
          id: string
          release_type: string
          updated_at: string | null
        }
        Insert: {
          after_content_id?: string | null
          content_id: string
          created_at?: string | null
          days_after_purchase?: number | null
          fixed_date?: string | null
          id?: string
          release_type?: string
          updated_at?: string | null
        }
        Update: {
          after_content_id?: string | null
          content_id?: string
          created_at?: string | null
          days_after_purchase?: number | null
          fixed_date?: string | null
          id?: string
          release_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_release_settings_after_content_id_fkey"
            columns: ["after_content_id"]
            isOneToOne: false
            referencedRelation: "product_member_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_release_settings_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: true
            referencedRelation: "product_member_content"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_products: {
        Row: {
          coupon_id: string | null
          id: string
          product_id: string | null
        }
        Insert: {
          coupon_id?: string | null
          id?: string
          product_id?: string | null
        }
        Update: {
          coupon_id?: string | null
          id?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_products_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean | null
          apply_to_order_bumps: boolean | null
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          max_uses_per_customer: number | null
          name: string | null
          start_date: string | null
          uses_count: number | null
        }
        Insert: {
          active?: boolean | null
          apply_to_order_bumps?: boolean | null
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          max_uses_per_customer?: number | null
          name?: string | null
          start_date?: string | null
          uses_count?: number | null
        }
        Update: {
          active?: boolean | null
          apply_to_order_bumps?: boolean | null
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          max_uses_per_customer?: number | null
          name?: string | null
          start_date?: string | null
          uses_count?: number | null
        }
        Relationships: []
      }
      data_retention_log: {
        Row: {
          buyer_rate_limits_deleted: number | null
          buyer_sessions_deleted: number | null
          checkout_visits_deleted: number | null
          cleanup_version: string | null
          encryption_keys_deleted: number | null
          executed_at: string | null
          execution_time_ms: number | null
          gateway_webhook_dlq_deleted: number | null
          gdpr_audit_log_deleted: number | null
          gdpr_requests_deleted: number | null
          id: number
          key_rotation_log_deleted: number | null
          oauth_states_deleted: number | null
          order_events_deleted: number | null
          producer_sessions_deleted: number | null
          rate_limit_attempts_deleted: number | null
          security_audit_log_deleted: number | null
          security_events_deleted: number | null
          total_rows_deleted: number | null
          trigger_debug_logs_deleted: number | null
          vault_access_log_deleted: number | null
          webhook_deliveries_deleted: number | null
        }
        Insert: {
          buyer_rate_limits_deleted?: number | null
          buyer_sessions_deleted?: number | null
          checkout_visits_deleted?: number | null
          cleanup_version?: string | null
          encryption_keys_deleted?: number | null
          executed_at?: string | null
          execution_time_ms?: number | null
          gateway_webhook_dlq_deleted?: number | null
          gdpr_audit_log_deleted?: number | null
          gdpr_requests_deleted?: number | null
          id?: number
          key_rotation_log_deleted?: number | null
          oauth_states_deleted?: number | null
          order_events_deleted?: number | null
          producer_sessions_deleted?: number | null
          rate_limit_attempts_deleted?: number | null
          security_audit_log_deleted?: number | null
          security_events_deleted?: number | null
          total_rows_deleted?: number | null
          trigger_debug_logs_deleted?: number | null
          vault_access_log_deleted?: number | null
          webhook_deliveries_deleted?: number | null
        }
        Update: {
          buyer_rate_limits_deleted?: number | null
          buyer_sessions_deleted?: number | null
          checkout_visits_deleted?: number | null
          cleanup_version?: string | null
          encryption_keys_deleted?: number | null
          executed_at?: string | null
          execution_time_ms?: number | null
          gateway_webhook_dlq_deleted?: number | null
          gdpr_audit_log_deleted?: number | null
          gdpr_requests_deleted?: number | null
          id?: number
          key_rotation_log_deleted?: number | null
          oauth_states_deleted?: number | null
          order_events_deleted?: number | null
          producer_sessions_deleted?: number | null
          rate_limit_attempts_deleted?: number | null
          security_audit_log_deleted?: number | null
          security_events_deleted?: number | null
          total_rows_deleted?: number | null
          trigger_debug_logs_deleted?: number | null
          vault_access_log_deleted?: number | null
          webhook_deliveries_deleted?: number | null
        }
        Relationships: []
      }
      downsells: {
        Row: {
          active: boolean | null
          checkout_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          name: string
          price: number
        }
        Insert: {
          active?: boolean | null
          checkout_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          price: number
        }
        Update: {
          active?: boolean | null
          checkout_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "downsells_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkouts"
            referencedColumns: ["id"]
          },
        ]
      }
      edge_function_errors: {
        Row: {
          error_message: string | null
          error_stack: string | null
          function_name: string
          id: string
          notes: string | null
          order_id: string | null
          request_headers: Json | null
          request_payload: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          error_message?: string | null
          error_stack?: string | null
          function_name: string
          id?: string
          notes?: string | null
          order_id?: string | null
          request_headers?: Json | null
          request_payload?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          error_message?: string | null
          error_stack?: string | null
          function_name?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          request_headers?: Json | null
          request_payload?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      encryption_key_versions: {
        Row: {
          activated_at: string | null
          algorithm: string
          created_at: string
          deprecated_at: string | null
          expires_at: string | null
          id: number
          key_identifier: string
          metadata: Json | null
          revoked_at: string | null
          status: string
          version: number
        }
        Insert: {
          activated_at?: string | null
          algorithm?: string
          created_at?: string
          deprecated_at?: string | null
          expires_at?: string | null
          id?: number
          key_identifier: string
          metadata?: Json | null
          revoked_at?: string | null
          status?: string
          version: number
        }
        Update: {
          activated_at?: string | null
          algorithm?: string
          created_at?: string
          deprecated_at?: string | null
          expires_at?: string | null
          id?: number
          key_identifier?: string
          metadata?: Json | null
          revoked_at?: string | null
          status?: string
          version?: number
        }
        Relationships: []
      }
      gateway_webhook_dlq: {
        Row: {
          attempts: number | null
          created_at: string | null
          error_code: string
          error_message: string
          event_type: string
          gateway: string
          headers: Json | null
          id: string
          last_attempt_at: string | null
          order_id: string | null
          payload: Json
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          error_code: string
          error_message: string
          event_type: string
          gateway: string
          headers?: Json | null
          id?: string
          last_attempt_at?: string | null
          order_id?: string | null
          payload: Json
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          error_code?: string
          error_message?: string
          event_type?: string
          gateway?: string
          headers?: Json | null
          id?: string
          last_attempt_at?: string | null
          order_id?: string | null
          payload?: Json
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      gdpr_audit_log: {
        Row: {
          action: string
          anonymized_email: string | null
          executed_at: string
          executed_by: string | null
          gdpr_request_id: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          original_email_hash: string | null
          records_affected: number | null
          table_name: string | null
        }
        Insert: {
          action: string
          anonymized_email?: string | null
          executed_at?: string
          executed_by?: string | null
          gdpr_request_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          original_email_hash?: string | null
          records_affected?: number | null
          table_name?: string | null
        }
        Update: {
          action?: string
          anonymized_email?: string | null
          executed_at?: string
          executed_by?: string | null
          gdpr_request_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          original_email_hash?: string | null
          records_affected?: number | null
          table_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gdpr_audit_log_gdpr_request_id_fkey"
            columns: ["gdpr_request_id"]
            isOneToOne: false
            referencedRelation: "gdpr_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      gdpr_requests: {
        Row: {
          created_at: string
          email: string
          email_normalized: string
          id: string
          ip_address: string | null
          processed_at: string | null
          records_anonymized: number | null
          rejection_reason: string | null
          requested_at: string
          status: string
          tables_affected: Json | null
          token_expires_at: string
          updated_at: string
          user_agent: string | null
          verification_token: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          email_normalized?: string
          id?: string
          ip_address?: string | null
          processed_at?: string | null
          records_anonymized?: number | null
          rejection_reason?: string | null
          requested_at?: string
          status?: string
          tables_affected?: Json | null
          token_expires_at: string
          updated_at?: string
          user_agent?: string | null
          verification_token: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          email_normalized?: string
          id?: string
          ip_address?: string | null
          processed_at?: string | null
          records_anonymized?: number | null
          rejection_reason?: string | null
          requested_at?: string
          status?: string
          tables_affected?: Json | null
          token_expires_at?: string
          updated_at?: string
          user_agent?: string | null
          verification_token?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      ip_blocklist: {
        Row: {
          block_count: number | null
          blocked_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          ip_address: string
          is_active: boolean | null
          metadata: Json | null
          reason: string
          updated_at: string | null
        }
        Insert: {
          block_count?: number | null
          blocked_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address: string
          is_active?: boolean | null
          metadata?: Json | null
          reason: string
          updated_at?: string | null
        }
        Update: {
          block_count?: number | null
          blocked_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean | null
          metadata?: Json | null
          reason?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      key_rotation_log: {
        Row: {
          action: string
          completed_at: string | null
          error_message: string | null
          from_version: number | null
          id: string
          metadata: Json | null
          records_failed: number | null
          records_processed: number | null
          started_at: string
          status: string
          to_version: number
        }
        Insert: {
          action: string
          completed_at?: string | null
          error_message?: string | null
          from_version?: number | null
          id?: string
          metadata?: Json | null
          records_failed?: number | null
          records_processed?: number | null
          started_at?: string
          status?: string
          to_version: number
        }
        Update: {
          action?: string
          completed_at?: string | null
          error_message?: string | null
          from_version?: number | null
          id?: string
          metadata?: Json | null
          records_failed?: number | null
          records_processed?: number | null
          started_at?: string
          status?: string
          to_version?: number
        }
        Relationships: []
      }
      marketplace_categories: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mercadopago_split_config: {
        Row: {
          created_at: string
          fixed_amount: number | null
          id: string
          percentage_amount: number | null
          split_type: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          fixed_amount?: number | null
          id?: string
          percentage_amount?: number | null
          split_type?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          fixed_amount?: number | null
          id?: string
          percentage_amount?: number | null
          split_type?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mercadopago_split_config_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_sessions: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          is_used: boolean
          max_attempts: number
          token: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at: string
          id?: string
          is_used?: boolean
          max_attempts?: number
          token: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          max_attempts?: number
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_id_map: {
        Row: {
          migrated_at: string | null
          new_id: string
          old_id: string
          source_table: string
        }
        Insert: {
          migrated_at?: string | null
          new_id: string
          old_id: string
          source_table: string
        }
        Update: {
          migrated_at?: string | null
          new_id?: string
          old_id?: string
          source_table?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string | null
          read: boolean | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_states: {
        Row: {
          created_at: string | null
          expires_at: string | null
          state: string
          used_at: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          state: string
          used_at?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          state?: string
          used_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_states_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          member_group_id: string | null
          name: string
          price: number
          product_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          member_group_id?: string | null
          name: string
          price: number
          product_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          member_group_id?: string | null
          name?: string
          price?: number
          product_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_member_group_id_fkey"
            columns: ["member_group_id"]
            isOneToOne: false
            referencedRelation: "product_member_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_bumps: {
        Row: {
          active: boolean | null
          call_to_action: string | null
          checkout_id: string | null
          created_at: string | null
          custom_description: string | null
          custom_title: string | null
          discount_enabled: boolean | null
          id: string
          offer_id: string | null
          original_price: number | null
          parent_product_id: string
          position: number
          product_id: string
          show_image: boolean | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          call_to_action?: string | null
          checkout_id?: string | null
          created_at?: string | null
          custom_description?: string | null
          custom_title?: string | null
          discount_enabled?: boolean | null
          id?: string
          offer_id?: string | null
          original_price?: number | null
          parent_product_id: string
          position?: number
          product_id: string
          show_image?: boolean | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          call_to_action?: string | null
          checkout_id?: string | null
          created_at?: string | null
          custom_description?: string | null
          custom_title?: string | null
          discount_enabled?: boolean | null
          id?: string
          offer_id?: string | null
          original_price?: number | null
          parent_product_id?: string
          position?: number
          product_id?: string
          show_image?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_bumps_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_bumps_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_bumps_parent_product_id_fkey"
            columns: ["parent_product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_bumps_parent_product_id_fkey"
            columns: ["parent_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_bumps_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_bumps_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          created_at: string
          data: Json | null
          external_id: string | null
          gateway: string | null
          gateway_event_id: string | null
          id: string
          occurred_at: string
          order_id: string
          processed_successfully: boolean | null
          type: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          external_id?: string | null
          gateway?: string | null
          gateway_event_id?: string | null
          id?: string
          occurred_at: string
          order_id: string
          processed_successfully?: boolean | null
          type: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          external_id?: string | null
          gateway?: string | null
          gateway_event_id?: string | null
          id?: string
          occurred_at?: string
          order_id?: string
          processed_successfully?: boolean | null
          type?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          amount_cents: number
          created_at: string | null
          id: string
          is_bump: boolean
          order_id: string
          product_id: string
          product_name: string
          quantity: number
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          id?: string
          is_bump?: boolean
          order_id: string
          product_id: string
          product_name: string
          quantity?: number
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          id?: string
          is_bump?: boolean
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_lifecycle_events: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          new_status: string
          old_status: string | null
          order_id: string
          processed: boolean | null
          processed_at: string | null
          processing_error: string | null
          processor_version: string | null
          retry_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_status: string
          old_status?: string | null
          order_id: string
          processed?: boolean | null
          processed_at?: string | null
          processing_error?: string | null
          processor_version?: string | null
          retry_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string
          old_status?: string | null
          order_id?: string
          processed?: boolean | null
          processed_at?: string | null
          processing_error?: string | null
          processor_version?: string | null
          retry_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_lifecycle_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          access_token: string | null
          affiliate_id: string | null
          amount_cents: number
          buyer_id: string | null
          checkout_id: string | null
          commission_cents: number | null
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          currency: string
          customer_document: string | null
          customer_email: string | null
          customer_ip: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_amount_cents: number | null
          expired_at: string | null
          gateway: string
          gateway_payment_id: string | null
          id: string
          idempotency_key: string | null
          installments: number
          offer_id: string | null
          paid_at: string | null
          payment_method: string | null
          pix_created_at: string | null
          pix_id: string | null
          pix_qr_code: string | null
          pix_status: string | null
          platform_fee_cents: number | null
          product_id: string
          product_name: string | null
          sck: string | null
          src: string | null
          status: string
          technical_status: string | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          vendor_id: string
        }
        Insert: {
          access_token?: string | null
          affiliate_id?: string | null
          amount_cents: number
          buyer_id?: string | null
          checkout_id?: string | null
          commission_cents?: number | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_ip?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount_cents?: number | null
          expired_at?: string | null
          gateway: string
          gateway_payment_id?: string | null
          id?: string
          idempotency_key?: string | null
          installments?: number
          offer_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pix_created_at?: string | null
          pix_id?: string | null
          pix_qr_code?: string | null
          pix_status?: string | null
          platform_fee_cents?: number | null
          product_id: string
          product_name?: string | null
          sck?: string | null
          src?: string | null
          status: string
          technical_status?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          vendor_id: string
        }
        Update: {
          access_token?: string | null
          affiliate_id?: string | null
          amount_cents?: number
          buyer_id?: string | null
          checkout_id?: string | null
          commission_cents?: number | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_ip?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount_cents?: number | null
          expired_at?: string | null
          gateway?: string
          gateway_payment_id?: string | null
          id?: string
          idempotency_key?: string | null
          installments?: number
          offer_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pix_created_at?: string | null
          pix_id?: string | null
          pix_qr_code?: string | null
          pix_status?: string | null
          platform_fee_cents?: number | null
          product_id?: string
          product_name?: string | null
          sck?: string | null
          src?: string | null
          status?: string
          technical_status?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_webhooks: {
        Row: {
          active: boolean
          created_at: string
          events: string[]
          id: string
          name: string | null
          product_id: string | null
          secret: string
          secret_encrypted: string | null
          updated_at: string
          url: string
          vendor_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          events: string[]
          id?: string
          name?: string | null
          product_id?: string | null
          secret: string
          secret_encrypted?: string | null
          updated_at?: string
          url: string
          vendor_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          events?: string[]
          id?: string
          name?: string | null
          product_id?: string | null
          secret?: string
          secret_encrypted?: string | null
          updated_at?: string
          url?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_webhooks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_webhooks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_webhooks_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_attempts: {
        Row: {
          client_ip: string | null
          completed_at: string | null
          created_at: string
          error_data: Json | null
          gateway: string
          id: string
          idempotency_key: string
          order_id: string | null
          payment_method: string | null
          processing_started_at: string | null
          request_hash: string
          response_data: Json | null
          status: string
          user_agent: string | null
        }
        Insert: {
          client_ip?: string | null
          completed_at?: string | null
          created_at?: string
          error_data?: Json | null
          gateway: string
          id?: string
          idempotency_key: string
          order_id?: string | null
          payment_method?: string | null
          processing_started_at?: string | null
          request_hash: string
          response_data?: Json | null
          status?: string
          user_agent?: string | null
        }
        Update: {
          client_ip?: string | null
          completed_at?: string | null
          created_at?: string
          error_data?: Json | null
          gateway?: string
          id?: string
          idempotency_key?: string
          order_id?: string | null
          payment_method?: string | null
          processing_started_at?: string | null
          request_hash?: string
          response_data?: Json | null
          status?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_attempts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateway_settings: {
        Row: {
          created_at: string | null
          environment: string
          platform_fee_percent: number | null
          pushinpay_account_id: string | null
          pushinpay_token: string | null
          token_encrypted: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          environment: string
          platform_fee_percent?: number | null
          pushinpay_account_id?: string | null
          pushinpay_token?: string | null
          token_encrypted?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          environment?: string
          platform_fee_percent?: number | null
          pushinpay_account_id?: string | null
          pushinpay_token?: string | null
          token_encrypted?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_gateway_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_links: {
        Row: {
          created_at: string | null
          id: string
          is_original: boolean | null
          offer_id: string
          slug: string
          status: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_original?: boolean | null
          offer_id: string
          slug: string
          status?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_original?: boolean | null
          offer_id?: string
          slug?: string
          status?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_links_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_provider_credentials: {
        Row: {
          api_key: string
          created_at: string | null
          id: string
          owner_id: string
          provider: string
          updated_at: string | null
          use_sandbox: boolean
          workspace_id: string
        }
        Insert: {
          api_key: string
          created_at?: string | null
          id?: string
          owner_id: string
          provider: string
          updated_at?: string | null
          use_sandbox?: boolean
          workspace_id: string
        }
        Update: {
          api_key?: string
          created_at?: string | null
          id?: string
          owner_id?: string
          provider?: string
          updated_at?: string | null
          use_sandbox?: boolean
          workspace_id?: string
        }
        Relationships: []
      }
      payments_map: {
        Row: {
          created_at: string | null
          order_id: string
          pix_id: string
        }
        Insert: {
          created_at?: string | null
          order_id: string
          pix_id: string
        }
        Update: {
          created_at?: string | null
          order_id?: string
          pix_id?: string
        }
        Relationships: []
      }
      pix_transactions: {
        Row: {
          checkout_id: string
          created_at: string | null
          id: string
          payer_document: string | null
          payer_name: string | null
          payload_emv: string | null
          provider: string
          provider_payment_id: string
          qr_base64: string | null
          status: string
          updated_at: string | null
          value_cents: number
          webhook_raw: Json | null
          workspace_id: string
        }
        Insert: {
          checkout_id: string
          created_at?: string | null
          id?: string
          payer_document?: string | null
          payer_name?: string | null
          payload_emv?: string | null
          provider?: string
          provider_payment_id: string
          qr_base64?: string | null
          status: string
          updated_at?: string | null
          value_cents: number
          webhook_raw?: Json | null
          workspace_id: string
        }
        Update: {
          checkout_id?: string
          created_at?: string | null
          id?: string
          payer_document?: string | null
          payer_name?: string | null
          payload_emv?: string | null
          provider?: string
          provider_payment_id?: string
          qr_base64?: string | null
          status?: string
          updated_at?: string | null
          value_cents?: number
          webhook_raw?: Json | null
          workspace_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string | null
          description: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      producer_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          failure_reason: string | null
          id: string
          ip_address: string | null
          producer_id: string | null
          success: boolean | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          producer_id?: string | null
          success?: boolean | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          producer_id?: string | null
          success?: boolean | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "producer_audit_log_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_member_content: {
        Row: {
          body: string | null
          content_data: Json | null
          content_type: string
          content_url: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          id: string
          is_active: boolean | null
          module_id: string
          position: number
          title: string
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          content_data?: Json | null
          content_type: string
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          module_id: string
          position?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          content_data?: Json | null
          content_type?: string
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          module_id?: string
          position?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_member_content_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "product_member_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      product_member_group_permissions: {
        Row: {
          created_at: string | null
          group_id: string
          has_access: boolean | null
          id: string
          module_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          has_access?: boolean | null
          id?: string
          module_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          has_access?: boolean | null
          id?: string
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_member_group_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "product_member_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_member_group_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "product_member_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      product_member_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          position: number | null
          product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          position?: number | null
          product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          position?: number | null
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_member_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_member_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_member_modules: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          height: number | null
          id: string
          is_active: boolean | null
          position: number
          product_id: string
          title: string
          updated_at: string | null
          width: number | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          height?: number | null
          id?: string
          is_active?: boolean | null
          position?: number
          product_id: string
          title: string
          updated_at?: string | null
          width?: number | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          height?: number | null
          id?: string
          is_active?: boolean | null
          position?: number
          product_id?: string
          title?: string
          updated_at?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_member_modules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_member_modules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_members_sections: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          position: number
          product_id: string
          settings: Json | null
          title: string | null
          type: string
          updated_at: string | null
          viewport: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          position?: number
          product_id: string
          settings?: Json | null
          title?: string | null
          type: string
          updated_at?: string | null
          viewport?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          position?: number
          product_id?: string
          settings?: Json | null
          title?: string | null
          type?: string
          updated_at?: string | null
          viewport?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_members_sections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_members_sections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_pixels: {
        Row: {
          created_at: string
          custom_value_percent: number
          fire_on_boleto: boolean
          fire_on_card: boolean
          fire_on_initiate_checkout: boolean
          fire_on_pix: boolean
          fire_on_purchase: boolean
          id: string
          pixel_id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          custom_value_percent?: number
          fire_on_boleto?: boolean
          fire_on_card?: boolean
          fire_on_initiate_checkout?: boolean
          fire_on_pix?: boolean
          fire_on_purchase?: boolean
          id?: string
          pixel_id: string
          product_id: string
        }
        Update: {
          created_at?: string
          custom_value_percent?: number
          fire_on_boleto?: boolean
          fire_on_card?: boolean
          fire_on_initiate_checkout?: boolean
          fire_on_pix?: boolean
          fire_on_purchase?: boolean
          id?: string
          pixel_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_pixels_pixel_id_fkey"
            columns: ["pixel_id"]
            isOneToOne: false
            referencedRelation: "vendor_pixels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_pixels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_pixels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          affiliate_gateway_settings: Json | null
          affiliate_settings: Json | null
          created_at: string | null
          credit_card_gateway: string | null
          default_payment_method: string | null
          delivery_type:
            | Database["public"]["Enums"]["delivery_type_enum"]
            | null
          delivery_url: string | null
          description: string | null
          external_delivery: boolean | null
          id: string
          image_url: string | null
          marketplace_category: string | null
          marketplace_clicks: number | null
          marketplace_description: string | null
          marketplace_enabled_at: string | null
          marketplace_rules: string | null
          marketplace_tags: string[] | null
          marketplace_views: number | null
          members_area_enabled: boolean | null
          members_area_logo_url: string | null
          members_area_primary_color: string | null
          members_area_settings: Json | null
          members_area_slug: string | null
          name: string
          pix_gateway: string | null
          price: number
          required_fields: Json | null
          show_in_marketplace: boolean | null
          status: string | null
          support_email: string | null
          support_name: string | null
          updated_at: string | null
          upsell_settings: Json | null
          user_id: string | null
        }
        Insert: {
          affiliate_gateway_settings?: Json | null
          affiliate_settings?: Json | null
          created_at?: string | null
          credit_card_gateway?: string | null
          default_payment_method?: string | null
          delivery_type?:
            | Database["public"]["Enums"]["delivery_type_enum"]
            | null
          delivery_url?: string | null
          description?: string | null
          external_delivery?: boolean | null
          id?: string
          image_url?: string | null
          marketplace_category?: string | null
          marketplace_clicks?: number | null
          marketplace_description?: string | null
          marketplace_enabled_at?: string | null
          marketplace_rules?: string | null
          marketplace_tags?: string[] | null
          marketplace_views?: number | null
          members_area_enabled?: boolean | null
          members_area_logo_url?: string | null
          members_area_primary_color?: string | null
          members_area_settings?: Json | null
          members_area_slug?: string | null
          name: string
          pix_gateway?: string | null
          price: number
          required_fields?: Json | null
          show_in_marketplace?: boolean | null
          status?: string | null
          support_email?: string | null
          support_name?: string | null
          updated_at?: string | null
          upsell_settings?: Json | null
          user_id?: string | null
        }
        Update: {
          affiliate_gateway_settings?: Json | null
          affiliate_settings?: Json | null
          created_at?: string | null
          credit_card_gateway?: string | null
          default_payment_method?: string | null
          delivery_type?:
            | Database["public"]["Enums"]["delivery_type_enum"]
            | null
          delivery_url?: string | null
          description?: string | null
          external_delivery?: boolean | null
          id?: string
          image_url?: string | null
          marketplace_category?: string | null
          marketplace_clicks?: number | null
          marketplace_description?: string | null
          marketplace_enabled_at?: string | null
          marketplace_rules?: string | null
          marketplace_tags?: string[] | null
          marketplace_views?: number | null
          members_area_enabled?: boolean | null
          members_area_logo_url?: string | null
          members_area_primary_color?: string | null
          members_area_settings?: Json | null
          members_area_slug?: string | null
          name?: string
          pix_gateway?: string | null
          price?: number
          required_fields?: Json | null
          show_in_marketplace?: boolean | null
          status?: string | null
          support_email?: string | null
          support_name?: string | null
          updated_at?: string | null
          upsell_settings?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_answers: {
        Row: {
          answer_text: string
          created_at: string | null
          id: string
          is_correct: boolean | null
          position: number | null
          question_id: string
        }
        Insert: {
          answer_text: string
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          position?: number | null
          question_id: string
        }
        Update: {
          answer_text?: string
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          position?: number | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string | null
          explanation: string | null
          id: string
          points: number | null
          position: number | null
          question_text: string
          question_type: string
          quiz_id: string
        }
        Insert: {
          created_at?: string | null
          explanation?: string | null
          id?: string
          points?: number | null
          position?: number | null
          question_text: string
          question_type?: string
          quiz_id: string
        }
        Update: {
          created_at?: string | null
          explanation?: string | null
          id?: string
          points?: number | null
          position?: number | null
          question_text?: string
          question_type?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          content_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_attempts: number | null
          passing_score: number | null
          product_id: string
          show_correct_answers: boolean | null
          shuffle_questions: boolean | null
          time_limit_minutes: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_attempts?: number | null
          passing_score?: number | null
          product_id: string
          show_correct_answers?: boolean | null
          shuffle_questions?: boolean | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_attempts?: number | null
          passing_score?: number | null
          product_id?: string
          show_correct_answers?: boolean | null
          shuffle_questions?: boolean | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "product_member_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_attempts: {
        Row: {
          action: string
          created_at: string | null
          id: string
          identifier: string
          success: boolean | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          identifier: string
          success?: boolean | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          identifier?: string
          success?: boolean | null
        }
        Relationships: []
      }
      refresh_locks: {
        Row: {
          created_at: string
          expires_at: string
          locked_at: string
          locked_by_tab: string
          session_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          locked_at?: string
          locked_by_tab: string
          session_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          locked_at?: string
          locked_by_tab?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refresh_locks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          buyer_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          buyer_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          severity: string
          user_id?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          buyer_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          resource: string | null
          resource_id: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource?: string | null
          resource_id?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource?: string | null
          resource_id?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          action: string | null
          created_at: string | null
          event_type: string
          id: string
          identifier: string | null
          metadata: Json | null
          resource: string | null
          success: boolean | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          identifier?: string | null
          metadata?: Json | null
          resource?: string | null
          success?: boolean | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          identifier?: string | null
          metadata?: Json | null
          resource?: string | null
          success?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          access_token_expires_at: string | null
          active_role: Database["public"]["Enums"]["app_role"]
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          is_valid: boolean | null
          last_activity_at: string | null
          previous_refresh_token: string | null
          refresh_token: string | null
          refresh_token_expires_at: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_token_expires_at?: string | null
          active_role?: Database["public"]["Enums"]["app_role"]
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          is_valid?: boolean | null
          last_activity_at?: string | null
          previous_refresh_token?: string | null
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_token_expires_at?: string | null
          active_role?: Database["public"]["Enums"]["app_role"]
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_valid?: boolean | null
          last_activity_at?: string | null
          previous_refresh_token?: string | null
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_invite_tokens: {
        Row: {
          buyer_id: string
          created_at: string
          expires_at: string
          id: string
          invited_by: string
          is_used: boolean
          product_id: string
          token_hash: string
          used_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string
          expires_at: string
          id?: string
          invited_by: string
          is_used?: boolean
          product_id: string
          token_hash: string
          used_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string
          is_used?: boolean
          product_id?: string
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_invite_tokens_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_invite_tokens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_invite_tokens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health_logs: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number | null
          severity: string | null
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value?: number | null
          severity?: string | null
          timestamp?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number | null
          severity?: string | null
          timestamp?: string
        }
        Relationships: []
      }
      trigger_debug_logs: {
        Row: {
          created_at: string | null
          data: Json | null
          event_type: string | null
          id: number
          message: string | null
          order_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          event_type?: string | null
          id?: number
          message?: string | null
          order_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          event_type?: string | null
          id?: number
          message?: string | null
          order_id?: string | null
        }
        Relationships: []
      }
      upsells: {
        Row: {
          active: boolean | null
          checkout_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          name: string
          price: number
        }
        Insert: {
          active?: boolean | null
          checkout_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          price: number
        }
        Update: {
          active?: boolean | null
          checkout_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "upsells_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkouts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_active_context: {
        Row: {
          active_role: Database["public"]["Enums"]["app_role"]
          switched_at: string | null
          user_id: string
        }
        Insert: {
          active_role?: Database["public"]["Enums"]["app_role"]
          switched_at?: string | null
          user_id: string
        }
        Update: {
          active_role?: Database["public"]["Enums"]["app_role"]
          switched_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_active_context_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mfa: {
        Row: {
          backup_codes_hash: string[]
          backup_codes_used: string[]
          created_at: string
          id: string
          is_enabled: boolean
          last_used_at: string | null
          totp_secret_encrypted: string
          totp_secret_iv: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          backup_codes_hash?: string[]
          backup_codes_used?: string[]
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_used_at?: string | null
          totp_secret_encrypted: string
          totp_secret_iv: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          backup_codes_hash?: string[]
          backup_codes_used?: string[]
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_used_at?: string | null
          totp_secret_encrypted?: string
          totp_secret_iv?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_mfa_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          context_data: Json | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          context_data?: Json | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          context_data?: Json | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_status:
            | Database["public"]["Enums"]["account_status_enum"]
            | null
          asaas_wallet_id: string | null
          avatar_url: string | null
          cpf_cnpj: string | null
          created_at: string | null
          custom_fee_percent: number | null
          document_encrypted: string | null
          document_hash: string | null
          email: string
          email_verification_token: string | null
          email_verification_token_expires_at: string | null
          email_verified: boolean | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          mercadopago_collector_id: string | null
          mercadopago_connected_at: string | null
          mercadopago_email: string | null
          name: string | null
          password_hash: string | null
          password_hash_version: number | null
          phone: string | null
          registration_source: string | null
          reset_token: string | null
          reset_token_expires_at: string | null
          status: string | null
          status_changed_at: string | null
          status_changed_by: string | null
          status_reason: string | null
          stripe_account_id: string | null
          stripe_connected_at: string | null
          terms_accepted_at: string | null
          test_mode_enabled: boolean | null
          test_public_key: string | null
          timezone: string | null
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          account_status?:
            | Database["public"]["Enums"]["account_status_enum"]
            | null
          asaas_wallet_id?: string | null
          avatar_url?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          custom_fee_percent?: number | null
          document_encrypted?: string | null
          document_hash?: string | null
          email: string
          email_verification_token?: string | null
          email_verification_token_expires_at?: string | null
          email_verified?: boolean | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          mercadopago_collector_id?: string | null
          mercadopago_connected_at?: string | null
          mercadopago_email?: string | null
          name?: string | null
          password_hash?: string | null
          password_hash_version?: number | null
          phone?: string | null
          registration_source?: string | null
          reset_token?: string | null
          reset_token_expires_at?: string | null
          status?: string | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          stripe_account_id?: string | null
          stripe_connected_at?: string | null
          terms_accepted_at?: string | null
          test_mode_enabled?: boolean | null
          test_public_key?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          account_status?:
            | Database["public"]["Enums"]["account_status_enum"]
            | null
          asaas_wallet_id?: string | null
          avatar_url?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          custom_fee_percent?: number | null
          document_encrypted?: string | null
          document_hash?: string | null
          email?: string
          email_verification_token?: string | null
          email_verification_token_expires_at?: string | null
          email_verified?: boolean | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          mercadopago_collector_id?: string | null
          mercadopago_connected_at?: string | null
          mercadopago_email?: string | null
          name?: string | null
          password_hash?: string | null
          password_hash_version?: number | null
          phone?: string | null
          registration_source?: string | null
          reset_token?: string | null
          reset_token_expires_at?: string | null
          status?: string | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          stripe_account_id?: string | null
          stripe_connected_at?: string | null
          terms_accepted_at?: string | null
          test_mode_enabled?: boolean | null
          test_public_key?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      vault_access_log: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          gateway: string
          id: string
          ip_address: string | null
          metadata: Json | null
          success: boolean
          user_agent: string | null
          vendor_id: string
        }
        Insert: {
          action: string
          created_at?: string
          error_message?: string | null
          gateway: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
          vendor_id: string
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          gateway?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_integrations: {
        Row: {
          active: boolean
          config: Json
          created_at: string
          id: string
          integration_type: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          active?: boolean
          config?: Json
          created_at?: string
          id?: string
          integration_type: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          active?: boolean
          config?: Json
          created_at?: string
          id?: string
          integration_type?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_integrations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_pixels: {
        Row: {
          access_token: string | null
          conversion_label: string | null
          created_at: string
          domain: string | null
          id: string
          is_active: boolean
          name: string
          pixel_id: string
          platform: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          access_token?: string | null
          conversion_label?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean
          name: string
          pixel_id: string
          platform: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          access_token?: string | null
          conversion_label?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean
          name?: string
          pixel_id?: string
          platform?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_pixels_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_profiles: {
        Row: {
          cpf_cnpj: string
          created_at: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cpf_cnpj: string
          created_at?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cpf_cnpj?: string
          created_at?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          attempts: number
          created_at: string
          event_type: string
          id: string
          last_attempt_at: string | null
          next_retry_at: string | null
          order_id: string
          payload: Json
          product_id: string | null
          response_body: string | null
          response_status: number | null
          status: string | null
          webhook_id: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          event_type: string
          id?: string
          last_attempt_at?: string | null
          next_retry_at?: string | null
          order_id: string
          payload: Json
          product_id?: string | null
          response_body?: string | null
          response_status?: number | null
          status?: string | null
          webhook_id?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          event_type?: string
          id?: string
          last_attempt_at?: string | null
          next_retry_at?: string | null
          order_id?: string
          payload?: Json
          product_id?: string | null
          response_body?: string | null
          response_status?: number | null
          status?: string | null
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "outbound_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_products: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          webhook_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          webhook_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_products_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "outbound_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      marketplace_products: {
        Row: {
          affiliate_enabled: boolean | null
          category: string | null
          commission_percentage: number | null
          created_at: string | null
          description: string | null
          has_order_bump_commission: boolean | null
          id: string | null
          image_url: string | null
          marketplace_category: string | null
          marketplace_clicks: number | null
          marketplace_description: string | null
          marketplace_enabled: boolean | null
          marketplace_tags: string[] | null
          marketplace_views: number | null
          name: string | null
          price: number | null
          producer_id: string | null
          producer_name: string | null
          requires_manual_approval: boolean | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          vendor_email: string | null
          vendor_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      v_system_health_summary: {
        Row: {
          avg_value: number | null
          error_count: number | null
          event_count: number | null
          hour: string | null
          metric_type: string | null
        }
        Relationships: []
      }
      v_unresolved_errors: {
        Row: {
          error_message: string | null
          error_stack: string | null
          function_name: string | null
          id: string | null
          notes: string | null
          order_id: string | null
          request_payload: Json | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          error_message?: string | null
          error_stack?: string | null
          function_name?: string | null
          id?: string | null
          notes?: string | null
          order_id?: string | null
          request_payload?: Json | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          error_message?: string | null
          error_stack?: string | null
          function_name?: string | null
          id?: string | null
          notes?: string | null
          order_id?: string | null
          request_payload?: Json | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vendor_integrations_public: {
        Row: {
          active: boolean | null
          config: Json | null
          created_at: string | null
          id: string | null
          integration_type: string | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          active?: boolean | null
          config?: never
          created_at?: string | null
          id?: string | null
          integration_type?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          active?: boolean | null
          config?: never
          created_at?: string | null
          id?: string | null
          integration_type?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_integrations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      activate_key_version: { Args: { p_version: number }; Returns: Json }
      attach_offer_to_checkout_smart: {
        Args: { p_checkout_id: string; p_offer_id: string }
        Returns: Json
      }
      can_have_affiliates: { Args: { p_user_id: string }; Returns: boolean }
      check_gdpr_request_limit: {
        Args: { p_email: string }
        Returns: {
          can_request: boolean
          last_request_at: string
          reason: string
        }[]
      }
      cleanup_all_data_v2: {
        Args: never
        Returns: {
          category: string
          rows_deleted: number
          table_name: string
        }[]
      }
      cleanup_all_data_v2_with_log: { Args: never; Returns: undefined }
      cleanup_buyer_rate_limits: { Args: never; Returns: number }
      cleanup_by_category: {
        Args: { p_category: string }
        Returns: {
          rows_deleted: number
          table_name: string
        }[]
      }
      cleanup_dry_run: {
        Args: never
        Returns: {
          category: string
          rows_to_delete: number
          table_name: string
        }[]
      }
      cleanup_expired_blocks: { Args: never; Returns: number }
      cleanup_expired_refresh_locks: { Args: never; Returns: number }
      cleanup_gdpr_audit_log: { Args: never; Returns: number }
      cleanup_gdpr_requests: { Args: never; Returns: number }
      cleanup_key_rotation_log: { Args: never; Returns: number }
      cleanup_oauth_states: { Args: never; Returns: number }
      cleanup_old_data: {
        Args: never
        Returns: {
          rows_deleted: number
          table_name: string
        }[]
      }
      cleanup_old_data_with_log: { Args: never; Returns: undefined }
      cleanup_old_encryption_keys: { Args: never; Returns: number }
      cleanup_old_rate_limits: { Args: never; Returns: number }
      cleanup_rate_limit_attempts: { Args: never; Returns: number }
      cleanup_security_events: { Args: never; Returns: number }
      cleanup_vault_access_log: { Args: never; Returns: number }
      clone_checkout_deep: {
        Args: { dst_checkout_id: string; src_checkout_id: string }
        Returns: undefined
      }
      clone_checkout_deep_v5: {
        Args: { p_dst: string; p_src: string }
        Returns: undefined
      }
      clone_checkout_layout: {
        Args: { p_source_checkout_id: string; p_target_checkout_id: string }
        Returns: undefined
      }
      complete_key_rotation: {
        Args: { p_error?: string; p_log_id: string; p_success: boolean }
        Returns: undefined
      }
      create_order_with_items: {
        Args: { p_items: Json; p_order_data: Json }
        Returns: Json
      }
      create_payment_link_for_offer: {
        Args: { p_offer_id: string; p_slug?: string }
        Returns: string
      }
      create_security_alert: {
        Args: {
          p_alert_type: string
          p_buyer_id?: string
          p_details?: Json
          p_ip_address?: string
          p_severity: string
          p_user_id?: string
        }
        Returns: string
      }
      delete_gateway_credentials: {
        Args: {
          p_gateway: string
          p_ip_address?: string
          p_user_agent?: string
          p_vendor_id: string
        }
        Returns: Json
      }
      duplicate_checkout_shallow: {
        Args: { p_source_checkout_id: string }
        Returns: string
      }
      generate_checkout_slug: { Args: never; Returns: string }
      generate_link_slug: {
        Args: { offer_name?: string; offer_price?: number }
        Returns: string
      }
      generate_rls_documentation: {
        Args: never
        Returns: {
          content: string
          section: string
        }[]
      }
      generate_unique_payment_slug: {
        Args: { p_offer_id: string }
        Returns: string
      }
      get_active_key_version: { Args: never; Returns: number }
      get_affiliate_checkout_info: {
        Args: { p_affiliate_code: string; p_product_id: string }
        Returns: {
          credit_card_gateway: string
          mercadopago_public_key: string
          pix_gateway: string
          stripe_public_key: string
        }[]
      }
      get_all_policies: {
        Args: never
        Returns: {
          cmd: string
          permissive: string
          policyname: string
          qual: string
          roles: string[]
          tablename: string
          with_check: string
        }[]
      }
      get_checkout_by_payment_slug: {
        Args: { p_slug: string }
        Returns: {
          checkout_id: string
          product_id: string
        }[]
      }
      get_dashboard_metrics: {
        Args: {
          p_end_date: string
          p_start_date: string
          p_timezone?: string
          p_vendor_id: string
        }
        Returns: Json
      }
      get_gateway_credentials: {
        Args: {
          p_gateway: string
          p_ip_address?: string
          p_user_agent?: string
          p_vendor_id: string
        }
        Returns: Json
      }
      get_internal_webhook_secret: { Args: never; Returns: string }
      get_order_for_payment: {
        Args: { p_access_token: string; p_order_id: string }
        Returns: {
          amount_cents: number
          created_at: string
          customer_document: string
          customer_email: string
          customer_name: string
          customer_phone: string
          id: string
          pix_qr_code: string
          pix_status: string
          product_id: string
          status: string
          tracking_parameters: Json
          vendor_id: string
        }[]
      }
      get_payment_link_with_checkout_slug: {
        Args: { p_slug: string }
        Returns: {
          checkout_slug: string
          checkout_status: string
          id: string
          offer_id: string
          product_id: string
          product_status: string
          product_support_email: string
          slug: string
          status: string
        }[]
      }
      get_policy_coverage: {
        Args: never
        Returns: {
          delete_policies: number
          insert_policies: number
          select_policies: number
          tablename: string
          update_policies: number
        }[]
      }
      get_producer_affiliates: {
        Args: { producer_id: string }
        Returns: {
          affiliate_code: string
          affiliate_id: string
          commission_rate: number
          created_at: string
          product_id: string
          product_name: string
          status: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_rls_status_all_tables: {
        Args: never
        Returns: {
          has_rls: boolean
          tablename: string
        }[]
      }
      get_system_health_summary: {
        Args: never
        Returns: {
          error_count: number
          event_count: number
          hour: string
          metric_type: string
        }[]
      }
      get_tables_without_policies: { Args: never; Returns: string[] }
      get_unresolved_errors: {
        Args: { limit_count?: number; offset_count?: number }
        Returns: {
          error_message: string
          error_stack: string
          error_timestamp: string
          function_name: string
          id: string
          notes: string
          order_id: string
          request_payload: Json
          user_id: string
        }[]
      }
      get_user_email: { Args: { user_id: string }; Returns: string }
      get_user_id_by_email: { Args: { user_email: string }; Returns: string }
      get_user_role: { Args: { p_user_id: string }; Returns: string }
      get_vault_secret: { Args: { p_name: string }; Returns: string }
      get_vendor_public_key: {
        Args: { p_vendor_id: string }
        Returns: {
          public_key: string
          test_mode_enabled: boolean
        }[]
      }
      get_webhook_stats_24h: { Args: never; Returns: Json }
      has_active_payment_link_for_checkout: {
        Args: { p_checkout_id: string }
        Returns: boolean
      }
      has_min_role: {
        Args: {
          _min_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_email: { Args: { p_email: string }; Returns: string }
      increment_affiliate_sales: {
        Args: { p_affiliate_id: string; p_amount_cents: number }
        Returns: undefined
      }
      increment_checkout_visits: {
        Args: { checkout_id: string }
        Returns: undefined
      }
      increment_marketplace_click: {
        Args: { p_product_id: string }
        Returns: undefined
      }
      increment_marketplace_view: {
        Args: { p_product_id: string }
        Returns: undefined
      }
      is_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_ip_blocked: { Args: { check_ip: string }; Returns: boolean }
      is_product_in_active_public_checkout: {
        Args: { _product_id: string }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_action: string
          p_ip_address?: string
          p_metadata?: Json
          p_resource?: string
          p_resource_id?: string
          p_success?: boolean
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      log_system_metric: {
        Args: {
          p_metadata?: Json
          p_metric_type: string
          p_metric_value?: number
          p_severity?: string
        }
        Returns: string
      }
      log_vault_access: {
        Args: {
          p_action: string
          p_error_message?: string
          p_gateway: string
          p_ip_address?: string
          p_metadata?: Json
          p_success?: boolean
          p_user_agent?: string
          p_vendor_id: string
        }
        Returns: string
      }
      offer_is_exposed_via_active_link: {
        Args: { p_offer_id: string }
        Returns: boolean
      }
      product_has_active_checkout: {
        Args: { p_product_id: string }
        Returns: boolean
      }
      register_key_version: {
        Args: {
          p_algorithm?: string
          p_key_identifier: string
          p_version: number
        }
        Returns: Json
      }
      save_gateway_credentials: {
        Args: {
          p_credentials: Json
          p_gateway: string
          p_ip_address?: string
          p_user_agent?: string
          p_vendor_id: string
        }
        Returns: Json
      }
      save_vault_secret: {
        Args: { p_name: string; p_secret: string }
        Returns: string
      }
      slugify: { Args: { txt: string }; Returns: string }
      start_key_rotation_log: {
        Args: { p_from_version: number; p_to_version: number }
        Returns: string
      }
      update_key_rotation_progress: {
        Args: { p_failed: number; p_log_id: string; p_processed: number }
        Returns: undefined
      }
      validate_coupon: {
        Args: { p_code: string; p_product_id: string }
        Returns: Json
      }
      vault_get_secret: { Args: { p_name: string }; Returns: string }
      vault_upsert_secret: {
        Args: { p_name: string; p_secret: string }
        Returns: undefined
      }
    }
    Enums: {
      account_status_enum:
        | "active"
        | "pending_setup"
        | "reset_required"
        | "owner_no_password"
        | "pending_email_verification"
      app_role: "admin" | "user" | "owner" | "seller" | "buyer"
      credit_card_gateway_type: "mercadopago" | "stripe" | "asaas"
      delivery_type_enum: "standard" | "members_area" | "external"
      integration_type:
        | "PUSHINPAY"
        | "UTMIFY"
        | "FACEBOOK_PIXEL"
        | "MERCADOPAGO"
      pix_gateway_type: "pushinpay" | "mercadopago" | "stripe" | "asaas"
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
    Enums: {
      account_status_enum: [
        "active",
        "pending_setup",
        "reset_required",
        "owner_no_password",
        "pending_email_verification",
      ],
      app_role: ["admin", "user", "owner", "seller", "buyer"],
      credit_card_gateway_type: ["mercadopago", "stripe", "asaas"],
      delivery_type_enum: ["standard", "members_area", "external"],
      integration_type: [
        "PUSHINPAY",
        "UTMIFY",
        "FACEBOOK_PIXEL",
        "MERCADOPAGO",
      ],
      pix_gateway_type: ["pushinpay", "mercadopago", "stripe", "asaas"],
    },
  },
} as const
