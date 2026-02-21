import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../lib/api";
import "./SignupPage.css";

export default function SignupPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [dailyLimit, setDailyLimit] = useState(5);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const emailLabel = role === "student" ? "University Email" : "Email";
  const emailHint =
    role === "student" ? "Must be @myumanitoba.ca or @umanitoba.ca" : "";

  async function handleCreateAccount(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await register({
        role: role.toUpperCase(),
        email,
        password,
        phone,
        dailyClaimLimit: dailyLimit,
      });

      setSuccess("Account created. Please sign in.");
      setTimeout(() => navigate("/LoginPage"), 700);
    } catch (err) {
      setError(err.message || "Could not create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="signupPage">
      <header className="signupTopbar">
        <div className="signupBrand">
          <div className="signupBrandIcon">UB</div>
          <span className="signupBrandName">UniBite</span>
        </div>
      </header>

      <main className="signupContent">
        <div className="signupCard">
          <h1 className="signupTitle">Create your account</h1>
          <p className="signupSubtitle">Join UniBite and reduce food waste</p>

          <div className="signupToggle">
            <div
              className={`signupToggleSlider ${
                role === "student" ? "left" : "right"
              }`}
            />

            <button
              type="button"
              className={`signupToggleBtn ${
                role === "student" ? "active" : ""
              }`}
              onClick={() => setRole("student")}
            >
              Student
            </button>

            <button
              type="button"
              className={`signupToggleBtn ${
                role === "restaurant" ? "active" : ""
              }`}
              onClick={() => setRole("restaurant")}
            >
              Restaurant
            </button>
          </div>

          <form className="signupForm" onSubmit={handleCreateAccount}>
            <label className="signupLabel">{emailLabel}</label>
            <input
              className="signupInput"
              type="email"
              placeholder="you@myumanitoba.ca"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {emailHint !== "" && <p className="signupHint">{emailHint}</p>}

            <label className="signupLabel">Password</label>
            <input
              className="signupInput"
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />

            <label className="signupLabel">Phone Number</label>
            <input
              className="signupInput"
              type="tel"
              placeholder="204-555-1234"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <label className="signupLabel">Daily Claim Limit</label>
            <input
              className="signupInput"
              type="number"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
              min={1}
              max={20}
            />
            <p className="signupHint">Max items you want to claim per day</p>

            {error && <p className="signupHint">{error}</p>}
            {success && <p className="signupHint">{success}</p>}

            <button className="signupMainBtn" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          <p className="signupFooterText">
            Already have an account? <a href="/LoginPage">Sign in</a>
          </p>
        </div>
      </main>
    </div>
  );
}
