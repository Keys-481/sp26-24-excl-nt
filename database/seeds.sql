-- File: database/seeds.sql
-- This file populates the database with initial mock data for development and testing.

-- Use TRUNCATE to clear the tables. CASCADE is used to also clear any dependent tables.
-- The order is important to avoid foreign key constraint errors.
TRUNCATE TABLE users, roles, permissions, user_roles, role_permissions,
            advisors, students, programs, courses, semesters,
            course_offerings, course_prerequisites, program_requirements,
            requirement_courses, degree_plans, advising_relations,
            student_certificates, enrollments, comment_notifications, degree_plan_comments,
            student_programs, certificates, certificate_courses
CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO roles (role_id, role_name) VALUES
(1, 'admin'),
(2, 'advisor'),
(3, 'student'),
(4, 'accounting');

INSERT INTO permissions (permission_id, permission_name) VALUES
(1, 'view_all_students'),
(2, 'view_assigned_students'),
(3, 'view_own_data'),
(4, 'edit_degree_plan'),
(5, 'comment_create'),
(6, 'comment_edit'),
(7, 'comment_delete'),
(8, 'enrollment_reporting'),
(9, 'graduation_reporting'),
(10, 'user_create'),
(11, 'user_modify'),
(12, 'user_delete'),
(13, 'user_grant_permissions'),
(14, 'course_create'),
(15, 'course_modify'),
(16, 'course_delete');

-- Insert role_permissions
-- Admin: all permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 1), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11), (1, 12), (1, 13), (1, 14), (1, 15), (1, 16);

-- Advisor: view and edit degree plans, view reports
INSERT INTO role_permissions (role_id, permission_id) VALUES
(2,2), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8);

-- Student: view their own degree plan and add comments
INSERT INTO role_permissions (role_id, permission_id) VALUES
(3,3), (3, 6), (3, 7);

-- Accounting: enrollement and graduation reporting
INSERT INTO role_permissions (role_id, permission_id) VALUES
(4, 8), (4, 9);

-- Insert users
-- Note: Passwords should be securely hashed, these are just placeholders
INSERT INTO users (user_id, password_hash, email, phone_number, first_name, last_name, public_id, default_view) VALUES
(1, crypt('supersecurehash1', gen_salt('bf', 12)), 'admin@boisestate.edu', '555-123-4567', 'Admin', 'User', '111122223', 1),
(2, crypt('supersecurehash2', gen_salt('bf', 12)), 'advisor1@boisestate.edu', '555-987-6543', 'Jane', 'Doe', '444455556', 2),
(3, crypt('supersecurehash3', gen_salt('bf', 12)), 'advisor2@boisestate.edu', '555-555-5555', 'John', 'Smith', '777788889', 2),
(4, crypt('supersecurehash4', gen_salt('bf', 12)), 'student1@u.boisestate.edu', '555-222-3333', 'Alice', 'Johnson', '112299690', 3),
(5, crypt('supersecurehash5', gen_salt('bf', 12)), 'student2@u.boisestate.edu', '555-444-1111', 'Bob', 'Williams', '113601927', 3),
(6, crypt('supersecurehash6', gen_salt('bf', 12)), 'student3@u.boisestate.edu', '555-888-9999', 'Nora', 'Castillo', '114904338', 3),
(7, crypt('supersecurehash7', gen_salt('bf', 12)), 'student4@u.boisestate.edu', '555-000-1111', 'Gavin', 'Diaz', '112214674', 3),
(8, crypt('supersecurehash8', gen_salt('bf', 12)), 'student5@u.boisestate.edu', '555-101-2121', 'Maya', 'Ramos', '114907264', 3),
(9, crypt('supersecurehash9', gen_salt('bf', 12)), 'student6@u.boisestate.edu', '555-999-3333', 'Evan', 'Roberts', '115005432', 3),
(10, crypt('supersecurehash10', gen_salt('bf', 12)), 'student7@u.boisestate.edu', '666-333-4444', 'Zoe', 'King', '123106789', 3),
(11, crypt('supersecurehash11', gen_salt('bf', 12)), 'student8@u.boisestate.edu', '666-444-5555', 'Levi', 'Powell', '167800890', 3),
(12, crypt('supersecurehash12', gen_salt('bf', 12)), 'student9@u.boisestate.edu', '666-555-6666', 'Harper', 'Taylor', '177808901', 3),
(13, crypt('supersecurehash13', gen_salt('bf', 12)), 'student10@u.boisestate.edu', '666-222-7777', 'Charles', 'Murphy', '115409012', 3),
(14, crypt('supersecurehash14', gen_salt('bf', 12)), 'account1@boisestate.edu', '666-777-8888', 'Accounting', 'User', '122368754', 4);

-- Insert user settings
INSERT INTO user_settings (user_id, theme, font_size_change, font_family) VALUES
(1, 'light', '0px', 'Arial, sans-serif'),
(2, 'light', '0px', 'Arial, sans-serif'),
(3, 'light', '0px', 'Arial, sans-serif'),
(4, 'light', '0px', 'Arial, sans-serif'),
(5, 'light', '0px', 'Arial, sans-serif'),
(6, 'light', '0px', 'Arial, sans-serif'),
(7, 'light', '0px', 'Arial, sans-serif'),
(8, 'light', '0px', 'Arial, sans-serif'),
(9, 'light', '0px', 'Arial, sans-serif'),
(10, 'light', '0px', 'Arial, sans-serif'),
(11, 'light', '0px', 'Arial, sans-serif'),
(12, 'light', '0px', 'Arial, sans-serif'),
(13, 'light', '0px', 'Arial, sans-serif'),
(14, 'light', '0px', 'Arial, sans-serif');

-- Assign roles to users
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1), -- Admin User
(2, 2), -- Jane Doe (Advisor and also admin)
(2, 1), -- Jane Doe (Admin)
(3, 2), -- John Smith (Advisor)
(4, 3), -- Alice Johnson (Student)
(5, 3), -- Bob Williams (Student)
(6, 3), -- Nora Castillo (Student - new to program)
(7, 3), -- Gavin Diaz (Student - applied for graduation)
(8, 3), -- Maya Ramos (Student)
(9, 3), -- Evan Roberts (Student)
(10, 3), -- Zoe King (Student)
(11, 3), -- Levi Powell (Student - student who needs an updated plan)
(12, 3), -- Harper Taylor (Student - has not applied for graduation but should)
(13, 3), -- Charles Murphy (Student - needs advisment for next semester)
(14, 4); -- Accounting User

