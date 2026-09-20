# Panier Clair — Qualité produits

Extension Firefox pour E.Leclerc Drive. Sur les fiches et les listes où le code-barres est disponible, elle affiche le Nutri-Score, le groupe NOVA et les additifs renseignés par Open Food Facts.

## Ce que l’extension affiche

- Les encarts portent clairement la mention **Open Food Facts**. Ils ne sont pas des notes Yuka.
- Le code-barres EAN peut être affiché pour être scanné dans l’application Yuka, afin de consulter la note officielle dans Yuka.
- Les résultats sont limités à dix nouveaux produits par page, espacés de quatre secondes, puis mis en cache 24 heures dans Firefox.
- Le code-barres du produit est envoyé à Open Food Facts uniquement pour demander ses données. Aucune donnée de compte Leclerc ni donnée personnelle n’est transmise.

## Permissions

| Permission | Usage |
| --- | --- |
| `storage` | Conserver localement le cache Open Food Facts pendant 24 h. |
| `https://*.leclercdrive.fr/*` | Lire les codes-barres et ajouter les encarts dans Leclerc Drive. |
| `https://world.openfoodfacts.org/*` | Demander les données produit Open Food Facts. |

L’extension ne lit ni l’historique, ni les onglets, ni les données de compte.

## Test temporaire

1. Dans Firefox, ouvrez `about:debugging#/runtime/this-firefox`.
2. Cliquez sur **Charger un module complémentaire temporaire…**.
3. Sélectionnez `manifest.json`.
4. Ouvrez une fiche Leclerc Drive et actualisez-la.

## Installation durable

Le paquet prêt à signer est `dist/panier-clair-0.2.0-unsigned.xpi`. Firefox standard demande une signature Mozilla : la procédure est dans [AMO-SUBMISSION.md](AMO-SUBMISSION.md).
