// PASO 1: CONFIGURACIÓN DE FIREBASE (¡REEMPLAZA CON TUS PROPIAS CREDENCIALES!)
  const firebaseConfig = {
    apiKey: "AIzaSyBZEVISZuRfn1iC3be5b7xTMQiCZubXyTU",
    authDomain: "bdnosql-de619.firebaseapp.com",
    projectId: "bdnosql-de619",
    storageBucket: "bdnosql-de619.firebasestorage.app",
    messagingSenderId: "519369652548",
    appId: "1:519369652548:web:260c2b45275f5a0ff5ff11",
    measurementId: "G-1FYEJLG220"
  };

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

// Obtén referencias a los servicios de Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// --- Referencias a elementos del DOM ---
const authStatusElem = document.getElementById('auth-status');
const authFormsElem = document.getElementById('auth-forms');
const btnLogout = document.getElementById('btn-logout');

// Signup elements
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const btnSignup = document.getElementById('btn-signup');
const signupError = document.getElementById('signup-error');

// Login elements
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const btnLogin = document.getElementById('btn-login');
const loginError = document.getElementById('login-error');

// Firestore elements
const alumnosContainer = document.getElementById('alumnos-container');
const firestoreSection = document.getElementById('firestore-section');
const addAlumnoForm = document.getElementById('add-alumno-form');
const newAlumnoNombre = document.getElementById('new-alumno-nombre');
const newAlumnoCarrera = document.getElementById('new-alumno-carrera');
const newAlumnoEdad = document.getElementById('new-alumno-edad');
const newAlumnoMaterias = document.getElementById('new-alumno-materias');
const btnAddAlumno = document.getElementById('btn-add-alumno');
const addAlumnoError = document.getElementById('add-alumno-error');


// --- Funciones de Autenticación ---

// Función para registrar un usuario
btnSignup.addEventListener('click', async () => {
    const email = signupEmail.value;
    const password = signupPassword.value;
    signupError.textContent = ''; // Limpiar mensaje de error previo

    try {
        await auth.createUserWithEmailAndPassword(email, password);
        // La función onAuthStateChanged manejará el éxito del registro y la UI
    } catch (error) {
        console.error("Error al registrar: ", error);
        signupError.textContent = `Error: ${error.message}`;
    }
});

// Función para iniciar sesión
btnLogin.addEventListener('click', async () => {
    const email = loginEmail.value;
    const password = loginPassword.value;
    loginError.textContent = ''; // Limpiar mensaje de error previo

    try {
        await auth.signInWithEmailAndPassword(email, password);
        // La función onAuthStateChanged manejará el éxito del inicio de sesión y la UI
    } catch (error) {
        console.error("Error al iniciar sesión: ", error);
        loginError.textContent = `Error: ${error.message}`;
    }
});

// Función para cerrar sesión
btnLogout.addEventListener('click', async () => {
    try {
        await auth.signOut();
        // La función onAuthStateChanged manejará el cierre de sesión y la UI
    } catch (error) {
        console.error("Error al cerrar sesión: ", error);
    }
});

// --- Manejo del Estado de Autenticación ---
// Esta es la parte CRÍTICA para saber si un usuario está conectado
auth.onAuthStateChanged(user => {
    if (user) {
        // Usuario CONECTADO
        authStatusElem.textContent = `Conectado como: ${user.email}`;
        authFormsElem.classList.add('hidden'); // Ocultar formularios de login/signup
        btnLogout.classList.remove('hidden'); // Mostrar botón de logout

        // Mostrar sección de Firestore y cargar alumnos
        firestoreSection.classList.remove('hidden');
        addAlumnoForm.classList.remove('hidden'); // Mostrar formulario para añadir alumno
        getAlumnos(); // Cargar los datos de los alumnos

    } else {
        // Usuario DESCONECTADO
        authStatusElem.textContent = 'No hay usuario conectado.';
        authFormsElem.classList.remove('hidden'); // Mostrar formularios de login/signup
        btnLogout.classList.add('hidden'); // Ocultar botón de logout

        // Ocultar sección de Firestore y limpiar alumnos
        alumnosContainer.innerHTML = '';
        firestoreSection.classList.add('hidden'); // Ocultar toda la sección de firestore
        addAlumnoForm.classList.add('hidden'); // Ocultar formulario para añadir alumno
    }
});


// --- Funciones de Firestore (Solo se activan si hay usuario logeado) ---

// Obtener y mostrar alumnos de Firestore
async function getAlumnos() {
    alumnosContainer.innerHTML = 'Cargando alumnos...';
    try {
        // Asegúrate de que la colección 'alumnos' exista en tu Firestore y tenga algunos datos.
        const snapshot = await db.collection("alumnos").get(); 

        if (snapshot.empty) {
            alumnosContainer.innerHTML = '<p>No hay alumnos registrados. ¡Añade uno!</p>';
            return;
        }

        alumnosContainer.innerHTML = ''; // Limpia el contenido previo

        snapshot.forEach(doc => {
            const data = doc.data(); 
            const alumnoDiv = document.createElement('div');
            alumnoDiv.classList.add('alumno-card');
            alumnoDiv.innerHTML = `
                <h2>${data.nombre}</h2>
                <p><strong>Carrera:</strong> ${data.carrera}</p>
                <p><strong>Edad:</strong> ${data.edad}</p>
                <p><strong>Materias:</strong> ${data.materias ? data.materias.join(', ') : 'N/A'}</p>
            `;
            alumnosContainer.appendChild(alumnoDiv);
        });

    } catch (error) {
        console.error("Error al obtener los alumnos: ", error);
        alumnosContainer.innerHTML = `<p style="color: red;">Error al cargar los datos: ${error.message}</p>`;
    }
}

// Función para añadir un nuevo alumno
btnAddAlumno.addEventListener('click', async () => {
    addAlumnoError.textContent = '';
    const nombre = newAlumnoNombre.value;
    const carrera = newAlumnoCarrera.value;
    const edad = parseInt(newAlumnoEdad.value);
    const materiasString = newAlumnoMaterias.value;
    const materias = materiasString ? materiasString.split(',').map(m => m.trim()) : [];

    if (!nombre || !carrera || isNaN(edad)) {
        addAlumnoError.textContent = 'Todos los campos (Nombre, Carrera, Edad) son obligatorios.';
        return;
    }

    try {
        await db.collection("alumnos").add({
            nombre: nombre,
            carrera: carrera,
            edad: edad,
            materias: materias,
            // Opcional: registrar quién creó el alumno
            createdBy: auth.currentUser.uid, 
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("Nuevo alumno agregado con éxito!");
        // Limpiar campos del formulario
        newAlumnoNombre.value = '';
        newAlumnoCarrera.value = '';
        newAlumnoEdad.value = '';
        newAlumnoMaterias.value = '';
        getAlumnos(); // Recargar la lista de alumnos
    } catch (error) {
        console.error("Error al agregar alumno: ", error);
        addAlumnoError.textContent = `Error: ${error.message}`;
    }
});