(function () {
  "use strict";

  const demoEmail = "demo@student.com";

  function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function seedDemo() {
    const users = window.SkillStorage.getUsers();
    if (users.some(function (user) { return user.email === demoEmail; })) return;

    users.push({
      name: "Alex Morgan",
      email: demoEmail,
      password: "demo123",
      course: "Computer Science",
      year: "3rd Year"
    });
    window.SkillStorage.saveUsers(users);

    const today = new Date();
    const date = function (offsetDays) {
      const value = new Date(today);
      value.setDate(value.getDate() + offsetDays);
      return value.toISOString().slice(0, 10);
    };
    const skills = [
      { name: "JavaScript", category: "Technical", level: "Advanced", dateStarted: "2023-09-10", notes: "Building interactive web applications." },
      { name: "Python", category: "Technical", level: "Intermediate", dateStarted: "2024-01-15", notes: "Practicing data structures and scripting." },
      { name: "Public Speaking", category: "Soft Skill", level: "Intermediate", dateStarted: "2023-11-02", notes: "Presenting confidently to small groups." },
      { name: "Spanish", category: "Language", level: "Beginner", dateStarted: "2024-04-20", notes: "Learning conversational vocabulary." },
      { name: "UI Design", category: "Creative", level: "Advanced", dateStarted: "2023-08-05", notes: "Exploring accessible interface design." },
      { name: "Teamwork", category: "Soft Skill", level: "Expert", dateStarted: "2022-09-01", notes: "Collaborating on class and volunteer projects." },
      { name: "SQL", category: "Technical", level: "Intermediate", dateStarted: "2024-02-11", notes: "Writing queries and modeling relational data." }
    ].map(function (skill) { return Object.assign({ id: makeId() }, skill); });
    const goals = [
      { id: makeId(), title: "Build a portfolio website", skillId: skills[0].id, targetDate: date(30), progress: 65 },
      { id: makeId(), title: "Complete a Python data project", skillId: skills[1].id, targetDate: date(55), progress: 35 },
      { id: makeId(), title: "Deliver a confident presentation", skillId: skills[2].id, targetDate: date(75), progress: 0 }
    ];
    const certifications = [
      { id: makeId(), title: "Responsive Web Design", issuer: "freeCodeCamp", dateEarned: "2024-03-18", credentialUrl: "" },
      { id: makeId(), title: "Introduction to User Experience Design", issuer: "Coursera", dateEarned: "2024-05-22", credentialUrl: "" }
    ];
    const activity = [
      { id: makeId(), text: "Added JavaScript to your skills", date: new Date().toISOString() },
      { id: makeId(), text: "Set a goal: Build a portfolio website", date: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: makeId(), text: "Added Responsive Web Design certification", date: new Date(Date.now() - 86400000 * 5).toISOString() }
    ];
    window.SkillStorage.saveRecords(demoEmail, { skills: skills, goals: goals, certifications: certifications, activity: activity });
  }

  function getCurrentUser() {
    const session = window.SkillStorage.getSession();
    if (!session || typeof session.email !== "string") return null;
    return window.SkillStorage.getUsers().find(function (user) { return user.email === session.email; }) || null;
  }

  function register(details) {
    const email = details.email.trim().toLowerCase();
    const users = window.SkillStorage.getUsers();
    if (users.some(function (user) { return user.email === email; })) {
      return { ok: false, message: "An account with this email already exists." };
    }
    const user = {
      name: details.name.trim(),
      email: email,
      password: details.password,
      course: details.course.trim(),
      year: details.year
    };
    users.push(user);
    window.SkillStorage.saveUsers(users);
    window.SkillStorage.saveRecords(email, window.SkillStorage.emptyRecords());
    window.SkillStorage.setSession(email);
    return { ok: true, user: user };
  }

  function login(emailInput, password) {
    const email = emailInput.trim().toLowerCase();
    const user = window.SkillStorage.getUsers().find(function (entry) {
      return entry.email === email && entry.password === password;
    });
    if (!user) return { ok: false, message: "Email or password is incorrect." };
    window.SkillStorage.setSession(user.email);
    return { ok: true, user: user };
  }

  function logout() {
    window.SkillStorage.clearSession();
    window.location.href = "index.html";
  }

  seedDemo();

  window.SkillAuth = {
    getCurrentUser: getCurrentUser,
    register: register,
    login: login,
    logout: logout,
    makeId: makeId,
    requireSession: function () {
      const user = getCurrentUser();
      if (!user) {
        window.location.replace("index.html");
        return null;
      }
      return user;
    }
  };
}());
