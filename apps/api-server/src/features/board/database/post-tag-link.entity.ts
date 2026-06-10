import { Entity, PrimaryColumn } from "typeorm";

@Entity("post_tag_links")
export class PostTagLinkEntity {
    @PrimaryColumn({ name: "post_id", type: "bigint" })
    postId!: number;

    @PrimaryColumn({ name: "tag_id", type: "bigint" })
    tagId!: number;
}
