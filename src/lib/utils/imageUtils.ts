export const addCacheBuster = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return "/assets/icons/profile-placeholder.svg";
  
  // If it's already a placeholder, return as is
  if (imageUrl.includes("/assets/icons/profile-placeholder.svg")) {
    return imageUrl;
  }
  
  // Add cache buster parameter to force refresh
  const separator = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${separator}t=${Date.now()}`;
};

export const getProfileImageUrl = (user: any): string => {
  return user?.image_url || "/assets/icons/profile-placeholder.svg";
};
