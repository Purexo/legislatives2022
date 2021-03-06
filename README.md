# France - Legislatives 2022 - 1er tour

- Source des données : https://www.data.gouv.fr/en/datasets/62a6eb8598f12fafcba7ba7c/

Utilisation du fichier `resultats-par-niveau-cirlg-t1-france-entiere.txt` (par circonscription) que j'ai renommé en csv

- `;` comme séparateur de colonne
- `CRLF` comme séparateur de ligne
- `ISO-8859-1` comme encodage caractère

## Ajouts manuels

### `nuances.csv`

- `;` comme séparateur de colonne
- `LF` comme séparateur de ligne
- `UTF-8` comme encodage caractère

Dans le fichier elles ne sont fournis qu'avec un sigle du ministère, j'y ajoute le label et description
depuis les source suivante :

- https://www.legifrance.gouv.fr/download/pdf/circ?id=45336
- https://www.resultats-elections.interieur.gouv.fr/legislatives-2022/nuances.html

Ordonné du plus à gauche au moins à gauche, en essayant d'être objectif, avec ma perception personnelle.
Donc pour ceux qui voudraient s'appuyer sur le rowid de nuances pour déterminer l'ordre sur l'axe gauche droite
Et qui ne sont pas d'accord avec mon placement :
DXG, RDG, NUP, DVG, ECO, DIV, DVC, REG, ENS, UDI, LR, DVD, RN, DSV, REC, DXD

Ordonnez à votre sauce le fichier `datasources/nuances.csv` (vous pouvez aussi changer les couleurs que j'utilise pour les graphiques)

## Résultats

Un fichier SQLite, découpé en 5 tables.

- departements
- circonscriptions
- circonscriptions_consolidees
- candidats
- nuances
- duels

Le mieux c'est d'ouvrir la base sqlite (avec dbeaver par exemple) et de regarder les tables, leurs structures. 
J'ai précisé tout ce qui faisait clé primaire, et les liens entre les tables avec les clé étrangères.

Malgré quelques fonctionnalités manquantes, sqlite permet de faire beaucoup de choses, par exemple,
pour compenser le manque de `LATERAL JOIN` j'ai utilisé les `WINDOW` pour générer la table `circonscriptions_consolidees`
(même si ça aurait été beaucoup plus simple en code, ça me permet de m'entrainer en SQL au passage)

## Analyses

### nombre de circonscription par partis (siége ou qualification au second tour) :

|code_nuance|label_nuance|voix|sieges|second_tour|second_tour_majoritaire|second_tour_minoritaire|
|-----------|------------|----|------|-----------|-----------------------|-----------------------|
|ENS|Ensemble ! (Majorité présidentielle)|5857575|1|415|200|215|
|NUP|Nouvelle union populaire écologique et sociale|5836239|4|373|183|190|
|RN|Rassemblement National|4248631|0|206|110|96|
|LR|Les Républicains|2370839|0|70|41|29|
|DVG|Divers gauche|713642|0|26|14|14|
|REG|Régionaliste|291392|0|15|9|9|
|DVD|Divers droite|530783|0|14|9|6|
|DVC|Divers centre|283613|0|9|3|7|
|UDI|Union des Démocrates et des Indépendants|198061|0|5|1|4|
|DXG|Divers extrême gauche|266379|0|1|0|1|
|DIV|Divers|192628|0|1|1|1|
|DSV|Droite souverainiste|249607|0|1|1|0|
|RDG|Parti radical de gauche|126707|0|0|0|0|
|ECO|Ecologistes|608171|0|0|0|0|
|REC|Reconquête !|964878|0|0|0|0|
|DXD|Divers extrême droite|6457|0|0|0|0|

<details>
<summary>Requete SQL</summary>

```sql
SELECT code_nuance, label_nuance, voix, sieges, second_tour, second_tour_majoritaire, second_tour_minoritaire
FROM nuances
ORDER BY second_tour DESC;
```
</details>

### Remplissage de l'assemblé quantique :

TODO: Dataviz

un demi-camembert avec des points, (chaque point = une circo - un siège), ces points serait coloré bicolore (avec une couleur par nuance) majoritaire gauche, minoritaire droite, et la proportion des 2 couleurs dans le point proportionnels au nombre de voix de la nuance / somme des nombre de voix des 2 camps pour le second tour.
Après c'est pour la répartition géographique qui ça va être compliqué mais on doit pouvoir trouver des solutions :
regroupement géographique priorisé selon la valeur de la somme des accès au seconds tours + sièges
répartition des regroupements de la gauche vers la droite, genre
DXG - NUP - DVG - DVD- ENS - UDI - LR - RN

Le point pourrait avoir une bordure si c'es un siège acquis sans second tour

Un hover / clic pourrait afficher les détails de la circo (comme la liste des résultats de chaque candidat-nuance en nombre de voix / pourcentage et histogramme en barre horizontale)

piste highcharts

- https://www.highcharts.com/demo/parliament-chart (j'espère que ce sera assez souple)
- https://www.highcharts.com/demo/dependency-wheel (plus adapté pour représenter les duels je penses)
- https://www.highcharts.com/demo/honeycomb-usa (si on peux répartir les tiles de façon à ce que ça ressemble à un parlement)

exploiter sqlite dans le browser : https://sql.js.org/#/

<details>
<summary>Requete SQL</summary>

```sql
SELECT *
FROM circonscriptions c
INNER JOIN circonscriptions_consolidees cc
    ON c.code_departement = cc.code_departement
        AND c.code_circonscription  = cc.code_circonscription
INNER JOIN candidats c_maj
    ON cc.code_departement = c_maj.code_departement
        AND cc.code_circonscription = c_maj.code_circonscription
        AND cc.majoritaire_numero_panneau = c_maj.numero_panneau
INNER JOIN nuances n_maj ON c_maj.code_nuance = n_maj.code_nuance
INNER JOIN candidats c_min
    ON cc.code_departement = c_min.code_departement
        AND cc.code_circonscription = c_min.code_circonscription
        AND cc.majoritaire_numero_panneau = c_min.numero_panneau
INNER JOIN nuances n_min ON c_min.code_nuance = n_min.code_nuance;
```
La on a toutes les données de la circo, avec toutes les informations des vainqueurs et la nuance des vaiqueurs.
</details>