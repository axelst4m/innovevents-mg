-- ============================================================================
-- Innov'Events - Fichier de seed de base de données
-- Données de démonstration pour le projet Innov'Events
-- Tous les mots de passe sont hachés avec bcrypt (10 rounds)
-- Hash utilisé: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- Correspond au mot de passe: Password123!
-- ============================================================================

BEGIN;

-- Désactiver les triggers temporairement pour éviter les conflits
SET session_replication_role = 'replica';

-- ============================================================================
-- SUPPRESSION DES DONNÉES EXISTANTES
-- ============================================================================

TRUNCATE TABLE lignes_devis CASCADE;
TRUNCATE TABLE devis CASCADE;
TRUNCATE TABLE reviews CASCADE;
TRUNCATE TABLE contact_messages CASCADE;
TRUNCATE TABLE event_tasks CASCADE;
TRUNCATE TABLE event_notes CASCADE;
TRUNCATE TABLE prestations CASCADE;
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE prospects CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE users CASCADE;

-- Réactiver les triggers
SET session_replication_role = 'origin';

-- ============================================================================
-- 1. CRÉATION DES UTILISATEURS (6 total)
-- ============================================================================

INSERT INTO users (email, password_hash, firstname, lastname, role, is_active, must_change_password, created_at, updated_at) VALUES
-- Admin
('chloe.durand@innovevents.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Chloé', 'Durand', 'admin', TRUE, FALSE, NOW(), NOW()),

-- Employés
('maxime.leroy@innovevents.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Maxime', 'Leroy', 'employe', TRUE, FALSE, NOW(), NOW()),
('sarah.benali@innovevents.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Sarah', 'Benali', 'employe', TRUE, TRUE, NOW(), NOW()),

