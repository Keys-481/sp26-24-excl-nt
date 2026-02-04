/**
 * File: frontend/src/components/DegreePlanComponents/utils/requirementsHelpers.js
 * Utility functions for handling program requirements and degree plan data.
 */

/**
 * Builds a hierarchy of requirements from a flat array.
 * @param {*} flatReqs - The flat array of requirements
 * @returns {*} - The hierarchical structure of requirements
 */
function buildHierarchy(flatReqs) {
    const map = new Map();
    const roots = [];

    // initialize all requirements with empty children array
    flatReqs.forEach(req => {
        map.set(req.requirement_id, { ...req, children: [], courses: [] });
    });

    // connect children to parent requirements
    flatReqs.forEach(req => {
        if (req.parent_requirement_id) {
            const parent = map.get(req.parent_requirement_id);
            if (parent) {
                parent.children.push(map.get(req.requirement_id));
            }
        } else {
            roots.push(map.get(req.requirement_id));
        }
    });

    return roots;
}

/**
 * Flattens a hierarchical requirement structure into a flat array.
 * @param {*} node - The current requirement node
 * @param {*} arr - The array to accumulate flattened requirements
 * @returns {*} - The flattened array of requirements
 */
function flattenHierarchy(node, arr = []) {
    if (!node.courses) node.courses = [];
    if (!node.children) node.children = [];
    arr.push(node);
    node.children.forEach(child => flattenHierarchy(child, arr));
    return arr;
}

/**
 * Calculates the total completed credits for a requirement and its children.
 * Recursively sums completed credits from courses and child requirements.
 * @param {*} req - The requirement object
 * @returns {number} - The total completed credits
 */
function calculateCompletedCredits(req) {
    let completedCredits = req.courses.reduce((sum, course) => {
        return sum + (course.course_status === 'Completed' ? (course.credits || 0) : 0);
    }, 0);

    req.children.forEach(child => {
        completedCredits += calculateCompletedCredits(child);
    });

    req.completedCredits = completedCredits;
    return completedCredits;
}

export {
    buildHierarchy,
    flattenHierarchy,
    calculateCompletedCredits
};