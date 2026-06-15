CREATE TABLE IF NOT EXISTS estate_properties (
    id bigserial PRIMARY KEY,
    property_key varchar(30) NOT NULL,
    pnu varchar(19),
    district_code varchar(5) NOT NULL,
    district_name text NOT NULL,
    legal_dong_code varchar(5) NOT NULL,
    legal_dong_name text NOT NULL,
    lot_type_code varchar(10) NOT NULL,
    lot_type_name text,
    main_lot_number varchar(10) NOT NULL,
    sub_lot_number varchar(10) NOT NULL,
    parcel_address text NOT NULL,
    building_names text[] NOT NULL DEFAULT '{}',
    transaction_count int NOT NULL DEFAULT 0,
    latitude numeric(10, 7),
    longitude numeric(10, 7),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_estate_properties_coordinates_complete CHECK (
        (latitude IS NULL AND longitude IS NULL)
        OR (latitude IS NOT NULL AND longitude IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_estate_properties_property_key_unique
ON estate_properties (property_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_estate_properties_pnu_unique
ON estate_properties (pnu)
WHERE pnu IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_estate_properties_district_legal_dong
ON estate_properties (district_name, legal_dong_name);

ALTER TABLE estate_transactions
ADD COLUMN IF NOT EXISTS property_id bigint;

WITH estate_property_rows AS (
    SELECT
        CONCAT(
            district_code,
            legal_dong_code,
            lot_type_code,
            LPAD(main_lot_number, 4, '0'),
            LPAD(sub_lot_number, 4, '0')
        ) AS property_key,
        CASE
            WHEN lot_type_code IN ('1', '2') THEN CONCAT(
                district_code,
                legal_dong_code,
                lot_type_code,
                LPAD(main_lot_number, 4, '0'),
                LPAD(sub_lot_number, 4, '0')
            )
            ELSE NULL
        END AS pnu,
        district_code,
        district_name,
        legal_dong_code,
        legal_dong_name,
        lot_type_code,
        lot_type_name,
        LPAD(main_lot_number, 4, '0') AS main_lot_number,
        LPAD(sub_lot_number, 4, '0') AS sub_lot_number,
        CONCAT_WS(
            ' ',
            '서울특별시',
            district_name,
            legal_dong_name,
            CONCAT(
                CASE WHEN lot_type_code = '2' THEN '산 ' ELSE '' END,
                COALESCE(NULLIF(LTRIM(LPAD(main_lot_number, 4, '0'), '0'), ''), '0'),
                CASE
                    WHEN LPAD(sub_lot_number, 4, '0') = '0000' THEN ''
                    ELSE CONCAT('-', COALESCE(NULLIF(LTRIM(LPAD(sub_lot_number, 4, '0'), '0'), ''), '0'))
                END
            )
        ) AS parcel_address,
        COALESCE(
            ARRAY_AGG(DISTINCT NULLIF(building_name, '')) FILTER (WHERE NULLIF(building_name, '') IS NOT NULL),
            '{}'
        ) AS building_names,
        COUNT(*)::int AS transaction_count
    FROM estate_transactions
    WHERE district_code IS NOT NULL
        AND legal_dong_code IS NOT NULL
        AND lot_type_code IS NOT NULL
        AND main_lot_number IS NOT NULL
        AND sub_lot_number IS NOT NULL
    GROUP BY
        district_code,
        district_name,
        legal_dong_code,
        legal_dong_name,
        lot_type_code,
        lot_type_name,
        LPAD(main_lot_number, 4, '0'),
        LPAD(sub_lot_number, 4, '0')
)
INSERT INTO estate_properties (
    property_key,
    pnu,
    district_code,
    district_name,
    legal_dong_code,
    legal_dong_name,
    lot_type_code,
    lot_type_name,
    main_lot_number,
    sub_lot_number,
    parcel_address,
    building_names,
    transaction_count
)
SELECT
    property_key,
    pnu,
    district_code,
    district_name,
    legal_dong_code,
    legal_dong_name,
    lot_type_code,
    lot_type_name,
    main_lot_number,
    sub_lot_number,
    parcel_address,
    building_names,
    transaction_count
FROM estate_property_rows
ON CONFLICT (property_key) DO UPDATE
SET
    pnu = EXCLUDED.pnu,
    district_code = EXCLUDED.district_code,
    district_name = EXCLUDED.district_name,
    legal_dong_code = EXCLUDED.legal_dong_code,
    legal_dong_name = EXCLUDED.legal_dong_name,
    lot_type_code = EXCLUDED.lot_type_code,
    lot_type_name = EXCLUDED.lot_type_name,
    main_lot_number = EXCLUDED.main_lot_number,
    sub_lot_number = EXCLUDED.sub_lot_number,
    parcel_address = EXCLUDED.parcel_address,
    building_names = EXCLUDED.building_names,
    transaction_count = EXCLUDED.transaction_count,
    updated_at = CURRENT_TIMESTAMP;

UPDATE estate_transactions
SET property_id = estate_properties.id
FROM estate_properties
WHERE estate_properties.property_key = CONCAT(
    estate_transactions.district_code,
    estate_transactions.legal_dong_code,
    estate_transactions.lot_type_code,
    LPAD(estate_transactions.main_lot_number, 4, '0'),
    LPAD(estate_transactions.sub_lot_number, 4, '0')
);

CREATE INDEX IF NOT EXISTS idx_estate_transactions_property_id
ON estate_transactions (property_id);

ALTER TABLE estate_transactions
DROP CONSTRAINT IF EXISTS fk_estate_transactions_property_id;

ALTER TABLE estate_transactions
ADD CONSTRAINT fk_estate_transactions_property_id
FOREIGN KEY (property_id)
REFERENCES estate_properties (id);
