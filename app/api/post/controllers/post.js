'use strict';
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
 const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
/**
   * Create a record.
   *
   * @return {Object}
   */
    async create(ctx) {
        // const patientUser = await strapi.query('patient').findOne({ patientEmailAddress: ctx.state.user.email });
        //console.log(ctx.state.user);
        const posts = await strapi.query('post').find();
        let entity;
        var inputData = ctx.request.body.data;
        inputData = inputData.replace("{\"post_Text\":\"", '');
        inputData = inputData.replace("\"}", '');
        inputData = inputData.replace(/<(.|\n)*?>/g, '');
        inputData = inputData.replace(/&#160;+/g, " ");
        inputData = inputData.replace(/&nbsp;+/g, " ");
        // console.log(str123);
        console.log("inputData: ", inputData);

        //check with all posts in the database and do a similarity scoring. 
        //Depening on the similarity scoring we can send back the suggestion posts 
        //similar to the post asked.
        posts.forEach(post => {
          var comparisonPost = post.post_Text;
          comparisonPost = comparisonPost.replace(/<(.|\n)*?>/g, '');
          comparisonPost = comparisonPost.replace(/&#160;+/g, " ");
          comparisonPost = comparisonPost.replace(/&nbsp;+/g, " ");
          console.log("comparisonPost from DB: ", comparisonPost);
          var s1 = inputData.split(' ');
          var s2 = comparisonPost.split(' ');
          let similarity = require('sentence-similarity')
          let similarityScore = require('similarity-score')
  
          let winkOpts = { f: similarityScore.metaphoneDl, options : {threshold: 0} }
  
          console.log(similarity(s1,s2,winkOpts)) 
          
        });
        
        
    if (ctx.is('multipart')) {
        const { data, files } = parseMultipartData(ctx);
        data.users_permissions_user = ctx.state.user;
        // console.log("Data: ", data);
        // console.log("Files: ", files);
        entity = await strapi.services.post.create(data, { files });
    } else {
        ctx.request.body.users_permissions_user = ctx.state.user;
        // console.log("ctx.request.body: ", ctx.request.body);
        entity = await strapi.services.post.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.post });
  },
  /**
   * Update a record.
   *
   * @return {Object}
   */

   async update(ctx) {
    const { id } = ctx.params;
    //console.log(id);
    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.post.update({ id }, data, {
        files,
      });
    } else {
      entity = await strapi.services.post.update({ id }, ctx.request.body);
    }

    return sanitizeEntity(entity, { model: strapi.models.post });
  },

  queryPostsWithUserId: async ctx => {
    // const id = ctx.params.id;
    
    //console.log(ctx.request.url);
    const userid = ctx.request.url.split("userid=")[1];
    //console.log(userid);
    const posts = await strapi.query('post').find({ users_permissions_user: userid });
    //console.log(posts);
    return sanitizeEntity(posts.toJSON 
      ? posts.toJSON() : posts, {
      model: strapi.query('post').model,
    });;
  },
};