-- Insert advisors
INSERT INTO advisors (advisor_id, user_id) VALUES
(1, 2), -- Jane Doe
(2, 3); -- John Smith

-- Insert programs
INSERT INTO programs (program_id, program_name, program_type) VALUES
(1, 'Master of Science in Organizational Performance and Workplace Learning', 'masters'),
(2, 'Graduate Certificate in Organizational Development (OD)', 'certificate');

-- Insert students
-- UUIDs are automatically generated by the database
INSERT INTO students (student_id, school_student_id, user_id) VALUES
(1, '112299690', 4), -- Alice Johnson in OPWL MS program
(2, '113601927', 5), -- Bob Williams in OD certificate program
(3, '114904338', 6), -- Nora Castillo in OPWL MS program
(4, '112214674', 7), -- Gavin Diaz in OPWL MS program
(5, '114907264', 8), -- Maya Ramos in OPWL MS program
(6, '115005432', 9), -- Evan Roberts in OPWL MS program
(7, '123106789', 10), -- Zoe King in OD certificate program
(8, '167800890', 11), -- Levi Powell in OPWL MS program
(9, '177808901', 12), -- Harper Taylor in OPWL MS program
(10, '115409012', 13); -- Charles Murphy in OPWL MS program

-- Insert student-program assignments
INSERT INTO student_programs (student_id, program_id) VALUES
(1, 1), -- Alice Johnson in OPWL MS
(1, 2), -- Alice Johnson also in OD certificate
(2, 2), -- Bob Williams in OD certificate
(3, 1), -- Nora Castillo in OPWL MS
(3, 2), -- Nora Castillo in OD certificate
(4, 1), -- Gavin Diaz in OPWL MS
(4, 2), -- Gavin Diaz in OD certificate
(5, 1), -- Maya Ramos in OPWL MS
(5, 2), -- Maya Ramos in OD certificate
(6, 1), -- Evan Roberts in OPWL MS
(6, 2), -- Evan Roberts in OD certificate
(7, 2), -- Zoe King in OD certificate
(8, 1), -- Levi Powell in OPWL MS program
(8, 2), -- Levi Powell in OD certificate
(9, 1), -- Harper Taylor in OPWL MS program
(9, 2), -- Harper Taylor in OD certificate
(10, 1), -- Charles Murphy in OPWL MS program
(10, 2); -- Charles Murphy in OD certificate

-- Insert student-advisor assignments
-- Alice Johnson is assigned to Jane Doe and John Smith, Bob Williams to John Smith
INSERT INTO advising_relations (advisor_id, student_id) VALUES
(1, 1), -- Alice Johnson assigned to Jane Doe
(1, 2), -- Bob Williams assigned to Jane Doe
(2, 2), -- Bob Williams assigned to John Smith
(2, 3), -- Nora Castillo assigned to John Smith
(2, 4), -- Gavin Diaz assigned to John Smith
(1, 5), -- Maya Ramos assigned to Jane Doe
(2, 6),-- Evan Roberts assigned to John Smith
(1, 7), -- Zoe King assigned to Jane Doe
(2, 8), -- Levi Powell assigned to John Smith
(1, 9), -- Harper Taylor assigned to Jane Doe
(2, 9), -- Harper Taylor assigned to John Smith
(1, 10); -- Charles Murphy assigned to Jane Doe

-- Insert courses
-- Note: `course_id` is the primary key (integer), and course_code is a unique string identifier
INSERT INTO courses (course_id, course_code, course_name, credits) VALUES
(1, 'OPWL-536', 'Organizational Performance and Workplace Learning', 4),
(2, 'OPWL-506', 'Survey Design and Data Analysis', 1),
(3, 'OPWL-560', 'Workplace Performance Improvement', 4),
(4, 'OPWL-518', 'Contracting and Consulting', 2),
(5, 'OPWL-592', 'Portfolio (1) - Graduation term', 1),
(6, 'OPWL-507', 'Interviews and Data Analysis', 1),
(7, 'OPWL-531', 'Quantitative Research Organizations', 3),
(8, 'OPWL-529', 'Needs Assesment', 4),
(9, 'OPWL-530', 'Evaluation', 4),
(10, 'OPWL-535', 'Principles of Adult Learning', 4),
(11, 'OPWL-537', 'Instructional Design', 4),
(12, 'OPWL-508', 'Data Visualization', 1),
(13, 'OPWL-593', 'Thesis (1-6) - Last One - Graduation term', 6),
(14, 'OPWL-571', 'Leadership, Culture, and Systems', 3),
(15, 'OPWL-577', 'Leading Change', 3),
(16, 'OPWL-573', 'Project Management Tools', 3),
(17, 'OPWL-575', 'Facilitating Organizational Development, Interventions', 3),
(18, 'OPWL-523', 'E-Learning Authoring and Development', 3),
(19, 'OPWL-525', 'E-Learning Content Design and Learning Management Systems', 3),
(20, 'OPWL-527', 'Game-based and Gamified Learning', 3),
(21, 'OPWL-551', 'Storyboarding and Scenario-Based E-Learning', 3),
(22, 'OPWL-547', 'Learning Experience Design', 3),
(23, 'OPWL-545', 'AI Application in Learning and Development', 3);


-- Insert course prerequisites
-- OPWL-536 is prereq for OPWL-529, OPWL-530, OPWL-537, OPWL-560, OPWL-531, OPWL-547
-- OPWL-535 is prereq for OPWL-537
-- OPWL-529/OPWL-530 are prereqs for OPWL-560
INSERT INTO course_prerequisites (course_id, prerequisite_course_id) VALUES
(7, 1), -- OPWL-531 requires OPWL-536
(3, 1), -- OPWL-560 requires OPWL-536
(9, 1), -- OPWL-530 requires OPWL-536
(8, 1), -- OPWL-529 requires OPWL-536
(11, 1), -- OPWL-537 requires OPWL-536
(11, 10), -- OPWL-537 requires OPWL-535
(3, 9), -- OPWL-560 requires OPWL-529 (or OPWL-530 - need to enforce in requirements logic)
(3, 8), -- OPWL-560 requires OPWL-530 (or OPWL-529 - need to enforce in requirements logic)
(22, 1); -- OPWL-547 requires OPWL-536

