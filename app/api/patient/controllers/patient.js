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
  queryPatient: async ctx => {
    // const id = ctx.params.id;
    
    // console.log("In query Patient");
    const email = decodeURIComponent(ctx.request.url.split("email=")[1]);
    // console.log(email);
    const patient = await strapi.query('patient').find({ patientEmailAddress: email });
    // console.log(patient);
    return sanitizeEntity(patient.toJSON 
      ? patient.toJSON() : patient, {
      model: strapi.query('patient').model,
    });;
  },
  queryUser: async ctx => {
    // const id = ctx.params.id;
    const users = await strapi.plugins['users-permissions'].services.user.fetchAll();
		
    // console.log("In query User ctx:", ctx);
    const email = decodeURIComponent(ctx.request.url.split("email=")[1]);
    // console.log(email);
    const ctxUser = users.filter(user => user.email === email);
    console.log(ctxUser);
    return sanitizeEntity(ctxUser, {
      model: strapi.query('user', 'users-permissions').model,
    });;
    // console.log(email);
    // const user = await strapi.query('user').find({ email: email });
    // console.log(patient);
    
    // return sanitizeEntity(user, {
    //   model: strapi.query('user', 'users-permissions').model,
    // });;
  },
};