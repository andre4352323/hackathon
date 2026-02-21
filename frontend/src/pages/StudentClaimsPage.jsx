import { useEffect, useMemo, useState } from "react";
import {
  cancelClaim,
  clearSession,
  getClaimsByStudent,
  getListings,
  getUsers,
  getSession,
  logout,
} from "../lib/api";
import "./StudentClaimsPage.css";

export default function StudentClaimsPage() {
  const session = getSession();

  const [tab, setTab] = useState("active");
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadClaims() {
    if (!session?.userId) {
      setError("Please log in first.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [claimRows, listings, users] = await Promise.all([
        getClaimsByStudent(session.userId),
        getListings(),
        getUsers(),
      ]);

      const userNameById = new Map(
        users.map((u) => [u.id, u.displayName || u.email || `User ${u.id}`]),
      );
      const listingById = new Map(listings.map((x) => [x.id, x]));

      setClaims(
        claimRows.map((claim) => {
          const listing = listingById.get(claim.listingId);
          const type = claim.status === "CLAIMED" ? "active" : "history";

          return {
            id: claim.id,
            title: listing?.title || `Listing #${claim.listingId}`,
            restaurant: listing
              ? (userNameById.get(listing.restaurantId) ||
                  `Restaurant ${listing.restaurantId}`)
              : "Unknown restaurant",
            quantity: claim.quantity,
            pickupAt: listing?.pickupLocation || "Campus pickup",
            claimedAt: formatTime(claim.claimedAt),
            status: claim.status,
            type,
          };
        }),
      );
    } catch (err) {
      setError(err.message || "Failed to load claims");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClaims();
  }, []);

  const activeClaims = useMemo(
    () => claims.filter((c) => c.type === "active"),
    [claims],
  );

  const historyClaims = useMemo(
    () => claims.filter((c) => c.type === "history"),
    [claims],
  );

  const visibleClaims = tab === "active" ? activeClaims : historyClaims;

  async function handleCancelClaim(id) {
    try {
      await cancelClaim(id);
      await loadClaims();
    } catch (err) {
      setError(err.message || "Could not cancel claim");
    }
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
    <div className="claimsPage">
      <header className="nav">
        <div className="brand">
          <div className="brandIcon">UB</div>
          <div className="brandText">UniBite</div>
        </div>

        <nav className="navLinks">
          <a className="navLink" href="/StudentFoodPage">
            Browse Food
          </a>
          <a className="navLink active" href="/StudentClaimsPage">
            My Claims
          </a>
          <a className="navLink" href="/StudentProfilePage">
            Profile
          </a>
        </nav>

        <div className="navRight">
          <div className="bell">
            🔔 <span className="badge">0</span>
          </div>
          <div className="email">{session?.email || "student@myumanitoba.ca"}</div>
          <a className="logout" href="/LoginPage" onClick={handleLogout}>
            Logout
          </a>
        </div>
      </header>

      <main className="container">
        <h1 className="title">My Claims</h1>

        <div className="tabs">
          <button
            className={`tabBtn ${tab === "active" ? "tabActive" : ""}`}
            type="button"
            onClick={() => setTab("active")}
          >
            Active ({activeClaims.length})
          </button>

          <button
            className={`tabBtn ${tab === "history" ? "tabActive" : ""}`}
            type="button"
            onClick={() => setTab("history")}
          >
            History ({historyClaims.length})
          </button>
        </div>

        {loading && <div className="empty">Loading claims...</div>}
        {error && <div className="empty">{error}</div>}

        {!loading && !error && (
          <div className="list">
            {visibleClaims.length === 0 ? (
              <div className="empty">No claims here.</div>
            ) : (
              visibleClaims.map((c) => (
                <div key={c.id} className="claimCard">
                  <div className="cardTop">
                    <div>
                      <h2 className="cardTitle">{c.title}</h2>
                      <div className="cardSub">{c.restaurant}</div>
                    </div>

                    <span className="pill">{c.status}</span>
                  </div>

                  <div className="cardBody">
                    <div className="leftInfo">
                      <div className="row">
                        <span className="label">Quantity:</span>
                        <span className="value">{c.quantity}</span>
                      </div>

                      <div className="row">
                        <span className="label">Pickup at:</span>
                        <span className="valueBold">{c.pickupAt}</span>
                      </div>

                      {c.type === "active" && (
                        <button
                          className="cancelBtn"
                          type="button"
                          onClick={() => handleCancelClaim(c.id)}
                        >
                          Cancel Claim
                        </button>
                      )}
                    </div>

                    <div className="rightInfo">
                      <span className="muted">Claimed:</span>{" "}
                      <span className="valueBold">{c.claimedAt}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function formatTime(value) {
  if (!value) return "N/A";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
}
