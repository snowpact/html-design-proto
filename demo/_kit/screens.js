/* Demo screens, shared by every prototype of this fictional project. */
const SAM = { name: "Sam Rivera", role: "rider, commutes by bike", color: "#0f766e" };
const NOOR = { name: "Noor Haddad", role: "fleet manager", color: "#7c3aed" };
const tabBar = (on) => `<div class="app-tabbar">${["Map", "Rides", "Wallet", "Profile"].map((t) => `<span class="${t === on ? "on" : ""}">${t}</span>`).join("")}</div>`;

function mapScreen({ reserve = false } = {}) {
  return `<div class="app app-pad"><p class="app-h">Ride across town</p><p class="app-sub">6 stations within 5 minutes</p>
    <div class="app-map"><span class="app-pin" style="left:30%;top:40%">6</span><span class="app-pin" style="left:62%;top:22%">2</span><span class="app-pin" style="left:55%;top:68%">4</span></div>
    <div class="app-card"><div><b>Central Station</b><small>6 bikes · 2 min walk</small></div><span class="app-pill">Open</span></div>
    ${reserve ? `<div class="app-btn ghost dp-new">Reserve for 10 min ${DesignProto.mark()}</div>` : ""}
    <div class="app-btn">Scan to unlock</div></div>`;
}
const rideScreen = () => `<div class="app app-pad"><p class="app-h">Ride in progress</p>
  <div class="app-stat"><div><b>12:40</b><small>time</small></div><div><b>$1.90</b><small>so far</small></div></div>
  <div class="app-map" style="height:200px"></div><div class="app-btn" style="background:#dc2626">End ride</div></div>`;
