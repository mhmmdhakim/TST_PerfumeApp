import React from "react";

const ProductList = ({ searchResults }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-4">Products</h1>
      {searchResults.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map((product) => (
            <li key={product._id} className="border p-4 rounded shadow-sm">
              <h3 className="text-lg font-bold">{product.name}</h3>
              <p>Brand: {product.brand}</p>
              <p>Category: {product.category}</p>
              <p>Price: ${product.price}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No products found. Try searching for something else!</p>
      )}
    </div>
  );
};

export default ProductList;
