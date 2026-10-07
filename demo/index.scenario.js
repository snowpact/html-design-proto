/* Demo — "Reserve a bike before walking to the station".
   Built with: node bin/build.js build demo/index.scenario.js --inline --lang en */

const P = DesignProto;

const reserveSheet = (step) => `<div class="app app-pad">
  <p class="app-h">Central Station</p><p class="app-sub">6 bikes · 2 min walk</p>
  ${step === "pick" ? `<div class="app-card dp-new"><div><b>Reserve for 10 minutes</b><small>Free · cancels itself after 10 min</small></div><span class="app-pill">New</span></div>` : ""}
  ${step === "held" ? `<div class="app-card"><div><b>Bike #482 is yours</b><small>Held until 08:52</small></div><span class="app-pill">9:58</span></div>` : ""}
  <div class="app-btn">${step === "held" ? "Unlock bike #482" : "Reserve"}</div></div>`;

const fleetTable = (withColumn) => `<div class="web"><div class="web-side"><b>Bike Share · Ops</b><span class="on">Stations</span><span>Bikes</span><span>Incidents</span></div>
  <div class="web-main"><p class="app-h" style="font-family:inherit">Stations</p>
  <table class="web-table"><thead><tr><th>Station</th><th>Bikes</th><th>Docks free</th>${withColumn ? `<th>Reserved ${P.mark()}</th>` : ""}</tr></thead><tbody>
  ${[["Central Station", 6, 4, 2], ["Harbour", 2, 10, 0], ["Market Square", 4, 6, 1]].map(([n, b, d, r]) => `<tr><td>${n}</td><td>${b}</td><td>${d}</td>${withColumn ? `<td>${r}</td>` : ""}</tr>`).join("")}
  </tbody></table></div></div>`;

DesignProto.init({
  lang: "en",
  title: "Bike Share — reserve before you walk",
  url: "app.bikeshare.example",
  links: [{ label: "Scoping note", href: "https://github.com/snowpact/html-design-proto" }],
  lots: [{ id: 1, label: "reserve" }, { id: 2, label: "ops" }, { id: "later", label: "Later" }],
  scenarios: [
    { tab: "The problem", steps: [
      { kicker: "The problem", title: "The bike is gone by the time you get there", text: "Riders pick a station on the map, walk five minutes, and find it empty. Support gets the complaints, ops sees nothing.",
        slide: () => P.board("The bike is gone by the time you get there",
          "A rider picks a station with bikes, walks there, and someone else took the last one. Nothing in the app holds a bike, and the ops team can't see demand before it happens.",
          P.flow([{ title: "Sam opens the map", text: "Central Station: 1 bike" }, { title: "Walks 5 minutes", text: "nothing is held", kind: "ko" }, { title: "Station empty", text: "Sam opens a support ticket", kind: "ko" }]),
          P.cards([
            { title: "What exists", tag: P.state("ok", "app + ops"), items: ["Live bike count per station.", "Unlock by QR code, pay per minute."] },
            { title: "What's missing", tag: P.state("todo", "app"), items: ["No way to hold a bike.", "Ops can't see who is on their way."] },
            { title: "The proposal", tag: P.yes("this project"), win: true, items: ["Reserve a bike for 10 minutes, for free.", "Show reservations to the ops team."] },
          ])) },
    ] },
    { tab: "The app", persona: SAM, steps: [
      { kicker: "Today", title: "Find a station, then hope", text: "The map shows live counts, but nothing holds a bike.", tag: "now",
        phones: [{ html: mapScreen(), tabBar: tabBar("Map") }] },
      { kicker: "Batch 1 · reserve", lot: 1, title: "Reserve from the map", text: "A new button under the station card. One tap holds a bike for ten minutes.", tag: "new",
        phones: [{ html: mapScreen(), tabBar: tabBar("Map"), tag: "now", caption: "Today" }, { html: mapScreen({ reserve: true }), tabBar: tabBar("Map"), tag: "new", caption: "With the reserve button", highlight: true, lot: 1 }] },
      { kicker: "Batch 1 · reserve", lot: 1, title: "Pick, hold, unlock", text: "The three steps on one screen: pick the station, the bike is held, unlock on arrival.", tag: "new",
        phones: [{ html: reserveSheet("pick"), caption: "1. Reserve" }, { html: reserveSheet("held"), caption: "2. Held for 10 minutes" }, { html: rideScreen(), dark: false, caption: "3. Riding" }],
        phonesOptions: { arrows: true } },
      { kicker: "Batch 1 · reserve", lot: 1, title: "Same flow on Android", text: "Nothing platform-specific: the reservation lives on the server.", tag: "new",
        phones: [{ html: reserveSheet("pick"), device: "android", time: "08:42" }, { html: reserveSheet("held"), device: "android", time: "08:43" }] },
    ] },
    { tab: "Ops", persona: NOOR, steps: [
      { kicker: "Today", title: "The stations table", text: "Bikes and free docks per station, refreshed every minute.", tag: "now", url: "ops.bikeshare.example/stations", screen: () => fleetTable(false) },
      { kicker: "Batch 2 · ops", lot: 2, title: "A « Reserved » column", text: "One column, next to the bike count. Ops can move bikes before a station runs dry.", tag: "new", url: "ops.bikeshare.example/stations", screen: () => fleetTable(true) },
    ] },
    { tab: "Decisions", steps: [
      { kicker: "Decision", title: "How long should a reservation last?", text: "Ten minutes covers a five-minute walk with margin, without locking bikes for nothing.",
        slide: () => P.board("How long should a reservation last?", "Long enough to walk to the station, short enough that a held bike doesn't sit idle.",
          P.cards([
            { title: "5 minutes", tag: P.no("too short"), pros: ["Bikes go back to the pool fast."], cons: ["Riders more than 3 minutes away can't make it."] },
            { title: "10 minutes", tag: P.yes("recommended"), win: true, pros: ["Covers the walking radius shown on the map."], cons: ["A held bike is unavailable for up to 10 minutes."] },
          ]),
          P.verdict("Recommendation: 10 minutes, free, one reservation at a time per rider.", "check")) },
      { kicker: "Decision", title: "What exists, what we add", text: "Most of the plumbing is there. The new parts are the hold and the column.",
        slide: () => P.board("What exists, what we add", "",
          P.table(["Piece", "", "Note"], [
            ["Live bike count", P.state("ok", "exists"), "Already refreshed every minute"],
            ["Hold a bike", P.state("todo", "new"), "Batch 1: a 10-minute lock on one bike"],
            ["Reserved column", P.state("todo", "new"), "Batch 2: ops table"],
            ["Paid reservations", P.state("warn", "later"), "Only if holds get abused"],
          ])) },
      { kicker: "Plan", title: "Two batches", text: "Riders first, ops second.",
        slide: () => P.board("Two batches", "",
          P.lots([
            { lot: 1, title: "Reserve", state: "Batch 1", items: ["Reserve button on the station card.", "10-minute hold, cancels itself.", "Unlock the held bike."] },
            { lot: 2, title: "Ops", state: "Batch 2", items: ["« Reserved » column in the stations table."] },
            { lot: "later", num: "·", title: "Later", state: "Later", items: ["Paid reservations.", "Reserve a dock at the destination."] },
          ])) },
    ] },
  ],
});
