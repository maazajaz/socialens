'use client'

// Override console warnings to suppress Supabase auth session missing warnings in public mode
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    // Suppress specific Supabase auth warnings when users are browsing publicly
    if (
      message.includes('Auth session missing') ||
      message.includes('AuthSessionMissingError') ||
      message.includes('session_missing')
    ) {
      // Don't log these warnings - they're expected for public users
      return;
    }
    // Log all other warnings normally
    originalWarn.apply(console, args);
  };
}

export {};
