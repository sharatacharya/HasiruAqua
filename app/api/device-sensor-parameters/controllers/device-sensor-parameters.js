'use strict';
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
 const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
  uploadParams: async ctx => {
    try {
    	// const id = ctx.params.id;
    
    	//console.log(ctx.request.url);
    	const farmid = ctx.request.url.split("farmID=").pop().split("&")[0];
	//const mySubString = ctx.request.url.substring(ctr.request.url.indexOf("farm=") + 1, ctr.request.url.lastIndexOf("&"));
    	const deviceid = ctx.request.url.split("deviceID=").pop().split("&")[0];
    	const ph = ctx.request.url.split("ph=").pop().split("&")[0];
    	const tds = ctx.request.url.split("tds=").pop().split("&")[0];
    	const pondTemp = ctx.request.url.split("pondTemp=").pop().split("&")[0];
    	const surfaceTemp = ctx.request.url.split("surfaceTemp=").pop().split("&")[0];
	const dissolvedOxygen = ctx.request.url.split("do=").pop().split("&")[0];
	const nitrite = ctx.request.url.split("nitrite=").pop().split("&")[0];
	const lightIntensity = ctx.request.url.split("lightIntensity=").pop().split("&")[0];
    	console.log("farmid", farmid);
    	console.log("deviceid", deviceid);
    	console.log("ph", ph);
    	console.log("tds", tds);
    	console.log("pondTemp", pondTemp);
    	console.log("surfaceTemp", surfaceTemp);
	console.log("nitrite", nitrite);
	console.log("lightIntensity", lightIntensity);
	console.log("dissolvedOxygen", dissolvedOxygen);
    	//const posts = await strapi.query('post').find({ users_permissions_user: farmid });
    	//console.log(posts);
    	//return sanitizeEntity(posts.toJSON 
    	//  ? posts.toJSON() : posts, {
    	//  model: strapi.query('post').model,
    	//});;
	var today = new Date();
	const entity = await strapi.query("device-sensor-parameters").create({farmID: farmid, deviceID: deviceid, 
		logTimeStamp: today, surfaceTemp: surfaceTemp, pondTemp: pondTemp, tds: tds, ph: ph});
	console.log(entity);
	return true;
    } catch (err) {
          ctx.badRequest("uploadParams controller error", { moreDetails: err });
    }
  },
};
