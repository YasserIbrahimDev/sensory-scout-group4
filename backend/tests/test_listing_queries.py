from sqlalchemy import event

from app.seed import seed_data


def test_listing_uses_four_queries_regardless_of_page_size(client, db):
    seed_data(db)
    statements = []

    def record(_conn, _cursor, statement, _parameters, _context, _many):
        if statement.lstrip().upper().startswith('SELECT'):
            statements.append(statement)

    event.listen(db.bind, 'before_cursor_execute', record)
    try:
        for size in (1, 100):
            statements.clear()
            response = client.get(f'/api/v1/places?page_size={size}')
            assert response.status_code == 200
            assert len(statements) == 4
    finally:
        event.remove(db.bind, 'before_cursor_execute', record)
