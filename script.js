(() => {
  "use strict";

  const API_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwM2EzYzM0Zjg4MDNlMmNmOTkwNDRkMGNiYTJhZDRkMiIsIm5iZiI6MTc3MzI0MDMwMS40MDEsInN1YiI6IjY5YjE3ZmVkZDVkNmZkMjNhYTA5NDRlYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ec-LTPbqPDm-oq4QSmB1oVTIMG4YKON7svOcwgwhIXA";
  const IMG_BASE = "https://image.tmdb.org/t/p/";
  const REGION = "IN";
  const CACHE_PREFIX = "cc_tmdb_v3:";
  const SIX_HOURS = 1000 * 60 * 60 * 6;
  const ONE_DAY = 1000 * 60 * 60 * 24;
  const inFlight = new Map();

  const appState = {
    searchTimer: null,
    resultsPage: 1,
    resultsEndpoint: "",
    currentMovie: null,
    profile: null,
    profileKey: "",
    activeProfileTab: "favs",
    evergreenCategory: "all"
  };

  const STUDIOS = [
    { id: 420, name: "Marvel Studios", code: "MS", desc: "Hero arcs, multiverse runs and franchise marathons." },
    { id: 9993, name: "DC Entertainment", code: "DC", desc: "Gotham, Metropolis and darker comic-book worlds." },
    { id: 521, name: "DreamWorks", code: "DW", desc: "Animated adventures with big-screen scale." },
    { id: 2, name: "Walt Disney", code: "WD", desc: "Family classics, fantasy and modern tentpoles." },
    { id: 174, name: "Warner Bros.", code: "WB", desc: "Blockbusters, prestige films and genre staples." },
    { id: 33, name: "Universal", code: "UN", desc: "Monsters, action sagas and studio crowd-pleasers." },
    { id: 4, name: "Paramount", code: "PM", desc: "Mission runs, legacy hits and theatrical giants." },
    { id: 12, name: "New Line", code: "NL", desc: "Fantasy, horror and cult-favorite worlds." },
    { id: 923, name: "Pixar", code: "PX", desc: "Emotional animation with timeless rewatch value." },
    { id: 1632, name: "Lionsgate", code: "LG", desc: "Action, survival games and sharp genre releases." },
    { id: 25, name: "20th Century", code: "20", desc: "Sci-fi landmarks, dramas and studio classics." },
    { id: 7505, name: "Wizarding World", code: "HP", desc: "Magic-school lore and connected fantasy." }
  ];

  const MOODS = [
    { id: "energetic", label: "Energetic", desc: "Action, speed and momentum.", code: "AC", genre: 28 },
    { id: "melancholy", label: "Melancholy", desc: "Drama, memory and quiet impact.", code: "DR", genre: 18 },
    { id: "mind-bending", label: "Mind-Bending", desc: "Mystery, sci-fi and fractured reality.", code: "MB", genre: 9648 },
    { id: "relaxed", label: "Relaxed", desc: "Adventure and easy discovery.", code: "AD", genre: 12 },
    { id: "romantic", label: "Romantic", desc: "Connection, longing and warmth.", code: "RO", genre: 10749 },
    { id: "suspenseful", label: "Suspenseful", desc: "Thrillers, crime and pressure.", code: "TH", genre: 53 },
    { id: "laugh", label: "Laugh Out Loud", desc: "Comedy and clean escapism.", code: "CO", genre: 35 },
    { id: "animated", label: "Animated", desc: "Animation, family and visual imagination.", code: "AN", genre: 16 },
    { id: "dark", label: "Dark", desc: "Horror, noir and dread.", code: "HR", genre: 27 }
  ];

  const EVERGREEN_MOVIES = [
    { id: 278, title: "The Shawshank Redemption", year: "1994", cat: "hollywood", poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", vote_average: 8.7 },
    { id: 238, title: "The Godfather", year: "1972", cat: "hollywood", poster_path: "/3bhkrj58Vtu7enYsLe1rhdBt4i0.jpg", vote_average: 8.7 },
    { id: 424, title: "Schindler's List", year: "1993", cat: "hollywood", poster_path: "/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg", vote_average: 8.6 },
    { id: 129, title: "Spirited Away", year: "2001", cat: "animated", poster_path: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", vote_average: 8.5 },
    { id: 19404, title: "Dilwale Dulhania Le Jayenge", year: "1995", cat: "bollywood", poster_path: "/lfRkUr7DYdHldAw3IA0xXHh7Hu3.jpg", vote_average: 8.5 },
    { id: 15121, title: "Dil Chahta Hai", year: "2001", cat: "bollywood", poster_path: "/nBEFKpQLqxVZWmkfSTaUlLpXfvY.jpg", vote_average: 7.0 },
    { id: 10515, title: "Castle in the Sky", year: "1986", cat: "animated", poster_path: "/npOnzAbLh6VOIu3naU5g5sGPAbJ.jpg", vote_average: 8.0 },
    { id: 120, title: "The Lord of the Rings", year: "2001", cat: "hollywood", poster_path: "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", vote_average: 8.4 },
    { id: 862, title: "Toy Story", year: "1995", cat: "family", poster_path: "/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg", vote_average: 8.0 },
    { id: 585, title: "Monsters, Inc.", year: "2001", cat: "family", poster_path: "/sgheSKxZkttIe8ONsf2sWXPgip3.jpg", vote_average: 7.8 },
    { id: 149870, title: "3 Idiots", year: "2009", cat: "bollywood", poster_path: "/66A9MqXZyHKAaU0sK6sHRDLJhtX.jpg", vote_average: 8.0 },
    { id: 78, title: "Goodfellas", year: "1990", cat: "hollywood", poster_path: "/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg", vote_average: 8.5 },
    { id: 497, title: "The Green Mile", year: "1999", cat: "hollywood", poster_path: "/8VG8fDNiy50H4FedGwdSVUPoaJe.jpg", vote_average: 8.5 },
    { id: 769, title: "Good Will Hunting", year: "1997", cat: "hollywood", poster_path: "/bABCBKYBK7A5G1x0FzoeoNfuj2.jpg", vote_average: 8.2 },
    { id: 98, title: "Gladiator", year: "2000", cat: "hollywood", poster_path: "/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg", vote_average: 8.2 },
    { id: 372058, title: "Your Name", year: "2016", cat: "animated", poster_path: "/q719jXXEzOoYaps6babgKnONONX.jpg", vote_average: 8.5 },
    { id: 264644, title: "Room", year: "2015", cat: "hollywood", poster_path: "/mFQs5HTmMiZMvAuDqJxKSJLsIlF.jpg", vote_average: 8.0 },
    { id: 9806, title: "The Incredibles", year: "2004", cat: "family", poster_path: "/2LqaLgk4Z226KkgPJuiOQ58ShpS.jpg", vote_average: 7.7 }
  ];

  const DEFAULT_ROOMS = [
    { id: "marvel-mcu", name: "Marvel Universe", desc: "MCU releases, timelines and theories.", code: "MS", cat: "franchise", members: 1284, hot: true },
    { id: "dc-fans", name: "DC Universe", desc: "Batman, Superman and multiverse debates.", code: "DC", cat: "franchise", members: 876, hot: false },
    { id: "horror-hub", name: "Horror Hub", desc: "Slashers, dread, folklore and shocks.", code: "HR", cat: "genre", members: 543, hot: false },
    { id: "bollywood", name: "Bollywood Lounge", desc: "Hindi cinema from classics to new hits.", code: "BW", cat: "regional", members: 721, hot: true },
    { id: "sci-fi", name: "Sci-Fi Sector", desc: "Space, futures, technology and paradoxes.", code: "SF", cat: "genre", members: 612, hot: false },
    { id: "directors-cut", name: "Director's Cut", desc: "Cinematography, editing and film craft.", code: "DC", cat: "cinephile", members: 187, hot: false }
  ];

  const ROOM_CATEGORIES = ["franchise", "genre", "regional", "cinephile", "general"];
  const ROOM_CODES = ["CC", "MS", "DC", "SF", "HR", "BW", "AN", "FN", "IN", "CL", "NW", "TV"];
  const PROFILE_GENRES = ["Action", "Drama", "Comedy", "Thriller", "Romance", "Sci-Fi", "Horror", "Animation", "Adventure", "Mystery", "Crime", "Fantasy"];
  const AVATAR_SEEDS = ["nova", "orbit", "pixel", "lumen", "signal", "vertex", "echo", "prism", "ion", "flux", "comet", "matrix", "neon", "atlas", "ripple", "pulse"];

  function $(selector, scope = document) {
    return scope.querySelector(selector);
  }

  function $all(selector, scope = document) {
    return Array.from(scope.querySelectorAll(selector));
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(value) {
    return escapeHTML(value);
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getUser() {
    return localStorage.getItem("userSession") || "";
  }

  function getProfile(username = getUser()) {
    return readJSON(`cc_profile_${username}`, {});
  }

  function avatarUrl(seed = "guest") {
    const profile = getProfile(seed);
    if (profile.avatarUrl) return profile.avatarUrl;
    return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(seed || "guest")}`;
  }

  function placeholderImage(text, width = 342, height = 513) {
    const label = escapeHTML(String(text || "No Poster").slice(0, 32));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#111827"/><rect x="14" y="14" width="${width - 28}" height="${height - 28}" fill="none" stroke="#4df0b1" stroke-opacity=".35"/><text x="50%" y="50%" fill="#8f9bb3" font-family="Arial" font-size="22" text-anchor="middle">${label}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function posterUrl(path, size = "w342", title = "No Poster") {
    if (!path) return placeholderImage(title);
    if (/^https?:\/\//i.test(path)) return path;
    return `${IMG_BASE}${size}${path}`;
  }

  function backdropUrl(path, size = "w1280") {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return `${IMG_BASE}${size}${path}`;
  }

  function getCached(urlKey) {
    try {
      const raw = sessionStorage.getItem(CACHE_PREFIX + urlKey);
      if (!raw) return null;
      const cached = JSON.parse(raw);
      if (cached.expires > Date.now()) return cached.data;
      sessionStorage.removeItem(CACHE_PREFIX + urlKey);
      return null;
    } catch {
      return null;
    }
  }

  function setCached(urlKey, data, ttl) {
    try {
      sessionStorage.setItem(CACHE_PREFIX + urlKey, JSON.stringify({
        expires: Date.now() + ttl,
        data
      }));
    } catch {
      // Storage can be full or disabled. The app still works without cache.
    }
  }
function fetchWithTimeout(url, options = {}, timeout = 6000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeout)
    )
  ]);
}
  async function tmdbFetch(endpoint, options = {}) {
    const ttl = options.ttl ?? SIX_HOURS;
    const url = new URL(endpoint, "https://api.themoviedb.org/3/");
    if (!url.searchParams.has("language")) url.searchParams.set("language", "en-US");
    const cacheKey = `${url.pathname}${url.search}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;
    if (inFlight.has(cacheKey)) return inFlight.get(cacheKey);

    const request = fetchWithTimeout(url.toString(), {
      headers: {
  Authorization: `Bearer ${API_TOKEN}`,
  "Content-Type": "application/json;charset=utf-8"
}
}, 6000)
      .then(async response => {
        if (!response.ok) throw new Error(`TMDB ${response.status}`);
        const data = await response.json();
        setCached(cacheKey, data, ttl);
        return data;
      })
      .finally(() => inFlight.delete(cacheKey));

    inFlight.set(cacheKey, request);
    return request;
  }

  function getFavorites() {
    return readJSON("myFavorites", []);
  }

  function saveFavorites(list) {
    writeJSON("myFavorites", list);
  }

  function getWatched() {
    return readJSON("myWatched", []);
  }

  function saveWatched(list) {
    writeJSON("myWatched", list);
  }

  function isMovieFavorite(movieId) {
    return getFavorites().some(movie => String(movie.id) === String(movieId));
  }

  function isMovieWatched(movieId) {
    return getWatched().some(movie => String(movie.id) === String(movieId));
  }

  function movieTitle(movie) {
    return movie.title || movie.name || "Untitled";
  }

  function movieYear(movie) {
    const date = movie.release_date || movie.first_air_date || "";
    return date ? date.slice(0, 4) : "TBA";
  }

  function ratingText(movie) {
    const value = Number(movie.vote_average || 0);
    return value > 0 ? value.toFixed(1) : "NR";
  }

  function buildCard(movie, options = {}) {
    const title = movieTitle(movie);
    const posterPath = movie.poster_path || movie.poster || "";
    const id = movie.id;
    const year = options.meta || movieYear(movie);
    const rating = options.rating || ratingText(movie);
    const favClass = isMovieFavorite(id) ? " active" : "";
    const watchedClass = isMovieWatched(id) ? " active" : "";
    const badge = options.badge ? `<span>${escapeHTML(options.badge)}</span>` : `<span>${escapeHTML(year)}</span>`;

    return `
      <article class="movie-card" data-movie-card data-id="${escapeAttr(id)}" tabindex="0">
        <div class="movie-poster">
         <img src="${escapeAttr(posterUrl(posterPath, "w342", title))}"
     loading="lazy"
     decoding="async"
     alt="${escapeAttr(title)} poster"
     onerror="this.onerror=null; this.src='${escapeAttr(placeholderImage(title))}'">
          <div class="card-actions">
            <button class="card-action${watchedClass}" type="button" data-action="toggle-watched" data-id="${escapeAttr(id)}" data-title="${escapeAttr(title)}" data-poster="${escapeAttr(posterPath)}" aria-label="Toggle watched">Seen</button>
            <button class="card-action${favClass}" type="button" data-action="toggle-favorite" data-id="${escapeAttr(id)}" data-title="${escapeAttr(title)}" data-poster="${escapeAttr(posterPath)}" aria-label="Toggle saved">Save</button>
          </div>
        </div>
        <div class="movie-meta">
          <h3>${escapeHTML(title)}</h3>
          <p>${badge}<span>Rate ${escapeHTML(rating)}</span></p>
        </div>
      </article>`;
  }

  function renderMovieList(container, movies, options = {}) {
    if (!container) return;
    if (!movies || movies.length === 0) {
      container.innerHTML = `<div class="empty-state">No movies found.</div>`;
      return;
    }
    const limit = options.limit || movies.length;
    container.innerHTML = movies.slice(0, limit).map(movie => buildCard(movie, options)).join("");
  }

  function showLoading(container) {
    if (container) container.innerHTML = `<div class="loader" aria-label="Loading"></div>`;
  }

  function showErrorState(container, message = "Unable to load this section right now.") {
    if (container) container.innerHTML = `<div class="empty-state">${escapeHTML(message)}</div>`;
  }

  function showToast(message) {
    $(".toast")?.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => {
      toast.classList.add("hide");
      window.setTimeout(() => toast.remove(), 240);
    }, 2600);
  }

  function goToDetails(movieId) {
    localStorage.setItem("selectedMovieId", String(movieId));
    window.location.href = "details.html";
  }

  function goToStudio(studioId, studioName) {
    localStorage.removeItem("selectedMood");
    localStorage.removeItem("selectedIntensity");
    localStorage.setItem("activeStudio", String(studioId));
    localStorage.setItem("activeStudioName", studioName);
    window.location.href = "results.html";
  }

  function toggleFavorite(movieId, movieTitle, posterPath) {
    const favorites = getFavorites();
    const exists = favorites.some(movie => String(movie.id) === String(movieId));
    const next = exists
      ? favorites.filter(movie => String(movie.id) !== String(movieId))
      : [{ id: movieId, title: movieTitle, poster: posterPath }, ...favorites];
    saveFavorites(next);
    syncMovieButtons(movieId);
    if (document.body.dataset.page === "profile") initProfile();
    if (document.body.dataset.page === "details") syncDetailActionButtons();
    showToast(exists ? "Removed from saved movies." : "Saved to your profile.");
  }

  function toggleWatched(movieId, movieTitle, posterPath) {
    const watched = getWatched();
    const exists = watched.some(movie => String(movie.id) === String(movieId));
    const next = exists
      ? watched.filter(movie => String(movie.id) !== String(movieId))
      : [{ id: movieId, title: movieTitle, poster: posterPath }, ...watched];
    saveWatched(next);
    syncMovieButtons(movieId);
    if (document.body.dataset.page === "profile") initProfile();
    if (document.body.dataset.page === "details") syncDetailActionButtons();
    showToast(exists ? "Removed from watched." : "Marked as watched.");
  }

  function syncMovieButtons(movieId) {
    $all(`[data-action="toggle-favorite"][data-id="${CSS.escape(String(movieId))}"]`).forEach(btn => {
      btn.classList.toggle("active", isMovieFavorite(movieId));
    });
    $all(`[data-action="toggle-watched"][data-id="${CSS.escape(String(movieId))}"]`).forEach(btn => {
      btn.classList.toggle("active", isMovieWatched(movieId));
    });
  }

  function setNavAvatar() {
    const img = $("#navAvatar");
    if (!img) return;
    const username = getUser() || "Guest";
    img.src = avatarUrl(username);
    img.alt = `${username} profile`;
  }

  function setActiveNav() {
    const page = location.pathname.split("/").pop() || "index.html";
    $all(".nav-links a").forEach(link => {
      link.classList.toggle("active", link.getAttribute("href") === page);
    });
  }

  function initSearch() {
    const input = $("#searchInput");
    const dropdown = $("#searchDropdown");
    if (!input || !dropdown) return;
    input.addEventListener("focus", () => {
      if (dropdown.innerHTML.trim()) dropdown.classList.add("open");
    });
  }

  async function searchMovies(query) {
    const dropdown = $("#searchDropdown");
    if (!dropdown) return;
    dropdown.innerHTML = `<div class="empty-state" style="min-height:80px">Searching...</div>`;
    dropdown.classList.add("open");

    try {
      const data = await tmdbFetch(`search/movie?query=${encodeURIComponent(query)}&include_adult=false`, { ttl: ONE_DAY });
      const movies = (data.results || []).slice(0, 8);
      if (movies.length === 0) {
        dropdown.innerHTML = `<div class="empty-state" style="min-height:80px">No movies found.</div>`;
        return;
      }

      dropdown.innerHTML = movies.map(movie => {
        const title = movieTitle(movie);
        return `
          <div class="search-result-item" data-movie-card data-id="${escapeAttr(movie.id)}">
            <img src="${escapeAttr(posterUrl(movie.poster_path, "w92", title))}" loading="lazy" alt="">
            <div class="search-result-info">
              <h4>${escapeHTML(title)}</h4>
              <p>${escapeHTML(movieYear(movie))}</p>
            </div>
            <span class="search-result-score">${escapeHTML(ratingText(movie))}</span>
          </div>`;
      }).join("");
    } catch {
      dropdown.innerHTML = `<div class="empty-state" style="min-height:80px">Search failed. Try again.</div>`;
    }
  }

  function setupCommon() {
    setActiveNav();
    setNavAvatar();
    initSearch();
  }

async function initHome() {
  renderStudios();
  renderEvergreenTabs();
  renderEvergreen("all");
  renderRoomsPreview();

  await Promise.allSettled([
    loadRow("trending/movie/week", "trendingRow", 6),
    loadRow(`movie/upcoming?region=${REGION}`, "upcomingRow", 6),
    loadHeroPosters()
  ]);
}

  function renderStudios() {
    const grid = $("#studioGrid");
    if (!grid) return;
    grid.innerHTML = STUDIOS.map(studio => `
      <button class="studio-card" type="button" data-action="go-studio" data-id="${studio.id}" data-name="${escapeAttr(studio.name)}">
        <span class="studio-icon">${escapeHTML(studio.code)}</span>
        <h3>${escapeHTML(studio.name)}</h3>
        <p>${escapeHTML(studio.desc)}</p>
      </button>`).join("");
  }

  async function loadRow(endpoint, containerId, limit) {
    const container = document.getElementById(containerId);
    showLoading(container);
    try {
      const data = await tmdbFetch(endpoint);
      renderMovieList(container, data.results || [], { limit });
    } catch {
      showErrorState(container);
    }
  }

  async function loadHeroPosters() {
    const holder = $("#heroPosters");
    if (!holder) return;
    try {
      const data = await tmdbFetch("trending/movie/week");
      const posters = (data.results || []).filter(movie => movie.poster_path).slice(0, 6);
      holder.innerHTML = posters.map(movie => `
        <img src="${escapeAttr(posterUrl(movie.poster_path, "w185", movieTitle(movie)))}" loading="lazy" decoding="async" alt="${escapeAttr(movieTitle(movie))}">`
      ).join("");
    } catch {
      holder.innerHTML = EVERGREEN_MOVIES.slice(0, 9).map(movie => `
        <img src="${escapeAttr(posterUrl(movie.poster_path, "w342", movie.title))}" loading="lazy" decoding="async" alt="${escapeAttr(movie.title)}">`
      ).join("");
    }
  }

  function renderEvergreenTabs() {
    const tabs = $("#evergreenTabs");
    if (!tabs) return;
    const items = [
      ["all", "All Time"],
      ["hollywood", "Hollywood"],
      ["bollywood", "Bollywood"],
      ["family", "Family"],
      ["animated", "Animated"]
    ];
    tabs.innerHTML = items.map(([cat, label]) => `
      <button class="chip ${cat === "all" ? "active" : ""}" type="button" data-action="switch-evergreen" data-category="${cat}">${label}</button>`
    ).join("");
  }

  function renderEvergreen(category) {
    appState.evergreenCategory = category;
    $all("#evergreenTabs .chip").forEach(button => {
      button.classList.toggle("active", button.dataset.category === category);
    });
    const grid = $("#evergreenGrid");
    if (!grid) return;
    const movies = category === "all"
      ? EVERGREEN_MOVIES
      : EVERGREEN_MOVIES.filter(movie => movie.cat === category);
    renderMovieList(grid, movies, { badge: "Classic" });
  }

  function renderRoomsPreview() {
    const grid = $("#roomsPreview");
    if (!grid) return;
    grid.innerHTML = DEFAULT_ROOMS.map(room => `
      <a class="room-card" href="chatrooms.html">
        <span class="room-icon">${escapeHTML(room.code)}</span>
        <h3>${escapeHTML(room.name)}</h3>
        <p>${escapeHTML(room.desc)}</p>
      </a>`).join("");
  }

  function initCrawl() {
    const grid = $("#moodGrid");
    if (!grid) return;
    grid.innerHTML = MOODS.map(mood => `
      <button class="mood-card" type="button" data-action="pick-mood" data-mood="${mood.id}">
        <span class="mood-icon">${escapeHTML(mood.code)}</span>
        <h3>${escapeHTML(mood.label)}</h3>
        <p>${escapeHTML(mood.desc)}</p>
      </button>`).join("");
  }

  function initIntensity() {
    const mood = localStorage.getItem("selectedMood") || "energetic";
    const selected = MOODS.find(item => item.id === mood) || MOODS[0];
    const label = $("#selectedMoodLabel");
    if (label) label.textContent = selected.label;
    const grid = $("#intensityGrid");
    if (!grid) return;
    grid.innerHTML = `
      <button class="mood-card" type="button" data-action="pick-intensity" data-level="1">
        <span class="mood-icon">L1</span>
        <h3>Light Scan</h3>
        <p>Popular picks with fast payoff and broad appeal.</p>
      </button>
      <button class="mood-card" type="button" data-action="pick-intensity" data-level="2">
        <span class="mood-icon">L2</span>
        <h3>Deep Signal</h3>
        <p>Higher-rated films with stronger critical weight.</p>
      </button>`;
  }

  function pickMood(mood) {
    localStorage.removeItem("activeStudio");
    localStorage.removeItem("activeStudioName");
    localStorage.setItem("selectedMood", mood);
    window.location.href = "intensity.html";
  }

  function pickIntensity(level) {
    localStorage.setItem("selectedIntensity", String(level));
    window.location.href = "results.html";
  }

  function initResults() {
    appState.resultsPage = 1;
    setResultsHeading();
    loadResults(1, true);
  }

  function currentResultsEndpoint(page) {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const studioId = localStorage.getItem("activeStudio");
    const mood = localStorage.getItem("selectedMood");
    const intensity = localStorage.getItem("selectedIntensity");

    if (mode === "trending") return `trending/movie/week?page=${page}`;
    if (mode === "toprated") return `movie/top_rated?page=${page}`;
    if (mode === "upcoming") return `movie/upcoming?region=${REGION}&page=${page}`;
    if (mode === "nowplaying") return `movie/now_playing?region=${REGION}&page=${page}`;
    if (studioId && !mood) return `discover/movie?with_companies=${encodeURIComponent(studioId)}&include_adult=false&page=${page}`;

    const selectedMood = MOODS.find(item => item.id === mood) || MOODS[0];
    let endpoint = `discover/movie?with_genres=${selectedMood.genre}&include_adult=false&page=${page}`;
    endpoint += intensity === "2"
      ? "&sort_by=vote_average.desc&vote_count.gte=400"
      : "&sort_by=popularity.desc";
    return endpoint;
  }

  function setResultsHeading() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const studioName = localStorage.getItem("activeStudioName");
    const mood = localStorage.getItem("selectedMood");
    const intensity = localStorage.getItem("selectedIntensity");
    const title = $("#pageTitle");
    const sub = $("#pageSubtitle");
    const tag = $("#pageTag");
    if (!title || !sub || !tag) return;

    const map = {
      trending: ["Trending This Week", "Live pulse from TMDB's weekly trend data.", "TRENDING"],
      toprated: ["Top Rated", "Audience and critical favorites with long-term signal.", "TOP RATED"],
      upcoming: ["Upcoming Movies", "Release-window watchlist for the next wave.", "UPCOMING"],
      nowplaying: ["Now Playing", "Current theatrical and streaming discovery lane.", "NOW PLAYING"]
    };

    if (map[mode]) {
      title.textContent = map[mode][0];
      sub.textContent = map[mode][1];
      tag.textContent = map[mode][2];
      return;
    }

    if (studioName && !mood) {
      title.textContent = `${studioName} Films`;
      sub.textContent = "Studio and franchise results.";
      tag.textContent = "UNIVERSE";
      return;
    }

    const selectedMood = MOODS.find(item => item.id === mood) || MOODS[0];
    title.textContent = `${selectedMood.label} Movies`;
    sub.textContent = intensity === "2" ? "Deep signal mode: high-rated and vote-tested." : "Light scan mode: popular and easy to enter.";
    tag.textContent = "THE CRAWL";
  }

 async function loadResults(page, clear) {
  const grid = $("#moviesGrid");
  const loadMore = $("#loadMoreBtn");
  if (!grid) return;

  if (clear) showLoading(grid);
  if (loadMore) loadMore.disabled = true;

  try {
    const data = await tmdbFetch(currentResultsEndpoint(page));

    const movies = data.results || [];

    // show only 8 movies from each API page
    const moviesToShow = movies.slice(0, 8);

    const html = moviesToShow.map(movie => buildCard(movie)).join("");

    if (clear) {
      grid.innerHTML = html || `<div class="empty-state">No movies found.</div>`;
    } else {
      grid.insertAdjacentHTML("beforeend", html);
    }

    appState.resultsPage = page;

    if (loadMore) {
      const hasMore = Number(data.total_pages || 0) > page;
      loadMore.hidden = !hasMore;
      loadMore.disabled = !hasMore;
    }
  } catch {
    showErrorState(grid);
  }
}

  async function initDetails() {
    const movieId = localStorage.getItem("selectedMovieId") || new URLSearchParams(location.search).get("id");
    if (!movieId) {
      window.location.href = "index.html";
      return;
    }

    const content = $("#detailContent");
    showLoading(content);
    try {
      const movie = await tmdbFetch(`movie/${movieId}?append_to_response=credits,videos,similar,watch/providers`, { ttl: ONE_DAY });
      appState.currentMovie = movie;
      document.title = `${movie.title || "Movie"} | CineCrawl`;
      renderDetails(movie);
      loadSavedReview(movie.id);
      syncDetailActionButtons();
    } catch {
      showErrorState(content, "Movie details could not be loaded.");
    }
  }

  function renderDetails(movie) {
    const heroBg = $("#detailBg");
    const content = $("#detailContent");
    const sections = $("#detailSections");
    const title = movieTitle(movie);
    const poster = posterUrl(movie.poster_path, "w500", title);
    const bg = backdropUrl(movie.backdrop_path || movie.poster_path, "w1280");
    if (heroBg && bg) heroBg.style.backgroundImage = `url("${bg}")`;

    const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : "Runtime TBA";
    const genres = (movie.genres || []).map(genre => `<span class="chip">${escapeHTML(genre.name)}</span>`).join("");

    content.innerHTML = `
      <img class="detail-poster" src="${escapeAttr(poster)}" alt="${escapeAttr(title)} poster" loading="eager">
      <div>
        <span class="eyebrow">Movie profile</span>
        <h1 class="detail-title">${escapeHTML(title)}</h1>
        <div class="chip-row">
          <span class="chip">${escapeHTML(movieYear(movie))}</span>
          <span class="chip">${escapeHTML(runtime)}</span>
          <span class="chip">Rate ${escapeHTML(ratingText(movie))}</span>
          ${genres}
        </div>
        <p class="detail-overview" style="margin-top:20px">${escapeHTML(movie.overview || "No overview available yet.")}</p>
        <div class="detail-actions">
          <button class="btn-secondary" type="button" id="detailFavBtn" data-action="toggle-favorite" data-id="${escapeAttr(movie.id)}" data-title="${escapeAttr(title)}" data-poster="${escapeAttr(movie.poster_path || "")}">Save</button>
          <button class="btn-secondary" type="button" id="detailSeenBtn" data-action="toggle-watched" data-id="${escapeAttr(movie.id)}" data-title="${escapeAttr(title)}" data-poster="${escapeAttr(movie.poster_path || "")}">Mark watched</button>
          <button class="btn-primary" type="button" data-action="focus-review">Rate film</button>
        </div>
      </div>`;

    sections.innerHTML = `
      ${renderWatchSection(movie)}
      ${renderCastSection(movie.credits?.cast || [])}
      ${renderTrailerSection(movie.videos?.results || [])}
      <section class="panel rating-panel" id="ratingPanel">
        <div>
          <span class="eyebrow">Your signal</span>
          <h2 class="section-title" style="font-size:2rem">Rate this film</h2>
        </div>
        <input type="range" min="1" max="10" value="5" class="slider" id="ratingSlider" aria-label="Rating">
        <strong id="ratingNum">5 / 10</strong>
        <textarea class="form-input" id="reviewText" placeholder="Write your review"></textarea>
        <div class="profile-actions">
          <button class="btn-primary" type="button" data-action="save-review">Save review</button>
          <button class="btn-secondary" type="button" data-action="clear-review">Clear</button>
        </div>
        <div id="savedReviewBox"></div>
      </section>
      ${renderSimilarSection(movie.similar?.results || [])}`;

    const slider = $("#ratingSlider");
    if (slider) updateRatingDisplay(slider.value);
  }

  function syncDetailActionButtons() {
    const movie = appState.currentMovie;
    if (!movie) return;
    const fav = $("#detailFavBtn");
    const seen = $("#detailSeenBtn");
    if (fav) {
      const active = isMovieFavorite(movie.id);
      fav.className = active ? "btn-primary" : "btn-secondary";
      fav.textContent = active ? "Saved" : "Save";
    }
    if (seen) {
      const active = isMovieWatched(movie.id);
      seen.className = active ? "btn-primary" : "btn-secondary";
      seen.textContent = active ? "Watched" : "Mark watched";
    }
  }

  function renderWatchSection(movie) {
    const data = movie["watch/providers"]?.results || {};
    const country = data.IN ? "IN" : data.US ? "US" : "";
    const countryData = country ? data[country] : null;
    const groups = countryData ? [...(countryData.flatrate || []), ...(countryData.free || []), ...(countryData.rent || []), ...(countryData.buy || [])] : [];
    const seen = new Set();
    const providers = groups.filter(provider => {
      if (seen.has(provider.provider_id)) return false;
      seen.add(provider.provider_id);
      return true;
    });
    const title = movieTitle(movie);
    const justWatch = `https://www.justwatch.com/in/search?q=${encodeURIComponent(title)}`;

    return `
      <section class="panel">
        <div class="section-head">
          <div>
            <span class="eyebrow">Availability</span>
            <h2 class="section-title" style="font-size:2rem">Where to watch</h2>
            <p class="section-sub">${country ? `Provider data for ${country}.` : "No provider data found."}</p>
          </div>
          <a class="btn-secondary" href="${justWatch}" target="_blank" rel="noreferrer">Check JustWatch</a>
        </div>
        <div class="provider-row">
          ${providers.length ? providers.map(provider => `
            <a class="provider-card" href="${justWatch}" target="_blank" rel="noreferrer">
              <img src="${escapeAttr(posterUrl(provider.logo_path, "w92", provider.provider_name))}" alt="">
              <span>${escapeHTML(provider.provider_name)}</span>
            </a>`).join("") : `<div class="empty-state" style="min-width:260px">Streaming data is not available yet.</div>`}
        </div>
      </section>`;
  }

  function renderCastSection(cast) {
    if (!cast.length) return "";
    return `
      <section class="panel">
        <div class="section-head"><h2 class="section-title" style="font-size:2rem">Cast</h2></div>
        <div class="cast-row">
          ${cast.slice(0, 14).map(person => `
            <div class="cast-card">
              <img src="${escapeAttr(posterUrl(person.profile_path, "w185", person.name))}" alt="${escapeAttr(person.name)}">
              <h4>${escapeHTML(person.name)}</h4>
              <p>${escapeHTML(person.character || "")}</p>
            </div>`).join("")}
        </div>
      </section>`;
  }

  function renderTrailerSection(videos) {
    const trailers = videos.filter(video => video.site === "YouTube").slice(0, 4);
    if (!trailers.length) return "";
    return `
      <section class="panel">
        <div class="section-head"><h2 class="section-title" style="font-size:2rem">Trailers</h2></div>
        <div class="provider-row">
          ${trailers.map(video => `
            <a class="provider-card" href="https://youtube.com/watch?v=${escapeAttr(video.key)}" target="_blank" rel="noreferrer">
              <img src="https://img.youtube.com/vi/${escapeAttr(video.key)}/mqdefault.jpg" alt="">
              <span>${escapeHTML(video.name || "Trailer")}</span>
            </a>`).join("")}
        </div>
      </section>`;
  }

  function renderSimilarSection(movies) {
    if (!movies.length) return "";
    return `
      <section class="panel">
        <div class="section-head"><h2 class="section-title" style="font-size:2rem">Similar movies</h2></div>
        <div class="movie-row">${movies.slice(0, 6).map(movie => buildCard(movie)).join("")}</div>
      </section>`;
  }

  function updateRatingDisplay(value) {
    const ratingNum = $("#ratingNum");
    if (ratingNum) ratingNum.textContent = `${value} / 10`;
  }

  function saveReview() {
    const movie = appState.currentMovie;
    if (!movie) return;
    const username = getUser() || "Guest";
    const ratingsKey = `cc_ratings_${username}`;
    const ratings = readJSON(ratingsKey, {});
    const score = $("#ratingSlider")?.value || "5";
    const review = $("#reviewText")?.value.trim() || "";
    ratings[movie.id] = {
      score,
      review,
      title: movieTitle(movie),
      date: new Date().toLocaleDateString()
    };
    writeJSON(ratingsKey, ratings);
    showSavedReview(ratings[movie.id]);
    showToast("Review saved.");
  }

  function loadSavedReview(movieId) {
    const ratings = readJSON(`cc_ratings_${getUser() || "Guest"}`, {});
    if (!ratings[movieId]) return;
    const rating = ratings[movieId];
    const slider = $("#ratingSlider");
    const text = $("#reviewText");
    if (slider) slider.value = rating.score || 5;
    if (text) text.value = rating.review || "";
    updateRatingDisplay(slider?.value || 5);
    showSavedReview(rating);
  }

  function showSavedReview(review) {
    const box = $("#savedReviewBox");
    if (!box) return;
    box.innerHTML = `
      <div class="review-row">
        <strong>Your review - ${escapeHTML(review.score)}/10</strong>
        <p class="muted">${escapeHTML(review.date || "")}</p>
        ${review.review ? `<p style="margin-top:8px">${escapeHTML(review.review)}</p>` : ""}
      </div>`;
  }

  function initProfile() {
    const username = getUser() || "Guest";
    appState.profileKey = `cc_profile_${username}`;
    appState.profile = readJSON(appState.profileKey, {});
    const users = readJSON("cc_users", {});
    const profile = appState.profile;
    const displayName = profile.displayName || users[username]?.name || username;

    $("#profilePic") && ($("#profilePic").src = avatarUrl(username));
    $("#profileName") && ($("#profileName").textContent = displayName);
    $("#profileHandle") && ($("#profileHandle").textContent = users[username]?.joined ? `Member since ${users[username].joined}` : `@${username}`);
    $("#inputName") && ($("#inputName").value = profile.displayName || "");
    $("#inputActor") && ($("#inputActor").value = profile.actor || "");
    $("#inputDirector") && ($("#inputDirector").value = profile.director || "");
    $("#inputStudio") && ($("#inputStudio").value = profile.studio || "");

    const favs = getFavorites();
    const watched = getWatched();
    const ratings = readJSON(`cc_ratings_${username}`, {});
    $("#statFavs") && ($("#statFavs").textContent = favs.length);
    $("#statWatched") && ($("#statWatched").textContent = watched.length);
    $("#statReviews") && ($("#statReviews").textContent = Object.keys(ratings).length);

    renderGenreTags();
    renderProfileLists(favs, watched, ratings);
    setProfileTab(appState.activeProfileTab);
  }

  function renderGenreTags() {
    const holder = $("#genreTags");
    if (!holder) return;
    const selected = new Set(appState.profile?.genres || []);
    holder.innerHTML = PROFILE_GENRES.map(genre => `
      <button class="tag ${selected.has(genre) ? "active" : ""}" type="button" data-action="toggle-genre" data-genre="${escapeAttr(genre)}">${escapeHTML(genre)}</button>`
    ).join("");
  }

  function renderProfileLists(favs, watched, ratings) {
    renderMovieList($("#favsGrid"), favs.map(movie => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster,
      vote_average: 0
    })));
    renderMovieList($("#watchedGrid"), watched.map(movie => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster,
      vote_average: 0
    })));

    const reviewsList = $("#reviewsList");
    if (!reviewsList) return;
    const entries = Object.entries(ratings);
    reviewsList.innerHTML = entries.length ? entries.map(([id, review]) => `
      <div class="review-row" data-movie-card data-id="${escapeAttr(id)}">
        <strong>${escapeHTML(review.title || `Movie ${id}`)}</strong>
        <p class="muted">${escapeHTML(review.score || "?")}/10 - ${escapeHTML(review.date || "")}</p>
        ${review.review ? `<p style="margin-top:8px">${escapeHTML(review.review.slice(0, 160))}</p>` : ""}
      </div>`).join("") : `<div class="empty-state">No reviews yet.</div>`;
  }

  function setProfileTab(tab) {
    appState.activeProfileTab = tab;
    $all("[data-profile-tab]").forEach(btn => btn.classList.toggle("active", btn.dataset.profileTab === tab));
    $all(".profile-panel").forEach(panel => {
      panel.hidden = panel.id !== `panel-${tab}`;
    });
  }

  function saveProfile() {
    const profile = appState.profile || {};
    profile.displayName = $("#inputName")?.value.trim() || "";
    profile.actor = $("#inputActor")?.value.trim() || "";
    profile.director = $("#inputDirector")?.value.trim() || "";
    profile.studio = $("#inputStudio")?.value.trim() || "";
    writeJSON(appState.profileKey, profile);
    showToast("Profile saved.");
    initProfile();
    setNavAvatar();
  }

  function resetProfile() {
    if (!confirm("Reset your profile preferences?")) return;
    localStorage.removeItem(appState.profileKey);
    showToast("Profile reset.");
    initProfile();
  }

  function openAvatarModal() {
    const modal = $("#avatarModal");
    const grid = $("#avatarGrid");
    if (!modal || !grid) return;
    const profile = appState.profile || {};
    grid.innerHTML = AVATAR_SEEDS.map(seed => {
      const url = `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;
      return `<button class="avatar-option ${profile.avatarUrl === url ? "active" : ""}" type="button" data-action="pick-avatar" data-url="${escapeAttr(url)}" style="background-image:url('${escapeAttr(url)}'); background-size:cover" aria-label="Pick ${escapeAttr(seed)} avatar"></button>`;
    }).join("");
    modal.classList.add("open");
    document.body.classList.add("modal-open");
  }

  function closeModal(modal) {
    modal?.classList.remove("open");
    if (!$(".modal-wrap.open")) document.body.classList.remove("modal-open");
  }

  function pickAvatar(url) {
    const profile = appState.profile || {};
    profile.avatarUrl = url;
    writeJSON(appState.profileKey, profile);
    closeModal($("#avatarModal"));
    showToast("Avatar updated.");
    initProfile();
    setNavAvatar();
  }

  function applyCustomAvatar() {
    const url = $("#customAvatarInput")?.value.trim();
    if (!url) return;
    pickAvatar(url);
  }

  function initLogin() {
    $("#btnSignIn")?.classList.add("active");
    updatePasswordRules($("#suPassword")?.value || "");
  }

  function showLoginTab(tab) {
    $("#btnSignIn")?.classList.toggle("active", tab === "signin");
    $("#btnSignUp")?.classList.toggle("active", tab === "signup");
    $("#formSignIn") && ($("#formSignIn").hidden = tab !== "signin");
    $("#formSignUp") && ($("#formSignUp").hidden = tab !== "signup");
  }

  function signIn() {
    const loginId = $("#siUsername")?.value.trim();
    const password = $("#siPassword")?.value || "";
    const users = readJSON("cc_users", {});
    const error = $("#siError");
    const username = findUsernameByLogin(users, loginId);
    if (!username || !users[username] || users[username].password !== password) {
      error?.classList.add("show");
      return;
    }
    error?.classList.remove("show");
    localStorage.setItem("userSession", username);
    window.location.href = postLoginTarget();
  }

  function signUp() {
    const name = $("#suName")?.value.trim() || "";
    const email = $("#suEmail")?.value.trim().toLowerCase() || "";
    const username = $("#suUsername")?.value.trim() || "";
    const password = $("#suPassword")?.value || "";
    const users = readJSON("cc_users", {});
    const error = $("#suError");

    if (!name || !email || !username || !password) {
      showFormError(error, "Please fill in name, email, username and password.");
      return;
    }
    if (!isValidEmail(email)) {
      showFormError(error, "Enter a valid email address.");
      return;
    }
    if (!validatePassword(password).ok) {
      showFormError(error, "Password must meet all listed requirements.");
      return;
    }
    if (users[username]) {
      showFormError(error, "That username is already taken.");
      return;
    }
    if (Object.values(users).some(user => (user.email || "").toLowerCase() === email)) {
      showFormError(error, "That email is already registered.");
      return;
    }
    users[username] = {
      name: name || username,
      email,
      password,
      joined: new Date().toLocaleDateString()
    };
    writeJSON("cc_users", users);
    localStorage.setItem("userSession", username);
    window.location.href = postLoginTarget();
  }

  function findUsernameByLogin(users, loginId = "") {
    const normalized = loginId.trim().toLowerCase();
    if (!normalized) return "";
    if (users[loginId]) return loginId;
    return Object.keys(users).find(username => {
      const user = users[username] || {};
      return username.toLowerCase() === normalized || (user.email || "").toLowerCase() === normalized;
    }) || "";
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePassword(password) {
    const checks = {
      length: password.length >= 8,
      case: /[a-z]/.test(password) && /[A-Z]/.test(password),
      number: /\d/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password)
    };
    return { ...checks, ok: Object.values(checks).every(Boolean) };
  }

  function updatePasswordRules(password) {
    const rules = validatePassword(password);
    $all("[data-rule]").forEach(rule => {
      rule.classList.toggle("pass", Boolean(rules[rule.dataset.rule]));
    });
  }

  function googleLogin() {
    const email = prompt("Enter your Google email for this project demo:");
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      showToast("Enter a valid Google email.");
      return;
    }
    const users = readJSON("cc_users", {});
    let username = findUsernameByLogin(users, cleanEmail);
    if (!username) {
      username = cleanEmail.split("@")[0].replace(/[^a-z0-9_-]/gi, "").slice(0, 18) || `google${Date.now()}`;
      let unique = username;
      let i = 2;
      while (users[unique]) {
        unique = `${username}${i}`;
        i += 1;
      }
      username = unique;
      users[username] = {
        name: cleanEmail.split("@")[0],
        email: cleanEmail,
        provider: "google-demo",
        password: "",
        joined: new Date().toLocaleDateString()
      };
      writeJSON("cc_users", users);
    }
    localStorage.setItem("userSession", username);
    window.location.href = postLoginTarget();
  }

  function postLoginTarget() {
    const next = new URLSearchParams(location.search).get("next");
    if (!next || /^https?:\/\//i.test(next) || next.startsWith("//")) return "index.html";
    return next;
  }

  function showFormError(el, message) {
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
  }

  function guestLogin() {
    localStorage.setItem("userSession", "Guest");
    window.location.href = postLoginTarget();
  }

  const Chat = {
    rooms: [],
    openRoomId: "",
    channel: null,
    events: null,
    online: false,
    loadingRoom: false,

    async init() {
      this.setStatus("Checking live server");
      await this.detectServer();
      this.channel = "BroadcastChannel" in window ? new BroadcastChannel("cinecrawl-chat") : null;
      if (this.channel) {
        this.channel.onmessage = event => this.handleSync(event.data);
      }
      window.addEventListener("storage", event => {
        if (!this.online && (event.key?.startsWith("ccmsg_") || event.key === "cc_rooms")) {
          this.loadRooms().then(() => {
            this.renderRooms();
            if (this.openRoomId) this.openRoom(this.openRoomId, { preserveInput: true });
          });
        }
      });
      await this.loadRooms();
      this.renderRooms();
      this.renderRoomCodes();
      this.renderRoomCategories();
      const roomFromLink = new URLSearchParams(location.search).get("room");
      await this.openRoom(roomFromLink || this.rooms[0]?.id || "");
    },

    async detectServer() {
      try {
        const response = await fetch("/api/status", { cache: "no-store" });
        const status = await response.json();
        this.online = Boolean(status.ok);
      } catch {
        this.online = false;
      }
      this.setStatus(this.online ? "Live sync online" : "Local-only fallback", this.online ? "online" : "offline");
    },

    setStatus(text, state = "") {
      const badge = $("#syncStatus");
      if (!badge) return;
      badge.textContent = text;
      badge.classList.toggle("online", state === "online");
      badge.classList.toggle("offline", state === "offline");
    },

    async api(path, options = {}) {
      const response = await fetch(path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        },
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Server request failed.");
      return data;
    },

    async loadRooms() {
      if (this.online) {
        try {
          const payload = await this.api("/api/rooms");
          this.rooms = payload.rooms || [];
          return;
        } catch {
          this.online = false;
          this.setStatus("Local-only fallback", "offline");
        }
      }
      const userRooms = readJSON("cc_rooms", []);
      const userIds = new Set(userRooms.map(room => room.id));
      this.rooms = [...userRooms, ...DEFAULT_ROOMS.filter(room => !userIds.has(room.id))].map(room => ({
        access: "public",
        ...room
      }));
    },

    renderRooms(filter = "") {
      const list = $("#roomsList");
      if (!list) return;
      const query = filter.toLowerCase();
      const rooms = this.rooms.filter(room => !query || `${room.name} ${room.desc} ${room.cat}`.toLowerCase().includes(query));
      list.innerHTML = rooms.map(room => `
        <button class="room-list-item ${room.id === this.openRoomId ? "active" : ""}" type="button" data-action="open-room" data-room="${escapeAttr(room.id)}">
          <span class="room-icon">${escapeHTML(room.code || "CC")}</span>
          <span>
            <h4>${escapeHTML(room.name)}</h4>
            <p>${this.formatMembers(room.members)} members - ${escapeHTML(room.access === "request" ? "approval" : "open")}</p>
          </span>
          <span class="room-dot" aria-hidden="true"></span>
        </button>`).join("") || `<div class="empty-state">No rooms found.</div>`;
    },

    async openRoom(roomId, options = {}) {
      if (this.loadingRoom) return;
      const room = this.rooms.find(item => item.id === roomId);
      const panel = $("#chatPanel");
      if (!room || !panel) return;
      this.loadingRoom = true;
      const currentInput = options.preserveInput ? $("#msgInput")?.value || "" : "";
      this.openRoomId = roomId;
      this.renderRooms($("#roomSearchBox")?.value || "");
      this.subscribe(roomId);

      const username = getUser() || "Guest";
      let payload = {
        room,
        messages: this.getMessages(roomId),
        requests: [],
        access: { canChat: true, isOwner: room.createdBy === username, pending: false, isMember: true }
      };

      if (this.online) {
        try {
          payload = await this.api(`/api/rooms/${encodeURIComponent(roomId)}/messages?user=${encodeURIComponent(username)}`);
        } catch (error) {
          showToast(error.message);
        }
      }

      const openRoom = payload.room || room;
      const access = payload.access || { canChat: true };
      panel.innerHTML = `
        <div class="chat-topbar">
          <span class="room-icon">${escapeHTML(openRoom.code || "CC")}</span>
          <div>
            <h2>${escapeHTML(openRoom.name)}</h2>
            <p class="muted">${escapeHTML(openRoom.desc)}</p>
          </div>
          <div class="topbar-actions">
            <button class="small-btn" type="button">${this.formatMembers(openRoom.members)} members</button>
            <button class="small-btn" type="button" data-action="copy-invite" data-room="${escapeAttr(openRoom.id)}">Copy invite</button>
            ${access.isOwner && openRoom.createdBy === username ? `<button class="btn-danger" type="button" data-action="delete-room" data-room="${escapeAttr(openRoom.id)}">Delete</button>` : ""}
          </div>
        </div>
        <div class="messages-area" id="msgsArea">
          ${this.joinPanelHTML(openRoom, access, payload.requests || [])}
          ${(payload.messages || []).map(message => this.messageHTML(message)).join("")}
        </div>
        ${access.canChat ? `
          <div class="chat-input">
            <textarea id="msgInput" placeholder="Message ${escapeAttr(openRoom.name)}">${escapeHTML(currentInput)}</textarea>
            <button class="btn-primary" type="button" data-action="send-message">Send</button>
          </div>` : ""}`;
      this.scrollBottom();
      this.loadingRoom = false;
    },

    joinPanelHTML(room, access, requests) {
      if (!access.canChat) {
        return `
          <div class="invite-panel">
            <strong>${access.pending ? "Request sent" : "Private room"}</strong>
            <p class="muted" style="margin-top:6px">${access.pending ? "Wait for the room creator to approve your request." : "Send a join request to the creator before chatting."}</p>
            ${access.pending ? "" : `<button class="btn-primary" style="margin-top:12px" type="button" data-action="request-access" data-room="${escapeAttr(room.id)}">Request to join</button>`}
          </div>`;
      }
      if (!access.isOwner || !requests.length) return "";
      return `
        <div class="request-panel">
          <strong>Join requests</strong>
          ${requests.map(req => `
            <div class="request-row">
              <img class="message-avatar" src="${escapeAttr(req.avatar || avatarUrl(req.user))}" alt="">
              <span>${escapeHTML(req.user)}</span>
              <span class="profile-actions">
                <button class="small-btn" type="button" data-action="manage-request" data-request-action="approve" data-user="${escapeAttr(req.user)}">Approve</button>
                <button class="small-btn" type="button" data-action="manage-request" data-request-action="reject" data-user="${escapeAttr(req.user)}">Reject</button>
              </span>
            </div>`).join("")}
        </div>`;
    },

    getMessages(roomId) {
      const saved = readJSON(`ccmsg_${roomId}`, null);
      if (saved) return saved;
      const room = this.rooms.find(item => item.id === roomId);
      const now = Date.now();
      return [
        { id: "seed-1", user: "CineBot", avatar: avatarUrl("CineBot"), text: `Room started for ${room?.name || "this topic"}.`, time: now - 3600000, reactions: {} },
        { id: "seed-2", user: "FilmFanatic", avatar: avatarUrl("FilmFanatic"), text: "Drop your latest watchlist picks here.", time: now - 1800000, reactions: { agree: ["CineBot"] } }
      ];
    },

    saveMessages(roomId, messages) {
      writeJSON(`ccmsg_${roomId}`, messages);
      this.channel?.postMessage({ type: "messages", roomId });
    },

    messageHTML(message) {
      const mine = message.user === (getUser() || "Guest");
      const reactions = this.reactionHTML(message);
      return `
        <article class="message ${mine ? "mine" : ""}">
          ${mine ? "" : `<img class="message-avatar" src="${escapeAttr(message.avatar)}" alt="">`}
          <div class="message-body">
            <div class="message-name">${escapeHTML(mine ? "You" : message.user)}</div>
            <div class="message-text">${escapeHTML(message.text)}</div>
            <div class="message-meta">${new Date(message.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            <div class="reaction-row">
              ${reactions}
              <button class="reaction" type="button" data-action="react" data-message="${escapeAttr(message.id)}" data-reaction="agree">agree</button>
              <button class="reaction" type="button" data-action="react" data-message="${escapeAttr(message.id)}" data-reaction="watch">watch</button>
            </div>
          </div>
          ${mine ? `<img class="message-avatar" src="${escapeAttr(avatarUrl(getUser() || "Guest"))}" alt="">` : ""}
        </article>`;
    },

    reactionHTML(message) {
      const username = getUser() || "Guest";
      return Object.entries(message.reactions || {}).map(([reaction, users]) => {
        const active = users.includes(username);
        return `<button class="reaction ${active ? "active" : ""}" type="button" data-action="react" data-message="${escapeAttr(message.id)}" data-reaction="${escapeAttr(reaction)}">${escapeHTML(reaction)} ${users.length}</button>`;
      }).join("");
    },

    async sendMessage() {
      const input = $("#msgInput");
      if (!input || !this.openRoomId) return;
      const text = input.value.trim();
      if (!text) return;
      const username = getUser() || "Guest";
      input.value = "";

      if (this.online) {
        try {
          await this.api(`/api/rooms/${encodeURIComponent(this.openRoomId)}/messages`, {
            method: "POST",
            body: JSON.stringify({ user: username, avatar: avatarUrl(username), text })
          });
        } catch (error) {
          showToast(error.message);
        }
        await this.loadRooms();
        this.renderRooms($("#roomSearchBox")?.value || "");
        await this.openRoom(this.openRoomId);
        return;
      }

      const messages = this.getMessages(this.openRoomId);
      messages.push({
        id: `m-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        user: username,
        avatar: avatarUrl(username),
        text,
        time: Date.now(),
        reactions: {}
      });
      this.saveMessages(this.openRoomId, messages);
      await this.openRoom(this.openRoomId);
    },

    async react(messageId, reaction) {
      if (!this.openRoomId) return;
      const username = getUser() || "Guest";
      if (this.online) {
        try {
          await this.api(`/api/rooms/${encodeURIComponent(this.openRoomId)}/reactions`, {
            method: "POST",
            body: JSON.stringify({ user: username, messageId, reaction })
          });
          await this.openRoom(this.openRoomId, { preserveInput: true });
        } catch (error) {
          showToast(error.message);
        }
        return;
      }

      const messages = this.getMessages(this.openRoomId);
      const message = messages.find(item => item.id === messageId);
      if (!message) return;
      message.reactions ||= {};
      message.reactions[reaction] ||= [];
      const index = message.reactions[reaction].indexOf(username);
      if (index >= 0) message.reactions[reaction].splice(index, 1);
      else message.reactions[reaction].push(username);
      if (message.reactions[reaction].length === 0) delete message.reactions[reaction];
      this.saveMessages(this.openRoomId, messages);
      await this.openRoom(this.openRoomId, { preserveInput: true });
    },

    async requestAccess(roomId) {
      if (!this.online) {
        showToast("Run server.js for real join requests.");
        return;
      }
      const username = getUser() || "Guest";
      try {
        const response = await this.api(`/api/rooms/${encodeURIComponent(roomId)}/join-request`, {
          method: "POST",
          body: JSON.stringify({ user: username, avatar: avatarUrl(username) })
        });
        showToast(response.status === "joined" ? "Joined room." : "Join request sent.");
        await this.openRoom(roomId);
      } catch (error) {
        showToast(error.message);
      }
    },

    async manageRequest(user, action) {
      if (!this.online || !this.openRoomId) return;
      try {
        await this.api(`/api/rooms/${encodeURIComponent(this.openRoomId)}/members`, {
          method: "POST",
          body: JSON.stringify({ owner: getUser() || "Guest", user, action })
        });
        showToast(action === "approve" ? "Request approved." : "Request rejected.");
        await this.loadRooms();
        await this.openRoom(this.openRoomId);
      } catch (error) {
        showToast(error.message);
      }
    },

    handleSync(data) {
      if (!data || this.online) return;
      if (data.type === "messages" && data.roomId === this.openRoomId) {
        this.openRoom(this.openRoomId, { preserveInput: true });
      }
      if (data.type === "rooms") {
        this.loadRooms().then(() => this.renderRooms());
      }
    },

    subscribe(roomId) {
      if (!this.online || !roomId) return;
      if (this.events) this.events.close();
      this.events = new EventSource(`/api/events?room=${encodeURIComponent(roomId)}`);
      this.events.onmessage = async event => {
        const payload = JSON.parse(event.data || "{}");
        if (payload.type === "connected") return;
        await this.loadRooms();
        this.renderRooms($("#roomSearchBox")?.value || "");
        if (this.openRoomId) await this.openRoom(this.openRoomId, { preserveInput: true });
      };
      this.events.onerror = () => {
        this.setStatus("Live sync reconnecting", "offline");
      };
    },

    renderRoomCodes() {
      const row = $("#roomCodeChoices");
      if (!row) return;
      row.innerHTML = ROOM_CODES.map((code, index) => `
        <button class="chip ${index === 0 ? "active" : ""}" type="button" data-action="pick-room-code" data-code="${escapeAttr(code)}">${escapeHTML(code)}</button>`
      ).join("");
    },

    renderRoomCategories() {
      const row = $("#roomCategoryChoices");
      if (!row) return;
      row.innerHTML = ROOM_CATEGORIES.map((cat, index) => `
        <button class="chip ${index === 0 ? "active" : ""}" type="button" data-action="pick-room-category" data-category="${escapeAttr(cat)}">${escapeHTML(cat)}</button>`
      ).join("");
    },

    openCreateModal() {
      $("#createRoomModal")?.classList.add("open");
      document.body.classList.add("modal-open");
    },

    async createRoom() {
      const name = $("#roomNameInput")?.value.trim() || "";
      const desc = $("#roomDescInput")?.value.trim() || "";
      const slug = ($("#roomSlugInput")?.value.trim() || "").toLowerCase();
      const code = $(".chip.active[data-code]")?.dataset.code || "CC";
      const cat = $(".chip.active[data-category]")?.dataset.category || "general";
      const access = $(".chip.active[data-access]")?.dataset.access || "public";
      const agreed = $("#rulesCheckbox")?.checked;
      const error = $("#createRoomError");

      if (name.length < 3) return this.showCreateError(error, "Room name must be at least 3 characters.");
      if (desc.length < 12) return this.showCreateError(error, "Description must be at least 12 characters.");
      if (!/^[a-z0-9-]{3,}$/.test(slug)) return this.showCreateError(error, "Room link must use 3+ lowercase letters, numbers or hyphens.");
      if (this.rooms.some(room => room.id === slug)) return this.showCreateError(error, "That room link is already taken.");
      if (!agreed) return this.showCreateError(error, "Please accept the community rules.");

      const room = {
        id: slug,
        name,
        desc,
        code,
        cat,
        access,
        members: 1,
        createdBy: getUser() || "Guest",
        hot: false
      };

      if (this.online) {
        try {
          const payload = await this.api("/api/rooms", {
            method: "POST",
            body: JSON.stringify({ ...room, slug })
          });
          closeModal($("#createRoomModal"));
          this.resetCreateForm();
          await this.loadRooms();
          this.renderRooms();
          await this.openRoom(payload.room.id);
          this.copyInvite(payload.room.id, false);
          showToast("Room created. Invite link copied if browser allowed it.");
          return;
        } catch (apiError) {
          return this.showCreateError(error, apiError.message);
        }
      }

      const userRooms = readJSON("cc_rooms", []);
      userRooms.unshift(room);
      writeJSON("cc_rooms", userRooms);
      this.channel?.postMessage({ type: "rooms" });
      closeModal($("#createRoomModal"));
      this.resetCreateForm();
      await this.loadRooms();
      this.renderRooms();
      await this.openRoom(room.id);
      showToast("Room created locally.");
    },

    showCreateError(el, message) {
      if (!el) return;
      el.textContent = message;
      el.classList.add("show");
    },

    resetCreateForm() {
      ["roomNameInput", "roomDescInput", "roomSlugInput"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      $("#rulesCheckbox") && ($("#rulesCheckbox").checked = false);
      $("#createRoomError")?.classList.remove("show");
      $all("[data-access]").forEach(btn => btn.classList.toggle("active", btn.dataset.access === "public"));
    },

    async deleteRoom(roomId) {
      const room = this.rooms.find(item => item.id === roomId);
      if (!room || room.createdBy !== (getUser() || "Guest")) return;
      if (!confirm("Delete this room permanently?")) return;
      if (this.online) {
        try {
          await this.api(`/api/rooms/${encodeURIComponent(roomId)}?user=${encodeURIComponent(getUser() || "Guest")}`, { method: "DELETE" });
        } catch (error) {
          showToast(error.message);
          return;
        }
      } else {
        const userRooms = readJSON("cc_rooms", []).filter(item => item.id !== roomId);
        writeJSON("cc_rooms", userRooms);
        localStorage.removeItem(`ccmsg_${roomId}`);
        this.channel?.postMessage({ type: "rooms" });
      }
      await this.loadRooms();
      this.openRoomId = "";
      this.renderRooms();
      await this.openRoom(this.rooms[0]?.id || "");
      showToast("Room deleted.");
    },

    async copyInvite(roomId, announce = true) {
      const link = `${location.origin}${location.pathname}?room=${encodeURIComponent(roomId)}`;
      try {
        await navigator.clipboard.writeText(link);
        if (announce) showToast("Invite link copied.");
      } catch {
        prompt("Invite link:", link);
      }
    },

    formatMembers(count = 0) {
      return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
    },

    scrollBottom() {
      const area = $("#msgsArea");
      if (!area) return;
      requestAnimationFrame(() => {
        area.scrollTop = area.scrollHeight;
      });
    }
  };

  function handleClick(event) {
    const overlay = event.target.classList?.contains("modal-wrap") ? event.target : null;
    if (overlay) {
      closeModal(overlay);
      return;
    }

    const actionEl = event.target.closest("[data-action]");
    if (actionEl) {
      const action = actionEl.dataset.action;
      if (action !== "focus-review") {
        event.preventDefault();
        event.stopPropagation();
      }

      switch (action) {
        case "toggle-nav":
          $(".navbar")?.classList.toggle("open");
          return;
        case "logout":
          localStorage.removeItem("userSession");
          window.location.href = "login.html";
          return;
        case "go-studio":
          goToStudio(actionEl.dataset.id, actionEl.dataset.name);
          return;
        case "switch-evergreen":
          renderEvergreen(actionEl.dataset.category || "all");
          return;
        case "load-more":
          loadResults(appState.resultsPage + 1, false);
          return;
        case "pick-mood":
          pickMood(actionEl.dataset.mood);
          return;
        case "pick-intensity":
          pickIntensity(actionEl.dataset.level);
          return;
        case "toggle-favorite":
          toggleFavorite(actionEl.dataset.id, actionEl.dataset.title, actionEl.dataset.poster);
          return;
        case "toggle-watched":
          toggleWatched(actionEl.dataset.id, actionEl.dataset.title, actionEl.dataset.poster);
          return;
        case "focus-review":
          $("#ratingPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        case "save-review":
          saveReview();
          return;
        case "clear-review":
          $("#reviewText") && ($("#reviewText").value = "");
          return;
        case "profile-tab":
          setProfileTab(actionEl.dataset.profileTab);
          return;
        case "toggle-genre": {
          const profile = appState.profile || {};
          profile.genres ||= [];
          const genre = actionEl.dataset.genre;
          profile.genres = profile.genres.includes(genre)
            ? profile.genres.filter(item => item !== genre)
            : [...profile.genres, genre];
          appState.profile = profile;
          actionEl.classList.toggle("active");
          return;
        }
        case "save-profile":
          saveProfile();
          return;
        case "reset-profile":
          resetProfile();
          return;
        case "open-avatar":
          openAvatarModal();
          return;
        case "close-modal":
          closeModal(actionEl.closest(".modal-wrap"));
          return;
        case "pick-avatar":
          pickAvatar(actionEl.dataset.url);
          return;
        case "apply-avatar":
          applyCustomAvatar();
          return;
        case "login-tab":
          showLoginTab(actionEl.dataset.tab);
          return;
        case "sign-in":
          signIn();
          return;
        case "sign-up":
          signUp();
          return;
        case "guest-login":
          guestLogin();
          return;
        case "google-login":
          googleLogin();
          return;
        case "open-room":
          Chat.openRoom(actionEl.dataset.room);
          return;
        case "create-room-modal":
          Chat.openCreateModal();
          return;
        case "create-room":
          Chat.createRoom();
          return;
        case "delete-room":
          Chat.deleteRoom(actionEl.dataset.room);
          return;
        case "send-message":
          Chat.sendMessage();
          return;
        case "react":
          Chat.react(actionEl.dataset.message, actionEl.dataset.reaction);
          return;
        case "copy-invite":
          Chat.copyInvite(actionEl.dataset.room);
          return;
        case "request-access":
          Chat.requestAccess(actionEl.dataset.room);
          return;
        case "manage-request":
          Chat.manageRequest(actionEl.dataset.user, actionEl.dataset.requestAction);
          return;
        case "pick-room-code":
          $all("[data-code]").forEach(btn => btn.classList.remove("active"));
          actionEl.classList.add("active");
          return;
        case "pick-room-category":
          $all("[data-category]").forEach(btn => {
            if (btn.dataset.action === "pick-room-category") btn.classList.remove("active");
          });
          actionEl.classList.add("active");
          return;
        case "pick-room-access":
          $all("[data-access]").forEach(btn => btn.classList.remove("active"));
          actionEl.classList.add("active");
          return;
        default:
          return;
      }
    }

    const card = event.target.closest("[data-movie-card]");
    if (card?.dataset.id) {
      goToDetails(card.dataset.id);
    }

    if (!event.target.closest(".nav-search")) {
      $("#searchDropdown")?.classList.remove("open");
    }
  }

  function handleInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.id === "searchInput") {
      clearTimeout(appState.searchTimer);
      const query = target.value.trim();
      if (!query) {
        $("#searchDropdown")?.classList.remove("open");
        return;
      }
      appState.searchTimer = window.setTimeout(() => searchMovies(query), 320);
    }

    if (target.id === "roomSearchBox") {
      Chat.renderRooms(target.value);
    }

    if (target.id === "roomSlugInput") {
      target.value = target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    }

    if (target.id === "msgInput") {
      target.style.height = "auto";
      target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
    }

    if (target.id === "ratingSlider") {
      updateRatingDisplay(target.value);
    }

    if (target.id === "suPassword") {
      updatePasswordRules(target.value);
    }
  }

  function handleKeydown(event) {
    if (event.target?.id === "msgInput" && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      Chat.sendMessage();
    }

    if (document.body.dataset.page === "login" && event.key === "Enter") {
      const signUpVisible = !$("#formSignUp")?.hidden;
      signUpVisible ? signUp() : signIn();
    }
  }

  function boot() {
    const page = document.body.dataset.page || "";
    const loggedIn = Boolean(localStorage.getItem("userSession"));
    if (!loggedIn && page !== "login") {
      const current = `${location.pathname.split("/").pop() || "index.html"}${location.search}`;
      window.location.href = `login.html?next=${encodeURIComponent(current)}`;
      return;
    }

    setupCommon();
    document.addEventListener("click", handleClick);
    document.addEventListener("input", handleInput);
    document.addEventListener("keydown", handleKeydown);

    const initializers = {
      home: initHome,
      crawl: initCrawl,
      intensity: initIntensity,
      results: initResults,
      details: initDetails,
      profile: initProfile,
      chatrooms: () => Chat.init(),
      login: initLogin
    };

    initializers[page]?.();
  }

  window.tmdbFetch = tmdbFetch;
  window.goToDetails = goToDetails;
  window.goToStudio = goToStudio;
  window.getFavorites = getFavorites;
  window.getWatched = getWatched;
  window.toggleFavorite = (id, title, poster, event) => {
    event?.stopPropagation();
    toggleFavorite(id, title, poster);
  };
  window.toggleWatched = (id, title, poster, event) => {
    event?.stopPropagation();
    toggleWatched(id, title, poster);
  };
  window.logout = () => {
    localStorage.removeItem("userSession");
    window.location.href = "login.html";
  };

  document.addEventListener("DOMContentLoaded", boot);
})();
