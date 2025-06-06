export async function signInWithPassword(data: { email: string; password: string }) {
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  const user = users[data.email];
  if (!user || user.password !== data.password) {
    return 'Invalid email or password.';
  }
  localStorage.setItem('currentUser', JSON.stringify(user));
  return null;
}

export async function signUpWithPassword(data: { email: string; password: string, name?: string }) {
  let users = JSON.parse(localStorage.getItem('users') || '{}');
  if (users[data.email]) {
    return 'User already exists.';
  }
  const role = data.email === 'topcitytickets@gmail.com' ? 'admin' : 'user';
  const user = { email: data.email, password: data.password, name: data.name, role };
  users[data.email] = user;
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('currentUser', JSON.stringify(user));
  return null;
}

export async function signOut() {
  localStorage.removeItem('currentUser');
  window.location.href = '/';
}

// Google sign-in is not supported with localStorage
export async function signInWithGoogle() {
  return 'Google sign-in is not supported in localStorage mode.';
}
