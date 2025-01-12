// src/components/navbar/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import Search from "lucide-react/icons/search";
import ShoppingCart from "lucide-react/icons/shopping-cart";
import User from "lucide-react/icons/user";
import LogOut from "lucide-react/icons/log-out";
import Package from "lucide-react/icons/package";
import { useNavigate } from "react-router-dom";
import { productsAPI, checkoutAPI } from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";

const Navbar = ({ onSearchResults }) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [showProfileMenu, setShowProfileMenu] = useState(false);
	const [orders, setOrders] = useState([]);
	const menuRef = useRef(null);
	const navigate = useNavigate();
	const { logout, user } = useAuth();

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (menuRef.current && !menuRef.current.contains(event.target)) {
				setShowProfileMenu(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		if (showProfileMenu) {
			fetchOrders();
		}
	}, [showProfileMenu]);

	const fetchOrders = async () => {
		try {
			const data = await checkoutAPI.getOrders();
			setOrders(data);
		} catch (error) {
			console.error("Error fetching orders:", error);
		}
	};

	const handleSearch = async (e) => {
		e.preventDefault();
		try {
			const results = await productsAPI.search(searchQuery);
			onSearchResults(Array.isArray(results) ? results : []);
			navigate("/products");
		} catch (error) {
			console.error("Error searching products:", error);
			onSearchResults([]);
		}
	};

	const handleLogout = async () => {
		try {
			await logout();
			navigate("/login");
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	return (
		<nav className='bg-white shadow-md sticky top-0 z-50'>
			<div className='max-w-7xl mx-auto px-4'>
				<div className='flex justify-between items-center h-16'>
					<div
						className='flex items-center space-x-2 cursor-pointer'
						onClick={() => navigate("/home")}
					>
						<img src='/logo.png' alt='Logo' className='h-10 w-10' />
						<h1 className='text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text'>
							FragranceWorld
						</h1>
					</div>

					<div className='flex-1 max-w-xl px-8'>
						<form onSubmit={handleSearch} className='relative'>
							<input
								type='text'
								placeholder='Search perfumes...'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className='w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50'
							/>
							<button type='submit' className='absolute right-3 top-2.5'>
								<Search className='h-5 w-5 text-gray-400 hover:text-purple-600' />
							</button>
						</form>
					</div>

					<div className='flex items-center space-x-6'>
						<button
							onClick={() => navigate("/cart")}
							className='p-2 hover:text-purple-600 transition-colors relative group'
							aria-label='Cart'
						>
							<ShoppingCart className='h-6 w-6' />
						</button>

						<div className='relative' ref={menuRef}>
							<button
								onClick={() => setShowProfileMenu(!showProfileMenu)}
								className='p-2 hover:text-purple-600 transition-colors'
								aria-label='Account'
							>
								<User className='h-6 w-6' />
							</button>

							{showProfileMenu && (
								<div className='absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl py-2 z-50'>
									<div
										className='px-4 py-3 border-b cursor-pointer hover:bg-gray-50 transition-colors'
										onClick={() => {
											setShowProfileMenu(false); // Tutup menu dropdown
											navigate("/profile"); // Navigasi ke halaman profile
										}}
									>
										<p className='text-sm font-medium text-gray-900'>
											{user.full_name}
										</p>
										<p className='text-sm text-gray-500'>{user.email}</p>
									</div>
									<div className='px-4 py-2'>
										<h3 className='text-sm font-medium text-gray-900'>
											Recent Orders
										</h3>
										<div className='mt-2 space-y-2 max-h-48 overflow-auto'>
											{orders.map((order) => (
												<div
													key={order._id}
													className='flex items-center p-2 hover:bg-gray-50 rounded-lg'
												>
													<Package className='h-5 w-5 text-gray-400 mr-2' />
													<div className='flex-1'>
														<p className='text-sm font-medium text-gray-900'>
															Order #{order._id.slice(-6)}
														</p>
														<p className='text-xs text-gray-500'>
															{new Date(order.created_at).toLocaleDateString()}
														</p>
													</div>
													<span
														className={`text-xs px-2 py-1 rounded-full ${
															order.status === "paid"
																? "bg-green-100 text-green-800"
																: "bg-yellow-100 text-yellow-800"
														}`}
													>
														{order.status}
													</span>
												</div>
											))}
										</div>
									</div>

									<div className='border-t mt-2'>
										<button
											onClick={handleLogout}
											className='flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50'
										>
											<LogOut className='h-4 w-4 mr-2' />
											Logout
										</button>
									</div>
								</div>
							)}
						</div>

						{!user && (
							<button
								onClick={() => navigate("/login")}
								className='px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors'
							>
								Login
							</button>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
