-- Migration 001: Create core tables

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Personas
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  model_card JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  caption TEXT,
  is_published BOOLEAN DEFAULT false,
  provenance JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP
);

-- Media
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  media_type VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job Status
CREATE TABLE IF NOT EXISTS job_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'queued',
  persona_id UUID REFERENCES personas(id),
  prompt TEXT,
  output_url TEXT,
  error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(30),
  resource_id UUID,
  user_id UUID REFERENCES users(id),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_posts_persona ON posts(persona_id);
CREATE INDEX idx_posts_published ON posts(is_published, published_at DESC);
CREATE INDEX idx_media_post ON media(post_id);
CREATE INDEX idx_job_status_job ON job_status(job_id);
CREATE INDEX idx_job_status_status ON job_status(status);
CREATE INDEX idx_audit_action ON audit_logs(action);
