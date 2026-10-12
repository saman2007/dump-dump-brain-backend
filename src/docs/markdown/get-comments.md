An API endpoint to get comments for a specific thought dump with cursor-based pagination.

- **Top-level comments**: By default (when `replyingTo` query param is not passed), returns top-level comments for the dump sorted newest first.
- **Replies / Thread**: Pass `replyingTo=<commentId>` to retrieve replies belonging to a specific comment.
- **Cursor Pagination**: Pass the `nextCursor` value received from a previous response as the `cursor` query parameter to load the next page of comments.
