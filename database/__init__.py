import sqlite3


def init_schemas():
    return '''
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS duels;
DROP TABLE IF EXISTS candidats;
DROP TABLE IF EXISTS nuances;
DROP TABLE IF EXISTS circonscriptions;
DROP TABLE IF EXISTS departements;

CREATE TABLE IF NOT EXISTS departements (
    code_departement TEXT,

    label_departement TEXT,
    
    PRIMARY KEY (code_departement)
);

CREATE TABLE IF NOT EXISTS circonscriptions (
    code_departement TEXT,
    code_circonscription INTEGER,

    label_circonscription TEXT,
    etat_saisie TEXT,

    inscrits INTEGER,
    abstentions INTEGER,
    votants INTEGER,
    blancs INTEGER,
    nuls INTEGER,
    exprimes INTEGER,
    
    PRIMARY KEY (code_departement, code_circonscription),

    FOREIGN KEY (code_departement)
        REFERENCES departements(code_departement)
);

CREATE TABLE IF NOT EXISTS nuances (
    code_nuance TEXT,

    label_nuance TEXT,
    description_nuance TEXT,

    voix INTEGER,
    sieges INTEGER,
    second_tour INTEGER,
    second_tour_majoritaire INTEGER,
    second_tour_minoritaire INTEGER,
    
    PRIMARY KEY (code_nuance)
);

CREATE TABLE IF NOT EXISTS candidats (
    code_departement TEXT,
    code_circonscription INTEGER,
    numero_panneau INTEGER,
    
    sexe TEXT,
    nom TEXT,
    prenom TEXT,
    code_nuance TEXT,

    voix INTEGER,
    sieges INTEGER,
    
    PRIMARY KEY (code_departement, code_circonscription, numero_panneau),

    FOREIGN KEY (code_departement, code_circonscription)
        REFERENCES circonscriptions(code_departement, code_circonscription),
    FOREIGN KEY (code_departement)
        REFERENCES departements(code_departement),
    FOREIGN KEY (code_nuance)
        REFERENCES nuances(code_nuance)
);

CREATE TABLE IF NOT EXISTS duels (
    majoritaire_code_departement TEXT,
    majoritaire_code_circonscription INTEGER,
    majoritaire_numero_panneau INTEGER,
    majoritaire_code_nuance TEXT,
    
    minoritaire_code_departement TEXT,
    minoritaire_code_circonscription INTEGER,
    minoritaire_numero_panneau INTEGER,
    minoritaire_code_nuance TEXT,

    majoritaire_voix INTEGER,
    minoritaire_voix INTEGER,
    
    FOREIGN KEY (majoritaire_code_departement, majoritaire_code_circonscription, majoritaire_numero_panneau)
        REFERENCES candidats(code_departement, code_circonscription, numero_panneau),
    FOREIGN KEY (minoritaire_code_departement, minoritaire_code_circonscription, minoritaire_numero_panneau)
        REFERENCES candidats(code_departement, code_circonscription, numero_panneau),
    FOREIGN KEY (majoritaire_code_nuance)
        REFERENCES nuances(code_nuance),
    FOREIGN KEY (minoritaire_code_nuance)
        REFERENCES nuances(code_nuance)
);

PRAGMA foreign_keys = OFF;
'''


QUERY_DEPARTEMENT = '''
INSERT OR IGNORE INTO departements
(code_departement, label_departement)
VALUES
(?, ?)
'''
QUERY_CIRCONSCRIPTION = '''
INSERT OR IGNORE INTO circonscriptions (
    code_departement,
    code_circonscription,

    label_circonscription,
    etat_saisie,

    inscrits,
    abstentions,
    votants,
    blancs,
    nuls,
    exprimes
) VALUES
(?,  ?,  ?,  ?,  ?,  ?,  ?,  ?,  ?, ?)
'''
QUERY_CANDIDAT = '''
INSERT INTO candidats (
    code_departement,
    code_circonscription,
    numero_panneau,
    
    sexe,
    nom,
    prenom,
    code_nuance,

    voix,
    sieges
) VALUES
(?,  ?,  ?,  ?,  ?,  ?,  ?,  ?,  ?)
'''
QUERY_DUEL = '''
INSERT INTO duels (
    majoritaire_code_departement,
    majoritaire_code_circonscription,
    majoritaire_numero_panneau,
    majoritaire_code_nuance,
    
    minoritaire_code_departement,
    minoritaire_code_circonscription,
    minoritaire_numero_panneau,
    minoritaire_code_nuance,

    majoritaire_voix,
    minoritaire_voix
) VALUES
(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
'''
QUERY_NUANCE = '''
INSERT OR IGNORE INTO nuances (
    code_nuance,
    label_nuance,
    description_nuance
) VALUES
(?, ?, ?)
'''


def insert_nuances(cursor: sqlite3.Cursor, nuance: list):
    cursor.execute(QUERY_NUANCE, nuance)


def insert_departement(cursor: sqlite3.Cursor, departement: list):
    cursor.execute(QUERY_DEPARTEMENT, departement)


def insert_circonscription(cursor: sqlite3.Cursor, circonscription: list):
    cursor.execute(QUERY_CIRCONSCRIPTION, circonscription)


def insert_candidat(cursor: sqlite3.Cursor, candidat: list):
    cursor.execute(QUERY_CANDIDAT, candidat)


def insert_duel(cursor: sqlite3.Cursor, duel: list):
    cursor.execute(QUERY_DUEL, duel)


def populate_nuances(cursor: sqlite3.Cursor):
    cursor.executescript('''
UPDATE nuances AS n
SET voix = (SELECT SUM(c.voix) FROM candidats AS c WHERE c.code_nuance = n.code_nuance);

UPDATE nuances AS n
SET sieges = (SELECT SUM(c.sieges) FROM candidats AS c WHERE c.code_nuance = n.code_nuance);

UPDATE nuances AS n
SET second_tour = (
    SELECT COUNT(rowid)
    FROM duels AS d
    WHERE
        d.majoritaire_code_nuance = n.code_nuance
        OR d.minoritaire_code_nuance = n.code_nuance);

UPDATE nuances AS n
SET second_tour_majoritaire = (SELECT COUNT(rowid) FROM duels AS d WHERE d.majoritaire_code_nuance = n.code_nuance);

UPDATE nuances AS n
SET second_tour_minoritaire = (SELECT COUNT(rowid) FROM duels AS d WHERE d.minoritaire_code_nuance = n.code_nuance);
''')
