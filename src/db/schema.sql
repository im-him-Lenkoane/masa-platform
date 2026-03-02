-- ================================================
-- M@SA PLATFORM - COMPLETE DATABASE SCHEMA
-- src/db/schema.sql
-- Run with: psql -U masa_user -d masa_db -f schema.sql
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ADMIN USERS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  role          VARCHAR(50) NOT NULL DEFAULT 'content_developer'
                CHECK (role IN ('super_admin', 'admin', 'content_developer')),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login    TIMESTAMP WITH TIME ZONE
);

-- ── SITE SETTINGS ────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  key           VARCHAR(100) PRIMARY KEY,
  value         TEXT,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by    UUID REFERENCES users(id)
);

-- ── GRADES (10, 11, 12) ──────────────────────────
CREATE TABLE IF NOT EXISTS grades (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(10) NOT NULL,   -- e.g. '10', '11', '12'
  display_name  VARCHAR(50) NOT NULL,   -- e.g. 'Grade 10'
  description   TEXT,
  sort_order    INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT true
);

-- ── FACULTIES (Tertiary) ─────────────────────────
CREATE TABLE IF NOT EXISTS faculties (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  slug          VARCHAR(255) UNIQUE NOT NULL,
  icon          VARCHAR(10),            -- emoji
  description   TEXT,
  sort_order    INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT true
);

-- ── SUBJECTS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  slug          VARCHAR(255) NOT NULL,
  icon          VARCHAR(10),
  description   TEXT,
  path_type     VARCHAR(20) NOT NULL CHECK (path_type IN ('school', 'tertiary')),
  grade_id      INT REFERENCES grades(id) ON DELETE SET NULL,
  ai_context    TEXT,                   -- extra context fed to AI chatbot
  caps_aligned  BOOLEAN DEFAULT true,
  sort_order    INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(slug, grade_id)
);

-- ── FACULTY <-> SUBJECT (many-to-many for tertiary) ──
CREATE TABLE IF NOT EXISTS faculty_subjects (
  faculty_id    INT REFERENCES faculties(id) ON DELETE CASCADE,
  subject_id    UUID REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (faculty_id, subject_id)
);

