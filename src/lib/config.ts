// Configuration for different environments
export const config = {
  development: {
    appUrl: 'http://localhost:3000',
  },
  preview: {
    appUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
  },
  production: {
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://socialens.in',
  },
}

export const getAppUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return config.development.appUrl
  }
  
  if (process.env.VERCEL_ENV === 'preview') {
    return config.preview.appUrl
  }
  
  return config.production.appUrl
}
