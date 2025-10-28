CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW (),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW (),
    deleted_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255)
);

CREATE INDEX idx_items_name ON items (name);

CREATE INDEX idx_items_deleted_at ON items (deleted_at);

INSERT INTO
    items (
        name,
        description,
        quantity,
        price,
        created_by
    )
VALUES (
        'Ноутбук Dell XPS 15',
        'Мощный ноутбук для работы и развлечений',
        10,
        89999.99,
        'admin'
    ),
    (
        'Клавиатура Logitech MX Keys',
        'Беспроводная клавиатура с подсветкой',
        25,
        9999.00,
        'admin'
    ),
    (
        'Мышь Logitech MX Master 3',
        'Эргономичная беспроводная мышь',
        30,
        7499.00,
        'admin'
    ),
    (
        'Монитор LG UltraWide 34"',
        'Широкоформатный монитор 3440x1440',
        5,
        45999.00,
        'admin'
    ),
    (
        'Наушники Sony WH-1000XM5',
        'Премиум наушники с шумоподавлением',
        15,
        29999.00,
        'admin'
    )
ON CONFLICT DO NOTHING;

COMMENT ON TABLE items IS 'Таблица товаров на складе';

COMMENT ON COLUMN items.deleted_at IS 'Дата удаления (soft delete). NULL если товар активен';

COMMENT ON COLUMN items.created_by IS 'Имя пользователя, создавшего товар';

COMMENT ON COLUMN items.updated_by IS 'Имя пользователя, обновившего товар';

COMMENT ON COLUMN items.deleted_by IS 'Имя пользователя, удалившего товар';