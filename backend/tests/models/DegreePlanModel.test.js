/**
 * file: backend/tests/models/DegreePlanModel.test.js
 * Unit tests for DegreePlanModel.js using Jest
 * Tests assume certain values in seed data, if seed data changes, tests may need to be updated
 */

const DegreePlanModel = require('../../src/models/DegreePlanModel');
const { runSchemaAndSeeds } = require('../../db_setup');
const pool = require('../../src/db');

// Reset and seed the database before each test
beforeAll(async () => {
    await runSchemaAndSeeds();
});

// Close the database connection after all tests
afterAll(async () => {
    await pool.end();
});

/**
 * Tests for DegreePlanModel
 */
describe('DegreePlanModel', () => {

    // Test for getting student degree plan with valid school ID
    // student with student_id 1 should exist in seed data with entries in degree plan table
    // should be associated with program_id 1
    test('getDegreePlanByStudentId returns degree plan if exists', async () => {
        const studentId = 1; // Alice Johnson
        const programId = 1; // OPWL MS
        const degreePlan = await DegreePlanModel.getDegreePlanByStudentId(studentId, programId);

        expect(Array.isArray(degreePlan)).toBe(true);
        expect(degreePlan.length).toBeGreaterThan(0);
        // check that all the rows belong to the correct student
        degreePlan.forEach(plan => {
            expect(plan.student_id).toBe(studentId);
        });

        // check that the first entry has expected fields
        expect(degreePlan[0]).toHaveProperty('student_id');
        expect(degreePlan[0]).toHaveProperty('plan_id');
        expect(degreePlan[0]).toHaveProperty('course_id');
        expect(degreePlan[0]).toHaveProperty('course_code');
        expect(degreePlan[0]).toHaveProperty('course_name');
        expect(degreePlan[0]).toHaveProperty('credits');
        expect(degreePlan[0]).toHaveProperty('semester_id');
        expect(degreePlan[0]).toHaveProperty('semester_name');
        expect(degreePlan[0]).toHaveProperty('semester_type');
        expect(degreePlan[0]).toHaveProperty('sem_start_date');
        expect(degreePlan[0]).toHaveProperty('sem_end_date');
        expect(degreePlan[0]).toHaveProperty('course_status');

        // check for specific course code in the degree plan (should match seed data)
        const courseCodes = degreePlan.map(plan => plan.course_code);
        expect(courseCodes).toContain('OPWL-536'); // should match seed data

    });

    // Test for getting student degree plan with invalid student ID
    test('getDegreePlanByStudentId returns empty array for non-existent student', async () => {
        const degreePlan = await DegreePlanModel.getDegreePlanByStudentId(9999); // assuming 9999 does not exist
        expect(degreePlan).toEqual([]); // should return empty array if no degree plan found
    });

    // Test getting degree plan by program requirements
    test('getDegreePlanByRequirement returns degree plan by requirements if exists', async () => {
        const studentId = 1; // Alice Johnson
        const programId = 1; // OPWL MS
        const degreePlan = await DegreePlanModel.getDegreePlanByRequirements(studentId, programId);

        expect(Array.isArray(degreePlan)).toBe(true);
        expect(degreePlan.length).toBeGreaterThan(0);
        // check that the first entry has expected fields
        expect(degreePlan[0]).toHaveProperty('requirement_id');
        expect(degreePlan[0]).toHaveProperty('req_description');
        expect(degreePlan[0]).toHaveProperty('parent_requirement_id');
        expect(degreePlan[0]).toHaveProperty('parent_description');
        expect(degreePlan[0]).toHaveProperty('required_credits');
        expect(degreePlan[0]).toHaveProperty('course_id');
        expect(degreePlan[0]).toHaveProperty('course_code');
        expect(degreePlan[0]).toHaveProperty('course_name');
        expect(degreePlan[0]).toHaveProperty('credits');
        expect(degreePlan[0]).toHaveProperty('course_status');
        expect(degreePlan[0]).toHaveProperty('semester_name');
    });

    // Test for getting total required credits for a program
    test('getTotalProgramRequiredCredits returns correct total credits for a program', async () => {
        const programId = 1; // OPWL MS
        const totalCredits = await DegreePlanModel.getTotalProgramRequiredCredits(programId);
        expect(totalCredits).toBe(36); // should match sum of required_credits in seed data for program_id 1
    });

    // Test for updating course status in a student's degree plan
    test('updateCourseStatus updates the status of a course in a student\'s degree plan', async () => {
        const studentId = 1; // Alice Johnson
        const courseId = 8; // OPWL-529 course ID in seed data
        const newStatus = 'Planned';
        const semesterId = 8; // Spring 2026 semester ID in seed data
        const programId = 1; // OPWL MS program ID in seed data

        const updatedEntry = await DegreePlanModel.updateCourseStatus(studentId, courseId, newStatus, semesterId, programId);
        expect(updatedEntry).toHaveProperty('student_id', studentId);
        expect(updatedEntry).toHaveProperty('course_id', courseId);
        expect(updatedEntry).toHaveProperty('course_status', newStatus);
        expect(updatedEntry).toHaveProperty('semester_id', semesterId);

        // Verify the change persisted in the database
        const degreePlan = await DegreePlanModel.getDegreePlanByStudentId(studentId, 1); // programId 1
        const updatedCourse = degreePlan.find(entry => entry.course_id === courseId);
        expect(updatedCourse).toBeDefined();
        expect(updatedCourse.course_status).toBe(newStatus);
        expect(updatedCourse.semester_id).toBe(semesterId);
    });

    // Test for getting course status in a student's degree plan
    test('getCourseStatus returns correct status for a course in a student\'s degree plan', async () => {
        const studentId = 1; // Alice Johnson
        const courseId = 8; // OPWL-529 course ID in seed data
        const programId = 1; // OPWL MS program ID in seed data
        const courseStatus = await DegreePlanModel.getCourseStatus(studentId, courseId, programId);
        expect(courseStatus).toBeDefined();
        expect(courseStatus.course_status).toBe('Planned');
    });

    test('getCourseStatus returns null for a course not in a student\'s degree plan', async () => {
        const studentId = 1; // Alice Johnson
        const courseId = 9999; // assuming this course ID does not exist in her degree plan
        const programId = 1; // OPWL MS program ID in seed data
        const courseStatus = await DegreePlanModel.getCourseStatus(studentId, courseId, programId);
        expect(courseStatus).toBeNull();
    });

});

