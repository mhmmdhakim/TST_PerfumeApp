// src/pages/Login.jsx
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import { Link } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate("/home"); // Redirect setelah login berhasil
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Masuk ke Akun Anda
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Atau{" "}
          <Link to="/register" className="text-blue-600 hover:text-blue-500">
            daftar akun baru
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>
      </div>
    </div>
  );
};

export default Login;
