import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, saveSession } from "../lib/api";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailLabel = role === "student" ? "University Email" : "Email";
  const emailPlaceholder =
    role === "student" ? "you@myumanitoba.ca" : "Enter your email";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const auth = await login({ email, password });
      const expectedRole = role.toUpperCase();

      if (auth.role !== expectedRole) {
        throw new Error(`This account is ${auth.role}, not ${expectedRole}.`);
      }

      saveSession(auth);

      if (auth.role === "RESTAURANT") {
        navigate("/RestaurantDashboard");
        return;
      }

      navigate("/StudentFoodPage");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="brandIcon">UB</div>
          <span className="brandName">UniBite</span>
        </div>
      </header>

      <main className="content">
        <div className="card">
          <h1 className="title">Welcome back</h1>
          <p className="subtitle">Sign in to your account</p>

          <div className="toggle">
            <div
              className={`toggleSlider ${
                role === "student" ? "left" : "right"
              }`}
            />

            <button
              type="button"
              className={`toggleBtn ${role === "student" ? "active" : ""}`}
              onClick={() => setRole("student")}
            >
              Student
            </button>

            <button
              type="button"
              className={`toggleBtn ${role === "restaurant" ? "active" : ""}`}
              onClick={() => setRole("restaurant")}
            >
              Restaurant
            </button>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <label className="label">{emailLabel}</label>
            <input
              className="input"
              type="email"
              placeholder={emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="signupHint">{error}</p>}

            <button className="signInBtn" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="footerText">
            Don&apos;t have an account? <a href="/SignupPage">Sign up</a>
          </p>
        </div>
      </main>
    </div>
  );
}
