# Comptes de test

## Environnement de développement

### Comptes existants (créés manuellement)

| Email | Mot de passe | Rôle | Description |
|-------|--------------|------|-------------|
| admin@ino.fr | Admin123? | admin | Compte admin principal |
| test@st4m.fr | Test123? | client | Compte client de test |
| kimpal@kimpal.fr | KimPal123?? | client | Compte client de test |
| bn@chocobn.fr | Bernard123? | client | Compte client de test |

### Comptes du jeu de données (seed)

Ces comptes sont créés par le script `docs/database/seed.sql`. Mot de passe commun : **Password123!**

| Email | Rôle | Nom | Description |
|-------|------|-----|-------------|
| chloe.durand@innovevents.com | admin | Chloé Durand | Directrice de l'agence |
| maxime.leroy@innovevents.com | employe | Maxime Leroy | Chef de projet événementiel |
| sarah.benali@innovevents.com | employe | Sarah Benali | Chargée de communication (doit changer son mdp) |
| yvan.martin@techcorp.fr | client | Yvan Martin | Client TechCorp Solutions |
| julie.moreau@greenstart.fr | client | Julie Moreau | Cliente GreenStart SAS |
| thomas.petit@mediasud.fr | client | Thomas Petit | Client MediaSud Agency |

## Charger le jeu de données

```bash
# Depuis le conteneur Docker
docker exec -i $(docker ps -qf "name=db") psql -U postgres -d innovevents < docs/database/seed.sql
```

## Rôles et permissions

| Rôle | Dashboard | Gestion prospects | Gestion devis | Gestion événements | Espace client |
|------|-----------|-------------------|---------------|---------------------|---------------|
| admin | Admin | Oui | Oui | Oui | Non |
| employe | Employé | Oui (lecture) | Oui (lecture) | Oui | Non |
| client | Client | Non | Voir les siens | Non | Oui |

---

⚠️ **Ne pas utiliser ces comptes en production !**
