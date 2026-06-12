export const POST_QUERY_TABLES = {
    posts: "posts",
    postTags: "post_tags",
    tags: "tags"
} as const;

export const POST_QUERY_COLUMNS = {
    posts: {
        id: "id",
        title: "title",
        content: "content",
        createdAt: "created_at"
    },
    postTags: {
        postId: "post_id",
        tagId: "tag_id"
    },
    tags: {
        id: "id",
        name: "name"
    }
} as const;

export const POST_QUERY_TRIGRAM_INDEXES = {
    postTitle: "idx_posts_title_trgm",
    postContent: "idx_posts_content_trgm",
    tagName: "idx_tags_name_trgm"
} as const;
