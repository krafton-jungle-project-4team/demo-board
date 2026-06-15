import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("estate_transactions")
@Index("idx_estate_transactions_source_row_number_unique", ["sourceRowNumber"], { unique: true })
@Index("idx_estate_transactions_contract_date", ["contractDate"])
@Index("idx_estate_transactions_district_legal_dong", ["districtName", "legalDongName"])
@Index("idx_estate_transactions_building_use", ["buildingUse"])
@Index("idx_estate_transactions_property_id", ["propertyId"])
export class EstateTransactionEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id!: number;

    @Column({ name: "source_row_number", type: "int" })
    sourceRowNumber!: number;

    @Column({ name: "receipt_year", type: "int" })
    receiptYear!: number;

    @Column({ name: "district_code", type: "varchar", length: 5 })
    districtCode!: string;

    @Column({ name: "district_name", type: "text" })
    districtName!: string;

    @Column({ name: "legal_dong_code", type: "varchar", length: 5 })
    legalDongCode!: string;

    @Column({ name: "legal_dong_name", type: "text" })
    legalDongName!: string;

    @Column({ name: "lot_type_code", type: "varchar", length: 10, nullable: true })
    lotTypeCode!: string | null;

    @Column({ name: "lot_type_name", type: "text", nullable: true })
    lotTypeName!: string | null;

    @Column({ name: "main_lot_number", type: "varchar", length: 10, nullable: true })
    mainLotNumber!: string | null;

    @Column({ name: "sub_lot_number", type: "varchar", length: 10, nullable: true })
    subLotNumber!: string | null;

    @Column({ name: "building_name", type: "text", nullable: true })
    buildingName!: string | null;

    @Column({ name: "contract_date", type: "date" })
    contractDate!: Date;

    @Column({ name: "deal_amount_10k_krw", type: "int" })
    dealAmount10kKrw!: number;

    @Column({ name: "building_area_square_meter", type: "numeric", precision: 12, scale: 6 })
    buildingAreaSquareMeter!: number;

    @Column({ name: "land_area_square_meter", type: "numeric", precision: 12, scale: 6, nullable: true })
    landAreaSquareMeter!: number | null;

    @Column({ type: "int", nullable: true })
    floor!: number | null;

    @Column({ name: "right_type", type: "text", nullable: true })
    rightType!: string | null;

    @Column({ name: "canceled_at", type: "date", nullable: true })
    canceledAt!: Date | null;

    @Column({ name: "built_year", type: "int" })
    builtYear!: number;

    @Column({ name: "building_use", type: "text" })
    buildingUse!: string;

    @Column({ name: "report_type", type: "text" })
    reportType!: string;

    @Column({ name: "brokered_agent_sgg_name", type: "text", nullable: true })
    brokeredAgentSggName!: string | null;

    @Column({ name: "property_id", type: "bigint", nullable: true })
    propertyId!: number | null;
}