-- Insert semesters
INSERT INTO semesters (semester_id, semester_name, semester_type, sem_start_date, sem_end_date) VALUES
(1, 'Fall 2023', 'FA', '2023-08-21', '2023-12-15'),
(2, 'Spring 2024', 'SP', '2024-01-15', '2024-05-10'),
(3, 'Summer 2024', 'SU', '2024-06-01', '2024-08-01'),
(4, 'Fall 2024', 'FA', '2024-08-20', '2024-12-14'),
(5, 'Spring 2025', 'SP', '2025-01-13', '2025-05-09'),
(6, 'Summer 2025', 'SU', '2025-06-02', '2025-08-03'),
(7, 'Fall 2025', 'FA', '2025-08-19', '2025-12-13'),
(8, 'Spring 2026', 'SP', '2026-01-12', '2026-05-08'),
(9, 'Summer 2026', 'SU', '2026-06-01', '2026-08-02'),
(10, 'Fall 2026', 'FA', '2026-08-18', '2026-12-12'),
(11, 'Spring 2027', 'SP', '2027-01-11', '2027-05-07');

-- Insert semester offerings
INSERT INTO course_offerings (course_id, semester_type) VALUES
(1, 'FA'), -- OPWL-536 offered in Fall
(1, 'SP'), -- OPWL-536 offered in Spring
(1, 'SU'), -- OPWL-536 offered in Summer
(2, 'FA'), -- OPWL-506 offered in Fall
(2, 'SP'), -- OPWL-506 offered in Spring
(3, 'FA'), -- OPWL-560 offered in Fall
(3, 'SP'), -- OPWL-560 offered in Spring
(4, 'FA'), -- OPWL-518 offered in Fall
(4, 'SP'), -- OPWL-518 offered in Spring
(5, 'FA'), -- OPWL-592 offered in Fall
(5, 'SP'), -- OPWL-592 offered in Spring
(5, 'SU'), -- OPWL-592 offered in Summer
(6, 'SP'), -- OPWL-507 offered in Spring
(6, 'SU'), -- OPWL-507 offered in Summer
(7, 'FA'), -- OPWL-531 offered in Fall
(7, 'SU'), -- OPWL-531 offered in Summer
(8, 'FA'), -- OPWL-529 offered in Fall
(8, 'SP'), -- OPWL-529 offered in Spring
(9, 'FA'), -- OPWL-530 offered in Fall
(9, 'SP'), -- OPWL-530 offered in Spring
(10, 'FA'), -- OPWL-535 offered in Fall
(10, 'SP'), -- OPWL-535 offered in Spring
(11, 'FA'), -- OPWL-537 offered in Fall
(11, 'SP'), -- OPWL-537 offered in Spring
(12, 'FA'), -- OPWL-508 offered in Fall
(12, 'SP'), -- OPWL-508 offered in Spring
(12, 'SU'), -- OPWL-508 offered in Summer
(13, 'FA'), -- OPWL-593 offered in Fall
(13, 'SP'), -- OPWL-593 offered in Spring
(13, 'SU'), -- OPWL-593 offered in Summer
(14, 'FA'), -- OPWL-571 offered in Fall
(14, 'SU'), -- OPWL-571 offered in Summer
(15, 'SP'), -- OPWL-577 offered in Spring (Odd years only - need to enforce)
(15, 'SU'), -- OPWL-577 offered in Summer (Odd years only - need to enforce)
(16, 'SU'), -- OPWL-573 offered in Summer
(17, 'SU'), -- OPWL-575 offered in Summer
(18, 'FA'), -- OPWL-523 offered in Fall
(18, 'SU'), -- OPWL-523 offered in Summer
(19, 'SP'), -- OPWL-525 offered in Spring
(19, 'SU'), -- OPWL-525 offered in Summer
(20, 'FA'), -- OPWL-527 offered in Fall
(21, 'SP'), -- OPWL-551 offered in Spring
(21, 'SU'), -- OPWL-551 offered in Summer
(22, 'SP'), -- OPWL-547 offered in Spring
(23, 'FA'), -- OPWL-545 offered in Fall
(23, 'SP'), -- OPWL-545 offered in Spring
(23, 'SU'); -- OPWL-545 offered in Summer

-- Insert program requirements
-- Note: Some requirements are hierarchical (e.g., culminating activity with sub-requirements)
INSERT INTO program_requirements (requirement_id, program_id, requirement_type, parent_requirement_id, required_credits, req_description, display_order) VALUES
-- OPWL MS Program Requirement Structure
(1, 1, 'core', NULL, 24, 'Core Courses for OPWL MS', 1), -- Core requirement for OPWL MS
(3, 1, 'culminating_activity', NULL, 12, 'Culminating Activity: Complete one (1) of the following', 2), -- Culminating activity for OPWL MS (Parent requirement)
(4, 1, 'portfolio', 3, 12, 'Portfolio Option: Complete all of the following', 3), -- Portfolio requirement under culminating activity
(5, 1, 'research', 4, 3, 'Take at least 3 credits from the following (RESEARCH)', 4), -- Research requirement under portfolio
(6, 1, 'elective', 4, 8, 'Take at least 8 credits from the following (ELECTIVES)', 5), -- Elective requirement under portfolio
(7, 1, 'misc', 4, 1, 'Take at least 1 credits from the following', 6), -- Misc requirement under portfolio
(8, 1, 'thesis', 3, 12, 'Thesis Option: Complete all of the following', 7), -- Thesis requirement under culminating activity
(9, 1, 'research', 8, 6, 'Take at least 6 credits from the following (RESEARCH)', 8), -- Research requirement under thesis
(10, 1, 'misc', 8, 6, 'Take at least 6 credits from the following (3-4 semesters)', 9); -- Misc requirement under thesis


-- Insert requirement courses for OPWL MS Program
INSERT INTO requirement_courses (requirement_id, course_id) VALUES
-- Core courses for OPWL MS (requirement_id = 1)
(1, 1), -- OPWL-536
(1, 3), -- OPWL-560
(1, 8), -- OPWL-529
(1, 9), -- OPWL-530
(1, 10), -- OPWL-535
(1, 11), -- OPWL-537

-- Culminating activity -> Portfolio (requirement_id = 4)
-- Take at least 3 credits from the following (RESEARCH) (requirement_id = 5)
(5, 2), -- OPWL-506
(5, 6), -- OPWL-507
(5, 7), -- OPWL-531
(5, 12), -- OPWL-508

