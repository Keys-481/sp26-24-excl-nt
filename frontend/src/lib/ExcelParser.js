/**
 * @file frontend/src/lib/ExcelParser.js
 * @description Takes a properly formatted .xlsx document and parses the data to auto-fill forms for the user. The ExcelJS tool CANNOT handle the .xls format.
 * Note that ExcelJS uses 1-indexing.
 * @author Joe Shields
 * @updated 8 Apr 2026
 *
 */

/**
 * 
 * @param {*} file (.xlsx)
 */
async function uploadPlan(file)
{
    /* Parse the file into JSON */
    await createWorkbook(file);

    /* Parses only the first sheet in a workbook. If user switches to a format where 
     * a file contains multiple student tabs, put the following in a loop. */
    const jsonData = parseSheetToJSON(file, 1); /* Excel uses 1-indexing */
    validateStudent(jsonData.student);
    validatePlan(jsonData);
}

async function createWorkbook(file)
{
    const workbook = new ExcelJS.workbook();
    const data = await file.arrayBuffer();
    await workbook.xlsx.load(data);
    return workbook;  
}

function parseSheetToJSON(workbook, sheet)
{
    const worksheet = workbook.getWorksheet(sheet); /* Excel uses 1-indexing. */

    // TODO: Add parsing logic based on the client's format and return the JSON object
        // Read until "headers" row is found. Parse them into an array.
        // Read until EOF or row includes a course id (use RegEx).
            // validate course id (add pop-up if correction/addition is required?)
        // Check if row contains a "planned" semester (Depends on client format)
            // If yes, standardize formatting and add to student plan.
            // else, ignore row.
        // Return {student: obj, plan: obj};
}

async function validateStudent(student)
{
    // TODO: Check if student exists in the database. 
        // If not, display/populate a new student page with the data.
            // Wait for user to verify/submit.
            // Wait for database to update.
}

async function validatePlan(jsonData)
{
    // TODO: Check if jsonData.student has an existing matching degree plan. 
        // If yes, ask user to confirm overwrite. 
            // If yes, populate a degree plan page with the data.
                // Wait for user to verify/submit.
                // Wait for database to update.
}