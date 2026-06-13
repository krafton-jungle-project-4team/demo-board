CREATE TABLE IF NOT EXISTS estate_transactions (
    id bigserial PRIMARY KEY,
    source_row_number int NOT NULL,
    receipt_year int NOT NULL,
    district_code varchar(5) NOT NULL,
    district_name text NOT NULL,
    legal_dong_code varchar(5) NOT NULL,
    legal_dong_name text NOT NULL,
    lot_type_code varchar(10),
    lot_type_name text,
    main_lot_number varchar(10),
    sub_lot_number varchar(10),
    building_name text,
    contract_date date NOT NULL,
    deal_amount_10k_krw int NOT NULL,
    building_area_square_meter numeric(12, 6) NOT NULL,
    land_area_square_meter numeric(12, 6),
    floor int,
    right_type text,
    canceled_at date,
    built_year int NOT NULL,
    building_use text NOT NULL,
    report_type text NOT NULL,
    brokered_agent_sgg_name text
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_estate_transactions_source_row_number_unique
ON estate_transactions (source_row_number);

CREATE INDEX IF NOT EXISTS idx_estate_transactions_contract_date
ON estate_transactions (contract_date);

CREATE INDEX IF NOT EXISTS idx_estate_transactions_district_legal_dong
ON estate_transactions (district_name, legal_dong_name);

CREATE INDEX IF NOT EXISTS idx_estate_transactions_building_use
ON estate_transactions (building_use);
