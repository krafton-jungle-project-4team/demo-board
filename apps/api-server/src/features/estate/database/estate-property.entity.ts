import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("estate_properties")
@Index("idx_estate_properties_property_key_unique", ["propertyKey"], { unique: true })
@Index("idx_estate_properties_pnu_unique", ["pnu"], { unique: true, where: "pnu IS NOT NULL" })
@Index("idx_estate_properties_district_legal_dong", ["districtName", "legalDongName"])
export class EstatePropertyEntity {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id!: number;

    @Column({ name: "property_key", type: "varchar", length: 30 })
    propertyKey!: string;

    @Column({ type: "varchar", length: 19, nullable: true })
    pnu!: string | null;

    @Column({ name: "district_code", type: "varchar", length: 5 })
    districtCode!: string;

    @Column({ name: "district_name", type: "text" })
    districtName!: string;

    @Column({ name: "legal_dong_code", type: "varchar", length: 5 })
    legalDongCode!: string;

    @Column({ name: "legal_dong_name", type: "text" })
    legalDongName!: string;

    @Column({ name: "lot_type_code", type: "varchar", length: 10 })
    lotTypeCode!: string;

    @Column({ name: "lot_type_name", type: "text", nullable: true })
    lotTypeName!: string | null;

    @Column({ name: "main_lot_number", type: "varchar", length: 10 })
    mainLotNumber!: string;

    @Column({ name: "sub_lot_number", type: "varchar", length: 10 })
    subLotNumber!: string;

    @Column({ name: "parcel_address", type: "text" })
    parcelAddress!: string;

    @Column({ name: "building_names", type: "text", array: true })
    buildingNames!: string[];

    @Column({ name: "transaction_count", type: "int" })
    transactionCount!: number;

    @Column({ type: "numeric", precision: 10, scale: 7, nullable: true })
    latitude!: number | null;

    @Column({ type: "numeric", precision: 10, scale: 7, nullable: true })
    longitude!: number | null;

    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
