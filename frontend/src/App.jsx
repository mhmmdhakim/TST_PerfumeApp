import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import MainLayout from "./components/Layout/MainLayout";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import CartPage from "./pages/CartPage";
import Homepage from "./pages/HomePage";
import Checkout from "./components/checkout/Checkout";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
};

const App = () => {
  const [searchResults, setSearchResults] = useState([]);

  const handleSearchResults = (results) => {
    setSearchResults(results);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <MainLayout onSearchResults={handleSearchResults}>
                <Homepage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <MainLayout onSearchResults={handleSearchResults}>
                <CartPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products searchResults={searchResults} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
