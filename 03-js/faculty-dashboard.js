document.addEventListener("DOMContentLoaded", () => {
  /* 
     STORAGE HELPERS
   */

  const getData = (key) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error(`Failed to read ${key}:`, error);
      return [];
    }
  };

  const saveData = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const createId = () => {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  };

  const escapeHTML = (value) => {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
  };

  /* 
     DATA
   */

  let users = getData("users");
  let departments = getData("departments");
  let courses = getData("courses");
  let sections = getData("sections");
  let subjects = getData("subjects");
  let sectionSubjects = getData("sectionSubjects");
  let enrollments = getData("enrollments");
  let schedules = getData("schedules");

  let attendance = getData("attendance");
  let activities = getData("activities");
  let activityScores = getData("activityScores");

  let materials = getData("materials");
  let facultyAnnouncements = getData("facultyAnnouncements");

  let computedGrades = getData("computedGrades");

  let currentFaculty = null;
  let currentClassId = null;

  /* 
     GRADING CONFIGURATION
   */

  const TERM_WEIGHTS = {
    prelim: 0.3,
    midterm: 0.3,
    final: 0.4,
  };

  const CATEGORY_WEIGHTS = {
    quiz: 0.1,
    assignment: 0.1,
    project: 0.25,
    attendance: 0.1,
    recitation: 0.15,
    exam: 0.3,
  };

  const CATEGORY_NAMES = {
    quiz: "Quizzes",
    assignment: "Assignments",
    project: "Projects",
    attendance: "Attendance",
    recitation: "Recitation",
    exam: "Major Exam",
  };

  const CATEGORY_PREFIX = {
    quiz: "Q",
    assignment: "A",
    project: "P",
    recitation: "R",
    exam: "E",
  };

  const CATEGORY_ORDER = [
    "quiz",
    "assignment",
    "project",
    "attendance",
    "recitation",
    "exam",
  ];

  const TERM_ORDER = ["prelim", "midterm", "final"];

  const TERM_NAMES = {
    prelim: "PRELIM",
    midterm: "MIDTERM",
    final: "FINAL",
  };
  const GRADE_TERM_WEIGHTS = TERM_WEIGHTS;

  const GRADE_CATEGORY_WEIGHTS = CATEGORY_WEIGHTS;

  const GRADE_CATEGORY_NAMES = CATEGORY_NAMES;

  const GRADE_PREFIXES = CATEGORY_PREFIX;

  const GRADE_CATEGORIES = CATEGORY_ORDER;

  const GRADE_TERMS = TERM_ORDER;

  const GRADE_TERM_NAMES = TERM_NAMES;

  /* 
     DATA REFRESH
   */

  const refreshData = () => {
    users = getData("users");
    departments = getData("departments");
    courses = getData("courses");
    sections = getData("sections");
    subjects = getData("subjects");
    sectionSubjects = getData("sectionSubjects");
    enrollments = getData("enrollments");
    schedules = getData("schedules");

    attendance = getData("attendance");
    activities = getData("activities");
    activityScores = getData("activityScores");

    materials = getData("materials");
    facultyAnnouncements = getData("facultyAnnouncements");

    computedGrades = getData("computedGrades");
  };

  /* 
     FACULTY
   */

  const getCurrentFaculty = () => {
    const loggedInUserId = localStorage.getItem("loggedInUserId");

    if (loggedInUserId) {
      const user = users.find(
        (item) => item.id === loggedInUserId && item.role === "faculty",
      );

      if (user) {
        return user;
      }
    }

    const loggedInUsername = localStorage.getItem("loggedInUsername");

    if (loggedInUsername) {
      const user = users.find(
        (item) => item.username === loggedInUsername && item.role === "faculty",
      );

      if (user) {
        return user;
      }
    }

    return users.find((item) => item.role === "faculty");
  };

  currentFaculty = getCurrentFaculty();

  if (!currentFaculty) {
    window.location.href = "../log-in-page.html";

    return;
  }

  /* 
     LOOKUPS
   */

  const getUserName = (user) => {
    if (!user) {
      return "Unknown User";
    }

    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    return name || user.username || "Unknown User";
  };

  const getInitials = (user) => {
    if (!user) {
      return "FN";
    }

    return (
      `${user.firstName?.charAt(0) || ""}${
        user.lastName?.charAt(0) || ""
      }`.toUpperCase() || "FN"
    );
  };

  const getDepartmentName = (id) => {
    const department = departments.find((item) => item.id === id);

    return department?.name || "Unknown Department";
  };

  const getCourse = (id) => {
    return courses.find((item) => item.id === id);
  };

  const getSection = (id) => {
    return sections.find((item) => item.id === id);
  };

  const getSubject = (id) => {
    return subjects.find((item) => item.id === id);
  };

  const getSectionTitle = (sectionId) => {
    const section = getSection(sectionId);

    if (!section) {
      return "Unknown Section";
    }

    const course = getCourse(section.courseId);

    return `${course?.name || ""} - ${section.yearLevel || ""} - Section ${
      section.name || ""
    }`;
  };

  const getClassStudents = (sectionId) => {
    return enrollments
      .filter((item) => item.sectionId === sectionId)
      .map((item) => users.find((user) => user.id === item.studentId))
      .filter(Boolean);
  };

  const getMySchedules = () => {
    return schedules.filter(
      (schedule) => schedule.facultyId === currentFaculty.id,
    );
  };

  const getScheduleForAssignment = (sectionId, subjectId) => {
    return schedules.find(
      (schedule) =>
        schedule.sectionId === sectionId &&
        schedule.subjectId === subjectId &&
        schedule.facultyId === currentFaculty.id,
    );
  };

  const getMyClasses = () => {
    return getMySchedules()
      .map((schedule) => {
        const relation = sectionSubjects.find(
          (item) =>
            item.sectionId === schedule.sectionId &&
            item.subjectId === schedule.subjectId,
        );

        if (!relation) {
          return null;
        }

        const section = getSection(schedule.sectionId);

        const subject = getSubject(schedule.subjectId);

        const course = section ? getCourse(section.courseId) : null;

        return {
          ...relation,
          schedule,
          section,
          subject,
          course,
        };
      })
      .filter(Boolean);
  };

  const formatDate = (value) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /* 
     PROFILE
   */

  const loadFacultyProfile = () => {
    const facultyName = document.getElementById("facultyName");

    const facultyDepartment = document.getElementById("facultyDepartment");

    const facultyAvatar = document.getElementById("facultyAvatar");

    const welcomeName = document.getElementById("welcomeFacultyName");

    if (facultyName) {
      facultyName.textContent = getUserName(currentFaculty);
    }

    if (facultyDepartment) {
      facultyDepartment.textContent = currentFaculty.departmentId
        ? getDepartmentName(currentFaculty.departmentId)
        : "Faculty";
    }

    if (facultyAvatar) {
      facultyAvatar.textContent = getInitials(currentFaculty);
    }

    if (welcomeName) {
      welcomeName.textContent = currentFaculty.firstName || "Faculty";
    }

    const profileName = document.getElementById("profileFacultyName");

    const largeAvatar = document.getElementById("largeFacultyAvatar");

    if (profileName) {
      profileName.textContent = getUserName(currentFaculty);
    }

    if (largeAvatar) {
      largeAvatar.textContent = getInitials(currentFaculty);
    }

    const fields = {
      profileFirstName: currentFaculty.firstName || "—",

      profileLastName: currentFaculty.lastName || "—",

      profileEmail: currentFaculty.email || "—",

      profileUsername: currentFaculty.username || "—",

      profileDepartment: currentFaculty.departmentId
        ? getDepartmentName(currentFaculty.departmentId)
        : "Not assigned",
    };

    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);

      if (element) {
        element.textContent = value;
      }
    });
  };

  /* 
     NAVIGATION
   */

  const navItems = document.querySelectorAll(".nav-item[data-section]");

  const pageSections = document.querySelectorAll(".page-section");

  const pageInfo = {
    dashboard: [
      "Faculty Dashboard",
      "Manage your classes and academic activities.",
    ],

    classes: ["My Classes", "View your assigned subjects and sections."],

    activities: ["Activities", "Create and manage academic activities."],

    grades: ["Grades", "Enter scores and compute final grades."],

    announcements: ["Announcements", "View and publish announcements."],

    schedule: ["My Schedule", "View your assigned class schedule."],

    profile: ["My Profile", "View your faculty account."],

    classDetails: ["Class Details", "View and manage this class."],
  };

  const showSection = (sectionId) => {
    pageSections.forEach((section) =>
      section.classList.remove("active-section"),
    );

    navItems.forEach((item) => item.classList.remove("active"));

    const target = document.getElementById(sectionId);

    if (target) {
      target.classList.add("active-section");
    }

    const nav = document.querySelector(
      `.nav-item[data-section="${sectionId}"]`,
    );

    if (nav) {
      nav.classList.add("active");
    }

    const title = document.getElementById("pageTitle");

    const subtitle = document.getElementById("pageSubtitle");

    if (pageInfo[sectionId]) {
      if (title) {
        title.textContent = pageInfo[sectionId][0];
      }

      if (subtitle) {
        subtitle.textContent = pageInfo[sectionId][1];
      }
    }

    if (sectionId === "grades") {
      refreshData();

      populateGradeClassFilter();

      renderGradeSheet();
    }
    if (sectionId === "announcements") {
      refreshData();
      renderSystemAnnouncements();
      renderClassAnnouncements();
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

  document.querySelectorAll(".section-link[data-section]").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();

      showSection(item.dataset.section);
    });
  });

  /* 
     DASHBOARD
   */

  const renderMyClasses = () => {
    const container = document.getElementById("classList");

    if (!container) {
      return;
    }

    const classes = getMyClasses();

    if (!classes.length) {
      container.innerHTML = `
        <div class="empty-message">
          No classes assigned yet.
        </div>
      `;

      return;
    }

    container.innerHTML = classes
      .map((item) => {
        const count = getClassStudents(item.section.id).length;

        return `
              <div class="class-item">

                <div class="class-icon">
                  ${escapeHTML((item.subject.code || "").slice(0, 4))}
                </div>

                <div class="class-info">

                  <h3>
                    ${escapeHTML(item.subject.name)}
                  </h3>

                  <p>
                    ${escapeHTML(item.subject.code || "")}
                  </p>

                  <small>
                    ${escapeHTML(item.course.name)}
                    ·
                    ${escapeHTML(item.section.yearLevel || "")}
                    · Section
                    ${escapeHTML(item.section.name || "")}
                  </small>

                  <small>
                    ${count}
                    student(s)
                  </small>

                </div>

                <button
                  type="button"
                  class="class-action"
                  data-open-class="${item.section.id}_${item.subject.id}"
                >
                  Open
                </button>

              </div>
            `;
      })
      .join("");
  };

  const renderMyClassesPreview = () => {
    const container = document.getElementById("myClassesPreview");

    if (!container) {
      return;
    }

    const classes = getMyClasses();

    if (!classes.length) {
      container.innerHTML = `
          <div class="empty-message">
            No classes assigned yet.
          </div>
        `;

      return;
    }

    container.innerHTML = classes
      .slice(0, 4)
      .map((item) => {
        const count = getClassStudents(item.section.id).length;

        return `
                <div class="class-item">

                  <div class="class-icon">
                    ${escapeHTML((item.subject.code || "").slice(0, 4))}
                  </div>

                  <div class="class-info">

                    <h3>
                      ${escapeHTML(item.subject.name)}
                    </h3>

                    <p>
                      ${escapeHTML(item.subject.code || "")}
                    </p>

                    <small>
                      ${escapeHTML(item.course.name)}
                      ·
                      ${escapeHTML(item.section.yearLevel || "")}
                      · Section
                      ${escapeHTML(item.section.name || "")}
                    </small>

                    <small>
                      ${count}
                      student(s)
                    </small>

                  </div>

                  <button
                    type="button"
                    class="class-action"
                    data-open-class="${item.section.id}_${item.subject.id}"
                  >
                    Open
                  </button>

                </div>
              `;
      })
      .join("");
  };

  const renderTodaySchedule = () => {
    const container = document.getElementById("todayScheduleList");

    if (!container) {
      return;
    }

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
    });

    const todaySchedules = getMySchedules()
      .filter((item) => item.day === today)
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

    if (!todaySchedules.length) {
      container.innerHTML = `
          <div class="empty-message">
            No classes scheduled for today.
          </div>
        `;

      return;
    }

    container.innerHTML = todaySchedules
      .map((schedule) => {
        const subject = getSubject(schedule.subjectId);

        const section = getSection(schedule.sectionId);

        return `
                <div class="schedule-item">

                  <div class="schedule-info">

                    <h3>
                      ${escapeHTML(subject?.name || "Unknown Subject")}
                    </h3>

                    <p>
                      ${escapeHTML(section?.yearLevel || "")}
                      · Section
                      ${escapeHTML(section?.name || "")}
                    </p>

                  </div>

                  <div class="schedule-time">

                    <strong>
                      ${escapeHTML(schedule.startTime || "")}
                    </strong>

                    <span>
                      ${escapeHTML(schedule.endTime || "")}
                    </span>

                  </div>

                </div>
              `;
      })
      .join("");
  };

  const updateDashboardCounts = () => {
    const classes = getMyClasses();

    const students = new Set();

    classes.forEach((item) => {
      getClassStudents(item.section.id).forEach((student) => {
        students.add(student.id);
      });
    });

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
    });

    const todayCount = getMySchedules().filter(
      (item) => item.day === today,
    ).length;

    let pending = 0;

    activities
      .filter(
        (activity) =>
          activity.facultyId === currentFaculty.id &&
          !activity.isBlank &&
          activity.source !== "grade-sheet",
      )
      .forEach((activity) => {
        const subjectStudents = enrollments
          .filter((enrollment) =>
            sections.some(
              (section) =>
                section.id === enrollment.sectionId &&
                sectionSubjects.some(
                  (relation) =>
                    relation.sectionId === section.id &&
                    relation.subjectId === activity.subjectId,
                ),
            ),
          )
          .map((enrollment) =>
            users.find((user) => user.id === enrollment.studentId),
          )
          .filter(Boolean);

        const uniqueStudents = Array.from(
          new Map(
            subjectStudents.map((student) => [student.id, student]),
          ).values(),
        );

        uniqueStudents.forEach((student) => {
          const score = getGradeScore(activity.id, student.id);

          if (score === "" || score === null || score === undefined) {
            pending++;
          }
        });
      });
    const values = {
      myClassesCount: classes.length,

      myStudentsCount: students.size,

      todayClassesCount: todayCount,

      pendingGradesCount: pending,
    };

    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);

      if (element) {
        element.textContent = value;
      }
    });
  };

  /* 
     CLASS DETAILS
   */

  const openClass = (sectionId, subjectId) => {
    const section = getSection(sectionId);

    const subject = getSubject(subjectId);

    if (!section || !subject) {
      return;
    }

    currentClassId = {
      sectionId,
      subjectId,
    };

    const course = getCourse(section.courseId);

    const schedule = getScheduleForAssignment(sectionId, subjectId);

    const title = document.getElementById("classDetailTitle");

    const subtitle = document.getElementById("classDetailSubtitle");

    if (title) {
      title.textContent = `${subject.code || ""} - ${subject.name || ""}`;
    }

    if (subtitle) {
      subtitle.textContent = `${course?.name || ""} · ${
        section.yearLevel || ""
      } · Section ${section.name || ""}`;
    }

    const fields = {
      detailSubject: `${subject.code || ""} - ${subject.name || ""}`,

      detailCourse: course?.name || "—",

      detailSection: `${section.yearLevel || ""} - Section ${
        section.name || ""
      }`,

      detailSchedule: schedule
        ? `${schedule.day} · ${schedule.startTime || ""} - ${
            schedule.endTime || ""
          }`
        : "No schedule",
    };

    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);

      if (element) {
        element.textContent = value;
      }
    });

    renderClassStudents();
    renderAttendance();
    renderMaterials();

    showSection("classDetails");
  };

  const openActivitySubmissions = (activityId) => {
    refreshData();

    const activity = activities.find((item) => item.id === activityId);

    if (!activity) {
      return;
    }

    const subject = getSubject(activity.subjectId);

    const submissions = getActivitySubmissions(activityId);

    document.getElementById("submissionActivityTitle").textContent =
      activity.name || "Activity";

    document.getElementById("submissionActivitySubject").textContent =
      `${subject?.code || ""} - ${subject?.name || ""}`;

    const container = document.getElementById("activitySubmissionList");

    if (!container) {
      return;
    }

    if (!submissions.length) {
      container.innerHTML = `
      <div class="empty-message">
        No students have submitted
        this activity yet.
      </div>
    `;
    } else {
      container.innerHTML = submissions
        .map((submission) => {
          const student = getStudentById(submission.studentId);

          const grade = getSubmissionGrade(activity.id, submission.studentId);

          return `
            <div
              class="activity-submission-row"
            >

              <div>
                <strong>
                  ${escapeHTML(getUserName(student))}
                </strong>

                <span>
                  ${escapeHTML(submission.fileName || "Uploaded file")}
                </span>
              </div>

              <div
                class="activity-submission-actions"
              >

                ${
                  submission.fileData
                    ? `
                      <a
                        href="${submission.fileData}"
                        download="${escapeHTML(
                          submission.fileName || "submission",
                        )}"
                        class="activity-action"
                      >
                        Download
                      </a>
                    `
                    : ""
                }

                <input
                  type="number"
                  min="0"
                  max="${Number(activity.totalItems) || ""}"
                  step="0.01"
                  value="${grade !== "" ? grade : ""}"
                  placeholder="Grade"
                  data-submission-grade
                  data-activity-id="${activity.id}"
                  data-student-id="${submission.studentId}"
                />

                <span>
                  /
                  ${Number(activity.totalItems) || 0}
                </span>

                <button
                  type="button"
                  class="activity-action"
                  data-save-submission-grade
                  data-activity-id="${activity.id}"
                  data-student-id="${submission.studentId}"
                >
                  Save
                </button>

              </div>

            </div>
          `;
        })
        .join("");
    }

    showSection("activitySubmissions");
  };

  document.addEventListener("click", (event) => {
    const submissionButton = event.target.closest("[data-view-submissions]");

    if (submissionButton) {
      openActivitySubmissions(submissionButton.dataset.viewSubmissions);

      return;
    }

    const saveGradeButton = event.target.closest(
      "[data-save-submission-grade]",
    );

    if (saveGradeButton) {
      const activityId = saveGradeButton.dataset.activityId;

      const studentId = saveGradeButton.dataset.studentId;

      const input = document.querySelector(
        `[data-submission-grade][data-activity-id="${activityId}"][data-student-id="${studentId}"]`,
      );

      if (!input) {
        return;
      }

      const value = input.value.trim();

      if (value === "") {
        alert("Please enter a grade.");

        return;
      }

      const saved = saveSubmissionGrade(activityId, studentId, value);

      if (!saved) {
        alert("Unable to save the grade.");

        return;
      }

      refreshData();

      renderActivityList();

      renderGradeSheet();

      updateDashboardCounts();

      alert("Grade saved successfully.");

      return;
    }

    const button = event.target.closest("[data-open-class]");

    if (!button) {
      return;
    }

    const classValue = button.dataset.openClass;

    const index = classValue.indexOf("_");

    if (index === -1) {
      return;
    }

    openClass(classValue.slice(0, index), classValue.slice(index + 1));
  });

  /* 
     CLASS TABS
   */

  document.querySelectorAll(".class-tab[data-class-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll(".class-tab")
        .forEach((item) => item.classList.remove("active"));

      document
        .querySelectorAll(".class-tab-content")
        .forEach((item) => item.classList.remove("active"));

      button.classList.add("active");

      const content = document.getElementById(button.dataset.classTab);

      if (content) {
        content.classList.add("active");
      }
    });
  });

  document
    .getElementById("backToActivitiesButton")
    ?.addEventListener("click", () => {
      showSection("activities");
    });

  /* 
     CLASS STUDENTS
   */

  const renderClassStudents = () => {
    const container = document.getElementById("classStudentList");

    if (!container || !currentClassId) {
      return;
    }

    const students = getClassStudents(currentClassId.sectionId);

    if (!students.length) {
      container.innerHTML = `
          <div class="empty-message">
            No students enrolled.
          </div>
        `;

      return;
    }

    container.innerHTML = students
      .map(
        (student) => `
              <div class="student-item">

                <div class="student-avatar">
                  ${escapeHTML(getInitials(student))}
                </div>

                <div class="student-info">

                  <h3>
                    ${escapeHTML(getUserName(student))}
                  </h3>

                  <p>
                    ${escapeHTML(student.email || "")}
                  </p>

                </div>

              </div>
            `,
      )
      .join("");
  };

  /* 
     ATTENDANCE
   */

  const getAttendancePercentage = (studentId, sectionId, subjectId) => {
    const records = attendance.filter(
      (record) =>
        record.studentId === studentId &&
        record.sectionId === sectionId &&
        record.subjectId === subjectId,
    );

    if (!records.length) {
      return 0;
    }

    const attended = records.filter(
      (record) =>
        record.status === "present" ||
        record.status === "late" ||
        record.status === "excused",
    ).length;

    return Math.min(100, (attended / records.length) * 100);
  };

  const renderAttendance = () => {
    const container = document.getElementById("attendanceList");

    if (!container || !currentClassId) {
      return;
    }

    const input = document.getElementById("attendanceDate");
    const date = input?.value || new Date().toISOString().slice(0, 10);

    if (input && !input.value) {
      input.value = date;
    }

    const students = getClassStudents(currentClassId.sectionId);

    if (!students.length) {
      container.innerHTML = `
      <div class="empty-message">
        No students enrolled.
      </div>
    `;

      return;
    }

    const displayDate = new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-US",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
      },
    );

    container.innerHTML = `
    <div class="attendance-table-wrapper">
      <table class="attendance-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>${escapeHTML(displayDate)}</th>
            <th>Grade</th>
          </tr>
        </thead>

        <tbody>
          ${students
            .map((student) => {
              const record = attendance.find(
                (item) =>
                  item.studentId === student.id &&
                  item.sectionId === currentClassId.sectionId &&
                  item.subjectId === currentClassId.subjectId &&
                  item.date === date,
              );

              const status = record?.status || "";

              const grade =
                status !== "" ? (ATTENDANCE_GRADES[status] ?? 0) : "";

              return `
                <tr>
                  <td>
                    <div class="attendance-student">
                      <div class="student-avatar">
                        ${escapeHTML(getInitials(student))}
                      </div>

                      <div class="student-info">
                        <h3>
                          ${escapeHTML(getUserName(student))}
                        </h3>

                        <p>
                          ${escapeHTML(student.username || student.email || "")}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td>
                    <select
                      class="attendance-status-select"
                      data-attendance-status
                      data-student-id="${student.id}"
                      data-section-id="${currentClassId.sectionId}"
                      data-subject-id="${currentClassId.subjectId}"
                      data-date="${date}"
                    >
                      <option value="" ${status === "" ? "selected" : ""}>
                        Select Attendance
                      </option>

                      <option
                        value="present"
                        ${status === "present" ? "selected" : ""}
                      >
                        Present
                      </option>

                      <option
                        value="late"
                        ${status === "late" ? "selected" : ""}
                      >
                        Late
                      </option>

                      <option
                        value="absent"
                        ${status === "absent" ? "selected" : ""}
                      >
                        Absent
                      </option>

                      <option
                        value="excused"
                        ${status === "excused" ? "selected" : ""}
                      >
                        Excused
                      </option>
                    </select>
                  </td>

                  <td>
                    <span
                      class="attendance-grade"
                      data-attendance-grade
                      data-student-id="${student.id}"
                      data-date="${date}"
                    >
                      ${grade === "" ? "—" : grade}
                    </span>
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
  };

  document.addEventListener("change", (event) => {
    const select = event.target.closest("[data-attendance-status]");

    if (!select) {
      return;
    }

    const studentId = select.dataset.studentId;
    const sectionId = select.dataset.sectionId;
    const subjectId = select.dataset.subjectId;
    const date = select.dataset.date;
    const status = select.value;

    attendance = attendance.filter(
      (record) =>
        !(
          record.studentId === studentId &&
          record.sectionId === sectionId &&
          record.subjectId === subjectId &&
          record.date === date
        ),
    );

    if (status) {
      attendance.push({
        id: createId(),
        studentId,
        sectionId,
        subjectId,
        date,
        status,
        grade: ATTENDANCE_GRADES[status],
        recordedAt: new Date().toISOString(),
        facultyId: currentFaculty.id,
      });
    }

    saveData("attendance", attendance);

    const gradeElement = document.querySelector(
      `[data-attendance-grade][data-student-id="${studentId}"][data-date="${date}"]`,
    );

    if (gradeElement) {
      gradeElement.textContent = status ? ATTENDANCE_GRADES[status] : "—";
    }

    updateGradeResults(sectionId, subjectId);
  });

  document
    .getElementById("attendanceDate")
    ?.addEventListener("change", renderAttendance);

  /* 
   ACTIVITIES
 */

  const getActivitySubmissions = (activityId) => {
    const submissions = getData("submissions");

    return submissions.filter(
      (submission) => submission.activityId === activityId,
    );
  };

  const getStudentById = (studentId) => {
    return users.find((user) => user.id === studentId);
  };

  const getSubmissionGrade = (activityId, studentId) => {
    const record = activityScores.find(
      (item) => item.activityId === activityId && item.studentId === studentId,
    );

    return record ? record.score : "";
  };

  const saveSubmissionGrade = (activityId, studentId, score) => {
    const activity = activities.find((item) => item.id === activityId);

    if (!activity) {
      return false;
    }

    const maximum = Number(activity.totalItems);

    let numericScore = Number(score);

    if (!Number.isFinite(numericScore)) {
      return false;
    }

    if (Number.isFinite(maximum) && maximum > 0) {
      numericScore = Math.min(maximum, Math.max(0, numericScore));
    }

    const existingIndex = activityScores.findIndex(
      (item) => item.activityId === activityId && item.studentId === studentId,
    );

    if (existingIndex >= 0) {
      activityScores[existingIndex].score = numericScore;
    } else {
      activityScores.push({
        id: createId(),
        activityId,
        studentId,
        score: numericScore,
      });
    }

    saveData("activityScores", activityScores);

    return true;
  };

  /* 
   ACTIVITY SUBJECT FILTER
 */

  function populateActivityClassFilter() {
    const select = document.getElementById("activityClassFilter");

    if (!select) {
      return;
    }

    const previous = select.value;

    const subjectsForFaculty = getMyClasses()
      .map((item) => item.subject)
      .filter(Boolean)
      .filter(
        (subject, index, array) =>
          array.findIndex((item) => item.id === subject.id) === index,
      )
      .sort((a, b) => String(a.code || "").localeCompare(String(b.code || "")));

    select.innerHTML = `
    <option value="">
      Select Subject
    </option>

    ${subjectsForFaculty
      .map(
        (subject) => `
          <option
            value="${subject.id}"
          >
            ${escapeHTML(subject.code || "")}
            -
            ${escapeHTML(subject.name || "")}
          </option>
        `,
      )
      .join("")}
  `;

    if (
      previous &&
      Array.from(select.options).some((option) => option.value === previous)
    ) {
      select.value = previous;
    }
  }

  /* 
   ACTIVITY LIST
 */

  const renderActivityList = () => {
    const container = document.getElementById("activityList");

    if (!container) {
      return;
    }

    const select = document.getElementById("activityClassFilter");

    let list = activities.filter(
      (activity) =>
        activity.facultyId === currentFaculty.id &&
        !activity.isBlank &&
        activity.source !== "grade-sheet",
    );

    if (select?.value) {
      const subjectId = select.value;

      list = list.filter((activity) => activity.subjectId === subjectId);
    }

    if (!list.length) {
      container.innerHTML = `
      <div class="empty-message">
        No activities created yet.
      </div>
    `;

      return;
    }

    container.innerHTML = [...list]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .map((activity) => {
        const subject = getSubject(activity.subjectId);

        const submissions = getActivitySubmissions(activity.id);

        const submissionCount = submissions.length;

        return `
            <div
              class="activity-item faculty-activity-card"
              data-activity-card="${activity.id}"
            >

              <div
                class="activity-info"
              >

                <div>

                  <span
                    class="activity-type"
                  >
                    ${escapeHTML(
                      CATEGORY_NAMES[activity.type] || activity.type,
                    )}
                  </span>

                  <span
                    class="activity-term"
                  >
                    ${escapeHTML(activity.term || "")}
                  </span>

                </div>


                <h3>
                  ${escapeHTML(activity.name)}
                </h3>


                <p>
                  ${escapeHTML(subject?.code || "")}

                  ${subject?.code && subject?.name ? " - " : ""}

                  ${escapeHTML(subject?.name || "Unknown Subject")}
                </p>


                ${
                  activity.description
                    ? `
                      <p
                        class="activity-description"
                      >
                        ${escapeHTML(activity.description)}
                      </p>
                    `
                    : ""
                }


                <div
                  class="activity-meta"
                >

                  <span>
                    ${Number(activity.totalItems) || 0}
                    item(s)
                  </span>


                  <span>
                    ${escapeHTML(formatDate(activity.date))}
                  </span>

                </div>

              </div>


              <div
                class="activity-actions"
              >

                <button
                  type="button"
                  class="activity-action submission-button"
                  data-view-submissions="${activity.id}"
                >
                  ${submissionCount}
                  ${submissionCount === 1 ? "Submission" : "Submissions"}
                </button>


                <button
                  type="button"
                  class="activity-action"
                  data-edit-activity="${activity.id}"
                >
                  Edit
                </button>


                <button
                  type="button"
                  class="activity-action delete"
                  data-delete-activity="${activity.id}"
                >
                  Delete
                </button>

              </div>

            </div>
          `;
      })
      .join("");
  };

  /* 
   ACTIVITY FORM
 */

  const showActivityForm = () => {
    const container = document.getElementById("activityFormContainer");

    if (container) {
      container.style.display = "block";
    }
  };

  const hideActivityForm = () => {
    const container = document.getElementById("activityFormContainer");

    const form = document.getElementById("activityForm");

    if (form) {
      form.reset();

      form.removeAttribute("data-editing-id");

      const button = form.querySelector('button[type="submit"]');

      if (button) {
        button.textContent = "Create Activity";
      }
    }

    if (container) {
      container.style.display = "none";
    }
  };

  document
    .getElementById("activityClassFilter")
    ?.addEventListener("change", renderActivityList);

  document
    .getElementById("showActivityFormButton")
    ?.addEventListener("click", () => {
      const select = document.getElementById("activityClassFilter");

      if (!select?.value) {
        alert("Please select a subject first.");

        return;
      }

      showActivityForm();
    });

  document
    .getElementById("cancelActivityButton")
    ?.addEventListener("click", hideActivityForm);

  document
    .getElementById("activityForm")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();

      const form = event.currentTarget;

      const subjectId = document.getElementById("activityClassFilter")?.value;

      const type = document.getElementById("activityType")?.value;

      const term = document.getElementById("activityTerm")?.value;

      const name = document.getElementById("activityName")?.value.trim();

      const totalItems = Number(
        document.getElementById("activityItems")?.value,
      );

      const date = document.getElementById("activityDate")?.value;

      const description = document
        .getElementById("activityDescription")
        ?.value.trim();

      if (
        !subjectId ||
        !type ||
        !term ||
        !name ||
        !Number.isFinite(totalItems) ||
        totalItems <= 0 ||
        !date
      ) {
        alert("Please complete all required fields.");

        return;
      }

      const editingId = form.dataset.editingId;

      if (editingId) {
        const activity = activities.find((item) => item.id === editingId);

        if (!activity) {
          return;
        }

        Object.assign(activity, {
          subjectId,
          facultyId: currentFaculty.id,
          type,
          term,
          name,
          totalItems,
          date,
          description,
          isBlank: false,
        });
      } else {
        activities.push({
          id: createId(),

          subjectId,

          facultyId: currentFaculty.id,

          type,
          term,
          name,

          totalItems,

          date,

          description,

          isBlank: false,

          source: "activities",

          createdAt: new Date().toISOString(),
        });
      }

      saveData("activities", activities);

      hideActivityForm();

      refreshData();

      populateActivityClassFilter();

      renderActivityList();

      renderClassActivities();

      renderGradeSheet();

      updateDashboardCounts();
    });

  /* 
   ACTIVITY EDIT / DELETE
 */

  document.addEventListener("click", (event) => {
    const edit = event.target.closest("[data-edit-activity]");

    if (edit) {
      const activity = activities.find(
        (item) => item.id === edit.dataset.editActivity,
      );

      if (!activity) {
        return;
      }

      const form = document.getElementById("activityForm");

      const select = document.getElementById("activityClassFilter");

      if (!form || !select) {
        return;
      }

      select.value = activity.subjectId;

      document.getElementById("activityType").value = activity.type;

      document.getElementById("activityTerm").value = activity.term;

      document.getElementById("activityName").value = activity.name;

      document.getElementById("activityItems").value = activity.totalItems;

      document.getElementById("activityDate").value = activity.date;

      document.getElementById("activityDescription").value =
        activity.description || "";

      form.dataset.editingId = activity.id;

      const submit = form.querySelector('button[type="submit"]');

      if (submit) {
        submit.textContent = "Update Activity";
      }

      showSection("activities");

      showActivityForm();

      renderActivityList();

      return;
    }

    const del = event.target.closest("[data-delete-activity]");

    if (del) {
      const activity = activities.find(
        (item) => item.id === del.dataset.deleteActivity,
      );

      if (!activity) {
        return;
      }

      if (!confirm(`Delete "${activity.name}"?`)) {
        return;
      }

      activities = activities.filter((item) => item.id !== activity.id);

      activityScores = activityScores.filter(
        (item) => item.activityId !== activity.id,
      );

      let submissions = getData("submissions");

      submissions = submissions.filter(
        (submission) => submission.activityId !== activity.id,
      );

      saveData("activities", activities);

      saveData("activityScores", activityScores);

      saveData("submissions", submissions);

      refreshData();

      populateActivityClassFilter();

      renderActivityList();

      renderClassActivities();

      renderGradeSheet();

      updateDashboardCounts();
    }
  });

  /* 
     ATTENDANCE
   */

  const ATTENDANCE_GRADES = {
    present: 100,
    late: 75,
    absent: 0,
    excused: 100,
  };

  function calculateGradeAttendance(studentId, sectionId, subjectId) {
    const records = attendance.filter(
      (record) =>
        record.studentId === studentId &&
        record.sectionId === sectionId &&
        record.subjectId === subjectId,
    );

    if (!records.length) {
      return 0;
    }

    const totalGrade = records.reduce((sum, record) => {
      return sum + (ATTENDANCE_GRADES[record.status] ?? 0);
    }, 0);

    return totalGrade / records.length;
  }
  /* 
   GRADE SCORE HELPERS
 */

  function getGradeScore(activityId, studentId) {
    const record = activityScores.find(
      (item) => item.activityId === activityId && item.studentId === studentId,
    );

    return record ? record.score : "";
  }

  function saveGradeScore(activityId, studentId, score) {
    const activity = activities.find((item) => item.id === activityId);

    if (!activity) {
      return false;
    }

    const total = Number(activity.totalItems);

    let numericScore =
      score === "" || score === null || score === undefined
        ? ""
        : Number(score);

    if (numericScore !== "" && !Number.isFinite(numericScore)) {
      return false;
    }

    if (numericScore !== "" && Number.isFinite(total) && total > 0) {
      numericScore = Math.min(total, Math.max(0, numericScore));
    }

    const index = activityScores.findIndex(
      (item) => item.activityId === activityId && item.studentId === studentId,
    );

    if (index >= 0) {
      activityScores[index].score = numericScore;
    } else {
      activityScores.push({
        id: createId(),
        activityId,
        studentId,
        score: numericScore,
      });
    }

    saveData("activityScores", activityScores);

    return true;
  }

  /* 
   GRADE CALCULATIONS
 */

  function calculateGradeCategory(studentId, sectionId, subjectId, term, type) {
    if (type === "attendance") {
      return calculateGradeAttendance(studentId, sectionId, subjectId);
    }

    const list = getGradeActivities(sectionId, subjectId, term, type);

    if (!list.length) {
      return 0;
    }

    let earned = 0;
    let possible = 0;

    list.forEach((activity) => {
      const score = getGradeScore(activity.id, studentId);

      const total = Number(activity.totalItems);

      if (score === "" || score === null || score === undefined) {
        return;
      }

      if (!Number.isFinite(total) || total <= 0) {
        return;
      }

      const numericScore = Number(score);

      if (!Number.isFinite(numericScore)) {
        return;
      }

      earned += numericScore;

      possible += total;
    });

    if (possible <= 0) {
      return 0;
    }

    return Math.min(100, Math.max(0, (earned / possible) * 100));
  }

  function calculateTermGrade(studentId, sectionId, subjectId, term) {
    let grade = 0;

    GRADE_CATEGORIES.forEach((type) => {
      const result = calculateGradeCategory(
        studentId,
        sectionId,
        subjectId,
        term,
        type,
      );

      const weight = GRADE_CATEGORY_WEIGHTS[type] || 0;

      grade += result * weight;
    });

    return grade;
  }
  /* 
     CATEGORY RESULT
   */

  function getGradeActivities(sectionId, subjectId, term, type) {
    const normalizeTerm = (value) => {
      const normalized = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");

      if (normalized === "prelim" || normalized === "prelims") {
        return "prelim";
      }

      if (normalized === "midterm" || normalized === "midterms") {
        return "midterm";
      }

      if (normalized === "final" || normalized === "finals") {
        return "final";
      }

      return normalized;
    };

    const normalizeType = (value) => {
      const normalized = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");

      if (normalized === "quiz" || normalized === "quizzes") {
        return "quiz";
      }

      if (normalized === "assignment" || normalized === "assignments") {
        return "assignment";
      }

      if (normalized === "project" || normalized === "projects") {
        return "project";
      }

      if (normalized === "attendance") {
        return "attendance";
      }

      if (normalized === "recitation" || normalized === "recitations") {
        return "recitation";
      }

      if (
        normalized === "exam" ||
        normalized === "exams" ||
        normalized === "majorexam"
      ) {
        return "exam";
      }

      return normalized;
    };

    const targetTerm = normalizeTerm(term);

    const targetType = normalizeType(type);

    return activities
      .filter((activity) => {
        const correctLocation =
          activity.source === "grade-sheet"
            ? activity.sectionId === sectionId
            : !activity.sectionId || activity.sectionId === sectionId;

        return (
          correctLocation &&
          activity.subjectId === subjectId &&
          normalizeTerm(activity.term) === targetTerm &&
          normalizeType(activity.type) === targetType &&
          !activity.isBlank
        );
      })
      .sort((a, b) => {
        const aOrder = Number(a.activityOrder);

        const bOrder = Number(b.activityOrder);

        if (
          Number.isFinite(aOrder) &&
          Number.isFinite(bOrder) &&
          aOrder !== bOrder
        ) {
          return aOrder - bOrder;
        }

        return (
          new Date(a.createdAt || a.date || 0) -
          new Date(b.createdAt || b.date || 0)
        );
      });
  }

  /* 
     FINAL SEMESTER GRADE
   */

  function calculateFinalGrade(studentId, sectionId, subjectId) {
    const prelim = calculateTermGrade(
      studentId,
      sectionId,
      subjectId,
      "prelim",
    );

    const midterm = calculateTermGrade(
      studentId,
      sectionId,
      subjectId,
      "midterm",
    );

    const final = calculateTermGrade(studentId, sectionId, subjectId, "final");

    return (
      prelim * GRADE_TERM_WEIGHTS.prelim +
      midterm * GRADE_TERM_WEIGHTS.midterm +
      final * GRADE_TERM_WEIGHTS.final
    );
  }

  /* 
     RENDER TERM HEADER
   */

  function renderGradeTermHeader(sectionId, subjectId, term) {
    let columns = 0;

    GRADE_CATEGORIES.forEach((type) => {
      if (type === "attendance") {
        columns += 1;

        return;
      }

      const list = getGradeActivities(sectionId, subjectId, term, type);

      columns += list.length + 2;
    });

    columns += 1;

    return `
      <th
        class="grade-period-header"
        colspan="${columns}"
      >

        ${GRADE_TERM_NAMES[term]}

        <small>
          ${GRADE_TERM_WEIGHTS[term] * 100}%
        </small>

      </th>
    `;
  }

  /* 
     CATEGORY HEADER
   */

  function renderGradeCategoryHeader(sectionId, subjectId, term, type) {
    if (type === "attendance") {
      return `
      <th
        class="grade-category-header"
        data-type="attendance"
        colspan="1"
      >

        ATTENDANCE

        <small>
          10%
        </small>

      </th>
    `;
    }

    const list = getGradeActivities(sectionId, subjectId, term, type);

    return `
    <th
      class="grade-category-header"
      data-type="${type}"
      colspan="${list.length + 2}"
    >

      ${GRADE_CATEGORY_NAMES[type]}

      <small>
        ${GRADE_CATEGORY_WEIGHTS[type] * 100}%
      </small>

    </th>
  `;
  }

  /* 
     ACTIVITY HEADER ROW
   */

  function renderGradeActivityHeaders(sectionId, subjectId, term, type) {
    /*
      Attendance has no individual activities.
      It still needs exactly ONE Result column.
    */

    if (type === "attendance") {
      return `
        <th
          class="grade-category-result-header"
        >
          RESULT
        </th>
      `;
    }

    const list = getGradeActivities(sectionId, subjectId, term, type);

    let html = "";

    /*
      Existing activities first.
    */

    list.forEach((activity) => {
      html += `
          <th
            class="grade-activity-header"
          >
            ${escapeHTML(activity.name)}
          </th>
        `;
    });

    /*
      Blank activity ALWAYS comes
      immediately before RESULT.
    */

    html += `
      <th
        class="grade-new-activity-header"
      >
        +${GRADE_PREFIXES[type]}
      </th>

      <th
        class="grade-category-result-header"
      >
        RESULT
      </th>
    `;

    return html;
  }

  /* 
     TOTAL ITEMS ROW
   */

  function renderGradeTotalItems(sectionId, subjectId, term, type) {
    if (type === "attendance") {
      return `
      <th
        class="grade-total-row grade-total-result"
      >
        —
      </th>
    `;
    }

    const list = getGradeActivities(sectionId, subjectId, term, type);

    let html = "";

    list.forEach((activity) => {
      html += `
        <th
          class="grade-total-row"
        >
          <input
            type="number"
            min="1"
            step="1"
            value="${Number(activity.totalItems) || ""}"
            class="grade-total-input"
            data-edit-grade-total="${activity.id}"
          />
        </th>
      `;
    });

    html += `
    <th
      class="grade-total-row grade-total-new"
    >
      <input
        type="number"
        min="1"
        step="1"
        placeholder="items"
        class="grade-new-activity-input"

        data-new-grade-activity

        data-section-id="${sectionId}"

        data-subject-id="${subjectId}"

        data-term="${term}"

        data-type="${type}"
      />
    </th>

    <th
      class="grade-total-row grade-total-result"
    >
      —
    </th>
  `;

    return html;
  }

  /* 
     STUDENT ROW
   */

  function renderGradeStudentRow(student, sectionId, subjectId) {
    let html = `
      <tr>

        <td
          class="grade-student-cell"
        >

          ${escapeHTML(getUserName(student))}

          <span
            class="grade-student-subtext"
          >
            ${escapeHTML(student.username || student.email || "")}
          </span>

        </td>
    `;

    GRADE_TERMS.forEach((term) => {
      GRADE_CATEGORIES.forEach((type) => {
        /*
              ATTENDANCE
            */

        if (type === "attendance") {
          html += `
                <td
                  class="grade-category-result"

                  data-category-result

                  data-student-id="${student.id}"

                  data-section-id="${sectionId}"

                  data-subject-id="${subjectId}"

                  data-term="${term}"

                  data-type="attendance"
                >
                  —
                </td>
              `;

          return;
        }

        /*
              ACTIVITIES
            */

        const list = getGradeActivities(sectionId, subjectId, term, type);

        list.forEach((activity) => {
          const score = getGradeScore(activity.id, student.id);

          const total = Number(activity.totalItems) || 0;

          html += `
                  <td>

                    <input
                      type="number"

                      min="0"

                      ${total > 0 ? `max="${total}"` : ""}

                      step="0.01"

                      value="${escapeHTML(score)}"

                      class="grade-score-input"

                      data-grade-score

                      data-activity-id="${activity.id}"

                      data-student-id="${student.id}"
                    />

                  </td>
                `;
        });

        /*
              Blank activity.
            */

        html += `
              <td
                class="grade-new-activity-cell"
              >
                —
              </td>
            `;

        /*
              Category RESULT.
            */

        html += `
              <td
                class="grade-category-result"

                data-category-result

                data-student-id="${student.id}"

                data-section-id="${sectionId}"

                data-subject-id="${subjectId}"

                data-term="${term}"

                data-type="${type}"
              >
                —
              </td>
            `;
      });

      /*
          TERM GRADE
        */

      html += `
          <td
            class="grade-term"

            data-term-result

            data-student-id="${student.id}"

            data-section-id="${sectionId}"

            data-subject-id="${subjectId}"

            data-term="${term}"
          >
            —
          </td>
        `;
    });

    /*
      FINAL GRADE
    */

    html += `
        <td
          class="grade-final"

          data-final-grade

          data-student-id="${student.id}"

          data-section-id="${sectionId}"

          data-subject-id="${subjectId}"
        >
          —
        </td>

      </tr>
    `;

    return html;
  }

  /* 
     UPDATE RESULTS
   */

  function updateGradeResults(sectionId, subjectId) {
    const students = getClassStudents(sectionId);

    students.forEach((student) => {
      /*
          CATEGORY RESULTS
        */

      document
        .querySelectorAll(
          `[data-category-result][data-student-id="${student.id}"]`,
        )
        .forEach((cell) => {
          const term = cell.dataset.term;

          const type = cell.dataset.type;

          const result = calculateGradeCategory(
            student.id,
            sectionId,
            subjectId,
            term,
            type,
          );

          cell.textContent = result > 0 ? `${result.toFixed(2)}%` : "—";
        });

      /*
          TERM RESULTS
        */

      document
        .querySelectorAll(`[data-term-result][data-student-id="${student.id}"]`)
        .forEach((cell) => {
          const term = cell.dataset.term;

          const result = calculateTermGrade(
            student.id,
            sectionId,
            subjectId,
            term,
          );

          cell.textContent = result > 0 ? result.toFixed(2) : "—";
        });

      /*
          FINAL RESULT
        */

      const finalCell = document.querySelector(
        `[data-final-grade][data-student-id="${student.id}"]`,
      );

      if (finalCell) {
        const result = calculateFinalGrade(student.id, sectionId, subjectId);

        finalCell.textContent = result > 0 ? result.toFixed(2) : "—";
      }
    });
  }

  /* 
     RENDER COMPLETE GRADE SHEET
   */

  function renderGradeSheet(preserveScroll = false) {
    refreshData();

    const select = document.getElementById("gradeClassFilter");

    const empty = document.getElementById("gradeSheetEmpty");

    const wrapper = document.getElementById("gradeSheetTableWrapper");

    const table = document.getElementById("gradeSheetTable");

    if (!select || !empty || !wrapper || !table) {
      return;
    }

    if (!select.value) {
      empty.style.display = "flex";

      wrapper.style.display = "none";

      table.innerHTML = "";

      return;
    }

    const separator = select.value.indexOf("_");

    if (separator === -1) {
      return;
    }

    const sectionId = select.value.slice(0, separator);

    const subjectId = select.value.slice(separator + 1);

    const students = getClassStudents(sectionId);

    empty.style.display = "none";

    wrapper.style.display = "block";

    /*
      Capture horizontal scroll so
      editing a total item doesn't
      jump back to the left.
    */

    const scrollContainer = document.querySelector(".grade-sheet-table-scroll");

    const previousScrollLeft =
      preserveScroll && scrollContainer ? scrollContainer.scrollLeft : 0;

    /*
      HEADER
    */

    let html = `
      <thead>

        <!-- ROW 1: TERMS -->

        <tr>

          <th
            class="grade-student-header"
            rowspan="4"
          >
            STUDENT
          </th>
    `;

    GRADE_TERMS.forEach((term) => {
      html += renderGradeTermHeader(sectionId, subjectId, term);
    });

    html += `
          <th
            class="grade-final-header"
            rowspan="4"
          >
            FINAL GRADE
          </th>

        </tr>


        <!-- ROW 2: CATEGORIES -->

        <tr>
    `;

    GRADE_TERMS.forEach((term) => {
      GRADE_CATEGORIES.forEach((type) => {
        html += renderGradeCategoryHeader(sectionId, subjectId, term, type);
      });

      /*
          Term grade column.
        */

      html += `
          <th
            class="grade-term-header"
            rowspan="3"
          >
            TERM
          </th>
        `;
    });

    html += `
        </tr>


        <!-- ROW 3: ACTIVITY NAMES -->

        <tr>
    `;

    GRADE_TERMS.forEach((term) => {
      GRADE_CATEGORIES.forEach((type) => {
        html += renderGradeActivityHeaders(sectionId, subjectId, term, type);
      });
    });

    html += `
        </tr>


        <!-- ROW 4: TOTAL ITEMS -->

        <tr
          class="grade-total-row"
        >
    `;

    GRADE_TERMS.forEach((term) => {
      GRADE_CATEGORIES.forEach((type) => {
        html += renderGradeTotalItems(sectionId, subjectId, term, type);
      });
    });

    html += `
        </tr>

      </thead>

      <tbody>
    `;

    /*
      STUDENTS
    */

    if (!students.length) {
      html += `
        <tr>

          <td
            colspan="100"
            class="grade-sheet-table-empty"
          >
            No students are enrolled
            in this class.
          </td>

        </tr>
      `;
    } else {
      students.forEach((student) => {
        html += renderGradeStudentRow(student, sectionId, subjectId);
      });
    }

    html += `
      </tbody>
    `;

    table.innerHTML = html;

    attachGradeSheetEvents(sectionId, subjectId);

    updateGradeResults(sectionId, subjectId);

    if (preserveScroll) {
      requestAnimationFrame(() => {
        const currentScroll = document.querySelector(
          ".grade-sheet-table-scroll",
        );

        if (currentScroll) {
          currentScroll.scrollLeft = previousScrollLeft;
        }
      });
    }
  }

  /* 
     GRADE SHEET EVENTS
   */

  function attachGradeSheetEvents(sectionId, subjectId) {
    /*
      SCORE INPUT
    */

    document.querySelectorAll("[data-grade-score]").forEach((input) => {
      input.addEventListener("input", () => {
        const activityId = input.dataset.activityId;

        const studentId = input.dataset.studentId;

        const activity = activities.find((item) => item.id === activityId);

        if (!activity) {
          return;
        }

        let score = input.value === "" ? "" : Number(input.value);

        if (score !== "" && !Number.isFinite(score)) {
          return;
        }

        if (score !== "") {
          const maximum = Number(activity.totalItems);

          if (Number.isFinite(maximum) && maximum > 0) {
            score = Math.min(maximum, Math.max(0, score));

            input.value = score;
          }
        }

        saveGradeScore(activityId, studentId, score);

        updateGradeResults(sectionId, subjectId);
      });
    });

    /*
      EDIT TOTAL ITEMS
    */

    document.querySelectorAll("[data-edit-grade-total]").forEach((input) => {
      input.addEventListener("change", () => {
        const activityId = input.dataset.editGradeTotal;

        const activity = activities.find((item) => item.id === activityId);

        if (!activity) {
          return;
        }

        const total = Number(input.value);

        if (!Number.isFinite(total) || total <= 0) {
          input.value = activity.totalItems || "";

          return;
        }

        activity.totalItems = total;

        /*
                Keep old student scores
                inside the new maximum.
              */

        activityScores
          .filter((record) => record.activityId === activityId)
          .forEach((record) => {
            if (Number(record.score) > total) {
              record.score = total;
            }
          });

        saveData("activities", activities);

        saveData("activityScores", activityScores);

        renderGradeSheet(true);
      });
    });

    /*
      ADD NEW ACTIVITY
    */

    document.querySelectorAll("[data-new-grade-activity]").forEach((input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const total = Number(input.value);

        if (!Number.isFinite(total) || total <= 0) {
          return;
        }

        refreshData();

        const sectionId = input.dataset.sectionId;
        const subjectId = input.dataset.subjectId;
        const term = input.dataset.term;
        const type = input.dataset.type;

        if (!sectionId || !subjectId || !term || !type) {
          return;
        }

        const existingActivities = getGradeActivities(
          sectionId,
          subjectId,
          term,
          type,
        );

        const nextNumber = existingActivities.length + 1;

        const activity = {
          id: createId(),
          subjectId: subjectId,
          sectionId: sectionId,
          facultyId: currentFaculty?.id || "",
          type: type,
          term: term,
          name: `${GRADE_PREFIXES[type]}${nextNumber}`,
          totalItems: total,
          date: new Date().toISOString().split("T")[0],
          description: "",
          isBlank: false,
          source: "grade-sheet",
          createdAt: new Date().toISOString(),
          activityOrder: nextNumber,
        };

        activities.push(activity);

        saveData("activities", activities);

        input.value = "";

        refreshData();

        renderGradeSheet();

        updateDashboardCounts();
      });
    });
  }
  /* 
     GRADE CLASS FILTER
   */

  function populateGradeClassFilter() {
    const select = document.getElementById("gradeClassFilter");

    if (!select) {
      return;
    }

    const previous = select.value;

    select.innerHTML = `
      <option value="">
        Select Class
      </option>

      ${getMyClasses()
        .map(
          (item) => `
            <option
              value="${item.section.id}_${item.subject.id}"
            >
              ${escapeHTML(item.subject.code || "")}

              -

              ${escapeHTML(item.subject.name || "")}

              -

              ${escapeHTML(item.section.yearLevel || "")}

              -

              Section

              ${escapeHTML(item.section.name || "")}
            </option>
          `,
        )
        .join("")}
    `;

    if (
      previous &&
      Array.from(select.options).some((option) => option.value === previous)
    ) {
      select.value = previous;
    }
  }

  const gradeClassFilter = document.getElementById("gradeClassFilter");

  if (gradeClassFilter) {
    gradeClassFilter.addEventListener("change", () => {
      renderGradeSheet();
    });
  }

  /* 
     MATERIALS
   */

  const renderMaterials = () => {
    const container = document.getElementById("materialList");

    if (!container || !currentClassId) {
      return;
    }

    const list = materials.filter(
      (material) =>
        material.sectionId === currentClassId.sectionId &&
        material.subjectId === currentClassId.subjectId,
    );

    if (!list.length) {
      container.innerHTML = `
        <div class="empty-message">
          No learning materials added yet.
        </div>
      `;

      return;
    }

    container.innerHTML = list
      .map(
        (material) => `
            <div class="activity-item">

              <div class="activity-info">

                <h3>
                  ${escapeHTML(material.title)}
                </h3>

                <p>
                  ${escapeHTML(material.description)}
                </p>

              </div>

              ${
                material.link
                  ? `
                    <a
                      href="${escapeHTML(material.link)}"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="activity-action"
                    >
                      Open
                    </a>
                  `
                  : ""
              }

            </div>
          `,
      )
      .join("");
  };

  document
    .getElementById("showMaterialFormButton")
    ?.addEventListener("click", () => {
      const container = document.getElementById("materialFormContainer");

      if (container) {
        container.style.display = "block";
      }
    });

  document
    .getElementById("cancelMaterialButton")
    ?.addEventListener("click", () => {
      const form = document.getElementById("materialForm");

      const container = document.getElementById("materialFormContainer");

      if (form) {
        form.reset();
      }

      if (container) {
        container.style.display = "none";
      }
    });

  document
    .getElementById("materialForm")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!currentClassId) {
        alert("Please open a class first.");

        return;
      }

      const title = document.getElementById("materialTitle")?.value.trim();

      const description = document
        .getElementById("materialDescription")
        ?.value.trim();

      const link = document.getElementById("materialLink")?.value.trim();

      if (!title || !description) {
        alert("Please complete the material information.");

        return;
      }

      materials.push({
        id: createId(),

        sectionId: currentClassId.sectionId,

        subjectId: currentClassId.subjectId,

        facultyId: currentFaculty.id,

        title,
        description,
        link,

        createdAt: new Date().toISOString(),
      });

      saveData("materials", materials);

      event.target.reset();

      const container = document.getElementById("materialFormContainer");

      if (container) {
        container.style.display = "none";
      }

      renderMaterials();
    });

  /* 
     ANNOUNCEMENTS
   */

  const renderSystemAnnouncements = () => {
    const container = document.getElementById("systemAnnouncementList");

    if (!container) {
      return;
    }

    const announcements = getData("announcements");

    const list = announcements.filter(
      (item) => item.audience === "all" || item.audience === "faculty",
    );

    if (!list.length) {
      container.innerHTML = `
          <div class="empty-message">
            No announcements available.
          </div>
        `;

      return;
    }

    container.innerHTML = [...list]
      .reverse()
      .map(
        (announcement) => `
              <div
  class="announcement-item"
>
  <div>
    <h3>
      ${escapeHTML(announcement.title)}
    </h3>

    <p>
      ${escapeHTML(announcement.message)}
    </p>

    <span class="announcement-date">
      ${escapeHTML(getSectionTitle(announcement.sectionId))}
    </span>
  </div>

  <div
    class="announcement-actions"
  >
    <span class="announcement-date">
      ${escapeHTML(formatDate(announcement.createdAt))}
    </span>

    <button
      type="button"
      class="activity-action delete"
      data-delete-announcement="${announcement.id}"
    >
      Delete
    </button>
  </div>
</div>
            `,
      )
      .join("");
  };

  const populateAnnouncementClasses = () => {
    const select = document.getElementById("announcementClass");

    if (!select) {
      return;
    }

    select.innerHTML = `
        <option value="">
          Select Class
        </option>

        ${getMyClasses()
          .map(
            (item) => `
              <option
                value="${item.section.id}_${item.subject.id}"
              >
                ${escapeHTML(item.subject.code || "")}
                -
                ${escapeHTML(item.section.yearLevel || "")}
                -
                Section
                ${escapeHTML(item.section.name || "")}
              </option>
            `,
          )
          .join("")}
      `;
  };

  const renderClassAnnouncements = () => {
    const container = document.getElementById("classAnnouncementList");

    if (!container) {
      return;
    }

    const list = facultyAnnouncements.filter(
      (item) => item.facultyId === currentFaculty.id,
    );

    if (!list.length) {
      container.innerHTML = `
          <div class="empty-message">
            No class announcements yet.
          </div>
        `;

      return;
    }

    container.innerHTML = [...list]
      .reverse()
      .map(
        (announcement) => `
              <div class="announcement-item">

  <div>
    <h3>
      ${escapeHTML(announcement.title)}
    </h3>

    <p>
      ${escapeHTML(announcement.message)}
    </p>

    <span class="announcement-date">
      ${escapeHTML(getSectionTitle(announcement.sectionId))}
    </span>
  </div>

  <div class="announcement-actions">

    <span class="announcement-date">
      ${escapeHTML(formatDate(announcement.createdAt))}
    </span>

    <button
      type="button"
      class="activity-action delete"
      data-delete-announcement="${announcement.id}"
    >
      Delete
    </button>

  </div>

</div>
            `,
      )
      .join("");
  };

  document
    .getElementById("showClassAnnouncementFormButton")
    ?.addEventListener("click", () => {
      populateAnnouncementClasses();

      const container = document.getElementById(
        "classAnnouncementFormContainer",
      );

      if (container) {
        container.style.display = "block";
      }
    });

  document
    .getElementById("cancelClassAnnouncementButton")
    ?.addEventListener("click", () => {
      const form = document.getElementById("classAnnouncementForm");

      const container = document.getElementById(
        "classAnnouncementFormContainer",
      );

      if (form) {
        form.reset();
      }

      if (container) {
        container.style.display = "none";
      }
    });

  document
    .getElementById("classAnnouncementForm")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();

      const classValue = document.getElementById("announcementClass")?.value;

      const title = document
        .getElementById("classAnnouncementTitle")
        ?.value.trim();

      const message = document
        .getElementById("classAnnouncementMessage")
        ?.value.trim();

      if (!classValue || !title || !message) {
        alert("Please complete all fields.");

        return;
      }

      const index = classValue.indexOf("_");

      const sectionId = classValue.slice(0, index);

      const subjectId = classValue.slice(index + 1);

      facultyAnnouncements.push({
        id: createId(),

        facultyId: currentFaculty.id,

        sectionId,
        subjectId,

        title,
        message,

        createdAt: new Date().toISOString(),
      });

      saveData("facultyAnnouncements", facultyAnnouncements);

      event.target.reset();

      const container = document.getElementById(
        "classAnnouncementFormContainer",
      );

      if (container) {
        container.style.display = "none";
      }

      renderClassAnnouncements();
    });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-announcement]");

    if (!button) {
      return;
    }

    const announcementId = button.dataset.deleteAnnouncement;

    const announcement = facultyAnnouncements.find(
      (item) => item.id === announcementId,
    );

    if (!announcement) {
      return;
    }

    if (!confirm(`Delete "${announcement.title}"?`)) {
      return;
    }

    facultyAnnouncements = facultyAnnouncements.filter(
      (item) => item.id !== announcementId,
    );

    saveData("facultyAnnouncements", facultyAnnouncements);

    renderClassAnnouncements();
  });

  /* 
     SCHEDULE
   */

  const renderFacultySchedule = () => {
    const container = document.getElementById("scheduleList");

    if (!container) {
      return;
    }

    const list = getMySchedules().sort(
      (a, b) =>
        (a.day || "").localeCompare(b.day || "") ||
        (a.startTime || "").localeCompare(b.startTime || ""),
    );

    if (!list.length) {
      container.innerHTML = `
          <div class="empty-message">
            No schedules available.
          </div>
        `;

      return;
    }

    container.innerHTML = list
      .map((schedule) => {
        const subject = getSubject(schedule.subjectId);

        const section = getSection(schedule.sectionId);

        return `
                <div class="schedule-item">

                  <div class="schedule-info">

                    <h3>
                      ${escapeHTML(subject?.name || "")}
                    </h3>

                    <p>
                      ${escapeHTML(subject?.code || "")}
                    </p>

                    <span
                      class="schedule-faculty"
                    >
                      ${escapeHTML(
                        section
                          ? `${section.yearLevel} - Section ${section.name}`
                          : "",
                      )}
                    </span>

                  </div>

                  <div class="schedule-time">

                    <strong>
                      ${escapeHTML(schedule.day || "")}
                    </strong>

                    <span>
                      ${escapeHTML(schedule.startTime || "")}
                      -
                      ${escapeHTML(schedule.endTime || "")}
                    </span>

                  </div>

                </div>
              `;
      })
      .join("");
  };

  const renderWeekSchedule = () => {
    const map = {
      Monday: "mondaySchedule",
      Tuesday: "tuesdaySchedule",
      Wednesday: "wednesdaySchedule",
      Thursday: "thursdaySchedule",
      Friday: "fridaySchedule",
      Saturday: "saturdaySchedule",
    };

    Object.values(map).forEach((id) => {
      const element = document.getElementById(id);

      if (element) {
        element.innerHTML = "";
      }
    });

    getMySchedules().forEach((schedule) => {
      const container = document.getElementById(map[schedule.day]);

      if (!container) {
        return;
      }

      const subject = getSubject(schedule.subjectId);

      const section = getSection(schedule.sectionId);

      const block = document.createElement("div");

      block.className = "week-class";

      block.innerHTML = `
            <strong>
              ${escapeHTML(subject?.code || "")}
            </strong>

            <span>
              ${escapeHTML(schedule.startTime || "")}
              -
              ${escapeHTML(schedule.endTime || "")}
            </span>

            <span>
              ${escapeHTML(section ? `Section ${section.name}` : "")}
            </span>
          `;

      container.appendChild(block);
    });
  };

  document.querySelectorAll("[data-schedule-view]").forEach((button) => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll("[data-schedule-view]")
        .forEach((item) => item.classList.remove("active"));

      button.classList.add("active");

      const list = document.getElementById("facultyScheduleList");

      const week = document.getElementById("facultyWeekSchedule");

      if (button.dataset.scheduleView === "week") {
        if (list) {
          list.style.display = "none";
        }

        if (week) {
          week.style.display = "block";
        }

        renderWeekSchedule();
      } else {
        if (list) {
          list.style.display = "block";
        }

        if (week) {
          week.style.display = "none";
        }
      }
    });
  });

  /* 
     LOGOUT
   */

  document
    .getElementById("logoutButton")
    ?.addEventListener("click", (event) => {
      event.preventDefault();

      if (!confirm("Are you sure you want to logout?")) {
        return;
      }

      localStorage.removeItem("loggedInUserId");

      localStorage.removeItem("loggedInUsername");

      window.location.href = "../log-in-page.html";
    });

  /* 
     INITIALIZATION
   */

  const initialize = () => {
    refreshData();

    currentFaculty = getCurrentFaculty();

    if (!currentFaculty) {
      window.location.href = "../log-in-page.html";

      return;
    }

    loadFacultyProfile();

    updateDashboardCounts();

    renderMyClasses();
    renderMyClassesPreview();
    renderTodaySchedule();

    populateActivityClassFilter();
    renderActivityList();

    populateGradeClassFilter();
    renderGradeSheet();

    renderSystemAnnouncements();
    populateAnnouncementClasses();
    renderClassAnnouncements();

    renderFacultySchedule();
  };

  initialize();
});
