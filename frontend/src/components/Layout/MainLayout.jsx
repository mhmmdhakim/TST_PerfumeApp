// src/components/layout/MainLayout.jsx
import React from "react";
import Navbar from "./Navbar";

const MainLayout = ({ children, onSearchResults }) => {
  return (
    <>
      <Navbar onSearchResults={onSearchResults} />
      <main>{children}</main>
    </>
  );
};

export default MainLayout;
