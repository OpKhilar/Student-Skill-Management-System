(function () {
  "use strict";

  const KEYS = {
    users: "skillspring_users_v1",
    session: "skillspring_session_v1",
    records: "skillspring_records_v1"
  };

  function read(key, fallback) {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch (error) {
      localStorage.removeItem(key);
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function emptyRecords() {
    return { skills: [], goals: [], certifications: [], activity: [] };
  }

  function getRecords(email) {
    const allRecords = read(KEYS.records, {});
    const records = allRecords && typeof allRecords === "object" && !Array.isArray(allRecords) ? allRecords[email] : null;
    if (!records || typeof records !== "object") return emptyRecords();
    return {
      skills: Array.isArray(records.skills) ? records.skills.filter(function (item) {
        return item && typeof item === "object" && typeof item.id === "string" && typeof item.name === "string";
      }) : [],
      goals: Array.isArray(records.goals) ? records.goals.filter(function (item) {
        return item && typeof item === "object" && typeof item.id === "string" && typeof item.title === "string";
      }) : [],
      certifications: Array.isArray(records.certifications) ? records.certifications.filter(function (item) {
        return item && typeof item === "object" && typeof item.id === "string" && typeof item.title === "string";
      }) : [],
      activity: Array.isArray(records.activity) ? records.activity.filter(function (item) {
        return item && typeof item === "object" && typeof item.id === "string" && typeof item.text === "string";
      }) : []
    };
  }

  function saveRecords(email, records) {
    const allRecords = read(KEYS.records, {});
    if (!allRecords || typeof allRecords !== "object" || Array.isArray(allRecords)) {
      write(KEYS.records, {});
    }
    const safeRecords = read(KEYS.records, {});
    safeRecords[email] = records;
    write(KEYS.records, safeRecords);
  }

  function moveRecords(oldEmail, newEmail) {
    const records = read(KEYS.records, {});
    if (!records || typeof records !== "object" || Array.isArray(records)) {
      write(KEYS.records, {});
      return;
    }
    if (Object.prototype.hasOwnProperty.call(records, oldEmail)) {
      records[newEmail] = records[oldEmail];
      delete records[oldEmail];
      write(KEYS.records, records);
    }
  }

  window.SkillStorage = {
    getUsers: function () {
      const users = read(KEYS.users, []);
      return Array.isArray(users) ? users.filter(function (user) {
        return user && typeof user === "object" && typeof user.email === "string" && typeof user.password === "string";
      }) : [];
    },
    saveUsers: function (users) { write(KEYS.users, users); },
    getSession: function () {
      const session = read(KEYS.session, null);
      return session && typeof session.email === "string" ? session : null;
    },
    setSession: function (email) { write(KEYS.session, { email: email }); },
    clearSession: function () { localStorage.removeItem(KEYS.session); },
    getRecords: getRecords,
    saveRecords: saveRecords,
    moveRecords: moveRecords,
    emptyRecords: emptyRecords
  };
}());
