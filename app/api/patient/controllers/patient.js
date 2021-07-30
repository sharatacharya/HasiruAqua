'use strict';
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const {
	parseMultipartData,
	sanitizeEntity
} = require('strapi-utils');

module.exports = {
	/**
	 * Create a record.
	 *
	 * @return {Object}
	 */
	async create(ctx) {
		// const patientUser = await strapi.query('patient').findOne({ patientEmailAddress: ctx.state.user.email });
		// console.log(ctx);
		// const questions = await strapi.query('question').find();


        let entity;
        if (ctx.is('multipart')) {
          const {
            data,
            files
          } = parseMultipartData(ctx);
          data.users_permissions_user = ctx.state.user;
          entity = await strapi.services.patient.create(data, {
              files
            });
        } else {
          ctx.request.body.users_permissions_user = ctx.state.user;
          console.log("ctx.request.body: ", ctx.request.body);
          entity = await strapi.services.patient.create(ctx.request.body);
        }
        return sanitizeEntity(entity, {
          model: strapi.models.patient
        });
  },
};