CREATE KEYSPACE IF NOT EXISTS auth_prototype WITH REPLICATION = { 'class': 'SimpleStrategy', 'replication_factor': 1 };
USE auth_prototype;

CREATE TABLE IF NOT EXISTS user (
    id uuid,
    email text,
    name text,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS token_link (
    iss text,
    email text,
    sub text,
    user_id uuid,
    PRIMARY KEY (iss,email)
);

CREATE TABLE IF NOT EXISTS password_hash (
    email text,
    password_hash text,
    user_id uuid,
    PRIMARY KEY (email)
);

CREATE TABLE IF NOT EXISTS pending_user (
    id uuid,
    email text,
    password_hash text,
    user_id uuid,
    PRIMARY KEY (id)
);