'use strict';
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const {
	parseMultipartData,
	sanitizeEntity
} = require('strapi-utils');

const axios = require('axios');
const qs = require('qs')
var ticket = 0;
var TGT = 0;
var apiKey = 'ad607547-6cda-4711-acea-ecd3b73bd36c';

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
        let codes = ctx.request.body.healthProfileCodes.split('+');
        let terms = ctx.request.body.healthProfile.split('+');
        for (let index = 0; index < codes.length; index++) {
            const cui = codes[index];
            if(cui.includes('undefined')) {
                let searchTerm = terms[index];
                console.log(searchTerm);

                axios({
                    method: 'post',
                    url: 'https://utslogin.nlm.nih.gov/cas/v1/api-key',
                  data: qs.stringify({
                    apikey: apiKey
                  }),
                  headers: {
                    'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
                  }
                }).then(function(response) {
                    // console.log(response.data)
                    var myArray = response.data.match("api-key/(.*)\" method=");
                    TGT = myArray[1];
                    // console.log(TGT);
                    axios({
                        method: 'post',
                        url: 'https://utslogin.nlm.nih.gov/cas/v1/api-key/'+TGT,
                      data: qs.stringify({
                        service: 'http://umlsks.nlm.nih.gov'
                      }),
                      headers: {
                        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
                      }
                    }).then(function(response) {
                        // console.log(response.data)
                        ticket = response.data;
                        axios({
                            method: 'get',
                            url: 'https://uts-ws.nlm.nih.gov/rest/search/current?string='+ searchTerm + '&ticket='+ticket
                        }).then(function(response) {
                            // console.log(response.data.result['results']);
                            for (let index = 0; index < response.data.result['results'].length; index++) {
                              const element = response.data.result['results'][index];
                              var obj = {"CUICode": element.ui, "CUIName": element.name, "CUIRootSource": element.rootSource };
                              strapi.query('medical-terms').create(obj);
                            }
                            entity = "";
                            var item = response.data.result['results'].filter(res => res.name.toString().toLowerCase() === searchTerm.toString().toLowerCase());
                            if (item.length > 0) {
                                ctx.request.body.healthProfileCodes = ctx.request.body.healthProfileCodes.replace('undefined', item[0].ui);
                                ctx.request.body.healthProfile = ctx.request.body.healthProfile.replace(searchTerm, item[0].name);
                            } else {
                              ctx.request.body.healthProfileCodes = ctx.request.body.healthProfileCodes.replace('undefined', response.data.result['results'][0].ui);
                                ctx.request.body.healthProfile = ctx.request.body.healthProfile.replace(searchTerm, response.data.result['results'][0].name);
                            }
                        }).catch(function(error) {
                            console.log(error)
                          })
                        }).catch(function(error) {
                            console.log(error)
                        })
                    }).catch(function(error) {
                    console.log(error)
                })
            }
        }
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