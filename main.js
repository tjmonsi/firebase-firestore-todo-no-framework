let user = null;
let garbageCollector = null;
let todoRef = null;
const config = {
  apiKey: "AIzaSyC7MV8EWJ6iWPcP0_rG50YzRlhzQoYiVww",
  authDomain: "todo-fire-tjmonsi.firebaseapp.com",
  databaseURL: "https://todo-fire-tjmonsi.firebaseio.com",
  projectId: "todo-fire-tjmonsi",
  storageBucket: "todo-fire-tjmonsi.appspot.com",
  messagingSenderId: "436262060614"
};
firebase.initializeApp(config);

const auth = firebase.auth();
const database = firebase.database();

auth.onAuthStateChanged(result => {
  user = result;
  updateMainUser(user);
});
updateMainUser();

function changeMain (template, callback, garbageCallback) {
  const main = document.querySelector('#main');
  if (garbageCollector) garbageCollector();
  main.innerHTML = '';
  garbageCollector = garbageCallback;
  main.appendChild(template);
  if (callback) callback();
}

async function signIn (form) {
  try {    
    await auth.signInWithEmailAndPassword(form.email.value, form.password.value);
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

async function signUp (form) {
  try {    
    const { user } = await auth.createUserWithEmailAndPassword(form.email.value, form.password.value);
    await user.sendEmailVerification();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

async function signOut () {  
  try {
    await auth.signOut();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

async function createTodo (form) {
  if (user) {
    try {    
      const ref = `/todo/${user.uid}`;
      const { key } = database.ref(ref).push();
      const updates = {};
      updates[`${ref}/${key}/todo`] = form.todo.value;
      updates[`${ref}/${key}/dateCreated`] = firebase.database.ServerValue.TIMESTAMP;
      await database.ref().update(updates);   
      form.todo.value = '';   
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }  
}

function getTemplate (name) {
  return document.querySelector(`#${name}-template`).content.cloneNode(true);  
}

function updateMainUser (user) {
  console.log(user)
  const templateName = user ? 'todo-list' : 'login';  
  changeMain(getTemplate(templateName), 
    user ? setupTodoListTemplate : setupLoginTemplate,
    user ? destroyTodoListTemplate : destroyLoginTemplate
  );  
}

function loginEvent (event) {
  const form = document.querySelector('#main .login-form');
  event.preventDefault();
  signIn(form);      
}

function signupClickEvent () {
  changeMain(getTemplate('signup'), setupSignupTemplate, destroySignupTemplate);
}

function signupEvent (event) {
  const form = document.querySelector('#main .signup-form');
  event.preventDefault();
  signUp(form);      
}

function cancelSignupEvent () {
  changeMain(getTemplate('login'), setupLoginTemplate, destroyLoginTemplate);
}

function createTodoEvent (event) {
  const form = document.querySelector('#main .create-todo-form');
  event.preventDefault();
  createTodo(form);
}

function setupLoginTemplate () {
  const loginForm = document.querySelector('#main .login-form');
  const signup = document.querySelector('#main .signup');
  loginForm.addEventListener('submit', loginEvent);
  signup.addEventListener('click', signupClickEvent);
}

function destroyLoginTemplate () {
  const loginForm = document.querySelector('#main .login-form');
  const signup = document.querySelector('#main .signup');
  loginForm.removeEventListener('submit', loginEvent);
  signup.removeEventListener('click', signupClickEvent);
}

function setupSignupTemplate () {
  const signupForm = document.querySelector('#main .signup-form'); 
  const cancel = document.querySelector('#main .signup-cancel');
  signupForm.addEventListener('submit', signupEvent);
  cancel.addEventListener('click', cancelSignupEvent);
}

function destroySignupTemplate () {
  const signupForm = document.querySelector('#main .signup-form'); 
  const cancel = document.querySelector('#main .signup-cancel');
  signupForm.removeEventListener('submit', signupEvent);
  cancel.removeEventListener('click', cancelSignupEvent);
}

function setupTodoList (snapshot) {
  const array = [];
  snapshot.forEach(todoSnapshot => {
    const { key } = todoSnapshot;
    const obj = Object.assign({}, todoSnapshot.val(), { key });
    array.push(obj);
  });
  const container = document.querySelector('#main .todo-list');
  container.innerHTML = '';
  array.forEach(item => {
    const div = getTemplate('todo-item');    
    div.querySelector('.todo .todo-text').textContent = item.todo;
    const delButton = div.querySelector('.todo .delete');
    delButton.setAttribute('data-key', item.key);
    delButton.addEventListener('click', () => {
      const key = delButton.getAttribute('data-key');
      console.log(key)
      database.ref(`/todo/${user.uid}/${key}`).set({});
    });
    container.appendChild(div);
  });  
}

function setupTodoListTemplate () {
  const createTodoForm = document.querySelector('#main .create-todo-form');
  const logout = document.querySelector('#main .signout');
  createTodoForm.addEventListener('submit', createTodoEvent);
  logout.addEventListener('click', signOut);
  if (user) {
    todoRef = database.ref(`todo/${user.uid}`).orderByChild('dateCreated');
    todoRef.on('value', setupTodoList)
  }
}

function destroyTodoListTemplate () {
  const createTodoForm = document.querySelector('#main .create-todo-form');
  const logout = document.querySelector('#main .signout');
  createTodoForm.removeEventListener('submit', createTodoEvent);
  logout.removeEventListener('click', signOut);
  if (todoRef) {
    todoRef.off('value', setupTodoList);
    todoRef = null;
  }
}

