const revealItems = document.querySelectorAll(".reveal");
const siteApp = document.getElementById("siteApp");
const authGate = document.getElementById("authGate");
const authMessage = document.getElementById("authMessage");
const googleHint = document.getElementById("googleHint");
const authTabs = document.querySelectorAll(".auth-tab");
const authForms = document.querySelectorAll(".auth-form");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const googleLoginButton = document.getElementById("googleLoginButton");

const STORAGE_ACCOUNT_KEY = "oxicom_account";
const STORAGE_SESSION_KEY = "oxicom_session";
const rawFirebaseConfig = window.OXICOM_AUTH_CONFIG?.firebase || {};
const hasFirebaseConfig = ["apiKey", "authDomain", "projectId", "appId"].every(
  (key) => typeof rawFirebaseConfig[key] === "string" && rawFirebaseConfig[key].trim() !== ""
);

let firebaseAuth = null;
let googleProvider = null;

document.body.classList.add("auth-locked");

const setMessage = (message, isError = false) => {
  authMessage.textContent = message;
  authMessage.style.color = isError ? "#fda4af" : "#8fb0ff";
};

const unlockSite = () => {
  siteApp.classList.remove("is-locked");
  authGate.hidden = true;
  document.body.classList.remove("auth-locked");
};

const storedSession = localStorage.getItem(STORAGE_SESSION_KEY);
if (storedSession === "authenticated") {
  unlockSite();
}

if (hasFirebaseConfig) {
  googleHint.textContent = "Connexion Google prête via Firebase.";
}

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const tabName = tab.dataset.tab;

    authTabs.forEach((item) => item.classList.toggle("is-active", item === tab));
    authForms.forEach((form) => form.classList.toggle("is-active", form.dataset.form === tabName));
    setMessage("");
  });
});

const registerWithLocalStorage = (email, password) => {
  const account = { email, password };
  localStorage.setItem(STORAGE_ACCOUNT_KEY, JSON.stringify(account));
  localStorage.setItem(STORAGE_SESSION_KEY, "authenticated");
  setMessage("Compte créé. Accès autorisé.");
  unlockSite();
};

const loginWithLocalStorage = (email, password) => {
  const rawAccount = localStorage.getItem(STORAGE_ACCOUNT_KEY);

  if (!rawAccount) {
    setMessage("Aucun compte local trouvé. Crée d'abord un compte.", true);
    return;
  }

  const savedAccount = JSON.parse(rawAccount);

  if (email !== savedAccount.email || password !== savedAccount.password) {
    setMessage("Adresse mail ou mot de passe incorrect.", true);
    return;
  }

  localStorage.setItem(STORAGE_SESSION_KEY, "authenticated");
  setMessage("Connexion réussie.");
  unlockSite();
};

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(registerForm);
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || password.length < 6) {
    setMessage("Entre une adresse mail valide et un mot de passe d'au moins 6 caractères.", true);
    return;
  }

  if (!firebaseAuth) {
    registerWithLocalStorage(email, password);
    return;
  }

  try {
    const { createUserWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js");
    await createUserWithEmailAndPassword(firebaseAuth, email, password);
    localStorage.setItem(STORAGE_SESSION_KEY, "authenticated");
    setMessage("Compte créé. Accès autorisé.");
    unlockSite();
  } catch (error) {
    setMessage("Création du compte impossible: " + (error.message || "erreur inconnue"), true);
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!firebaseAuth) {
    loginWithLocalStorage(email, password);
    return;
  }

  try {
    const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js");
    await signInWithEmailAndPassword(firebaseAuth, email, password);
    localStorage.setItem(STORAGE_SESSION_KEY, "authenticated");
    setMessage("Connexion réussie.");
    unlockSite();
  } catch (error) {
    setMessage("Connexion impossible: " + (error.message || "erreur inconnue"), true);
  }
});

googleLoginButton.addEventListener("click", async () => {
  if (!firebaseAuth || !googleProvider) {
    setMessage("Configure d'abord Firebase dans auth-config.js pour activer Google.", true);
    return;
  }

  try {
    const { signInWithPopup } = await import("https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js");
    await signInWithPopup(firebaseAuth, googleProvider);
    localStorage.setItem(STORAGE_SESSION_KEY, "authenticated");
    setMessage("Connexion Google réussie.");
    unlockSite();
  } catch (error) {
    setMessage("Connexion Google impossible: " + (error.message || "erreur inconnue"), true);
  }
});

if (hasFirebaseConfig) {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js");
    const {
      getAuth,
      GoogleAuthProvider,
    } = await import("https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js");

    const firebaseApp = initializeApp(rawFirebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    googleHint.textContent = "Firebase non chargé. Vérifie la configuration.";
    setMessage("Le chargement Firebase a échoué: " + (error.message || "erreur inconnue"), true);
  }
}

if (!("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
    }
  );

  revealItems.forEach((item) => observer.observe(item));
}
