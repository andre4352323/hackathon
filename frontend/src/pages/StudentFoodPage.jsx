import { useEffect, useMemo, useState } from "react";
import {
  clearSession,
  createClaim,
  getListings,
  getUsers,
  getSession,
  logout,
} from "../lib/api";
import "./StudentFoodPage.css";

export default function StudentBrowseFoodPage() {
  const session = getSession();

  const [selectedRestaurant, setSelectedRestaurant] =
    useState("All Restaurants");
  const [selectedItem, setSelectedItem] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadListings() {
    setLoading(true);
    setError("");

    try {
      const [data, users] = await Promise.all([getListings(), getUsers()]);
      const userNameById = new Map(
        users.map((u) => [u.id, u.displayName || u.email || `User ${u.id}`]),
      );
      const mappedItems = data.map((listing) => {
        const status = computeStatus(listing);

        return {
          id: listing.id,
          title: listing.title,
          description: listing.description || "No description",
          restaurant:
            userNameById.get(listing.restaurantId) ||
            `Restaurant ${listing.restaurantId}`,
          restaurantId: listing.restaurantId,
          remaining: `${listing.remainingQuantity} / ${listing.totalQuantity}`,
          remainingQty: listing.remainingQuantity,
          perPersonLimit: listing.perPersonLimit,
          availableUntil: formatTime(listing.availableUntil),
          availableUntilRaw: listing.availableUntil,
          location: listing.pickupLocation || "Campus pickup",
          status,
        };
      });

      setItems(dedupeItemsByRestaurantAndTitle(mappedItems));
    } catch (err) {
      setError(err.message || "Failed to load food listings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadListings();
  }, []);

  const restaurants = useMemo(() => {
    const set = new Set(items.map((x) => x.restaurant));
    return ["All Restaurants", ...Array.from(set)];
  }, [items]);

  const visibleItems = useMemo(() => {
    if (selectedRestaurant === "All Restaurants") return items;
    return items.filter((x) => x.restaurant === selectedRestaurant);
  }, [items, selectedRestaurant]);

  function openModal(item) {
    setSelectedItem(item);
  }

  function closeModal() {
    setSelectedItem(null);
  }

  async function handleClaim(item, qty) {
    if (!session?.userId) {
      setError("Please log in before claiming food.");
      return;
    }

    try {
      await createClaim({
        listingId: item.id,
        studentId: session.userId,
        quantity: qty,
      });

      closeModal();
      await loadListings();
      alert("Claim created successfully.");
    } catch (err) {
      setError(err.message || "Could not create claim");
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
    <div className="studentPage">
      <header className="nav">
        <div className="brand">
          <div className="brandIcon">UB</div>
          <div className="brandText">UniBite</div>
        </div>

        <nav className="navLinks">
          <a className="navLink active" href="/StudentFoodPage">
            Browse Food
          </a>
          <a className="navLink" href="/StudentClaimsPage">
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
        <div className="headerRow">
          <div>
            <h1 className="pageTitle">Available Food</h1>
            <p className="pageSub">
              Grab surplus meals from campus restaurants
            </p>
          </div>

          <select
            className="dropdown"
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
          >
            {restaurants.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {loading && <div className="empty">Loading listings...</div>}
        {error && <div className="empty">{error}</div>}

        {!loading && !error && (
          <div className="grid">
            {visibleItems.length === 0 ? (
              <div className="empty">No listings found.</div>
            ) : (
              visibleItems.map((item) => (
                <FoodCard
                  key={item.id}
                  item={item}
                  onClick={() => openModal(item)}
                />
              ))
            )}
          </div>
        )}
      </main>

      {selectedItem && (
        <ClaimModal
          item={selectedItem}
          onClose={closeModal}
          onClaim={handleClaim}
        />
      )}
    </div>
  );
}

function FoodCard({ item, onClick }) {
  return (
    <button className="card cardBtn" onClick={onClick} type="button">
      <div className="cardTop">
        <h2 className="cardTitle">{item.title}</h2>
        <span className={`pill ${pillClass(item.status)}`}>{item.status}</span>
      </div>

      <p className="cardDesc">{item.description}</p>

      <div className="details">
        <div className="row">
          <span className="label">Restaurant</span>
          <span className="value">{item.restaurant}</span>
        </div>

        <div className="row">
          <span className="label">Remaining</span>
          <span className="value">{item.remaining}</span>
        </div>

        <div className="row">
          <span className="label">Per Person Limit</span>
          <span className="value">{item.perPersonLimit}</span>
        </div>

        <div className="row">
          <span className="label">Available Until</span>
          <span className="value">{item.availableUntil}</span>
        </div>
      </div>

      <div className="divider" />
      <div className="location">📍 {item.location}</div>
    </button>
  );
}

function ClaimModal({ item, onClose, onClaim }) {
  const [qty, setQty] = useState(1);
  const left = item.remainingQty;
  const isExpired = item.status === "Expired";

  function submitClaim(e) {
    e.preventDefault();
    const safeQty = Math.max(1, Math.min(qty, item.perPersonLimit, left));
    onClaim(item, safeQty);
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h3 className="modalTitle">Claim Food</h3>
          <button className="modalClose" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="modalBody">
          <h2 className="modalItemTitle">{item.title}</h2>
          <p className="modalSub">
            {item.restaurant} — {item.location}
          </p>

          <div className="modalInfo">
            <div className="infoRow">
              <span className="infoLabel">Available</span>
              <span className="infoValue">{left} left</span>
            </div>
            <div className="infoRow">
              <span className="infoLabel">Per Person Limit</span>
              <span className="infoValue">{item.perPersonLimit}</span>
            </div>
            <div className="infoRow">
              <span className="infoLabel">Pickup Before</span>
              <span className="infoValue">{item.availableUntil}</span>
            </div>
          </div>

          <form onSubmit={submitClaim}>
            <label className="modalLabel">Quantity</label>
            <input
              className="modalInput"
              type="number"
              min={1}
              max={Math.min(item.perPersonLimit, left)}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              disabled={isExpired}
            />

            <button className="claimBtn" type="submit" disabled={isExpired}>
              Claim {qty} item{qty > 1 ? "s" : ""}
            </button>

            {isExpired && (
              <p className="modalHint">
                This item is expired and cannot be claimed.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function pillClass(status) {
  if (status === "Available") return "pillGreen";
  if (status === "Expired") return "pillGray";
  if (status === "Low Stock") return "pillYellow";
  return "pillGray";
}

function computeStatus(listing) {
  const isExpired = listing.availableUntil
    ? Date.parse(listing.availableUntil) < Date.now()
    : false;

  if (isExpired || listing.remainingQuantity <= 0) {
    return "Expired";
  }

  if (listing.remainingQuantity <= Math.max(1, Math.floor(listing.totalQuantity / 4))) {
    return "Low Stock";
  }

  return "Available";
}

function formatTime(value) {
  if (!value) return "N/A";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
}

function dedupeItemsByRestaurantAndTitle(items) {
  const map = new Map();

  for (const item of items) {
    const key = `${item.restaurantId}::${String(item.title || "").trim().toLowerCase()}`;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, item);
      continue;
    }

    // Keep the one with more remaining quantity; tie-break by newer id.
    const shouldReplace =
      item.remainingQty > existing.remainingQty ||
      (item.remainingQty === existing.remainingQty && item.id > existing.id);

    if (shouldReplace) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}
