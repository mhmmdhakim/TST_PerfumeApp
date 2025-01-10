// src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch(
        "https://perfume-app-production.up.railway.app/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);

      // Fetch user data
      const userResponse = await fetch(
        "https://perfume-app-production.up.railway.app/auth/me",
        {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        }
      );
      const userData = await userResponse.json();
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  const register = useCallback(async (email, password, fullName) => {
    try {
      const response = await fetch(
        "https://perfume-app-production.up.railway.app/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
