-- ============================================
-- Table users : gestion des comptes utilisateurs
-- Roles possibles : admin, employe, client
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  firstname VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'employe', 'client')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour recherche rapide par email (connexion)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Lien entre users et clients (un client peut avoir un compte user)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- Compte admin par defaut (Chloe)
-- Mot de passe : Admin123! (a changer en prod)
-- Le hash correspond a bcrypt avec 10 rounds
-- ============================================
-- Note : ce hash sera genere au demarrage de l'app si l'admin n'existe pas
