'use strict';
var Jaccard = require("jaccard-index");
var jaccard = Jaccard();
 
var item1 = ["user1", "user2"];
var item2 = ["user2", "user3", "user4"];
var item3 = ["user1", "user2", "user5"];
var index = jaccard.index(item1, item2);
var index2 = jaccard.index(item1, item3);
var index3 = jaccard.index(item2, item3);
var index4 = jaccard.index(item1, item1);
 
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
			const patientUser = await strapi.query('patient').find();
			const users = await strapi.plugins['users-permissions'].services.user.fetchAll();
			//console.log(users);
			const educationLevelLegend = await strapi.query('education-level-legend').find();
			const familyIncomeLevelLegend = await strapi.query('family-income-level-legend').find();
			await strapi.query('peer-list').delete();
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
					MedicalHxTerm: element.heatlhProfileID
				}
				patients.push(patientData);
			});
			for (let user = 0; user < patients.length; user++) {
				const element = patients[user];
				var presentPatient = patients.filter(patient => patient.Name === element.Name);
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
				var educationSimilarityScore = 0;
				var healthInsuranceSimilarityScore = 0;
				var medicalHxScore = 0;
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
					let medicalHxScore = 0;
					if (patient.MedicalHxTerm === presentPatient[0].MedicalHxTerm) {
						medicalHxScore = 1;
					}
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
								console.log(index);
								console.log(index2);
								console.log(index3);
								console.log(index4);
					}
					console.log("-----------PeerList Itereation End-------------- ");
						
				}
			});
			}
			// var presentPatient = patients.filter(patient => patient.Name === data.personDetail.displayName);
			// var presentUser = users.filter(user => user.username === presentPatient[0].Name);
			// presentPatient[0].Id = presentUser[0].id; //replacing patientId by userid
			
		},
	},
};
