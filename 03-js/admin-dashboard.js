document.addEventListener("DOMContentLoaded", () => {
  const getData = (key) => {
    return JSON.parse(localStorage.getItem(key)) || [];
  };

  const saveData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const createId = () => {
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }

    return Date.now().toString() + Math.random().toString(36).substring(2);
  };

  const escapeHTML = (value) => {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
  };

  const getUserName = (user) => {
    return `${user.firstName || ""} ${user.lastName || ""}`.trim();
  };

  const getInitials = (user) => {
    return (
      `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
      "U"
    );
  };

  let users = getData("users");
  let departments = getData("departments");
  let courses = getData("courses");
  let sections = getData("sections");
  let subjects = getData("subjects");
  let sectionSubjects = getData("sectionSubjects");
  let enrollments = getData("enrollments");
  let schedules = getData("schedules");

  /* DEFAULT SYSTEM DATA */

  const DEFAULT_IDS = {
    ccsDepartment: "dept-ccs",
    bsitCourse: "course-bsit",
    bsitYear1SectionA: "section-bsit-y1-a",

    faculty01: "default-faculty-01",
    faculty02: "default-faculty-02",
    faculty03: "default-faculty-03",

    student01: "default-student-01",
    student02: "default-student-02",
    student03: "default-student-03",
    student04: "default-student-04",
    student05: "default-student-05",

    admin: "default-admin-01",
  };

  const findOrCreateDepartment = (id, name, code) => {
    let department = departments.find(
      (item) =>
        item.id === id ||
        String(item.code || "").toLowerCase() === code.toLowerCase() ||
        String(item.name || "").toLowerCase() === name.toLowerCase(),
    );

    if (!department) {
      department = {
        id,
        name,
        code,
      };

      departments.push(department);
    }

    return department;
  };

  const findOrCreateCourse = (id, name, code, departmentId) => {
    let course = courses.find(
      (item) =>
        item.id === id ||
        String(item.code || "").toLowerCase() === code.toLowerCase(),
    );

    if (!course) {
      course = {
        id,
        name,
        code,
        departmentId,
      };

      courses.push(course);
    }

    return course;
  };

  const findOrCreateSection = (id, courseId, yearLevel, name) => {
    let section = sections.find(
      (item) =>
        item.id === id ||
        (item.courseId === courseId &&
          String(item.yearLevel || "").toLowerCase() ===
            yearLevel.toLowerCase() &&
          String(item.name || "").toLowerCase() === name.toLowerCase()),
    );

    if (!section) {
      section = {
        id,
        courseId,
        yearLevel,
        name,
      };

      sections.push(section);
    }

    return section;
  };

  const addDefaultUser = (user) => {
    const exists = users.some(
      (item) => item.id === user.id || item.username === user.username,
    );

    if (!exists) {
      users.push(user);
    }
  };

  const ccsDepartment = findOrCreateDepartment(
    DEFAULT_IDS.ccsDepartment,
    "College of Computer Studies",
    "CCS",
  );

  const bsitCourse = findOrCreateCourse(
    DEFAULT_IDS.bsitCourse,
    "Bachelor of Science in Information Technology",
    "BSIT",
    ccsDepartment.id,
  );

  const bsitSectionA = findOrCreateSection(
    DEFAULT_IDS.bsitYear1SectionA,
    bsitCourse.id,
    "1st Year",
    "A",
  );
  /* DEFAULT BSIT SUBJECTS */

  const defaultSubjects = [
    {
      id: "subject-cc101",
      code: "CC101",
      name: "Introduction to Computing",
      units: 3,
    },
    {
      id: "subject-cc102",
      code: "CC102",
      name: "Computer Programming 1",
      units: 3,
    },
    {
      id: "subject-ws101",
      code: "WS101",
      name: "Web Systems and Technologies 1",
      units: 3,
    },
    {
      id: "subject-hci101",
      code: "HCI101",
      name: "Introduction to Human-Computer Interaction",
      units: 3,
    },
    {
      id: "subject-cc104",
      code: "CC104",
      name: "Data Structures and Algorithms",
      units: 3,
    },
  ];

  defaultSubjects.forEach((defaultSubject) => {
    let subject = subjects.find(
      (item) =>
        item.id === defaultSubject.id ||
        String(item.code || "").toLowerCase() ===
          defaultSubject.code.toLowerCase(),
    );

    if (!subject) {
      subject = { ...defaultSubject };
      subjects.push(subject);
    }

    const alreadyAssigned = sectionSubjects.some(
      (assignment) =>
        assignment.sectionId === bsitSectionA.id &&
        assignment.subjectId === subject.id,
    );

    if (!alreadyAssigned) {
      sectionSubjects.push({
        id: `section-subject-${subject.id}`,
        sectionId: bsitSectionA.id,
        subjectId: subject.id,
      });
    }
  });

  /* DEFAULT SCHEDULES */

  const defaultSchedules = [
    {
      id: "schedule-cc101",
      sectionId: bsitSectionA.id,
      subjectId: "subject-cc101",
      facultyId: DEFAULT_IDS.faculty01,
      day: "Monday",
      startTime: "08:00",
      endTime: "09:00",
    },
    {
      id: "schedule-cc102",
      sectionId: bsitSectionA.id,
      subjectId: "subject-cc102",
      facultyId: DEFAULT_IDS.faculty02,
      day: "Monday",
      startTime: "09:00",
      endTime: "10:00",
    },
    {
      id: "schedule-ws101",
      sectionId: bsitSectionA.id,
      subjectId: "subject-ws101",
      facultyId: DEFAULT_IDS.faculty03,
      day: "Monday",
      startTime: "10:00",
      endTime: "11:00",
    },
    {
      id: "schedule-hci101",
      sectionId: bsitSectionA.id,
      subjectId: "subject-hci101",
      facultyId: DEFAULT_IDS.faculty01,
      day: "Monday",
      startTime: "13:00",
      endTime: "14:00",
    },
    {
      id: "schedule-cc104",
      sectionId: bsitSectionA.id,
      subjectId: "subject-cc104",
      facultyId: DEFAULT_IDS.faculty02,
      day: "Monday",
      startTime: "14:00",
      endTime: "15:00",
    },
  ];

  defaultSchedules.forEach((defaultSchedule) => {
    const exists = schedules.some(
      (schedule) => schedule.id === defaultSchedule.id,
    );

    if (!exists) {
      schedules.push(defaultSchedule);
    }
  });

  /* DEFAULT USERS */

  addDefaultUser({
    id: DEFAULT_IDS.admin,
    username: "admin",
    password: "admin123",
    role: "admin",
    firstName: "System",
    lastName: "Administrator",
    email: "admin@university.edu",
  });

  addDefaultUser({
    id: DEFAULT_IDS.faculty01,
    username: "faculty01",
    password: "faculty123",
    role: "faculty",
    firstName: "Faculty",
    lastName: "One",
    email: "faculty01@university.edu",
    departmentId: ccsDepartment.id,
  });

  addDefaultUser({
    id: DEFAULT_IDS.faculty02,
    username: "faculty02",
    password: "faculty123",
    role: "faculty",
    firstName: "Faculty",
    lastName: "Two",
    email: "faculty02@university.edu",
    departmentId: ccsDepartment.id,
  });

  addDefaultUser({
    id: DEFAULT_IDS.faculty03,
    username: "faculty03",
    password: "faculty123",
    role: "faculty",
    firstName: "Faculty",
    lastName: "Three",
    email: "faculty03@university.edu",
    departmentId: ccsDepartment.id,
  });

  for (let i = 1; i <= 5; i++) {
    const studentId = DEFAULT_IDS[`student0${i}`];

    addDefaultUser({
      id: studentId,
      username: `student0${i}`,
      password: "student123",
      role: "student",
      firstName: "Student",
      lastName: `0${i}`,
      email: `student0${i}@university.edu`,
      courseId: bsitCourse.id,
      yearLevel: "1st Year",
      section: "A",
    });

    const alreadyEnrolled = enrollments.some(
      (enrollment) =>
        enrollment.studentId === studentId &&
        enrollment.sectionId === bsitSectionA.id,
    );

    if (!alreadyEnrolled) {
      enrollments.push({
        id: `enrollment-${i}`,
        studentId,
        sectionId: bsitSectionA.id,
      });
    }
  }

  /* SAVE SEEDED DATA */

  saveData("users", users);
  saveData("departments", departments);
  saveData("courses", courses);
  saveData("sections", sections);
  saveData("subjects", subjects);
  saveData("sectionSubjects", sectionSubjects);
  saveData("enrollments", enrollments);
  saveData("schedules", schedules);

  const getDepartmentName = (id) => {
    const department = departments.find((item) => item.id === id);

    return department ? department.name : "Unknown Department";
  };

  const getCourse = (id) => {
    return courses.find((course) => course.id === id);
  };

  const getCourseName = (id) => {
    const course = getCourse(id);

    return course ? course.name : "Unknown Course";
  };

  const getSection = (id) => {
    return sections.find((section) => section.id === id);
  };

  const getSectionName = (id) => {
    const section = getSection(id);

    if (!section) {
      return "Unknown Section";
    }

    return `${section.yearLevel} - Section ${section.name}`;
  };

  const getSubject = (id) => {
    return subjects.find((subject) => subject.id === id);
  };

  const getSubjectName = (id) => {
    const subject = getSubject(id);

    return subject ? subject.name : "Unknown Subject";
  };

  const getAdmin = () => {
    const loggedInUserId = localStorage.getItem("loggedInUserId");

    if (loggedInUserId) {
      return users.find((user) => user.id === loggedInUserId);
    }

    const loggedInUsername = localStorage.getItem("loggedInUsername");

    if (loggedInUsername) {
      return users.find((user) => user.username === loggedInUsername);
    }

    return users.find((user) => user.role === "admin");
  };

  const admin = getAdmin();

  if (admin) {
    const adminName = document.getElementById("adminName");

    const adminAvatar = document.getElementById("adminAvatar");

    if (adminName) {
      adminName.textContent = getUserName(admin) || "Administrator";
    }

    if (adminAvatar) {
      adminAvatar.textContent = getInitials(admin);
    }
  }

  /* NAVIGATION */

  const navItems = document.querySelectorAll(".nav-item[data-section]");

  const pageSections = document.querySelectorAll(".page-section");

  const showSection = (id) => {
    pageSections.forEach((section) => {
      section.classList.remove("active-section");
    });

    navItems.forEach((item) => {
      item.classList.remove("active");
    });

    const section = document.getElementById(id);

    const nav = document.querySelector(`.nav-item[data-section="${id}"]`);

    if (section) {
      section.classList.add("active-section");
    }

    if (nav) {
      nav.classList.add("active");
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  navItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();

      showSection(item.dataset.section);
    });
  });

  /* DASHBOARD */

  const updateDashboard = () => {
    const students = users.filter((user) => user.role === "student");

    const faculty = users.filter((user) => user.role === "faculty");

    const values = {
      totalUsers: users.length,
      totalStudents: students.length,
      totalFaculty: faculty.length,
      totalCourses: courses.length,
      totalDepartments: departments.length,
      totalSections: sections.length,
      reportStudents: students.length,
      reportFaculty: faculty.length,
      reportCourses: courses.length,
      reportSections: sections.length,
    };

    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);

      if (element) {
        element.textContent = value;
      }
    });
  };

  const renderDashboardUsers = () => {
    const container = document.getElementById("dashboardUserList");

    if (!container) {
      return;
    }

    const recentUsers = users.slice(-5).reverse();

    if (!recentUsers.length) {
      container.innerHTML = `
        <div class="empty-message">
          No registered users.
        </div>
      `;

      return;
    }

    container.innerHTML = recentUsers
      .map(
        (user) => `
            <div class="user-item">

              <div class="user-avatar">
                ${escapeHTML(getInitials(user))}
              </div>

              <div class="user-info">

                <h3>
                  ${escapeHTML(getUserName(user))}
                </h3>

                <p>
                  ${escapeHTML(user.email)}
                </p>

              </div>

              <span class="user-role ${escapeHTML(user.role)}">
                ${escapeHTML(user.role)}
              </span>

            </div>
          `,
      )
      .join("");
  };

  const renderDashboardCourses = () => {
    const container = document.getElementById("dashboardCourseList");

    if (!container) {
      return;
    }

    const recentCourses = courses.slice(-5).reverse();

    if (!recentCourses.length) {
      container.innerHTML = `
        <div class="empty-message">
          No courses have been added.
        </div>
      `;

      return;
    }

    container.innerHTML = recentCourses
      .map(
        (course) => `
            <div class="course-item">

              <div>

                <h3>
                  ${escapeHTML(course.name)}
                </h3>

                <p>
                  ${escapeHTML(course.code || "No course code")}
                </p>

                <small>
                  ${escapeHTML(getDepartmentName(course.departmentId))}
                </small>

              </div>

            </div>
          `,
      )
      .join("");
  };

  /* USERS */

  const renderUsers = () => {
    const container = document.getElementById("userList");

    if (!container) {
      return;
    }

    if (!users.length) {
      container.innerHTML = `
        <div class="empty-message">
          No users have registered.
        </div>
      `;

      return;
    }

    container.innerHTML = users
      .map(
        (user) => `
            <div class="user-item">

              <div class="user-avatar">
                ${escapeHTML(getInitials(user))}
              </div>

              <div class="user-info">

                <h3>
                  ${escapeHTML(getUserName(user))}
                </h3>

                <p>
                  ${escapeHTML(user.email)}
                </p>

                <small>
                  Username:
                  ${escapeHTML(user.username)}
                </small>

              </div>

              <span class="user-role ${escapeHTML(user.role)}">
                ${escapeHTML(user.role)}
              </span>

            </div>
          `,
      )
      .join("");
  };

  /* DEPARTMENTS */

  const renderDepartments = () => {
    const container = document.getElementById("departmentList");

    if (!container) {
      return;
    }

    if (!departments.length) {
      container.innerHTML = `
        <div class="empty-message">
          No departments have been added.
        </div>
      `;

      return;
    }

    container.innerHTML = departments
      .map(
        (department) => `
            <div class="department-item">

              <div>

                <h3>
                  ${escapeHTML(department.name)}
                </h3>

                <p>
                  ${escapeHTML(department.code || "No department code")}
                </p>

              </div>

              <button
                class="delete-btn"
                data-delete-department="${department.id}"
              >
                Delete
              </button>

            </div>
          `,
      )
      .join("");
  };

  const populateDepartmentSelects = () => {
    const selects = [
      document.getElementById("courseDepartment"),
      document.getElementById("enrollmentDepartment"),
    ];

    selects.forEach((select) => {
      if (!select) {
        return;
      }

      select.innerHTML = `
          <option value="">
            Select Department
          </option>

          ${departments
            .map(
              (department) => `
                <option value="${department.id}">
                  ${escapeHTML(department.name)}
                </option>
              `,
            )
            .join("")}
        `;
    });
  };

  document
    .getElementById("departmentForm")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();

      const name = document.getElementById("departmentName").value.trim();

      const code = document.getElementById("departmentCode").value.trim();

      if (!name) {
        alert("Please enter a department name.");

        return;
      }

      const exists = departments.some(
        (department) => department.name.toLowerCase() === name.toLowerCase(),
      );

      if (exists) {
        alert("This department already exists.");

        return;
      }

      departments.push({
        id: createId(),
        name,
        code,
      });

      saveData("departments", departments);

      event.target.reset();

      refresh();

      alert("Department added successfully.");
    });

  /* COURSES */

  const renderCourses = () => {
    const container = document.getElementById("courseList");

    if (!container) {
      return;
    }

    if (!courses.length) {
      container.innerHTML = `
        <div class="empty-message">
          No courses have been added.
        </div>
      `;

      return;
    }

    container.innerHTML = courses
      .map(
        (course) => `
            <div class="course-item">

              <div>

                <h3>
                  ${escapeHTML(course.name)}
                </h3>

                <p>
                  ${escapeHTML(course.code || "No course code")}
                </p>

                <small>
                  Department:
                  ${escapeHTML(getDepartmentName(course.departmentId))}
                </small>

              </div>

              <button
                class="delete-btn"
                data-delete-course="${course.id}"
              >
                Delete
              </button>

            </div>
          `,
      )
      .join("");
  };

  const populateCourseSelects = () => {
    const sectionCourse = document.getElementById("sectionCourse");

    if (sectionCourse) {
      sectionCourse.innerHTML = `
          <option value="">
            Select Course
          </option>

          ${courses
            .map(
              (course) => `
                <option value="${course.id}">
                  ${escapeHTML(course.name)}
                </option>
              `,
            )
            .join("")}
        `;
    }
  };

  document.getElementById("courseForm")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("courseName").value.trim();

    const code = document.getElementById("courseCode").value.trim();

    const departmentId = document.getElementById("courseDepartment").value;

    if (!name || !departmentId) {
      alert("Please complete the course information.");

      return;
    }

    const exists = courses.some(
      (course) => course.name.toLowerCase() === name.toLowerCase(),
    );

    if (exists) {
      alert("This course already exists.");

      return;
    }

    courses.push({
      id: createId(),
      name,
      code,
      departmentId,
    });

    saveData("courses", courses);

    event.target.reset();

    refresh();

    alert("Course added successfully.");
  });

  /* SECTIONS */

  const renderSections = () => {
    const container = document.getElementById("sectionList");

    if (!container) {
      return;
    }

    if (!sections.length) {
      container.innerHTML = `
        <div class="empty-message">
          No sections have been created.
        </div>
      `;

      return;
    }

    container.innerHTML = sections
      .map((section) => {
        const course = getCourse(section.courseId);

        const studentCount = enrollments.filter(
          (item) => item.sectionId === section.id,
        ).length;

        return `
              <div class="section-item">

                <div>

                  <h3>
                    ${escapeHTML(section.yearLevel)}
                    -
                    Section
                    ${escapeHTML(section.name)}
                  </h3>

                  <p>
                    ${course ? escapeHTML(course.name) : "Unknown Course"}
                  </p>

                  <small>
                    ${studentCount}
                    enrolled student(s)
                  </small>

                </div>

                <button
                  class="delete-btn"
                  data-delete-section="${section.id}"
                >
                  Delete
                </button>

              </div>
            `;
      })
      .join("");
  };

  const populateSectionSelects = () => {
    const selects = [
      document.getElementById("sectionSubjectSection"),
      document.getElementById("enrollmentSection"),
      document.getElementById("scheduleSection"),
    ];

    selects.forEach((select) => {
      if (!select) {
        return;
      }

      select.innerHTML = `
          <option value="">
            Select Section
          </option>

          ${sections
            .map(
              (section) => `
                <option value="${section.id}">
                  ${escapeHTML(section.yearLevel)}
                  -
                  Section
                  ${escapeHTML(section.name)}
                  -
                  ${escapeHTML(getCourseName(section.courseId))}
                </option>
              `,
            )
            .join("")}
        `;
    });
  };

  document
    .getElementById("sectionForm")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();

      const courseId = document.getElementById("sectionCourse").value;

      const yearLevel = document.getElementById("yearLevel").value.trim();

      const name = document.getElementById("sectionName").value.trim();

      if (!courseId || !yearLevel || !name) {
        alert("Please complete all section fields.");

        return;
      }

      const exists = sections.some(
        (section) =>
          section.courseId === courseId &&
          section.yearLevel.toLowerCase() === yearLevel.toLowerCase() &&
          section.name.toLowerCase() === name.toLowerCase(),
      );

      if (exists) {
        alert("This section already exists.");

        return;
      }

      sections.push({
        id: createId(),
        courseId,
        yearLevel,
        name,
      });

      saveData("sections", sections);

      event.target.reset();

      refresh();

      alert("Section added successfully.");
    });

  /* SUBJECT CATALOG */

  const renderSubjectCatalog = () => {
    const container = document.getElementById("subjectCatalogList");

    if (!container) {
      return;
    }

    if (!subjects.length) {
      container.innerHTML = `
          <div class="empty-message">
            No subjects have been added to the catalog.
          </div>
        `;

      return;
    }

    container.innerHTML = subjects
      .map(
        (subject) => `
              <div class="subject-item">

                <div>

                  <h3>
                    ${escapeHTML(subject.code)}
                    -
                    ${escapeHTML(subject.name)}
                  </h3>

                  <p>
                    ${subject.units}
                    Unit(s)
                  </p>

                </div>

                <button
                  class="delete-btn"
                  data-delete-subject="${subject.id}"
                >
                  Delete
                </button>

              </div>
            `,
      )
      .join("");
  };

  const populateSubjectSelect = () => {
    const select = document.getElementById("sectionSubjectSubject");

    if (!select) {
      return;
    }

    select.innerHTML = `
        <option value="">
          Select Subject
        </option>

        ${subjects
          .map(
            (subject) => `
              <option value="${subject.id}">
                ${escapeHTML(subject.code)}
                -
                ${escapeHTML(subject.name)}
              </option>
            `,
          )
          .join("")}
      `;
  };

  document
    .getElementById("subjectForm")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();

      const code = document.getElementById("subjectCode").value.trim();

      const name = document.getElementById("subjectName").value.trim();

      const units = Number(document.getElementById("subjectUnits").value);

      if (!code || !name || !units) {
        alert("Please complete all subject fields.");

        return;
      }

      const exists = subjects.some(
        (subject) => subject.code.toLowerCase() === code.toLowerCase(),
      );

      if (exists) {
        alert("This subject already exists in the catalog.");

        return;
      }

      subjects.push({
        id: createId(),
        code,
        name,
        units,
      });

      saveData("subjects", subjects);

      event.target.reset();

      refresh();

      alert("Subject added to the catalog.");
    });

  /* ASSIGN SUBJECT TO SECTION */

  const renderSectionSubjects = () => {
    const container = document.getElementById("sectionSubjectList");

    if (!container) {
      return;
    }

    if (!sectionSubjects.length) {
      container.innerHTML = `
          <div class="empty-message">
            No subjects have been assigned to sections.
          </div>
        `;

      return;
    }

    container.innerHTML = sectionSubjects
      .map((assignment) => {
        const subject = getSubject(assignment.subjectId);

        const section = getSection(assignment.sectionId);

        if (!subject || !section) {
          return "";
        }

        return `
                <div class="subject-item">

                  <div>

                    <h3>
                      ${escapeHTML(subject.code)}
                      -
                      ${escapeHTML(subject.name)}
                    </h3>

                    <p>
                      ${escapeHTML(getSectionName(section.id))}
                    </p>

                    <small>
                      ${escapeHTML(getCourseName(section.courseId))}
                    </small>

                  </div>

                  <button
                    class="delete-btn"
                    data-delete-assignment="${assignment.id}"
                  >
                    Remove
                  </button>

                </div>
              `;
      })
      .join("");
  };

  document
    .getElementById("sectionSubjectForm")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();

      const sectionId = document.getElementById("sectionSubjectSection").value;

      const subjectId = document.getElementById("sectionSubjectSubject").value;

      if (!sectionId || !subjectId) {
        alert("Please select a section and subject.");

        return;
      }

      const exists = sectionSubjects.some(
        (assignment) =>
          assignment.sectionId === sectionId &&
          assignment.subjectId === subjectId,
      );

      if (exists) {
        alert("This subject is already assigned to this section.");

        return;
      }

      sectionSubjects.push({
        id: createId(),
        sectionId,
        subjectId,
      });

      saveData("sectionSubjects", sectionSubjects);

      event.target.reset();

      refresh();

      alert("Subject assigned to section successfully.");
    });

  /* ENROLLMENT FILTERS */

  const populateStudents = () => {
    const select = document.getElementById("studentSelect");

    if (!select) {
      return;
    }

    const students = users.filter((user) => user.role === "student");

    select.innerHTML = `
        <option value="">
          Select Student
        </option>

        ${students
          .map(
            (student) => `
              <option value="${student.id}">
                ${escapeHTML(getUserName(student))}
              </option>
            `,
          )
          .join("")}
      `;
  };

  const updateEnrollmentCourses = () => {
    const departmentId = document.getElementById("enrollmentDepartment")?.value;

    const select = document.getElementById("enrollmentCourse");

    if (!select) {
      return;
    }

    const filtered = courses.filter(
      (course) => course.departmentId === departmentId,
    );

    select.innerHTML = `
        <option value="">
          Select Course
        </option>

        ${filtered
          .map(
            (course) => `
              <option value="${course.id}">
                ${escapeHTML(course.name)}
              </option>
            `,
          )
          .join("")}
      `;

    updateEnrollmentSections();
  };

  const updateEnrollmentSections = () => {
    const courseId = document.getElementById("enrollmentCourse")?.value;

    const select = document.getElementById("enrollmentSection");

    if (!select) {
      return;
    }

    const filtered = sections.filter(
      (section) => section.courseId === courseId,
    );

    select.innerHTML = `
        <option value="">
          Select Section
        </option>

        ${filtered
          .map(
            (section) => `
              <option value="${section.id}">
                ${escapeHTML(section.yearLevel)}
                -
                Section
                ${escapeHTML(section.name)}
              </option>
            `,
          )
          .join("")}
      `;
  };

  document
    .getElementById("enrollmentDepartment")
    ?.addEventListener("change", updateEnrollmentCourses);

  document
    .getElementById("enrollmentCourse")
    ?.addEventListener("change", updateEnrollmentSections);

  /* ENROLLMENT */

  const renderEnrollments = () => {
    const container = document.getElementById("enrollmentList");

    if (!container) {
      return;
    }

    if (!enrollments.length) {
      container.innerHTML = `
          <div class="empty-message">
            No students have been enrolled.
          </div>
        `;

      return;
    }

    container.innerHTML = enrollments
      .map((enrollment) => {
        const student = users.find((user) => user.id === enrollment.studentId);

        const section = getSection(enrollment.sectionId);

        if (!student || !section) {
          return "";
        }

        return `
                <div class="enrollment-item">

                  <div>

                    <h3>
                      ${escapeHTML(getUserName(student))}
                    </h3>

                    <p>
                      ${escapeHTML(getCourseName(section.courseId))}
                    </p>

                    <small>
                      ${escapeHTML(getSectionName(section.id))}
                    </small>

                  </div>

                  <button
                    class="delete-btn"
                    data-unenroll="${enrollment.id}"
                  >
                    Unenroll
                  </button>

                </div>
              `;
      })
      .join("");
  };

  document
    .getElementById("enrollmentForm")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();

      const studentId = document.getElementById("studentSelect").value;

      const sectionId = document.getElementById("enrollmentSection").value;

      if (!studentId || !sectionId) {
        alert("Please complete the enrollment information.");

        return;
      }

      const exists = enrollments.some(
        (enrollment) =>
          enrollment.studentId === studentId &&
          enrollment.sectionId === sectionId,
      );

      if (exists) {
        alert("This student is already enrolled in this section.");

        return;
      }

      enrollments.push({
        id: createId(),
        studentId,
        sectionId,
      });

      saveData("enrollments", enrollments);

      event.target.reset();

      refresh();

      alert("Student enrolled successfully.");
    });

  /* FACULTY */

  const populateFaculty = () => {
    const select = document.getElementById("scheduleFaculty");

    if (!select) {
      return;
    }

    const faculty = users.filter((user) => user.role === "faculty");

    select.innerHTML = `
        <option value="">
          Select Faculty
        </option>

        ${faculty
          .map(
            (member) => `
              <option value="${member.id}">
                ${escapeHTML(getUserName(member))}
              </option>
            `,
          )
          .join("")}
      `;
  };

  /* SCHEDULE SUBJECT FILTER */

  const populateScheduleSubjects = () => {
    const select = document.getElementById("scheduleSubject");

    const sectionId = document.getElementById("scheduleSection")?.value;

    if (!select) {
      return;
    }

    const assignments = sectionSubjects.filter(
      (assignment) => assignment.sectionId === sectionId,
    );

    select.innerHTML = `
        <option value="">
          Select Subject
        </option>

        ${assignments
          .map((assignment) => {
            const subject = getSubject(assignment.subjectId);

            if (!subject) {
              return "";
            }

            return `
                <option value="${subject.id}">
                  ${escapeHTML(subject.code)}
                  -
                  ${escapeHTML(subject.name)}
                </option>
              `;
          })
          .join("")}
      `;
  };

  document
    .getElementById("scheduleSection")
    ?.addEventListener("change", populateScheduleSubjects);

  /* SCHEDULE CONFLICT */

  const timeOverlap = (startA, endA, startB, endB) => {
    return startA < endB && endA > startB;
  };

  const hasConflict = (sectionId, facultyId, day, startTime, endTime) => {
    return schedules.some((schedule) => {
      if (schedule.day !== day) {
        return false;
      }

      if (
        !timeOverlap(startTime, endTime, schedule.startTime, schedule.endTime)
      ) {
        return false;
      }

      return (
        schedule.sectionId === sectionId || schedule.facultyId === facultyId
      );
    });
  };

  /* SCHEDULES */

  const renderSchedules = () => {
    const container = document.getElementById("scheduleList");

    if (!container) {
      return;
    }

    if (!schedules.length) {
      container.innerHTML = `
          <div class="empty-message">
            No schedules have been created.
          </div>
        `;

      return;
    }

    container.innerHTML = schedules
      .map((schedule) => {
        const subject = getSubject(schedule.subjectId);

        const section = getSection(schedule.sectionId);

        const faculty = users.find((user) => user.id === schedule.facultyId);

        if (!subject || !section) {
          return "";
        }

        return `
                <div class="schedule-item">

                  <div>

                    <h3>
                      ${escapeHTML(subject.code)}
                      -
                      ${escapeHTML(subject.name)}
                    </h3>

                    <p>
                      ${escapeHTML(getSectionName(section.id))}
                    </p>

                    <small>
                      Faculty:
                      ${faculty ? escapeHTML(getUserName(faculty)) : "Unknown"}
                    </small>

                  </div>

                  <div class="schedule-time">

                    <strong>
                      ${escapeHTML(schedule.day)}
                    </strong>

                    <span>
                      ${escapeHTML(schedule.startTime)}
                      -
                      ${escapeHTML(schedule.endTime)}
                    </span>

                  </div>

                  <button
                    class="delete-btn"
                    data-delete-schedule="${schedule.id}"
                  >
                    Delete
                  </button>

                </div>
              `;
      })
      .join("");
  };

  document
    .getElementById("scheduleForm")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();

      const sectionId = document.getElementById("scheduleSection").value;

      const subjectId = document.getElementById("scheduleSubject").value;

      const facultyId = document.getElementById("scheduleFaculty").value;

      const day = document.getElementById("scheduleDay").value;

      const startTime = document.getElementById("startTime").value;

      const endTime = document.getElementById("endTime").value;

      if (
        !sectionId ||
        !subjectId ||
        !facultyId ||
        !day ||
        !startTime ||
        !endTime
      ) {
        alert("Please complete all schedule fields.");

        return;
      }

      if (startTime >= endTime) {
        alert("End time must be later than start time.");

        return;
      }

      const assignment = sectionSubjects.find(
        (item) => item.sectionId === sectionId && item.subjectId === subjectId,
      );

      if (!assignment) {
        alert("This subject is not assigned to this section.");

        return;
      }

      const subjectAlreadyScheduled = schedules.some(
        (schedule) =>
          schedule.sectionId === sectionId && schedule.subjectId === subjectId,
      );

      if (subjectAlreadyScheduled) {
        alert("This subject already has a schedule for this section.");

        return;
      }

      if (hasConflict(sectionId, facultyId, day, startTime, endTime)) {
        const sectionConflict = schedules.some(
          (schedule) =>
            schedule.sectionId === sectionId &&
            schedule.day === day &&
            timeOverlap(
              startTime,
              endTime,
              schedule.startTime,
              schedule.endTime,
            ),
        );

        if (sectionConflict) {
          alert(
            "Schedule conflict: this section already has a class during this time.",
          );
        } else {
          alert(
            "Schedule conflict: this faculty member already has a class during this time.",
          );
        }

        return;
      }

      schedules.push({
        id: createId(),
        sectionId,
        subjectId,
        facultyId,
        day,
        startTime,
        endTime,
      });

      saveData("schedules", schedules);

      event.target.reset();

      refresh();

      alert("Schedule added successfully.");
    });

  /* DELETE HANDLERS */

  document.addEventListener("click", (event) => {
    const departmentButton = event.target.closest("[data-delete-department]");

    if (departmentButton) {
      const id = departmentButton.dataset.deleteDepartment;

      const hasCourses = courses.some((course) => course.departmentId === id);

      if (hasCourses) {
        alert("Delete the department's courses first.");

        return;
      }

      if (!confirm("Delete this department?")) {
        return;
      }

      departments = departments.filter((department) => department.id !== id);

      saveData("departments", departments);

      refresh();

      return;
    }

    const courseButton = event.target.closest("[data-delete-course]");

    if (courseButton) {
      const id = courseButton.dataset.deleteCourse;

      const hasSections = sections.some((section) => section.courseId === id);

      if (hasSections) {
        alert("Delete this course's sections first.");

        return;
      }

      if (!confirm("Delete this course?")) {
        return;
      }

      courses = courses.filter((course) => course.id !== id);

      saveData("courses", courses);

      refresh();

      return;
    }

    const sectionButton = event.target.closest("[data-delete-section]");

    if (sectionButton) {
      const id = sectionButton.dataset.deleteSection;

      const hasStudents = enrollments.some(
        (enrollment) => enrollment.sectionId === id,
      );

      const hasSubjects = sectionSubjects.some(
        (assignment) => assignment.sectionId === id,
      );

      if (hasStudents || hasSubjects) {
        alert("Remove students and subjects from this section first.");

        return;
      }

      if (!confirm("Delete this section?")) {
        return;
      }

      sections = sections.filter((section) => section.id !== id);

      saveData("sections", sections);

      refresh();

      return;
    }

    const subjectButton = event.target.closest("[data-delete-subject]");

    if (subjectButton) {
      const id = subjectButton.dataset.deleteSubject;

      const isAssigned = sectionSubjects.some(
        (assignment) => assignment.subjectId === id,
      );

      if (isAssigned) {
        alert(
          "This subject is assigned to one or more sections. Remove those assignments first.",
        );

        return;
      }

      if (!confirm("Delete this subject from the catalog?")) {
        return;
      }

      subjects = subjects.filter((subject) => subject.id !== id);

      saveData("subjects", subjects);

      refresh();

      return;
    }

    const assignmentButton = event.target.closest("[data-delete-assignment]");

    if (assignmentButton) {
      const id = assignmentButton.dataset.deleteAssignment;

      const assignment = sectionSubjects.find((item) => item.id === id);

      if (!assignment) {
        return;
      }

      const hasSchedule = schedules.some(
        (schedule) =>
          schedule.sectionId === assignment.sectionId &&
          schedule.subjectId === assignment.subjectId,
      );

      if (hasSchedule) {
        alert("Delete the subject's schedule first.");

        return;
      }

      if (!confirm("Remove this subject from the section?")) {
        return;
      }

      sectionSubjects = sectionSubjects.filter((item) => item.id !== id);

      saveData("sectionSubjects", sectionSubjects);

      refresh();

      return;
    }

    const enrollmentButton = event.target.closest("[data-unenroll]");

    if (enrollmentButton) {
      const id = enrollmentButton.dataset.unenroll;

      if (!confirm("Unenroll this student?")) {
        return;
      }

      enrollments = enrollments.filter((enrollment) => enrollment.id !== id);

      saveData("enrollments", enrollments);

      refresh();

      return;
    }

    const scheduleButton = event.target.closest("[data-delete-schedule]");

    if (scheduleButton) {
      const id = scheduleButton.dataset.deleteSchedule;

      if (!confirm("Delete this schedule?")) {
        return;
      }

      schedules = schedules.filter((schedule) => schedule.id !== id);

      saveData("schedules", schedules);

      refresh();
    }
  });

  /* LOGOUT */

  document
    .getElementById("logoutButton")
    ?.addEventListener("click", (event) => {
      event.preventDefault();

      if (!confirm("Are you sure you want to logout?")) {
        return;
      }

      localStorage.removeItem("loggedInUserId");

      localStorage.removeItem("loggedInUsername");

      window.location.href = "../index.html";
    });

  /* REFRESH */

  function refresh() {
    users = getData("users");
    departments = getData("departments");
    courses = getData("courses");
    sections = getData("sections");
    subjects = getData("subjects");
    sectionSubjects = getData("sectionSubjects");
    enrollments = getData("enrollments");
    schedules = getData("schedules");

    updateDashboard();

    renderDashboardUsers();
    renderDashboardCourses();

    renderUsers();
    renderDepartments();
    renderCourses();
    renderSections();

    renderSubjectCatalog();
    renderSectionSubjects();

    renderEnrollments();
    renderSchedules();

    populateDepartmentSelects();
    populateCourseSelects();
    populateSectionSelects();

    populateStudents();
    populateFaculty();
    populateSubjectSelect();

    updateEnrollmentCourses();
    populateScheduleSubjects();
  }

  refresh();

  /* Announcements */

  const renderAdminAnnouncements = () => {
    const container = document.getElementById("adminAnnouncementList");

    if (!container) {
      return;
    }

    const announcements = getData("announcements");

    if (!announcements.length) {
      container.innerHTML = `
      <div class="empty-message">
        No announcements yet.
      </div>
    `;

      return;
    }

    container.innerHTML = [...announcements]
      .reverse()
      .map((announcement) => {
        let audience = "Students Only";

        if (announcement.audience === "faculty") {
          audience = "Faculty Only";
        } else if (announcement.audience === "all") {
          audience = "Faculty & Students";
        }

        return `
        <div class="admin-announcement-item">

          <h4>
            ${escapeHTML(announcement.title || "Announcement")}
          </h4>

          <p>
            ${escapeHTML(announcement.message || "")}
          </p>

          <div class="announcement-meta">

            <span class="announcement-audience">
              ${audience}
            </span>

            <span>
              ${
                announcement.createdAt
                  ? new Date(announcement.createdAt).toLocaleDateString()
                  : ""
              }
            </span>

            <button
              type="button"
              class="delete-announcement-button"
              data-delete-admin-announcement="${announcement.id}"
            >
              Delete
            </button>

          </div>

        </div>
      `;
      })
      .join("");
  };

  document
    .getElementById("adminAnnouncementForm")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();

      const titleElement = document.getElementById("adminAnnouncementTitle");

      const messageElement = document.getElementById(
        "adminAnnouncementMessage",
      );

      const audienceElement = document.getElementById(
        "adminAnnouncementAudience",
      );

      const title = titleElement?.value.trim() || "";
      const message = messageElement?.value.trim() || "";
      const selectedAudience = audienceElement?.value || "";

      if (!title || !message || !selectedAudience) {
        alert("Please complete all announcement fields.");
        return;
      }

      let audience = selectedAudience;

      if (selectedAudience === "both") {
        audience = "all";
      }

      const announcements = getData("announcements");

      announcements.push({
        id: createId(),
        title: title,
        message: message,
        audience: audience,
        createdAt: new Date().toISOString(),
      });

      saveData("announcements", announcements);

      event.target.reset();

      renderAdminAnnouncements();
    });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-admin-announcement]");

    if (!button) {
      return;
    }

    const announcementId = button.dataset.deleteAdminAnnouncement;

    const announcements = getData("announcements");

    const updatedAnnouncements = announcements.filter(
      (announcement) => announcement.id !== announcementId,
    );

    saveData("announcements", updatedAnnouncements);

    renderAdminAnnouncements();
  });

  renderAdminAnnouncements();
});
