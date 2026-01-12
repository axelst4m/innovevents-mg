-- Table clients
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lien prospect -> client 
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;