import React, { createContext, useState, useContext } from 'react';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (username, is_superuser, is_staff, is_active) => {
    setUser({ username, is_superuser, is_staff, is_active });
    localStorage.setItem('username', username);
    localStorage.setItem('is_login', true);
    // 可以同時儲存 token
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('username');
    localStorage.removeItem('is_superuser');
    localStorage.removeItem('is_staff');
    localStorage.removeItem('token');
    localStorage.removeItem('is_login');
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
