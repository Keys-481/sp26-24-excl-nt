[![CI](https://github.com/Keys-481/sp26-24-excl-nt/actions/workflows/ci.yml/badge.svg)](https://github.com/Keys-481/sp26-24-excl-nt/actions/workflows/ci.yml)

# Capstone Project: Graduate Advising Tool
This project is a full-stack web application for managing graduate student degree plans and advising workflows. The platform includes a Node.js/Express backend, a React frontend, and a PostgreSQL database.

The system provides role-based interfaces for Admins, Advisors, Students, and Accounting users, supporting degree plan management, comments and notifications, course and user management, and enrollment/graduation reporting.

## Prerequisites
To run this project, you need to have the following installed on your machine:
* Node.js (LTS version)
* PostgreSQL
* Docker or Podman

Environment files required (do not commit to version control), example files are provided in this repository:
* `.env`: for production / Docker
* `.env.dev`: for local development
* `.env.test`: for testing

## Quick start (local development)

From the repo root:

```
cp .env.example .env
cp .env.example.dev .env.dev
cp .env.example.test .env.test
npm run dev
```

Then follow the short env checklist (what to paste + what to expect) in `.env.example`.

## Local Development Setup
1. Install dependendencies via:

```
cd backend && npm install
cd ../frontend && npm install
```

2. Create your local development environment file in the root directory with your local database credentials following the `.env.example.dev` file as a template.

3. Use your local PostgreSQL client (`psql`) to create the database and user that matches the credentials in your `.env.dev` file:

```
psql -U postgres
CREATE USER <user> WITH PASSWORD '<password>';
CREATE DATABASE <database_name> OWNER <user>;
\q
```

4. From root directory, start backend + frontend, as well as auto-run database setup via:

```
npm run dev
```

The app (user interface) will be available at http://localhost:5173/

## Running with Docker/Podman
The project includes scripts for deployment:

1. Create an `.env` file in the root directory.

2. Build + start services via `./build.sh` or `npm run build`. This will automatically detect Docker or Podman, build the containers, and start the services. The app will be available on the port configured in your `.env` file.

3. Use `./clean.sh` or `npm run clean` to stop and remove containers.

**Note**: You may get a Windows line-endings error. Use the following fix:

```
sed -i 's/\r$//' build.sh test.sh clean.sh help.sh
chmod +x build.sh test.sh clean.sh help.sh
```

## Setting up to run with SDP Server
The project should be set up to run on the SDP server, all that needs to be done is changing the basename to the chosen name. This will determine the URL path where the application is hosted at.

The basename is the base URL that will be shown on the SDP website. For example `https://sdp.boisestate.edu/s26-excl-nt/login`, the `/s26-excl-nt` is the basename chosen in this URL.

1. Change all references to the basename in [docker-compose.yml](docker-compose.yml) and [Dockerfile](Dockerfile) with your chosen basename.

2. Create an `.env` file that will include the chosen basename. This basename will then be used for `PUBLIC_URL` and `API_BASE_URL`. For example, `PUBLIC_URL=/basename` and `API_BASE_URL=/basename/api`. Make sure you update the database credentials to what you want them to be.

3. Ensure that the basename you chose matches throughout `Dockerfile`, `docker-compose.yml` file, and `.env` files.

4. Add Eric Henderson as a read-only collaborator to your GitHub repository. His GitHub username is ekhenderson.

5. Email Eric Henderson - ehenderson@boisestate.edu - to deploy this project to the SDP server. Ensure that you send him the`.env` file you wish to use. We do not want to commit it directly to the repository, so instead, you can email it to him.

There are more instructions on the [SDP wesbite](https://sdp.boisestate.edu/cs481/home) under Documentation -> Deployment

If there are any issues, remember to use the web dev tools to see what errors are being returned. `fn` + `F12` for Mac and `F12` on Windows.

## Testing
To run the tests, use `./test.sh` or `npm run test` from the root directory. This script relies on the `env.test` file so make sure to create one from the example.

## Command Summary (Help Script)
The project includes a root-level help script for quick reference. Use `./help.sh` or `npm run help` from the root directory. This will print a list of available commands for the project.

