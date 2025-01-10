import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 to-indigo-900 text-white">
      <header className="absolute top-0 w-full py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">FragranceWorld</h1>
      </header>

      <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
          Discover Your <span className="text-indigo-300">Perfect Scent</span>
        </h2>
        <p className="mt-4 text-lg sm:text-xl text-indigo-200">
          Find luxury perfumes that match your personality and style.
        </p>
        <div className="mt-8 space-x-4">
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 text-lg font-medium bg-white text-indigo-700 rounded-lg shadow-md hover:bg-indigo-50"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/register")}
            className="px-6 py-3 text-lg font-medium bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700"
          >
            Register
          </button>
        </div>
      </main>

      <footer className="absolute bottom-0 w-full py-4 text-center text-indigo-200">
        © {new Date().getFullYear()} FragranceWorld. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
