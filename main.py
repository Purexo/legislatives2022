import csv
import sqlite3
import database


def row_transformation(row: list):
    """
    :type row: list
    """
    # [Code, Libellé]
    departement = row[0:2]

    # [code dpt, Code circo, Libellé, Etat saisie, Inscrits, Abstentions, Votants, Blancs, Nuls, Exprimés]
    circonscription = row[2:19]
    circonscription.insert(0, departement[0])

    circonscription.pop(-1)  # remove % Exp/Ins % Exp/Vot
    circonscription.pop(-1)
    circonscription.pop(-2)  # remove % Nuls/Ins % Nuls/Vot
    circonscription.pop(-2)
    circonscription.pop(-3)  # remove % Blancs/Ins	% Blancs/Vot
    circonscription.pop(-3)
    circonscription.pop(-4)  # remove % Vot/Ins
    circonscription.pop(-5)  # remove % Abs/Ins

    circonscription[1] = int(circonscription[1], base=10)
    circonscription[4:] = (int(v, base=10) for v in circonscription[4:])

    candidat_length = 9
    candidat_index = 19

    # [code dpt, Code circo, N°Panneau, Sexe, Nom, Prénom, Nuance, Voix, Sièges]
    candidats = []
    while len(row) > candidat_index and row[candidat_index]:
        candidat = row[candidat_index:candidat_index + candidat_length]

        candidat.pop(-2)
        candidat.pop(-2)
        candidat = circonscription[0:2] + candidat

        candidat[2] = int(candidat[2], base=10)
        candidat[7:] = (int(v or '0', base=10) for v in candidat[7:])

        candidats.append(candidat)
        candidat_index += candidat_length

    candidats.sort(key=lambda c: c[-2], reverse=True)

    duel = None
    if candidats[0][-1] == 0:
        majoritaire, minoritaire = candidats[0:2]
        duel = majoritaire[0:3] + majoritaire[6:1] \
               + minoritaire[0:3] + minoritaire[6:1] \
               + majoritaire[7:1] + minoritaire[7:1]

    return departement, circonscription, candidats, duel


def main():
    db = sqlite3.connect('./resultats-legislatives-premier-tour.sqlite3')
    db.executescript(database.init_schemas())

    with open('nuances.csv', encoding='UTF-8', newline='\n') as csvfile:
        csvreader = csv.reader(csvfile, delimiter=';')
        cursor = db.cursor()

        for row in csvreader:
            database.insert_nuances(cursor, row)

        cursor.close()

    with open('resultats-par-niveau-cirlg-t1-france-entiere.csv', encoding='ISO-8859-1', newline='\r\n') as csvfile:
        csvreader = csv.reader(csvfile, delimiter=';')
        next(csvreader, None)  # skip row header

        for row in csvreader:
            departement, circonscription, candidats, duel = row_transformation(row)
            cursor = db.cursor()
            database.insert_departement(cursor, departement)
            database.insert_circonscription(cursor, circonscription)

            for candidat in candidats:
                database.insert_candidat(cursor, candidat)

            if duel:
                database.insert_duel(cursor, duel)

            cursor.close()

    db.execute('PRAGMA foreign_keys = ON')
    db.close()


if __name__ == '__main__':
    main()
