# Interface Admin - Prospects

Documentation technique décrivant l'interface d'administration pour consulter et gérer les prospects issus des demandes de devis.

## Objectif

Fournir un back-office simple permettant :

- Consulter les demandes de devis enregistrées
- Filtrer les prospects par statut
- Mettre à jour le statut d'un prospect (suivi commercial)

Cette fonctionnalité couvre les opérations READ et UPDATE du cycle de vie d'un prospect.

## Page concernée

- Route frontend : `/admin/prospects`
- Accès : accessible sans authentification en mode développement (authentification à ajouter ultérieurement)

## Fonctionnement général

Au chargement de la page :

1. Le composant React appelle l'API `GET /api/prospects`.
2. Les prospects sont affichés dans un tableau.
3. Le statut par défaut affiché est `a_contacter`.

Fonctionnalités principales :

- Filtrer les prospects par statut
- Limiter le nombre de résultats affichés
- Mettre à jour le statut d'un prospect via des actions directes

## Communication avec l'API

Lecture des prospects

```
GET /api/prospects
Paramètres optionnels : status, limit
```

Mise à jour du statut

```
PATCH /api/prospects/:id/status
Payload: { "status": "nouveau_statut" }
```

Après chaque mise à jour, la liste est rechargée pour garantir la cohérence des données affichées.

## Gestion de l'état côté frontend

Le composant React gère les états suivants :

- `loading` : indique le chargement des données
- `error` : erreur éventuelle lors d'un appel API
- `prospects` : liste des prospects
- `updatingId` : identifiant du prospect en cours de mise à jour

Ce mécanisme évite les actions multiples simultanées sur un même prospect et améliore l'expérience utilisateur.

## Interface utilisateur

Principes :

- Affichage sous forme de tableau (ex. Bootstrap)
- Une ligne par prospect
- Boutons d'action par ligne : Contacté, Qualifié, Refusé
- Désactivation temporaire des boutons lors d'une mise à jour

États visuels gérés : chargement, absence de résultats, erreur API

## Choix techniques

- React (hooks : `useState`, `useEffect`, `useMemo`)
- Appels API via `fetch`
- Pas de gestion d'état globale (Redux) pour le moment
- Rechargement complet de la liste après mise à jour pour privilégier la fiabilité

Ces choix limitent la complexité et restent cohérents avec l'objectif pédagogique du projet.

## Perspectives d'évolution

Améliorations possibles :

- Fiche détail prospect (message complet, historique)
- Authentification (rôles admin / employé)
- Filtres supplémentaires (date, type d'événement)
- Tableau de bord avancé
