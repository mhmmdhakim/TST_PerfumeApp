// src/pages/CartPage.jsx
import React from "react";
import MainLayout from "../components/Layout/MainLayout";
import Cart from "../components/cart/Cart";

const CartPage = () => {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b">
        <h1 className="text-2xl font-bold">Shopping Cart</h1>
      </div>
      <Cart />
    </div>
  );
};

export default CartPage;
