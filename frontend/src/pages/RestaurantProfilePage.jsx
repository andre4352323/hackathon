import { useState } from "react";
import { clearSession, getSession, logout } from "../lib/api";
import "./RestaurantProfilePage.css";

export default function RestaurantProfilePage() {
  const session = getSession();
  const [managerEmail] = useState(session?.email || "");
  const [restaurantName, setRestaurantName] = useState(
    "University Centre Food Court",
  );
  const [phone, setPhone] = useState("204-555-9999");
  const [location, setLocation] = useState("University Centre, 2nd Floor");
  const [mapLink, setMapLink] = useState(
    "https://maps.google.com/?q=University+of+Manitoba+University+Centre",
  );

  function handleSave(e) {
    e.preventDefault();
    console.log("Saved restaurant profile:", {
      managerEmail,
      restaurantName,
      phone,
      location,
      mapLink,
    });
    alert("Saved changes! (dummy)");
  }

  function handleDelete() {
    const ok = window.confirm(
      "Are you sure? This will delete the restaurant account (dummy).",
    );
    if (ok) console.log("Deleted account (dummy)");
  }

  async function handleLogout(e) {
    e.preventDefault();
    try {
      if (session?.sessionToken) {
        await logout(session.sessionToken);
      }
    } catch {
      // Ignore logout call errors and clear local session anyway.
    }
    clearSession();
    window.location.href = "/LoginPage";
  }

  return (
    <div className="rpPage">
      {/* NAVBAR (same style as your dashboard) */}
      <header className="nav">
        <div className="brand">
          <div className="brandIcon">UB</div>
          <div className="brandText">UniBite</div>
        </div>

        <nav className="navLinks">
          <a className="navTab" href="/RestaurantDashboard">
            My Postings
          </a>
          <a className="navTab" href="/RestaurantDashboard">
            Claims
          </a>
          <a className="navTab" href="/RestaurantDashboard">
            QR Scanner
          </a>
          <a className="navTab active" href="/RestaurantProfilePage">
            Profile
          </a>
        </nav>

        <div className="navRight">
          <span className="placeName">University Centre Food Court</span>
          <a className="logout" href="/LoginPage" onClick={handleLogout}>
            Logout
          </a>
        </div>
      </header>

      {/* CONTENT */}
      <main className="rpContainer">
        <h1 className="rpTitle">Restaurant Profile</h1>

        {/* Restaurant Details Card */}
        <div className="rpCard">
          <h2 className="rpCardTitle">Restaurant Details</h2>

          <form onSubmit={handleSave}>
            <label className="rpLabel">Manager Email</label>
            <input className="rpInput" value={managerEmail} disabled />

            <label className="rpLabel">Restaurant Name</label>
            <input
              className="rpInput"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
            />

            <label className="rpLabel">Phone</label>
            <input
              className="rpInput"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <label className="rpLabel">Location</label>
            <input
              className="rpInput"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <label className="rpLabel">Map Link</label>
            <input
              className="rpInput"
              value={mapLink}
              onChange={(e) => setMapLink(e.target.value)}
            />

            <button className="rpSaveBtn" type="submit">
              Save Changes
            </button>
          </form>
        </div>

        {/* Danger Zone Card */}
        <div className="rpCard rpDangerCard">
          <h2 className="rpDangerTitle">Danger Zone</h2>
          <p className="rpDangerText">
            Permanently delete your restaurant account, all postings, and
            associated claims.
          </p>

          <button className="rpDeleteBtn" type="button" onClick={handleDelete}>
            Delete Account
          </button>
        </div>

        {/* (Optional) Add extra spacing so scrolling feels natural */}
        <div className="rpBottomSpace" />
      </main>
    </div>
  );
}
