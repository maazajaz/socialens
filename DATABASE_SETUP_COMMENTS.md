# Database Setup for Comments

To enable the comment functionality, you need to run the SQL migration in your Supabase database.

## Steps:

1. **Go to your Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project
   - Go to the "SQL Editor" tab

2. **Run the Migration**
   - Copy the contents of `create_comments_tables.sql`
   - Paste it in the SQL Editor
   - Click "Run" to execute

3. **Verify Tables Created**
   - Go to "Table Editor" tab
   - You should see new tables: `comments` and `comment_likes`

## What the migration creates:

- `comments` table: Stores all comments and replies
- `comment_likes` table: Stores comment likes
- RLS policies for security
- Indexes for performance
- Helper functions for comment counts

## After running the migration:

- Comments will appear in PostCard when you click the comment icon
- Users can add, like, and reply to comments
- Real-time comment counts will be displayed

## Troubleshooting:

If you get errors, make sure:
- Your Supabase project is active
- You have the correct permissions
- The `users` and `posts` tables already exist
