-- VedAI PostgreSQL Production Schema

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    password_salt VARCHAR(128) NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    preferences JSONB DEFAULT '{"cameraAnalysis": false}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS emotion_history (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_text TEXT NOT NULL,
    emotion VARCHAR(50) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    probabilities JSONB NOT NULL,
    guidance JSONB,
    recommendations JSONB,
    safety JSONB,
    modality VARCHAR(30) DEFAULT 'text',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emotion_history_user_created ON emotion_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emotion_history_emotion ON emotion_history(emotion);

CREATE TABLE IF NOT EXISTS journal_entries (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    emotion VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_updated ON journal_entries(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS gita_verses (
    id SERIAL PRIMARY KEY,
    chapter INT NOT NULL,
    verse_number INT NOT NULL,
    sanskrit TEXT NOT NULL,
    transliteration TEXT,
    meaning TEXT NOT NULL,
    explanation TEXT NOT NULL,
    practical_guidance TEXT,
    primary_emotion VARCHAR(50) NOT NULL,
    emotion_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    topic_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    source VARCHAR(255) DEFAULT 'Bhagavad Gita As It Is',
    embedding JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_gita_chapter_verse UNIQUE(chapter, verse_number)
);

CREATE INDEX IF NOT EXISTS idx_gita_emotion ON gita_verses(primary_emotion);
CREATE INDEX IF NOT EXISTS idx_gita_chapter_verse ON gita_verses(chapter, verse_number);

CREATE TABLE IF NOT EXISTS chat_conversations (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Reflection Session',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    emotion_context JSONB,
    grounded_verses JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id, created_at ASC);
