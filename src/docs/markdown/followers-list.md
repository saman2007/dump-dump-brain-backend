An API endpoint that returns a paginated list of users who follow the specified user ID using cursor-based pagination.

To load the next batch of followers, pass `nextCursor.createdAt` as the `cursor` parameter and `nextCursor.id` as the `cursorId` parameter on subsequent requests.
The limit of items is `10`.