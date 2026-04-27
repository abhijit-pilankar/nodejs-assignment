'use strict';

/**
 * Translates dynamic query parameters into a Mongo filter for the Person model.
 *
 * Supported keys (case-sensitive on the right of the equals sign):
 *   PersonName=<substring>      - matches firstName/middleName/lastName (case-insensitive)
 *   FirstName=<substring>       - regex on firstName
 *   LastName=<substring>        - regex on lastName
 *   City=<value>                - exact match on city (case-insensitive)
 *   State=<value>
 *   Gender=<Male|Female|Other>
 *   PinCode=<6 digits>
 *   MaritalStatus=<value>
 *   EducationStatus=<value>
 *   PersonalUniqueId=<value>
 *   AgeGt=<number>              - age > N
 *   AgeLt=<number>              - age < N
 *   AgeGte=<number>
 *   AgeLte=<number>
 *   Age=<number>                - exact age
 *   DOBFrom=<ISO date>          - dateOfBirth >=
 *   DOBTo=<ISO date>            - dateOfBirth <=
 */
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPersonFilter(query = {}) {
  const filter = {};

  if (query.PersonName) {
    const re = new RegExp(escapeRegex(query.PersonName), 'i');
    filter.$or = [
      { firstName: re },
      { middleName: re },
      { lastName: re }
    ];
  }
  if (query.FirstName) {
    filter.firstName = new RegExp(escapeRegex(query.FirstName), 'i');
  }
  if (query.LastName) {
    filter.lastName = new RegExp(escapeRegex(query.LastName), 'i');
  }
  if (query.City) {
    filter.city = new RegExp(`^${escapeRegex(query.City)}$`, 'i');
  }
  if (query.State) {
    filter.state = new RegExp(`^${escapeRegex(query.State)}$`, 'i');
  }
  if (query.Gender) {
    filter.gender = query.Gender;
  }
  if (query.PinCode) {
    filter.pinCode = query.PinCode;
  }
  if (query.MaritalStatus) {
    filter.maritalStatus = query.MaritalStatus;
  }
  if (query.EducationStatus) {
    filter.educationStatus = query.EducationStatus;
  }
  if (query.PersonalUniqueId) {
    filter.personalUniqueId = query.PersonalUniqueId;
  }

  const ageFilter = {};
  if (query.AgeGt !== undefined) ageFilter.$gt = Number(query.AgeGt);
  if (query.AgeGte !== undefined) ageFilter.$gte = Number(query.AgeGte);
  if (query.AgeLt !== undefined) ageFilter.$lt = Number(query.AgeLt);
  if (query.AgeLte !== undefined) ageFilter.$lte = Number(query.AgeLte);
  if (Object.keys(ageFilter).length) filter.age = ageFilter;
  if (query.Age !== undefined) filter.age = Number(query.Age);

  const dobFilter = {};
  if (query.DOBFrom) dobFilter.$gte = new Date(query.DOBFrom);
  if (query.DOBTo) dobFilter.$lte = new Date(query.DOBTo);
  if (Object.keys(dobFilter).length) filter.dateOfBirth = dobFilter;

  return filter;
}

module.exports = { buildPersonFilter };
