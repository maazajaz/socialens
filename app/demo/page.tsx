import React from "react";
import { GoToSignInButton } from "./GoToSignInButton";

// Define a type for our user data for better type safety
type User = {
  id: number;
  name: string;
  email: string;
};

// This is now a Server Component
export default async function DemoPage() {
  // 1. Fetch data directly on the server
  const res = await fetch('https://jsonplaceholder.typicode.com/users');
  const users: User[] = await res.json();

  return (
    <div>
      <h1>Users List (from Server)</h1>
      {/* 2. Render the client component for interactivity */}
      <GoToSignInButton />

      {/* 3. Render the data fetched on the server */}
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name} - {user.email}</li>
        ))}
      </ul>
    </div>
  );
}
