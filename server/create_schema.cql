CREATE KEYSPACE IF NOT EXISTS auth_prototype WITH REPLICATION = { 'class': 'SimpleStrategy', 'replication_factor': 1 };

CREATE TABLE IF NOT EXISTS auth_prototype.user (
    id uuid,
    email text,
    name text,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS auth_prototype.token_link (
    iss text,
    sub text,
    user_id uuid,
    PRIMARY KEY (iss,sub)
);