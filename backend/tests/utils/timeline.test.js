/**
 * @file backend/tests/utils/timeline.test.js
 * @description Unit tests for timeline.js using Jest
 * @author Joe Shields
 * @updated 4 Mar 2026
 */

const { isPassed, daysUntil } = require('../../src/utils/timeline');

var lastYear;
var lastMonth;
var yesterday;
var thisMorning;
var tonight;
var tomorrow;
var nextMonth;
var nextYear;

beforeAll(() => {
    const now = new Date();
    lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    thisMorning = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    tonight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
});

/* TEST isPassed() */
test('Last year is passed', () => {
    expect(isPassed(lastYear)).toBe(true);
});

test('Last month is passed', () => {
    expect(isPassed(lastMonth)).toBe(true);
});

test('Yesterday is passed', () => {
    expect(isPassed(yesterday)).toBe(true);
});

test('This morning is passed', () => {
    expect(isPassed(thisMorning)).toBe(true);
});

test('Tonight is passed', () => {
    expect(isPassed(tonight)).toBe(false);
});

test('Tomorrow is passed', () => {
    expect(isPassed(tomorrow)).toBe(false);
});

test('Next month is passed', () => {
    expect(isPassed(nextMonth)).toBe(false);
});

test('Next year is passed', () => {
    expect(isPassed(nextYear)).toBe(false);
});

/* TEST daysUntil() */
test('Days since <x>', () => {
    const now = new Date();
    for(var i = -10; i < 0; i++) {
        var testDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        expect(daysUntil(testDate)).toBe(i);
    }
});

test('Days until today', () => {
    const now = new Date();
    var testDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 0);
    expect(daysUntil(testDate)).toBe(0);
});

test('Days until <x>', () => {
    const now = new Date();
    for(var i = 1; i < 10; i++) {
        var testDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 23, 59, 59);
        expect(daysUntil(testDate)).toBe(i);
    }
});