-- Take at least 8 credits from the following (ELECTIVE) (requirement_id = 6)
-- OPWL-XXX courses not listed as core or research
(6, 14), -- OPWL-571
(6, 15), -- OPWL-577
(6, 16), -- OPWL-573
(6, 17), -- OPWL-575
(6, 18), -- OPWL-523
(6, 19), -- OPWL-525
(6, 20), -- OPWL-527
(6, 21), -- OPWL-551
(6, 22), -- OPWL-547
(6, 23), -- OPWL-545
(6, 4), -- OPWL-518
-- Take at least 1 credits from the following (MISC) (requirement_id = 7)
(7, 5), -- OPWL-592

-- Culminating activity -> Thesis (requirement_id = 8)
-- Take at least 6 credits from the following (RESEARCH) (requirement_id = 9)
(9, 2), -- OPWL-506
(9, 6), -- OPWL-507
(9, 7), -- OPWL-531
(9, 12), -- OPWL-508
-- Take at least 6 credits from the following (MISC) (requirement_id = 10)
(10, 13); -- OPWL-593

-- Insert requirement for OD Certificate Program
INSERT INTO program_requirements (requirement_id, program_id, requirement_type, parent_requirement_id, required_credits, req_description) VALUES
(11, 2, 'core', NULL, 10, 'Required to take the following (10 Credits)'), -- Core requirement for OD certificate
(12, 2, 'elective', NULL, 6, 'Take 6 credits from the following (ELECTIVES)'); -- Elective requirement for OD certificate

-- Insert requirement courses for OD Certificate Program
INSERT INTO requirement_courses (requirement_id, course_id) VALUES
-- Core courses for OD certificate (requirement_id = 11)
(11, 1), -- OPWL-536
(11, 14), -- OPWL-571
(11, 15), -- OPWL-577
-- Elective courses for OD certificate (requirement_id = 12)
(12, 4), -- OPWL-518
(12, 16), -- OPWL-573
(12, 17), -- OPWL-575
(12, 5), -- OPWL-506
(12, 6), -- OPWL-507
(12, 12), -- OPWL-508
(12, 7), -- OPWL-531
(12, 3); -- OPWL-560
-- Students can choose other OPWL courses as electives as well
-- OPWL-XXX courses not listed as core


-- DEFAULT degree plan entries will be created when a student is added to a program
INSERT INTO degree_plans (program_id, student_id, course_id, semester_id, course_status, catalog_year)
SELECT
    sp.program_id,
    sp.student_id,
    rc.course_id,
    NULL,
    'Unplanned',
    '2025-2026'
FROM
    student_programs sp
JOIN
    program_requirements pr ON sp.program_id = pr.program_id
JOIN
    requirement_courses rc ON pr.requirement_id = rc.requirement_id
ON CONFLICT (student_id, course_id, program_id) DO NOTHING; -- Avoid duplicate entries

-- UPDATE degree plans to reflect actual student progress
-- Alice Johnson's degree plan for OPWL MS program (student_id = 1, program_id = 1)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 4
WHERE student_id = 1 AND program_id = 1 AND course_id = 1;   -- OPWL-536 (OD overlap)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 4
WHERE student_id = 1 AND program_id = 1 AND course_id = 10;  -- OPWL-535
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 1 AND program_id = 1 AND course_id = 11;  -- OPWL-537
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 1 AND program_id = 1 AND course_id = 14;  -- OPWL-571
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 1 AND program_id = 1 AND course_id = 2;   -- OPWL-506 (OD overlap)
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 1 AND program_id = 1 AND course_id = 8;   -- OPWL-529
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 1 AND program_id = 1 AND course_id = 9;   -- OPWL-530
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 1 AND program_id = 1 AND course_id = 4;   -- OPWL-518 (OD overlap)
UPDATE degree_plans SET course_status = 'Planned', semester_id = 11
WHERE student_id = 1 AND program_id = 1 AND course_id = 5;   -- OPWL-592

-- Alice Johnson's degree plan for OD certificate program (student_id = 1, program_id = 2)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 4
WHERE student_id = 1 AND program_id = 2 AND course_id = 1;   -- OPWL-536 (Overlap)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 1 AND program_id = 2 AND course_id = 14;  -- OPWL-571
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 1 AND program_id = 2 AND course_id = 2;   -- OPWL-506 (Overlap)
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 1 AND program_id = 2 AND course_id = 4;   -- OPWL-518 (Overlap)

-- Bob Williams's degree plan for OD certificate program (student_id = 2, program_id = 2)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 4
WHERE student_id = 2 AND program_id = 2 AND course_id = 1;   -- OPWL-536
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 2 AND program_id = 2 AND course_id = 15;  -- OPWL-577
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 2 AND program_id = 2 AND course_id = 17;  -- OPWL-575
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 2 AND program_id = 2 AND course_id = 4;   -- OPWL-518

-- Nora Castillo's degree plan for OPWL MS program (student_id = 3, program_id = 1)
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 3 AND program_id = 1 AND course_id = 6;   -- OPWL-507
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 3 AND program_id = 1 AND course_id = 10;   -- OPWL-535
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 3 AND program_id = 1 AND course_id = 5;   -- OPWL-592
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 3 AND program_id = 1 AND course_id = 3;   -- OPWL-560
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 3 AND program_id = 1 AND course_id = 1;   -- OPWL-536

-- Nora Castillo's degree plan for OD certificate program (student_id = 3, program_id = 2)
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 3 AND program_id = 2 AND course_id = 1;   -- OPWL-536 (Overlap)
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 3 AND program_id = 2 AND course_id = 14;  -- OPWL-571
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 8
WHERE student_id = 3 AND program_id = 1 AND course_id = 6;   -- OPWL-507
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 3 AND program_id = 1 AND course_id = 3;   -- OPWL-560

-- Gavin Diaz's degree plan for OPWL MS program (student_id = 4, program_id = 1)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 4
WHERE student_id = 4 AND program_id = 1 AND course_id = 1;   -- OPWL-536
UPDATE degree_plans SET course_status = 'Completed', semester_id = 4
WHERE student_id = 4 AND program_id = 1 AND course_id = 14;   -- OPWL-571
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 4 AND program_id = 1 AND course_id = 15;   -- OPWL-577
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 4 AND program_id = 1 AND course_id = 19;   -- OPWL-525
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 4 AND program_id = 1 AND course_id = 8;   -- OPWL-529
UPDATE degree_plans SET course_status = 'Completed', semester_id = 6
WHERE student_id = 4 AND program_id = 1 AND course_id = 10;   -- OPWL-535
UPDATE degree_plans SET course_status = 'Completed', semester_id = 6
WHERE student_id = 4 AND program_id = 1 AND course_id = 11;   -- OPWL-537
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 4 AND program_id = 1 AND course_id = 3;   -- OPWL-560
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 4 AND program_id = 1 AND course_id = 2;   -- OPWL-506
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 4 AND program_id = 1 AND course_id = 6;   -- OPWL-507
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 4 AND program_id = 1 AND course_id = 12;   -- OPWL-508

