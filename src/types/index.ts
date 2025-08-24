export type IContextType = {
  user: IUser;
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<IUser>>;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  checkAuthUser: () => Promise<boolean>;
};

export type INavLink = {
  imgURL: string;
  route: string;
  label: string;
};

export type IUpdateUser = {
  userId: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  imageUrl?: string;
  file: File[];
  privacy_setting?: 'public' | 'private' | 'followers_only';
};

export type INewPost = {
  userId: string;
  caption: string;
  file: File[];
  location?: string;
  tags?: string;
  category: 'general' | 'announcement' | 'question';
};

export type IUpdatePost = {
  postId: string;
  caption: string;
  imageUrl?: string;
  file: File[];
  location?: string;
  tags?: string;
  category?: 'general' | 'announcement' | 'question';
};

export type IUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  imageUrl: string;
  bio: string;
  privacy_setting?: 'public' | 'private' | 'followers_only';
};

export type INewUser = {
  name: string;
  email: string;
  username: string;
  password: string;
};

export type INewComment = {
  content: string;
  postId: string;
  parentId?: string;
};

export type IComment = {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  post_id: string;
  parent_id: string | null;
  is_edited: boolean;
  user: IUser;
  likes: Array<{ user_id: string }>;
  replies?: IComment[];
  _count?: {
    likes: number;
    replies: number;
  };
};

export type DocumentList = {
  documents: {
    $id: string; // Cursor or identifier
    [key: string]: any; // Additional fields for each document
  }[];
  total?: number; // Optional: total number of documents
};