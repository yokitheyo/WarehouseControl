CREATE TABLE IF NOT EXISTS items_history (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (
        action IN ('INSERT', 'UPDATE', 'DELETE')
    ),
    username VARCHAR(255) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_at TIMESTAMP NOT NULL DEFAULT NOW ()
);

CREATE INDEX idx_items_history_item_id ON items_history (item_id);

CREATE INDEX idx_items_history_username ON items_history (username);

CREATE INDEX idx_items_history_action ON items_history (action);

CREATE INDEX idx_items_history_changed_at ON items_history (changed_at DESC);

COMMENT ON TABLE items_history IS 'Таблица истории изменений товаров. Заполняется автоматически через триггеры';

COMMENT ON COLUMN items_history.action IS 'Тип операции: INSERT - создание, UPDATE - обновление, DELETE - удаление';

COMMENT ON COLUMN items_history.old_data IS 'JSON с данными товара до изменения (для UPDATE и DELETE)';

COMMENT ON COLUMN items_history.new_data IS 'JSON с данными товара после изменения (для INSERT и UPDATE)';