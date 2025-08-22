# SociaLens - Social Media Platform

SociaLens is a modern social media platform built with Next.js, React, TypeScript, and Supabase. It features user authentication, post creation, social interactions (likes, saves), user profiles, and a responsive design inspired by Instagram.

## Features

- **User Authentication**: Secure sign-up and sign-in with Supabase Auth
- **Post Management**: Create, edit, and delete posts with images
- **Social Interactions**: Like and save posts, follow other users
- **User Profiles**: Customizable user profiles with bio and profile pictures
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Live updates for likes, saves, and follows
- **File Upload**: Image upload functionality with Supabase Storage
- **Infinite Scroll**: Smooth infinite scrolling for posts feed

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for file uploads
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Shadcn/ui components
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/maazajaz/socialens.git
cd socialens
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

4. Set up the database:
   - Follow the instructions in `SUPABASE_SETUP.md` to set up your Supabase database schema
   - Run the SQL files in order to create tables and policies

5. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── _auth/                  # Authentication related components
├── _root/                  # Main app layout and pages
├── components/             # Reusable UI components
│   ├── forms/             # Form components
│   ├── shared/            # Shared components
│   └── ui/                # Base UI components (shadcn/ui)
├── constants/             # App constants
├── context/               # React Context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── supabase/          # Supabase client and API functions
│   ├── utils/             # General utilities
│   └── validation/        # Form validation schemas
└── types/                 # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Official Website

Visit the live application: **[https://socialens.in](https://socialens.in)**

## Author

**Maaz Ajaz**
- Portfolio: [https://maazajaz.com](https://maazajaz.com)
- GitHub: [@maazajaz](https://github.com/maazajaz)
- Another exciting project: [Trimizy](https://github.com/maazajaz/trimizy)

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework used
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) - UI component library
