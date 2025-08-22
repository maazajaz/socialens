export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          name: string
          username: string
          bio: string | null
          image_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          name: string
          username: string
          bio?: string | null
          image_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          name?: string
          username?: string
          bio?: string | null
          image_url?: string | null
        }
      }
      posts: {
        Row: {
          id: string
          created_at: string
          caption: string
          image_url: string | null
          location: string | null
          tags: string[] | null
          creator_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          caption: string
          image_url?: string | null
          location?: string | null
          tags?: string[] | null
          creator_id: string
        }
        Update: {
          id?: string
          created_at?: string
          caption?: string
          image_url?: string | null
          location?: string | null
          tags?: string[] | null
          creator_id?: string
        }
      }
      likes: {
        Row: {
          id: string
          created_at: string
          user_id: string
          post_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          post_id: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          post_id?: string
        }
      }
      saves: {
        Row: {
          id: string
          created_at: string
          user_id: string
          post_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          post_id: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          post_id?: string
        }
      }
      follows: {
        Row: {
          id: string
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          id?: string
          created_at?: string
          follower_id?: string
          following_id?: string
        }
      }
      comments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          content: string
          user_id: string
          post_id: string
          parent_id: string | null
          is_edited: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          content: string
          user_id: string
          post_id: string
          parent_id?: string | null
          is_edited?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          content?: string
          user_id?: string
          post_id?: string
          parent_id?: string | null
          is_edited?: boolean
        }
      }
      comment_likes: {
        Row: {
          id: string
          created_at: string
          user_id: string
          comment_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          comment_id: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          comment_id?: string
        }
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
