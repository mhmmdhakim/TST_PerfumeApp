import React from "react";
import ProductList from "../components/products/ProductList";

const Products = ({ searchResults = [] }) => {
  return <ProductList searchResults={searchResults} />;
};

export default Products;
