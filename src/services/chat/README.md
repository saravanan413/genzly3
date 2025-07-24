
# Firebase Chat System - Persistent Chat List

## Firestore Structure

### 1. Chat Documents (for persistent chat list)
**Path**: `/chats/{chatId}`

```js
// Example chatId: "user1_user2" (sorted alphabetically)
{
  users: ["user1_uid", "user2_uid"], // Array for array-contains queries
  lastMessage: {
    text: "Hello there!",
    timestamp: serverTimestamp(),
    senderId: "user1_uid",
    seen: false
  },
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

### 2. Message Documents (actual messages)
**Path**: `/chats/{chatId}/messages/{messageId}`

```js
{
  text: "Hello there!",
  senderId: "user1_uid",
  receiverId: "user2_uid",
  timestamp: serverTimestamp(),
  seen: false,
  status: "sent", // "sent" | "delivered" | "seen"
  type: "text", // "text" | "voice" | "image" | "video"
  mediaURL: null // or URL string for media messages
}
```

## Key Features

1. **Persistence**: Chat documents in `/chats` collection persist across sessions
2. **Real-time**: Uses Firestore real-time listeners for live updates
3. **Security**: Firestore rules ensure only chat participants can access data
4. **Performance**: Optimized queries with proper indexing
5. **Atomicity**: Uses batched writes to ensure data consistency

## Queries Used

### Get Chat List for User
```js
query(
  collection(db, "chats"),
  where("users", "array-contains", currentUserId),
  orderBy("updatedAt", "desc"),
  limit(50)
)
```

### Get Messages for Chat
```js
query(
  collection(db, "chats", chatId, "messages"),
  orderBy("timestamp", "asc"),
  limit(100)
)
```

## Required Firestore Indexes

1. **chats collection**:
   - users (array), updatedAt (desc)

2. **messages subcollection**:
   - timestamp (asc)
   - receiverId (asc), seen (asc) - for marking messages as seen

These indexes are automatically created when you run the queries for the first time.
