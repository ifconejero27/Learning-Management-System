/* Restore Existing Session */

const loggedInUserId = localStorage.getItem("loggedInUserId");

if (loggedInUserId) {
  const users = JSON.parse(localStorage.getItem("users")) || [];

  const loggedInUser = users.find((user) => user.id === loggedInUserId);

  if (loggedInUser) {
    switch (loggedInUser.role) {
      case "admin":
        window.location.href = "01-html/admin-dashboard.html";
        break;

      case "faculty":
        window.location.href = "01-html/faculty-dashboard.html";
        break;

      case "student":
        window.location.href = "01-html/student-dashboard.html";
        break;
    }
  } else {
    localStorage.removeItem("loggedInUserId");
    localStorage.removeItem("loggedInUsername");
  }
}

/* Demo Accounts and Data */

const DEFAULT_IDS = {
  cssDepartment: "dept-css",
  bsitCourse: "course-bsit",
  bsitSectionA: "section-bsit-y1-a",

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

/* Departments */

let departments = JSON.parse(localStorage.getItem("departments")) || [];

let cssDepartment = departments.find(
  (department) =>
    department.id === DEFAULT_IDS.cssDepartment ||
    String(department.code || "").toLowerCase() === "ccs" ||
    String(department.name || "").toLowerCase() ===
      "college of computer studies",
);

if (!cssDepartment) {
  cssDepartment = {
    id: DEFAULT_IDS.cssDepartment,
    name: "College of Computer Studies",
    code: "CCS",
  };

  departments.push(cssDepartment);
}

/* Courses */

let courses = JSON.parse(localStorage.getItem("courses")) || [];

let bsitCourse = courses.find(
  (course) =>
    course.id === DEFAULT_IDS.bsitCourse ||
    String(course.code || "").toLowerCase() === "bsit",
);

if (!bsitCourse) {
  bsitCourse = {
    id: DEFAULT_IDS.bsitCourse,
    name: "Bachelor of Science in Information Technology",
    code: "BSIT",
    departmentId: cssDepartment.id,
  };

  courses.push(bsitCourse);
} else {
  bsitCourse.departmentId = cssDepartment.id;
}

/* Section */

let sections = JSON.parse(localStorage.getItem("sections")) || [];

let bsitSectionA = sections.find(
  (section) =>
    section.id === DEFAULT_IDS.bsitSectionA ||
    (section.courseId === bsitCourse.id &&
      String(section.yearLevel || "").toLowerCase() === "1st year" &&
      String(section.name || "").toLowerCase() === "a"),
);

if (!bsitSectionA) {
  bsitSectionA = {
    id: DEFAULT_IDS.bsitSectionA,
    courseId: bsitCourse.id,
    yearLevel: "1st Year",
    name: "A",
  };

  sections.push(bsitSectionA);
}

/* Subjects */

let subjects = JSON.parse(localStorage.getItem("subjects")) || [];

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
  const exists = subjects.some(
    (subject) =>
      subject.id === defaultSubject.id ||
      String(subject.code || "").toLowerCase() ===
        defaultSubject.code.toLowerCase(),
  );

  if (!exists) {
    subjects.push(defaultSubject);
  }
});

/* Section Subjects */

let sectionSubjects = JSON.parse(localStorage.getItem("sectionSubjects")) || [];

defaultSubjects.forEach((defaultSubject) => {
  const subject = subjects.find(
    (item) =>
      item.id === defaultSubject.id ||
      String(item.code || "").toLowerCase() ===
        defaultSubject.code.toLowerCase(),
  );

  if (!subject) {
    return;
  }

  const exists = sectionSubjects.some(
    (assignment) =>
      assignment.sectionId === bsitSectionA.id &&
      assignment.subjectId === subject.id,
  );

  if (!exists) {
    sectionSubjects.push({
      id: `section-subject-${subject.id}`,
      sectionId: bsitSectionA.id,
      subjectId: subject.id,
    });
  }
});

/* Users */

let users = JSON.parse(localStorage.getItem("users")) || [];

