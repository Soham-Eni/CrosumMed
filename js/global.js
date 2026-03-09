/* ==================================================
   CROSUMMED — GLOBAL JS v4
   Theme · Auth · Search · Pagination · Bookmarks
   ================================================== */

/* ===== DARK MODE SYSTEM (with device preference) ===== */

function getStoredTheme() {
    try { return localStorage.getItem("csm-theme"); } catch(e) { return null; }
}

function getSystemTheme() {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
}

function getEffectiveTheme() {
    var stored = getStoredTheme();
    return stored || getSystemTheme();
}

function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("csm-theme", theme); } catch(e) {}
    syncAllThemeToggles(theme);
}

function syncAllThemeToggles(theme) {
    var isDark = (theme === "dark");
    var sw = document.getElementById("sidebarThemeSwitch");
    if (sw) sw.checked = isDark;
}

// Apply theme immediately on script load
(function() {
    document.documentElement.setAttribute("data-theme", getEffectiveTheme());
})();

// Listen for OS theme changes
if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function(e) {
        if (!getStoredTheme()) setTheme(e.matches ? "dark" : "light");
    });
}


/* ===== USER AUTH SYSTEM (localStorage) ===== */

function getUser() {
    try {
        var u = localStorage.getItem("csm-user");
        return u ? JSON.parse(u) : null;
    } catch(e) { return null; }
}

function saveUser(user) {
    try { localStorage.setItem("csm-user", JSON.stringify(user)); } catch(e) {}
}

function removeUser() {
    try { localStorage.removeItem("csm-user"); } catch(e) {}
}

function isLoggedIn() {
    return !!getUser();
}

function getAllUsers() {
    try {
        return JSON.parse(localStorage.getItem("csm-users")) || [];
    } catch(e) { return []; }
}

function saveAllUsers(users) {
    try { localStorage.setItem("csm-users", JSON.stringify(users)); } catch(e) {}
}

function registerUser(data) {
    // data: { email, name, age, password }
    var users = getAllUsers();
    var exists = users.find(function(u) { return u.email === data.email; });
    if (exists) return { success: false, message: "An account with this email already exists." };

    var user = {
        id: "user_" + Date.now(),
        email: data.email,
        name: data.name,
        age: data.age,
        password: data.password,
        createdAt: new Date().toISOString()
    };
    users.push(user);
    saveAllUsers(users);
    saveUser(user);
    return { success: true, user: user };
}

function loginUser(email, password) {
    var users = getAllUsers();
    var match = users.find(function(u) {
        return u.email === email && u.password === password;
    });
    if (!match) return { success: false, message: "Invalid email or password." };
    saveUser(match);
    return { success: true, user: match };
}

function logoutUser() {
    removeUser();
}

function requireLogin(actionName) {
    if (isLoggedIn()) return true;
    window.location.href = "login.html?redirect=" + encodeURIComponent(window.location.href) + "&reason=" + encodeURIComponent(actionName || "use this feature");
    return false;
}

function openNearbyPharmacy() {
    if (!requireLogin("find nearby pharmacies")) return;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(pos) {
                var lat = pos.coords.latitude;
                var lng = pos.coords.longitude;
                window.open("https://www.google.com/maps/search/pharmacy+near+me/@" + lat + "," + lng + ",14z", "_blank");
            },
            function() {
                window.open("https://www.google.com/maps/search/pharmacy+near+me", "_blank");
            }
        );
    } else {
        window.open("https://www.google.com/maps/search/pharmacy+near+me", "_blank");
    }
}


/* ===== SIDEBAR RENDER AUTH STATE ===== */

function renderAuthState() {
    var user = getUser();
    var guest = document.getElementById("sidebarGuest");
    var logged = document.getElementById("sidebarUser");
    var footer = document.getElementById("sidebarFooter");
    var avatar = document.getElementById("profileAvatar");
    var nameEl = document.getElementById("profileName");
    var usernameEl = document.getElementById("profileUsername");

    // Enable/disable logged-in-only links
    var gatedLinks = document.querySelectorAll(".sidebar-gated");
    gatedLinks.forEach(function(link) {
        if (user) {
            link.classList.remove("disabled-link");
            link.removeAttribute("onclick");
        } else {
            link.classList.add("disabled-link");
        }
    });

    if (user) {
        if (guest) guest.style.display = "none";
        if (logged) logged.style.display = "flex";
        if (footer) footer.style.display = "flex";
        if (avatar) avatar.textContent = user.name ? user.name.charAt(0).toUpperCase() : "U";
        if (nameEl) nameEl.textContent = user.name || "User";
        if (usernameEl) usernameEl.textContent = user.email || "";
    } else {
        if (guest) guest.style.display = "flex";
        if (logged) logged.style.display = "none";
        if (footer) footer.style.display = "none";
    }
}


