import { Client, Account, Databases, Storage, Avatars } from "appwrite";

export const appwriteConfig = {
  url: process.env.NEXT_PUBLIC_APPWRITE_URL || "",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "",
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "",
  storageId: process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID || "",
  userCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID || "",
  postCollectionId: process.env.NEXT_PUBLIC_APPWRITE_POST_COLLECTION_ID || "",
  savesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_SAVES_COLLECTION_ID || "",
};

export const client = new Client();

client.setEndpoint(appwriteConfig.url);
client.setProject(appwriteConfig.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);
