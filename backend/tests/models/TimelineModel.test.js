/**
 * @file backend/tests/models/TimelineModel.test.js
 * @description Unit tests for StudentModel.js using Jest
 * @author Joe Shields
 * @updated 4 Mar 2026
 */

/*const { getTimelineArray, addTimeline,
    getClassStartDate, setClassStartDate,
    getClassEndDate, setClassEndDate,
    getCommencementDate, setCommencementDate,
    getRegistrationStartDate, setRegistrationStartDate,
    getRegistrationEndDate, setRegistrationEndDate,
    getDropByDate, setDropByDate,
    getAdmissionApplicationDate, setAdmissionApplicationDate,
    getGradApplicationDate, setGradApplicationDate,
    getDissertationDefenseDate, setDissertationDefenseDate,
    getDissertationApprovalDate, setDissertationApprovalDate,
    getDissertationFinalDate, setDissertationFinalDate,
    getNextSemesterDissertationWaiverDate, setNextSemesterDissertationWaiverDate,
    getPortfolioCreditDate, setPortfolioCreditDate,
    getIndependentCreditDate, setIndependentCreditDate 
} = require('../../src/models/TimelineModel');*/
const pool = require('../../src/db');
const TimelineModel = require('../../src/models/TimelineModel')

var testSemester;
var testProgram;
var testDateA;
var testDateB;
var testDateC;

beforeAll(() => {
    testSemester = 123;
    testProgram = 321;
    testDateA = new Date();
    testDateB = new Date(2026, 5, 20);
    testDateC = new Date(2012, 6, 12);
});

afterAll(() => {

})

/* Test NULL values */
test('Get NULL timeline: throws error', () => {
    expect(getTimelineArray(testSemester, testProgram)).toThrow();
});

test('Get NULL value from empty timeline: throws error', () => {
    expect(getClassStartDate(testSemester, testProgram)).toThrow();
});

test('Set date in NULL timeline: throws error', () => {
    expect(setClassStartDate(testSemester, testProgram)).toThrow();
});

test('Get after Set date in NULL timeline: throws error', () => {
    expect(setClassStartDate(testSemester, testProgram)).toThrow();
    expect(getClassStartDate(testSemester, testProgram)).toThrow();
});

test('Create empty timeline', () => {
    expect(addTimeline(testSemester, testProgram)).toBe(true);
});

test('Get empty timeline', () => {
    expect(getTimelineArray(testSemester, testProgram)).toHaveLength(12);
});

test('Get NULL value from empty timeline: throws error', () => {
    expect(getClassEndDate(testSemester, testProgram)).toThrow();
});

test('Set class start date', () => {
    expect(setClassStartDate(testSemester, testProgram, testDateA)).toBe(true);
});

test('Get class start date', () => {
    expect(getClassStartDate(testSemester, testProgram)).toBe(testDateA);
});