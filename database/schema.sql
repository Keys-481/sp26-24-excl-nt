-- File: database/schema.sql
-- This file defines the database schema for the application.

-- Drop tables in a specific order to avoid foreign key constraints errors
DROP TABLE IF EXISTS
    degree_plan_comments,
    comment_notifications,
    degree_plans,
    student_programs,
    enrollments,
    student_certificates,
    advising_relations,
    certificate_courses,
    requirement_courses,
    course_offerings,
    course_prerequisites,
    user_permissions,
    user_roles,
    role_permissions,
    roles,
    permissions,
    students,
    advisors,
    users,
    semesters,
    programs,
    courses,
    certificates,
    program_requirements,
    user_settings,
    graduation_applications
CASCADE;


-- DROP ALL CUSTOM TYPES (CASCADE)
DROP TYPE IF EXISTS
    grade,
    program_type,
    requirement_type,
    notif_type,
    cert_status,
    role_name,
    semester_type,
    course_status,
    permission_name,
    grad_status
CASCADE;

-- Define Custom Types --
CREATE TYPE grade AS ENUM('A+','A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'W');
CREATE TYPE program_type AS ENUM('masters', 'certificate', 'undergraduate');
CREATE TYPE requirement_type AS ENUM('core', 'elective', 'culminating_activity', 'portfolio', 'thesis', 'research', 'misc');
CREATE TYPE cert_status AS ENUM('in_progress', 'completed');
CREATE TYPE role_name AS ENUM('admin', 'advisor', 'student', 'accounting');
CREATE TYPE semester_type AS ENUM('FA', 'SP', 'SU');
CREATE TYPE course_status AS ENUM('Unplanned', 'Planned', 'In Progress', 'Completed', 'Dropped', 'Failed', 'Withdrawn');
CREATE TYPE permission_name AS ENUM('view_all_students', 'view_assigned_students',
                                    'view_own_data', 'edit_degree_plan', 'comment_create',
                                    'comment_edit', 'comment_delete', 'enrollment_reporting',
                                    'graduation_reporting', 'user_create', 'user_modify', 'user_delete',
                                    'user_grant_permissions', 'course_create', 'course_modify', 'course_delete');

------- Core User and Access Management Tables -------

-- Roles Table:
-- Defines different user roles
-- role_name is an ENUM type defined above (e.g., admin, advisor, student, accounting)
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name role_name UNIQUE NOT NULL
);

-- Users Table:
-- Stores user credentials and personal information
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    public_id VARCHAR(9) UNIQUE NOT NULL,
    default_view INT REFERENCES roles(role_id)
);

-- User Settings Table:
-- Stores user interface preferences
CREATE TABLE user_settings (
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE PRIMARY KEY,
    theme VARCHAR(20) NOT NULL DEFAULT 'light', -- e.g., 'light' or 'dark' --
    font_size_change VARCHAR(10) NOT NULL DEFAULT '0px', -- e.g., '0px', '4px', '-2px' --
    font_family VARCHAR(100) NOT NULL DEFAULT 'Arial, sans-serif' -- e.g., 'Arial, sans-serif', 'Times New Roman, serif' --
);

-- Permissions Table:
-- Defines various permissions that can be assigned to roles
-- permission_name is an ENUM type defined above (e.g., view_all_students, edit_degree_plan)
CREATE TABLE permissions (
    permission_id SERIAL PRIMARY KEY,
    permission_name permission_name UNIQUE NOT NULL
);

