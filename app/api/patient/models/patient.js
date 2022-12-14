'use strict';
var Jaccard = require("jaccard-index");
var jaccard = Jaccard();
 
var medicalHXTerms = [];
var presentUserHXTerms = [];
var medicalHxScore = 0;
const axios = require('axios');
const qs = require('qs');
// const patient = require('../models/patient');
var ctxPatientData;
var ticket = 0;
var TGT = 0;
var apiKey = 'ad607547-6cda-4711-acea-ecd3b73bd36c';
var {
	id
} = '';

function circularLinkedList() {
  //Node
  let Node = function(element) {
    this.element = element;
    this.next = null;
  }

  let length = 0;
  let head = null;

  //Other methods go here

  this.getElementAt = function(index) {
    if(index >= 0 && index <= length){
      let node = head;
      for(let i = 0; i < index && node != null; i++){
        node = node.next;
      }
      return node;
    }
    return undefined;
  }

  //Add new node
  this.append = function(element) {
    //Create new node
    const node = new Node(element);
    let current;
    
    //If head is empty
    //Then make new node head
    if(head === null){
      head = node;
    }else{
      //Else add the new node as the next node
      //And mark the next of new node to the head
      current = this.getElementAt(length - 1);
      current.next = node;
    }
    
    node.next = head;
    length++;
  }
}





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
			
			const users = await strapi.plugins['users-permissions'].services.user.fetchAll();
			const ctxUser = users.filter(user => user.email === data.patientEmailAddress);
			ctxPatientData = data;
			console.log("After Create Data: ", ctxPatientData);
			id = data.id;
			// console.log(ctxUser[0].id);
			//Setting Default community to 5. Multiple Sclerosis.
			strapi.query('community-patients-link').create({patientId: ctxUser[0].id, communityId: 5});
			try{
				let codes = ctxPatientData.healthProfileCodes.split('+');
				  let terms = ctxPatientData.healthProfile.split('+');
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
									  console.log(response.data.result['results']);
									  for (let index = 0; index < response.data.result['results'].length; index++) {
										const element = response.data.result['results'][index];
										var obj = {"CUICode": element.ui, "CUIName": element.name, "CUIRootSource": element.rootSource };
										(async () => {
											await strapi.query('medical-terms').create(obj);
										  })();
									  }
									  var item = response.data.result['results'].filter(res => res.name.toString().toLowerCase() === searchTerm.toString().toLowerCase());
									  console.log(item);
									  if (item.length > 0) {
										ctxPatientData.healthProfileCodes = ctxPatientData.healthProfileCodes.replace('undefined', item[0].ui);
										ctxPatientData.healthProfile = ctxPatientData.healthProfile.replace(searchTerm, item[0].name);
									  } else {
										ctxPatientData.healthProfileCodes = ctxPatientData.healthProfileCodes.replace('undefined', response.data.result['results'][0].ui);
										ctxPatientData.healthProfile = ctxPatientData.healthProfile.replace(searchTerm, response.data.result['results'][0].name);
									  }
									  (async () => {
										await strapi.services.patient.update({
											id
										  }, ctxPatientData);
									  })();
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
				
				 } catch(err) {
				console.log(err)
				 }

			const patientUser = await strapi.query('patient').find();
			// console.log(patientUser);
			if (+(patientUser.length) > 1) {
				
				// console.log(patientUser);
				// console.log(users);
				const educationLevelLegend = await strapi.query('education-level-legend').find();
				const familyIncomeLevelLegend = await strapi.query('family-income-level-legend').find();
				// console.log(educationLevelLegend);
				// console.log(familyIncomeLevelLegend);
				// Deleting all previous peerlist matches. 
				// await strapi.query('peer-list').delete();
				//const peerList = await strapi.query('peer-list').find();
				//const peerListEntry = {
				//	patientId: 0,
				//	peerId: 0,
				//	ageSimilarityScore: "0",
				//	genderSimilarityScore: "0",
				//	raceSimilarityScore: "0",
				//	ethnicSimilarityScore: "0",
				//	educationSimilarityScore: "0",
				//	healthInsuranceSimilarityScore: "0",
				//	adjustedIncomeSimilarityScore: "0",
				//	medicalHxScore: "0"
				//} 
				//strapi.query('peer-list').model;
				let patients = [];
				patientUser.forEach(element => {
					const userDOB = new Date(element.dateOfBirth);
					const today = new Date();

					const msDiff = today - userDOB;
					const age = Math.floor(msDiff / (365.25 * 24 * 60 * 60 * 1000));
					var patientData = {
						Id: element.id,
						Name: element.personDetail.displayName,
						GenderIdentity: element.personDetail.genderIdentity,
						DateOfBirth: element.dateOfBirth,
						Age: age,
						Race: element.race,
						Ethnicity: element.ethnicity,
						HouseHoldSize: element.peopleHousehold,
						EducationLevel: element.educationalLevel,
						FamilyIncomeLevel: element.familyIncomeLevel,
						Insurance: element.insurance,
						MedicalHxTerm: element.healthProfile
					}
					patients.push(patientData);
				});
				// for (let user = 0; user < patients.length; user++) {
					// const element = patients[user];
					// var presentPatient = patients.filter(patient => patient.Name === element.Name);
					var presentPatient = patients.filter(patient => patient.Name === ctxPatientData.personDetail.displayName);
					console.log("Present Patient from ctx: ", presentPatient);
					var presentUser = users.filter(user => user.username === presentPatient[0].Name);
					presentPatient[0].Id = presentUser[0].id; //replacing patientId by userid


					console.log("-----------PeerList Matching Begins-------------- ");
				patients.forEach(patient => {
					presentUser = users.filter(user => user.username === patient.Name);
					//console.log(presentUser);
					var ageSimilarityScore = 0;
					var raceSimilarityScore = 0;
					var ethnicitySimilarityScore = 0;
					var genderSimilarityScore = 0;
					var adjustHouseholdIncomeSimilarityScore = 0;
					var healthInsuranceSimilarityScore = 0;
					if (patient.Name !== presentPatient[0].Name) {
						if (parseInt(patient.Age) !== parseInt(presentPatient[0].Age)) {
							var ageMax = Math.max(parseInt(patient.Age), parseInt(presentPatient[0].Age));
							var ageDifference = Math.abs(parseInt(patient.Age) - parseInt(presentPatient[0].Age));
							ageSimilarityScore = 0;
							ageSimilarityScore = (1 - (ageDifference / ageMax));
							//console.log("Age Max between users: ", ageMax);
						} else {
							const newUserDOB = new Date(presentPatient[0].DateOfBirth);
							const today1 = new Date();
							const msDiff1 = today1 - newUserDOB;
							const currentUserDOB = new Date(patient.DateOfBirth);
							const msCurrentDiff = today1 - currentUserDOB;

							const age1 = (msDiff1 / (365.25 * 24 * 60 * 60 * 1000));
							const currentage = (msCurrentDiff / (365.25 * 24 * 60 * 60 * 1000));
							var ageUserMax = Math.max(age1, currentage);
							var ageUserDifference = Math.abs(age1 - currentage);
							ageSimilarityScore = (1 - (ageUserDifference / ageUserMax));
						}
						if (patient.Race === presentPatient[0].Race) {
							raceSimilarityScore = 1;
						}
						if (patient.Ethnicity === presentPatient[0].Ethnicity) {
							ethnicitySimilarityScore = 1;
						}
						if (patient.GenderIdentity === presentPatient[0].GenderIdentity) {
							genderSimilarityScore = 1;
						}
						if (patient.Insurance === presentPatient[0].Insurance || presentPatient[0].Insurance === 'MC'
							|| presentPatient[0].Insurance === 'MA'
							|| presentPatient[0].Insurance === 'MG') {
							healthInsuranceSimilarityScore = 1;
						}
						
						//check with all patients MeidcalProfileCodes in the database 
						//and do a jaccard similarity scoring amongst them.
						medicalHXTerms = patient.MedicalHxTerm.split('+');
						presentUserHXTerms = presentPatient[0].MedicalHxTerm.split('+');
						medicalHxScore = jaccard.index(medicalHXTerms, presentUserHXTerms);

						var userEducationLevel = educationLevelLegend.filter(level => level.Value === patient.EducationLevel);
						var newUserEducationLevel = educationLevelLegend.filter(level => level.Value === presentPatient[0].EducationLevel);
						var educationEuclideanDistance = Math.sqrt(Math.pow
								((( + (userEducationLevel[0].id)) - ( + (newUserEducationLevel[0].id))), 2));
						var userHouseholdIncome = familyIncomeLevelLegend.filter(level => level.Value === patient.FamilyIncomeLevel);
						var newUserHouseholdIncome = familyIncomeLevelLegend.filter(level => level.Value === presentPatient[0].FamilyIncomeLevel);
						var userIncomeUpperLimit;
						userIncomeUpperLimit = userHouseholdIncome[0].Name.split('- $');
						if (userIncomeUpperLimit.length > 1) {
							userIncomeUpperLimit[1] = userIncomeUpperLimit[1].replace(',', '');
						} else {
							userIncomeUpperLimit = userHouseholdIncome[0].Name.split('< $');
							if (userIncomeUpperLimit.length > 1) {
								userIncomeUpperLimit[1] = userIncomeUpperLimit[1].replace(',', '');
							} else {
								userIncomeUpperLimit = userHouseholdIncome[0].Name.split('$');
								userIncomeUpperLimit[1] = userIncomeUpperLimit[1].replace('+', '');
								userIncomeUpperLimit[1] = userIncomeUpperLimit[1].replace(',', '');
							}
						}
						var newUserIncomeUpperLimit;
						newUserIncomeUpperLimit = newUserHouseholdIncome[0].Name.split('- $');
						if (newUserIncomeUpperLimit.length > 1) {
							newUserIncomeUpperLimit[1] = newUserIncomeUpperLimit[1].replace(',', '');
						} else {
							newUserIncomeUpperLimit = newUserHouseholdIncome[0].Name.split('< $');
							if (newUserIncomeUpperLimit.length > 1) {
								newUserIncomeUpperLimit[1] = newUserIncomeUpperLimit[1].replace(',', '');
							} else {
								newUserIncomeUpperLimit = newUserHouseholdIncome[0].Name.split('$');
								newUserIncomeUpperLimit[1] = newUserIncomeUpperLimit[1].replace('+', '');
								newUserIncomeUpperLimit[1] = newUserIncomeUpperLimit[1].replace(',', '');
							}
						}
						var userAdjustedHHIncome = ((+userIncomeUpperLimit[1]) / Math.pow(+patient.HouseHoldSize, 0.5));
						var newUserAdjustedHHIncome = ((+newUserIncomeUpperLimit[1]) / Math.pow(+presentPatient[0].HouseHoldSize, 0.5));
						console.log('userAdjustedHHIncome: ', userAdjustedHHIncome);
						console.log('newUserAdjustedHHIncome: ', newUserAdjustedHHIncome);
						var absAHHIncome = Math.abs((+userAdjustedHHIncome) - (+newUserAdjustedHHIncome));
						var maxAHHIncome = Math.max((+userAdjustedHHIncome), (+newUserAdjustedHHIncome));
						console.log('absAHHIncome: ', absAHHIncome);
						console.log('maxAHHIncome: ', maxAHHIncome);
						adjustHouseholdIncomeSimilarityScore = (absAHHIncome / maxAHHIncome);
						console.log("New User Name: ", presentPatient[0].Name);
						console.log("New User DateOfBirth: ", presentPatient[0].DateOfBirth);
						console.log("New User Race: ", presentPatient[0].Race);
						console.log("New User Gender: ", presentPatient[0].GenderIdentity);
						console.log("New User Ethnicity: ", presentPatient[0].Ethnicity);
						console.log("New User Family Income: ", presentPatient[0].FamilyIncomeLevel);
						console.log("New User Education: ", presentPatient[0].EducationLevel);
						console.log("New User Insurance: ", presentPatient[0].Insurance);
						console.log("User Name: ", patient.Name);
						console.log("User DateofBirth: ", patient.DateOfBirth);
						console.log("User Family Income: ", patient.FamilyIncomeLevel);
						console.log("User Education: ", patient.EducationLevel);
						console.log("User Insurance: ", patient.Insurance);
						console.log("GenderSimilarityScore: ", genderSimilarityScore);
						console.log("RaceSimilarityScore: ", raceSimilarityScore);
						console.log("EthnicitySimilarityScore: ", ethnicitySimilarityScore);
						console.log("AgeSimilarityScore: ", ageSimilarityScore);
						console.log("educationEuclideanDistance: ", educationEuclideanDistance);
						console.log("healthInsuranceSimilarityScore: ", healthInsuranceSimilarityScore);
						console.log("adjustHouseholdIncomeSimilarityScore: ", adjustHouseholdIncomeSimilarityScore);
						const overallSocioEconomicScore = ((0.33 * educationEuclideanDistance)
						+ (0.33 * adjustHouseholdIncomeSimilarityScore) + (0.33 * healthInsuranceSimilarityScore));
						const overallDemographicScore = ((0.25 * ageSimilarityScore) + (0.25 * genderSimilarityScore)
						+ (0.25 * raceSimilarityScore) + (0.25 * ethnicitySimilarityScore));
						const overallScore = (((1/3)*(+overallDemographicScore)) + ((1/6)*(+overallSocioEconomicScore)) + ((1/2)*(+medicalHxScore)));
						console.log("overallSocioEconomicScore: ", overallSocioEconomicScore);
						console.log("overallDemographicScore: ", overallDemographicScore);
						console.log("medicalHxScore: ", medicalHxScore);
						console.log("overallScore: ", overallScore);
						if(overallScore >= 0.7) {
						//console.log('peer List entry: ', peerList.attributes);
							strapi.query('peer-list').create({
											patientId: presentPatient[0].Id,
															//peerId: patient.Id,
											peerId: presentUser[0].id,
											ageSimilarityScore: ageSimilarityScore,
											genderSimilarityScore: genderSimilarityScore,
											raceSimilarityScore: raceSimilarityScore,
											ethnicSimilarityScore: ethnicitySimilarityScore,
											educationSimilarityScore: educationEuclideanDistance,
											healthInsuranceSimilarityScore: healthInsuranceSimilarityScore,
											adjustedIncomeSimilarityScore: adjustHouseholdIncomeSimilarityScore,
											medicalHxScore: medicalHxScore,
											overallSocioEconomicScore : overallSocioEconomicScore,
											overallDemographicScore : overallDemographicScore,
											overallScore: overallScore
								});
							strapi.query('peer-list').create({
										patientId: presentUser[0].id,
										peerId: presentPatient[0].Id,
										ageSimilarityScore: ageSimilarityScore,
										genderSimilarityScore: genderSimilarityScore,
										raceSimilarityScore: raceSimilarityScore,
										ethnicSimilarityScore: ethnicitySimilarityScore,
										educationSimilarityScore: educationEuclideanDistance,
										healthInsuranceSimilarityScore: healthInsuranceSimilarityScore,
										adjustedIncomeSimilarityScore: adjustHouseholdIncomeSimilarityScore,
										medicalHxScore: medicalHxScore,
										overallSocioEconomicScore : overallSocioEconomicScore,
										overallDemographicScore : overallDemographicScore,
										overallScore: overallScore
								});
						}
						console.log("-----------PeerList Itereation End-------------- ");
							
					}
				});
				// }
				// var presentPatient = patients.filter(patient => patient.Name === data.personDetail.displayName);
				// var presentUser = users.filter(user => user.username === presentPatient[0].Name);
				// presentPatient[0].Id = presentUser[0].id; //replacing patientId by userid
			}
		},
		async afterUpdate(data) {
			const users = await strapi.plugins['users-permissions'].services.user.fetchAll();
			const ctxUser = users.filter(user => user.email === data.patientEmailAddress);
			ctxPatientData = data;
			console.log("After Update Data: ", ctxPatientData);
			id = data.id;
			// console.log(ctxUser[0].id);
			//Setting Default community to 5. Multiple Sclerosis.
			strapi.query('community-patients-link').create({patientId: ctxUser[0].id, communityId: 5});
			try{
				let codes = ctxPatientData.healthProfileCodes.split('+');
				  let terms = ctxPatientData.healthProfile.split('+');
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
									  console.log(response.data.result['results']);
									  for (let index = 0; index < response.data.result['results'].length; index++) {
										const element = response.data.result['results'][index];
										var obj = {"CUICode": element.ui, "CUIName": element.name, "CUIRootSource": element.rootSource };
										(async () => {
											await strapi.query('medical-terms').create(obj);
										  })();
									  }
									  var item = response.data.result['results'].filter(res => res.name.toString().toLowerCase() === searchTerm.toString().toLowerCase());
									  console.log(item);
									  if (item.length > 0) {
										ctxPatientData.healthProfileCodes = ctxPatientData.healthProfileCodes.replace('undefined', item[0].ui);
										ctxPatientData.healthProfile = ctxPatientData.healthProfile.replace(searchTerm, item[0].name);
									  } else {
										ctxPatientData.healthProfileCodes = ctxPatientData.healthProfileCodes.replace('undefined', response.data.result['results'][0].ui);
										ctxPatientData.healthProfile = ctxPatientData.healthProfile.replace(searchTerm, response.data.result['results'][0].name);
									  }
									  (async () => {
										await strapi.services.patient.update({
											id
										  }, ctxPatientData);
									  })();
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
				
				 } catch(err) {
				console.log(err)
				 }

			const patientUser = await strapi.query('patient').find();
			// console.log(patientUser);
			if (+(patientUser.length) > 1) {
				
				// console.log(patientUser);
				// console.log(users);
				const educationLevelLegend = await strapi.query('education-level-legend').find();
				const familyIncomeLevelLegend = await strapi.query('family-income-level-legend').find();
				// console.log(educationLevelLegend);
				// console.log(familyIncomeLevelLegend);
				// Deleting all previous peerlist matches. 
				// await strapi.query('peer-list').delete();
				//const peerList = await strapi.query('peer-list').find();
				//const peerListEntry = {
				//	patientId: 0,
				//	peerId: 0,
				//	ageSimilarityScore: "0",
				//	genderSimilarityScore: "0",
				//	raceSimilarityScore: "0",
				//	ethnicSimilarityScore: "0",
				//	educationSimilarityScore: "0",
				//	healthInsuranceSimilarityScore: "0",
				//	adjustedIncomeSimilarityScore: "0",
				//	medicalHxScore: "0"
				//} 
				//strapi.query('peer-list').model;
				let patients = [];
				patientUser.forEach(element => {
					const userDOB = new Date(element.dateOfBirth);
					const today = new Date();

					const msDiff = today - userDOB;
					const age = Math.floor(msDiff / (365.25 * 24 * 60 * 60 * 1000));
					var patientData = {
						Id: element.id,
						Name: element.personDetail.displayName,
						GenderIdentity: element.personDetail.genderIdentity,
						DateOfBirth: element.dateOfBirth,
						Age: age,
						Race: element.race,
						Ethnicity: element.ethnicity,
						HouseHoldSize: element.peopleHousehold,
						EducationLevel: element.educationalLevel,
						FamilyIncomeLevel: element.familyIncomeLevel,
						Insurance: element.insurance,
						MedicalHxTerm: element.healthProfile
					}
					patients.push(patientData);
				});
				// for (let user = 0; user < patients.length; user++) {
					// const element = patients[user];
					// var presentPatient = patients.filter(patient => patient.Name === element.Name);
					var presentPatient = patients.filter(patient => patient.Name === ctxPatientData.personDetail.displayName);
					console.log("Present Patient from ctx: ", presentPatient);
					var presentUser = users.filter(user => user.username === presentPatient[0].Name);
					presentPatient[0].Id = presentUser[0].id; //replacing patientId by userid


					console.log("-----------PeerList Matching Begins-------------- ");
				patients.forEach(patient => {
					presentUser = users.filter(user => user.username === patient.Name);
					//console.log(presentUser);
					var ageSimilarityScore = 0;
					var raceSimilarityScore = 0;
					var ethnicitySimilarityScore = 0;
					var genderSimilarityScore = 0;
					var adjustHouseholdIncomeSimilarityScore = 0;
					var healthInsuranceSimilarityScore = 0;
					if (patient.Name !== presentPatient[0].Name) {
						if (parseInt(patient.Age) !== parseInt(presentPatient[0].Age)) {
							var ageMax = Math.max(parseInt(patient.Age), parseInt(presentPatient[0].Age));
							var ageDifference = Math.abs(parseInt(patient.Age) - parseInt(presentPatient[0].Age));
							ageSimilarityScore = 0;
							ageSimilarityScore = (1 - (ageDifference / ageMax));
							//console.log("Age Max between users: ", ageMax);
						} else {
							const newUserDOB = new Date(presentPatient[0].DateOfBirth);
							const today1 = new Date();
							const msDiff1 = today1 - newUserDOB;
							const currentUserDOB = new Date(patient.DateOfBirth);
							const msCurrentDiff = today1 - currentUserDOB;

							const age1 = (msDiff1 / (365.25 * 24 * 60 * 60 * 1000));
							const currentage = (msCurrentDiff / (365.25 * 24 * 60 * 60 * 1000));
							var ageUserMax = Math.max(age1, currentage);
							var ageUserDifference = Math.abs(age1 - currentage);
							ageSimilarityScore = (1 - (ageUserDifference / ageUserMax));
						}
						if (patient.Race === presentPatient[0].Race) {
							raceSimilarityScore = 1;
						}
						if (patient.Ethnicity === presentPatient[0].Ethnicity) {
							ethnicitySimilarityScore = 1;
						}
						if (patient.GenderIdentity === presentPatient[0].GenderIdentity) {
							genderSimilarityScore = 1;
						}
						if (patient.Insurance === presentPatient[0].Insurance || presentPatient[0].Insurance === 'MC'
							|| presentPatient[0].Insurance === 'MA'
							|| presentPatient[0].Insurance === 'MG') {
							healthInsuranceSimilarityScore = 1;
						}
						
						//check with all patients MeidcalProfileCodes in the database 
						//and do a jaccard similarity scoring amongst them.
						medicalHXTerms = patient.MedicalHxTerm.split('+');
						presentUserHXTerms = presentPatient[0].MedicalHxTerm.split('+');
						medicalHxScore = jaccard.index(medicalHXTerms, presentUserHXTerms);

						var userEducationLevel = educationLevelLegend.filter(level => level.Value === patient.EducationLevel);
						var newUserEducationLevel = educationLevelLegend.filter(level => level.Value === presentPatient[0].EducationLevel);
						var educationEuclideanDistance = Math.sqrt(Math.pow
								((( + (userEducationLevel[0].id)) - ( + (newUserEducationLevel[0].id))), 2));
						var userHouseholdIncome = familyIncomeLevelLegend.filter(level => level.Value === patient.FamilyIncomeLevel);
						var newUserHouseholdIncome = familyIncomeLevelLegend.filter(level => level.Value === presentPatient[0].FamilyIncomeLevel);
						var userIncomeUpperLimit;
						userIncomeUpperLimit = userHouseholdIncome[0].Name.split('- $');
						if (userIncomeUpperLimit.length > 1) {
							userIncomeUpperLimit[1] = userIncomeUpperLimit[1].replace(',', '');
						} else {
							userIncomeUpperLimit = userHouseholdIncome[0].Name.split('< $');
							if (userIncomeUpperLimit.length > 1) {
								userIncomeUpperLimit[1] = userIncomeUpperLimit[1].replace(',', '');
							} else {
								userIncomeUpperLimit = userHouseholdIncome[0].Name.split('$');
								userIncomeUpperLimit[1] = userIncomeUpperLimit[1].replace('+', '');
								userIncomeUpperLimit[1] = userIncomeUpperLimit[1].replace(',', '');
							}
						}
						var newUserIncomeUpperLimit;
						newUserIncomeUpperLimit = newUserHouseholdIncome[0].Name.split('- $');
						if (newUserIncomeUpperLimit.length > 1) {
							newUserIncomeUpperLimit[1] = newUserIncomeUpperLimit[1].replace(',', '');
						} else {
							newUserIncomeUpperLimit = newUserHouseholdIncome[0].Name.split('< $');
							if (newUserIncomeUpperLimit.length > 1) {
								newUserIncomeUpperLimit[1] = newUserIncomeUpperLimit[1].replace(',', '');
							} else {
								newUserIncomeUpperLimit = newUserHouseholdIncome[0].Name.split('$');
								newUserIncomeUpperLimit[1] = newUserIncomeUpperLimit[1].replace('+', '');
								newUserIncomeUpperLimit[1] = newUserIncomeUpperLimit[1].replace(',', '');
							}
						}
						var userAdjustedHHIncome = ((+userIncomeUpperLimit[1]) / Math.pow(+patient.HouseHoldSize, 0.5));
						var newUserAdjustedHHIncome = ((+newUserIncomeUpperLimit[1]) / Math.pow(+presentPatient[0].HouseHoldSize, 0.5));
						console.log('userAdjustedHHIncome: ', userAdjustedHHIncome);
						console.log('newUserAdjustedHHIncome: ', newUserAdjustedHHIncome);
						var absAHHIncome = Math.abs((+userAdjustedHHIncome) - (+newUserAdjustedHHIncome));
						var maxAHHIncome = Math.max((+userAdjustedHHIncome), (+newUserAdjustedHHIncome));
						console.log('absAHHIncome: ', absAHHIncome);
						console.log('maxAHHIncome: ', maxAHHIncome);
						adjustHouseholdIncomeSimilarityScore = (absAHHIncome / maxAHHIncome);
						console.log("New User Name: ", presentPatient[0].Name);
						console.log("New User DateOfBirth: ", presentPatient[0].DateOfBirth);
						console.log("New User Race: ", presentPatient[0].Race);
						console.log("New User Gender: ", presentPatient[0].GenderIdentity);
						console.log("New User Ethnicity: ", presentPatient[0].Ethnicity);
						console.log("New User Family Income: ", presentPatient[0].FamilyIncomeLevel);
						console.log("New User Education: ", presentPatient[0].EducationLevel);
						console.log("New User Insurance: ", presentPatient[0].Insurance);
						console.log("User Name: ", patient.Name);
						console.log("User DateofBirth: ", patient.DateOfBirth);
						console.log("User Family Income: ", patient.FamilyIncomeLevel);
						console.log("User Education: ", patient.EducationLevel);
						console.log("User Insurance: ", patient.Insurance);
						console.log("GenderSimilarityScore: ", genderSimilarityScore);
						console.log("RaceSimilarityScore: ", raceSimilarityScore);
						console.log("EthnicitySimilarityScore: ", ethnicitySimilarityScore);
						console.log("AgeSimilarityScore: ", ageSimilarityScore);
						console.log("educationEuclideanDistance: ", educationEuclideanDistance);
						console.log("healthInsuranceSimilarityScore: ", healthInsuranceSimilarityScore);
						console.log("adjustHouseholdIncomeSimilarityScore: ", adjustHouseholdIncomeSimilarityScore);
						const overallSocioEconomicScore = ((0.33 * educationEuclideanDistance)
						+ (0.33 * adjustHouseholdIncomeSimilarityScore) + (0.33 * healthInsuranceSimilarityScore));
						const overallDemographicScore = ((0.25 * ageSimilarityScore) + (0.25 * genderSimilarityScore)
						+ (0.25 * raceSimilarityScore) + (0.25 * ethnicitySimilarityScore));
						const overallScore = (((1/3)*(+overallDemographicScore)) + ((1/6)*(+overallSocioEconomicScore)) + ((1/2)*(+medicalHxScore)));
						console.log("overallSocioEconomicScore: ", overallSocioEconomicScore);
						console.log("overallDemographicScore: ", overallDemographicScore);
						console.log("medicalHxScore: ", medicalHxScore);
						console.log("overallScore: ", overallScore);
						if(overallScore >= 0.7) {
						//console.log('peer List entry: ', peerList.attributes);
							strapi.query('peer-list').create({
											patientId: presentPatient[0].Id,
															//peerId: patient.Id,
											peerId: presentUser[0].id,
											ageSimilarityScore: ageSimilarityScore,
											genderSimilarityScore: genderSimilarityScore,
											raceSimilarityScore: raceSimilarityScore,
											ethnicSimilarityScore: ethnicitySimilarityScore,
											educationSimilarityScore: educationEuclideanDistance,
											healthInsuranceSimilarityScore: healthInsuranceSimilarityScore,
											adjustedIncomeSimilarityScore: adjustHouseholdIncomeSimilarityScore,
											medicalHxScore: medicalHxScore,
											overallSocioEconomicScore : overallSocioEconomicScore,
											overallDemographicScore : overallDemographicScore,
											overallScore: overallScore
									});
							strapi.query('peer-list').create({
										patientId: presentUser[0].id,
										peerId: presentPatient[0].Id,
										ageSimilarityScore: ageSimilarityScore,
										genderSimilarityScore: genderSimilarityScore,
										raceSimilarityScore: raceSimilarityScore,
										ethnicSimilarityScore: ethnicitySimilarityScore,
										educationSimilarityScore: educationEuclideanDistance,
										healthInsuranceSimilarityScore: healthInsuranceSimilarityScore,
										adjustedIncomeSimilarityScore: adjustHouseholdIncomeSimilarityScore,
										medicalHxScore: medicalHxScore,
										overallSocioEconomicScore : overallSocioEconomicScore,
										overallDemographicScore : overallDemographicScore,
										overallScore: overallScore
								});
						}
						console.log("-----------PeerList Itereation End-------------- ");
							
					}
				});
				// }
				// var presentPatient = patients.filter(patient => patient.Name === data.personDetail.displayName);
				// var presentUser = users.filter(user => user.username === presentPatient[0].Name);
				// presentPatient[0].Id = presentUser[0].id; //replacing patientId by userid
			}
		},
	},
};
