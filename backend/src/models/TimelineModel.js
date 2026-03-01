/**
 * @file backend/src/models/TimelineModel.
 * @description Functions for interacting with 'timelines' table in the database.
 * @author Joe Shields
 * @updated 1 Mar 2026
 *
 */

const pool = require('../db');

/**
 * Get important dates by semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId 
 * @returns 
 */
async function getTimelineArray(semesterId, programId) {
    try {
        const result = await pool.query(
            `SELECT class_start as "Class start",
                    class_end as "Class end",
                    commencement_date as Commencement,
                    registration_start as "Registration opens",
                    registration_end as "Registration closes",
                    registration_drop as "Last day to drop",
                    apply_for_admission_candidacy as "Application deadline",
                    apply_for_grad_and_cert as "Grad/Cert applications due",
                    dissertation_defense as "Dissertation defense (recommended)",
                    dissertaion_advisor_approved as "Advisor approval of dissertation",
                    dissertation_final as "Submit final dissertation",
                    dissertation_waiver_next_semester "Waiver for next semester"
            FROM timelines t
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId]
        );
        return result.rows;
    } catch (error) {
        console.error(error)
        throw error;
    }
}

/**
 * Get class start date by semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId 
 * @returns A 
 */
async function getClassStartDate(semesterId, programId) {
    try {
        /* Query database for the specific entry */
        const result = await pool.query(
            `SELECT class_start AS date
            FROM timelines t
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId]
        );

        /* Pull the relevant date in postgreSQL format from the response. */
        const pgsDate = result.rows[0].date;

        /* Convert postgreSQL date to a JavaScript Date object and return it. */
        const jsDate = new Date(pgsDate);
        return jsDate;
    } catch (error) {
        console.error(error)
        throw error;
    }
}

/**
 * Get class end date by semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId 
 * @returns 
 */
async function getClassEndDate(semesterId, programId) {
    try {
        /* Query database for the specific entry */
        const result = await pool.query(
            `SELECT class_end AS date
            FROM timelines t
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId]
        );

        /* Pull the relevant date in postgreSQL format from the response. */
        const pgsDate = result.rows[0].date;

        /* Convert postgreSQL date to a JavaScript Date object and return it. */
        const jsDate = new Date(pgsDate);
        return jsDate;
    } catch (error) {
        console.error(error)
        throw error;
    }
}

/**
 * Get commencement date by semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId 
 * @returns 
 */
async function getCommencementDate(semesterId, programId) {
    try {
        /* Query database for the specific entry */
        const result = await pool.query(
            `SELECT commencement_date AS date
            FROM timelines t
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId]
        );

        /* Pull the relevant date in postgreSQL format from the response. */
        const pgsDate = result.rows[0].date;

        /* Convert postgreSQL date to a JavaScript Date object and return it. */
        const jsDate = new Date(pgsDate);
        return jsDate;
    } catch (error) {
        console.error(error)
        throw error;
    }
}

/**
 * Get registration start date by semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId 
 * @returns 
 */
async function getRegistrationStartDate(semesterId, programId) {
    try {
        /* Query database for the specific entry */
        const result = await pool.query(
            `SELECT registration_start AS date
            FROM timelines t
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId]
        );

        /* Pull the relevant date in postgreSQL format from the response. */
        const pgsDate = result.rows[0].date;

        /* Convert postgreSQL date to a JavaScript Date object and return it. */
        const jsDate = new Date(pgsDate);
        return jsDate;
    } catch (error) {
        console.error(error)
        throw error;
    }
}

/**
 * Get registration end date by semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId 
 * @returns 
 */
async function getRegistrationEndDate(semesterId, programId) {
    try {
        /* Query database for the specific entry */
        const result = await pool.query(
            `SELECT registration_end AS date
            FROM timelines t
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId]
        );

        /* Pull the relevant date in postgreSQL format from the response. */
        const pgsDate = result.rows[0].date;

        /* Convert postgreSQL date to a JavaScript Date object and return it. */
        const jsDate = new Date(pgsDate);
        return jsDate;
    } catch (error) {
        console.error(error)
        throw error;
    }
}

/**
 * Get last class drop date by semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId 
 * @returns 
 */
async function getDropByDate(semesterId, programId) {
    try {
        /* Query database for the specific entry */
        const result = await pool.query(
            `SELECT registration_drop AS date
            FROM timelines t
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId]
        );

        /* Pull the relevant date in postgreSQL format from the response. */
        const pgsDate = result.rows[0].date;

        /* Convert postgreSQL date to a JavaScript Date object and return it. */
        const jsDate = new Date(pgsDate);
        return jsDate;
    } catch (error) {
        console.error(error)
        throw error;
    }
}

/**
 * Get admission candidacy application date by semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId 
 * @returns 
 */
async function getAdmissionApplicationDate(semesterId, programId) {
    try {
        /* Query database for the specific entry */
        const result = await pool.query(
            `SELECT apply_for_admission_candidacy AS date
            FROM timelines t
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId]
        );

        /* Pull the relevant date in postgreSQL format from the response. */
        const pgsDate = result.rows[0].date;

        /* Convert postgreSQL date to a JavaScript Date object and return it. */
        const jsDate = new Date(pgsDate);
        return jsDate;
    } catch (error) {
        console.error(error)
        throw error;
    }
}

