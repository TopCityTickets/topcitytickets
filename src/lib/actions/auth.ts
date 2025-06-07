// This file is now a stub to prevent server-side localStorage usage. All logic is in client components.

let users: any = {
  'topcitytickets@gmail.com': {
    email: 'topcitytickets@gmail.com',
    password: 'admin123',
    name: 'Admin',
    role: 'admin'
  }
};

export async function signInWithPassword({ email, password }: { email: string; password: string }) {
  const user = users[email];
  if (!user || user.password !== password) {
    return 'Invalid email or password.';
  }
  if (typeof window !== 'undefined') localStorage.setItem('currentUser', JSON.stringify(user));
  return null;
}

export async function signUpWithPassword({ email, password, name }: { email: string; password: string; name?: string }) {
  if (users[email]) {
    return 'User already exists.';
  }
  const role = email === 'topcitytickets@gmail.com' ? 'admin' : 'user';
  const user = { email, password, name, role };
  users[email] = user;
  if (typeof window !== 'undefined') localStorage.setItem('currentUser', JSON.stringify(user));
  return null;
}

export async function signOut() {
  if (typeof window !== 'undefined') localStorage.removeItem('currentUser');
}

export async function requestSeller(email: string) {
  if (users[email]) {
    users[email].role = 'pending_seller';
    if (typeof window !== 'undefined') localStorage.setItem('currentUser', JSON.stringify(users[email]));
    return 'Seller request submitted!';
  }
  return 'User not found.';
}
