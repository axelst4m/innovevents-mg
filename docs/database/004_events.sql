-- ============================================
-- Table events : gestion des evenements
-- ============================================

-- Types d'evenements possibles
CREATE TYPE event_type AS ENUM (
  'seminaire',
  'conference',
  'soiree_entreprise',
  'team_building',
  'inauguration',
  'autre'
);

-- Statuts possibles d'un evenement
CREATE TYPE event_status AS ENUM (
  'brouillon',
  'en_attente',
  'accepte',
  'en_cours',
  'termine',
  'annule'
);

-- Table principale des evenements
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,

  -- Infos generales
  name VARCHAR(255) NOT NULL,
  description TEXT,
  event_type event_type NOT NULL DEFAULT 'autre',
  theme VARCHAR(100),

  -- Dates et lieu
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location VARCHAR(255) NOT NULL,

  -- Participants
  participants_count INTEGER,

  -- Image de l'evenement
  image_url TEXT,

  -- Statut et visibilite
  status event_status NOT NULL DEFAULT 'brouillon',
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  client_approved_public BOOLEAN NOT NULL DEFAULT FALSE,

  -- Lien avec le client
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,

  -- Metadonnees
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Index pour les recherches frequentes
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_client ON events(client_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_is_public ON events(is_public);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

-- ============================================
-- Table prestations : services lies a un evenement
-- ============================================

CREATE TABLE IF NOT EXISTS prestations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  amount_ht DECIMAL(10, 2) NOT NULL,
  tva_rate DECIMAL(4, 2) NOT NULL DEFAULT 20.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prestations_event ON prestations(event_id);

-- ============================================
-- Table notes : notes collaboratives sur les evenements
-- ============================================

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_global BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_event ON notes(event_id);
CREATE INDEX IF NOT EXISTS idx_notes_global ON notes(is_global);

-- ============================================
-- Table taches : suivi des taches par evenement
-- ============================================

CREATE TYPE task_status AS ENUM ('a_faire', 'en_cours', 'termine');

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'a_faire',
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_event ON tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
