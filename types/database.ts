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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      expense_allocations: {
        Row: {
          amount_minor: number
          created_at: string
          expense_id: string
          id: string
          organization_id: string
          property_id: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          expense_id: string
          id?: string
          organization_id: string
          property_id: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          expense_id?: string
          id?: string
          organization_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_allocations_expense_fk"
            columns: ["expense_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "expense_allocations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_allocations_property_fk"
            columns: ["property_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount_minor: number
          category: string
          created_at: string
          description: string
          id: string
          incurred_on: string
          organization_id: string
          property_id: string | null
          recorded_by: string
          reference: string | null
          status: Database["public"]["Enums"]["expense_status"]
          unit_id: string | null
          vendor_name: string | null
        }
        Insert: {
          amount_minor: number
          category: string
          created_at?: string
          description: string
          id?: string
          incurred_on: string
          organization_id: string
          property_id?: string | null
          recorded_by: string
          reference?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          unit_id?: string | null
          vendor_name?: string | null
        }
        Update: {
          amount_minor?: number
          category?: string
          created_at?: string
          description?: string
          id?: string
          incurred_on?: string
          organization_id?: string
          property_id?: string | null
          recorded_by?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          unit_id?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_property_id_organization_id_fkey"
            columns: ["property_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "expenses_unit_id_organization_id_fkey"
            columns: ["unit_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      leases: {
        Row: {
          created_at: string
          deposit_amount_minor: number
          due_day: number
          end_date: string | null
          id: string
          lease_reference: string | null
          organization_id: string
          rent_amount_minor: number
          start_date: string
          status: Database["public"]["Enums"]["lease_status"]
          tenant_id: string
          terms: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit_amount_minor?: number
          due_day?: number
          end_date?: string | null
          id?: string
          lease_reference?: string | null
          organization_id: string
          rent_amount_minor: number
          start_date: string
          status?: Database["public"]["Enums"]["lease_status"]
          tenant_id: string
          terms?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit_amount_minor?: number
          due_day?: number
          end_date?: string | null
          id?: string
          lease_reference?: string | null
          organization_id?: string
          rent_amount_minor?: number
          start_date?: string
          status?: Database["public"]["Enums"]["lease_status"]
          tenant_id?: string
          terms?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_tenant_id_organization_id_fkey"
            columns: ["tenant_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "leases_unit_id_organization_id_fkey"
            columns: ["unit_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          assigned_to: string | null
          category: string
          completed_at: string | null
          description: string | null
          due_date: string | null
          id: string
          organization_id: string
          priority: string
          property_id: string
          reported_at: string
          reported_by: string
          status: string
          title: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          completed_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id: string
          priority?: string
          property_id: string
          reported_at?: string
          reported_by: string
          status?: string
          title: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          completed_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string
          priority?: string
          property_id?: string
          reported_at?: string
          reported_by?: string
          status?: string
          title?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_property_org_fk"
            columns: ["property_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "maintenance_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_unit_org_fk"
            columns: ["unit_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          notification_type: string
          organization_id: string
          read_at: string | null
          rent_charge_id: string | null
          scheduled_for: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          notification_type: string
          organization_id: string
          read_at?: string | null
          rent_charge_id?: string | null
          scheduled_for?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          notification_type?: string
          organization_id?: string
          read_at?: string | null
          rent_charge_id?: string | null
          scheduled_for?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_rent_charge_id_fkey"
            columns: ["rent_charge_id"]
            isOneToOne: false
            referencedRelation: "rent_charge_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_rent_charge_id_fkey"
            columns: ["rent_charge_id"]
            isOneToOne: false
            referencedRelation: "rent_charges"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_subscriptions: {
        Row: {
          billing_interval: string
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string
          id: string
          organization_id: string
          plan_id: string
          provider: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          started_at: string
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_interval?: string
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          organization_id: string
          plan_id: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          started_at?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_interval?: string
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          organization_id?: string
          plan_id?: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          started_at?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          country_code: string
          created_at: string
          created_by: string
          currency_code: string
          id: string
          name: string
          timezone: string
          updated_at: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          created_by: string
          currency_code?: string
          id?: string
          name: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          created_by?: string
          currency_code?: string
          id?: string
          name?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      owner_payouts: {
        Row: {
          amount_minor: number
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          owner_id: string
          paid_on: string
          payment_method: string
          property_id: string
          recorded_by: string
          reference: string | null
        }
        Insert: {
          amount_minor: number
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          owner_id: string
          paid_on: string
          payment_method: string
          property_id: string
          recorded_by: string
          reference?: string | null
        }
        Update: {
          amount_minor?: number
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          owner_id?: string
          paid_on?: string
          payment_method?: string
          property_id?: string
          recorded_by?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owner_payouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_payouts_owner_fk"
            columns: ["owner_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "owner_payouts_property_fk"
            columns: ["property_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      owners: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          organization_id: string
          phone: string | null
          postal_address: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          postal_address?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          postal_address?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_allocations: {
        Row: {
          amount_minor: number
          created_at: string
          id: string
          organization_id: string
          payment_id: string
          rent_charge_id: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          id?: string
          organization_id: string
          payment_id: string
          rent_charge_id: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          id?: string
          organization_id?: string
          payment_id?: string
          rent_charge_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_organization_id_fkey"
            columns: ["payment_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "payment_allocations_rent_charge_id_organization_id_fkey"
            columns: ["rent_charge_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "rent_charge_balances"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "payment_allocations_rent_charge_id_organization_id_fkey"
            columns: ["rent_charge_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "rent_charges"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      payment_reversals: {
        Row: {
          id: string
          organization_id: string
          payment_id: string
          reason: string
          reversed_at: string
          reversed_by: string
        }
        Insert: {
          id?: string
          organization_id: string
          payment_id: string
          reason: string
          reversed_at?: string
          reversed_by: string
        }
        Update: {
          id?: string
          organization_id?: string
          payment_id?: string
          reason?: string
          reversed_at?: string
          reversed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reversals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reversals_payment_org_fk"
            columns: ["payment_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_minor: number
          created_at: string
          currency_code: string
          id: string
          lease_id: string | null
          notes: string | null
          organization_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_reference: string | null
          received_at: string
          recorded_by: string
          status: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency_code?: string
          id?: string
          lease_id?: string | null
          notes?: string | null
          organization_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_reference?: string | null
          received_at?: string
          recorded_by: string
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency_code?: string
          id?: string
          lease_id?: string | null
          notes?: string | null
          organization_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_reference?: string | null
          received_at?: string
          recorded_by?: string
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_lease_id_organization_id_fkey"
            columns: ["lease_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_organization_id_fkey"
            columns: ["tenant_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      properties: {
        Row: {
          address_line: string | null
          archived_at: string | null
          city: string | null
          created_at: string
          district: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          property_type: string
          updated_at: string
        }
        Insert: {
          address_line?: string | null
          archived_at?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          property_type?: string
          updated_at?: string
        }
        Update: {
          address_line?: string | null
          archived_at?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          property_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      property_owners: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          owner_id: string
          ownership_percent: number
          property_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          owner_id: string
          ownership_percent: number
          property_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          owner_id?: string
          ownership_percent?: number
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_owners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_owners_owner_id_organization_id_fkey"
            columns: ["owner_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "property_owners_property_id_organization_id_fkey"
            columns: ["property_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      rent_charges: {
        Row: {
          amount_minor: number
          charge_period: string
          created_at: string
          description: string
          due_date: string
          id: string
          lease_id: string
          organization_id: string
          status: Database["public"]["Enums"]["charge_status"]
        }
        Insert: {
          amount_minor: number
          charge_period: string
          created_at?: string
          description?: string
          due_date: string
          id?: string
          lease_id: string
          organization_id: string
          status?: Database["public"]["Enums"]["charge_status"]
        }
        Update: {
          amount_minor?: number
          charge_period?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          lease_id?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["charge_status"]
        }
        Relationships: [
          {
            foreignKeyName: "rent_charges_lease_id_organization_id_fkey"
            columns: ["lease_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "rent_charges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_change_requests: {
        Row: {
          billing_interval: string
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          requested_by: string
          requested_plan_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          billing_interval?: string
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          requested_by: string
          requested_plan_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          billing_interval?: string
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          requested_by?: string
          requested_plan_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_change_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_change_requests_requested_plan_id_fkey"
            columns: ["requested_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          annual_price_minor: number | null
          code: string
          created_at: string
          currency_code: string
          description: string
          features: Json
          id: string
          is_active: boolean
          max_properties: number | null
          max_team_members: number | null
          max_units: number | null
          monthly_price_minor: number | null
          name: string
          sort_order: number
        }
        Insert: {
          annual_price_minor?: number | null
          code: string
          created_at?: string
          currency_code?: string
          description: string
          features?: Json
          id?: string
          is_active?: boolean
          max_properties?: number | null
          max_team_members?: number | null
          max_units?: number | null
          monthly_price_minor?: number | null
          name: string
          sort_order?: number
        }
        Update: {
          annual_price_minor?: number | null
          code?: string
          created_at?: string
          currency_code?: string
          description?: string
          features?: Json
          id?: string
          is_active?: boolean
          max_properties?: number | null
          max_team_members?: number | null
          max_units?: number | null
          monthly_price_minor?: number | null
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      tenant_documents: {
        Row: {
          content_type: string
          document_type: string
          file_name: string
          id: string
          notes: string | null
          organization_id: string
          size_bytes: number
          storage_path: string
          tenant_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          content_type: string
          document_type?: string
          file_name: string
          id?: string
          notes?: string | null
          organization_id: string
          size_bytes: number
          storage_path: string
          tenant_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          content_type?: string
          document_type?: string
          file_name?: string
          id?: string
          notes?: string | null
          organization_id?: string
          size_bytes?: number
          storage_path?: string
          tenant_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_documents_tenant_org_fk"
            columns: ["tenant_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          id: string
          national_id_last4: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          id?: string
          national_id_last4?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          id?: string
          national_id_last4?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          floor_label: string | null
          id: string
          monthly_rent_minor: number
          notes: string | null
          organization_id: string
          property_id: string
          status: Database["public"]["Enums"]["unit_status"]
          unit_code: string
          updated_at: string
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          floor_label?: string | null
          id?: string
          monthly_rent_minor?: number
          notes?: string | null
          organization_id: string
          property_id: string
          status?: Database["public"]["Enums"]["unit_status"]
          unit_code: string
          updated_at?: string
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          floor_label?: string | null
          id?: string
          monthly_rent_minor?: number
          notes?: string | null
          organization_id?: string
          property_id?: string
          status?: Database["public"]["Enums"]["unit_status"]
          unit_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_property_id_organization_id_fkey"
            columns: ["property_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
    }
    Views: {
      owner_monthly_statements: {
        Row: {
          organization_id: string | null
          owner_expense_share_minor: number | null
          owner_id: string | null
          owner_name: string | null
          owner_net_minor: number | null
          owner_rent_share_minor: number | null
          ownership_percent: number | null
          property_expenses_minor: number | null
          property_id: string | null
          property_name: string | null
          property_rent_received_minor: number | null
          statement_month: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_owners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_owners_owner_id_organization_id_fkey"
            columns: ["owner_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "property_owners_property_id_organization_id_fkey"
            columns: ["property_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      owner_payout_balances: {
        Row: {
          last_paid_on: string | null
          organization_id: string | null
          owner_id: string | null
          owner_name: string | null
          payout_count: number | null
          property_id: string | null
          property_name: string | null
          total_paid_minor: number | null
        }
        Relationships: [
          {
            foreignKeyName: "owner_payouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_payouts_owner_fk"
            columns: ["owner_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "owner_payouts_property_fk"
            columns: ["property_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      rent_charge_balances: {
        Row: {
          amount_minor: number | null
          balance_minor: number | null
          charge_period: string | null
          description: string | null
          due_date: string | null
          id: string | null
          lease_id: string | null
          organization_id: string | null
          paid_minor: number | null
          status: Database["public"]["Enums"]["charge_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "rent_charges_lease_id_organization_id_fkey"
            columns: ["lease_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "rent_charges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_monthly_rent_charges: {
        Args: { p_organization_id: string; p_period: string }
        Returns: number
      }
      record_rent_payment: {
        Args: {
          p_allocations?: Json
          p_amount_minor: number
          p_lease_id: string
          p_notes?: string
          p_organization_id: string
          p_payment_method: Database["public"]["Enums"]["payment_method"]
          p_payment_reference?: string
          p_received_at?: string
          p_tenant_id: string
        }
        Returns: string
      }
      reverse_rent_payment: {
        Args: {
          p_organization_id: string
          p_payment_id: string
          p_reason: string
        }
        Returns: undefined
      }
    }
    Enums: {
      charge_status: "open" | "partially_paid" | "paid" | "void"
      expense_status: "recorded" | "void"
      lease_status: "draft" | "active" | "ended" | "terminated"
      organization_role: "owner" | "admin" | "manager" | "accountant" | "staff"
      payment_method:
        | "cash"
        | "bank_transfer"
        | "mobile_money"
        | "cheque"
        | "other"
      payment_status: "posted" | "reversed"
      unit_status: "vacant" | "occupied" | "maintenance" | "inactive"
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
      charge_status: ["open", "partially_paid", "paid", "void"],
      expense_status: ["recorded", "void"],
      lease_status: ["draft", "active", "ended", "terminated"],
      organization_role: ["owner", "admin", "manager", "accountant", "staff"],
      payment_method: [
        "cash",
        "bank_transfer",
        "mobile_money",
        "cheque",
        "other",
      ],
      payment_status: ["posted", "reversed"],
      unit_status: ["vacant", "occupied", "maintenance", "inactive"],
    },
  },
} as const
