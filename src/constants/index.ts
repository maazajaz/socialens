export const sidebarLinks = [
    {
      imgURL: "/assets/icons/home.svg",
      route: "/",
      label: "Home",
    },
    {
      imgURL: "/assets/icons/wallpaper.svg",
      route: "/explore",
      label: "Explore",
    },
    {
      imgURL: "/assets/icons/reels.svg",
      route: "/reels",
      label: "Reels",
    },
    {
      imgURL: "/assets/icons/people.svg",
      route: "/all-users",
      label: "People",
    },
    {
      imgURL: "/assets/icons/bookmark.svg",
      route: "/saved",
      label: "Saved",
    },
    {
      imgURL: "/assets/icons/gallery-add.svg",
      route: "/create-post",
      label: "Create Post",
    },
    {
      imgURL: "/assets/icons/reels.svg",
      route: "/create-reel",
      label: "Create Reel",
    },
    {
      imgURL: "/assets/icons/filter.svg",
      route: "/admin",
      label: "Admin",
    },
  ];
  
  export const INITIAL_USER = {
    id: "",
    name: "",
    username: "",
    email: "",
    bio: null,
    image_url: null,
    created_at: "",
    is_admin: null,
    is_active: null,
    is_deactivated: null,
    last_active: null,
    privacy_setting: "public" as const,
  };

  export const PRIVACY_SETTINGS = [
    { value: "public", label: "Public", description: "Anyone can see your posts", icon: "🌍" },
    { value: "private", label: "Private", description: "Only you can see your posts", icon: "🔒" },
    { value: "followers_only", label: "Followers Only", description: "Only your followers can see your posts", icon: "👥" }
  ] as const;

  export const POST_CATEGORIES = [
    { value: "general", label: "General", icon: "💬", color: "bg-blue-500" },
    { value: "announcement", label: "Announcement", icon: "📢", color: "bg-orange-500" },
    { value: "question", label: "Question", icon: "❓", color: "bg-green-500" }
  ] as const;

  export const bottombarLinks = [
    {
      imgURL: "/assets/icons/home.svg",
      route: "/",
      label: "Home",
    },
    {
      imgURL: "/assets/icons/wallpaper.svg",
      route: "/explore",
      label: "Explore",
    },
    {
      imgURL: "/assets/icons/reels.svg",
      route: "/reels",
      label: "Reels",
    },
    {
      imgURL: "/assets/icons/gallery-add.svg",
      route: "/create-post",
      label: "Create",
    },
    {
      imgURL: "/assets/icons/reels.svg",
      route: "/create-reel",
      label: "Reel",
    },
    {
      imgURL: "/assets/icons/bookmark.svg",
      route: "/saved",
      label: "Saved",
    },
  ];
  