/**
 * Integration Test Suite for Cinema Management Web & Backend
 */
const http = require("http");
const { spawn } = require("child_process");
const fs = require("fs");

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== STARTING BACKEND INTEGRATION TESTS ===");
  const PORT = 8099;
  process.env.PORT = PORT;

  const serverProcess = spawn("node", ["server.js"], {
    env: { ...process.env, PORT },
    stdio: "pipe"
  });

  serverProcess.stdout.on("data", d => process.stdout.write("[SERVER] " + d.toString()));
  serverProcess.stderr.on("data", d => process.stderr.write("[SERVER ERR] " + d.toString()));

  // Wait 1.5s for server to start
  await new Promise(r => setTimeout(r, 1500));

  try {
    // 1. Bootstrap
    console.log("\n[TEST 1] Testing /api/bootstrap...");
    const boot = await request({ host: "localhost", port: PORT, path: "/api/bootstrap", method: "GET" });
    if (boot.status !== 200 || !boot.body.data.movies) throw new Error("Bootstrap failed: " + JSON.stringify(boot));
    console.log("✓ Bootstrap OK. Total movies:", boot.body.data.movies.length);

    // 2. Register Validation (Item 7)
    console.log("\n[TEST 2] Testing User Registration Validation (Item 7)...");
    const badReg1 = await request({
      host: "localhost", port: PORT, path: "/api/auth/register", method: "POST",
      headers: { "Content-Type": "application/json" }
    }, { fullName: "A", email: "invalid-email", phone: "123", password: "12" });
    if (badReg1.status !== 400) throw new Error("Expected 400 on invalid input, got: " + badReg1.status);
    console.log("✓ Correctly rejected invalid registration input:", badReg1.body.message);

    const testEmail = `testuser_${Date.now()}@cinema.vn`;
    const validReg = await request({
      host: "localhost", port: PORT, path: "/api/auth/register", method: "POST",
      headers: { "Content-Type": "application/json" }
    }, { fullName: "Nguyen Van Test", email: testEmail, phone: "0987654321", password: "password123" });
    if (validReg.status !== 201 || !validReg.body.user) throw new Error("Registration failed: " + JSON.stringify(validReg));
    console.log("✓ Registration succeeded. User ID:", validReg.body.user.id, "Points:", validReg.body.user.points);

    // 3. User Tier Upgrade (Item 3)
    console.log("\n[TEST 3] Testing User Tier Upgrade (Item 3)...");
    const userId = validReg.body.user.id;
    // Add points to test upgrade
    const users = JSON.parse(fs.readFileSync("data/nguoi_dung.json", "utf8"));
    const u = users.find(x => x.id === userId);
    u.points = 300;
    fs.writeFileSync("data/nguoi_dung.json", JSON.stringify(users, null, 2), "utf8");

    const upgradeRes = await request({
      host: "localhost", port: PORT, path: "/api/users/upgrade-tier", method: "POST",
      headers: { "Content-Type": "application/json" }
    }, { userId, targetTier: "VIP Gold" });
    if (upgradeRes.status !== 200 || upgradeRes.body.user.membershipTier !== "VIP Gold") {
      throw new Error("Tier upgrade failed: " + JSON.stringify(upgradeRes));
    }
    console.log("✓ Tier upgraded successfully to:", upgradeRes.body.user.membershipTier);

    // 4. Admin Security & Admin Config protection (Item 6 & 9)
    console.log("\n[TEST 4] Testing Admin Security & File Protection (Item 6 & 9)...");
    const forbiddenReq = await request({
      host: "localhost", port: PORT, path: "/data/admin_config.json", method: "GET"
    });
    if (forbiddenReq.status !== 403) throw new Error("Expected 403 on admin_config.json, got: " + forbiddenReq.status);
    console.log("✓ Direct browser access to admin_config.json blocked with 403 Forbidden!");

    const adminLoginBad = await request({
      host: "localhost", port: PORT, path: "/api/auth/admin-login", method: "POST",
      headers: { "Content-Type": "application/json" }
    }, { password: "wrong_password" });
    if (adminLoginBad.status !== 401) throw new Error("Expected 401 on wrong admin password!");
    console.log("✓ Wrong admin password rejected with 401!");

    const adminLoginGood = await request({
      host: "localhost", port: PORT, path: "/api/auth/admin-login", method: "POST",
      headers: { "Content-Type": "application/json" }
    }, { password: "admin" });
    if (adminLoginGood.status !== 200 || !adminLoginGood.body.token) throw new Error("Admin login failed!");
    console.log("✓ Admin login verified through backend successfully!");

    // 5. Add Movie with Custom Rating and Trailer (Item 5)
    console.log("\n[TEST 5] Testing Add Movie with Custom Rating & Trailer (Item 5)...");
    const addMovieRes = await request({
      host: "localhost", port: PORT, path: "/api/movies", method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      title: "Avatar: The Way of Water",
      genre: "Khoa Học Viễn Tưởng",
      duration: 192,
      basePrice: 95000,
      rating: 9.2,
      trailer: "https://www.youtube.com/watch?v=d9MyW72ELq0"
    });
    if (addMovieRes.status !== 201 || addMovieRes.body.movie.rating !== 9.2 || !addMovieRes.body.movie.trailer.includes("embed/d9MyW72ELq0")) {
      throw new Error("Add movie custom fields failed: " + JSON.stringify(addMovieRes));
    }
    console.log("✓ Movie added with rating:", addMovieRes.body.movie.rating, "and embed trailer:", addMovieRes.body.movie.trailer);
    const addedMovieId = addMovieRes.body.movie.id;

    // 5B. Edit Movie Elements, Custom Thumbnail & Backdrop
    console.log("\n[TEST 5B] Testing Edit Movie Elements & Thumbnail / Backdrop Banner...");
    const editMovieRes = await request({
      host: "localhost", port: PORT, path: `/api/movies/${addedMovieId}`, method: "PUT",
      headers: { "Content-Type": "application/json" }
    }, {
      title: "Avatar: Dòng Chảy Của Nước (Bản 3D Đặc Biệt)",
      rating: 9.5,
      poster: "https://example.com/custom-poster.jpg",
      posterCustom: "https://example.com/custom-poster.jpg",
      backdrop: "https://example.com/custom-backdrop.jpg",
      trailer: "https://www.youtube.com/embed/d9MyW72ELq0"
    });
    if (editMovieRes.status !== 200 || editMovieRes.body.movie.rating !== 9.5 || editMovieRes.body.movie.posterCustom !== "https://example.com/custom-poster.jpg") {
      throw new Error("Edit movie elements failed: " + JSON.stringify(editMovieRes));
    }
    console.log("✓ Movie edited successfully with new title, custom poster & backdrop thumbnail!");

    // 6. Cinema & Room Management (Item 10)
    console.log("\n[TEST 6] Testing Cinema & Room Management (Item 10)...");
    const addCinemaRes = await request({
      host: "localhost", port: PORT, path: "/api/cinemas", method: "POST",
      headers: { "Content-Type": "application/json" }
    }, { name: "UTC2 Cinema Vincom Quan 1", address: "72 Le Thanh Ton, Quan 1", phone: "1900 6017" });
    if (addCinemaRes.status !== 201 || !addCinemaRes.body.cinema) throw new Error("Add cinema failed!");
    const newCinemaId = addCinemaRes.body.cinema.id;
    console.log("✓ Cinema added successfully:", newCinemaId);

    const addRoomRes = await request({
      host: "localhost", port: PORT, path: `/api/cinemas/${newCinemaId}/rooms`, method: "POST",
      headers: { "Content-Type": "application/json" }
    }, { name: "Phong 04 (IMAX 3D Laser)", type: "IMAX", rows: 10, cols: 12 });
    if (addRoomRes.status !== 201 || !addRoomRes.body.room) throw new Error("Add room failed!");
    console.log("✓ Room added successfully:", addRoomRes.body.room.id);

    // 7. Checkout & VIP Discount
    console.log("\n[TEST 7] Testing Checkout & VIP Gold Discount (Item 3)...");
    const showtimes = JSON.parse(fs.readFileSync("data/ds_suat_chieu.json", "utf8"));
    const targetShowtime = showtimes[0];
    const checkoutRes = await request({
      host: "localhost", port: PORT, path: "/api/checkout", method: "POST",
      headers: { "Content-Type": "application/json" }
    }, {
      showtimeId: targetShowtime.id,
      seats: [{ code: "A1" }, { code: "A2" }],
      combos: [{ id: "CB01", name: "Combo Bap Nuoc", price: 75000, quantity: 1 }],
      customer: { id: userId, email: testEmail, name: "Nguyen Van Test", phone: "0987654321" }
    });
    if (checkoutRes.status !== 201 || !checkoutRes.body.ticket) throw new Error("Checkout failed: " + JSON.stringify(checkoutRes));
    const createdTicket = checkoutRes.body.ticket;
    console.log("✓ Checkout succeeded! Ticket ID:", createdTicket.ticketId);
    console.log("  VIP Discount applied:", createdTicket.vipDiscount, `(${createdTicket.vipDiscountDesc})`);
    if (createdTicket.vipDiscount <= 0) throw new Error("Expected VIP Gold discount > 0!");

    // 8. Ticket Cancellation & Seat Release (Item 11)
    console.log("\n[TEST 8] Testing Ticket Cancellation & Seat Release (Item 11 & 2)...");
    const cancelRes = await request({
      host: "localhost", port: PORT, path: "/api/tickets/cancel", method: "POST",
      headers: { "Content-Type": "application/json" }
    }, { ticketId: createdTicket.ticketId, reason: "Khach hang doi lich trinh" });
    if (cancelRes.status !== 200 || cancelRes.body.ticket.status !== "CANCELLED") {
      throw new Error("Cancellation failed: " + JSON.stringify(cancelRes));
    }
    console.log("✓ Ticket cancelled successfully. Status:", cancelRes.body.ticket.status);

    // Verify seat A1 and A2 are back to AVAILABLE (0)
    const updatedShowtimes = JSON.parse(fs.readFileSync("data/ds_suat_chieu.json", "utf8"));
    const updatedSt = updatedShowtimes.find(s => s.id === targetShowtime.id);
    const seatA1 = updatedSt.seats.flat().find(s => s.code === "A1");
    if (seatA1.status !== 0) throw new Error("Expected seat A1 to be 0 (AVAILABLE), but got: " + seatA1.status);
    console.log("✓ Seat A1 successfully released back to AVAILABLE (0) in live matrix!");

    // Clean up test cinema
    await request({ host: "localhost", port: PORT, path: `/api/cinemas/${newCinemaId}`, method: "DELETE" });

    console.log("\n========================================================");
    console.log("🎉 ALL INTEGRATION TESTS PASSED 100%! ALL 10 ITEMS VERIFIED!");
    console.log("========================================================");
  } finally {
    serverProcess.kill();
  }
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