-- Gavin Diaz's degree plan for OD certificate program (student_id = 4, program_id = 2)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 4
WHERE student_id = 4 AND program_id = 2 AND course_id = 1;   -- OPWL-536 (Overlap)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 4
WHERE student_id = 4 AND program_id = 2 AND course_id = 14;  -- OPWL-571 (Overlap)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 4 AND program_id = 2 AND course_id = 15;  -- OPWL-577 (Overlap)
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 4 AND program_id = 2 AND course_id = 2;   -- OPWL-506 (Overlap)
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 4 AND program_id = 2 AND course_id = 4;   -- OPWL-518
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 4 AND program_id = 2 AND course_id = 12;   -- OPWL-508 (Overlap)

-- Maya Ramos's degree plan for OPWL MS program (student_id = 5, program_id = 1)
 UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 5 AND program_id = 1 AND course_id = 1;   -- OPWL-536
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 5 AND program_id = 1 AND course_id = 14;   -- OPWL-571
UPDATE degree_plans SET course_status = 'Completed', semester_id = 6
WHERE student_id = 5 AND program_id = 1 AND course_id = 16;   -- OPWL-573
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 5 AND program_id = 1 AND course_id = 9;   -- OPWL-530
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 5 AND program_id = 1 AND course_id = 7;   -- OPWL-531
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 5 AND program_id = 1 AND course_id = 10;   -- OPWL-535
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 5 AND program_id = 1 AND course_id = 2;   -- OPWL-506
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 5 AND program_id = 1 AND course_id = 12;   -- OPWL-508

-- Maya Ramos's degree plan for OD certificate program (student_id = 5, program_id = 2)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 5 AND program_id = 2 AND course_id = 1;   -- OPWL-536 (Overlap)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 5 AND program_id = 2 AND course_id = 14;  -- OPWL-571 (Overlap)
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 5 AND program_id = 2 AND course_id = 7;   -- OPWL-531
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 5 AND program_id = 2 AND course_id = 10;   -- OPWL-535 (Overlap)
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 5 AND program_id = 2 AND course_id = 2;   -- OPWL-506 (Overlap)
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 5 AND program_id = 2 AND course_id = 12;   -- OPWL-508 (Overlap)

-- Evan Roberts's degree plan for OPWL MS program (student_id = 6, program_id = 1)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 2  
WHERE student_id = 6 AND program_id = 1 AND course_id = 8;   -- OPWL-529
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 6 AND program_id = 1 AND course_id = 10;   -- OPWL-535
UPDATE degree_plans SET course_status = 'Completed', semester_id = 2
WHERE student_id = 6 AND program_id = 1 AND course_id = 1;   -- OPWL-536
UPDATE degree_plans SET course_status = 'Completed', semester_id = 2
WHERE student_id = 6 AND program_id = 1 AND course_id = 14;   -- OPWL-571
UPDATE degree_plans SET course_status = 'Completed', semester_id = 4
WHERE student_id = 6 AND program_id = 1 AND course_id = 3;   -- OPWL-560
UPDATE degree_plans SET course_status = 'Completed', semester_id = 6
WHERE student_id = 6 AND program_id = 1 AND course_id = 15;   -- OPWL-577
UPDATE degree_plans SET course_status = 'Completed', semester_id = 6
WHERE student_id = 6 AND program_id = 1 AND course_id = 17;   -- OPWL-575
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 6 AND program_id = 1 AND course_id = 11;   -- OPWL-537
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 6 AND program_id = 1 AND course_id = 2;   -- OPWL-506
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 6 AND program_id = 1 AND course_id = 6;   -- OPWL-507
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 6 AND program_id = 1 AND course_id = 12;   -- OPWL-508

--Evan Roberts's degree plan for OD certificate program (student_id = 6, program_id = 2)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 2
WHERE student_id = 6 AND program_id = 2 AND course_id = 1;   -- OPWL-536 (Overlap)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 2
WHERE student_id = 6 AND program_id = 2 AND course_id = 14;  -- OPWL-571 (Overlap)  
UPDATE degree_plans SET course_status = 'Completed', semester_id = 6
WHERE student_id = 6 AND program_id = 2 AND course_id = 15;  -- OPWL-577 (Overlap)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 4
WHERE student_id = 6 AND program_id = 1 AND course_id = 3;   -- OPWL-560 (Overlap)
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 6 AND program_id = 2 AND course_id = 17;   -- OPWL-575
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 6 AND program_id = 1 AND course_id = 2;   -- OPWL-506 (Overlap)
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 6 AND program_id = 1 AND course_id = 6;   -- OPWL-507 (Overlap)
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 6 AND program_id = 1 AND course_id = 12;   -- OPWL-508 (Overlap)

-- Zoe King's degree plan for OD certificate program (student_id = 7, program_id = 1)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 4
WHERE student_id = 7 AND program_id = 2 AND course_id = 1;   -- OPWL-536 (Overlap)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 7 AND program_id = 2 AND course_id = 15;  -- OPWL-577 (Overlap)
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 7 AND program_id = 2 AND course_id = 17;  -- OPWL-575
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 7 AND program_id = 2 AND course_id = 4;   -- OPWL-518 (Overlap)

-- Levi Powell's degree plan for OPWL MS program (student_id = 8, program_id = 1)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 2
WHERE student_id = 8 AND program_id = 1 AND course_id = 1;   -- OPWL-536
UPDATE degree_plans SET course_status = 'Completed', semester_id = 2
WHERE student_id = 8 AND program_id = 1 AND course_id = 14;   -- OPWL-571
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 8 AND program_id = 1 AND course_id = 15;   -- OPWL-577
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 8 AND program_id = 1 AND course_id = 19;   -- OPWL-525
UPDATE degree_plans SET course_status = 'Completed', semester_id = 4
WHERE student_id = 8 AND program_id = 1 AND course_id = 8;   -- OPWL-529
UPDATE degree_plans SET course_status = 'Completed', semester_id = 4
WHERE student_id = 8 AND program_id = 1 AND course_id = 10;   -- OPWL-535
UPDATE degree_plans SET course_status = 'Completed', semester_id = 4
WHERE student_id = 8 AND program_id = 1 AND course_id = 11;   -- OPWL-537

