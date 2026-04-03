-- MASA Platform — PostgreSQL initialisation
-- Run once on a fresh EC2 instance
CREATE USER masa_user WITH PASSWORD 'CHANGE_ME';
CREATE DATABASE masadb OWNER masa_user;
GRANT ALL PRIVILEGES ON DATABASE masadb TO masa_user;
