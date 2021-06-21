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
		//console.log(ctx.state.user);
		const questions = await strapi.query('question').find();
		let entity;
		var inputData = ctx.request.body.data;
		inputData = inputData.replace("{\"question_Text\":\"", '');
		inputData = inputData.replace("\"}", '');
		inputData = inputData.replace(/<(.|\n)*?>/g, '');
		inputData = inputData.replace(/&#160;+/g, " ");
		inputData = inputData.replace(/&nbsp;+/g, " ");
		// console.log(str123);
		console.log("inputData: ", inputData);

		//check with all questions in the database and do a similarity scoring.
		//Depening on the similarity scoring we can send back the suggestion questions
		//similar to the question asked.
		questions.forEach(question => {
			var comparisonQuestion = question.question_Text;
			comparisonQuestion = comparisonQuestion.replace(/<(.|\n)*?>/g, '');
			comparisonQuestion = comparisonQuestion.replace(/&#160;+/g, " ");
			comparisonQuestion = comparisonQuestion.replace(/&nbsp;+/g, " ");
			console.log("comparisonQuestion from DB: ", comparisonQuestion);
			var s1 = inputData.split(' ');
			var s2 = comparisonQuestion.split(' ');
			let similarity = require('sentence-similarity')
				let similarityScore = require('similarity-score')

				let winkOpts = {
				f: similarityScore.metaphoneDl,
				options: {
					threshold: 0
				}
			}

			console.log(similarity(s1, s2, winkOpts))

		});

		if (ctx.is('multipart')) {
			const {
				data,
				files
			} = parseMultipartData(ctx);
			data.users_permissions_user = ctx.state.user;
			console.log("data: ", data);
			// console.log("Data: ", data);
			// console.log("Files: ", files);
			entity = await strapi.services.question.create(data, {
					files
				});
		} else {
			ctx.request.body.users_permissions_user = ctx.state.user;
			console.log("ctx.request.body: ", ctx.request.body);
			entity = await strapi.services.question.create(ctx.request.body);
		}
		return sanitizeEntity(entity, {
			model: strapi.models.question
		});
	},
	/**
	 * Update a record.
	 *
	 * @return {Object}
	 */

	async update(ctx) {
		const {
			id
		} = ctx.params;
		//console.log(id);
		let entity;
		if (ctx.is('multipart')) {
			const {
				data,
				files
			} = parseMultipartData(ctx);
			entity = await strapi.services.question.update({
					id
				}, data, {
					files,
				});
		} else {
			entity = await strapi.services.question.update({
					id
				}, ctx.request.body);
		}

		return sanitizeEntity(entity, {
			model: strapi.models.question
		});
	},

	queryQuestionsWithUserId: async ctx => {
		// const id = ctx.params.id;

		//console.log(ctx.request.url);
		const userid = ctx.request.url.split("userid=")[1];
		//console.log(userid);
		const questions = await strapi.query('question').find({
				users_permissions_user: userid
			});
		//console.log(questions);
		return sanitizeEntity(questions.toJSON
			 ? questions.toJSON() : questions, {
			model: strapi.query('question').model,
		}); ;
	},
};
