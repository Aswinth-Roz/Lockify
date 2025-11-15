// ==========================
// 🔐 LOCKIFY FRONTEND APP.JS (CLEAN FINAL VERSION)
// ==========================

// Automatically detect backend for local & LAN usage
const API_BASE = `http://${location.hostname}:5000/api`;
const secretKey = "lockify-key";

// ===== TOKEN HANDLERS =====
function saveToken(token) {
  localStorage.setItem("lockify_token", token);
}

function getToken() {
  return localStorage.getItem("lockify_token");
}

// Clean up old user data if not logged in
if (!getToken()) {
  localStorage.removeItem("lockify_user");
}

// ===== ENCRYPTION HELPERS =====
function encrypt(content) {
  return CryptoJS.AES.encrypt(content, secretKey).toString();
}

function decrypt(encrypted) {
  const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// ===== MODAL HANDLERS =====
function showResultModal(type, title, message) {
  const modal = document.getElementById("resultModal");
  const heading = document.getElementById("resultModalTitle");
  const msg = document.getElementById("resultModalMsg");

  if (!modal) return alert(`${title}\n${message}`);
  heading.textContent = title;
  msg.textContent = message;
  modal.classList.remove("hidden");
}

function closeResultModal() {
  document.getElementById("resultModal")?.classList.add("hidden");
}

// ===== AUTH SYSTEM =====
async function signup(fullName, email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });

    const data = await res.json();
    if (res.ok)
      showResultModal("success", "Signup Successful!", "You can now log in.");
    else
      showResultModal("denied", "Signup Failed", data.error || "Try again.");
  } catch {
    showResultModal("denied", "Error", "Network issue during signup.");
  }
}

async function login(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.token) {
      saveToken(data.token);
      localStorage.setItem("lockify_user", data.user.fullName);

      document.getElementById("loginModal")?.classList.add("hidden");
      showResultModal("success", "Access Granted!", "Welcome back!");
      updateUI();
      getNotes();

      // Smooth scroll to Notes section
      setTimeout(() => {
        document.querySelector("#notesSection")?.scrollIntoView({
          behavior: "smooth",
        });
      }, 700);
    } else {
      showResultModal(
        "denied",
        "Access Denied",
        data.error || "Invalid credentials."
      );
    }
  } catch {
    showResultModal("denied", "Error", "Network connection failed.");
  }
}

// ===== NOTES SYSTEM =====
async function createNote(title, content) {
  const token = getToken();
  if (!token)
    return showResultModal("denied", "Not Logged In", "Please log in first.");

  const encrypted = encrypt(content);

  const res = await fetch(`${API_BASE}/notes/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ title, content: encrypted }),
  });

  const data = await res.json();
  if (res.ok) {
    showResultModal("success", "Note Saved!", "Encrypted & stored securely.");
    getNotes();
  } else {
    showResultModal("denied", "Failed", data.error || "Couldn't save note.");
  }
}

async function getNotes() {
  const token = getToken();
  if (!token) return;

  const res = await fetch(`${API_BASE}/notes/get`, {
    headers: { Authorization: "Bearer " + token },
  });

  const notes = await res.json();
  const display = document.getElementById("notesDisplay");
  if (!display) return;

  display.innerHTML = "";

  if (!notes.length) {
    display.innerHTML =
      '<p class="text-gray-400 italic text-center mt-4">No notes yet. Create your first encrypted note!</p>';
    return;
  }

  notes.forEach((note) => {
    const decrypted = decrypt(note.content);
    const div = document.createElement("div");
    div.className =
      "note-card p-5 my-3 border rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300";
    div.innerHTML = `
      <h3 class="text-lg font-bold mb-2">${note.title}</h3>
      <p class="text-gray-600 text-sm mb-3">${decrypted}</p>
      <span class="text-xs text-gray-400 block mb-3">Last updated: ${new Date(
        note.updatedAt
      ).toLocaleString()}</span>
      <button onclick="deleteNote('${note._id}', this)"
        class="text-red-600 hover:text-white hover:bg-red-500 border border-red-500 px-3 py-1 rounded-md text-xs transition">
        🗑 Delete
      </button>
    `;
    display.appendChild(div);
  });
}

async function deleteNote(id, btn) {
  const token = getToken();
  if (!token)
    return showResultModal("denied", "Not Logged In", "Please log in first.");

  const card = btn.closest(".note-card");
  card.style.opacity = "0.4";

  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });

  if (res.ok) {
    setTimeout(() => card.remove(), 300);
    showResultModal("success", "Note Deleted", "Note removed successfully.");
  } else {
    card.style.opacity = "1";
    showResultModal("denied", "Delete Failed", "Couldn't delete note.");
  }
}

// ===== UI MANAGEMENT =====
function updateUI() {
  const token = getToken();
  const user = localStorage.getItem("lockify_user");

  document.getElementById("logoutBtn")?.classList.toggle("hidden", !token);
  document.getElementById("loginBtn")?.classList.toggle("hidden", !!token);
  document.getElementById("signupBtn")?.classList.toggle("hidden", !!token);

  if (user && document.getElementById("userDisplay")) {
    document.getElementById("userDisplay").textContent = user;
  }
}

// ===== EVENT HANDLERS =====

// Logout
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("lockify_token");
  localStorage.removeItem("lockify_user");
  updateUI();
  location.reload();
});

// Save note
document.getElementById("noteForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("noteTitle").value.trim();
  const content = document.getElementById("noteContent").value.trim();

  if (!title || !content)
    return showResultModal(
      "denied",
      "Missing Fields",
      "Please fill out both fields."
    );

  createNote(title, content);
  document.getElementById("noteTitle").value = "";
  document.getElementById("noteContent").value = "";
});

// ===== INITIALIZE ON LOAD =====
document.addEventListener("DOMContentLoaded", () => {
  updateUI();
  if (getToken()) getNotes();
});
