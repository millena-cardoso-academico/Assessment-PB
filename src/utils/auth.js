import db from '../db';

export async function register(username, password) {
  const existingUser = await db.users.where('username').equals(username).first();
  if (existingUser) {
    throw new Error('Usuário já existe');
  }

  const id = await db.users.add({ username, password });
  return id;
}

export async function login(username, password) {
  const user = await db.users.where({ username, password }).first();
  if (!user) {
    throw new Error('Credenciais inválidas');
  }
  localStorage.setItem('currentUser', JSON.stringify({ id: user.id, username: user.username }));
  return user;
}

export function signOut() {
  localStorage.removeItem('currentUser');
}