-- Levi Powell's degree plan for OD certificate program (student_id = 8, program_id = 2)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 2
WHERE student_id = 8 AND program_id = 2 AND course_id = 1;   -- OPWL-536 (Overlap)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 2
WHERE student_id = 8 AND program_id = 2 AND course_id = 14;  -- OPWL-571 (Overlap)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 8 AND program_id = 2 AND course_id = 15;  -- OPWL-577 (Overlap)

-- Harper Taylor's degree plan for OPWL MS program (student_id = 9, program_id = 1)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 4
WHERE student_id = 9 AND program_id = 1 AND course_id = 1;   -- OPWL-536
UPDATE degree_plans SET course_status = 'Completed', semester_id = 4
WHERE student_id = 9 AND program_id = 1 AND course_id = 14;   -- OPWL-571
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 9 AND program_id = 1 AND course_id = 15;   -- OPWL-577
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 9 AND program_id = 1 AND course_id = 19;   -- OPWL-525
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 9 AND program_id = 1 AND course_id = 8;   -- OPWL-529
UPDATE degree_plans SET course_status = 'Completed', semester_id = 6
WHERE student_id = 9 AND program_id = 1 AND course_id = 10;   -- OPWL-535
UPDATE degree_plans SET course_status = 'Completed', semester_id = 6
WHERE student_id = 9 AND program_id = 1 AND course_id = 11;   -- OPWL-537
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 9 AND program_id = 1 AND course_id = 3;   -- OPWL-560
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 9 AND program_id = 1 AND course_id = 2;   -- OPWL-506
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 9 AND program_id = 1 AND course_id = 6;   -- OPWL-507
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 9 AND program_id = 1 AND course_id = 12;   -- OPWL-508

-- Harper Taylor's degree plan for OD certificate program (student_id = 9, program_id = 2)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 4
WHERE student_id = 9 AND program_id = 2 AND course_id = 1;   -- OPWL-536 (Overlap)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 4
WHERE student_id = 9 AND program_id = 2 AND course_id = 14;  -- OPWL-571 (Overlap)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 9 AND program_id = 2 AND course_id = 15;  -- OPWL-577 (Overlap)
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 9 AND program_id = 2 AND course_id = 2;   -- OPWL-506 (Overlap)
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 9 AND program_id = 2 AND course_id = 4;   -- OPWL-518
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 9 AND program_id = 2 AND course_id = 12;   -- OPWL-508 (Overlap) 

-- Charles Murphy's degree plan for OPWL MS program (student_id = 10, program_id = 1)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 10 AND program_id = 1 AND course_id = 1;   -- OPWL-536
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 10 AND program_id = 1 AND course_id = 15;   -- OPWL-577
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 10 AND program_id = 1 AND course_id = 14;   -- OPWL-571
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 10 AND program_id = 1 AND course_id = 2;   -- OPWL-506
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 10 AND program_id = 1 AND course_id = 8;   -- OPWL-529
UPDATE degree_plans SET course_status = 'Planned', semester_id = 8
WHERE student_id = 10 AND program_id = 1 AND course_id = 10;   -- OPWL-535

-- Charles Murphy's degree plan for OD certificate program (student_id = 10, program_id = 2)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 10 AND program_id = 2 AND course_id = 1;   -- OPWL-536 (Overlap)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 10 AND program_id = 2 AND course_id = 15;  -- OPWL-577 (Overlap)
UPDATE degree_plans SET course_status = 'Completed', semester_id = 5
WHERE student_id = 10 AND program_id = 1 AND course_id = 14;   -- OPWL-571 (Overlap)
UPDATE degree_plans SET course_status = 'In Progress', semester_id = 7
WHERE student_id = 10 AND program_id = 2 AND course_id = 2;   -- OPWL-506 (Overlap)

-- Insert into enrollments
INSERT INTO enrollments (enrollment_id, student_id, course_id, semester_id, grade) VALUES
-- Alice Johnson Completed enrollments (Fall 2024 and Spring 2025)
(1, 1, 1, 4, 'A'), -- Alice Johnson completed OPWL-536 in Fall 2024
(2, 1, 10, 4, 'A-'), -- Alice Johnson completed OPWL-535 in Fall 2024
(3, 1, 11, 5, 'B+'), -- Alice Johnson completed OPWL-537 in Spring 2025
(4, 1, 14, 5, 'A'), -- Alice Johnson completed OPWL-571 in Spring 2025

-- Alice Johnson in-progress enrollments (Fall 2025)
(6, 1, 2, 7, NULL), -- Alice Johnson in-progress OPWL-506 in Fall 2025
(5, 1, 8, 7, NULL), -- Alice Johnson in-progress OPWL-529 in Fall 2025

-- Bob Williams Completed enrollments (Fall 2024 and Spring 2025)
(7, 2, 1, 4, 'A'), -- Bob Williams completed OPWL-536 in Fall 2024
(8, 2, 15, 5, 'A-'), -- Bob Williams completed OPWL-577 in Spring 2025

-- Bob Williams in-progress enrollments (Fall 2025)
(9, 2, 17, 7, NULL), -- Bob Williams in-progress OPWL-575 in Fall 2025

-- Bob Williams planned enrollments (Spring 2026)
(10, 2, 4, 8, NULL), -- Bob Williams planned OPWL-518 in Spring 2026

-- Nora Castillo in-progress enrollments (Fall 2025)
(11, 3, 6, 7, NULL), -- Nora Castillo in-progress OPWL-507 in Fall 2025
(12, 3, 10, 7, NULL), -- Nora Castillo in-progress OPWL-535 in Fall 2025
(13, 3, 5, 7, NULL), -- Nora Castillo in-progress OPWL-592 in Fall 2025

-- Nora Castillo's planned enrollments (Spring 2026)
(14, 3, 1, 8, NULL), -- Nora Castillo planned OPWL-536 in Spring 2026
(15, 3, 14, 8, NULL), -- Nora Castillo planned OPWL-571 in Spring 2026

