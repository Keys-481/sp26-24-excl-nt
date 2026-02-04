/**
 * File: backend/tests/models/StudentModel.test.js
 * Unit tests for StudentModel.js using Jest
 * Tests assume certain values in seed data, if seed data changes, tests may need to be updated
 */

const StudentModel = require('../../src/models/StudentModel');
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

// Silence console.error during tests
beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
});

// Restore console.error after tests
afterAll(() => {
    console.error.mockRestore();
});

/**
 * Tests for StudentModel
 */
describe('StudentModel', () => {

    // Test for getting student with valid school ID
    // (student with school_student_id '112299690' should exist in seed data)
    test('getStudentBySchoolId returns a student if exists', async () => {
        const schoolId = '112299690'; // should match your seed data
        const studentResponse = await StudentModel.getStudentBySchoolId(schoolId);

        expect(Array.isArray(studentResponse)).toBe(true);
        expect(studentResponse.length).toBe(1);

        const student = studentResponse[0];

        expect(student).toBeDefined();
        expect(student.school_student_id).toBe(schoolId);
        expect(student.first_name).toBe('Alice'); // should match seed data
        expect(student.last_name).toBe('Johnson'); // should match seed data
    });

    // Test for getting student with invalid school ID
    test('getStudentBySchoolId returns undefined for non-existent student', async () => {
        const studentResponse = await StudentModel.getStudentBySchoolId('invalid_id');

        expect(Array.isArray(studentResponse)).toBe(true);
        expect(studentResponse.length).toBe(0);
    });

    // Test for getting programs for a valid student ID
    // (student with student_id 1 should exist in seed data and be associated with programs 1 and 2
    test('getProgramsByStudentId returns programs for a valid student', async () => {
        const studentId = 1; // should match your seed data
        const programs = await StudentModel.getProgramsByStudentId(studentId);

        expect(programs).toBeDefined();
        expect(programs.length).toBeGreaterThan(0);
        expect(programs[0]).toHaveProperty('program_id');
        expect(programs[0]).toHaveProperty('program_name');
        expect(programs[0]).toHaveProperty('program_type');

        // Check that the student is enrolled in expected programs (based on seed data)
        const programIds = programs.map(p => p.program_id);

        expect(programIds).toContain(1); // should match seed data
        expect(programIds).toContain(2); // should match seed data
    });

    // Test for getting a student by school ID and name
    test('getStudentBySchoolIdAndName returns student for valid school ID and name', async () => {
        const schoolId = '112299690'; // should match your seed data
        const name = 'Alice'; // should match your seed data
        const students = await StudentModel.getStudentBySchoolIdAndName(schoolId, name);

        expect(students).toBeDefined();
        expect(students.length).toBeGreaterThan(0);
        expect(students[0].school_student_id).toBe(schoolId);
        expect(students[0].first_name).toBe('Alice'); // should match seed data
        expect(students[0].last_name).toBe('Johnson'); // should match seed data
    });

    // Test for getting a student by school ID and name that does not exist
    test('getStudentBySchoolIdAndName returns empty array for non-existent student', async () => {
        const students = await StudentModel.getStudentBySchoolIdAndName('invalid_id', 'NonExistent');

        expect(students).toBeDefined();
        expect(students.length).toBe(0);
    });

    // Test for getting a student by valid school ID and name that does not exist
    test('getStudentBySchoolIdAndName returns empty array for non-existent student', async () => {
        const students = await StudentModel.getStudentBySchoolIdAndName('112299690', 'NonExistent');

        expect(students).toBeDefined();
        expect(students.length).toBe(0);
    });

    // Test for getting a student by invalid school ID and valid name
    test('getStudentBySchoolIdAndName returns empty array for non-existent student', async () => {
        const students = await StudentModel.getStudentBySchoolIdAndName('invalid_id', 'Alice');

        expect(students).toBeDefined();
        expect(students.length).toBe(0);
    });

    // Test for getting students by partial name match
    test('getStudentsByName returns students matching partial name', async () => {
        const name = 'Alice'; // should match your seed data
        const students = await StudentModel.getStudentByName(name);

        expect(students).toBeDefined();
        expect(students.length).toBeGreaterThan(0);
        expect(students[0]).toHaveProperty('school_student_id');
        expect(students[0]).toHaveProperty('first_name');
        expect(students[0]).toHaveProperty('last_name');

        // Check that at least one returned student matches the search name
        const matchingStudents = students.filter(s => s.first_name.includes(name) || s.last_name.includes(name));
        expect(matchingStudents.length).toBeGreaterThan(0);
    });

});

/**
 * Ensures getStudentBySchoolId propagates database errors.
 * @throws {Error} when pool.query rejects
 */
test('getStudentBySchoolId throws error when query fails', async () => {
    const mockError = new Error('DB failure');
    jest.spyOn(pool, 'query').mockRejectedValueOnce(mockError);

    // Attempt to get student by school ID, expecting a database error
    await expect(StudentModel.getStudentBySchoolId('112299690'))
        .rejects.toThrow('DB failure');

    pool.query.mockRestore();
});

/**
 * Validates that getProgramsBySchoolStudentId returns program data
 * for a valid school_student_id present in seed data.
 * @returns {Array<Object>} program objects with id, name, and type
 */
