# Panier Etiq — Nutri-Score, NOVA et additifs sur E.Leclerc Drive

Panier Etiq est une extension Firefox qui affiche directement pendant vos courses sur **E.Leclerc Drive** le **Nutri-Score**, le **groupe NOVA** et les **additifs renseignés** dans **Open Food Facts**. Cliquez sur le nombre d’additifs pour en consulter le détail.

[Installer Panier Etiq sur Mozilla Add-ons](https://addons.mozilla.org/fr/firefox/addon/panier-etiq/).

Panier Etiq n’affiche pas de note Yuka : le code-barres peut être affiché pour un scan manuel dans l’application Yuka. Le projet est indépendant et ne collecte pas de données personnelles.

Le code source est réparti dans `src/`. Pour modifier l’extension, voir [ARCHITECTURE.md](ARCHITECTURE.md), puis lancer `node scripts/build.mjs`. L’icône actuelle, un panier et une jeune plante, est dans `icons/product-guide.svg`.

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

L’extension est sur [Mozilla Add-ons](https://addons.mozilla.org/fr/firefox/addon/panier-etiq/). La procédure de mise à jour et les commandes de création des paquets sont dans [AMO-SUBMISSION.md](AMO-SUBMISSION.md).

La politique de confidentialité est dans [PRIVACY.md](PRIVACY.md).
