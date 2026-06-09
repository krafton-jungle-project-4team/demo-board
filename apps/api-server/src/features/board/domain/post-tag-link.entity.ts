import { Entity, PrimaryColumn } from "typeorm";

@Entity("post_tag_links")
export class PostTagLinkEntity {
    @PrimaryColumn({ name: "post_id", type: "text" })
    postId!: string;

    @PrimaryColumn({ name: "tag_id", type: "text" })
    tagId!: string;
}
