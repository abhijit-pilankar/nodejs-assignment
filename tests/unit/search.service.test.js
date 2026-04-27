'use strict';

const { buildPersonFilter } = require('../../src/services/search.service');

describe('buildPersonFilter', () => {
  test('returns empty filter for empty query', () => {
    expect(buildPersonFilter({})).toEqual({});
  });

  test('PersonName creates a regex $or across name fields', () => {
    const f = buildPersonFilter({ PersonName: 'asha' });
    expect(f.$or).toHaveLength(3);
    expect(f.$or[0].firstName).toBeInstanceOf(RegExp);
    expect(f.$or[0].firstName.flags).toContain('i');
  });

  test('escapes regex special characters', () => {
    const f = buildPersonFilter({ FirstName: 'a.b+c' });
    expect(f.firstName.source).toBe('a\\.b\\+c');
  });

  test('City and State use case-insensitive exact match', () => {
    const f = buildPersonFilter({ City: 'Pune', State: 'Maharashtra' });
    expect(f.city.source).toBe('^Pune$');
    expect(f.state.source).toBe('^Maharashtra$');
  });

  test('age greater than / less than / between', () => {
    expect(buildPersonFilter({ AgeGt: '30' })).toEqual({ age: { $gt: 30 } });
    expect(buildPersonFilter({ AgeLt: '60' })).toEqual({ age: { $lt: 60 } });
    expect(buildPersonFilter({ AgeGte: 18, AgeLte: 65 })).toEqual({ age: { $gte: 18, $lte: 65 } });
  });

  test('Age exact replaces range', () => {
    const f = buildPersonFilter({ AgeGt: 10, Age: 42 });
    expect(f.age).toBe(42);
  });

  test('Gender, PinCode, MaritalStatus, EducationStatus, PersonalUniqueId map exactly', () => {
    const f = buildPersonFilter({
      Gender: 'Female',
      PinCode: '411001',
      MaritalStatus: 'Married',
      EducationStatus: 'Masters',
      PersonalUniqueId: '111122223333'
    });
    expect(f).toMatchObject({
      gender: 'Female',
      pinCode: '411001',
      maritalStatus: 'Married',
      educationStatus: 'Masters',
      personalUniqueId: '111122223333'
    });
  });

  test('DOB range builds dateOfBirth filter', () => {
    const f = buildPersonFilter({ DOBFrom: '2000-01-01', DOBTo: '2010-12-31' });
    expect(f.dateOfBirth.$gte).toBeInstanceOf(Date);
    expect(f.dateOfBirth.$lte).toBeInstanceOf(Date);
  });

  test('LastName regex is case-insensitive', () => {
    const f = buildPersonFilter({ LastName: 'kul' });
    expect(f.lastName).toBeInstanceOf(RegExp);
    expect(f.lastName.flags).toContain('i');
  });
});
