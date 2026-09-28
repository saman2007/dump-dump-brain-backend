An API endpoint that returns a paginated list of users that the specified user ID is following using cursor-based pagination.

To load the next batch of followed users, pass `nextCursor.createdAt` as the `cursor` parameter and `nextCursor.id` as the `cursorId` parameter on subsequent requests.
The limit of items is `10`.