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
          asaas_wallet_id: string | null
          commission_rate: number | null
          created_at: string | null
          id: string
          product_id: string
          status: string
          total_sales_amount: number | null
          total_sales_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          affiliate_code: string
          asaas_wallet_id?: string | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          product_id: string
          status?: string
          total_sales_amount?: number | null
          total_sales_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          affiliate_code?: string
          asaas_wallet_id?: string | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
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
          mercadopago_public_key: string | null
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
          mercadopago_public_key?: string | null
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
          mercadopago_public_key?: string | null
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
            referencedRelation: "profiles"
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
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
          name?: string
          price?: number
          product_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
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
          checkout_id: string
          created_at: string | null
          custom_description: string | null
          custom_title: string | null
          discount_enabled: boolean | null
          discount_price: number | null
          id: string
          offer_id: string | null
          position: number
          product_id: string
          show_image: boolean | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          call_to_action?: string | null
          checkout_id: string
          created_at?: string | null
          custom_description?: string | null
          custom_title?: string | null
          discount_enabled?: boolean | null
          discount_price?: number | null
          id?: string
          offer_id?: string | null
          position?: number
          product_id: string
          show_image?: boolean | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          call_to_action?: string | null
          checkout_id?: string
          created_at?: string | null
          custom_description?: string | null
          custom_title?: string | null
          discount_enabled?: boolean | null
          discount_price?: number | null
          id?: string
          offer_id?: string | null
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
          gateway_event_id: string | null
          id: string
          occurred_at: string
          order_id: string
          type: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          gateway_event_id?: string | null
          id?: string
          occurred_at: string
          order_id: string
          type: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          gateway_event_id?: string | null
          id?: string
          occurred_at?: string
          order_id?: string
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
      orders: {
        Row: {
          access_token: string | null
          affiliate_id: string | null
          amount_cents: number
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
          gateway: string
          gateway_payment_id: string | null
          id: string
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
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          access_token?: string | null
          affiliate_id?: string | null
          amount_cents: number
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
          gateway: string
          gateway_payment_id?: string | null
          id?: string
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
          status: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          access_token?: string | null
          affiliate_id?: string | null
          amount_cents?: number
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
          gateway?: string
          gateway_payment_id?: string | null
          id?: string
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
          status?: string
          updated_at?: string
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
        Relationships: []
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
      products: {
        Row: {
          affiliate_settings: Json | null
          created_at: string | null
          default_payment_method: string | null
          description: string | null
          id: string
          image_url: string | null
          marketplace_category: string | null
          marketplace_clicks: number | null
          marketplace_description: string | null
          marketplace_enabled_at: string | null
          marketplace_rules: string | null
          marketplace_tags: string[] | null
          marketplace_views: number | null
          name: string
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
          affiliate_settings?: Json | null
          created_at?: string | null
          default_payment_method?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          marketplace_category?: string | null
          marketplace_clicks?: number | null
          marketplace_description?: string | null
          marketplace_enabled_at?: string | null
          marketplace_rules?: string | null
          marketplace_tags?: string[] | null
          marketplace_views?: number | null
          name: string
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
          affiliate_settings?: Json | null
          created_at?: string | null
          default_payment_method?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          marketplace_category?: string | null
          marketplace_clicks?: number | null
          marketplace_description?: string | null
          marketplace_enabled_at?: string | null
          marketplace_rules?: string | null
          marketplace_tags?: string[] | null
          marketplace_views?: number | null
          name?: string
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
        Relationships: []
      }
      profiles: {
        Row: {
          asaas_wallet_id: string | null
          cpf_cnpj: string | null
          created_at: string | null
          custom_fee_percent: number | null
          id: string
          mercadopago_collector_id: string | null
          mercadopago_connected_at: string | null
          mercadopago_email: string | null
          name: string
          phone: string | null
          status: string | null
          status_changed_at: string | null
          status_changed_by: string | null
          status_reason: string | null
          stripe_account_id: string | null
          stripe_connected_at: string | null
          test_access_token: string | null
          test_mode_enabled: boolean | null
          test_public_key: string | null
          updated_at: string | null
        }
        Insert: {
          asaas_wallet_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          custom_fee_percent?: number | null
          id: string
          mercadopago_collector_id?: string | null
          mercadopago_connected_at?: string | null
          mercadopago_email?: string | null
          name: string
          phone?: string | null
          status?: string | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          stripe_account_id?: string | null
          stripe_connected_at?: string | null
          test_access_token?: string | null
          test_mode_enabled?: boolean | null
          test_public_key?: string | null
          updated_at?: string | null
        }
        Update: {
          asaas_wallet_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          custom_fee_percent?: number | null
          id?: string
          mercadopago_collector_id?: string | null
          mercadopago_connected_at?: string | null
          mercadopago_email?: string | null
          name?: string
          phone?: string | null
          status?: string | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          stripe_account_id?: string | null
          stripe_connected_at?: string | null
          test_access_token?: string | null
          test_mode_enabled?: boolean | null
          test_public_key?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: []
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
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
        Relationships: []
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
        Relationships: []
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
          approval_mode: string | null
          commission_percentage: number | null
          conversion_rate: number | null
          cookie_duration_days: number | null
          created_at: string | null
          description: string | null
          has_order_bump_commission: boolean | null
          has_upsell: boolean | null
          id: string | null
          image_url: string | null
          marketplace_category: string | null
          marketplace_clicks: number | null
          marketplace_description: string | null
          marketplace_enabled_at: string | null
          marketplace_rules: string | null
          marketplace_tags: string[] | null
          marketplace_views: number | null
          name: string | null
          popularity_score: number | null
          price: number | null
          producer_id: string | null
          producer_name: string | null
          requires_manual_approval: boolean | null
          total_affiliates: number | null
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
        Relationships: []
      }
    }
    Functions: {
      attach_offer_to_checkout_smart: {
        Args: { p_checkout_id: string; p_offer_id: string }
        Returns: Json
      }
      can_have_affiliates: { Args: { p_user_id: string }; Returns: boolean }
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
      create_order_with_items: {
        Args: { p_items: Json; p_order_data: Json }
        Returns: Json
      }
      create_payment_link_for_offer: {
        Args: { p_offer_id: string; p_slug?: string }
        Returns: string
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
      generate_unique_payment_slug: {
        Args: { p_offer_id: string }
        Returns: string
      }
      get_checkout_by_payment_slug: {
        Args: { p_slug: string }
        Returns: {
          checkout_id: string
          product_id: string
        }[]
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
      get_producer_affiliates: {
        Args: { search_term?: string }
        Returns: {
          affiliate_code: string
          affiliate_email: string
          affiliate_name: string
          commission_rate: number
          created_at: string
          id: string
          product_id: string
          product_name: string
          product_settings: Json
          status: string
          total_sales_amount: number
          total_sales_count: number
          user_id: string
        }[]
      }
      get_user_role: { Args: { p_user_id: string }; Returns: string }
      get_vault_secret: { Args: { p_name: string }; Returns: string }
      get_vendor_public_key: {
        Args: { p_vendor_id: string }
        Returns: {
          public_key: string
          test_mode_enabled: boolean
        }[]
      }
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
      offer_is_exposed_via_active_link: {
        Args: { p_offer_id: string }
        Returns: boolean
      }
      product_has_active_checkout: {
        Args: { p_product_id: string }
        Returns: boolean
      }
      save_vault_secret: {
        Args: { p_name: string; p_secret: string }
        Returns: string
      }
      slugify: { Args: { txt: string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
      validate_coupon: {
        Args: { p_code: string; p_product_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user" | "owner" | "seller"
      credit_card_gateway_type: "mercadopago" | "stripe" | "asaas"
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
      app_role: ["admin", "user", "owner", "seller"],
      credit_card_gateway_type: ["mercadopago", "stripe", "asaas"],
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
