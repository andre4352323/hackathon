import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";
import { clearSession, getSession, getUsers, logout } from "../lib/api";
import "./StudentProfilePage.css";

export default function StudentProfilePage() {
  const session = getSession();
  const [email] = useState(session?.email || "");
  const [phone, setPhone] = useState("");
  const [qrToken, setQrToken] = useState(session?.qrToken || "");

  useEffect(() => {
    async function loadQrToken() {
      if (qrToken || !session?.userId) return;
      try {
        const users = await getUsers();
        const me = users.find((u) => u.id === session.userId);
        if (me?.qrToken) setQrToken(me.qrToken);
      } catch {
        // Leave QR empty if lookup fails.
      }
    }
    loadQrToken();
  }, [qrToken, session?.userId]);

  function handleSave(e) {
    e.preventDefault();
    console.log("Saved:", { phone });
  }

  function handleDelete() {
    const ok = window.confirm("Are you sure?");
    if (ok) console.log("Account deleted");
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

  function downloadQR() {
    const canvas = document.querySelector("#qr-wrapper canvas");
    if (!canvas) return;

    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = "unibite-qr.png";
    link.click();
  }

  return (
    <div className="profilePage">
      <header className="nav">
        {/* LEFT */}
        <div className="brand">
          <div className="brandIcon">UB</div>
          <div className="brandText">UniBite</div>
        </div>

        {/* CENTER */}
        <nav className="navLinks">
          <a className="navLink" href="/StudentFoodPage">
            Browse Food
          </a>
          <a className="navLink" href="/StudentClaimsPage">
            My Claims
          </a>
          <a className="navLink active" href="/StudentProfilePage">
            Profile
          </a>
        </nav>

        {/* RIGHT */}
        <div className="navRight">
          <div className="bell" title="Notifications">
            🔔
            <span className="badge">2</span>
          </div>

          <span className="email">{email}</span>

          <a className="logout" href="/LoginPage" onClick={handleLogout}>
            Logout
          </a>
        </div>
      </header>

      <main className="container">
        <h1>My Profile</h1>

        <div className="card center">
          <h2>Your Pickup QR Code</h2>
          <p>Show this to the restaurant when picking up your food</p>

          <div className="qrWrapper" id="qr-wrapper">
            <QRCodeCanvas value={qrToken || "QR_NOT_READY"} size={220} />
            {!qrToken && <p>Please log out and log in again to refresh your QR code.</p>}
            <button className="greenBtn" type="button" onClick={downloadQR}>
              Download QR Code
            </button>
          </div>
        </div>

        <div className="card">
          <h2>Account Details</h2>

          <form onSubmit={handleSave}>
            <label>Email</label>
            <input type="text" value={email} disabled />

            <label>Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <button className="greenBtn" type="submit">
              Save Changes
            </button>
          </form>
        </div>

        <div className="card danger">
          <h2>Danger Zone</h2>
          <p>Permanently delete your account.</p>

          <button className="redBtn" type="button" onClick={handleDelete}>
            Delete Account
          </button>
        </div>
      </main>
    </div>
  );
}
