An API endpoint that returns a paginated list of users who follow the specified user ID using cursor-based pagination.  
To load the next batch of followers, pass the `nextCursor` value returned in the response as the `cursor` query parameter on subsequent requests.  
The limit of items is `10`.