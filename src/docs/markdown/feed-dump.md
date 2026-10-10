An API to fetch the authenticated user's personalized thought dump feed.

# Implementation Details of Dumps Feed
This API returns a feed of 15 dumps. These 15 dumps consist of three categories: 9 `Trending Dumps`, 3 `Cold Start Dumps`, and 3 `User Following Dumps`.

Here are the details for each category:

- `Trending Dumps`: Dumps that have the highest Hot Scores and more than 50 views.

`Cold Start Dumps`: To give newly created dumps a chance to trend, the API includes 3 dumps created within the last 2 days that have 50 or fewer views. Once a dump is older than 2 days or exceeds 50 views, it becomes eligible for Trending Dumps based on its Hot Score.

`User Following Dumps`: Dumps created by accounts the user follows.

# Additional Notes
- If fewer than 15 dumps are retrieved, the API fills the remainder with random dumps so the feed is never empty.

- By default, the API prioritizes dumps the user has not yet viewed. If there are no unviewed dumps left, it will backfill with previously viewed dumps.

- A dump viewed more than 15 days ago is eligible to appear in the user's feed again.