-- ── TOPICS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS topics (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id    UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title         VARCHAR(500) NOT NULL,
  description   TEXT,
  sort_order    INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── RESOURCES (videos, PDFs, notes, slides etc.) ─
CREATE TABLE IF NOT EXISTS resources (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id      UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  type          VARCHAR(50) NOT NULL
                CHECK (type IN ('video','pdf','notes','slides','image','practice_questions','exam_prep')),
  title         VARCHAR(500) NOT NULL,
  description   TEXT,
  -- For videos: YouTube URL
  youtube_url   TEXT,
  youtube_id    VARCHAR(20),            -- extracted video ID
  transcript    TEXT,                   -- video transcript
  -- For files: stored path or S3 key
  file_path     TEXT,
  file_size_kb  INT,
  -- For text/notes: inline content
  content       TEXT,
  sort_order    INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  uploaded_by   UUID REFERENCES users(id),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── COMMENTS (on videos/resources) ───────────────
CREATE TABLE IF NOT EXISTS comments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id   UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  author_name   VARCHAR(100) DEFAULT 'Anonymous',
  content       TEXT NOT NULL,
  ip_address    INET,
  is_blocked    BOOLEAN DEFAULT false,
  is_deleted    BOOLEAN DEFAULT false,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── BLOCKED IPs ───────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_ips (
  id            SERIAL PRIMARY KEY,
  ip_address    INET NOT NULL UNIQUE,
  reason        TEXT,
  blocked_by    UUID REFERENCES users(id),
  blocked_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── QUIZZES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS quizzes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id      UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title         VARCHAR(500) NOT NULL,
  description   TEXT,
  time_limit_minutes INT,
  pass_mark_percent  INT DEFAULT 50,
  is_active     BOOLEAN DEFAULT true,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── QUIZ QUESTIONS ────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_questions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id       UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  type          VARCHAR(30) NOT NULL
                CHECK (type IN ('multiple_choice', 'true_false', 'matching')),
  question_text TEXT NOT NULL,
  image_url     TEXT,                  -- optional diagram with question
  sort_order    INT DEFAULT 0
);

-- ── QUIZ ANSWERS / OPTIONS ────────────────────────
CREATE TABLE IF NOT EXISTS quiz_options (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id   UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text   TEXT NOT NULL,
  is_correct    BOOLEAN DEFAULT false,
  match_pair    VARCHAR(255),          -- for matching questions: the pair value
  sort_order    INT DEFAULT 0
);

-- ── EVENTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(500) NOT NULL,
  description   TEXT,
  event_date    TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date      TIMESTAMP WITH TIME ZONE,
  location      VARCHAR(500),
  event_type    VARCHAR(50) DEFAULT 'in-person'
                CHECK (event_type IN ('in-person', 'online', 'hybrid')),
  is_featured   BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── SPONSORS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS sponsors (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  logo_path     TEXT,                  -- uploaded logo file path or S3 key
  website_url   TEXT,                  -- external link
  tier          VARCHAR(50) DEFAULT 'standard'
                CHECK (tier IN ('platinum', 'gold', 'silver', 'standard')),
  sort_order    INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── PROGRAMS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS programs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(500) NOT NULL,
  description   TEXT,
  icon          VARCHAR(10),
  status        VARCHAR(30) DEFAULT 'ongoing'
                CHECK (status IN ('ongoing', 'completed', 'upcoming')),
  start_date    DATE,
  end_date      DATE,
  is_featured   BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── PUBLICATIONS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS publications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(500) NOT NULL,
  description   TEXT,
  pub_type      VARCHAR(50) DEFAULT 'report'
                CHECK (pub_type IN ('report', 'newsletter', 'research', 'guide', 'other')),
  file_path     TEXT,
  external_url  TEXT,
  published_date DATE,
  is_active     BOOLEAN DEFAULT true,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── INDEXES for performance ───────────────────────
CREATE INDEX IF NOT EXISTS idx_subjects_grade    ON subjects(grade_id);
CREATE INDEX IF NOT EXISTS idx_subjects_path     ON subjects(path_type);
CREATE INDEX IF NOT EXISTS idx_topics_subject    ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_resources_topic   ON resources(topic_id);
CREATE INDEX IF NOT EXISTS idx_resources_type    ON resources(type);
CREATE INDEX IF NOT EXISTS idx_comments_resource ON comments(resource_id);
CREATE INDEX IF NOT EXISTS idx_comments_ip       ON comments(ip_address);
CREATE INDEX IF NOT EXISTS idx_quiz_q_quiz       ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_o_question   ON quiz_options(question_id);
CREATE INDEX IF NOT EXISTS idx_events_date       ON events(event_date);

-- ── Updated_at trigger function ───────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON DATABASE masa_db IS 'Messelaar @ STEM Academy NPC - Educational Platform Database';

-- ── EMAIL TABLES ──────────────────────────────────

CREATE TABLE IF NOT EXISTS contact_submissions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  subject    VARCHAR(255),
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      VARCHAR(255) UNIQUE NOT NULL,
  name       VARCHAR(255),
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_sends (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject          VARCHAR(255) NOT NULL,
  body             TEXT NOT NULL,
  recipient_count  INTEGER DEFAULT 0,
  sent_by          UUID REFERENCES users(id),
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_created ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(is_active);

-- ── SESSIONS TABLES ───────────────────────────────

CREATE TABLE IF NOT EXISTS sessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id          UUID REFERENCES events(id) ON DELETE SET NULL,
  title             VARCHAR(500) NOT NULL,
  description       TEXT,
  session_type      VARCHAR(30) DEFAULT 'online'
                    CHECK (session_type IN ('online', 'in-person', 'hybrid')),
  access_type       VARCHAR(30) DEFAULT 'free_open'
                    CHECK (access_type IN ('free_open', 'free_locked', 'paid')),
  is_locked         BOOLEAN DEFAULT false,
  password_hash     TEXT,                        -- for free_locked sessions
  scheduled_start   TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end     TIMESTAMP WITH TIME ZONE,
  actual_start      TIMESTAMP WITH TIME ZONE,
  actual_end        TIMESTAMP WITH TIME ZONE,
  max_participants  INTEGER DEFAULT 100,
  price_rands       NUMERIC(10,2) DEFAULT 0,
  bank_name         VARCHAR(100),
  bank_account_name VARCHAR(255),
  bank_account_no   VARCHAR(50),
  bank_branch_code  VARCHAR(20),
  bank_reference_prefix VARCHAR(50),
  jitsi_room_name   VARCHAR(255) UNIQUE,          -- Jitsi room identifier
  status            VARCHAR(30) DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled','live','ended','cancelled')),
  subject_id        UUID REFERENCES subjects(id) ON DELETE SET NULL,
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_participants (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id        UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  full_name         VARCHAR(255) NOT NULL,
  id_number         VARCHAR(20) NOT NULL,         -- SA ID number
  email             VARCHAR(255),
  class_id          VARCHAR(14) NOT NULL UNIQUE,  -- generated 14-char access ID
  payment_status    VARCHAR(30) DEFAULT 'pending'
                    CHECK (payment_status IN ('pending','verified','rejected','free')),
  payment_reference VARCHAR(255),
  registered_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admitted_at       TIMESTAMP WITH TIME ZONE,     -- when they actually joined
  -- personal info cleared after session
  info_cleared      BOOLEAN DEFAULT false,
  info_cleared_at   TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS session_chat (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id   UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  sender_name  VARCHAR(255) NOT NULL,
  message      TEXT NOT NULL,
  is_admin     BOOLEAN DEFAULT false,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_status       ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_start        ON sessions(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_sessions_event        ON sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_session  ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_participants_class_id ON session_participants(class_id);
CREATE INDEX IF NOT EXISTS idx_chat_session          ON session_chat(session_id);