/**
 * Get grad/cert application date by semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId 
 * @returns 
 */
async function getGradApplicationDate(semesterId, programId) {
    try {
        /* Query database for the specific entry */
        const result = await pool.query(
            `SELECT apply_for_grad_and_cert AS date
            FROM timelines t
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId]
        );

        /* Pull the relevant date in postgreSQL format from the response. */
        const pgsDate = result.rows[0].date;

        /* Convert postgreSQL date to a JavaScript Date object and return it. */
        const jsDate = new Date(pgsDate);
        return jsDate;
    } catch (error) {
        console.error(error)
        throw error;
    }
}

/**
 * Get suggested dissertation defense deadline by semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId 
 * @returns 
 */
async function getDissertationDefenseDate(semesterId, programId) {
    try {
        /* Query database for the specific entry */
        const result = await pool.query(
            `SELECT dissertation_defense AS date
            FROM timelines t
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId]
        );

        /* Pull the relevant date in postgreSQL format from the response. */
        const pgsDate = result.rows[0].date;

        /* Convert postgreSQL date to a JavaScript Date object and return it. */
        const jsDate = new Date(pgsDate);
        return jsDate;
    } catch (error) {
        console.error(error)
        throw error;
    }
}

/**
 * Get dissertation advisor approval date by semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId 
 * @returns 
 */
async function getDissertationApprovalDate(semesterId, programId) {
    try {
        /* Query database for the specific entry */
        const result = await pool.query(
            `SELECT dissertation_advisor_approved AS date
            FROM timelines t
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId]
        );

        /* Pull the relevant date in postgreSQL format from the response. */
        const pgsDate = result.rows[0].date;

        /* Convert postgreSQL date to a JavaScript Date object and return it. */
        const jsDate = new Date(pgsDate);
        return jsDate;
    } catch (error) {
        console.error(error)
        throw error;
    }
}

/**
 * Get final dissertation due date by semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId 
 * @returns 
 */
async function getDissertationFinalDate(semesterId, programId) {
    try {
        /* Query database for the specific entry */
        const result = await pool.query(
            `SELECT dissertation_final AS date
            FROM timelines t
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId]
        );

        /* Pull the relevant date in postgreSQL format from the response. */
        const pgsDate = result.rows[0].date;

        /* Convert postgreSQL date to a JavaScript Date object and return it. */
        const jsDate = new Date(pgsDate);
        return jsDate;
    } catch (error) {
        console.error(error)
        throw error;
    }
}

/**
 * Get due date for dissertation waivers for following semester by semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId 
 * @returns 
 */
async function getNextSemesterDissertationWaiverDate(semesterId, programId) {
    try {
        /* Query database for the specific entry */
        const result = await pool.query(
            `SELECT dissertation_waiver_next_semester AS date
            FROM timelines t
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId]
        );

        /* Pull the relevant date in postgreSQL format from the response. */
        const pgsDate = result.rows[0].date;

        /* Convert postgreSQL date to a JavaScript Date object and return it. */
        const jsDate = new Date(pgsDate);
        return jsDate;
    } catch (error) {
        console.error(error)
        throw error;
    }
}

/**
 * Get portfolio credit due date by semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId 
 * @returns 
 */
async function getPortfolioCreditDate(semesterId, programId) {
    try {
        /* Query database for the specific entry */
        const result = await pool.query(
            `SELECT portfolio_credit_due AS date
            FROM timelines t
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId]
        );

        /* Pull the relevant date in postgreSQL format from the response. */
        const pgsDate = result.rows[0].date;

        /* Convert postgreSQL date to a JavaScript Date object and return it. */
        const jsDate = new Date(pgsDate);
        return jsDate;
    } catch (error) {
        console.error(error)
        throw error;
    }
}

/**
 * Get independent credit due date by semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId 
 * @returns 
 */
async function getIndependentCreditDate(semesterId, programId) {
    try {
        /* Query database for the specific entry */
        const result = await pool.query(
            `SELECT independent_credit_due AS date
            FROM timelines t
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId]
        );

        /* Pull the relevant date in postgreSQL format from the response. */
        const pgsDate = result.rows[0].date;

        /* Convert postgreSQL date to a JavaScript Date object and return it. */
        const jsDate = new Date(pgsDate);
        return jsDate;
    } catch (error) {
        console.error(error)
        throw error;
    }
}
