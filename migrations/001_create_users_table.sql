CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (
        role IN ('admin', 'manager', 'viewer')
    ),
    created_at TIMESTAMP NOT NULL DEFAULT NOW ()
);

CREATE INDEX idx_users_username ON users (username);

INSERT INTO
    users (username, password, role)
VALUES (
        'admin',
        '$2a$12$eRAdXDJHw5QBFcTVhfJesOsqpFvYADCy8kRQ21zbcagT9UiJ.8skq',
        'admin'
    ),
    (
        'manager',
        '$2a$12$eRAdXDJHw5QBFcTVhfJesOsqpFvYADCy8kRQ21zbcagT9UiJ.8skq',
        'manager'
    ),
    (
        'viewer',
        '$2a$12$eRAdXDJHw5QBFcTVhfJesOsqpFvYADCy8kRQ21zbcagT9UiJ.8skq',
        'viewer'
    )
ON CONFLICT (username) DO NOTHING;

COMMENT ON TABLE users IS 'Таблица пользователей системы';

COMMENT ON COLUMN users.role IS 'Роль пользователя: admin - полный доступ, manager - просмотр и редактирование, viewer - только просмотр';