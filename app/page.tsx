'use client';

import { useEffect, useState } from 'react';
import App from '../src/App';
import { BrowserRouter } from 'react-router-dom';

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Loading...</div>;
  }

  // Redirect all traffic to the React Router app
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