-- Gavin Diaz Completed enrollments (Fall 2024, Spring 2025, Summer 2025)
(16, 4, 1, 4, 'A'), -- Gavin Diaz completed OPWL-536 in Fall 2024
(17, 4, 14, 4, 'A-'), -- Gavin Diaz completed OPWL-571 in Fall 2024
(18, 4, 15, 5, 'B+'), -- Gavin Diaz completed OPWL-577 in Spring 2025
(19, 4, 19, 5, 'A'), -- Gavin Diaz completed OPWL-525 in Spring 2025
(20, 4, 8, 6, 'A'), -- Gavin Diaz completed OPWL-529 in Summer 2025
(21, 4, 10, 6, 'A-'), -- Gavin Diaz completed OPWL-535 in Summer 2025
(22, 4, 11, 6, 'B+'), -- Gavin Diaz completed OPWL-537 in Summer 2025

-- Gavin Diaz in-progress enrollments (Fall 2025)
(23, 4, 3, 7, NULL), -- Gavin Diaz in-progress OPWL-560 in Fall 2025
(24, 4, 2, 7, NULL), -- Gavin Diaz in-progress OPWL-506 in Fall 2025

-- Gavin Diaz planned enrollments (Spring 2026)
(25, 4, 6, 8, NULL), -- Gavin Diaz planned OPWL-507 in Spring 2026
(26, 4, 12, 8, NULL), -- Gavin Diaz planned OPWL-508 in Spring 2026

--Maya Ramos Completed enrollments (Spring 2025 and Summer 2025)
(27, 5, 1, 5, 'A'), -- Maya Ramos completed OPWL-536 in Spring 2025
(28, 5, 14, 5, 'A-'), -- Maya Ramos completed OPWL-571 in Spring 2025
(29, 5, 16, 6, 'B+'), -- Maya Ramos completed OPWL-573 in Summer 2025

-- Maya Ramos in-progress enrollments (Fall 2025)
(30, 5, 9, 7, NULL), -- Maya Ramos in-progress OPWL-530 in Fall 2025
(31, 5, 7, 7, NULL), -- Maya Ramos in-progress OPWL-531 in Fall 2025
(32, 5, 10, 7, NULL), -- Maya Ramos in-progress OPWL-535 in Fall 2025

-- Maya Ramos planned enrollments (Spring 2026)
(33, 5, 2, 8, NULL), -- Maya Ramos planned OPWL-506 in Spring 2026
(34, 5, 12, 8, NULL), -- Maya Ramos planned OPWL-508 in Spring 2026

-- Evan Roberts Completed enrollments (Spring 2024, Fall 2024, Spring 2025, Summer 2025)
(35, 6, 8, 2, 'A'), -- Evan Roberts completed OPWL-529 in Spring 2024
(36, 6, 10, 5, 'A-'), -- Evan Roberts completed OPWL-535 in Spring 2025
(37, 6, 1, 2, 'B+'), -- Evan Roberts completed OPWL-536 in Spring 2024
(38, 6, 14, 2, 'A-'), -- Evan Roberts completed OPWL-571 in Spring 2024
(39, 6, 3, 4, 'B-'), -- Evan Roberts completed OPWL-560 in Fall 2024
(40, 6, 15, 6, 'B+'), -- Evan Roberts completed OPWL-577 in Summer 2025
(41, 6, 17, 6, 'A'), -- Evan Roberts completed OPWL-575 in Summer 2025

-- Evan Roberts in-progress enrollments (Fall 2025)
(42, 6, 11, 7, NULL), -- Evan Roberts in-progress OPWL-537 in Fall 2025

-- Evan Roberts planned enrollments (Spring 2026)
(43, 6, 2, 8, NULL), -- Evan Roberts planned OPWL-506 in Spring 2026
(44, 6, 6, 8, NULL), -- Evan Roberts planned OPWL-507 in Spring 2026
(45, 6, 12, 8, NULL), -- Evan Roberts planned OPWL-508 in Spring 2026

--Zoe King Completed enrollments (Fall 2024 and Spring 2025)
(46, 7, 1, 4, 'A'), -- Zoe King completed OPWL-536 in Fall 2024
(47, 7, 15, 5, 'A-'), -- Zoe King completed OPWL-577 in Spring 2025

-- Zoe King in-progress enrollments (Fall 2025)
(48, 7, 17, 7, NULL), -- Zoe King in-progress OPWL-575 in Fall 2025

-- Zoe King planned enrollments (Spring 2026)
(49, 7, 4, 8, NULL), -- Zoe King planned OPWL-518 in Spring 2026

-- Levi Powell Completed enrollments (Spring 2024, Fall 2024, Spring 2025, Summer 2025)
(50, 8, 1, 2, 'A'), -- Levi Powell completed OPWL-536 in Spring 2024
(51, 8, 14, 2, 'A-'), -- Levi Powell completed OPWL-571 in Spring 2024
(52, 8, 15, 5, 'B+'), -- Levi Powell completed OPWL-577 in Spring 2025
(53, 8, 19, 5, 'A'), -- Levi Powell completed OPWL-525 in Spring 2025
(54, 8, 8, 4, 'B'), -- Levi Powell completed OPWL-529 in Fall 2024
(55, 8, 10, 4, 'B-'), -- Levi Powell completed OPWL-535 in Fall 2024
(56, 8, 11, 4, 'B+'), -- Levi Powell completed OPWL-537 in Fall 2024

-- Harper Taylor Completed enrollments (Fall 2024, Spring 2025, Summer 2025)
(57, 9, 1, 4, 'B'), -- Harper Taylor completed OPWL-536 in Fall 2024
(58, 9, 14, 4, 'B-'), -- Harper Taylor completed OPWL-571 in Fall 2024
(59, 9, 15, 5, 'A+'), -- Harper Taylor completed OPWL-577 in Spring 2025
(60, 9, 19, 5, 'A-'), -- Harper Taylor completed OPWL-525 in Spring 2025
(61, 9, 8, 6, 'A-'), -- Harper Taylor completed OPWL-529 in Summer 2025
(62, 9, 10, 6, 'A-'), -- Harper Taylor completed OPWL-535 in Summer 2025
(63, 9, 11, 6, 'B+'), -- Harper Taylor completed OPWL-537 in Summer 2025

-- Harper Taylor in-progress enrollments (Fall 2025)
(64, 9, 3, 7, NULL), -- Harper Taylor in-progress OPWL-560 in Fall 2025
(65, 9, 2, 7, NULL), -- Harper Taylor in-progress OPWL-506 in Fall 2025

-- Harper Taylor planned enrollments (Spring 2026)
(66, 9, 6, 8, NULL), -- Harper Taylor planned OPWL-507 in Spring 2026
(67, 9, 12, 8, NULL), -- Harper Taylor planned OPWL-508 in Spring 2026

