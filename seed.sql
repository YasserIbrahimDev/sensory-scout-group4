CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE venues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    sensory_tags TEXT[],
    coordinates GEOGRAPHY(Point, 4326)
);

INSERT INTO venues (name, address, sensory_tags, coordinates)
VALUES 
    (
        'Quiet Library',
        '123 Main St, Denton, TX',
        ARRAY['low noise', 'dim lighting'],
        ST_SetSRID(ST_MakePoint(-97.1331, 33.2148), 4326)
    ),
    (
        'Calm Cafe',
        '456 Elm St, Denton, TX',
        ARRAY['low crowds', 'quiet'],
        ST_SetSRID(ST_MakePoint(-97.1410, 33.2150), 4326)
    ),
    (
        'Sensory Friendly Theater',
        '789 Oak St, Denton, TX',
        ARRAY['dim lighting', 'low noise'],
        ST_SetSRID(ST_MakePoint(-97.1450, 33.2100), 4326)
    ),
    (
        'Spacious Park',
        '101 Pine St, Denton, TX',
        ARRAY['low crowds', 'open space'],
        ST_SetSRID(ST_MakePoint(-97.1500, 33.2200), 4326)
    ),
    (
        'Accessible Bookstore',
        '202 Maple St, Denton, TX',
        ARRAY['quiet', 'accessible'],
        ST_SetSRID(ST_MakePoint(-97.1250, 33.2180), 4326)
    );