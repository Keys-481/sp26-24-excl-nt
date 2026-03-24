/**
 * Boise State email policy for login-related flows.
 * @param {string} email
 * @returns {boolean}
 */
function isValidBoiseStateEmail(email) {
  if (typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  return /@(?:u\.)?boisestate\.edu$/.test(normalized);
}

module.exports = { isValidBoiseStateEmail };
