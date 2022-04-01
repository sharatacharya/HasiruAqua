module.exports = {
    definition: `
    input PatientQueryWithEmailInput {
      email: String!
    },
    type role {
      id: ID
      name: String
    },
    type user {
      id: ID
      username: String
      email: String
      role: role
    }
    `,
    query: `
      queryPatient(where: PatientQueryWithEmailInput!): [Post],
      queryUser(where: PatientQueryWithEmailInput!): [user]
    `,
    resolver: {
      Query: {
        queryPatient: {
          description: 'Query Patient With Email Address',
          resolver: 'application::patient.patient.queryPatient',
        },
        queryUser: {
          description: 'Query Patient With Email Address',
          resolver: 'application::patient.patient.queryUser',
        }
      },
    },
  };