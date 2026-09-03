const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", registerUser);

function registerUser(e) {
  e.preventDefault();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const role = document.getElementById("role").value;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !username ||
    !password ||
    !confirmPassword ||
    !role
  ) {
    alert("Please complete all fields.");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];

  const usernameExists = users.some((user) => user.username === username);

  if (usernameExists) {
    alert("Username already exists.");
    return;
  }

  const emailExists = users.some((user) => user.email === email);

  if (emailExists) {
    alert("Email already exists.");
    return;
  }

  const newUser = {
    id: crypto.randomUUID(),
    firstName,
    lastName,
    email,
    username,
    password,
    role,
  };

  users.push(newUser);

  localStorage.setItem("users", JSON.stringify(users));

  alert("Registration successful!");

  window.location.href = "../index.html";
}