/* ===== SIDEBAR & THEME INIT ===== */

function initSidebarAndTheme() {
    var sidebar = document.getElementById("sidebar");
    var overlay = document.getElementById("sidebarOverlay");
    var menuBtn = document.getElementById("menuBtn");
    var closeBtn = document.getElementById("closeBtn");

    function openSidebar() {
        if (sidebar) sidebar.classList.add("open");
        if (overlay) overlay.classList.add("active");
        document.body.classList.add("sidebar-open");
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove("open");
        if (overlay) overlay.classList.remove("active");
        document.body.classList.remove("sidebar-open");
    }

    if (menuBtn) menuBtn.addEventListener("click", openSidebar);
    if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
    if (overlay) overlay.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") closeSidebar();
    });

    // Header toggle (sliding switch)
    var headerToggle = document.getElementById("headerThemeToggle");
    if (headerToggle) {
        headerToggle.addEventListener("click", function() {
            var current = document.documentElement.getAttribute("data-theme");
            setTheme(current === "dark" ? "light" : "dark");
        });
    }

    // Sidebar toggle switch
    var sidebarSwitch = document.getElementById("sidebarThemeSwitch");
    if (sidebarSwitch) {
        sidebarSwitch.checked = (getEffectiveTheme() === "dark");
        sidebarSwitch.addEventListener("change", function() {
            setTheme(this.checked ? "dark" : "light");
        });
    }

    // Sidebar auth buttons
    var btnSignIn = document.getElementById("btnSignIn");
    if (btnSignIn) btnSignIn.addEventListener("click", function() {
        window.location.href = "login.html";
    });

    var btnRegister = document.getElementById("btnRegister");
    if (btnRegister) btnRegister.addEventListener("click", function() {
        window.location.href = "login.html?tab=register";
    });

    var btnSignOut = document.getElementById("btnSignOut");
    if (btnSignOut) btnSignOut.addEventListener("click", function() {
        logoutUser();
        renderAuthState();
        closeSidebar();
    });

    renderAuthState();
    syncAllThemeToggles(getEffectiveTheme());
}


/* ===== BOOKMARK SYSTEM ===== */

function getBookmarks(type) {
    var key = "csm-bm-" + (type || "products");
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch(e) { return []; }
}

function isBookmarked(name, type) {
    return getBookmarks(type).includes(name);
}

function toggleBookmark(name, type) {
    if (!requireLogin("bookmark items")) return false;
    var key = "csm-bm-" + (type || "products");
    var bm = getBookmarks(type);
    if (bm.includes(name)) {
        bm = bm.filter(function(i) { return i !== name; });
    } else {
        bm.push(name);
    }
    try { localStorage.setItem(key, JSON.stringify(bm)); } catch(e) {}
    return true;
}


/* ===== RATINGS ===== */

function getRatings() {
    try { return JSON.parse(localStorage.getItem("csm-ratings")) || {}; } catch(e) { return {}; }
}

function saveRating(productName, score) {
    var ratings = getRatings();
    if (!ratings[productName]) ratings[productName] = [];
    ratings[productName].push(score);
    try { localStorage.setItem("csm-ratings", JSON.stringify(ratings)); } catch(e) {}
}


/* ===== FUZZY MATCH ===== */

function simpleFuzzyMatch(text, query) {
    text = text.toLowerCase();
    query = query.toLowerCase();
    if (!query) return true;
    if (text.includes(query)) return true;
    if (query.length >= 6) return false;
    var matches = 0;
    for (var i = 0; i < query.length; i++) {
        if (text.includes(query[i])) matches++;
    }
    return matches >= Math.ceil(query.length * 0.6);
}


/* ===== SEARCH AUTOCOMPLETE ===== */