-- Charles Murphy Completed enrollments (Spring 2025 and Summer 2025)
(68, 10, 1, 5, 'A'), -- Charles Murphy completed OPWL-536 in Spring 2025
(69, 10, 15, 5, 'A-'), -- Charles Murphy completed OPWL-577 in Spring 2025
(70, 10, 14, 5, 'B+'), -- Charles Murphy completed OPWL-571 in Spring 2025

-- Charles Murphy in-progress enrollments (Fall 2025)
(71, 10, 2, 7, NULL), -- Charles Murphy in-progress OPWL-506 in Fall 2025
(72, 10, 8, 7, NULL), -- Charles Murphy in-progress OPWL-529 in Fall 2025

-- Charles Murphy planned enrollments (Spring 2026)
(73, 10, 10, 8, NULL); -- Charles Murphy planned OPWL-535 in Spring 2026

-- Insert into certificates
INSERT INTO certificates (certificate_id, certificate_name, certificate_short_name, program_id) VALUES
(1, 'Graduate Certificate in Organizational Development (OD)', 'OD', 2);

-- Insert into student_certificates
INSERT INTO student_certificates (student_id, certificate_id, cert_status) VALUES
(1, 1, 'in_progress'), -- Alice Johnson pursuing OD certificate
(2, 1, 'in_progress'), -- Bob Williams pursuing OD certificate
(3, 1, 'in_progress'), -- Nora Castillo pursuing OD certificate
(4, 1, 'in_progress'), -- Gavin Diaz pursuing OD certificate
(5, 1, 'in_progress'), -- Maya Ramos pursuing OD certificate
(6, 1, 'in_progress'), -- Evan Roberts pursuing OD certificate
(7, 1, 'in_progress'), -- Zoe King pursuing OD certificate
(8, 1, 'in_progress'), -- Levi Powell pursuing OD certificate
(9, 1, 'in_progress'), -- Harper Taylor pursuing OD certificate
(10, 1, 'in_progress'); -- Charles Murphy pursuing OD certificate

-- Insert into certificate_courses for OD Certificate Program (certificate overlap with program requirements)
INSERT INTO certificate_courses (certificate_id, course_id) VALUES
(1, 1), -- OPWL-536
(1, 2), -- OPWL-506
(1, 6), -- OPWL-507
(1, 12), -- OPWL-508
(1, 7); -- OPWL-531


-- Insert into degree_plan_comments
INSERT INTO degree_plan_comments (program_id, student_id, author_id, comment_text) VALUES
(1, 1, 2, 'Make sure you register for courses soon!'), -- Need better comment examples
(2, 2, 2, 'Consider taking more electives next semester.'),
(1, 1, 4, 'I am thinking of taking OPWL 507 next semester, what do you think?'),
(1, 1, 2, 'OPWL 507 is a great choice for your degree plan.'),
(2, 1, 2, 'Don''t forget to complete your certificate requirements.'),
(2, 2, 3, 'Remember to check prerequisites before enrolling.'),
(2, 2, 5, 'Very long comment to test the text field in the degree_plan_comments table. This comment goes on and on to ensure that the database can handle longer text entries without any issues. We want to make sure that advisors can leave detailed notes for students regarding their degree plans, course selections, and any other relevant information that may assist them in their academic journey.');


-- Insert into comment_notifications (based on comments added above)
INSERT INTO comment_notifications (recipient_id, triggered_by, title, notif_message, comment_id, program_id, student_id, school_student_id)
SELECT recipient_id, c.author_id, 'New Degree Plan Comment', c.comment_text, c.comment_id, c.program_id, c.student_id, s.school_student_id
FROM degree_plan_comments c
JOIN students s ON s.student_id = c.student_id
JOIN (
    -- get relevant users to notify
    SELECT s.user_id AS recipient_id, s.student_id
    FROM students s
    UNION
    SELECT a.user_id AS recipient_id, ar.student_id
    FROM advisors a
    JOIN advising_relations ar ON a.advisor_id = ar.advisor_id
) r ON r.student_id = c.student_id
WHERE c.author_id IS DISTINCT FROM r.recipient_id; -- avoid notifying the author

-- Track students who have applied for graduation (adjusted to match new schema and enum values)
INSERT INTO graduation_applications (student_id, program_id, status, applied_at, status_updated_at) VALUES
  (1, 1, 'Not Applied', '2025-10-01'::timestamptz, '2025-10-01'::timestamptz), -- Alice Johnson
  (2, 1, 'Not Applied', '2025-10-02'::timestamptz, '2025-10-02'::timestamptz), -- Bob Williams
  (3, 1, 'Not Applied', '2025-10-02'::timestamptz, '2025-10-02'::timestamptz), -- Nora Castillo
  (4, 1, 'Approved',     '2025-10-03'::timestamptz, '2025-10-03'::timestamptz), -- Gavin Diaz
  (5, 1, 'Not Applied', '2025-10-03'::timestamptz, '2025-10-03'::timestamptz), -- Maya Ramos
  (6, 1, 'Not Applied', '2025-10-03'::timestamptz, '2025-10-03'::timestamptz), -- Evan Roberts
  (7, 2, 'Not Applied', '2025-10-04'::timestamptz, '2025-10-04'::timestamptz), -- Zoe King
  (8, 1, 'Not Applied', '2025-10-04'::timestamptz, '2025-10-04'::timestamptz), -- Levi Powell
  (9, 1, 'Applied', '2025-10-05'::timestamptz, '2025-10-05'::timestamptz), -- Harper Taylor
  (10,1, 'Not Applied', '2025-10-05'::timestamptz, '2025-10-05'::timestamptz); -- Charles Murphy


-- TODO: Delete later this is a temporary measure
-- Sets the 'courses_course_id_seq' sequence to the current max course_id in 'courses' to prevent ID conflicts when inserting.
SELECT setval('courses_course_id_seq', (SELECT MAX(course_id) FROM courses));
-- Sets the 'users_user_id_seq' sequence to the current max user_id in 'users' to prevent ID conflicts when inserting.
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users) + 1);
-- Sets the 'students_student_id_seq' sequence to the current max student_id in 'students' to prevent ID conflicts when inserting.
SELECT setval('students_student_id_seq', (SELECT MAX(student_id) FROM students) + 1);
-- Sets the 'advisors_advisor_id_seq' sequence to the current max advisor_id in 'advisors' to prevent ID conflicts when inserting.
SELECT setval('advisors_advisor_id_seq', (SELECT MAX(advisor_id) FROM advisors) + 1);

