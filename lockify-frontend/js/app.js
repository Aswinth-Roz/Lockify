// ==========================
// 🔐 LOCKIFY FRONTEND APP.JS
// ==========================

const API_BASE = 'http://127.0.0.1:5000/api';
const secretKey = 'lockify-key';

// ===== TOKEN HANDLERS =====

// Store JWT securely
function saveToken(token) {
  localStorage.setItem('lockify_token', token);
}

// Get JWT from localStorage
function getToken() {
  return localStorage.getItem('lockify_token');
}

// ===== ENCRYPTION HELPERS =====

// Encrypt note content using AES
function encrypt(content) {
  return CryptoJS.AES.encrypt(content, secretKey).toString();
}

// Decrypt AES-encrypted text
function decrypt(encrypted) {
  const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// ===== MODAL FEEDBACK =====

// Show result modal
function showResultModal(type, title, message) {
  const modal = document.getElementById("resultModal");
  const heading = document.getElementById("resultModalTitle");
  const msg = document.getElementById("resultModalMsg");

  if (!modal) return alert(`${title}\n${message}`); // fallback

  heading.textContent = title;
  msg.textContent = message;

  modal.classList.remove("hidden");
}

// Close modal
function closeResultModal() {
  const modal = document.getElementById("resultModal");
  if (modal) modal.classList.add("hidden");
}

// ===== AUTH SYSTEM =====

// Signup
async function signup(fullName, email, password) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, email, password }),
  });

  const data = await res.json();

  if (res.ok) {
    showResultModal("success", "Signup Successful!", "Your account has been created. You can now log in.");
  } else {
    showResultModal("denied", "Signup Failed", data.error || "Please try again.");
  }
}

// Login
async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

    // Scroll + Glow
    setTimeout(() => {
      document.querySelector("#notesSection")?.scrollIntoView({ behavior: "smooth" });
      const section = document.querySelector("#notesSection");
      section?.classList.add("ring-2", "ring-yellow-500", "rounded-lg", "transition");
      setTimeout(() => section?.classList.remove("ring-2", "ring-yellow-500"), 1400);
    }, 700);
  } else {
    showResultModal("denied", "Access Denied", data.error || "Invalid credentials.");
  }
}

// ===== NOTES SYSTEM =====

// Create new note
async function createNote(title, content) {
  const token = getToken();
  if (!token) return showResultModal("denied", "Not Logged In", "Please log in first.");

  const encrypted = encrypt(content);

  const res = await fetch(`${API_BASE}/notes/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ title, content: encrypted }),
  });

  const data = await res.json();

  if (res.ok) {
    showResultModal("success", "Note Saved!", "Your note is securely encrypted and stored.");
    getNotes();
  } else {
    showResultModal("denied", "Failed", data.message || "Couldn't save note.");
  }
}

// Fetch all notes for logged-in user
async function getNotes() {
  const token = getToken();
  if (!token) return;

  const res = await fetch(`${API_BASE}/notes/get`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });

  const notes = await res.json();
  const display = document.getElementById('notesDisplay');
  if (!display) return;

  display.innerHTML = '';

  if (!notes.length) {
    display.innerHTML = `<p class="text-gray-400 italic text-center mt-4">No notes yet. Create your first encrypted note!</p>`;
    return;
  }

  // Render each note with Delete button
  notes.forEach(note => {
    const decrypted = decrypt(note.content);
    const div = document.createElement('div');
    div.className = 'note-card p-5 my-3 border rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 relative';
    div.innerHTML = `
      <h3 class="text-lg font-bold text-gray-900 mb-2">${note.title}</h3>
      <p class="text-gray-600 text-sm mb-3">${decrypted}</p>
      <span class="text-xs text-gray-400 block mb-3">Last updated: ${new Date(note.updatedAt).toLocaleString()}</span>
      <button onclick="deleteNote('${note._id}', this)" 
        class="text-red-600 hover:text-white hover:bg-red-500 border border-red-500 px-3 py-1 rounded-md text-xs transition">
        🗑 Delete
      </button>
    `;
    display.appendChild(div);
  });
}

// Delete a note
async function deleteNote(id, btn) {
  const token = getToken();
  if (!token) return showResultModal("denied", "Not Logged In", "Please log in first.");

  const card = btn.closest('.note-card');
  card.style.transition = "opacity 0.4s ease";
  card.style.opacity = "0.3";

  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token }
  });

  if (res.ok) {
    setTimeout(() => {
      card.remove();
      showResultModal("success", "Note Deleted", "Your note was securely deleted.");
    }, 300);
  } else {
    showResultModal("denied", "Delete Failed", "Could not delete note.");
    card.style.opacity = "1";
  }
}

// ===== UI MANAGEMENT =====

// Update UI visibility and user display
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

// Logout button
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("lockify_token");
  localStorage.removeItem("lockify_user");
  updateUI();
  location.reload();
});

// Save Note form handler (🚫 prevents reload)
document.getElementById("noteForm")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("noteTitle").value.trim();
  const content = document.getElementById("noteContent").value.trim();

  if (!title || !content) {
    return showResultModal("denied", "Missing Fields", "Please enter both a title and note.");
  }

  createNote(title, content);
  document.getElementById("noteTitle").value = "";
  document.getElementById("noteContent").value = "";
});

// Load notes when logged in
document.addEventListener("DOMContentLoaded", () => {
  updateUI();
  if (getToken()) getNotes();
});

// Footer fade reveal animation
document.addEventListener("scroll", () => {
  const footer = document.querySelector("footer");
  const rect = footer?.getBoundingClientRect();
  if (rect && rect.top < window.innerHeight - 100) footer.classList.add("visible");
});
