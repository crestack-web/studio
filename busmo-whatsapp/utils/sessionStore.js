const sessions = new Map();

const setSession = (userPhone, data) => sessions.set(userPhone, data);
const getSession = (userPhone) => sessions.get(userPhone) || null;
const clearSession = (userPhone) => sessions.delete(userPhone);
const hasSession = (userPhone) => sessions.has(userPhone);

module.exports = { setSession, getSession, clearSession, hasSession };