function getSelectedSearchType() {
    var btn = document.getElementById("searchTypeBtn");
    if (!btn) return "PharmaProducts";
    var text = btn.textContent.trim().replace(/\s*$/, "");
    if (text.indexOf("Articles") !== -1) return "PharmaArticles";
    if (text.indexOf("News") !== -1) return "PharmaNews";
    return "PharmaProducts";
}

function initSearchAutocomplete() {
    var productNames = [], articleNames = [], newsNames = [];
    var dataLoaded = 0;
    var timer, activeIdx = -1;
    var input = document.getElementById("globalSearch");
    var box = document.getElementById("searchSuggestions");
    if (!input || !box) return;

    fetch("data/medicines.json").then(function(r){return r.json();}).then(function(data){
        productNames = Object.keys(data);
        dataLoaded++;
    }).catch(function(){dataLoaded++;});

    fetch("data/database.json").then(function(r){return r.json();}).then(function(db){
        if (db.products) productNames = productNames.concat(Object.keys(db.products));
        if (db.articles) articleNames = db.articles.map(function(a){return a.title;});
        if (db.news) newsNames = db.news.map(function(n){return n.title;});
        // Deduplicate products
        productNames = productNames.filter(function(v,i,a){return a.indexOf(v)===i;});
        dataLoaded++;
    }).catch(function(){dataLoaded++;});

    input.addEventListener("input", function() {
        if (dataLoaded < 2) return;
        clearTimeout(timer);
        timer = setTimeout(function() {
            var q = input.value.trim().toLowerCase();
            box.innerHTML = ""; activeIdx = -1;
            if (q.length < 2) { box.style.display = "none"; return; }

            var type = getSelectedSearchType();
            var pool;
            if (type === "PharmaArticles") pool = articleNames;
            else if (type === "PharmaNews") pool = newsNames;
            else pool = productNames;

            var matches = pool.filter(function(name){return simpleFuzzyMatch(name,q);})
                .sort(function(a,b){return (b.toLowerCase().includes(q)?1:0)-(a.toLowerCase().includes(q)?1:0);})
                .slice(0,6);
            if (!matches.length) { box.style.display = "none"; return; }

            matches.forEach(function(name) {
                var div = document.createElement("div");
                div.className = "suggestion-item";
                div.innerHTML = highlightText(name, q);
                div.addEventListener("mouseenter", function() {
                    box.querySelectorAll(".suggestion-item").forEach(function(s){s.classList.remove("active");});
                    activeIdx = Array.from(box.querySelectorAll(".suggestion-item")).indexOf(div);
                    div.classList.add("active");
                });
                div.onclick = function() {
                    window.location.href = "search.html?query=" + encodeURIComponent(name) + "&type=" + encodeURIComponent(type);
                };
                box.appendChild(div);
            });
            box.style.display = "block";
        }, 250);
    });

    document.addEventListener("click", function(e) {
        if (!input.contains(e.target) && !box.contains(e.target)) box.style.display = "none";
    });

    input.addEventListener("keydown", function(e) {
        var items = box.querySelectorAll(".suggestion-item");
        if (box.style.display !== "block" || !items.length) return;
        if (e.key === "ArrowDown") { e.preventDefault(); activeIdx = (activeIdx + 1) % items.length; }
        if (e.key === "ArrowUp") { e.preventDefault(); activeIdx = (activeIdx - 1 + items.length) % items.length; }
        if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); items[activeIdx].click(); return; }
        items.forEach(function(s){s.classList.remove("active");});
        if (activeIdx >= 0) items[activeIdx].classList.add("active");
    });
}


/* ===== HIGHLIGHT TEXT ===== */

