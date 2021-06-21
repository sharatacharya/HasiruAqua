'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */
module.exports = {
	/**
	 * Triggered before user creation.
	 */
	lifecycles: {
		async afterCreate(data) {
			console.log(data);
			// const patientUser = await strapi.query('patient').find();
		},
	},
};
