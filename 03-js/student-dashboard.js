document.addEventListener("DOMContentLoaded", () => {
  /* 
     STORAGE
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
  let submissions = getData("submissions");
  let announcements = getData("announcements");
  let facultyAnnouncements = getData("facultyAnnouncements");
  let computedGrades = getData("computedGrades");

  let currentStudent = null;

  /* 
     GRADING CONFIGURATION
   */
  const GRADE_TERM_WEIGHTS = {
    prelim: 0.3,
    midterm: 0.3,
    final: 0.4,
  };

  const GRADE_CATEGORY_WEIGHTS = {
    quiz: 0.1,
    assignment: 0.1,
    project: 0.25,
    attendance: 0.1,
    recitation: 0.15,
    exam: 0.3,
  };

  const GRADE_CATEGORY_NAMES = {
    quiz: "Quizzes",
    assignment: "Assignments",
    project: "Projects",
    attendance: "Attendance",
    recitation: "Recitation",
    exam: "Major Exam",
  };

  const GRADE_PREFIXES = {
    quiz: "Q",
    assignment: "A",
    project: "P",
    recitation: "R",
    exam: "E",
  };

  const GRADE_CATEGORIES = [
    "quiz",
    "assignment",
    "project",
    "attendance",
    "recitation",
    "exam",
  ];

  const GRADE_TERMS = ["prelim", "midterm", "final"];

  const GRADE_TERM_NAMES = {
    prelim: "PRELIM",
    midterm: "MIDTERM",
    final: "FINAL",
  };

  /* 
     REFRESH DATA
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
    submissions = getData("submissions");
    announcements = getData("announcements");
    facultyAnnouncements = getData("facultyAnnouncements");
    computedGrades = getData("computedGrades");
  };

  /* 
     CURRENT STUDENT
   */

  const getCurrentStudent = () => {
    const loggedInUserId = localStorage.getItem("loggedInUserId");

    if (loggedInUserId) {
      const user = users.find(
        (item) => item.id === loggedInUserId && item.role === "student",
      );

      if (user) {
        return user;
      }
    }

    const loggedInUsername = localStorage.getItem("loggedInUsername");

    if (loggedInUsername) {
      const user = users.find(
        (item) => item.username === loggedInUsername && item.role === "student",
      );

      if (user) {
        return user;
      }
    }

    return users.find((item) => item.role === "student");
  };

  currentStudent = getCurrentStudent();

  if (!currentStudent) {
    window.location.href = "../index.html";

    return;
  }

  /* 
     LOOKUPS
   */

  const getUserName = (user) => {
    if (!user) {
      return "Unknown Student";
    }

    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    return fullName || user.username || "Unknown Student";
  };

  const getInitials = (user) => {
    if (!user) {
      return "ST";
    }

    return (
      `${user.firstName?.charAt(0) || ""}${
        user.lastName?.charAt(0) || ""
      }`.toUpperCase() || "ST"
    );
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

  const formatDateTime = (value) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  /* 
     STUDENT ENROLLMENTS / CLASSES
   */

  const getStudentEnrollments = () => {
    return enrollments.filter((item) => item.studentId === currentStudent.id);
  };

  const getStudentSections = () => {
    const sectionIds = [
      ...new Set(
        getStudentEnrollments()
          .map((item) => item.sectionId)
          .filter(Boolean),
      ),
    ];

    return sectionIds.map((id) => getSection(id)).filter(Boolean);
  };

  const getStudentSubjects = () => {
    const results = [];

    getStudentSections().forEach((section) => {
      sectionSubjects
        .filter((item) => item.sectionId === section.id)
        .forEach((relation) => {
          const subject = getSubject(relation.subjectId);

          if (!subject) {
            return;
          }

          results.push({
            section,
            subject,
            relation,
          });
        });
    });

    return results;
  };

  /* 
     PROFILE
   */

  const loadStudentProfile = () => {
    const studentName = document.getElementById("studentName");

    const studentCourse = document.getElementById("studentCourse");

    const studentAvatar = document.getElementById("studentAvatar");

    const welcomeName = document.getElementById("welcomeStudentName");

    const dashboardStudentName = document.getElementById(
      "dashboardStudentName",
    );

    const dashboardStudentCourse = document.getElementById(
      "dashboardStudentCourse",
    );

    const dashboardStudentYear = document.getElementById(
      "dashboardStudentYear",
    );

    const dashboardStudentSection = document.getElementById(
      "dashboardStudentSection",
    );

    if (studentName) {
      studentName.textContent = getUserName(currentStudent);
    }

    if (studentAvatar) {
      studentAvatar.textContent = getInitials(currentStudent);
    }

    if (welcomeName) {
      welcomeName.textContent = getUserName(currentStudent);
    }

    if (dashboardStudentName) {
      dashboardStudentName.textContent = getUserName(currentStudent);
    }

    const studentSections = getStudentSections();

    const firstSection = studentSections[0] || null;

    const course = currentStudent.courseId
      ? getCourse(currentStudent.courseId)
      : firstSection
        ? getCourse(firstSection.courseId)
        : null;

    const courseName = course?.name || course?.code || "Not assigned";

    if (studentCourse) {
      studentCourse.textContent = courseName;
    }

    if (dashboardStudentCourse) {
      dashboardStudentCourse.textContent = courseName;
    }

    if (dashboardStudentYear) {
      dashboardStudentYear.textContent =
        firstSection?.yearLevel || currentStudent.yearLevel || "Not assigned";
    }

    if (dashboardStudentSection) {
      dashboardStudentSection.textContent =
        firstSection?.name || currentStudent.section || "Not assigned";
    }
  };

  /* NAVIGATION */

  const navItems = document.querySelectorAll(".nav-item[data-section]");

  const pageSections = document.querySelectorAll(".page-section");

  const pageInfo = {
    dashboard: ["Student Dashboard", "Welcome to your student portal."],

    activities: ["Activities", "View and submit your academic activities."],

    grades: ["My Grades", "View your complete activity scores and grades."],

    attendance: ["Attendance", "View your attendance records."],

    schedule: ["My Schedule", "View your weekly class schedule."],

    announcements: ["Announcements", "View announcements from your faculty."],
  };

  const showSection = (sectionId) => {
    pageSections.forEach((section) => {
      section.classList.remove("active-section");
    });

    navItems.forEach((item) => {
      item.classList.remove("active");
    });

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

    if (sectionId === "activities") {
      refreshData();
      populateActivityFilters();
      renderStudentActivities();
    }

    if (sectionId === "grades") {
      refreshData();
      renderStudentGrades();
    }

    if (sectionId === "attendance") {
      refreshData();
      renderStudentAttendance();
    }

    if (sectionId === "schedule") {
      refreshData();
      renderStudentSchedule();
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

  document.querySelectorAll(".section-link[data-section]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      showSection(link.dataset.section);
    });
  });

  /* 
     GRADE DATA HELPERS
   */

  function getStudentActivityScore(activityId) {
    const record = activityScores.find(
      (item) =>
        item.activityId === activityId && item.studentId === currentStudent.id,
    );

    return record ? record.score : "";
  }

  function getGradeActivities(sectionId, subjectId, term, type) {
    return activities
      .filter(
        (activity) =>
          (activity.source === "grade-sheet"
            ? activity.sectionId === sectionId
            : !activity.sectionId || activity.sectionId === sectionId) &&
          activity.subjectId === subjectId &&
          activity.term === term &&
          activity.type === type &&
          !activity.isBlank,
      )
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
          new Date(a.createdAt || a.date || 0).getTime() -
          new Date(b.createdAt || b.date || 0).getTime()
        );
      });
  }

  function calculateStudentAttendance(sectionId, subjectId) {
    const records = attendance.filter(
      (record) =>
        record.studentId === currentStudent.id &&
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

    return (attended / records.length) * 100;
  }

  function calculateStudentCategory(sectionId, subjectId, term, type) {
    if (type === "attendance") {
      return calculateStudentAttendance(sectionId, subjectId);
    }

    const list = getGradeActivities(sectionId, subjectId, term, type);

    if (!list.length) {
      return 0;
    }

    let earned = 0;
    let possible = 0;

    list.forEach((activity) => {
      const score = getStudentActivityScore(activity.id);

      const total = Number(activity.totalItems);

      if (score === "" || score === null || score === undefined) {
        return;
      }

      if (!Number.isFinite(total) || total <= 0) {
        return;
      }

      earned += Number(score);

      possible += total;
    });

    if (possible <= 0) {
      return 0;
    }

    return Math.min(100, Math.max(0, (earned / possible) * 100));
  }

  function calculateStudentTermGrade(sectionId, subjectId, term) {
    let grade = 0;

    GRADE_CATEGORIES.forEach((type) => {
      const result = calculateStudentCategory(sectionId, subjectId, term, type);

      grade += result * GRADE_CATEGORY_WEIGHTS[type];
    });

    return grade;
  }

  function calculateStudentFinalGrade(sectionId, subjectId) {
    const prelim = calculateStudentTermGrade(sectionId, subjectId, "prelim");

    const midterm = calculateStudentTermGrade(sectionId, subjectId, "midterm");

    const final = calculateStudentTermGrade(sectionId, subjectId, "final");

    return (
      prelim * GRADE_TERM_WEIGHTS.prelim +
      midterm * GRADE_TERM_WEIGHTS.midterm +
      final * GRADE_TERM_WEIGHTS.final
    );
  }

  /* 
     STUDENT GRADE SHEET
   */

  function renderStudentTermHeader(sectionId, subjectId, term) {
    let columns = 0;

    GRADE_CATEGORIES.forEach((type) => {
      if (type === "attendance") {
        columns += 1;
        return;
      }

      const list = getGradeActivities(sectionId, subjectId, term, type);

      columns += list.length + 1;
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

  function renderStudentCategoryHeader(sectionId, subjectId, term, type) {
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
        colspan="${list.length + 1}"
      >

        ${GRADE_CATEGORY_NAMES[type]}

        <small>
          ${GRADE_CATEGORY_WEIGHTS[type] * 100}%
        </small>

      </th>
    `;
  }

  function renderStudentActivityHeaders(sectionId, subjectId, term, type) {
    if (type === "attendance") {
      return `
        <th
          class="grade-category-result-header"
          data-type="attendance"
        >
          RESULT
        </th>
      `;
    }

    const list = getGradeActivities(sectionId, subjectId, term, type);

    let html = "";

    list.forEach((activity) => {
      html += `
          <th
            class="grade-activity-header"
            data-type="${type}"
          >
            ${escapeHTML(activity.name)}
          </th>
        `;
    });

    html += `
      <th
        class="grade-category-result-header"
        data-type="${type}"
      >
        RESULT
      </th>
    `;

    return html;
  }

  function renderStudentTotalItems(sectionId, subjectId, term, type) {
    if (type === "attendance") {
      return `
        <th
          class="grade-total-row"
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
            ${Number(activity.totalItems) || "—"}
          </th>
        `;
    });

    html += `
      <th
        class="grade-total-row grade-total-result"
      >
        —
      </th>
    `;

    return html;
  }

  function renderStudentRow(subjectRecord) {
    const student = currentStudent;

    const sectionId = subjectRecord.section.id;

    const subjectId = subjectRecord.subject.id;

    let html = `
      <tr>

        <td
          class="grade-student-cell"
        >
          ${escapeHTML(getUserName(student))}
        </td>
    `;

    GRADE_TERMS.forEach((term) => {
      GRADE_CATEGORIES.forEach((type) => {
        if (type === "attendance") {
          const result = calculateStudentAttendance(sectionId, subjectId);

          html += `
                <td
                  class="grade-category-result"
                  data-type="attendance"
                >
                  ${result > 0 ? `${result.toFixed(2)}%` : "—"}
                </td>
              `;

          return;
        }

        const list = getGradeActivities(sectionId, subjectId, term, type);

        list.forEach((activity) => {
          const score = getStudentActivityScore(activity.id);

          const total = Number(activity.totalItems) || 0;

          html += `
                  <td
                    class="grade-score-display"
                    data-type="${type}"
                  >
                    ${
                      score !== "" && score !== null && score !== undefined
                        ? `${escapeHTML(score)}/${total}`
                        : "—"
                    }
                  </td>
                `;
        });

        const categoryResult = calculateStudentCategory(
          sectionId,
          subjectId,
          term,
          type,
        );

        html += `
              <td
                class="grade-category-result"
                data-type="${type}"
              >
                ${categoryResult > 0 ? `${categoryResult.toFixed(2)}%` : "—"}
              </td>
            `;
      });

      const termGrade = calculateStudentTermGrade(sectionId, subjectId, term);

      html += `
          <td
            class="grade-term"
          >
            ${termGrade > 0 ? termGrade.toFixed(2) : "—"}
          </td>
        `;
    });

    const finalGrade = calculateStudentFinalGrade(sectionId, subjectId);

    html += `
        <td
          class="grade-final"
        >
          ${finalGrade > 0 ? finalGrade.toFixed(2) : "—"}
        </td>

      </tr>
    `;

    return html;
  }

  function renderStudentGrades() {
    refreshData();

    const container = document.getElementById("studentGradesContainer");

    if (!container) {
      return;
    }

    const subjectRecords = getStudentSubjects();

    if (!subjectRecords.length) {
      container.innerHTML = `
        <div class="empty-message">
          No grades available.
        </div>
      `;

      return;
    }

    let html = `
      <div
        class="student-grade-table-scroll"
      >

        <table
          class="student-grade-table grade-sheet-table"
          id="studentGradeTable"
        >

          <thead>

            <tr>

              <th
                class="grade-student-header"
                rowspan="4"
              >
                STUDENT
              </th>
    `;

    GRADE_TERMS.forEach((term) => {
      const firstSubject = subjectRecords[0];

      html += renderStudentTermHeader(
        firstSubject.section.id,
        firstSubject.subject.id,
        term,
      );
    });

    html += `
              <th
                class="grade-final-header"
                rowspan="4"
              >
                FINAL GRADE
              </th>

            </tr>


            <tr>
    `;

    GRADE_TERMS.forEach((term) => {
      const firstSubject = subjectRecords[0];

      GRADE_CATEGORIES.forEach((type) => {
        html += renderStudentCategoryHeader(
          firstSubject.section.id,
          firstSubject.subject.id,
          term,
          type,
        );
      });

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


            <tr>
    `;

    /*
      Since activities can differ between
      subjects, we cannot make one universal
      multi-subject column structure.

      Therefore the student grade page is
      rendered as one grade sheet per subject.
    */

    html = `
      <div
        class="student-subject-grade-list"
      >
    `;

    subjectRecords.forEach((subjectRecord) => {
      html += `
          <div
            class="student-subject-grade-block"
          >

            <div
              class="student-subject-grade-title"
            >

              <h3>
                ${escapeHTML(subjectRecord.subject.name)}
              </h3>

              <p>
                ${escapeHTML(subjectRecord.subject.code || "")}

                ·

                ${escapeHTML(subjectRecord.section.yearLevel || "")}

                · Section

                ${escapeHTML(subjectRecord.section.name || "")}
              </p>

            </div>


            <div
              class="student-grade-table-scroll"
            >

              <table
                class="student-grade-table grade-sheet-table"
              >

                <thead>

                  <tr>

                    <th
                      class="grade-student-header"
                      rowspan="4"
                    >
                      STUDENT
                    </th>
        `;

      GRADE_TERMS.forEach((term) => {
        html += renderStudentTermHeader(
          subjectRecord.section.id,
          subjectRecord.subject.id,
          term,
        );
      });

      html += `
                    <th
                      class="grade-final-header"
                      rowspan="4"
                    >
                      FINAL GRADE
                    </th>

                  </tr>


                  <tr>
        `;

      GRADE_TERMS.forEach((term) => {
        GRADE_CATEGORIES.forEach((type) => {
          html += renderStudentCategoryHeader(
            subjectRecord.section.id,
            subjectRecord.subject.id,
            term,
            type,
          );
        });

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


                  <tr>
        `;

      GRADE_TERMS.forEach((term) => {
        GRADE_CATEGORIES.forEach((type) => {
          html += renderStudentActivityHeaders(
            subjectRecord.section.id,
            subjectRecord.subject.id,
            term,
            type,
          );
        });
      });

      html += `
                  </tr>


                  <tr
                    class="grade-total-row"
                  >
        `;

      GRADE_TERMS.forEach((term) => {
        GRADE_CATEGORIES.forEach((type) => {
          html += renderStudentTotalItems(
            subjectRecord.section.id,
            subjectRecord.subject.id,
            term,
            type,
          );
        });
      });

      html += `
                  </tr>

                </thead>


                <tbody>
        `;

      html += renderStudentRow(subjectRecord);

      html += `
                </tbody>

              </table>

            </div>

          </div>
        `;
    });

    html += `
      </div>
    `;

    container.innerHTML = html;
  }

  /* 
     ACTIVITY STATUS / SUBMISSIONS
   */

  const getSubmission = (activityId) => {
    return submissions.find(
      (submission) =>
        submission.activityId === activityId &&
        submission.studentId === currentStudent.id,
    );
  };

  const getActivityScore = (activityId) => {
    const score = activityScores.find(
      (item) =>
        item.activityId === activityId && item.studentId === currentStudent.id,
    );

    return score ? score.score : null;
  };

  const getActivityStatus = (activity) => {
    const submission = getSubmission(activity.id);

    if (submission) {
      const grade = getActivityScore(activity.id);

      if (grade !== null && grade !== undefined && grade !== "") {
        return "graded";
      }

      return "submitted";
    }

    return "pending";
  };

  const getStudentActivities = () => {
    const subjectRecords = getStudentSubjects();

    if (!subjectRecords.length) {
      return [];
    }

    const studentSubjectIds = new Set(
      subjectRecords.map((item) => item.subject.id),
    );

    return activities
      .filter(
        (activity) =>
          !activity.isBlank &&
          activity.source !== "grade-sheet" &&
          (activity.source === "activities" ||
            activity.source === undefined ||
            activity.source === null) &&
          studentSubjectIds.has(activity.subjectId),
      )
      .sort(
        (a, b) =>
          new Date(a.date || a.createdAt || 0) -
          new Date(b.date || b.createdAt || 0),
      );
  };

  const getActivityTypeName = (type) => {
    const names = {
      quiz: "Quiz",
      assignment: "Assignment",
      project: "Project",
      attendance: "Attendance",
      recitation: "Recitation",
      exam: "Major Exam",
    };

    return names[type] || type || "Activity";
  };

  /* 
     DASHBOARD COUNTS
   */

  const updateDashboardCounts = () => {
    const subjectCount = getStudentSubjects().length;

    const studentActivities = getStudentActivities();

    const pending = studentActivities.filter(
      (activity) => getActivityStatus(activity) === "pending",
    ).length;

    const upcomingDeadlines = studentActivities.filter((activity) => {
      if (!activity.date || getActivityStatus(activity) !== "pending") {
        return false;
      }

      const dueDate = new Date(activity.date);

      const now = new Date();

      const days = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      return days >= 0 && days <= 7;
    }).length;

    const studentSections = getStudentSections().map((section) => section.id);

    const studentSubjects = getStudentSubjects().map((item) => item.subject.id);

    const announcementsCount = [
      ...announcements.filter(
        (item) => item.audience === "all" || item.audience === "students",
      ),
      ...facultyAnnouncements.filter(
        (item) =>
          studentSections.includes(item.sectionId) &&
          studentSubjects.includes(item.subjectId),
      ),
    ].length;

    const subjectElement = document.getElementById("mySubjectsCount");

    const pendingElement = document.getElementById("pendingActivitiesCount");

    const upcomingElement = document.getElementById("upcomingDeadlinesCount");

    const announcementElement = document.getElementById(
      "studentAnnouncementsCount",
    );

    if (subjectElement) {
      subjectElement.textContent = subjectCount;
    }

    if (pendingElement) {
      pendingElement.textContent = pending;

      pendingElement.classList.toggle("has-pending", pending > 0);
    }

    if (upcomingElement) {
      upcomingElement.textContent = upcomingDeadlines;
    }

    if (announcementElement) {
      announcementElement.textContent = announcementsCount;
    }
  };

  /* 
     UPCOMING ACTIVITIES
   */

  const renderUpcomingActivities = () => {
    const container = document.getElementById("upcomingActivitiesList");
    refreshData();
    if (!container) {
      return;
    }

    const list = getStudentActivities()
      .filter((activity) => getActivityStatus(activity) === "pending")
      .slice(0, 5);

    if (!list.length) {
      container.innerHTML = `
          <div class="empty-message">
            No upcoming activities.
          </div>
        `;

      return;
    }

    container.innerHTML = list
      .map((activity) => {
        const subject = getSubject(activity.subjectId);

        return `
                <div
                  class="student-activity-item"
                >

                  <div
                    class="student-activity-info"
                  >

                    <span
                      class="student-activity-type"
                    >
                      ${escapeHTML(getActivityTypeName(activity.type))}
                    </span>


                    <span
                      class="student-activity-term"
                    >
                      ${escapeHTML(activity.term || "")}
                    </span>


                    <h3>
                      ${escapeHTML(activity.name)}
                    </h3>


                    <p>
                      ${escapeHTML(subject?.name || "")}
                    </p>


                    <div
                      class="student-activity-meta"
                    >

                      <span>
                        ${Number(activity.totalItems) || 0}
                        item(s)
                      </span>


                      ${
                        activity.date
                          ? `
                            <span>
                              Due:
                              ${escapeHTML(formatDate(activity.date))}
                            </span>
                          `
                          : ""
                      }

                    </div>

                  </div>


                  <button
                    type="button"
                    class="student-activity-action"
                    data-open-activity="${activity.id}"
                  >
                    Open
                  </button>

                </div>
              `;
      })
      .join("");
  };

  /* 
     TODAY'S SCHEDULE
   */

  const getTodayName = () =>
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
    });

  const getStudentSchedules = () => {
    const sectionIds = getStudentSections().map((section) => section.id);

    const subjectIds = getStudentSubjects().map((item) => item.subject.id);

    return schedules
      .filter(
        (schedule) =>
          sectionIds.includes(schedule.sectionId) &&
          subjectIds.includes(schedule.subjectId),
      )
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  };

  const renderTodaySchedule = () => {
    const container = document.getElementById("todayScheduleList");

    if (!container) {
      return;
    }

    const list = getStudentSchedules().filter(
      (schedule) => schedule.day === getTodayName(),
    );

    if (!list.length) {
      container.innerHTML = `
          <div class="empty-message">
            No classes scheduled today.
          </div>
        `;

      return;
    }

    container.innerHTML = list
      .map((schedule) => {
        const subject = getSubject(schedule.subjectId);

        const section = getSection(schedule.sectionId);

        return `
                <div
                  class="schedule-item"
                >

                  <div
                    class="schedule-info"
                  >

                    <h3>
                      ${escapeHTML(subject?.name || "Unknown Subject")}
                    </h3>

                    <p>
                      ${escapeHTML(section?.yearLevel || "")}
                      · Section
                      ${escapeHTML(section?.name || "")}
                    </p>

                  </div>


                  <div
                    class="schedule-time"
                  >

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

  /* 
     ACTIVITY FILTERS
   */

  const populateActivityFilters = () => {
    const subjectFilter = document.getElementById("activitySubjectFilter");

    if (!subjectFilter) {
      return;
    }

    const previous = subjectFilter.value;

    subjectFilter.innerHTML = `
        <option value="">
          All Subjects
        </option>

        ${getStudentSubjects()
          .map(
            (item) => `
              <option
                value="${item.subject.id}"
              >
                ${escapeHTML(item.subject.code || "")}
                -
                ${escapeHTML(item.subject.name || "")}
              </option>
            `,
          )
          .join("")}
      `;

    if (
      previous &&
      Array.from(subjectFilter.options).some(
        (option) => option.value === previous,
      )
    ) {
      subjectFilter.value = previous;
    }
  };

  const renderStudentActivities = () => {
    refreshData();
    const container = document.getElementById("studentActivityList");

    if (!container) {
      return;
    }

    const subjectFilter = document.getElementById("activitySubjectFilter");

    const statusFilter = document.getElementById("activityStatusFilter");

    let list = getStudentActivities();

    if (subjectFilter?.value) {
      const subjectId = subjectFilter.value;

      list = list.filter((activity) => activity.subjectId === subjectId);
    }

    if (statusFilter?.value) {
      list = list.filter(
        (activity) => getActivityStatus(activity) === statusFilter.value,
      );
    }

    if (!list.length) {
      container.innerHTML = `
          <div class="empty-message">
            No activities available.
          </div>
        `;

      return;
    }

    container.innerHTML = list
      .map((activity) => {
        const status = getActivityStatus(activity);

        const score = getActivityScore(activity.id);

        const submission = getSubmission(activity.id);

        const subject = getSubject(activity.subjectId);

        const statusText =
          status === "pending"
            ? "Pending"
            : status === "submitted"
              ? "Submitted"
              : "Graded";

        return `
                <div
                  class="student-activity-item"
                >

                  <div
                    class="student-activity-info"
                  >

                    <span
                      class="student-activity-type"
                    >
                      ${escapeHTML(getActivityTypeName(activity.type))}
                    </span>


                    <span
                      class="student-activity-term"
                    >
                      ${escapeHTML(activity.term || "")}
                    </span>


                    <h3>
                      ${escapeHTML(activity.name)}
                    </h3>


                    <p>
                    ${escapeHTML(subject?.name || "")}
                    </p>

${
  activity.description
    ? `
      <div class="student-activity-description">
        ${escapeHTML(activity.description)}
      </div>
    `
    : ""
}


                    <div
                      class="student-activity-meta"
                    >

                      <span>
                        ${Number(activity.totalItems) || 0}
                        item(s)
                      </span>


                      ${
                        activity.date
                          ? `
                            <span>
                              Due:
                              ${escapeHTML(formatDate(activity.date))}
                            </span>
                          `
                          : ""
                      }


                      ${
                        submission
                          ? `
                            <span>
                              Submitted:
                              ${escapeHTML(
                                formatDateTime(submission.submittedAt),
                              )}
                            </span>
                          `
                          : ""
                      }

                    </div>

                  </div>


                  <div
                    style="
                      display:flex;
                      align-items:center;
                      gap:10px;
                    "
                  >

                    ${
                      status === "graded"
                        ? `
                          <strong
                            style="
                              color:#3f5147;
                              font-size:12px;
                            "
                          >
                            ${escapeHTML(score)}/${
                              Number(activity.totalItems) || 0
                            }
                          </strong>
                        `
                        : ""
                    }


                    <span
                      class="student-activity-status ${status}"
                    >
                      ${statusText}
                    </span>


                    <button
                      type="button"
                      class="student-activity-action"
                      data-open-activity="${activity.id}"
                    >
                      ${status === "pending" ? "Submit" : "View"}
                    </button>

                  </div>

                </div>
              `;
      })
      .join("");
  };

  /* 
     SUBMISSION MODAL
   */

  const openActivity = (activityId) => {
    const activity = activities.find((item) => item.id === activityId);

    if (!activity) {
      return;
    }

    const status = getActivityStatus(activity);

    let modal = document.getElementById("studentActivityModal");

    if (modal) {
      modal.remove();
    }

    const submission = getSubmission(activity.id);

    const score = getActivityScore(activity.id);

    const subject = getSubject(activity.subjectId);

    modal = document.createElement("div");

    modal.id = "studentActivityModal";

    modal.style.cssText = `
        position:fixed;
        inset:0;
        z-index:5000;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        background:rgba(44,57,48,0.45);
      `;

    modal.innerHTML = `
        <div
          style="
            width:min(520px,100%);
            background:#ffffff;
            border-radius:14px;
            padding:25px;
            box-shadow:0 15px 45px rgba(0,0,0,0.15);
          "
        >

          <div
            style="
              display:flex;
              justify-content:space-between;
              align-items:flex-start;
              gap:15px;
              margin-bottom:20px;
            "
          >

            <div>

              <span
                style="
                  font-size:10px;
                  font-weight:600;
                  color:#a27b5c;
                  text-transform:uppercase;
                "
              >
                ${escapeHTML(getActivityTypeName(activity.type))}
              </span>

              <h2
                style="
                  margin-top:5px;
                  color:#2c3930;
                  font-size:20px;
                "
              >
                ${escapeHTML(activity.name)}
              </h2>

              <p
                style="
                  margin-top:4px;
                  color:#68716b;
                  font-size:12px;
                "
              >
                ${escapeHTML(subject?.name || "")}
              </p>

            </div>


            <button
              type="button"
              id="closeStudentActivityModal"
              style="
                border:none;
                background:#f1f0ea;
                color:#3f4f44;
                width:32px;
                height:32px;
                border-radius:50%;
                cursor:pointer;
                font-size:16px;
              "
            >
              ×
            </button>

          </div>


          ${
            status === "pending"
              ? `
                <form
                  id="studentActivitySubmissionForm"
                >

                  <label
                    for="studentActivityFile"
                    style="
                      display:block;
                      margin-bottom:7px;
                      color:#3f4f44;
                      font-size:12px;
                      font-weight:600;
                    "
                  >
                    Upload Activity
                  </label>

                  <input
                    type="file"
                    id="studentActivityFile"
                    required
                    style="
                      width:100%;
                      padding:10px;
                      border:1px solid #cfcac0;
                      border-radius:8px;
                      font-size:12px;
                    "
                  >

                  <label
                    for="studentActivityComment"
                    style="
                      display:block;
                      margin-top:15px;
                      margin-bottom:7px;
                      color:#3f4f44;
                      font-size:12px;
                      font-weight:600;
                    "
                  >
                    Comment
                  </label>

                  <textarea
                    id="studentActivityComment"
                    rows="4"
                    placeholder="Optional message for your instructor..."
                    style="
                      width:100%;
                      padding:10px;
                      border:1px solid #cfcac0;
                      border-radius:8px;
                      resize:vertical;
                      font-family:inherit;
                      font-size:12px;
                    "
                  ></textarea>

                  <button
                    type="submit"
                    style="
                      width:100%;
                      margin-top:15px;
                      padding:11px;
                      border:none;
                      border-radius:8px;
                      background:#a27b5c;
                      color:#ffffff;
                      font-size:12px;
                      font-weight:600;
                    "
                  >
                    Submit Activity
                  </button>

                </form>
              `
              : status === "submitted"
                ? `
                  <div
                    style="
                      padding:15px;
                      background:#e7edf3;
                      border-radius:10px;
                      color:#46617a;
                      font-size:12px;
                    "
                  >

                    <strong>
                      Submission received.
                    </strong>

                    <p
                      style="
                        margin-top:6px;
                      "
                    >
                      Submitted:
                      ${escapeHTML(formatDateTime(submission?.submittedAt))}
                    </p>

                    ${
                      submission?.fileName
                        ? `
                          <p
                            style="
                              margin-top:6px;
                            "
                          >
                            File:
                            ${escapeHTML(submission.fileName)}
                          </p>
                        `
                        : ""
                    }

                  </div>
                `
                : `
                  <div
                    style="
                      padding:18px;
                      text-align:center;
                      background:#e7eee8;
                      border-radius:10px;
                    "
                  >

                    <span
                      style="
                        color:#55745c;
                        font-size:11px;
                      "
                    >
                      Grade
                    </span>

                    <strong
                      style="
                        display:block;
                        margin-top:5px;
                        color:#2c3930;
                        font-size:30px;
                      "
                    >
                      ${escapeHTML(score)}/${Number(activity.totalItems) || 0}
                    </strong>

                  </div>
                `
          }

        </div>
      `;

    document.body.appendChild(modal);

    document
      .getElementById("closeStudentActivityModal")
      ?.addEventListener("click", () => {
        modal.remove();
      });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.remove();
      }
    });

    document
      .getElementById("studentActivitySubmissionForm")
      ?.addEventListener("submit", (event) => {
        event.preventDefault();

        const fileInput = document.getElementById("studentActivityFile");

        const commentInput = document.getElementById("studentActivityComment");

        const file = fileInput?.files?.[0];

        if (!file) {
          alert("Please select a file.");

          return;
        }

        const existingIndex = submissions.findIndex(
          (item) =>
            item.activityId === activity.id &&
            item.studentId === currentStudent.id,
        );

        const reader = new FileReader();

        reader.onload = () => {
          const submissionData = {
            id: existingIndex >= 0 ? submissions[existingIndex].id : createId(),

            activityId: activity.id,

            studentId: currentStudent.id,

            sectionId:
              getStudentSubjects().find(
                (item) => item.subject.id === activity.subjectId,
              )?.section.id || null,

            subjectId: activity.subjectId,

            fileName: file.name,

            fileType: file.type,

            fileSize: file.size,

            fileData: reader.result,

            comment: commentInput?.value.trim() || "",

            submittedAt: new Date().toISOString(),

            status: "submitted",
          };

          if (existingIndex >= 0) {
            submissions[existingIndex] = submissionData;
          } else {
            submissions.push(submissionData);
          }

          saveData("submissions", submissions);

          refreshData();

          modal.remove();

          renderStudentActivities();

          renderUpcomingActivities();

          updateDashboardCounts();

          alert("Activity submitted successfully.");
        };

        reader.onerror = () => {
          alert("Unable to read the selected file.");
        };

        reader.readAsDataURL(file);
      });
  };

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open-activity]");

    if (!button) {
      return;
    }

    openActivity(button.dataset.openActivity);
  });

  document
    .getElementById("activitySubjectFilter")
    ?.addEventListener("change", renderStudentActivities);

  document
    .getElementById("activityStatusFilter")
    ?.addEventListener("change", renderStudentActivities);

  /* 
     ATTENDANCE
   */

  const renderStudentAttendance = () => {
    const container = document.getElementById("studentAttendanceList");

    if (!container) {
      return;
    }

    const subjectRecords = getStudentSubjects();

    if (!subjectRecords.length) {
      container.innerHTML = `
          <div class="empty-message">
            No attendance records available.
          </div>
        `;

      return;
    }

    container.innerHTML = subjectRecords
      .map((item) => {
        const percentage = calculateStudentAttendance(
          item.section.id,
          item.subject.id,
        );

        return `
                <div
                  class="attendance-item"
                >

                  <div
                    class="attendance-subject"
                  >

                    <h3>
                      ${escapeHTML(item.subject.name)}
                    </h3>

                    <p>
                      ${escapeHTML(item.subject.code || "")}
                      ·
                      ${escapeHTML(item.section.yearLevel || "")}
                      · Section
                      ${escapeHTML(item.section.name || "")}
                    </p>

                  </div>

                  <div
                    class="attendance-percentage"
                  >
                    ${percentage.toFixed(1)}%
                  </div>

                </div>
              `;
      })
      .join("");
  };

  /* 
     ANNOUNCEMENTS
   */

  const getStudentAnnouncements = () => {
    const latestAnnouncements = getData("announcements");

    const studentSections = getStudentSections().map((section) => section.id);

    const studentSubjects = getStudentSubjects().map((item) => item.subject.id);

    const systemAnnouncements = latestAnnouncements.filter(
      (item) => item.audience === "all" || item.audience === "students",
    );

    const classAnnouncements = facultyAnnouncements.filter(
      (item) =>
        studentSections.includes(item.sectionId) &&
        studentSubjects.includes(item.subjectId),
    );

    return [...systemAnnouncements, ...classAnnouncements].sort(
      (a, b) =>
        new Date(b.createdAt || b.date || 0) -
        new Date(a.createdAt || a.date || 0),
    );
  };

  const renderStudentAnnouncements = () => {
    const container = document.getElementById("studentAnnouncementList");

    if (!container) {
      return;
    }

    const list = getStudentAnnouncements().slice(0, 20);

    if (!list.length) {
      container.innerHTML = `
          <div class="empty-message">
            No announcements available.
          </div>
        `;

      return;
    }

    container.innerHTML = list
      .map(
        (item) => `
              <div
                class="announcement-item"
              >

                <div>

                  <h3>
                    ${escapeHTML(item.title || "Announcement")}
                  </h3>

                  <p>
                    ${escapeHTML(item.message || "")}
                  </p>

                </div>

                <span
                  class="announcement-date"
                >
                  ${escapeHTML(formatDate(item.createdAt || item.date))}
                </span>

              </div>
            `,
      )
      .join("");
  };

  const renderRecentAnnouncements = () => {
    const container = document.getElementById("recentAnnouncementsList");

    if (!container) {
      return;
    }

    const list = getStudentAnnouncements().slice(0, 4);

    if (!list.length) {
      container.innerHTML = `
          <div class="empty-message">
            No announcements yet.
          </div>
        `;

      return;
    }

    container.innerHTML = list
      .map(
        (item) => `
              <div
                class="announcement-item"
              >

                <div>

                  <h3>
                    ${escapeHTML(item.title || "Announcement")}
                  </h3>

                  <p>
                    ${escapeHTML(item.message || "")}
                  </p>

                </div>

                <span
                  class="announcement-date"
                >
                  ${escapeHTML(formatDate(item.createdAt || item.date))}
                </span>

              </div>
            `,
      )
      .join("");
  };

  /* 
     SCHEDULE
   */

  const renderStudentSchedule = () => {
    const container = document.getElementById("studentScheduleList");

    if (!container) {
      return;
    }

    const sectionIds = getStudentSections().map((section) => section.id);

    const subjectIds = getStudentSubjects().map((item) => item.subject.id);

    const list = schedules
      .filter(
        (schedule) =>
          sectionIds.includes(schedule.sectionId) &&
          subjectIds.includes(schedule.subjectId),
      )
      .sort(
        (a, b) =>
          (a.day || "").localeCompare(b.day || "") ||
          (a.startTime || "").localeCompare(b.startTime || ""),
      );

    if (!list.length) {
      container.innerHTML = `
          <div class="empty-message">
            No schedule available.
          </div>
        `;

      return;
    }

    container.innerHTML = list
      .map((schedule) => {
        const subject = getSubject(schedule.subjectId);

        const section = getSection(schedule.sectionId);

        return `
                <div
                  class="schedule-item"
                >

                  <div
                    class="schedule-info"
                  >

                    <h3>
                      ${escapeHTML(subject?.name || "Unknown Subject")}
                    </h3>

                    <p>
                      ${escapeHTML(schedule.day || "")}
                      ·
                      ${escapeHTML(section?.yearLevel || "")}
                      · Section
                      ${escapeHTML(section?.name || "")}
                    </p>

                  </div>


                  <div
                    class="schedule-time"
                  >

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

  /* 
     CLICKABLE DASHBOARD CARDS
   */

  document.querySelectorAll("[data-card-section]").forEach((card) => {
    card.addEventListener("click", () => {
      const section = card.dataset.cardSection;

      const filter = card.dataset.cardFilter;

      if (section === "activities") {
        populateActivityFilters();

        const statusFilter = document.getElementById("activityStatusFilter");

        if (statusFilter) {
          if (filter === "pending") {
            statusFilter.value = "pending";
          } else {
            statusFilter.value = "";
          }
        }

        renderStudentActivities();
      }

      showSection(section);
    });
  });

  /* 
     LOGOUT
   */

  document
    .getElementById("logoutButton")
    ?.addEventListener("click", (event) => {
      event.preventDefault();

      const confirmed = confirm("Are you sure you want to logout?");

      if (!confirmed) {
        return;
      }

      localStorage.removeItem("loggedInUserId");

      localStorage.removeItem("loggedInUsername");

      window.location.href = "../index.html";
    });

  /* 
     INITIALIZATION
   */

  const initialize = () => {
    refreshData();

    currentStudent = getCurrentStudent();

    if (!currentStudent) {
      window.location.href = "../index.html";

      return;
    }

    loadStudentProfile();

    populateActivityFilters();

    renderUpcomingActivities();

    renderTodaySchedule();

    renderStudentActivities();

    renderStudentGrades();

    renderStudentAttendance();

    renderStudentSchedule();

    renderStudentAnnouncements();

    renderRecentAnnouncements();

    updateDashboardCounts();
  };

  initialize();
});
