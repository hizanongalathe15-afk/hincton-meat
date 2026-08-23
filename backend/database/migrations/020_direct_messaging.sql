-- Direct messaging (user-to-user DMs)
-- Created: 2026-08-23

CREATE TABLE IF NOT EXISTS direct_conversations (
    id TEXT PRIMARY KEY,
    userAId TEXT NOT NULL,
    userBId TEXT NOT NULL,
    lastMessageAt DATETIME,
    userALastReadAt DATETIME,
    userBLastReadAt DATETIME,
    userAHiddenAt DATETIME,
    userBHiddenAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userAId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (userBId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (userAId, userBId)
);

CREATE INDEX IF NOT EXISTS idx_direct_conversations_user_a ON direct_conversations(userAId);
CREATE INDEX IF NOT EXISTS idx_direct_conversations_user_b ON direct_conversations(userBId);
CREATE INDEX IF NOT EXISTS idx_direct_conversations_last_message ON direct_conversations(lastMessageAt DESC);

CREATE TABLE IF NOT EXISTS direct_messages (
    id TEXT PRIMARY KEY,
    conversationId TEXT NOT NULL,
    senderId TEXT NOT NULL,
    text TEXT NOT NULL,
    replyToId TEXT,
    editedAt DATETIME,
    deletedAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversationId) REFERENCES direct_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(conversationId, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(senderId);
