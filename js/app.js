(function () {
  "use strict";

  const categories = ["Technical", "Soft Skill", "Language", "Creative", "Other"];
  const levels = ["Beginner", "Intermediate", "Advanced", "Expert"];
  const levelValues = { Beginner: 25, Intermediate: 50, Advanced: 75, Expert: 100 };
  const navItems = [
    { page: "dashboard", label: "Dashboard", href: "dashboard.html" },
    { page: "skills", label: "Skills", href: "skills.html" },
    { page: "goals", label: "Goals", href: "goals.html" },
    { page: "certifications", label: "Certifications", href: "certifications.html" },
    { page: "profile", label: "Profile", href: "profile.html" }
  ];

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function dateLabel(value) {
    if (!value) return "Not set";
    const date = new Date(value + (String(value).length === 10 ? "T00:00:00" : ""));
    if (Number.isNaN(date.getTime())) return "Not set";
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function showToast(message, type) {
    const region = document.getElementById("toast-region");
    if (!region) return;
    const toast = document.createElement("div");
    toast.className = "toast" + (type ? " toast-" + type : "");
    toast.setAttribute("role", "status");
    toast.textContent = message;
    region.appendChild(toast);
    window.setTimeout(function () { toast.remove(); }, 3600);
  }

  function addActivity(text) {
    const records = window.SkillStorage.getRecords(currentUser.email);
    records.activity.unshift({ id: window.SkillAuth.makeId(), text: text, date: new Date().toISOString() });
    records.activity = records.activity.slice(0, 12);
    window.SkillStorage.saveRecords(currentUser.email, records);
  }

  function currentRecords() {
    return window.SkillStorage.getRecords(currentUser.email);
  }

  function saveRecords(records) {
    window.SkillStorage.saveRecords(currentUser.email, records);
  }

  function pageHeading(title, description, action) {
    return '<div class="page-heading"><div><h1>' + title + '</h1><p>' + description + '</p></div>' +
      (action ? '<div class="heading-actions">' + action + "</div>" : "") + "</div>";
  }

  function emptyState(title, message, action) {
    return '<div class="empty-state"><strong>' + escapeHTML(title) + "</strong><span>" + escapeHTML(message) + "</span>" +
      (action ? '<div class="quick-links">' + action + "</div>" : "") + "</div>";
  }

  function button(label, action, secondary) {
    return '<button class="button ' + (secondary ? "button-secondary" : "button-primary") + '" type="button" data-action="' +
      escapeHTML(action) + '">' + escapeHTML(label) + "</button>";
  }

  function renderShell(page) {
    const shell = document.getElementById("app-shell");
    shell.innerHTML = '<header class="app-header"><div class="header-inner">' +
      '<a class="brand" href="dashboard.html"><span class="brand-mark" aria-hidden="true">S</span> SkillSpring</a>' +
      '<button class="menu-toggle" type="button" aria-label="Open navigation menu" aria-expanded="false" aria-controls="main-navigation">☰</button>' +
      '<nav class="app-nav" id="main-navigation" aria-label="Main navigation">' +
      navItems.map(function (item) {
        return '<a href="' + item.href + '"' + (page === item.page ? ' aria-current="page"' : "") + ">" + item.label + "</a>";
      }).join("") + "</nav>" +
      '<div class="header-actions"><span class="header-user">' + escapeHTML(currentUser.name) + '</span><button class="button logout-button button-small" type="button" data-action="logout">Log out</button></div>' +
      '</div></header><main id="page-content" class="app-main"></main><footer class="app-footer">SkillSpring · Your progress, all in one place</footer>';

    const toggle = shell.querySelector(".menu-toggle");
    const nav = shell.querySelector(".app-nav");
    toggle.addEventListener("click", function () {
      const isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    });
  }

  function renderDashboard() {
    const records = currentRecords();
    const mastered = records.skills.filter(function (skill) { return skill.level === "Expert"; }).length;
    const activeGoals = records.goals.filter(function (goal) { return Number(goal.progress) < 100; }).length;
    const content = document.getElementById("page-content");
    const distribution = levels.map(function (level) {
      const count = records.skills.filter(function (skill) { return skill.level === level; }).length;
      const width = records.skills.length ? Math.round(count / records.skills.length * 100) : 0;
      return '<div class="distribution-row"><span>' + level + '</span><div class="bar-track" role="img" aria-label="' + level + ': ' + count + ' skills"><div class="bar-fill" style="width:' + width + '%"></div></div><strong>' + count + "</strong></div>";
    }).join("");
    const activity = records.activity.slice(0, 5).map(function (item) {
      return '<li class="activity-item"><span class="activity-dot" aria-hidden="true"></span><div class="activity-copy"><strong>' + escapeHTML(item.text) +
        '</strong><time datetime="' + escapeHTML(item.date) + '">' + dateLabel(item.date) + "</time></div></li>";
    }).join("");
    content.innerHTML = pageHeading("Welcome, " + escapeHTML(currentUser.name.split(/\s+/)[0]) + "!", "A quick look at how your learning is growing.") +
      '<section class="stats-grid" aria-label="Your learning summary">' +
      statCard("Total skills", records.skills.length) + statCard("Skills mastered", mastered) +
      statCard("Active goals", activeGoals) + statCard("Certifications", records.certifications.length) + "</section>" +
      '<div class="dashboard-grid"><section class="panel"><h2>Skill-level distribution</h2>' +
      (records.skills.length ? '<div class="distribution-list">' + distribution + "</div>" : emptyState("No skills yet", "Add your first skill to see your progress.")) +
      '<div class="quick-links">' + button("Manage skills", "go-skills", true) + "</div></section>" +
      '<section class="panel"><h2>Recent activity</h2>' +
      (activity ? '<ul class="activity-list">' + activity + "</ul>" : emptyState("Your story starts here", "Actions you take will appear here.")) +
      '<div class="quick-links">' + button("View goals", "go-goals", true) + "</div></section></div>";
  }

  function statCard(label, value) {
    return '<article class="stat-card"><span class="stat-label">' + label + '</span><strong class="stat-value">' + value + "</strong></article>";
  }

  function renderSkills() {
    const records = currentRecords();
    const content = document.getElementById("page-content");
    const options = function (items) {
      return items.map(function (item) { return '<option value="' + item + '">' + item + "</option>"; }).join("");
    };
    content.innerHTML = pageHeading("My skills", "Track what you know and how far you have come.", button("＋ Add skill", "add-skill")) +
      '<section class="panel"><div class="toolbar">' +
      '<div class="search-field"><label for="skill-search">Search skills</label><input id="skill-search" type="search" placeholder="Search by name or notes"></div>' +
      '<div><label for="category-filter">Category</label><select id="category-filter"><option value="">All categories</option>' + options(categories) + "</select></div>" +
      '<div><label for="level-filter">Level</label><select id="level-filter"><option value="">All levels</option>' + options(levels) + "</select></div>" +
      '<div><label for="skill-sort">Sort by</label><select id="skill-sort"><option value="name">Name</option><option value="level">Level</option><option value="date">Date started</option></select></div>' +
      '</div><div id="skills-list"></div></section>';
    ["skill-search", "category-filter", "level-filter", "skill-sort"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", updateSkillList);
    });
    updateSkillList();
  }

  function updateSkillList() {
    const records = currentRecords();
    const search = document.getElementById("skill-search").value.trim().toLowerCase();
    const category = document.getElementById("category-filter").value;
    const level = document.getElementById("level-filter").value;
    const sort = document.getElementById("skill-sort").value;
    const rank = { Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4 };
    const filtered = records.skills.filter(function (skill) {
      return (!search || (skill.name + " " + skill.notes).toLowerCase().includes(search)) &&
        (!category || skill.category === category) && (!level || skill.level === level);
    });
    filtered.sort(function (a, b) {
      if (sort === "level") return (rank[a.level] || 0) - (rank[b.level] || 0) || a.name.localeCompare(b.name);
      if (sort === "date") return String(b.dateStarted).localeCompare(String(a.dateStarted));
      return a.name.localeCompare(b.name);
    });
    const list = document.getElementById("skills-list");
    if (!filtered.length) {
      list.innerHTML = emptyState(records.skills.length ? "No matching skills" : "No skills added yet", records.skills.length ? "Try changing your search or filters." : "Add a skill to start building your learning profile.", records.skills.length ? "" : button("＋ Add your first skill", "add-skill"));
      return;
    }
    list.innerHTML = '<div class="table-wrap"><table class="data-table"><thead><tr><th>Skill</th><th>Category</th><th>Proficiency</th><th>Started</th><th>Actions</th></tr></thead><tbody>' +
      filtered.map(function (skill) {
        const percentage = levelValues[skill.level] || 0;
        return "<tr><td><span class=\"skill-name\">" + escapeHTML(skill.name) + "</span>" +
          (skill.notes ? '<span class="skill-subtext">' + escapeHTML(skill.notes) + "</span>" : "") + "</td><td>" + escapeHTML(skill.category) +
          '</td><td><div class="skill-level">' + escapeHTML(skill.level) + '<div class="progress-track" role="img" aria-label="' + escapeHTML(skill.level) + ' proficiency"><div class="progress-fill" style="width:' + percentage + '%"></div></div></div></td><td>' +
          dateLabel(skill.dateStarted) + '</td><td><div class="row-actions"><button class="text-button" type="button" data-action="edit-skill" data-id="' + escapeHTML(skill.id) + '">Edit</button>' +
          '<button class="text-button" type="button" data-action="delete-skill" data-id="' + escapeHTML(skill.id) + '">Delete</button></div></td></tr>';
      }).join("") + "</tbody></table></div>";
  }

  function renderGoals() {
    const records = currentRecords();
    const content = document.getElementById("page-content");
    content.innerHTML = pageHeading("Learning goals", "Turn your plans into progress you can see.", button("＋ Add goal", "add-goal"));
    if (!records.goals.length) {
      content.insertAdjacentHTML("beforeend", '<section class="panel">' + emptyState("No goals yet", "Choose a skill and set a target to get started.", button("＋ Set a learning goal", "add-goal")) + "</section>");
      return;
    }
    content.insertAdjacentHTML("beforeend", '<section class="goal-list" aria-label="Your learning goals">' + records.goals.map(function (goal) {
      const progress = Math.max(0, Math.min(100, Number(goal.progress) || 0));
      const status = progress === 100 ? "Completed" : (progress === 0 ? "Not Started" : "In Progress");
      const overdue = goal.targetDate && goal.targetDate < new Date().toISOString().slice(0, 10) && progress < 100;
      const skill = records.skills.find(function (item) { return item.id === goal.skillId; });
      return '<article class="goal-card"><div class="goal-top"><div><h2>' + escapeHTML(goal.title) + '</h2><span class="goal-skill">' +
        escapeHTML(skill ? skill.name : "Skill removed") + "</span></div><span class=\"status-badge " +
        (overdue ? "status-overdue" : status === "Completed" ? "status-completed" : status === "In Progress" ? "status-in-progress" : "status-not-started") +
        '">' + (overdue ? "Overdue" : status) + '</span></div><div class="progress-track" role="img" aria-label="' + progress + '% complete"><div class="progress-fill" style="width:' + progress + '%"></div></div>' +
        '<div class="goal-meta"><span>Target: ' + dateLabel(goal.targetDate) + '</span><strong>' + progress + "%</strong></div>" +
        '<div class="goal-controls"><label for="goal-progress-' + escapeHTML(goal.id) + '">Update progress <input id="goal-progress-' + escapeHTML(goal.id) +
        '" type="range" min="0" max="100" step="5" value="' + progress + '" data-action="goal-progress" data-id="' + escapeHTML(goal.id) + '" aria-label="Progress for ' + escapeHTML(goal.title) + '"></label>' +
        '<div class="goal-actions"><button class="text-button" type="button" data-action="edit-goal" data-id="' + escapeHTML(goal.id) + '">Edit</button><button class="text-button" type="button" data-action="delete-goal" data-id="' + escapeHTML(goal.id) + '">Delete</button></div></div></article>';
    }).join("") + "</section>");
  }

  function renderCertifications() {
    const records = currentRecords();
    const content = document.getElementById("page-content");
    content.innerHTML = pageHeading("Certifications & achievements", "Give your hard-earned milestones a place to shine.", button("＋ Add certificate", "add-certification"));
    if (!records.certifications.length) {
      content.insertAdjacentHTML("beforeend", '<section class="panel">' + emptyState("No certificates yet", "Add a course certificate or other achievement.", button("＋ Add a certificate", "add-certification")) + "</section>");
      return;
    }
    content.insertAdjacentHTML("beforeend", '<section class="certificate-grid" aria-label="Your certifications">' + records.certifications.map(function (certificate) {
      const url = safeCredentialUrl(certificate.credentialUrl);
      return '<article class="certificate-card"><span class="certificate-symbol" aria-hidden="true">✓</span><h2>' + escapeHTML(certificate.title) +
        '</h2><span class="certificate-issuer">' + escapeHTML(certificate.issuer) + '</span><span class="certificate-date">Earned ' + dateLabel(certificate.dateEarned) +
        '</span><div class="certificate-actions">' + (url ? '<a class="credential-link" href="' + escapeHTML(url) + '" target="_blank" rel="noopener noreferrer">View credential ↗</a>' : "<span></span>") +
        '<button class="text-button" type="button" data-action="delete-certification" data-id="' + escapeHTML(certificate.id) + '">Delete</button></div></article>';
    }).join("") + "</section>");
  }

  function safeCredentialUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch (error) {
      return "";
    }
  }

  function renderProfile() {
    const records = currentRecords();
    const content = document.getElementById("page-content");
    const initial = currentUser.name.trim().charAt(0).toUpperCase() || "?";
    const groupCounts = categories.map(function (category) {
      const count = records.skills.filter(function (skill) { return skill.category === category; }).length;
      const width = records.skills.length ? Math.round(count / records.skills.length * 100) : 0;
      return '<div class="summary-row"><span>' + category + '</span><div class="bar-track" role="img" aria-label="' + category + ': ' + count + ' skills"><div class="bar-fill" style="width:' + width + '%"></div></div><strong>' + count + "</strong></div>";
    }).join("");
    content.innerHTML = pageHeading("My profile", "Your student details and a snapshot of your skills.", '<button class="button button-primary" type="button" data-action="edit-profile">Edit profile</button>') +
      '<div class="profile-grid"><section class="profile-card" aria-label="Student details"><div class="profile-avatar" aria-hidden="true">' + escapeHTML(initial) +
      '</div><h2 class="profile-name">' + escapeHTML(currentUser.name) + '</h2><p class="profile-email">' + escapeHTML(currentUser.email) +
      '</p><dl class="detail-list"><div class="detail-row"><dt>Course</dt><dd>' + escapeHTML(currentUser.course || "Not set") +
      '</dd></div><div class="detail-row"><dt>Year of study</dt><dd>' + escapeHTML(currentUser.year || "Not set") + '</dd></div></dl><div class="profile-actions">' +
      '<button class="button button-secondary" type="button" data-action="export-data">Export my data as JSON</button><button class="button button-secondary" type="button" data-action="print-profile">Print profile</button></div></section>' +
      '<section class="profile-card"><h2>Skill summary</h2>' + (records.skills.length ? groupCounts : emptyState("Your skill summary is waiting", "Add skills to see your category breakdown.")) +
      '<div class="quick-links"><span class="muted">' + records.skills.length + " skills · " + records.goals.length + " goals · " + records.certifications.length + " certifications</span></div></section></div>";
  }

  function modalForm(title, formId, fields, submitLabel) {
    const root = document.getElementById("modal-root");
    root.innerHTML = '<div class="modal-backdrop" data-action="backdrop-close"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-header"><h2 id="modal-title">' +
      escapeHTML(title) + '</h2><button class="modal-close" type="button" aria-label="Close dialog" data-action="close-modal">×</button></div><form id="' + formId + '" novalidate>' +
      fields + '<div class="modal-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">' + escapeHTML(submitLabel) + "</button></div></form></section></div>";
    root.querySelector(".modal-backdrop").addEventListener("click", function (event) {
      if (event.target === event.currentTarget) closeModal();
    });
    root.querySelector(".modal").addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeModal();
      if (event.key === "Tab") trapFocus(event, root.querySelector(".modal"));
    });
    const first = root.querySelector("input, select, textarea, button");
    if (first) first.focus();
  }

  function trapFocus(event, container) {
    const focusable = Array.prototype.slice.call(container.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function closeModal() {
    const root = document.getElementById("modal-root");
    root.innerHTML = "";
  }

  function field(name, label, value, type, required, extra) {
    const id = "field-" + name;
    const safeValue = escapeHTML(value || "");
    const attributes = extra || "";
    const input = type === "textarea"
      ? '<textarea id="' + id + '" name="' + name + '"' + (required ? " required" : "") + attributes + ">" + safeValue + "</textarea>"
      : '<input id="' + id + '" name="' + name + '" type="' + type + '" value="' + safeValue + '"' + (required ? " required" : "") + attributes + ">";
    return '<label for="' + id + '">' + label + (required ? " <span aria-hidden=\"true\">*</span>" : "") + "</label>" + input +
      '<small class="field-error" data-error-for="' + name + '"></small>';
  }

  function selectField(name, label, value, options, required) {
    return '<label for="field-' + name + '">' + label + (required ? " <span aria-hidden=\"true\">*</span>" : "") + '</label><select id="field-' + name + '" name="' + name + '"' +
      (required ? " required" : "") + '><option value="">Choose one</option>' + options.map(function (option) {
        return '<option value="' + escapeHTML(option.value) + '"' + (option.value === value ? " selected" : "") + ">" + escapeHTML(option.label) + "</option>";
      }).join("") + '</select><small class="field-error" data-error-for="' + name + '"></small>';
  }

  function clearFormErrors(form) {
    form.querySelectorAll(".field-error").forEach(function (error) { error.textContent = ""; });
    form.querySelectorAll("[aria-invalid='true']").forEach(function (input) { input.removeAttribute("aria-invalid"); });
  }

  function setFieldError(form, name, message) {
    const target = form.querySelector('[data-error-for="' + name + '"]');
    const input = form.elements.namedItem(name);
    if (target) target.textContent = message;
    if (input && typeof input.setAttribute === "function") input.setAttribute("aria-invalid", "true");
  }

  function validateFields(form, requirements) {
    clearFormErrors(form);
    let valid = true;
    requirements.forEach(function (requirement) {
      const input = form.elements.namedItem(requirement.name);
      const value = input ? String(input.value).trim() : "";
      let message = "";
      if (requirement.required && !value) message = requirement.label + " is required.";
      else if (requirement.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = "Enter a valid email address.";
      else if (requirement.minLength && value.length < requirement.minLength) message = "Password must be at least 6 characters.";
      else if (requirement.url && value && !safeCredentialUrl(value)) message = "Enter a valid http or https URL.";
      if (message) { setFieldError(form, requirement.name, message); valid = false; }
    });
    return valid;
  }

  function bindAuthPage() {
    const tabs = document.querySelectorAll("[data-auth-tab]");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        const selected = tab.dataset.authTab;
        tabs.forEach(function (item) {
          const active = item === tab;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-selected", String(active));
        });
        document.getElementById("login-panel").hidden = selected !== "login";
        document.getElementById("register-panel").hidden = selected !== "register";
      });
    });

    const loginForm = document.getElementById("login-form");
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const form = event.currentTarget;
      if (!validateFields(form, [
        { name: "email", label: "Email", required: true, email: true },
        { name: "password", label: "Password", required: true }
      ])) return;
      const result = window.SkillAuth.login(form.elements.email.value, form.elements.password.value);
      if (!result.ok) { setFieldError(form, "password", result.message); return; }
      window.location.href = "dashboard.html";
    });

    const registerForm = document.getElementById("register-form");
    registerForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const form = event.currentTarget;
      if (!validateFields(form, [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", required: true, email: true },
        { name: "password", label: "Password", required: true, minLength: 6 },
        { name: "course", label: "Course", required: true },
        { name: "year", label: "Year of study", required: true }
      ])) return;
      const result = window.SkillAuth.register({
        name: form.elements.name.value, email: form.elements.email.value, password: form.elements.password.value,
        course: form.elements.course.value, year: form.elements.year.value
      });
      if (!result.ok) { setFieldError(form, "email", result.message); return; }
      window.location.href = "dashboard.html";
    });
  }

  function openSkillForm(skill) {
    const item = skill || {};
    const fields = field("name", "Skill name", item.name, "text", true, ' maxlength="80"') +
      selectField("category", "Category", item.category || "", categories.map(function (value) { return { value: value, label: value }; }), true) +
      selectField("level", "Proficiency level", item.level || "", levels.map(function (value) { return { value: value, label: value }; }), true) +
      field("dateStarted", "Date started", item.dateStarted || "", "date", true) +
      field("notes", "Notes", item.notes, "textarea", false, ' maxlength="500"');
    modalForm(skill ? "Edit skill" : "Add a skill", "skill-form", fields, skill ? "Save changes" : "Add skill");
    document.getElementById("skill-form").addEventListener("submit", function (event) {
      event.preventDefault();
      const form = event.currentTarget;
      if (!validateFields(form, [
        { name: "name", label: "Skill name", required: true },
        { name: "category", label: "Category", required: true },
        { name: "level", label: "Proficiency level", required: true },
        { name: "dateStarted", label: "Date started", required: true }
      ])) return;
      const records = currentRecords();
      const updated = {
        id: skill ? skill.id : window.SkillAuth.makeId(),
        name: form.elements.name.value.trim(), category: form.elements.category.value,
        level: form.elements.level.value, dateStarted: form.elements.dateStarted.value,
        notes: form.elements.notes.value.trim()
      };
      if (skill) records.skills = records.skills.map(function (entry) { return entry.id === skill.id ? updated : entry; });
      else records.skills.push(updated);
      saveRecords(records);
      addActivity((skill ? "Updated " : "Added ") + updated.name + " in your skills");
      closeModal();
      renderSkills();
      showToast(skill ? "Skill updated." : "Skill added.", "success");
    });
  }

  function openGoalForm(goal) {
    const item = goal || {};
    const skills = currentRecords().skills;
    const skillChoices = skills.map(function (skill) { return { value: skill.id, label: skill.name }; });
    const fields = field("title", "Goal title", item.title, "text", true, ' maxlength="100"') +
      selectField("skillId", "Linked skill", item.skillId || "", skillChoices, true) +
      field("targetDate", "Target date", item.targetDate || "", "date", true) +
      field("progress", "Progress (0–100%)", item.progress == null ? 0 : item.progress, "number", true, ' min="0" max="100" step="1"');
    if (!skills.length) {
      showToast("Add a skill before creating a linked goal.", "error");
      return;
    }
    modalForm(goal ? "Edit learning goal" : "Set a learning goal", "goal-form", fields, goal ? "Save changes" : "Add goal");
    document.getElementById("goal-form").addEventListener("submit", function (event) {
      event.preventDefault();
      const form = event.currentTarget;
      if (!validateFields(form, [
        { name: "title", label: "Goal title", required: true },
        { name: "skillId", label: "Linked skill", required: true },
        { name: "targetDate", label: "Target date", required: true },
        { name: "progress", label: "Progress", required: true }
      ])) return;
      const progress = Number(form.elements.progress.value);
      if (!Number.isFinite(progress) || progress < 0 || progress > 100) { setFieldError(form, "progress", "Progress must be between 0 and 100."); return; }
      const records = currentRecords();
      const updated = {
        id: goal ? goal.id : window.SkillAuth.makeId(),
        title: form.elements.title.value.trim(), skillId: form.elements.skillId.value,
        targetDate: form.elements.targetDate.value, progress: progress
      };
      if (goal) records.goals = records.goals.map(function (entry) { return entry.id === goal.id ? updated : entry; });
      else records.goals.push(updated);
      saveRecords(records);
      addActivity((goal ? "Updated goal: " : "Set a goal: ") + updated.title);
      closeModal();
      renderGoals();
      showToast(goal ? "Goal updated." : "Goal added.", "success");
    });
  }

  function openCertificationForm() {
    const fields = field("title", "Certificate title", "", "text", true, ' maxlength="100"') +
      field("issuer", "Issuing organization", "", "text", true, ' maxlength="100"') +
      field("dateEarned", "Date earned", "", "date", true) +
      field("credentialUrl", "Credential link (optional)", "", "url", false, ' maxlength="500"');
    modalForm("Add a certificate", "certification-form", fields, "Add certificate");
    document.getElementById("certification-form").addEventListener("submit", function (event) {
      event.preventDefault();
      const form = event.currentTarget;
      if (!validateFields(form, [
        { name: "title", label: "Certificate title", required: true },
        { name: "issuer", label: "Issuing organization", required: true },
        { name: "dateEarned", label: "Date earned", required: true },
        { name: "credentialUrl", label: "Credential link", required: false, url: true }
      ])) return;
      const record = {
        id: window.SkillAuth.makeId(), title: form.elements.title.value.trim(),
        issuer: form.elements.issuer.value.trim(), dateEarned: form.elements.dateEarned.value,
        credentialUrl: form.elements.credentialUrl.value.trim()
      };
      const records = currentRecords();
      records.certifications.push(record);
      saveRecords(records);
      addActivity("Added " + record.title + " certification");
      closeModal();
      renderCertifications();
      showToast("Certificate added.", "success");
    });
  }

  function openProfileForm() {
    const fields = field("name", "Full name", currentUser.name, "text", true, ' maxlength="100"') +
      field("email", "Email", currentUser.email, "email", true) +
      field("course", "Course / program", currentUser.course, "text", true, ' maxlength="120"') +
      selectField("year", "Year of study", currentUser.year, ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgraduate", "Other"].map(function (value) {
        return { value: value, label: value };
      }), true);
    modalForm("Edit profile", "profile-form", fields, "Save profile");
    document.getElementById("profile-form").addEventListener("submit", function (event) {
      event.preventDefault();
      const form = event.currentTarget;
      if (!validateFields(form, [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", required: true, email: true },
        { name: "course", label: "Course", required: true },
        { name: "year", label: "Year of study", required: true }
      ])) return;
      const newEmail = form.elements.email.value.trim().toLowerCase();
      const users = window.SkillStorage.getUsers();
      if (newEmail !== currentUser.email && users.some(function (user) { return user.email === newEmail; })) {
        setFieldError(form, "email", "An account with this email already exists.");
        return;
      }
      const oldEmail = currentUser.email;
      const records = currentRecords();
      const updated = Object.assign({}, currentUser, {
        name: form.elements.name.value.trim(), email: newEmail,
        course: form.elements.course.value.trim(), year: form.elements.year.value
      });
      window.SkillStorage.saveUsers(users.map(function (user) { return user.email === oldEmail ? updated : user; }));
      if (oldEmail !== newEmail) {
        window.SkillStorage.moveRecords(oldEmail, newEmail);
        window.SkillStorage.setSession(newEmail);
      }
      currentUser = updated;
      closeModal();
      renderProfile();
      showToast("Profile updated.", "success");
    });
  }

  function deleteRecord(type, id, label, render) {
    if (!window.confirm("Delete " + label + "? This cannot be undone.")) return;
    const records = currentRecords();
    records[type] = records[type].filter(function (item) { return item.id !== id; });
    if (type === "skills") {
      records.goals = records.goals.filter(function (goal) { return goal.skillId !== id; });
    }
    saveRecords(records);
    addActivity("Deleted " + label);
    render();
    showToast(label + " deleted.", "success");
  }

  function exportData() {
    const payload = {
      profile: { name: currentUser.name, email: currentUser.email, course: currentUser.course, year: currentUser.year },
      skills: currentRecords().skills,
      goals: currentRecords().goals,
      certifications: currentRecords().certifications,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "skillspring-" + currentUser.email.replace(/[^a-z0-9.-]/gi, "-") + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Your data export is ready.", "success");
  }

  function onAction(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const id = target.dataset.id;
    if (action === "logout") window.SkillAuth.logout();
    else if (action === "go-skills") window.location.href = "skills.html";
    else if (action === "go-goals") window.location.href = "goals.html";
    else if (action === "add-skill") openSkillForm(null);
    else if (action === "edit-skill") {
      const skill = currentRecords().skills.find(function (item) { return item.id === id; });
      if (skill) openSkillForm(skill);
    } else if (action === "delete-skill") {
      const skill = currentRecords().skills.find(function (item) { return item.id === id; });
      if (skill) deleteRecord("skills", id, '"' + skill.name + '"', renderSkills);
    } else if (action === "add-goal") openGoalForm(null);
    else if (action === "edit-goal") {
      const goal = currentRecords().goals.find(function (item) { return item.id === id; });
      if (goal) openGoalForm(goal);
    } else if (action === "delete-goal") {
      const goal = currentRecords().goals.find(function (item) { return item.id === id; });
      if (goal) deleteRecord("goals", id, '"' + goal.title + '"', renderGoals);
    } else if (action === "goal-progress") {
      const records = currentRecords();
      const goal = records.goals.find(function (item) { return item.id === id; });
      if (goal) {
        goal.progress = Number(target.value);
        saveRecords(records);
        const card = target.closest(".goal-card");
        card.querySelector(".progress-fill").style.width = goal.progress + "%";
        card.querySelector(".progress-track").setAttribute("aria-label", goal.progress + "% complete");
        card.querySelector(".goal-meta strong").textContent = goal.progress + "%";
        const badge = card.querySelector(".status-badge");
        const status = goal.progress === 100 ? "Completed" : (goal.progress === 0 ? "Not Started" : "In Progress");
        const overdue = goal.targetDate < new Date().toISOString().slice(0, 10) && goal.progress < 100;
        badge.textContent = overdue ? "Overdue" : status;
        badge.className = "status-badge " + (overdue ? "status-overdue" : status === "Completed" ? "status-completed" : status === "In Progress" ? "status-in-progress" : "status-not-started");
      }
    } else if (action === "add-certification") openCertificationForm();
    else if (action === "delete-certification") {
      const certificate = currentRecords().certifications.find(function (item) { return item.id === id; });
      if (certificate) deleteRecord("certifications", id, '"' + certificate.title + '"', renderCertifications);
    } else if (action === "edit-profile") openProfileForm();
    else if (action === "export-data") exportData();
    else if (action === "print-profile") window.print();
    else if (action === "close-modal") closeModal();
  }

  let currentUser = null;
  const page = document.body.dataset.page;
  if (page === "auth") {
    const user = window.SkillAuth.getCurrentUser();
    if (user) window.location.replace("dashboard.html");
    else bindAuthPage();
    return;
  }

  currentUser = window.SkillAuth.requireSession();
  if (!currentUser) return;
  renderShell(page);
  document.addEventListener("click", onAction);

  if (page === "dashboard") renderDashboard();
  else if (page === "skills") renderSkills();
  else if (page === "goals") renderGoals();
  else if (page === "certifications") renderCertifications();
  else if (page === "profile") renderProfile();
}());