-- Clients
('yvan.martin@techcorp.fr', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Yvan', 'Martin', 'client', TRUE, FALSE, NOW(), NOW()),
('julie.moreau@greenstart.fr', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Julie', 'Moreau', 'client', TRUE, FALSE, NOW(), NOW()),
('thomas.petit@mediasud.fr', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Thomas', 'Petit', 'client', TRUE, FALSE, NOW(), NOW());

-- ============================================================================
-- 2. CRÉATION DES CLIENTS (3 total)
-- ============================================================================

INSERT INTO clients (company_name, firstname, lastname, email, phone, location, user_id, is_active, created_at) VALUES
('TechCorp Solutions', 'Yvan', 'Martin', 'yvan.martin@techcorp.fr', '+33 1 42 68 53 00', 'Paris', 4, TRUE, NOW()),
('GreenStart SAS', 'Julie', 'Moreau', 'julie.moreau@greenstart.fr', '+33 4 72 15 82 90', 'Lyon', 5, TRUE, NOW()),
('MediaSud Agency', 'Thomas', 'Petit', 'thomas.petit@mediasud.fr', '+33 4 91 55 27 68', 'Marseille', 6, TRUE, NOW());

-- ============================================================================
-- 3. CRÉATION DES PROSPECTS (4 total - 2 convertis, 2 en cours)
-- ============================================================================

INSERT INTO prospects (company_name, firstname, lastname, email, phone, location, event_type, event_date, participants, message, status, client_id, converted_at, created_at) VALUES
-- Converti vers TechCorp
('TechCorp Solutions', 'Yvan', 'Martin', 'yvan.martin@techcorp.fr', '+33 1 42 68 53 00', 'Paris', 'seminaire', (NOW() + INTERVAL '45 days')::date, 150, 'Besoin d''un séminaire annuel pour notre équipe IT', 'qualifie', 1, NOW(), NOW() - INTERVAL '30 days'),

-- Converti vers GreenStart
('GreenStart SAS', 'Julie', 'Moreau', 'julie.moreau@greenstart.fr', '+33 4 72 15 82 90', 'Lyon', 'conference', (NOW() + INTERVAL '60 days')::date, 200, 'Conférence sur la durabilité et l''impact environnemental', 'qualifie', 2, NOW(), NOW() - INTERVAL '45 days'),

-- À contacter
('EcoLabs Innovants', 'Pierre', 'Rousseau', 'pierre.rousseau@ecolabs.fr', '+33 3 89 42 15 87', 'Strasbourg', 'team_building', (NOW() + INTERVAL '90 days')::date, 80, 'Recherche activités de team building originales pour 80 personnes', 'a_contacter', NULL, NULL, NOW() - INTERVAL '10 days'),

-- Contacté
('DigitalWave Consulting', 'Sandrine', 'Lemoine', 'sandrine.lemoine@digitalwave.fr', '+33 2 40 78 94 56', 'Nantes', 'soiree_entreprise', (NOW() + INTERVAL '75 days')::date, 120, 'Soirée de gala pour clôture d''année fiscale', 'contacte', NULL, NULL, NOW() - INTERVAL '5 days');

-- ============================================================================
-- 4. CRÉATION DES ÉVÉNEMENTS (5 total avec différents statuts)
-- ============================================================================

INSERT INTO events (name, description, event_type, theme, start_date, end_date, location, participants_count, image_url, status, is_public, client_approved_public, client_id, created_at, updated_at, created_by) VALUES
-- Séminaire Innovation Tech 2026 - Accepté, à venir
('Séminaire Innovation Tech 2026', 'Séminaire annuel de TechCorp Solutions dédié aux innovations en informatique et transformation numérique. Programme complet avec keynotes de leaders du secteur.', 'seminaire', 'Innovation & Numérique', NOW() + INTERVAL '45 days', NOW() + INTERVAL '47 days', 'Paris 8ème - Salle des Congrès', 150, 'https://images.unsplash.com/photo-1552664730-d307ca884978', 'accepte', TRUE, TRUE, 1, NOW() - INTERVAL '30 days', NOW(), 2),

-- Conférence RSE - Terminé, passé
('Conférence RSE & Développement Durable', 'Conférence majeure organisée par GreenStart SAS sur les enjeux de responsabilité sociale d''entreprise et développement durable.', 'conference', 'RSE & Environnement', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days', 'Lyon - Palais de la Bourse', 200, 'https://images.unsplash.com/photo-1540575467063-178f50002154', 'termine', TRUE, TRUE, 2, NOW() - INTERVAL '90 days', NOW() - INTERVAL '19 days', 2),

-- Soirée des vœux 2026 - En cours, imminente
('Soirée des Vœux 2026', 'Soirée exclusive de nouvelle année pour les clients et partenaires de TechCorp. Cocktail de prestige, divertissements live et networking.', 'soiree_entreprise', 'Réceptions d''Affaires', NOW() + INTERVAL '8 days', NOW() + INTERVAL '8 days', 'Paris 16ème - Château de Neuilly', 280, 'https://images.unsplash.com/photo-1519167758481-dc8986ba36c4', 'en_cours', TRUE, TRUE, 1, NOW() - INTERVAL '20 days', NOW(), 1),

-- Team Building Été 2026 - En attente
('Team Building Été 2026', 'Programme de team building complet pour renforcer la cohésion d''équipe avant l''été. Activités multiples: accrobranche, rallye, jeux collaboratifs.', 'team_building', 'Team Building', NOW() + INTERVAL '120 days', NOW() + INTERVAL '122 days', 'Fontainebleau - Parc Aventure & Resort', 85, 'https://images.unsplash.com/photo-1552664730-d307ca884978', 'en_attente', FALSE, FALSE, 3, NOW() - INTERVAL '15 days', NOW(), 3),

-- Inauguration Showroom - Brouillon, lointain
('Inauguration Showroom GreenStart', 'Inauguration officielle du nouveau showroom flagship de GreenStart SAS. Présentation des innovations produits, espace expo, conférences technologiques.', 'inauguration', 'Lancement Produit', NOW() + INTERVAL '180 days', NOW() + INTERVAL '180 days', 'Lyon - Parc Confluence', 250, 'https://images.unsplash.com/photo-1516321318423-f06f70a504f8', 'brouillon', FALSE, FALSE, 2, NOW(), NOW(), 2);

-- ============================================================================
-- 5. CRÉATION DES PRESTATIONS (21 réparties sur les événements)
-- ============================================================================

INSERT INTO prestations (event_id, label, amount_ht, tva_rate, created_at) VALUES
-- Event 1: Séminaire Innovation Tech (5 prestations)
(1, 'Location salle de séminaire - 2 jours', 2500.00, 0.20, NOW()),
(1, 'Traiteur - Petit-déjeuner, déjeuner, dîner (150 pax)', 4500.00, 0.20, NOW()),
(1, 'Équipements audiovisuels et streaming live', 1800.00, 0.20, NOW()),
(1, 'DJ et animations interactives', 1200.00, 0.20, NOW()),
(1, 'Décoration salle et signalétique', 800.00, 0.20, NOW()),

-- Event 2: Conférence RSE (4 prestations)
(2, 'Location auditorium - 1 jour', 1500.00, 0.20, NOW()),
(2, 'Traiteur - Buffet et cocktail (200 pax)', 3500.00, 0.20, NOW()),
(2, 'Système son et projection 4K', 1200.00, 0.20, NOW()),
(2, 'Photographie professionnelle et vidéo', 900.00, 0.20, NOW()),

-- Event 3: Soirée des Vœux (5 prestations)
(3, 'Location château avec stationnement', 3500.00, 0.20, NOW()),
(3, 'Traiteur gastronomique - Menu 5 services (280 pax)', 7500.00, 0.20, NOW()),
(3, 'DJ et piste de danse', 1500.00, 0.20, NOW()),
(3, 'Décoration sophistiquée avec fleurs', 2000.00, 0.20, NOW()),
(3, 'Photographe + vidéaste (8 heures)', 1200.00, 0.20, NOW()),

-- Event 4: Team Building (4 prestations)
(4, 'Location Parc Aventure - Accrobranche (85 pax)', 1700.00, 0.20, NOW()),
(4, 'Repas du midi - Barbecue & boissons', 2000.00, 0.20, NOW()),
(4, 'Animateur team building certifié (2 jours)', 1500.00, 0.20, NOW()),
(4, 'Assurance et matériel de sécurité', 600.00, 0.20, NOW()),

-- Event 5: Inauguration Showroom (3 prestations)
(5, 'Location showroom et aménagement', 5000.00, 0.20, NOW()),
(5, 'Traiteur premium - Réception standing (250 pax)', 6000.00, 0.20, NOW()),
(5, 'Technique son/lumière et scène pour conférences', 2500.00, 0.20, NOW());

-- ============================================================================
-- 6. CRÉATION DES NOTES D'ÉVÉNEMENTS
-- ============================================================================

INSERT INTO event_notes (event_id, user_id, content, is_private, created_at, updated_at) VALUES
-- Notes sur Event 1 (Séminaire)
(1, 2, 'Client a demandé une augmentation du budget traiteur suite à demandes spéciales (regime sans gluten pour 12 participants)', FALSE, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
(1, 1, 'À vérifier: confirmation du nombre exact de participants avant fin janvier. Budget actuel approuvé.', TRUE, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),

-- Notes sur Event 2 (Conférence)
(2, 2, 'Événement terminé avec succès. Client très satisfait. Rating 5/5 attendu.', FALSE, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),

-- Notes sur Event 3 (Soirée)
(3, 3, 'Client demande accent particulier sur la décoration de Noël. Devis complément en cours de préparation.', FALSE, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
(3, 2, 'URGENT: Confirmer avec le château la disponibilité de la salle VIP pour réunion clients 17h00', TRUE, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

-- Notes sur Event 4 (Team Building)
(4, 2, 'Devis sous review. Client demande options "indoor" en cas de mauvais temps.', FALSE, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days');

-- ============================================================================
-- 7. CRÉATION DES TÂCHES D'ÉVÉNEMENTS
-- ============================================================================

INSERT INTO event_tasks (event_id, assigned_to, created_by, title, description, priority, status, due_date, completed_at, created_at, updated_at) VALUES
-- Tasks Event 1 (Séminaire)
(1, 2, 1, 'Valider liste définitive des participants', 'Obtenir confirmation du nombre exact de participants et besoins spéciaux (régimes, accessibilité)', 'haute', 'en_cours', (NOW() + INTERVAL '40 days')::date, NULL, NOW() - INTERVAL '25 days', NOW()),
(1, 3, 1, 'Préparer contenu séminaire et supports', 'Coordonner avec les keynote speakers et préparer tous les supports powerpoint et handouts', 'haute', 'en_cours', (NOW() + INTERVAL '30 days')::date, NULL, NOW() - INTERVAL '20 days', NOW()),
(1, 2, 1, 'Organiser briefing équipe jour J', 'Réunion de préparation avec toute l''équipe 2 jours avant l''événement', 'moyenne', 'a_faire', (NOW() + INTERVAL '43 days')::date, NULL, NOW() - INTERVAL '15 days', NOW()),

-- Tasks Event 2 (Conférence - passée)
(2, 2, 1, 'Coordonner avec les intervenants keynotes', 'Valider les besoins techniques et horaires de présentation', 'haute', 'termine', (NOW() - INTERVAL '40 days')::date, NOW() - INTERVAL '35 days', NOW() - INTERVAL '60 days', NOW() - INTERVAL '35 days'),

-- Tasks Event 3 (Soirée)
(3, 3, 2, 'Commander fleurs et décorations', 'Valider thème Noël avec client et commander auprès des fournisseurs', 'haute', 'en_cours', (NOW() + INTERVAL '5 days')::date, NULL, NOW() - INTERVAL '10 days', NOW()),
(3, 2, 1, 'Confirmer présence des entertainers', 'DJ et musiciens - signature contrats', 'moyenne', 'termine', (NOW() + INTERVAL '3 days')::date, NOW() - INTERVAL '5 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days'),

-- Tasks Event 4 (Team Building)
(4, 3, 3, 'Préparer brief activités team building', 'Définir le programme détaillé et communiquer à l''équipe d''animation', 'moyenne', 'a_faire', (NOW() + INTERVAL '110 days')::date, NULL, NOW() - INTERVAL '12 days', NOW()),
(4, 2, 1, 'Valider assurances et responsabilités', 'Vérifier tous les contrats d''assurance et certificats de sécurité', 'haute', 'a_faire', (NOW() + INTERVAL '115 days')::date, NULL, NOW() - INTERVAL '10 days', NOW()),

-- Tasks Event 5 (Inauguration)
(5, 2, 2, 'Définir programme conférences inaugurales', 'Lister les intervenants et thèmes pour l''inauguration', 'moyenne', 'a_faire', (NOW() + INTERVAL '160 days')::date, NULL, NOW(), NOW());

-- ============================================================================
-- 8. CRÉATION DES DEVIS (4 total)
-- NOTE: Ne pas inclure le champ 'reference' - le trigger BD le génère automatiquement
-- Format généré par trigger: DEV-YYYY-XXXX
-- ============================================================================

INSERT INTO devis (client_id, event_id, status, total_ht, total_tva, total_ttc, valid_until, custom_message, modification_reason, sent_at, accepted_at, refused_at, created_at, updated_at, created_by) VALUES
-- Devis 1: Accepté (Séminaire Event 1)
(1, 1, 'accepte', 10800.00, 2160.00, 12960.00, (NOW() + INTERVAL '60 days')::date, 'Devis spécial entreprise avec services de support personnalisé inclus.', NULL, NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days', NULL, NOW() - INTERVAL '25 days', NOW(), 2),

-- Devis 2: Envoyé (Team Building Event 4)
(3, 4, 'envoye', 5800.00, 1160.00, 6960.00, (NOW() + INTERVAL '45 days')::date, 'Possibilité d''options supplémentaires: transport inclus, assurance annulation.', NULL, NOW() - INTERVAL '10 days', NULL, NULL, NOW() - INTERVAL '15 days', NOW(), 3),

-- Devis 3: Brouillon (Inauguration Event 5)
(2, 5, 'brouillon', 13500.00, 2700.00, 16200.00, (NOW() + INTERVAL '90 days')::date, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '5 days', NOW(), 2),

-- Devis 4: Refusé (Événement ancien)
(1, 2, 'refuse', 6100.00, 1220.00, 7320.00, (NOW() - INTERVAL '35 days')::date, 'Devis initial pour conférence Lyon - client a choisi autre prestataire.', 'Budget dépassé par client', NOW() - INTERVAL '45 days', NULL, NOW() - INTERVAL '25 days', NOW() - INTERVAL '50 days', NOW() - INTERVAL '25 days', 2);

-- ============================================================================
-- 9. CRÉATION DES LIGNES DE DEVIS
-- ============================================================================

-- Lignes Devis 1 (Accepté - Séminaire)
INSERT INTO lignes_devis (devis_id, label, description, quantity, unit_price_ht, tva_rate, total_ht, total_tva, total_ttc, sort_order, created_at) VALUES
(1, 'Location salle de séminaire', '2 jours complets avec aménagement flexible', 1, 2500.00, 0.20, 2500.00, 500.00, 3000.00, 1, NOW()),
(1, 'Traiteur premium', 'Petit-déjeuner, déjeuner (buffet), dîner assis - 150 personnes', 1, 4500.00, 0.20, 4500.00, 900.00, 5400.00, 2, NOW()),
(1, 'Équipements audiovisuels', 'Système de projection 4K, son HD, streaming live sur 2 plateformes', 1, 1800.00, 0.20, 1800.00, 360.00, 2160.00, 3, NOW()),
(1, 'DJ et animations', 'DJ professionnel + 2 sessions d''animation interactive', 1, 1200.00, 0.20, 1200.00, 240.00, 1440.00, 4, NOW()),
(1, 'Décoration et signalétique', 'Décoration thématique + bannières & signalétique événement', 1, 800.00, 0.20, 800.00, 160.00, 960.00, 5, NOW()),

-- Lignes Devis 2 (Envoyé - Team Building)
(2, 'Location Parc Aventure', 'Accrobranche et parcours aventure pour 85 personnes - 2 jours', 1, 1700.00, 0.20, 1700.00, 340.00, 2040.00, 1, NOW()),
(2, 'Restauration - Repas du midi', 'Barbecue complet + boissons + café - 85 personnes', 1, 2000.00, 0.20, 2000.00, 400.00, 2400.00, 2, NOW()),
(2, 'Animateur team building', 'Animateur certifié - 2 jours complets + matériel de jeux', 1, 1500.00, 0.20, 1500.00, 300.00, 1800.00, 3, NOW()),
(2, 'Assurance et sécurité', 'Assurance responsabilité civile + équipements de sécurité', 1, 600.00, 0.20, 600.00, 120.00, 720.00, 4, NOW()),

-- Lignes Devis 3 (Brouillon - Inauguration)
(3, 'Location showroom flagship', 'Espace d''exposition avec aménagement personnalisé', 1, 5000.00, 0.20, 5000.00, 1000.00, 6000.00, 1, NOW()),
(3, 'Traiteur de prestige', 'Réception standing avec service cocktail dînatoire - 250 personnes', 1, 6000.00, 0.20, 6000.00, 1200.00, 7200.00, 2, NOW()),
(3, 'Technique son/lumière', 'System complet son/lumière + scène pour conférences + écrans LED', 1, 2500.00, 0.20, 2500.00, 500.00, 3000.00, 3, NOW()),

-- Lignes Devis 4 (Refusé - Conférence)
(4, 'Location auditorium', '1 journée complète - capacité 250 personnes assises', 1, 1500.00, 0.20, 1500.00, 300.00, 1800.00, 1, NOW()),
(4, 'Traiteur buffet', 'Buffet midi + cocktail de réception - 200 personnes', 1, 3500.00, 0.20, 3500.00, 700.00, 4200.00, 2, NOW()),
(4, 'Système audiovisuel', 'Système son 4K + projection sur écrans géants multiples', 1, 1100.00, 0.20, 1100.00, 220.00, 1320.00, 3, NOW());

-- ============================================================================
-- 10. CRÉATION DES MESSAGES DE CONTACT (3 total)
-- ============================================================================

INSERT INTO contact_messages (firstname, lastname, email, phone, subject, message, is_read, is_archived, user_id, created_at) VALUES
('Rémi', 'Dubois', 'remi.dubois@startupai.fr', '+33 6 12 34 56 78', 'Demande de devis team building', 'Bonjour, nous cherchons une agence pour organiser un team building pour notre équipe de 60 personnes. Avez-vous des disponibilités pour avril 2026? Merci de nous envoyer un devis détaillé.', TRUE, FALSE, 2, NOW() - INTERVAL '8 days'),

('Marie', 'Fontaine', 'marie.fontaine@luxeboutique.fr', '+33 7 45 67 89 01', 'Inauguration flagship store - Besoin consultation', 'Nous ouvrons un nouveau flagship store à Bordeaux et recherchons une agence pour gérer l''inauguration. Budget estimé: 20 000€. Possibilité de discuter.', FALSE, FALSE, NULL, NOW() - INTERVAL '3 days'),

('Christophe', 'Bernard', 'christophe.bernard@innovtech.com', '+33 1 87 65 43 21', 'Merci pour la conférence!', 'Excellent événement! Merci beaucoup pour l''organisation et la coordination. Nous serions intéressés pour une collaboration future.', TRUE, TRUE, 2, NOW() - INTERVAL '2 days');

-- ============================================================================
-- 11. CRÉATION DES AVIS CLIENTS (4 total)
-- ============================================================================

INSERT INTO reviews (client_id, event_id, author_name, author_company, rating, title, content, status, validated_by, validated_at, rejection_reason, is_featured, created_at, updated_at) VALUES
-- Avis 1: Validé et en avant (Conférence RSE)
(2, 2, 'Dr. Pierre Leclerc', 'GreenStart SAS', 5, 'Une conférence exceptionnelle et bien organisée!', 'Innov''Events a orchestré une conférence RSE absolument remarquable. L''organisation était impeccable, les intervenants captivants, et l''ambiance professionnelle. Notre équipe a beaucoup apprécié. Nous les recommandons vivement!', 'validee', 1, NOW() - INTERVAL '15 days', NULL, TRUE, NOW() - INTERVAL '18 days', NOW()),

-- Avis 2: Validé et en avant (Séminaire TechCorp)
(1, 1, 'Yvan Martin', 'TechCorp Solutions', 5, 'Séminaire professionnel et bien coordonné', 'Innov''Events a transformé nos souhaits en réalité. Séminaire fluide, ambiance motivante, équipe réactive. Budget bien maîtrisé et transparence totale. Très satisfait du travail réalisé.', 'validee', 2, NOW() - INTERVAL '10 days', NULL, TRUE, NOW() - INTERVAL '12 days', NOW()),

-- Avis 3: En attente de validation
(3, 4, 'Laurent Dupont', 'MediaSud Agency', 4, 'Bon travail, quelques points à améliorer', 'Devis accepté, préparation en cours. L''équipe est réactive et professionnelle. Nous attendons de voir le résultat final pour la soirée, mais les étapes initiales se déroulent bien.', 'en_attente', NULL, NULL, NULL, FALSE, NOW() - INTERVAL '5 days', NOW()),

-- Avis 4: Refusé
(1, 2, 'Julien Martin', 'TechCorp Solutions', 2, 'Services de faible qualité lors de la conférence', 'Le service traiteur était insuffisant et certains équipements n''ont pas fonctionné correctement. L''équipe n''a pas réagi rapidement aux incidents.', 'refusee', 1, NOW() - INTERVAL '7 days', 'Avis ne reflète pas la qualité réelle du service fourni. Détails techniques contestés.', FALSE, NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days');

-- ============================================================================
-- Réinitialiser les séquences pour que les prochains INSERT fonctionnent
-- ============================================================================

SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 0) FROM users));
SELECT setval('clients_id_seq', (SELECT COALESCE(MAX(id), 0) FROM clients));
SELECT setval('prospects_id_seq', (SELECT COALESCE(MAX(id), 0) FROM prospects));
SELECT setval('events_id_seq', (SELECT COALESCE(MAX(id), 0) FROM events));
SELECT setval('prestations_id_seq', (SELECT COALESCE(MAX(id), 0) FROM prestations));
SELECT setval('devis_id_seq', (SELECT COALESCE(MAX(id), 0) FROM devis));
SELECT setval('lignes_devis_id_seq', (SELECT COALESCE(MAX(id), 0) FROM lignes_devis));
SELECT setval('contact_messages_id_seq', (SELECT COALESCE(MAX(id), 0) FROM contact_messages));
SELECT setval('reviews_id_seq', (SELECT COALESCE(MAX(id), 0) FROM reviews));
SELECT setval('event_notes_id_seq', (SELECT COALESCE(MAX(id), 0) FROM event_notes));
SELECT setval('event_tasks_id_seq', (SELECT COALESCE(MAX(id), 0) FROM event_tasks));

COMMIT;

-- ============================================================================
-- Message de confirmation
-- ============================================================================

SELECT 'Seed de base de données complété avec succès!' AS status;
SELECT 'Utilisateurs créés: ' || COUNT(*) FROM users UNION ALL
SELECT 'Clients créés: ' || COUNT(*) FROM clients UNION ALL
SELECT 'Prospects créés: ' || COUNT(*) FROM prospects UNION ALL
SELECT 'Événements créés: ' || COUNT(*) FROM events UNION ALL
SELECT 'Devis créés: ' || COUNT(*) FROM devis UNION ALL
SELECT 'Avis créés: ' || COUNT(*) FROM reviews;