const demoAccounts = [
  // Students
  {
    id: DEFAULT_IDS.student01,
    username: "student01",
    password: "student123",
    firstName: "Student",
    lastName: "One",
    role: "student",
    courseId: bsitCourse.id,
    yearLevel: "1st Year",
    section: "A",
  },
  {
    id: DEFAULT_IDS.student02,
    username: "student02",
    password: "student123",
    firstName: "Student",
    lastName: "Two",
    role: "student",
    courseId: bsitCourse.id,
    yearLevel: "1st Year",
    section: "A",
  },
  {
    id: DEFAULT_IDS.student03,
    username: "student03",
    password: "student123",
    firstName: "Student",
    lastName: "Three",
    role: "student",
    courseId: bsitCourse.id,
    yearLevel: "1st Year",
    section: "A",
  },
  {
    id: DEFAULT_IDS.student04,
    username: "student04",
    password: "student123",
    firstName: "Student",
    lastName: "Four",
    role: "student",
    courseId: bsitCourse.id,
    yearLevel: "1st Year",
    section: "A",
  },
  {
    id: DEFAULT_IDS.student05,
    username: "student05",
    password: "student123",
    firstName: "Student",
    lastName: "Five",
    role: "student",
    courseId: bsitCourse.id,
    yearLevel: "1st Year",
    section: "A",
  },

  // Faculty
  {
    id: DEFAULT_IDS.faculty01,
    username: "faculty01",
    password: "faculty123",
    firstName: "Faculty",
    lastName: "One",
    role: "faculty",
    departmentId: cssDepartment.id,
  },
  {
    id: DEFAULT_IDS.faculty02,
    username: "faculty02",
    password: "faculty123",
    firstName: "Faculty",
    lastName: "Two",
    role: "faculty",
    departmentId: cssDepartment.id,
  },
  {
    id: DEFAULT_IDS.faculty03,
    username: "faculty03",
    password: "faculty123",
    firstName: "Faculty",
    lastName: "Three",
    role: "faculty",
    departmentId: cssDepartment.id,
  },

  // Admin
  {
    id: DEFAULT_IDS.admin,
    username: "admin",
    password: "admin123",
    firstName: "System",
    lastName: "Administrator",
    role: "admin",
  },
];

demoAccounts.forEach((account) => {
  const existingIndex = users.findIndex(
    (user) => user.id === account.id || user.username === account.username,
  );

  if (existingIndex === -1) {
    users.push(account);
  }
});

/* Enrollments */

let enrollments = JSON.parse(localStorage.getItem("enrollments")) || [];

const defaultStudents = demoAccounts.filter(
  (account) => account.role === "student",
);

defaultStudents.forEach((student, index) => {
  const exists = enrollments.some(
    (enrollment) =>
      enrollment.studentId === student.id &&
      enrollment.sectionId === bsitSectionA.id,
  );

  if (!exists) {
    enrollments.push({
      id: `enrollment-default-${index + 1}`,
      studentId: student.id,
      sectionId: bsitSectionA.id,
    });
  }
});

/* Schedules */

let schedules = JSON.parse(localStorage.getItem("schedules")) || [];

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

/* Save Default Data */

localStorage.setItem("users", JSON.stringify(users));
localStorage.setItem("departments", JSON.stringify(departments));
localStorage.setItem("courses", JSON.stringify(courses));
localStorage.setItem("sections", JSON.stringify(sections));
localStorage.setItem("subjects", JSON.stringify(subjects));
localStorage.setItem("sectionSubjects", JSON.stringify(sectionSubjects));
localStorage.setItem("enrollments", JSON.stringify(enrollments));
localStorage.setItem("schedules", JSON.stringify(schedules));

/* Login */

document.getElementById("loginForm")?.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();

  const password = document.getElementById("password").value;

  const user = users.find(
    (account) => account.username === username && account.password === password,
  );

  if (!user) {
    alert("Invalid username or password.");
    return;
  }

  localStorage.setItem("loggedInUserId", user.id);
  localStorage.setItem("loggedInUsername", user.username);

  switch (user.role) {
    case "admin":
      window.location.href = "01-html/admin-dashboard.html";
      break;

    case "faculty":
      window.location.href = "01-html/faculty-dashboard.html";
      break;

    case "student":
      window.location.href = "01-html/student-dashboard.html";
      break;

    default:
      alert("Invalid account role.");
  }
});
