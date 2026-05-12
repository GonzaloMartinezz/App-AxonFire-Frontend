import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * AuthContext — Stores the authenticated user session (id, rol, token).
 * After a successful login the consumer calls `login(data)` with the API response.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // user shape: { id, rol, token } | null
  const [user, setUser] = useState(null);

  const login = useCallback((data) => {
    setUser({
      id: data.id,
      rol: data.rol,
      token: data.token,
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

export default AuthContext;
