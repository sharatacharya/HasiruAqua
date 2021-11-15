module.exports = {
    definition: `
    input PatientQueryWithEmailInput {
      email: String!
    }
    `,
    query: `
      queryPatient(where: PatientQueryWithEmailInput!): [Post]
    `,
    resolver: {
      Query: {
        queryPatient: {
          description: 'Query Patient With Email Address',
          resolver: 'application::patient.patient.queryPatient',
        }
      },
    },
  };