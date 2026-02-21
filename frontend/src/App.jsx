import { BrowserRouter, Route, Routes } from "react-router-dom";

import LoginPage from "./pages/LoginPage.jsx";
import RestaurantDashboard from "./pages/RestaurantDashboard.jsx";
import RestaurantProfilePage from "./pages/RestaurantProfilePage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import StudentClaimsPage from "./pages/StudentClaimsPage.jsx";
import StudentFoodPage from "./pages/StudentFoodPage.jsx";
import StudentProfilePage from "./pages/StudentProfilePage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/LoginPage" element={<LoginPage />} />
        <Route path="/SignupPage" element={<SignupPage />} />
        <Route path="/StudentFoodPage" element={<StudentFoodPage />} />
        <Route path="/StudentClaimsPage" element={<StudentClaimsPage />} />
        <Route path="/StudentProfilePage" element={<StudentProfilePage />} />
        <Route path="/RestaurantDashboard" element={<RestaurantDashboard />} />
        <Route
          path="/RestaurantProfilePage"
          element={<RestaurantProfilePage />}
        />
      </Routes>
    </BrowserRouter>
  );
}
