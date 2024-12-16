import React, { createContext, useState, useContext, useEffect } from 'react';
import { register as registerUser, login as loginUser, signOut } from '../utils/auth';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [signed, setSigned] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        setSigned(true);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Erro ao analisar o JSON do usuário:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  // Função de Login
  async function signIn(username, password) {
    try {
      const user = await loginUser(username, password);
      setSigned(true);
      setCurrentUser({ id: user.id, username: user.username });
      return true;
    } catch (error) {
      console.error(error.message);
      return false;
    }
  }

  // Função de Registro
  async function register(username, password) {
    try {
      const userId = await registerUser(username, password);
      setSigned(true);
      setCurrentUser({ id: userId, username });
      localStorage.setItem('currentUser', JSON.stringify({ id: userId, username }));
      return true;
    } catch (error) {
      console.error(error.message);
      return false;
    }
  }

  // Função de Logout
  function signOutUser() {
    signOut();
    setSigned(false);
    setCurrentUser(null);
    window.location.reload();
  }

  return (
    <AuthContext.Provider value={{ signed, signIn, signOut: signOutUser, register, currentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
