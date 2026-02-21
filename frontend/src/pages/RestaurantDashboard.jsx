import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useMemo, useState } from "react";
import {
  clearSession,
  createListing,
  getClaimsByListing,
  getListingsByRestaurant,
  getUsers,
  getSession,
  logout,
  redeemByToken,
} from "../lib/api";
import "./RestaurantDashboard.css";

export default function RestaurantDashboard() {
  const session = getSession();

  const [activeTab, setActiveTab] = useState("My Postings");
  const [postings, setPostings] = useState([]);
  const [claims, setClaims] = useState([]);
  const [userNameById, setUserNameById] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingPosting, setEditingPosting] = useState(null);

  const [qrToken, setQrToken] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [lastScan, setLastScan] = useState("");

  async function loadDashboard() {
    if (!session?.userId) {
      setError("Please log in first.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [listingRows, users] = await Promise.all([
        getListingsByRestaurant(session.userId),
        getUsers(),
      ]);

      const claimGroups = await Promise.all(
        listingRows.map(async (listing) => {
          try {
            const rows = await getClaimsByListing(listing.id);
            return rows;
          } catch {
            return [];
          }
        }),
      );

      const flatClaims = claimGroups.flat();
      const claimsByListing = new Map();

      for (const claim of flatClaims) {
        claimsByListing.set(
          claim.listingId,
          (claimsByListing.get(claim.listingId) || 0) + 1,
        );
      }

      setPostings(
        listingRows.map((listing) => ({
          id: listing.id,
          title: listing.title,
          description: listing.description || "No description",
          totalQty: listing.totalQuantity,
          remainingQty: listing.remainingQuantity,
          perPersonLimit: listing.perPersonLimit,
          claims: claimsByListing.get(listing.id) || 0,
          availableUntil: toDatetimeLocal(listing.availableUntil),
          status: computeStatus(listing),
          pickupLocation: listing.pickupLocation || "Campus pickup",
        })),
      );

      setClaims(flatClaims);
      setUserNameById(
        new Map(users.map((u) => [u.id, u.displayName || u.email || `User ${u.id}`])),
      );
    } catch (err) {
      setError(err.message || "Failed to load restaurant dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary = useMemo(() => {
    const totalItems = postings.length;
    const remaining = postings.reduce((sum, p) => sum + p.remainingQty, 0);
    const totalClaims = claims.length;
    return { totalItems, remaining, totalClaims };
  }, [postings, claims]);

  function openEdit(posting) {
    setEditingPosting(posting);
  }

  function closeEdit() {
    setEditingPosting(null);
  }

  async function saveEdit(updated) {
    if (typeof updated.id === "string" && updated.id.startsWith("new-")) {
      try {
        await createListing({
          restaurantId: session.userId,
          title: updated.title,
          description: updated.description,
          totalQuantity: Number(updated.totalQty),
          perPersonLimit: Number(updated.perPersonLimit),
          pickupLocation: updated.pickupLocation,
          availableUntil: new Date(updated.availableUntil).toISOString(),
        });

        closeEdit();
        await loadDashboard();
      } catch (err) {
        setError(err.message || "Could not create listing");
      }
      return;
    }

    setPostings((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    closeEdit();
    alert("Backend does not expose listing update endpoint yet. Saved locally only.");
  }

  function deletePosting() {
    alert("Backend does not expose listing delete endpoint yet.");
  }

  function newPosting() {
    const template = {
      id: `new-${Date.now()}`,
      title: "New Item",
      description: "Describe your item...",
      totalQty: 10,
      remainingQty: 10,
      perPersonLimit: 1,
      claims: 0,
      availableUntil: toDatetimeLocal(new Date().toISOString()),
      status: "Available",
      pickupLocation: "Campus pickup",
    };
    setEditingPosting(template);
  }

  async function handleRedeem(token) {
    const resolvedToken = resolveRedeemToken(token, claims);
    if (!resolvedToken) return;

    try {
      const redeemed = await redeemByToken(resolvedToken);
      setQrToken(resolvedToken);
      setLastScan(`${resolvedToken} (Claim #${redeemed.id} redeemed)`);
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Could not redeem token");
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
    <div className="restaurantPage">
      <header className="nav">
        <div className="brand">
          <div className="brandIcon">UB</div>
          <div className="brandText">UniBite</div>
        </div>

        <nav className="navLinks">
          {["My Postings", "Claims", "QR Scanner", "Profile"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`navTab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="navRight">
          <span className="placeName">
            {session?.displayName || session?.email || "restaurant@unibite"}
          </span>
          <a className="logout" href="/LoginPage" onClick={handleLogout}>
            Logout
          </a>
        </div>
      </header>

      <main className="container">
        {error && <div className="empty">{error}</div>}
        {loading && <div className="empty">Loading dashboard...</div>}

        {!loading && activeTab === "My Postings" && (
          <>
            <div className="pageHeader">
              <div>
                <h1 className="pageTitle">My Postings</h1>
                <p className="pageSub">Manage your surplus food listings</p>
              </div>

              <button className="newBtn" type="button" onClick={newPosting}>
                + New Posting
              </button>
            </div>

            <div className="statsGrid">
              <StatCard number={summary.totalItems} label="Total Items" />
              <StatCard number={summary.remaining} label="Remaining" />
              <StatCard number={summary.totalClaims} label="Total Claims" />
            </div>

            <div className="postingList">
              {postings.map((p) => (
                <PostingRow
                  key={p.id}
                  posting={p}
                  onEdit={() => openEdit(p)}
                  onDelete={() => deletePosting(p.id)}
                />
              ))}
            </div>
          </>
        )}

        {!loading && activeTab === "Claims" && (
          <ClaimsPage
            claims={claims}
            postings={postings}
            userNameById={userNameById}
          />
        )}

        {!loading && activeTab === "QR Scanner" && (
          <QRScannerPage
            qrToken={qrToken}
            setQrToken={setQrToken}
            setIsCameraOpen={setIsCameraOpen}
            lastScan={lastScan}
            onLookup={() => handleRedeem(qrToken)}
          />
        )}

        {!loading && activeTab === "Profile" && <RestaurantProfileSection />}
      </main>

      {editingPosting && (
        <EditPostingModal
          posting={editingPosting}
          onClose={closeEdit}
          onSave={saveEdit}
        />
      )}

      {isCameraOpen && (
        <CameraModal
          onClose={() => setIsCameraOpen(false)}
          onScan={async (decodedText) => {
            setQrToken(decodedText);
            await handleRedeem(decodedText);
            setIsCameraOpen(false);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ number, label }) {
  return (
    <div className="statCard">
      <div className="statNumber">{number}</div>
      <div className="statLabel">{label}</div>
    </div>
  );
}

function PostingRow({ posting, onEdit, onDelete }) {
  return (
    <div className="postingCard">
      <div className="postingTop">
        <div className="postingTitleRow">
          <h3 className="postingTitle">{posting.title}</h3>
          <span className={`pill ${pillClass(posting.status)}`}>
            {posting.status}
          </span>
        </div>

        <div className="actions">
          <button className="editBtn" type="button" onClick={onEdit}>
            Edit
          </button>
          <button className="delBtn" type="button" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      <p className="postingDesc">{posting.description}</p>

      <div className="metaRow">
        <span>
          Qty: {posting.remainingQty} / {posting.totalQty}
        </span>
        <span>Limit: {posting.perPersonLimit}/person</span>
        <span>Claims: {posting.claims}</span>
        <span>Until: {formatDateTime(posting.availableUntil)}</span>
      </div>
    </div>
  );
}

function ClaimsPage({ claims, postings, userNameById }) {
  const [filter, setFilter] = useState("All");

  const postingById = useMemo(() => {
    return new Map(postings.map((p) => [p.id, p]));
  }, [postings]);

  const visibleClaims =
    filter === "All" ? claims : claims.filter((c) => c.status === filter);

  return (
    <div className="claimsWrap">
      <h1 className="claimsTitle">Claims Management</h1>

      <div className="claimsToggle">
        <button
          type="button"
          className={`toggleBtn ${filter === "All" ? "active" : ""}`}
          onClick={() => setFilter("All")}
        >
          All
        </button>

        <button
          type="button"
          className={`toggleBtn ${filter === "CLAIMED" ? "active" : ""}`}
          onClick={() => setFilter("CLAIMED")}
        >
          Claimed
        </button>

        <button
          type="button"
          className={`toggleBtn ${filter === "REDEEMED" ? "active" : ""}`}
          onClick={() => setFilter("REDEEMED")}
        >
          Redeemed
        </button>
      </div>

      <div className="claimsList">
        {visibleClaims.length === 0 ? (
          <div className="empty">No claims found.</div>
        ) : (
          visibleClaims.map((c) => (
            <ClaimCard
              key={c.id}
              claim={c}
              posting={postingById.get(c.listingId)}
              userNameById={userNameById}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ClaimCard({ claim, posting, userNameById }) {
  return (
    <div className="claimCard">
      <div className="claimTop">
        <div>
          <div className="claimItem">{posting?.title || `Listing #${claim.listingId}`}</div>
          <div className="claimBy">
            {userNameById.get(claim.studentId) || `Student ${claim.studentId}`}
          </div>
        </div>

        <span
          className={`claimPill ${
            claim.status === "CLAIMED" ? "pillBlue" : "pillGreen"
          }`}
        >
          {claim.status}
        </span>
      </div>

      <div className="claimInfoRow">
        <div className="claimInfo">
          <span className="claimLabel">Qty:</span> {claim.quantity}
        </div>

        <div className="claimInfo">
          <span className="claimLabel">Token:</span> {claim.qrToken}
        </div>

        <div className="claimInfo">
          <span className="claimLabel">Claimed:</span> {formatTime(claim.claimedAt)}
        </div>
      </div>

      {claim.redeemedAt && (
        <div className="claimRedeemed">
          <span className="claimLabel">Redeemed:</span> {formatTime(claim.redeemedAt)}
        </div>
      )}
    </div>
  );
}

function QRScannerPage({
  qrToken,
  setQrToken,
  setIsCameraOpen,
  lastScan,
  onLookup,
}) {
  return (
    <div className="qrWrap">
      <h1 className="qrTitle">QR Scanner</h1>
      <p className="qrSub">
        Scan a student's QR code to verify and redeem their food claim.
      </p>

      <div className="qrCard">
        <div className="qrCardTitle">Camera Scan</div>

        <button
          className="qrBigBtn"
          type="button"
          onClick={() => setIsCameraOpen(true)}
        >
          📷 Open Camera Scanner
        </button>
      </div>

      <div className="qrCard">
        <div className="qrCardTitle">Manual Entry</div>
        <div className="qrCardSub">Enter the student's QR token manually</div>

        <div className="qrRow">
          <input
            className="qrInput"
            placeholder="Paste QR token here"
            value={qrToken}
            onChange={(e) => setQrToken(e.target.value)}
          />
          <button className="qrLookupBtn" type="button" onClick={onLookup}>
            Redeem
          </button>
        </div>

        {lastScan && (
          <div className="qrLast">
            Last result: <span className="qrMono">{lastScan}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CameraModal({ onClose, onScan }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false,
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear().catch(() => {});
      },
      () => {},
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="cameraModal" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h3 className="modalTitle">Camera Scan</h3>
          <button className="modalClose" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="cameraBody">
          <div id="qr-reader" className="qrReader" />
          <p className="cameraHint">
            Point your webcam at the QR code. It will auto-detect.
          </p>
        </div>
      </div>
    </div>
  );
}

function EditPostingModal({ posting, onClose, onSave }) {
  const [title, setTitle] = useState(posting.title);
  const [description, setDescription] = useState(posting.description);
  const [totalQty, setTotalQty] = useState(posting.totalQty);
  const [perPersonLimit, setPerPersonLimit] = useState(posting.perPersonLimit);
  const [availableUntil, setAvailableUntil] = useState(posting.availableUntil);
  const [pickupLocation, setPickupLocation] = useState(posting.pickupLocation);

  function handleSubmit(e) {
    e.preventDefault();

    const updated = {
      ...posting,
      title,
      description,
      totalQty: Number(totalQty),
      perPersonLimit: Number(perPersonLimit),
      availableUntil,
      pickupLocation,
    };

    if (updated.remainingQty > updated.totalQty) {
      updated.remainingQty = updated.totalQty;
    }

    onSave(updated);
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h3 className="modalTitle">Edit Posting</h3>
          <button className="modalClose" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="modalBody" onSubmit={handleSubmit}>
          <label className="fieldLabel">Food Item Name</label>
          <input
            className="fieldInput"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label className="fieldLabel">Description</label>
          <textarea
            className="fieldTextarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="twoCol">
            <div>
              <label className="fieldLabel">Total Quantity</label>
              <input
                className="fieldInput"
                type="number"
                value={totalQty}
                onChange={(e) => setTotalQty(e.target.value)}
              />
            </div>

            <div>
              <label className="fieldLabel">Per Person Limit</label>
              <input
                className="fieldInput"
                type="number"
                value={perPersonLimit}
                onChange={(e) => setPerPersonLimit(e.target.value)}
              />
            </div>
          </div>

          <label className="fieldLabel">Pickup Location</label>
          <input
            className="fieldInput"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
          />

          <label className="fieldLabel">Available Until</label>
          <input
            className="fieldInput"
            type="datetime-local"
            value={availableUntil}
            onChange={(e) => setAvailableUntil(e.target.value)}
          />

          <button className="saveBtn" type="submit">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

function RestaurantProfileSection() {
  const session = getSession();
  const [restaurantName, setRestaurantName] = useState("Campus Restaurant");
  const [phone, setPhone] = useState("204-555-9999");
  const [location, setLocation] = useState("Campus");

  function handleSave(e) {
    e.preventDefault();
    alert("Backend profile endpoint is not available yet. Saved locally only.");
  }

  return (
    <div className="rpWrap">
      <h1 className="rpTitle">Restaurant Profile</h1>

      <div className="rpCard">
        <h2 className="rpCardTitle">Restaurant Details</h2>

        <form onSubmit={handleSave}>
          <label className="rpLabel">Manager Email</label>
          <input className="rpInput" value={session?.email || ""} disabled />

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

          <button className="rpSaveBtn" type="submit">
            Save Changes
          </button>
        </form>
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

function formatDateTime(dtLocal) {
  if (!dtLocal) return "N/A";
  return dtLocal.replace("T", ", ");
}

function formatTime(value) {
  if (!value) return "N/A";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
}

function toDatetimeLocal(value) {
  if (!value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(
    dt.getDate(),
  )}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function computeStatus(listing) {
  const isExpired = listing.availableUntil
    ? Date.parse(listing.availableUntil) < Date.now()
    : false;

  if (isExpired || listing.remainingQuantity <= 0) {
    return "Expired";
  }

  if (
    listing.remainingQuantity <= Math.max(1, Math.floor(listing.totalQuantity / 4))
  ) {
    return "Low Stock";
  }

  return "Available";
}

function normalizeQrToken(value) {
  const raw = (value || "").trim();
  if (!raw) return "";

  // Accept a direct token, URL query param (?qrToken=...), or UUID embedded in text.
  try {
    const url = new URL(raw);
    const fromQuery = url.searchParams.get("qrToken") || url.searchParams.get("token");
    if (fromQuery) return fromQuery.trim();
  } catch {
    // Not a URL; continue with pattern extraction.
  }

  const labeledMatch = raw.match(/(?:qrToken|token)\s*[:=]\s*([A-Za-z0-9-]+)/i);
  if (labeledMatch?.[1]) return labeledMatch[1].trim();

  const uuidMatch = raw.match(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
  );
  if (uuidMatch?.[0]) return uuidMatch[0];

  return raw;
}

function resolveRedeemToken(value, claims) {
  const normalizedToken = normalizeQrToken(value);
  if (!normalizedToken) return "";

  // Supports custom QR strings like "UniBite-Pickup-12345" by mapping claim id -> real qrToken.
  const claimIdMatch = normalizedToken.match(/pickup-(\d+)$/i);
  if (claimIdMatch?.[1]) {
    const claimId = Number(claimIdMatch[1]);
    const claim = claims.find((x) => x.id === claimId);
    if (claim?.qrToken) return claim.qrToken;
  }

  return normalizedToken;
}
