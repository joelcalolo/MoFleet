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
      cars: {
        Row: {
          brand: string
          car_type: string
          created_at: string | null
          delivery_fee: number | null
          deposit_amount: number
          drive_type: string
          fuel_type: string
          id: string
          is_available: boolean | null
          license_plate: string
          model: string
          notes: string | null
          pickup_fee: number | null
          price_city_with_driver: number
          price_city_without_driver: number
          price_outside_with_driver: number
          price_outside_without_driver: number
          seats: number
          transmission: string
          updated_at: string | null
        }
        Insert: {
          brand: string
          car_type: string
          created_at?: string | null
          delivery_fee?: number | null
          deposit_amount: number
          drive_type: string
          fuel_type: string
          id?: string
          is_available?: boolean | null
          license_plate: string
          model: string
          notes?: string | null
          pickup_fee?: number | null
          price_city_with_driver: number
          price_city_without_driver: number
          price_outside_with_driver: number
          price_outside_without_driver: number
          seats: number
          transmission: string
          updated_at?: string | null
        }
        Update: {
          brand?: string
          car_type?: string
          created_at?: string | null
          delivery_fee?: number | null
          deposit_amount?: number
          drive_type?: string
          fuel_type?: string
          id?: string
          is_available?: boolean | null
          license_plate?: string
          model?: string
          notes?: string | null
          pickup_fee?: number | null
          price_city_with_driver?: number
          price_city_without_driver?: number
          price_outside_with_driver?: number
          price_outside_without_driver?: number
          seats?: number
          transmission?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      checkins: {
        Row: {
          checkin_date: string
          created_at: string | null
          deposit_returned: boolean | null
          extra_fees_amount: number | null
          final_km: number
          fines_amount: number | null
          id: string
          notes: string | null
          reservation_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string | null
          deposit_returned?: boolean | null
          extra_fees_amount?: number | null
          final_km: number
          fines_amount?: number | null
          id?: string
          notes?: string | null
          reservation_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string | null
          deposit_returned?: boolean | null
          extra_fees_amount?: number | null
          final_km?: number
          fines_amount?: number | null
          id?: string
          notes?: string | null
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      checkouts: {
        Row: {
          checkout_date: string
          created_at: string | null
          id: string
          initial_km: number
          notes: string | null
          reservation_id: string
        }
        Insert: {
          checkout_date?: string
          created_at?: string | null
          id?: string
          initial_km: number
          notes?: string | null
          reservation_id: string
        }
        Update: {
          checkout_date?: string
          created_at?: string | null
          id?: string
          initial_km?: number
          notes?: string | null
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkouts_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string | null
          drivers_license: string | null
          email: string | null
          id: string
          id_document: string | null
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string | null
          drivers_license?: string | null
          email?: string | null
          id?: string
          id_document?: string | null
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string | null
          drivers_license?: string | null
          email?: string | null
          id?: string
          id_document?: string | null
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          car_id: string
          created_at: string | null
          customer_id: string
          deposit_paid: boolean | null
          end_date: string
          id: string
          location_type: string
          notes: string | null
          start_date: string
          status: string
          total_amount: number
          updated_at: string | null
          with_driver: boolean | null
        }
        Insert: {
          car_id: string
          created_at?: string | null
          customer_id: string
          deposit_paid?: boolean | null
          end_date: string
          id?: string
          location_type: string
          notes?: string | null
          start_date: string
          status?: string
          total_amount: number
          updated_at?: string | null
          with_driver?: boolean | null
        }
        Update: {
          car_id?: string
          created_at?: string | null
          customer_id?: string
          deposit_paid?: boolean | null
          end_date?: string
          id?: string
          location_type?: string
          notes?: string | null
          start_date?: string
          status?: string
          total_amount?: number
          updated_at?: string | null
          with_driver?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
