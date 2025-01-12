// src/App.jsx
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
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import Homepage from "./pages/HomePage";
import Checkout from "./components/checkout/Checkout";
import ProductList from "./components/products/ProductList";
import Profile from "./pages/Profile";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to='/login' />;
};

const App = () => {
  const [searchResults, setSearchResults] = useState([]);

  const handleSearchResults = (results) => {
    setSearchResults(results);
  };

  return (
    <Router>
      <Routes>
        <Route path='*' element={<Navigate to='/home' replace />} />
        <Route path='/' element={<LandingPage />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />

        {/* Protected Routes with MainLayout */}
        <Route
          path='/home'
          element={
            <ProtectedRoute>
              <MainLayout onSearchResults={handleSearchResults}>
                <Homepage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/cart'
          element={
            <ProtectedRoute>
              <MainLayout onSearchResults={handleSearchResults}>
                <CartPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/products'
          element={
            <ProtectedRoute>
              <MainLayout onSearchResults={handleSearchResults}>
                <ProductList searchResults={searchResults} />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/product/:id'
          element={
            <ProtectedRoute>
              <MainLayout onSearchResults={handleSearchResults}>
                <ProductDetail />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/checkout'
          element={
            <ProtectedRoute>
              <MainLayout onSearchResults={handleSearchResults}>
                <Checkout />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path='/profile'
          element={
            <ProtectedRoute>
              <MainLayout onSearchResults={handleSearchResults}>
                <Profile />
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
