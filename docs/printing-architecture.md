# Impression automatique ticket cuisine

## Limitation navigateur
Un navigateur web standard ne peut pas lancer une impression silencieuse native fiable (sans dialogue utilisateur) pour des raisons de sécurité.

## MVP implémenté
- Transition `PAID -> PREPARING` crée un `PrintJob` en base.
- Un worker (`npm run print:worker`) appelle périodiquement `POST /api/internal/print-worker`.
- Le service serveur `processPendingPrintJobs()` envoie le ticket vers `PRINT_BRIDGE_URL/print`.
- Le bridge local (`npm run print:bridge`) reçoit le ticket et l’écrit dans `print-spool/*.log`.
- Retry automatique exponentiel + logs (`PrintLog`) + statut (`QUEUED/PROCESSING/SUCCESS/FAILED`).

## Version production recommandée
- Remplacer le bridge MVP par un agent local (Node service/daemon) installé sur le poste cuisine.
- Agent connecté à une imprimante thermique ESC/POS (USB, Ethernet ou IP) via SDK natif.
- Agent exposant une API locale sécurisée (token + whitelist réseau interne).
- Observabilité:
  - supervision des files (`PrintJob`, `PrintLog`)
  - alertes si `FAILED` > seuil
  - dashboard opérationnel en cuisine
- Fallback:
  - reroute vers imprimante secondaire
  - export PDF ticket d’urgence pour impression manuelle exceptionnelle

## Données imprimées
- Numéro de commande
- Date/heure
- Client
- Mode livraison/retrait
- Adresse (si livraison)
- Lignes pizzas + suppléments + quantités
- Remarques client
