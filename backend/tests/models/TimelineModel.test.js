/**
 * @file backend/tests/models/TimelineModel.test.js
 * @description Unit tests for StudentModel.js using Jest
 * @author Joe Shields
 * @updated 4 Mar 2026
 */

const { getTimeline, addTimeline,
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
} = require('../../src/models/TimelineModel');
const { runSchemaAndSeeds } = require('../../db_setup');
const pool = require('../../src/db');
//const TimelineModel = require('../../src/models/TimelineModel')

var testSemester;
var testProgram;
var testDateA;
var testDateB;
var testDateC;

// Reset and seed the database before each test
beforeAll(async () => {
    await runSchemaAndSeeds();
});

// Close the database connection after all tests
afterAll(async () => {
    await pool.end();
});

beforeAll(() => {
    testSemester = 1;
    testProgram = 1;
    testDateA = new Date();
    testDateB = new Date(2026, 5, 20);
    testDateC = new Date(2012, 6, 12);
});

/* Test NULL values */
test('Get NULL timeline', async () => {
    const response = await getTimeline(testSemester, testProgram);
    expect(response).toBe(null);
});

test('Get NULL value from empty timeline', async () => {
    const response = await getClassStartDate(testSemester, testProgram);
    expect(response).toBe(null);
});

test('Set date in NULL timeline', async () => {
    const response = await setClassStartDate(testSemester, testProgram, testDateA);
    expect(response).toBe(false);
});

test('Get after Set date in NULL timeline', async () => {
    const setResponse = await setClassStartDate(testSemester, testProgram, testDateA);
    expect(setResponse).toBe(false);
    const getResponse = await getClassStartDate(testSemester, testProgram);
    expect(getResponse).toBe(null);
});

test('Create empty timeline', async () => {
    const response = await addTimeline(testSemester, testProgram);
    expect(response).toBe(true);
});

test('Get empty timeline', async () => {
    const response = await getTimeline(testSemester, testProgram);
    expect(response).not.toBe(null); // Change this if dates are added/removed.
});

test('Get NULL value from empty timeline', async () => {
    const response = await getClassEndDate(testSemester, testProgram);
    expect(response).toBe(null);});

test('Set class start date', async () => {
    const response = await setClassStartDate(testSemester, testProgram, testDateB);
    expect(response).toBe(true);
});

test('Get class start date', async () => {
    const response = await getClassStartDate(testSemester, testProgram);
    expect(response).toStrictEqual(testDateB);
});

test('Set class end date', async () => {
    const response = await setClassEndDate(testSemester, testProgram, testDateB);
    expect(response).toBe(true);
});

test('Get class end date', async () => {
    const response = await getClassEndDate(testSemester, testProgram);
    expect(response).toStrictEqual(testDateB);
});

test('Set commencement date', async () => {
    const response = await setCommencementDate(testSemester, testProgram, testDateB);
    expect(response).toBe(true);
});

test('Get commencement date', async () => {
    const response = await getCommencementDate(testSemester, testProgram);
    expect(response).toStrictEqual(testDateB);
});

test('Set registration start date', async () => {
    const response = await setRegistrationStartDate(testSemester, testProgram, testDateB);
    expect(response).toBe(true);
});

test('Get registration start date', async () => {
    const response = await getRegistrationStartDate(testSemester, testProgram);
    expect(response).toStrictEqual(testDateB);
});

test('Set registration end date', async () => {
    const response = await setRegistrationEndDate(testSemester, testProgram, testDateB);
    expect(response).toBe(true);
});

test('Get registration end date', async () => {
    const response = await getRegistrationEndDate(testSemester, testProgram);
    expect(response).toStrictEqual(testDateB);
});

test('Set drop by date', async () => {
    const response = await setDropByDate(testSemester, testProgram, testDateB);
    expect(response).toBe(true);
});

test('Get drop by date', async () => {
    const response = await getDropByDate(testSemester, testProgram);
    expect(response).toStrictEqual(testDateB);
});

test('Set admission application date', async () => {
    const response = await setAdmissionApplicationDate(testSemester, testProgram, testDateB);
    expect(response).toBe(true);
});

test('Get admission application date', async () => {
    const response = await getAdmissionApplicationDate(testSemester, testProgram);
    expect(response).toStrictEqual(testDateB);
});

test('Set graduation application date', async () => {
    const response = await setGradApplicationDate(testSemester, testProgram, testDateB);
    expect(response).toBe(true);
});

test('Get graduation application date', async () => {
    const response = await getGradApplicationDate(testSemester, testProgram);
    expect(response).toStrictEqual(testDateB);
});

test('Set dissertation defense date', async () => {
    const response = await setDissertationDefenseDate(testSemester, testProgram, testDateB);
    expect(response).toBe(true);
});

test('Get dissertation defense date', async () => {
    const response = await getDissertationDefenseDate(testSemester, testProgram);
    expect(response).toStrictEqual(testDateB);
});

test('Set dissertation approval date', async () => {
    const response = await setDissertationApprovalDate(testSemester, testProgram, testDateB);
    expect(response).toBe(true);
});

test('Get dissertation approval date', async () => {
    const response = await getDissertationApprovalDate(testSemester, testProgram);
    expect(response).toStrictEqual(testDateB);
});

test('Set dissertation final date', async () => {
    const response = await setDissertationFinalDate(testSemester, testProgram, testDateB);
    expect(response).toBe(true);
});

test('Get dissertation fianl date', async () => {
    const response = await getDissertationFinalDate(testSemester, testProgram);
    expect(response).toStrictEqual(testDateB);
});

test('Set next semester dissertation waiver date', async () => {
    const response = await setNextSemesterDissertationWaiverDate(testSemester, testProgram, testDateB);
    expect(response).toBe(true);
});

test('Get next semester dissertation waiver date', async () => {
    const response = await getNextSemesterDissertationWaiverDate(testSemester, testProgram);
    expect(response).toStrictEqual(testDateB);
});

test('Set portfolio credit date', async () => {
    const response = await setPortfolioCreditDate(testSemester, testProgram, testDateB);
    expect(response).toBe(true);
});

test('Get portfolio credit date', async () => {
    const response = await getPortfolioCreditDate(testSemester, testProgram);
    expect(response).toStrictEqual(testDateB);
});

test('Set independent credit date', async () => {
    const response = await setIndependentCreditDate(testSemester, testProgram, testDateB);
    expect(response).toBe(true);
});

test('Get independent credit date', async () => {
    const response = await getIndependentCreditDate(testSemester, testProgram);
    expect(response).toStrictEqual(testDateB);
});