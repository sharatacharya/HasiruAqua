module.exports = {
    definition: `
    input QuestionsQueryWithUserIDInput {
      userid: ID!
    }
    `,
    query: `
      queryQuestions(where: QuestionsQueryWithUserIDInput!): [Question]
    `,
    resolver: {
      Query: {
        queryQuestions: {
          description: 'Query Questions',
          resolver: 'application::question.question.queryQuestionsWithUserId',
        }
      },
    },
  };