# Dossier database

Ce dossier est conserve parce qu'il sert de reference SQL et d'aide d'installation locale pour MySQL/MariaDB, surtout avec XAMPP, WAMP ou phpMyAdmin.

## Role des fichiers

- `local_mariadb_setup.sql`: cree la base locale et l'utilisateur MariaDB/MySQL de developpement.
- `schema.sql`: ancien schema SQL manuel de reference.
- `provinces.sql`, `communes.sql`, `categories.sql`: donnees de reference historiques.
- `demo.sql`: donnees de demonstration historiques.

## Regle importante

La source principale actuelle du schema est Django:

```bash
cd backend
python manage.py migrate
python manage.py seed_reference_data
python manage.py bootstrap_admin
```

Il ne faut pas importer `schema.sql` ou `demo.sql` dans une base deja geree par Django, sinon on risque de creer des tables ou colonnes incoherentes avec les migrations actuelles.

## Quand utiliser ce dossier

Utilisez seulement `local_mariadb_setup.sql` pour preparer une base MariaDB/MySQL locale vide. Ensuite, laissez Django creer les tables avec `python manage.py migrate`.

Les autres fichiers SQL restent utiles comme documentation historique ou reference manuelle, mais les migrations Django et les commandes de seed sont prioritaires.
