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
 * @returns an array of data representing the table entry for the specified timeline.
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
 * Create a timeline for a given program during the given semester.
 * 
 * @param {*} semesterId 
 * @param {*} programId 
 * @returns True if the row was added successfully. Otherwise false.
 */
async function addTimeline(semesterId, programId) {
    try {

        const result = await pool.query(
            `INSERT INTO timelines (semester_id, program_id)
            VALUES ($1, $2)
            ON CONFLICT (student_id, program_id) DO NOTHING`,
            [semesterId, programId]
        );
        
        return result.rowCount > 0;

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
 * @returns A javascript Date object representing the requested date.
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
 * Set class start date for semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId
 * @param {Date} date
 * @returns True if the update was successful. Otherwise, false
 */
async function setClassStartDate(semesterId, programId, date) {
    try {
        // Convert JavaScript Date object to PostgreSQL DATE format.
        const pgsDate = date.toISOString().split('T')[0];

        /* Query database to update the specific entry */
        const result = await pool.query(
            `UPDATE timelines t
            SET class_start = $3
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId, pgsDate]
        );

        /* Return whether the row was updated or not. */
        return result.rowCount > 0;
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
 * @returns A javascript Date object representing the requested date.
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
 * Set class end date for semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId
 * @param {Date} date
 * @returns True if the update was successful. Otherwise, false
 */
async function setClassEndDate(semesterId, programId, date) {
    try {
        // Convert JavaScript Date object to PostgreSQL DATE format.
        const pgsDate = date.toISOString().split('T')[0];

        /* Query database to update the specific entry */
        const result = await pool.query(
            `UPDATE timelines t
            SET class_end = $3
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId, pgsDate]
        );

        /* Return whether the row was updated or not. */
        return result.rowCount > 0;
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
 * @returns A javascript Date object representing the requested date.
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
 * Set commencement date for semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId
 * @param {Date} date
 * @returns True if the update was successful. Otherwise, false
 */
async function setCommencementDate(semesterId, programId, date) {
    try {
        // Convert JavaScript Date object to PostgreSQL DATE format.
        const pgsDate = date.toISOString().split('T')[0];

        /* Query database to update the specific entry */
        const result = await pool.query(
            `UPDATE timelines t
            SET commencement_date = $3
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId, pgsDate]
        );

        /* Return whether the row was updated or not. */
        return result.rowCount > 0;
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
 * @returns A javascript Date object representing the requested date.
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
 * Set registration start date for semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId
 * @param {Date} date
 * @returns True if the update was successful. Otherwise, false
 */
async function setRegistrationStartDate(semesterId, programId, date) {
    try {
        // Convert JavaScript Date object to PostgreSQL DATE format.
        const pgsDate = date.toISOString().split('T')[0];

        /* Query database to update the specific entry */
        const result = await pool.query(
            `UPDATE timelines t
            SET registration_start = $3
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId, pgsDate]
        );

        /* Return whether the row was updated or not. */
        return result.rowCount > 0;
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
 * @returns A javascript Date object representing the requested date.
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
 * Set registration end date for semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId
 * @param {Date} date
 * @returns True if the update was successful. Otherwise, false
 */
async function setRegistrationEndDate(semesterId, programId, date) {
    try {
        // Convert JavaScript Date object to PostgreSQL DATE format.
        const pgsDate = date.toISOString().split('T')[0];

        /* Query database to update the specific entry */
        const result = await pool.query(
            `UPDATE timelines t
            SET registration_end = $3
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId, pgsDate]
        );

        /* Return whether the row was updated or not. */
        return result.rowCount > 0;
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
 * @returns A javascript Date object representing the requested date.
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
 * Set last class drop date for semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId
 * @param {Date} date
 * @returns True if the update was successful. Otherwise, false
 */
async function setDropByDate(semesterId, programId, date) {
    try {
        // Convert JavaScript Date object to PostgreSQL DATE format.
        const pgsDate = date.toISOString().split('T')[0];

        /* Query database to update the specific entry */
        const result = await pool.query(
            `UPDATE timelines t
            SET registration_drop = $3
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId, pgsDate]
        );

        /* Return whether the row was updated or not. */
        return result.rowCount > 0;
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
 * @returns A javascript Date object representing the requested date.
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
 * Set admission candidacy application date for semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId
 * @param {Date} date
 * @returns True if the update was successful. Otherwise, false
 */
async function setAdmissionApplicationDate(semesterId, programId, date) {
    try {
        // Convert JavaScript Date object to PostgreSQL DATE format.
        const pgsDate = date.toISOString().split('T')[0];

        /* Query database to update the specific entry */
        const result = await pool.query(
            `UPDATE timelines t
            SET apply_for_admission_candidacy = $3
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId, pgsDate]
        );

        /* Return whether the row was updated or not. */
        return result.rowCount > 0;
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
 * @returns A javascript Date object representing the requested date.
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
 * Set grad/cert application date for semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId
 * @param {Date} date
 * @returns True if the update was successful. Otherwise, false
 */
async function setGradApplicationDate(semesterId, programId, date) {
    try {
        // Convert JavaScript Date object to PostgreSQL DATE format.
        const pgsDate = date.toISOString().split('T')[0];

        /* Query database to update the specific entry */
        const result = await pool.query(
            `UPDATE timelines t
            SET apply_for_grad_and_cert = $3
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId, pgsDate]
        );

        /* Return whether the row was updated or not. */
        return result.rowCount > 0;
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
 * @returns A javascript Date object representing the requested date.
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
 * Set suggested dissertation defense deadline for semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId
 * @param {Date} date
 * @returns True if the update was successful. Otherwise, false
 */
async function setDissertationDefenseDate(semesterId, programId, date) {
    try {
        // Convert JavaScript Date object to PostgreSQL DATE format.
        const pgsDate = date.toISOString().split('T')[0];

        /* Query database to update the specific entry */
        const result = await pool.query(
            `UPDATE timelines t
            SET dissertation_defense = $3
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId, pgsDate]
        );

        /* Return whether the row was updated or not. */
        return result.rowCount > 0;
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
 * @returns A javascript Date object representing the requested date.
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
 * Set dissertation advisor approval date for semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId
 * @param {Date} date
 * @returns True if the update was successful. Otherwise, false
 */
async function setDissertationApprovalDate(semesterId, programId, date) {
    try {
        // Convert JavaScript Date object to PostgreSQL DATE format.
        const pgsDate = date.toISOString().split('T')[0];

        /* Query database to update the specific entry */
        const result = await pool.query(
            `UPDATE timelines t
            SET dissertation_advisor_approved = $3
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId, pgsDate]
        );

        /* Return whether the row was updated or not. */
        return result.rowCount > 0;
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
 * @returns A javascript Date object representing the requested date.
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
 * Set final dissertation due date for semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId
 * @param {Date} date
 * @returns True if the update was successful. Otherwise, false
 */
async function setDissertationFinalDate(semesterId, programId, date) {
    try {
        // Convert JavaScript Date object to PostgreSQL DATE format.
        const pgsDate = date.toISOString().split('T')[0];

        /* Query database to update the specific entry */
        const result = await pool.query(
            `UPDATE timelines t
            SET dissertation_final = $3
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId, pgsDate]
        );

        /* Return whether the row was updated or not. */
        return result.rowCount > 0;
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
 * @returns A javascript Date object representing the requested date.
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
 * Set due date for dissertation waivers for following semester for semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId
 * @param {Date} date
 * @returns True if the update was successful. Otherwise, false
 */
async function setNextSemesterDissertationWaiverDate(semesterId, programId, date) {
    try {
        // Convert JavaScript Date object to PostgreSQL DATE format.
        const pgsDate = date.toISOString().split('T')[0];

        /* Query database to update the specific entry */
        const result = await pool.query(
            `UPDATE timelines t
            SET dissertation_waiver_next_semester = $3
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId, pgsDate]
        );

        /* Return whether the row was updated or not. */
        return result.rowCount > 0;
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
 * @returns A javascript Date object representing the requested date.
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
 * Set portfolio credit date for semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId
 * @param {Date} date
 * @returns True if the update was successful. Otherwise, false
 */
async function setPortfolioCreditDate(semesterId, programId, date) {
    try {
        // Convert JavaScript Date object to PostgreSQL DATE format.
        const pgsDate = date.toISOString().split('T')[0];

        /* Query database to update the specific entry */
        const result = await pool.query(
            `UPDATE timelines t
            SET portfolio_credit_due = $3
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId, pgsDate]
        );

        /* Return whether the row was updated or not. */
        return result.rowCount > 0;
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
 * @returns A javascript Date object representing the requested date.
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

/**
 * Set independent credit date for semester ID and program ID.
 * 
 * @param {*} semesterId 
 * @param {*} programId
 * @param {Date} date
 * @returns True if the update was successful. Otherwise, false
 */
async function setIndependentCreditDate(semesterId, programId, date) {
    try {
        // Convert JavaScript Date object to PostgreSQL DATE format.
        const pgsDate = date.toISOString().split('T')[0];

        /* Query database to update the specific entry */
        const result = await pool.query(
            `UPDATE timelines t
            SET independent_credit_due = $3
            WHERE t.semester_id = $1
            AND t.program_id = $2`,
            [semesterId, programId, pgsDate]
        );

        /* Return whether the row was updated or not. */
        return result.rowCount > 0;
    } catch (error) {
        console.error(error)
        throw error;
    }
}

module.exports = {
    getTimelineArray,
    addTimeline,
    getClassStartDate,
    setClassStartDate,
    getClassEndDate,
    setClassEndDate,
    getCommencementDate,
    setCommencementDate,
    getRegistrationStartDate,
    setRegistrationStartDate,
    getRegistrationEndDate,
    setRegistrationEndDate,
    getDropByDate,
    setDropByDate,
    getAdmissionApplicationDate,
    setAdmissionApplicationDate,
    getGradApplicationDate,
    setGradApplicationDate,
    getDissertationDefenseDate,
    setDissertationDefenseDate,
    getDissertationApprovalDate,
    setDissertationApprovalDate,
    getDissertationFinalDate,
    setDissertationFinalDate,
    getNextSemesterDissertationWaiverDate,
    setNextSemesterDissertationWaiverDate,
    getPortfolioCreditDate,
    setPortfolioCreditDate,
    getIndependentCreditDate,
    setIndependentCreditDate,
};
