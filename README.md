# France - Legislatives 2022 - 1er tour

- Source des données : https://www.data.gouv.fr/en/datasets/62a6eb8598f12fafcba7ba7c/

Utilisation du fichier `resultats-par-niveau-cirlg-t1-france-entiere.txt` (par circonscription)

c'est du csv avec : 
- `;` comme séparateur de colonne
- `CRLF` comme séparateur de ligne
- `ISO-8859-1` comme encodage caractère

## Ajouts manuels

- Nuances

Dans le fichier elles ne sont fournis qu'avec un sigle du ministère, j'y ajoute le label et description
depuis la source suivante :

https://www.legifrance.gouv.fr/download/pdf/circ?id=45336  
et rationnalisé par  
https://www.resultats-elections.interieur.gouv.fr/legislatives-2022/nuances.html

j'en ai fait un csv ; LF UTF-8

## Résultats

Un fichier SQLite, découpé en 5 tables.

- departements
- circonscriptions
- candidats
- nuances
- duels

Union des démocrates et des
écologistes, Les Nouveaux démocrates, Alliance Ecologiste
Indépendante, Rassemblement citoyen-CAP 21, Génération
écologie, parti animaliste, autres partis ou candidats
écologistes
