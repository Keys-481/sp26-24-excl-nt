const { isPassed, daysUntil } = require('../../src/utils/timeline')

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
    tonight = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 23, 59, 59);
    tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    lastYear = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    lastYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
});

/* TEST isPassed() */
test('Last year is passed', () => {
    expect(isPassed(lastYear)).toHaveReturnedWith(true);
});

test('Last month is passed', () => {
    expect(isPassed(lastMonth)).toHaveReturnedWith(true);
});

test('Yesterday is passed', () => {
    expect(isPassed(yesterday)).toHaveReturnedWith(true);
});

test('This morning is passed', () => {
    expect(isPassed(thisMorning)).toHaveReturnedWith(true);
});

test('Tonight is passed', () => {
    expect(isPassed(tonight)).toHaveReturnedWith(false);
});

test('Tomorrow is passed', () => {
    expect(isPassed(tomorrow)).toHaveReturnedWith(false);
});

test('Next month is passed', () => {
    expect(isPassed(nextMonth)).toHaveReturnedWith(false);
});

test('Next year is passed', () => {
    expect(isPassed(nextYear)).toHaveReturnedWith(false);
});

/* TEST daysUntil() */
test('Days until last year', () => {
    const now = new Date();
    for(var i = -10; i < 30; i++) {
        var testDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        expect(daysUntil(testDate)).toHaveReturnedWith(i);
    }
});