<<<<<<< HEAD
# TODO - Github page
test
=======
---
---

<nav>
  <a href="./index.html">Home</a> |
  <a href="./features.html">Features</a>
</nav>

![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

**Team Members:**
- Stephen Buchinskiy
- Anaka Mart
- Inbar Milstein
- Lauren Rausch

---

## Project Abstract

Our team developed a functional prototype of a web-based degree-tracking and advising tool for Boise State University’s graduate programs, to replace the current workflow that relies on Google Docs and spreadsheets. The platform enables advisors and administrators to efficiently track student progress, manage degree plans, and forecast course enrollment for improved planning. Key features include commenting on degree plans, notification support, and reporting tools for enrollment and graduation tracking. Administrators can also create and manage user accounts and permissions.

Because of FERPA and privacy requirements, the prototype uses mock data and does not connect to real student records. The goal of this project is to demonstrate a working foundation that can be expanded in future semesters to support real data integration. Despite being a prototype, the system showcases the potential benefits of a centralized and user-friendly platform for graduate advising.

---

## Project Description

Our application consists of a Node.js backend built with the Express framework and a React frontend that delivers different user experiences depending on user roles. The backend implements routes and data models for major entities, including Students, Users, Degree Plans, Courses, Comments, and Notifications. The PostgreSQL database stores all application data and is initialized using our schema and seed files. The entire system is deployed using Docker Compose.

After logging in, users are directed to a role-specific view that exposes features appropriate for their permissions. Users may have multiple roles, such as an advisor with admin privileges. In that case the user can switch between views through their settings page. The settings page also includes user preferences such as font and font size. Across roles, all users have access to notifications, which can link directly to relevant pages such as degree plan comments.


The Admin view provides pages for managing courses and users in the system. The Advisor view includes an advising page which allows the advisor to manage all their students' degree plans, and a page for enrollment reporting. The Student view allows students to view and track their own degree progress. The Accounting view includes the graduation report and enrollment report pages.

---
>>>>>>> 917f3d1 (Adding code from last team)
