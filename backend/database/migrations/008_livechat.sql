-- Live chat and support tables
-- Created: 2024-01-08

-- Chat conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    adminId TEXT,
    subject TEXT,
    status TEXT DEFAULT 'OPEN', -- 'OPEN', 'CLOSED', 'ARCHIVED'
    priority TEXT DEFAULT 'NORMAL', -- 'LOW', 'NORMAL', 'HIGH', 'URGENT'
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (adminId) REFERENCES users(id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    conversationId TEXT NOT NULL,
    senderId TEXT NOT NULL,
    receiverId TEXT,
    message TEXT NOT NULL,
    messageType TEXT DEFAULT 'TEXT', -- 'TEXT', 'IMAGE', 'FILE'
    fileUrl TEXT,
    isRead BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversationId) REFERENCES chat_conversations(id),
    FOREIGN KEY (senderId) REFERENCES users(id),
    FOREIGN KEY (receiverId) REFERENCES users(id)
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT, -- 'ORDER', 'PRODUCT', 'DELIVERY', 'ACCOUNT', 'TECHNICAL'
    priority TEXT DEFAULT 'NORMAL',
    status TEXT DEFAULT 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
    assignedTo TEXT,
    resolution TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (assignedTo) REFERENCES users(id)
);

-- Ticket responses table
CREATE TABLE IF NOT EXISTS ticket_responses (
    id TEXT PRIMARY KEY,
    ticketId TEXT NOT NULL,
    responderId TEXT NOT NULL,
    response TEXT NOT NULL,
    isInternal BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticketId) REFERENCES support_tickets(id),
    FOREIGN KEY (responderId) REFERENCES users(id)
);