-- Role-Permissions Mapping Table:
-- Many-to-Many relationship between roles and permissions
CREATE TABLE role_permissions (
    role_id INT REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- User-Roles Mapping Table:
-- Many-to-Many relationship between users and roles
CREATE TABLE user_roles (
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(role_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- User-Permissions Mapping Table:
-- optional direct user-permission grants/revokes that override role-based permissions --
-- Many-to-Many relationship between users and permissions
CREATE TABLE user_permissions (
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(permission_id) ON DELETE CASCADE,
    grant_or_revoke BOOLEAN NOT NULL, -- TRUE = grant, FALSE = revoke --
    PRIMARY KEY (user_id, permission_id)
);

CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission_id ON user_permissions(permission_id);

-- Programs and Courses Tables --

-- Programs Table:
-- Defines academic programs
-- program_type is an ENUM type defined above (masters, certificate, undergraduate)
CREATE TABLE programs (
    program_id SERIAL PRIMARY KEY,
    program_name VARCHAR(255) NOT NULL,
    program_type program_type NOT NULL
);

-- Courses Table:
-- Defines courses offered in the programs
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    credits INT NOT NULL
);

-- Semesters Table:
-- Defines academic semesters
-- semester_type is an ENUM type defined above (FA, SP, SU)
CREATE TABLE semesters (
    semester_id SERIAL PRIMARY KEY,
    semester_name VARCHAR(50) UNIQUE NOT NULL,
    semester_type semester_type NOT NULL,
    sem_start_date DATE NOT NULL,
    sem_end_date DATE NOT NULL
);

-- Course Prerequisites Table:
-- Many-to-Many relationship between courses to define prerequisites
CREATE TABLE course_prerequisites (
    course_id INT REFERENCES courses(course_id) ON DELETE CASCADE,
    prerequisite_course_id INT REFERENCES courses(course_id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, prerequisite_course_id)
);

CREATE INDEX idx_course_prerequisites_course_id ON course_prerequisites(course_id);
CREATE INDEX idx_course_prerequisites_prereq_id ON course_prerequisites(prerequisite_course_id);

-- Course Offerings Table:
-- Defines which courses are offered in which semester types
CREATE TABLE course_offerings (
    course_id INT REFERENCES courses(course_id) ON DELETE CASCADE,
    semester_type semester_type NOT NULL,
    PRIMARY KEY (course_id, semester_type)
);

CREATE INDEX idx_course_offerings_course_id ON course_offerings(course_id);

-- Program Requirements Table:
-- Defines degree requirements for each program
-- requirement_type is an ENUM type defined above (core, elective, culminating_activity, portfolio, thesis, research, misc)
CREATE TABLE program_requirements (
    requirement_id SERIAL PRIMARY KEY,
    program_id INT REFERENCES programs(program_id) ON DELETE CASCADE,
    requirement_type requirement_type NOT NULL,
    req_description TEXT NOT NULL,
    required_credits INT,
    parent_requirement_id INT REFERENCES program_requirements(requirement_id) ON DELETE CASCADE,
    display_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_program_requirements_program_id ON program_requirements(program_id);
CREATE INDEX idx_program_requirements_parent_req_id ON program_requirements(parent_requirement_id);

-- Requirement-Courses Mapping Table:
-- Many-to-Many relationship between program requirements and courses
CREATE TABLE requirement_courses (
    requirement_id INT REFERENCES program_requirements(requirement_id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(course_id) ON DELETE CASCADE,
    PRIMARY KEY (requirement_id, course_id)
);

CREATE INDEX idx_requirement_courses_requirement_id ON requirement_courses(requirement_id);
CREATE INDEX idx_requirement_courses_course_id ON requirement_courses(course_id);

-- Certificates Table:
-- Defines certificates that can be earned within programs
CREATE TABLE certificates (
    certificate_id SERIAL PRIMARY KEY,
    certificate_name VARCHAR(255) NOT NULL,
    certificate_short_name VARCHAR(50) UNIQUE NOT NULL,
    program_id INT REFERENCES programs(program_id) ON DELETE CASCADE
);

CREATE INDEX idx_certificates_program_id ON certificates(program_id);

-- Certificate-Courses Mapping Table:
-- Many-to-Many relationship between certificates and courses
CREATE TABLE certificate_courses (
    certificate_id INT REFERENCES certificates(certificate_id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(course_id) ON DELETE CASCADE,
    PRIMARY KEY (certificate_id, course_id)
);

CREATE INDEX idx_certificate_courses_certificate_id ON certificate_courses(certificate_id);
CREATE INDEX idx_certificate_courses_course_id ON certificate_courses(course_id);

-- Student and Advisor Tables --

-- Students Table:
-- Links to users table and includes student-specific information
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    school_student_id VARCHAR(9) UNIQUE NOT NULL,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (school_student_id) REFERENCES users(public_id)
);

CREATE INDEX idx_students_user_id ON students(user_id);

-- Advisors Table:
-- Links to users table and includes advisor-specific information
CREATE TABLE advisors (
    advisor_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_advisors_user_id ON advisors(user_id);

-- Advising Relations Table:
-- Many-to-Many relationship between advisors and students
CREATE TABLE advising_relations (
    advisor_id INT REFERENCES advisors(advisor_id) ON DELETE CASCADE,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    PRIMARY KEY (advisor_id, student_id)
);

CREATE INDEX idx_advising_relations_advisor_id ON advising_relations(advisor_id);
CREATE INDEX idx_advising_relations_student_id ON advising_relations(student_id);

-- Student Plans and Enrollment Tables --

-- Degree Plans Table:
-- Tracks the courses a student plans to take or has taken, along with their status
-- course_status is an ENUM type defined above (Planned, In Progress, Completed, Dropped, Failed, Withdrawn)
CREATE TABLE degree_plans (
    plan_id SERIAL PRIMARY KEY,
    program_id INT REFERENCES programs(program_id) ON DELETE CASCADE,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(course_id) ON DELETE CASCADE,
    semester_id INT REFERENCES semesters(semester_id) ON DELETE CASCADE,
    catalog_year VARCHAR(9) NOT NULL,
    course_status course_status NOT NULL,
    CONSTRAINT unique_degree_plan_entry UNIQUE (student_id, course_id, program_id)
);

CREATE INDEX idx_degree_plans_student_id ON degree_plans(student_id);
CREATE INDEX idx_degree_plans_course_id ON degree_plans(course_id);
CREATE INDEX idx_degree_plans_semester_id ON degree_plans(semester_id);
CREATE INDEX idx_degree_plans_catalog_year ON degree_plans(catalog_year);
CREATE INDEX idx_degree_plans_program_id ON degree_plans(program_id);

-- Student-Programs Mapping Table:
-- Many-to-Many relationship between students and programs (for dual majors, minors, certificates)
CREATE TABLE student_programs (
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    program_id INT REFERENCES programs(program_id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, program_id)
);

CREATE INDEX idx_student_programs_student_id ON student_programs(student_id);
CREATE INDEX idx_student_programs_program_id ON student_programs(program_id);

-- Enrollments Table:
-- Tracks actual enrollments and grades for students in courses per semester
-- grade is an ENUM type defined above (NULL if not yet graded)
CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(course_id) ON DELETE CASCADE,
    semester_id INT REFERENCES semesters(semester_id) ON DELETE CASCADE,
    grade grade
);

CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_semester_id ON enrollments(semester_id);

-- Student-Certificates Mapping Table:
-- Many-to-Many relationship between students and certificates with status
-- cert_status is an ENUM type defined above (in_progress, completed)
CREATE TABLE student_certificates (
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    certificate_id INT REFERENCES certificates(certificate_id) ON DELETE CASCADE,
    cert_status cert_status NOT NULL,
    PRIMARY KEY (student_id, certificate_id)
);

CREATE INDEX idx_student_certificates_student_id ON student_certificates(student_id);
CREATE INDEX idx_student_certificates_certificate_id ON student_certificates(certificate_id);

-- Comments and Notifications Tables --

-- Degree Plan Comments Table:
-- Stores comments made by advisors or students on degree plans
CREATE TABLE degree_plan_comments (
    comment_id SERIAL PRIMARY KEY,
    program_id INT REFERENCES programs(program_id) ON DELETE CASCADE,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    author_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_degree_plan_comments_student_program ON degree_plan_comments(program_id, student_id);
CREATE INDEX idx_degree_plan_comments_author_id ON degree_plan_comments(author_id);

-- Comment Notifications Table:
-- Stores notifications triggered by comments on degree plans
CREATE TABLE comment_notifications (
    notification_id SERIAL PRIMARY KEY,
    recipient_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    triggered_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    title TEXT,
    notif_message TEXT NOT NULL,
    comment_id INT REFERENCES degree_plan_comments(comment_id) ON DELETE CASCADE,
    program_id INT REFERENCES programs(program_id) ON DELETE CASCADE,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    school_student_id VARCHAR(9) references students(school_student_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_notifications_recipient_id ON comment_notifications(recipient_id);
CREATE INDEX idx_notifications_triggered_by ON comment_notifications(triggered_by);
CREATE INDEX idx_notifications_comment ON comment_notifications(comment_id);
CREATE INDEX idx_notifications_program_student ON comment_notifications(program_id, student_id);
CREATE INDEX idx_notifications_user_unread ON comment_notifications(recipient_id, is_read, created_at DESC);

-- graduation application statuses
CREATE TYPE grad_status AS ENUM('Not Applied', 'Applied', 'Under Review', 'Approved', 'Rejected');

CREATE TABLE IF NOT EXISTS graduation_applications (
    application_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    program_id INT REFERENCES programs(program_id) ON DELETE SET NULL,
    status grad_status NOT NULL DEFAULT 'Not Applied',
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO graduation_applications (student_id, program_id, status)
SELECT s.student_id, NULL, 'Not Applied'
FROM students s
LEFT JOIN graduation_applications g ON s.student_id = g.student_id
WHERE g.student_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_grad_apps_student_id ON graduation_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_grad_apps_status ON graduation_applications(status);
CREATE INDEX IF NOT EXISTS idx_grad_apps_status_updated_at ON graduation_applications(status_updated_at DESC);
