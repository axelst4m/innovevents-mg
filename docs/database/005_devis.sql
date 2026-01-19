-- ============================================
-- Table devis : gestion des devis clients
-- ============================================

-- Statuts possibles d'un devis
CREATE TYPE devis_status AS ENUM (
  'brouillon',
  'envoye',
  'en_etude',
  'modification',
  'accepte',
  'refuse'
);

-- Table principale des devis
CREATE TABLE IF NOT EXISTS devis (
  id SERIAL PRIMARY KEY,

  -- Reference unique du devis (ex: DEV-2024-0001)
  reference VARCHAR(50) NOT NULL UNIQUE,

  -- Lien avec client et evenement
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,

  -- Statut du devis
  status devis_status NOT NULL DEFAULT 'brouillon',

  -- Montants (calcules a partir des lignes)
  total_ht DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_tva DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_ttc DECIMAL(12, 2) NOT NULL DEFAULT 0,

  -- Validite du devis
  valid_until DATE,

  -- Message personnalise sur le devis
  custom_message TEXT,

  -- Motif de modification (si demande par le client)
  modification_reason TEXT,

  -- Dates importantes
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  refused_at TIMESTAMPTZ,

  -- Metadonnees
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Index pour recherches frequentes
CREATE INDEX IF NOT EXISTS idx_devis_client ON devis(client_id);
CREATE INDEX IF NOT EXISTS idx_devis_event ON devis(event_id);
CREATE INDEX IF NOT EXISTS idx_devis_status ON devis(status);
CREATE INDEX IF NOT EXISTS idx_devis_reference ON devis(reference);

-- ============================================
-- Table lignes_devis : lignes de prestation d'un devis
-- ============================================

CREATE TABLE IF NOT EXISTS lignes_devis (
  id SERIAL PRIMARY KEY,
  devis_id INTEGER NOT NULL REFERENCES devis(id) ON DELETE CASCADE,

  -- Description de la prestation
  label VARCHAR(255) NOT NULL,
  description TEXT,

  -- Quantite et prix
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_ht DECIMAL(10, 2) NOT NULL,
  tva_rate DECIMAL(4, 2) NOT NULL DEFAULT 20.00,

  -- Montants calcules
  total_ht DECIMAL(10, 2) NOT NULL,
  total_tva DECIMAL(10, 2) NOT NULL,
  total_ttc DECIMAL(10, 2) NOT NULL,

  -- Ordre d'affichage
  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lignes_devis ON lignes_devis(devis_id);

-- ============================================
-- Fonction pour generer la reference du devis
-- Format: DEV-ANNEE-NUMERO (ex: DEV-2024-0001)
-- ============================================

CREATE OR REPLACE FUNCTION generate_devis_reference()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_ref TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');

  -- Trouver le prochain numero pour cette annee
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(reference FROM 10 FOR 4) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM devis
  WHERE reference LIKE 'DEV-' || year_part || '-%';

  new_ref := 'DEV-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  NEW.reference := new_ref;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour generer automatiquement la reference
DROP TRIGGER IF EXISTS trigger_generate_devis_reference ON devis;
CREATE TRIGGER trigger_generate_devis_reference
  BEFORE INSERT ON devis
  FOR EACH ROW
  WHEN (NEW.reference IS NULL OR NEW.reference = '')
  EXECUTE FUNCTION generate_devis_reference();

-- ============================================
-- Fonction pour recalculer les totaux du devis
-- ============================================

CREATE OR REPLACE FUNCTION update_devis_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE devis
  SET
    total_ht = COALESCE((SELECT SUM(total_ht) FROM lignes_devis WHERE devis_id = COALESCE(NEW.devis_id, OLD.devis_id)), 0),
    total_tva = COALESCE((SELECT SUM(total_tva) FROM lignes_devis WHERE devis_id = COALESCE(NEW.devis_id, OLD.devis_id)), 0),
    total_ttc = COALESCE((SELECT SUM(total_ttc) FROM lignes_devis WHERE devis_id = COALESCE(NEW.devis_id, OLD.devis_id)), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.devis_id, OLD.devis_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre a jour les totaux automatiquement
DROP TRIGGER IF EXISTS trigger_update_devis_totals_insert ON lignes_devis;
CREATE TRIGGER trigger_update_devis_totals_insert
  AFTER INSERT ON lignes_devis
  FOR EACH ROW
  EXECUTE FUNCTION update_devis_totals();

DROP TRIGGER IF EXISTS trigger_update_devis_totals_update ON lignes_devis;
CREATE TRIGGER trigger_update_devis_totals_update
  AFTER UPDATE ON lignes_devis
  FOR EACH ROW
  EXECUTE FUNCTION update_devis_totals();

DROP TRIGGER IF EXISTS trigger_update_devis_totals_delete ON lignes_devis;
CREATE TRIGGER trigger_update_devis_totals_delete
  AFTER DELETE ON lignes_devis
  FOR EACH ROW
  EXECUTE FUNCTION update_devis_totals();

-- ============================================
-- Lien entre users et clients pour l'espace client
-- (deja fait dans 003_users.sql normalement)
-- ============================================
-- ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