/**
 * Ensures getDegreePlanByStudentId propagates database errors.
 * @throws {Error} when pool.query rejects
 */
test('getDegreePlanByStudentId throws error when query fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => { }); // silence logs
    jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB failure'));

    await expect(DegreePlanModel.getDegreePlanByStudentId(1, 1))
        .rejects.toThrow('DB failure');

    pool.query.mockRestore();
    console.error.mockRestore();
});

/**
 * Ensures getDegreePlanByRequirements propagates database errors.
 * @throws {Error} when pool.query rejects
 */
test('getDegreePlanByRequirements throws error when query fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB failure'));

    await expect(DegreePlanModel.getDegreePlanByRequirements(1, 1))
        .rejects.toThrow('DB failure');

    pool.query.mockRestore();
    console.error.mockRestore();
});

/**
 * Ensures getTotalProgramRequiredCredits propagates database errors.
 * @throws {Error} when pool.query rejects
 */
test('getTotalProgramRequiredCredits throws error when query fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB failure'));

    await expect(DegreePlanModel.getTotalProgramRequiredCredits(1))
        .rejects.toThrow('DB failure');

    pool.query.mockRestore();
    console.error.mockRestore();
});

/**
 * Ensures updateCourseStatus propagates database errors.
 * @throws {Error} when pool.query rejects
 */
test('updateCourseStatus throws error when query fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB failure'));

    await expect(DegreePlanModel.updateCourseStatus(1, 8, 'Planned', 8, 1))
        .rejects.toThrow('DB failure');

    pool.query.mockRestore();
    console.error.mockRestore();
});

/**
 * Ensures getCourseStatus propagates database errors.
 * @throws {Error} when pool.query rejects
 */
test('getCourseStatus throws error when query fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB failure'));

    await expect(DegreePlanModel.getCourseStatus(1, 8, 1))
        .rejects.toThrow('DB failure');

    pool.query.mockRestore();
    console.error.mockRestore();
});

/**
 * Validates that getTotalProgramRequiredCredits returns 0
 * when a program has no requirements in seed data.
 * @returns {number} 0 if program requirements are absent
 */
test('getTotalProgramRequiredCredits returns 0 when program has no requirements', async () => {
    const programId = 9999; // use a programId not present in seed data
    const totalCredits = await DegreePlanModel.getTotalProgramRequiredCredits(programId);
    expect(totalCredits).toBe(0);
});

/**
 * Validates that createDefaultPlan creates degree plan entries for a student in a program.
 */
test('createDefaultPlan creates default degree plan entries for a student in a program', async () => {
    const studentId = 2; // Bob Williams
    const programId = 1; // OPWL MS (overlapping courses with OD Cert, should create entries for both existing and new courses)

    // Check that Bob is not already enrolled in the program
    let degreePlan = await DegreePlanModel.getDegreePlanByStudentId(studentId, programId);
    expect(degreePlan.length).toBe(0);

    // Create default degree plan
    await DegreePlanModel.createDefaultPlan(studentId, programId);

    // Fetch the degree plan again - should have entries now
    degreePlan = await DegreePlanModel.getDegreePlanByStudentId(studentId, programId);
    expect(degreePlan.length).toBeGreaterThan(0);

    // Check that the entries correspond to the program requirements
    degreePlan.forEach(plan => {
        expect(plan).toHaveProperty('student_id', studentId);
        expect(plan).toHaveProperty('program_id', programId);
    });

    // Check for specific course code in the degree plan (OPWL-536 should be part of OPWL MS, and Bob status should be completed)
    const course = degreePlan.find(plan => plan.course_code === 'OPWL-536');
    expect(course).toBeDefined();
    expect(course.course_status).toBe('Completed');
});
