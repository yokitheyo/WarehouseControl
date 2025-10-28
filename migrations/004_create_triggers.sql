CREATE OR REPLACE FUNCTION log_item_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO items_history (item_id, action, username, new_data)
    VALUES (
        NEW.id,
        'INSERT',
        COALESCE(NEW.created_by, 'system'),
        jsonb_build_object(
            'id', NEW.id,
            'name', NEW.name,
            'description', NEW.description,
            'quantity', NEW.quantity,
            'price', NEW.price,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_item_update()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.name, OLD.description, OLD.quantity, OLD.price, OLD.deleted_at) IS DISTINCT FROM 
       (NEW.name, NEW.description, NEW.quantity, NEW.price, NEW.deleted_at) THEN
        
        INSERT INTO items_history (item_id, action, username, old_data, new_data)
        VALUES (
            NEW.id,
            CASE 
                WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN 'DELETE'
                ELSE 'UPDATE'
            END,
            COALESCE(NEW.updated_by, NEW.deleted_by, 'system'),
            jsonb_build_object(
                'id', OLD.id,
                'name', OLD.name,
                'description', OLD.description,
                'quantity', OLD.quantity,
                'price', OLD.price,
                'created_at', OLD.created_at,
                'updated_at', OLD.updated_at
            ),
            CASE 
                WHEN NEW.deleted_at IS NULL THEN
                    jsonb_build_object(
                        'id', NEW.id,
                        'name', NEW.name,
                        'description', NEW.description,
                        'quantity', NEW.quantity,
                        'price', NEW.price,
                        'created_at', NEW.created_at,
                        'updated_at', NEW.updated_at
                    )
                ELSE NULL
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS items_insert_trigger ON items;

CREATE TRIGGER items_insert_trigger
    AFTER INSERT ON items
    FOR EACH ROW
    EXECUTE FUNCTION log_item_insert();

DROP TRIGGER IF EXISTS items_update_trigger ON items;

CREATE TRIGGER items_update_trigger
    AFTER UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION log_item_update();

COMMENT ON FUNCTION log_item_insert () IS 'АНТИПАТТЕРН: Триггер для автоматического логирования создания товаров. В продакшене следует использовать логирование на уровне приложения';

COMMENT ON FUNCTION log_item_update () IS 'АНТИПАТТЕРН: Триггер для автоматического логирования обновления/удаления товаров. В продакшене следует использовать логирование на уровне приложения';

-- Проверка работы триггеров
-- INSERT INTO items (name, description, quantity, price, created_by) VALUES ('Test Item', 'Test', 5, 100, 'admin');
-- UPDATE items SET quantity = 10, updated_by = 'admin' WHERE name = 'Test Item';
-- UPDATE items SET deleted_at = NOW(), deleted_by = 'admin' WHERE name = 'Test Item';
-- SELECT * FROM items_history ORDER BY changed_at DESC LIMIT 10;