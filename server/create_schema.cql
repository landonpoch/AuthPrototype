CREATE KEYSPACE IF NOT EXISTS auth_prototype WITH REPLICATION = { 'class': 'SimpleStrategy', 'replication_factor': 1 };

CREATE TABLE IF NOT EXISTS auth_prototype.user (
    id uuid,
    email text,
    name text,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS auth_prototype.token_link (
    iss text,
    email text,
    sub text,
    user_id uuid,
    PRIMARY KEY (iss,email)
);

CREATE TABLE IF NOT EXISTS auth_prototype.password_hash (
    email text,
    password_hash text,
    user_id uuid,
    PRIMARY KEY (email)
);