export enum QUERY_KEYS {
    // AUTH KEYS
    CREATE_USER_ACCOUNT = "createUserAccount",
  
    // USER KEYS
    GET_CURRENT_USER = "getCurrentUser",
    GET_USERS = "getUsers",
    SEARCH_USERS = "searchUsers",
    GET_USER_BY_ID = "getUserById",
  
  // POST KEYS
  GET_POSTS = "getPosts",
  GET_INFINITE_POSTS = "getInfinitePosts",
  GET_RECENT_POSTS = "getRecentPosts",
  GET_FOLLOWING_FEED = "getFollowingFeed",
  GET_POST_BY_ID = "getPostById",
  GET_USER_POSTS = "getUserPosts",
  GET_FILE_PREVIEW = "getFilePreview",
  GET_SAVED_POSTS = "getSavedPosts",
  GET_LIKED_POSTS = "getLikedPosts",    //  SEARCH KEYS
    SEARCH_POSTS = "getSearchPosts",
    
    // FOLLOW KEYS
    GET_FOLLOWERS_COUNT = "getFollowersCount",
    GET_FOLLOWING_COUNT = "getFollowingCount",
    IS_FOLLOWING = "isFollowing",
    GET_FOLLOWERS = "getFollowers",
    GET_FOLLOWING = "getFollowing",
    
  // ADMIN KEYS
  GET_ADMIN_STATS = "getAdminStats",
  CHECK_ADMIN_ACCESS = "checkAdminAccess",
  GET_ADMIN_USERS = "getAdminUsers",
  GET_ADMIN_ALL_USERS = "getAdminAllUsers",
  GET_ADMIN_USER_DETAILS = "getAdminUserDetails",
  GET_ADMIN_ALL_POSTS = "getAdminAllPosts",
  
  // NOTIFICATION KEYS
  GET_NOTIFICATIONS = "getNotifications",
  GET_UNREAD_COUNT = "getUnreadCount",
  
  // COMMENT KEYS
  GET_COMMENTS = "getComments",
}  