function highlightText(text, search) {
    if (!search) return text;
    var regex = new RegExp("(" + escapeRegex(search) + ")", "gi");
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


/* ===== SEARCH VALIDATION ===== */

function initSearchValidation() {
    var form = document.getElementById("globalSearchForm");
    var input = document.getElementById("globalSearch");
    if (!form || !input) return;

    form.addEventListener("submit", function(e) {
        if (input.value.trim() === "") {
            e.preventDefault();
            input.value = "";
            input.placeholder = "Please type something to search";
            input.style.color = "red";
            setTimeout(function() { input.placeholder = "Search medicines, products…"; input.style.color = ""; }, 2000);
            return;
        }
        // Ensure type param is included in form submission
        var type = getSelectedSearchType();
        var hidden = document.getElementById("searchTypeHidden");
        if (!hidden) {
            hidden = document.createElement("input");
            hidden.type = "hidden"; hidden.name = "type"; hidden.id = "searchTypeHidden";
            form.appendChild(hidden);
        }
        hidden.value = type;
    });

    input.addEventListener("input", function() { input.style.color = ""; });
}


/* ===== PAGINATION ENGINE ===== */

function setupGlobalPagination(config) {
    var data = config.data, itemsPerPage = config.itemsPerPage || 5,
        containerId = config.containerId, onRender = config.onRender;
    var container = document.getElementById(containerId);
    if (!container) return;
    var errorBox = document.getElementById("paginationError");
    var currentPage = parseInt(new URLSearchParams(window.location.search).get("page")) || 1;

    function paginate() {
        var totalPages = Math.ceil(data.length / itemsPerPage);
        currentPage = Math.max(1, Math.min(currentPage, totalPages));
        var start = (currentPage - 1) * itemsPerPage;
        onRender(data.slice(start, start + itemsPerPage), currentPage, totalPages);
        renderControls(totalPages);
    }

    function updateURL(page) {
        var params = new URLSearchParams(window.location.search);
        params.set("page", page);
        history.pushState(null, "", window.location.pathname + "?" + params.toString());
    }

    function renderControls(totalPages) {
        container.innerHTML = "";
        if (errorBox) { errorBox.style.display = "none"; errorBox.innerText = ""; }
        if (totalPages <= 1) return;

        function goTo(page) {
            currentPage = page; updateURL(page); paginate();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }

        function btn(text, disabled, fn, isNav) {
            var b = document.createElement("button");
            b.innerText = text; b.disabled = disabled; b.onclick = fn;
            if (isNav) b.classList.add("nav-btn");
            return b;
        }

        container.appendChild(btn("<<", currentPage === 1, function() { goTo(1); }, true));
        container.appendChild(btn("Previous", currentPage === 1, function() { goTo(currentPage - 1); }, true));

        var inp = document.createElement("input");
        inp.type = "text"; inp.id = "pageNumberInput"; inp.value = currentPage;
        inp.style.cssText = "width:60px;text-align:center;font-weight:bold";
        inp.addEventListener("input", function() { this.value = this.value.replace(/[^0-9]/g, ""); });
        inp.addEventListener("keydown", function(e) {
            if (e.key === "Enter") {
                var v = parseInt(this.value);
                if (!v || v < 1 || v > totalPages) {
                    if (errorBox) { errorBox.innerText = "Page does not exist"; errorBox.style.color = "red"; errorBox.style.display = "block"; }
                } else goTo(v);
            }
        });
        container.appendChild(inp);

        function addPage(p) {
            var pb = document.createElement("button");
            pb.innerText = p; if (p === currentPage) pb.classList.add("active");
            pb.onclick = function() { goTo(p); }; container.appendChild(pb);
        }
        function dots() {
            var s = document.createElement("span");
            s.innerText = "..."; s.style.cssText = "padding:8px 6px;font-weight:bold";
            container.appendChild(s);
        }

        if (totalPages <= 5) { for (var i = 1; i <= totalPages; i++) addPage(i); }
        else {
            addPage(1);
            if (currentPage > 4) dots();
            for (var j = Math.max(2, currentPage - 2); j <= Math.min(totalPages - 1, currentPage + 2); j++) addPage(j);
            if (currentPage < totalPages - 3) dots();
            addPage(totalPages);
        }

        container.appendChild(btn("Next", currentPage === totalPages, function() { goTo(currentPage + 1); }, true));
        container.appendChild(btn(">>", currentPage === totalPages, function() { goTo(totalPages); }, true));
    }
    paginate();
}


/* ===== SEARCH TYPE SELECTOR ===== */

function initSearchTypeSelector() {
    var btn = document.getElementById("searchTypeBtn");
    var dropdown = document.getElementById("searchTypeDropdown");
    if (!btn || !dropdown) return;
    var options = dropdown.querySelectorAll("div");
    var activeIdx = -1;

    btn.addEventListener("click", function(e) {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    });

    options.forEach(function(opt, idx) {
        opt.addEventListener("click", function() { selectOpt(opt); });
        opt.addEventListener("mouseenter", function() {
            options.forEach(function(o) { o.classList.remove("active"); });
            opt.classList.add("active"); activeIdx = idx;
        });
    });

    function selectOpt(opt) {
        var val = opt.getAttribute("data-type");
        btn.innerHTML = val + ' <i class="fa-solid fa-chevron-down"></i>';
        dropdown.style.display = "none";

        var hidden = document.getElementById("searchTypeHidden");
        if (!hidden) {
            hidden = document.createElement("input");
            hidden.type = "hidden"; hidden.name = "type"; hidden.id = "searchTypeHidden";
            var form = document.getElementById("globalSearchForm");
            if (form) form.appendChild(hidden);
        }
        hidden.value = val;

        // Update placeholder text based on type
        var searchInput = document.getElementById("globalSearch");
        if (searchInput) {
            if (val === "PharmaArticles") searchInput.placeholder = "Search articles, research papers…";
            else if (val === "PharmaNews") searchInput.placeholder = "Search pharmaceutical news…";
            else searchInput.placeholder = "Search medicines, products…";
        }

        // Fire custom event for landing page dynamic text
        document.dispatchEvent(new CustomEvent("searchTypeChanged", { detail: { type: val } }));
    }

    btn.addEventListener("keydown", function(e) {
        if (dropdown.style.display !== "block") return;
        if (e.key === "ArrowDown") { e.preventDefault(); activeIdx = (activeIdx + 1) % options.length; }
        if (e.key === "ArrowUp") { e.preventDefault(); activeIdx = (activeIdx - 1 + options.length) % options.length; }
        if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); selectOpt(options[activeIdx]); }
        options.forEach(function(o) { o.classList.remove("active"); });
        if (activeIdx >= 0) options[activeIdx].classList.add("active");
    });

    document.addEventListener("click", function(e) {
        if (!btn.contains(e.target) && !dropdown.contains(e.target)) dropdown.style.display = "none";
    });
}


