/**
 * @file frontend/src/lib/ExcelParser.js
 * @description Takes a properly formatted xls or xlsx document and parses the data to auto-fill forms for the user.
 * @author Joe Shields
 * @updated 22 Mar 2026
 *
 */

// TODO: Add dependency for SheetsJS

// TODO: Take a file parameter
function uploadPlan(file)
{

}


// TODO: Parse it into JSON
    // Validate content. Remove null values (empty/merged cells)
    // The top section should be straightforward. Get Course# and done/in prog/future date (The rest of the course data is in the DB)
    // The culminating activity/portfolio option/elective sections will be... trickier.
        // If SheetsJS treats the whole thing like one table, use RegExes to parse each line
        //If their normal docs have entries that are more than one line, we're in trouble...

// TODO: Check if student exists. If not, populate a new student page with the data.

// TODO: Check if student has an existing matching degree plan. If so, confirm overwrite. Populate a degree plan page with the data.
