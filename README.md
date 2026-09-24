# Panier Etiq — Nutri-Score, NOVA et additifs sur E.Leclerc Drive

Panier Etiq affiche directement sur **E.Leclerc Drive** le **Nutri-Score**, le **groupe NOVA** et les additifs renseignés dans **Open Food Facts**. Cliquez sur Nutri-Score ou NOVA pour ouvrir une page d’explication ; cliquez sur le nombre d’additifs pour afficher leur détail, puis sur un additif pour consulter sa fiche Open Food Facts.

[Installer Panier Etiq sur Firefox](https://addons.mozilla.org/fr/firefox/addon/panier-etiq/). Le paquet Chrome est prêt pour une installation manuelle et a été testé avec succès ; il n’est pas encore publié sur le Chrome Web Store.

Pour consulter les informations que **Yuka** propose sur un produit, affichez son code-barres dans Panier Etiq et scannez-le manuellement dans l’application Yuka. La note consultée est fournie par Yuka : Panier Etiq ne calcule ni n’affiche de note Yuka. Le projet est indépendant et ne collecte pas de données personnelles.

Le code source est réparti dans `src/`. Pour modifier l’extension, voir [ARCHITECTURE.md](ARCHITECTURE.md), puis lancer `node scripts/build.mjs`. L’icône actuelle, un panier et une jeune plante, est dans `icons/product-guide.svg`.

## Ce que l’extension affiche

- Les repères de qualité indiquent clairement **Open Food Facts** comme source et ouvrent des pages d’information.
- Le bouton du code-barres permet de l’afficher puis de le replier ; le code-barres EAN peut être scanné manuellement dans l’application Yuka.
- Les résultats sont limités à dix nouveaux produits par page, espacés de quatre secondes, puis mis en cache 24 heures dans le stockage local du navigateur.
- Le code-barres du produit est envoyé à Open Food Facts uniquement pour demander ses données. Aucune donnée de compte Leclerc ni donnée personnelle n’est transmise.

## Permissions

| Permission | Usage |
| --- | --- |
| `storage` | Conserver localement le cache Open Food Facts pendant 24 h. |
| `https://*.leclercdrive.fr/*` | Lire les codes-barres et ajouter les encarts dans Leclerc Drive. |
| `https://world.openfoodfacts.org/*` | Demander les données produit Open Food Facts. |

L’extension ne lit ni l’historique, ni les onglets, ni les données de compte.

## Test temporaire dans Firefox

1. Dans Firefox, ouvrez `about:debugging#/runtime/this-firefox`.
2. Cliquez sur **Charger un module complémentaire temporaire…**.
3. Sélectionnez `manifest.json`.
4. Ouvrez une fiche Leclerc Drive et actualisez-la.

## Paquet de test Chrome

Pour installer le paquet Chrome, exécutez `node scripts/package-chrome.mjs`, décompressez `dist/panier-etiq-0.3.3-chrome.zip`, puis dans Chrome ouvrez `chrome://extensions`, activez le **mode développeur** et choisissez **Charger l’extension non empaquetée** en sélectionnant le dossier extrait. L’extension a été testée avec succès dans Chrome ; voir [CHROME-PORT.md](CHROME-PORT.md) pour les détails du portage. Elle n’est pas encore publiée sur le Chrome Web Store.

## Installation durable

L’extension est sur [Mozilla Add-ons](https://addons.mozilla.org/fr/firefox/addon/panier-etiq/). La procédure de mise à jour et les commandes de création des paquets sont dans [AMO-SUBMISSION.md](AMO-SUBMISSION.md).

La politique de confidentialité est dans [PRIVACY.md](PRIVACY.md).
