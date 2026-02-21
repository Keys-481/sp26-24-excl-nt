/**
 * @file backend/src/utils/timeline.js
 * @description Utility functions for assessing timelines.
 * @author Joe Shields
 * @updated 15 Feb 2026
 * 
 * campusDate() and refDate() are internal placeholder functions.
 * If future timezone conversions are deemed necessary, the code can be implemented in those two functions
 * without affecting the operation of the rest (ideally...)
 * I looked at implementing Temporal but it is not fully supported yet and I couldn't find a satisfactory
 * way to convert backwards. 
 */

const CAMPUS_TIMEZONE = 'America/Boise'; // TODO: When preparing this application for deployment to other schools, this should not be hardcoded.
const MS_PER_DAY = 1000 * 60 * 60 * 24; // milliseconds per day

/**
 * Placeholder function to return the current date/time.
 * Currently returns an object irrespective of timezone.
 * @returns Date
 */
function campusDate() {
    return new Date();
}

/**
 * Ensures conversion of any syntactically correct date format into a Date object for comparisson.
 * Currently returns an object irrespective of timezone.
 * @param {*} date 
 * @returns Date
 * @throws SyntaxError
 */
function refDate(date) {
    const d = new Date(date);

    if(d instanceof Date && !isNaN(d)) {
        return d;
    } else {
        throw new SyntaxError("Invalid date format.\n");
    }
}

/**
 * Indicates whether the provided date has passed.
 * @param {*} date - The date to be checked.
 * @returns true if the date has passed, false if the date has not, null if a date is not provided.
 * @throws SyntaxError
 */
function isPassed(date) {
    if(!date) {
        return null;
    }

    return (refDate(date) < campusDate());
}

/**
 * Return the integer number of days until the indicated date. Returns a negative if the date is passed.
 * @param {*} date 
 * @returns a positive integer if the date is in the future, a negative if the date has passed, null if a date is not provided.
 * @throws SyntaxError
 */
function daysUntil(date)
{
    if(!date) {
        return null;
    }

    const numDays = (refDate(date) - campusDate()) / MS_PER_DAY;

    if(numDays > 0)
    {
        return Math.floor(numDays) + 0;
    }
    else
    {
        return Math.ceil(numDays) + 0;
    }
}

module.exports = {
    isPassed,
    daysUntil
};