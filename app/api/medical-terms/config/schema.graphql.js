module.exports = {
  query: `
    cuiCount(where: JSON): Int!
  `,
  resolver: {
    Query: {
      cuiCount: {
        description: 'Return the count of CUIs on HealthPeers',
        resolverOf: 'application::medical-terms.medical-terms.count',
        resolver: async (obj, options, ctx) => {
          //console.log(strapi.api.medical-terms.services.medical-terms.count());
		return await strapi.query('medical-terms').count();
        },
      },
    },
  },
};