/* ===== COMPONENT LOADER (Promise-based) ===== */

function loadComponent(id, file) {
    return new Promise(function(resolve, reject) {
        fetch(file)
            .then(function(r) { return r.text(); })
            .then(function(html) {
                var el = document.getElementById(id);
                if (el) el.innerHTML = html;
                resolve();
            })
            .catch(function(err) { console.error("Load failed: " + file, err); reject(err); });
    });
}

function initHeader() {
    initSidebarAndTheme();
    initSearchAutocomplete();
    initSearchValidation();
    initSearchTypeSelector();
}

/**
 * initPage — loads header + footer, inits everything.
 * @param {Function} callback — page-specific init
 * @param {Object} opts — { headerMode: "normal"|"minimal"|"expanded" }
 */
function initPage(callback, opts) {
    opts = opts || {};
    Promise.all([
        loadComponent("header-placeholder", "components/header.html"),
        loadComponent("footer-placeholder", "components/footer.html")
    ]).then(function() {
        // Apply header mode
        var header = document.querySelector(".header");
        if (header && opts.headerMode) {
            header.setAttribute("data-mode", opts.headerMode);
        }
        initHeader();
        if (callback) callback();
    }).catch(function(err) { console.error("Component load error:", err); });
}


/* ===== EMAIL VALIDATION ===== */

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


/* ===== MOCK GOOGLE LOGIN ===== */

function mockGoogleLogin(callback) {
    // Simulate Google OAuth popup
    var name = prompt("Google Sign-In Simulation\n\nEnter your name:");
    if (!name || !name.trim()) return;
    var email = prompt("Enter your Google email:");
    if (!email || !email.trim() || !isValidEmail(email.trim())) {
        alert("Invalid email address.");
        return;
    }

    // Check if already registered
    var users = getAllUsers();
    var existing = users.find(function(u) { return u.email === email.trim(); });

    if (existing) {
        // Log in existing user
        saveUser(existing);
        if (callback) callback(existing);
    } else {
        // Register new user via Google
        var user = {
            id: "user_" + Date.now(),
            email: email.trim(),
            name: name.trim(),
            age: "",
            password: "google_oauth_" + Date.now(),
            createdAt: new Date().toISOString(),
            googleAuth: true
        };
        users.push(user);
        saveAllUsers(users);
        saveUser(user);
        if (callback) callback(user);
    }
}