test('getProgramsBySchoolStudentId returns programs for valid school_student_id', async () => {
    const schoolId = '112299690'; // matches seed data
    const programs = await StudentModel.getProgramsBySchoolStudentId(schoolId);

    expect(programs).toBeDefined();
    expect(programs.length).toBeGreaterThan(0);
    expect(programs[0]).toHaveProperty('program_id');
    expect(programs[0]).toHaveProperty('program_name');
    expect(programs[0]).toHaveProperty('program_type');
});

/**
 * Ensures getProgramsBySchoolStudentId returns an empty array
 * when no matching school_student_id exists.
 */
test('getProgramsBySchoolStudentId returns empty array for non-existent school_student_id', async () => {
    const programs = await StudentModel.getProgramsBySchoolStudentId('invalid_id');
    expect(programs).toEqual([]);
});

/**
 * Ensures getStudentByName propagates database errors.
 * @throws {Error} when pool.query rejects
 */
test('getStudentByName throws error when query fails', async () => {
    const mockError = new Error('DB failure');
    jest.spyOn(pool, 'query').mockRejectedValueOnce(mockError);

    await expect(StudentModel.getStudentByName('Alice'))
        .rejects.toThrow('DB failure');

    pool.query.mockRestore();
});

/**
 * Ensures getStudentBySchoolIdAndName propagates database errors.
 * @throws {Error} when pool.query rejects
 */
test('getStudentBySchoolIdAndName throws error when query fails', async () => {
    const mockError = new Error('DB failure');
    jest.spyOn(pool, 'query').mockRejectedValueOnce(mockError);

    await expect(StudentModel.getStudentBySchoolIdAndName('112299690', 'Alice'))
        .rejects.toThrow('DB failure');

    pool.query.mockRestore();
});

/**
 * Ensures getProgramsBySchoolStudentId propagates database errors.
 * @throws {Error} when pool.query rejects
 */
test('getProgramsBySchoolStudentId throws error when query fails', async () => {
    const mockError = new Error('DB failure');
    jest.spyOn(pool, 'query').mockRejectedValueOnce(mockError);

    await expect(StudentModel.getProgramsBySchoolStudentId('112299690'))
        .rejects.toThrow('DB failure');

    pool.query.mockRestore();
});

/**
 * Validates that getProgramsBySchoolStudentId returns program data
 * as an array for a valid school_student_id.
 */
test('getProgramsBySchoolStudentId returns programs for valid school_student_id', async () => {
    const schoolId = '112299690'; // matches seed data
    const programs = await StudentModel.getProgramsBySchoolStudentId(schoolId);

    // Verify that the result is an array with program objects
    expect(Array.isArray(programs)).toBe(true);
    expect(programs.length).toBeGreaterThan(0);
    expect(programs[0]).toHaveProperty('program_id');
    expect(programs[0]).toHaveProperty('program_name');
    expect(programs[0]).toHaveProperty('program_type');
});

/**
 * Ensures getProgramsBySchoolStudentId returns an empty array
 * when no matching school_student_id exists.
 */
test('getProgramsBySchoolStudentId returns empty array for non-existent school_student_id', async () => {
    const programs = await StudentModel.getProgramsBySchoolStudentId('invalid_id');
    expect(programs).toEqual([]);
});

/**
 * Ensures addStudentToProgram successfully adds a student to a program
 * and returns true.
 */
test('addStudentToProgram adds student to program and returns true', async () => {
    const studentId = 2;
    const programId = 1;

    // First, ensure the student is not already in the program
    const initialPrograms = await StudentModel.getProgramsByStudentId(studentId);
    const initialProgramIds = initialPrograms.map(p => p.program_id);
    expect(initialProgramIds).not.toContain(programId);

    // Now add the student to the program
    const result = await StudentModel.addStudentToProgram(studentId, programId);
    expect(result).toBe(true);

    // Verify that the student is now associated with the program
    const programs = await StudentModel.getProgramsByStudentId(studentId);
    const programIds = programs.map(p => p.program_id);
    expect(programIds).toContain(programId);
});


/**
 * Ensures addStudentToProgram returns false when trying to add
 * a student to a program they are already enrolled in.
 */
test('addStudentToProgram returns false when student already in program', async () => {
    const studentId = 1;
    const programId = 1;

    // Ensure the student is already in the program
    const initialPrograms = await StudentModel.getProgramsByStudentId(studentId);
    const initialProgramIds = initialPrograms.map(p => p.program_id);

    // Verify that the student is already in the program
    expect(initialProgramIds).toContain(programId);

    const result = await StudentModel.addStudentToProgram(studentId, programId);
    expect(result).toBe(false);
});

/**
 * Ensures removeStudentFromProgram successfully removes a student from a program
 * and returns true.
 */
test('removeStudentFromProgram removes student from program and returns true', async () => {
    const studentId = 2;
    const programId = 2;

    // Add student to program first to ensure they are enrolled
    await StudentModel.addStudentToProgram(studentId, programId);

    // Verify that the student is in the program
    const initialPrograms = await StudentModel.getProgramsByStudentId(studentId);
    const initialProgramIds = initialPrograms.map(p => p.program_id);

    expect(initialProgramIds).toContain(programId);

    const result = await StudentModel.removeStudentFromProgram(studentId, programId);
    expect(result).toBe(true);

    // Verify that the student is no longer associated with the program
    const programs = await StudentModel.getProgramsByStudentId(studentId);
    const programIds = programs.map(p => p.program_id);
    // Verify that the student is no longer in the program
    expect(programIds).not.toContain(programId);
});
