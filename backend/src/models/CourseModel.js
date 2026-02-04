/**
 * File: backend/src/models/CourseModel.js
 * Model for interacting with the courses entity in the database
 */

const pool = require('../db');

/**
 * Get prerequisites for a given course by its internal ID.
 * @param courseId - the internal ID of the course
 * @returns A promise that resolves to an array of prerequisite course objects for the given course ID.
 */
async function getPrerequisitesForCourse(courseId) {
  try {
    const result = await pool.query(
      `SELECT prereq.course_id, prereq.course_code, prereq.course_name, prereq.credits
        FROM course_prerequisites cp
        JOIN courses prereq ON cp.prerequisite_course_id = prereq.course_id
        WHERE cp.course_id = $1`,
      [courseId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching prerequisites:', error);
    throw error;
  }
}

/**
 * Get the semesters in which a course is offered by its internal ID.
 * @param courseId - the internal ID of the course
 * @returns A promise that resolves to a string listing the semesters the course is offered.
 */
async function getCourseOfferings(courseId) {
  try {
    const result = await pool.query(
      `SELECT semester_type
        FROM course_offerings
        WHERE course_id = $1`,
      [courseId]
    );
    const offerings = result.rows.map(row => row.semester_type).join(', ');
    return offerings;
  } catch (error) {
    console.error('Error fetching course offerings:', error);
    throw error;
  }
}

/**
 * Get the certificates that overlap with a given course.
 * @param {*} courseId - The internal ID of the course.
 * @returns A promise that resolves to an array of certificate objects.
 */
async function getCertificateOverlaps(courseId) {
  try {
    const result = await pool.query(
      `SELECT cert.certificate_id, cert.certificate_name, cert.certificate_short_name
      FROM certificate_courses cc
      JOIN certificates cert ON cc.certificate_id = cert.certificate_id
      WHERE cc.course_id = $1`,
      [courseId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching certificate overlap:', error);
    throw error;
  }
}

/**
 * Get semester options (actual semesters) for a given course based on its offerings.
 * For example, if a course is offered in "FA" and "SP", this function retrieves the actual semester names like "Fall 2023", "Spring 2024", etc.
 * @param {*} courseId
 */
async function getSemesterOptionsForCourse(courseId) {
  try {
    // First, get the course offerings (semester types)
    const courseOfferings = await getCourseOfferings(courseId);
    if (!courseOfferings) return [];
    const semesterTypes = courseOfferings.split(',').map(s => s.trim());

    // Now, get the actual semesters matching those types
    const result = await pool.query(
      `SELECT semester_id, semester_name, semester_type, sem_start_date, sem_end_date
        FROM semesters
        WHERE semester_type = ANY($1)`,
      [semesterTypes]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching semester options:', error);
    throw error;
  }
}

/**
 * Search for courses by name, code, or both.
 * @param {Object} params - Search parameters.
 * @param {string} params.name - Partial or full course name.
 * @param {string} params.code - Partial or full course code.
 * @returns {Promise<Array>} - Array of matching course objects.
 */
async function searchCourses({ name, code }) {
  try {
    // Build dynamic query based on provided parameters
    let query = `SELECT course_id, course_code, course_name, credits FROM courses WHERE 1=1`;
    const values = [];

    if (name) {
      query += ` AND LOWER(course_name) LIKE LOWER($${values.length + 1})`;
      values.push(`%${name}%`);
    }

    if (code) {
      query += ` AND LOWER(course_code) LIKE LOWER($${values.length + 1})`;
      values.push(`%${code}%`);
    }

    // Execute the query
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error searching courses:', error);
    throw error;
  }
}

/**
 * Create a new course with optional prerequisites and offerings.
 * 
 * This function inserts a new course into the `courses` table and optionally links it to:
 * - prerequisite courses via the `course_prerequisites` table
 * - semester offerings via the `course_offerings` table
 * 
 * It uses a transaction to ensure atomicity—if any part fails, all changes are rolled back.
 * 
 * @param {Object} params - Course creation parameters.
 * @param {string} params.name - Name of the course.
 * @param {string} params.code - Unique course code.
 * @param {number} params.credits - Credit value of the course.
 * @param {string} [params.prerequisites] - Comma-separated course codes for prerequisites.
 * @param {string} [params.offerings] - Comma-separated semester types (e.g., "FA, SP").
 * @returns {Promise<Object>} - The newly created course object.
 */
async function createCourse({ name, code, credits, prerequisites = '', offerings = '' }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert the new course
    const result = await client.query(
      `INSERT INTO courses (course_name, course_code, credits)
       VALUES ($1, $2, $3) RETURNING course_id, course_name, course_code, credits`,
      [name, code, credits]
    );
    const newCourse = result.rows[0];

    // Insert prerequisites
    const prereqCodes = prerequisites.split(',').map(c => c.trim()).filter(Boolean);
    for (const prereqCode of prereqCodes) {
      const prereqRes = await client.query(
        `SELECT course_id FROM courses WHERE course_code = $1`,
        [prereqCode]
      );
      if (prereqRes.rows.length > 0) {
        await client.query(
          `INSERT INTO course_prerequisites (course_id, prerequisite_course_id)
           VALUES ($1, $2)`,
          [newCourse.course_id, prereqRes.rows[0].course_id]
        );
      }
    }

    // Insert course offerings
    const offeringTerms = offerings.split(',').map(term => term.trim()).filter(Boolean);
    for (const term of offeringTerms) {
      await client.query(
        `INSERT INTO course_offerings (course_id, semester_type) VALUES ($1, $2)`,
        [newCourse.course_id, term]
      );
    }

    
    await client.query('COMMIT');
    return newCourse;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating course:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update an existing course.
 * 
 * This function modifies the course's core details (name, code, credits) and replaces:
 * - all existing semester offerings with new ones
 * - all existing prerequisites with new ones
 * 
 * It uses a transaction to ensure consistency—if any part fails, all changes are rolled back.
 * 
 * @param {number} courseId - Internal ID of the course to update.
 * @param {Object} params - Updated course data.
 * @param {string} params.name - New course name.
 * @param {string} params.code - New course code.
 * @param {number} params.credits - New credit value.
 * @param {string} [params.prerequisites] - Comma-separated course codes for new prerequisites.
 * @param {string} [params.offerings] - Comma-separated semester types for new offerings.
 * @returns {Promise<Object>} - The updated course object.
 */
async function updateCourse(courseId, { name, code, credits, prerequisites = '', offerings = '' }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update the course's core details
    await client.query(
      `UPDATE courses SET course_name = $1, course_code = $2, credits = $3 WHERE course_id = $4`,
      [name, code, credits, courseId]
    );

    // Clear existing offerings and add new ones
    await client.query(`DELETE FROM course_offerings WHERE course_id = $1`, [courseId]);
    const offeringTerms = offerings.split(',').map(term => term.trim()).filter(Boolean);
    for (const term of offeringTerms) {
      await client.query(
        `INSERT INTO course_offerings (course_id, semester_type) VALUES ($1, $2)`,
        [courseId, term]
      );
    }

    // Clear existing prerequisites and add new ones
    await client.query(`DELETE FROM course_prerequisites WHERE course_id = $1`, [courseId]);
    const prereqCodes = prerequisites.split(',').map(c => c.trim()).filter(Boolean);
    for (const prereqCode of prereqCodes) {
      const prereqRes = await client.query(
        `SELECT course_id FROM courses WHERE course_code = $1`,
        [prereqCode]
      );
      if (prereqRes.rows.length > 0) {
        await client.query(
          `INSERT INTO course_prerequisites (course_id, prerequisite_course_id)
           VALUES ($1, $2)`,
          [courseId, prereqRes.rows[0].course_id]
        );
      }
    }

    // Fetch and return the updated course
    const updatedCourse = await client.query(
      `SELECT course_id, course_name, course_code, credits FROM courses WHERE course_id = $1`,
      [courseId]
    );

    await client.query('COMMIT');
    return updatedCourse.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating course:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete a course by ID.
 * 
 * This function removes a course from the `courses` table using its internal ID.
 * 
 * Note: It assumes cascading deletes or foreign key constraints are handled at the database level
 * for related entries in `course_prerequisites` and `course_offerings`.
 * 
 * @param {number} courseId - Internal ID of the course to delete.
 * @returns {Promise<Object>} - A success message upon deletion.
 */
async function deleteCourse(courseId) {
  try {
    await pool.query(`DELETE FROM courses WHERE course_id = $1`, [courseId]);
    return { message: 'Course deleted successfully' };
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
}

/**
 * Get the number of enrollments per semester for a given course code.
 * @param {string} courseCode
 * @returns {Promise<Array>} Array of { semester: "Fall 2025", count: 12 }
 */
async function getEnrollments(courseCode) {
  const sql = `
    SELECT
      s.semester_name AS semester,
      COUNT(*)::int AS count
    FROM enrollments e
    JOIN courses c ON e.course_id = c.course_id
    JOIN semesters s ON e.semester_id = s.semester_id
    WHERE c.course_code = $1
    GROUP BY s.semester_name, s.sem_start_date
    ORDER BY s.sem_start_date;
  `;
  const { rows } = await pool.query(sql, [courseCode]);
  return rows.map(r => ({ semester: r.semester, count: r.count }));
}

/**
 * Get enrollment counts for all courses across semesters.
 * @returns {Promise<Array>} Array of { course_code: "CS101", semester: "Fall 2025", count: 12 }
 **/
async function getAllEnrollments() {
  const sql = `
    SELECT
      c.course_code,
      s.semester_name AS semester,
      COUNT(e.enrollment_id)::int AS count
    FROM courses c
    CROSS JOIN semesters s
    LEFT JOIN enrollments e
      ON e.course_id = c.course_id
      AND e.semester_id = s.semester_id
    GROUP BY c.course_code, s.semester_name, s.sem_start_date
    ORDER BY c.course_code, s.sem_start_date;
  `;
  const { rows } = await pool.query(sql);
  return rows.map(r => ({
    course_code: r.course_code,
    semester: r.semester,
    count: r.count
  }));
}

//Export functions
module.exports = {
  getPrerequisitesForCourse,
  getCourseOfferings,
  getCertificateOverlaps,
  getSemesterOptionsForCourse,
  searchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getEnrollments,
  getAllEnrollments
};