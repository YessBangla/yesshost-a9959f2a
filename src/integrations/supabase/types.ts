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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      affiliate_clicks: {
        Row: {
          created_at: string
          id: string
          ref_code: string | null
          referrer_user_id: string
          source_page: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ref_code?: string | null
          referrer_user_id: string
          source_page?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ref_code?: string | null
          referrer_user_id?: string
          source_page?: string | null
        }
        Relationships: []
      }
      affiliate_commissions: {
        Row: {
          amount_bdt: number
          created_at: string
          description: string | null
          id: string
          invoice_id: string | null
          referral_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_bdt: number
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          referral_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_bdt?: number
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          referral_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: true
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "affiliate_referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          account_details: string
          amount_bdt: number
          created_at: string
          id: string
          method: string
          note: string | null
          processed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          account_details: string
          amount_bdt: number
          created_at?: string
          id?: string
          method: string
          note?: string | null
          processed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          account_details?: string
          amount_bdt?: number
          created_at?: string
          id?: string
          method?: string
          note?: string | null
          processed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_profiles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          payout_account: string | null
          payout_method: string
          referral_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          payout_account?: string | null
          payout_method?: string
          referral_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          payout_account?: string | null
          payout_method?: string
          referral_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_referrals: {
        Row: {
          created_at: string
          id: string
          referred_user_id: string
          referrer_user_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_user_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_user_id?: string
          status?: string
        }
        Relationships: []
      }
      call_history: {
        Row: {
          caller_role: string
          chat_id: string
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          started_at: string
          status: string
        }
        Insert: {
          caller_role?: string
          chat_id: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string
        }
        Update: {
          caller_role?: string
          chat_id?: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_history_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "live_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_members: {
        Row: {
          created_at: string
          id: string
          room_id: string
          status: Database["public"]["Enums"]["room_member_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          room_id: string
          status?: Database["public"]["Enums"]["room_member_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          room_id?: string
          status?: Database["public"]["Enums"]["room_member_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      communication_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      communication_test_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          run_by: string | null
          steps: Json
          success: boolean
          target: string | null
          test_type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          run_by?: string | null
          steps?: Json
          success?: boolean
          target?: string | null
          test_type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          run_by?: string | null
          steps?: Json
          success?: boolean
          target?: string | null
          test_type?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_discount_amount: number | null
          max_uses: number | null
          min_order_amount: number | null
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      domain_pricing: {
        Row: {
          created_at: string
          ext: string
          id: string
          is_active: boolean
          is_popular: boolean
          registration_bdt: string
          renewal_bdt: string
          sort_order: number
          transfer_bdt: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ext: string
          id?: string
          is_active?: boolean
          is_popular?: boolean
          registration_bdt: string
          renewal_bdt: string
          sort_order?: number
          transfer_bdt: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ext?: string
          id?: string
          is_active?: boolean
          is_popular?: boolean
          registration_bdt?: string
          renewal_bdt?: string
          sort_order?: number
          transfer_bdt?: string
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer_bn: string
          answer_en: string
          category: string | null
          created_at: string
          id: string
          is_active: boolean | null
          question_bn: string
          question_en: string
          sort_order: number | null
        }
        Insert: {
          answer_bn: string
          answer_en: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          question_bn: string
          question_en: string
          sort_order?: number | null
        }
        Update: {
          answer_bn?: string
          answer_en?: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          question_bn?: string
          question_en?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_bdt: number
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string
          paid_at: string | null
          payment_method: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_bdt: number
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          paid_at?: string | null
          payment_method?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_bdt?: number
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          paid_at?: string | null
          payment_method?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_articles: {
        Row: {
          category_id: string
          content_bn: string
          content_en: string
          created_at: string
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          title_bn: string
          title_en: string
          updated_at: string
        }
        Insert: {
          category_id: string
          content_bn?: string
          content_en?: string
          created_at?: string
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number
          title_bn: string
          title_en: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          content_bn?: string
          content_en?: string
          created_at?: string
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          title_bn?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "kb_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          title_bn: string
          title_en: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number
          title_bn: string
          title_en: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          title_bn?: string
          title_en?: string
        }
        Relationships: []
      }
      live_chat_messages: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          message: string
          sender_type: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          message: string
          sender_type: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "live_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chats: {
        Row: {
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string | null
          visitor_email: string | null
          visitor_name: string
          visitor_phone: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string
          visitor_phone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string
          visitor_phone?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          billing_cycle: string | null
          created_at: string
          domain_ext: string | null
          domain_name: string | null
          hosting_category: string | null
          id: string
          include_hosting: boolean | null
          item_description: string | null
          item_name: string
          item_type: string
          order_id: string
          plan_id: string | null
          price_bdt: number
          provisioned_at: string | null
          service_id: string | null
          theme_id: string | null
          theme_slug: string | null
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string
          domain_ext?: string | null
          domain_name?: string | null
          hosting_category?: string | null
          id?: string
          include_hosting?: boolean | null
          item_description?: string | null
          item_name: string
          item_type: string
          order_id: string
          plan_id?: string | null
          price_bdt?: number
          provisioned_at?: string | null
          service_id?: string | null
          theme_id?: string | null
          theme_slug?: string | null
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string
          domain_ext?: string | null
          domain_name?: string | null
          hosting_category?: string | null
          id?: string
          include_hosting?: boolean | null
          item_description?: string | null
          item_name?: string
          item_type?: string
          order_id?: string
          plan_id?: string | null
          price_bdt?: number
          provisioned_at?: string | null
          service_id?: string | null
          theme_id?: string | null
          theme_slug?: string | null
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
            foreignKeyName: "order_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          coupon_code: string | null
          created_at: string
          discount_bdt: number
          id: string
          invoice_id: string | null
          order_note: string | null
          order_number: string
          paid_at: string | null
          payment_method: string | null
          payment_status: string
          processed_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_bdt: number
          total_bdt: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          coupon_code?: string | null
          created_at?: string
          discount_bdt?: number
          id?: string
          invoice_id?: string | null
          order_note?: string | null
          order_number: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_bdt?: number
          total_bdt?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          coupon_code?: string | null
          created_at?: string
          discount_bdt?: number
          id?: string
          invoice_id?: string | null
          order_note?: string | null
          order_number?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_bdt?: number
          total_bdt?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          attempts: number
          channel: string
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          purpose: string
          recipient: string
          used_at: string | null
        }
        Insert: {
          attempts?: number
          channel: string
          code_hash: string
          created_at?: string
          expires_at: string
          id?: string
          purpose?: string
          recipient: string
          used_at?: string | null
        }
        Update: {
          attempts?: number
          channel?: string
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          purpose?: string
          recipient?: string
          used_at?: string | null
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          amount_bdt: number | null
          created_at: string
          gateway: string
          id: string
          invoice_id: string | null
          message: string | null
          payload: Json | null
          settled: boolean
          status: string
          transaction_id: string
          user_id: string | null
          verified: boolean
        }
        Insert: {
          amount_bdt?: number | null
          created_at?: string
          gateway: string
          id?: string
          invoice_id?: string | null
          message?: string | null
          payload?: Json | null
          settled?: boolean
          status: string
          transaction_id: string
          user_id?: string | null
          verified?: boolean
        }
        Update: {
          amount_bdt?: number | null
          created_at?: string
          gateway?: string
          id?: string
          invoice_id?: string | null
          message?: string | null
          payload?: Json | null
          settled?: boolean
          status?: string
          transaction_id?: string
          user_id?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateway_settings: {
        Row: {
          created_at: string
          credentials: Json
          enabled: boolean
          gateway: string
          id: string
          is_sandbox: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          credentials?: Json
          enabled?: boolean
          gateway: string
          id?: string
          is_sandbox?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          credentials?: Json
          enabled?: boolean
          gateway?: string
          id?: string
          is_sandbox?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      pricing_plans: {
        Row: {
          annual_price_bdt: string | null
          category: string
          created_at: string
          features: Json | null
          id: string
          is_active: boolean | null
          is_highlighted: boolean | null
          name: string
          price_bdt: string
          slug: string
          sort_order: number | null
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          annual_price_bdt?: string | null
          category: string
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_highlighted?: boolean | null
          name: string
          price_bdt: string
          slug: string
          sort_order?: number | null
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          annual_price_bdt?: string | null
          category?: string
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_highlighted?: boolean | null
          name?: string
          price_bdt?: string
          slug?: string
          sort_order?: number | null
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          company_name: string | null
          company_website: string | null
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          referred_by: string | null
          updated_at: string
          user_id: string
          vat_id: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          company_name?: string | null
          company_website?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id: string
          vat_id?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          company_name?: string | null
          company_website?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id?: string
          vat_id?: string | null
        }
        Relationships: []
      }
      reseller_accounts: {
        Row: {
          bandwidth_mb: number
          cpanel_created: boolean
          created_at: string
          disk_quota_mb: number
          domain: string
          email: string | null
          id: string
          plan_name: string
          reseller_package_id: string
          reseller_user_id: string
          status: string
          suspended_at: string | null
          updated_at: string
          username: string
        }
        Insert: {
          bandwidth_mb?: number
          cpanel_created?: boolean
          created_at?: string
          disk_quota_mb?: number
          domain: string
          email?: string | null
          id?: string
          plan_name?: string
          reseller_package_id: string
          reseller_user_id: string
          status?: string
          suspended_at?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          bandwidth_mb?: number
          cpanel_created?: boolean
          created_at?: string
          disk_quota_mb?: number
          domain?: string
          email?: string | null
          id?: string
          plan_name?: string
          reseller_package_id?: string
          reseller_user_id?: string
          status?: string
          suspended_at?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "reseller_accounts_reseller_package_id_fkey"
            columns: ["reseller_package_id"]
            isOneToOne: false
            referencedRelation: "reseller_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_packages: {
        Row: {
          created_at: string
          id: string
          max_accounts: number
          max_bandwidth_mb: number
          max_disk_mb: number
          package_name: string
          service_id: string | null
          status: string
          updated_at: string
          used_accounts: number
          used_bandwidth_mb: number
          used_disk_mb: number
          user_id: string
          whm_server_host: string | null
          whm_username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          max_accounts?: number
          max_bandwidth_mb?: number
          max_disk_mb?: number
          package_name?: string
          service_id?: string | null
          status?: string
          updated_at?: string
          used_accounts?: number
          used_bandwidth_mb?: number
          used_disk_mb?: number
          user_id: string
          whm_server_host?: string | null
          whm_username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          max_accounts?: number
          max_bandwidth_mb?: number
          max_disk_mb?: number
          package_name?: string
          service_id?: string | null
          status?: string
          updated_at?: string
          used_accounts?: number
          used_bandwidth_mb?: number
          used_disk_mb?: number
          user_id?: string
          whm_server_host?: string | null
          whm_username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reseller_packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          billing_cycle: string | null
          created_at: string
          domain: string | null
          expiry_date: string | null
          id: string
          ip_address: string | null
          name: string
          plan: string | null
          price_bdt: number
          service_type: Database["public"]["Enums"]["service_type"]
          specs: Json | null
          start_date: string | null
          status: Database["public"]["Enums"]["service_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string
          domain?: string | null
          expiry_date?: string | null
          id?: string
          ip_address?: string | null
          name: string
          plan?: string | null
          price_bdt?: number
          service_type: Database["public"]["Enums"]["service_type"]
          specs?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string
          domain?: string | null
          expiry_date?: string | null
          id?: string
          ip_address?: string | null
          name?: string
          plan?: string | null
          price_bdt?: number
          service_type?: Database["public"]["Enums"]["service_type"]
          specs?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content_bn: string | null
          content_en: string | null
          created_at: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          page: string
          section_key: string
          sort_order: number | null
          title_bn: string | null
          title_en: string | null
          updated_at: string
        }
        Insert: {
          content_bn?: string | null
          content_en?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          page: string
          section_key: string
          sort_order?: number | null
          title_bn?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          content_bn?: string | null
          content_en?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          page?: string
          section_key?: string
          sort_order?: number | null
          title_bn?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          department: Database["public"]["Enums"]["ticket_department"]
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          service_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: Database["public"]["Enums"]["ticket_department"]
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          service_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: Database["public"]["Enums"]["ticket_department"]
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          service_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          company: string | null
          content_bn: string
          content_en: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          rating: number | null
          sort_order: number | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          content_bn: string
          content_en: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          rating?: number | null
          sort_order?: number | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          content_bn?: string
          content_en?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          rating?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
      theme_orders: {
        Row: {
          amount_bdt: number
          created_at: string
          id: string
          include_hosting: boolean | null
          paid_at: string | null
          payment_method: string | null
          status: string
          theme_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_bdt: number
          created_at?: string
          id?: string
          include_hosting?: boolean | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          theme_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_bdt?: number
          created_at?: string
          id?: string
          include_hosting?: boolean | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          theme_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_orders_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_seller_payouts: {
        Row: {
          account_details: string
          amount_bdt: number
          created_at: string
          id: string
          method: string
          note: string | null
          processed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          account_details: string
          amount_bdt: number
          created_at?: string
          id?: string
          method: string
          note?: string | null
          processed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          account_details?: string
          amount_bdt?: number
          created_at?: string
          id?: string
          method?: string
          note?: string | null
          processed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      themes: {
        Row: {
          approval_note: string | null
          approval_status: string
          category: Database["public"]["Enums"]["theme_category"]
          commission_rate: number
          created_at: string
          description_bn: string | null
          description_en: string | null
          discount_price_bdt: number | null
          features: Json | null
          file_path: string | null
          hosting_bundle_features: Json | null
          hosting_bundle_price_bdt: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          preview_url: string | null
          price_bdt: number
          screenshots: Json | null
          seller_user_id: string | null
          slug: string
          sort_order: number | null
          tags: Json | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          approval_note?: string | null
          approval_status?: string
          category: Database["public"]["Enums"]["theme_category"]
          commission_rate?: number
          created_at?: string
          description_bn?: string | null
          description_en?: string | null
          discount_price_bdt?: number | null
          features?: Json | null
          file_path?: string | null
          hosting_bundle_features?: Json | null
          hosting_bundle_price_bdt?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          preview_url?: string | null
          price_bdt?: number
          screenshots?: Json | null
          seller_user_id?: string | null
          slug: string
          sort_order?: number | null
          tags?: Json | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          approval_note?: string | null
          approval_status?: string
          category?: Database["public"]["Enums"]["theme_category"]
          commission_rate?: number
          created_at?: string
          description_bn?: string | null
          description_en?: string | null
          discount_price_bdt?: number | null
          features?: Json | null
          file_path?: string | null
          hosting_bundle_features?: Json | null
          hosting_bundle_price_bdt?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          preview_url?: string | null
          price_bdt?: number
          screenshots?: Json | null
          seller_user_id?: string | null
          slug?: string
          sort_order?: number | null
          tags?: Json | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ticket_replies: {
        Row: {
          created_at: string
          id: string
          is_staff: boolean | null
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_staff?: boolean | null
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_staff?: boolean | null
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: []
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
      wallet_transactions: {
        Row: {
          amount_bdt: number
          created_at: string
          description: string | null
          id: string
          payment_method: string | null
          status: string
          transaction_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_bdt?: number
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_bdt?: number
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_coupon_usage: {
        Args: { coupon_id: string }
        Returns: undefined
      }
      provision_order: { Args: { _order_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "call_center" | "reseller"
      discount_type: "percentage" | "fixed"
      invoice_status: "paid" | "unpaid" | "overdue" | "cancelled" | "refunded"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "provisioning"
        | "active"
        | "completed"
        | "cancelled"
        | "refunded"
      room_member_status: "pending" | "approved" | "rejected"
      service_status:
        | "active"
        | "pending"
        | "suspended"
        | "cancelled"
        | "expired"
      service_type:
        | "shared_hosting"
        | "cloud_hosting"
        | "vps"
        | "wordpress"
        | "reseller"
        | "domain"
        | "ssl"
        | "email"
      theme_category:
        | "business"
        | "ecommerce"
        | "portfolio"
        | "restaurant"
        | "blog"
        | "landing"
        | "education"
        | "healthcare"
        | "news"
        | "agency"
        | "realestate"
        | "travel"
      ticket_department: "billing" | "technical" | "sales" | "general"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status: "open" | "in_progress" | "waiting" | "resolved" | "closed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user", "call_center", "reseller"],
      discount_type: ["percentage", "fixed"],
      invoice_status: ["paid", "unpaid", "overdue", "cancelled", "refunded"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "provisioning",
        "active",
        "completed",
        "cancelled",
        "refunded",
      ],
      room_member_status: ["pending", "approved", "rejected"],
      service_status: [
        "active",
        "pending",
        "suspended",
        "cancelled",
        "expired",
      ],
      service_type: [
        "shared_hosting",
        "cloud_hosting",
        "vps",
        "wordpress",
        "reseller",
        "domain",
        "ssl",
        "email",
      ],
      theme_category: [
        "business",
        "ecommerce",
        "portfolio",
        "restaurant",
        "blog",
        "landing",
        "education",
        "healthcare",
        "news",
        "agency",
        "realestate",
        "travel",
      ],
      ticket_department: ["billing", "technical", "sales", "general"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "waiting", "resolved", "closed"],
    },
  },
} as const
