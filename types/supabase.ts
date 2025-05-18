export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      pantries: {
        Row: {
          id: string
          owner_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          created_at?: string
        }
      }
      pantry_members: {
        Row: {
          id: string
          pantry_id: string
          user_id: string
          role: "view" | "edit"
        }
        Insert: {
          id?: string
          pantry_id: string
          user_id: string
          role: "view" | "edit"
        }
        Update: {
          id?: string
          pantry_id?: string
          user_id?: string
          role?: "view" | "edit"
        }
      }
      pantry_items: {
        Row: {
          id: string
          pantryid: string // Note: lowercase 'id' to match the schema
          name: string
          quantity?: number
          unit?: string
          category?: string
          avgprice?: number // Note: lowercase 'price' to match the schema
          location?: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          pantryid: string // Note: lowercase 'id' to match the schema
          name: string
          quantity?: number
          unit?: string
          category?: string
          avgprice?: number // Note: lowercase 'price' to match the schema
          location?: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          pantryid?: string // Note: lowercase 'id' to match the schema
          name?: string
          quantity?: number
          unit?: string
          category?: string
          avgprice?: number // Note: lowercase 'price' to match the schema
          location?: string
          createdAt?: string
          updatedAt?: string
        }
      }
    }
    Enums: {
      pantry_role: "view" | "edit"
    }
  }
}
