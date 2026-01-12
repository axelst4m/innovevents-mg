CREATE TABLE IF NOT EXISTS prospects (
  id BIGSERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  firstname VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  location VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_date DATE NOT NULL,
  participants INTEGER NOT NULL CHECK (participants > 0),
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'a_contacter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(email);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_event_date ON prospects(event_date);