An API endpoint that returns a paginated list of users that the specified user ID is following using cursor-based pagination.  
To load the next batch of followed users, pass the `nextCursor` value returned in the response as the `cursor` query parameter on subsequent requests.  
The limit of items is `10`.