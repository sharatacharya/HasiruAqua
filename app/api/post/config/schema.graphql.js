module.exports = {
    definition: `
    input PostsQueryWithUserIDInput {
      userid: ID!
    }
    `,
    query: `
      queryPosts(where: PostsQueryWithUserIDInput!): [Post]
    `,
    resolver: {
      Query: {
        queryPosts: {
          description: 'Query Posts',
          resolver: 'application::post.post.queryPostsWithUserId',
        }
      },
    },
  };