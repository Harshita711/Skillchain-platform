console.log('SkillChain app.js loaded successfully!');
const token = localStorage.getItem('token');

if (token) {
    fetch('http://localhost:5000/api/auth/me', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(user => {
        currentUser = user;
        trySocketJoin();
        // load data and then navigate to dashboard
        loadInitialData().then(() => navigateTo('dashboard'));
    })
    .catch(() => {
        localStorage.removeItem('token');
    });
}

let currentUser = {
    name: 'John Doe',
    email: 'john.doe@stanford.edu',
    coins: 20,
    university: 'Stanford University',
    campus: 'Main Campus',
    city: 'Chennai',
    region: 'California',
    dorm: 'Baker Hall',
    skills: [],
    
};

let temporarySkills = [];

// Real data will be loaded from backend APIs. Dummy/local arrays removed.
let notifications = [];
let matchRequests = [];
let waitingRequests = [];
let chats = [];
let currentChatMessages = [];
let currentChatPartner = null;
let currentNegotiateRequest = null;
let discussionPosts = [];
let socket = null;
let mockUsers = [];

function trySocketJoin() {
    try {
        const userId = currentUser && (currentUser._id || currentUser.id || currentUser.userId);
        if (socket && socket.connected && userId) {
            socket.emit('join', String(userId));
            console.log('Socket joined room for user:', userId);
        }
    } catch (e) {
        console.warn('trySocketJoin error', e);
    }
}

let selectedRating = 0;

async function loadInitialData() {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    // Load notifications
    try {
        const res = await fetch('http://localhost:5000/api/notifications', { headers });
        if (res.ok) notifications = await res.json();
    } catch (e) {
        console.warn('Failed to load notifications', e);
    }

    // Load posts for discussion
    try {
        const res = await fetch('http://localhost:5000/api/posts');
        if (res.ok) {
            const posts = await res.json();
            // normalize posts to frontend shape and mark liked if current user liked them
            discussionPosts = posts.map(p => normalizePost(p));
        }
    } catch (e) {
        console.warn('Failed to load posts', e);
    }

    // Other data (matches, chats) can be loaded later when endpoints are available
}

// ============================================
// NAVIGATION
// ============================================
function navigateTo(page) {
    console.log('Navigating to:', page);
    document.querySelectorAll('[id$="Page"]').forEach(p => p.classList.add('hidden'));
    
    const targetPage = document.getElementById(page + 'Page');
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }
    
    closeSidebar();
    closeAllDropdowns();

    if (page === 'dashboard') {
        populateUsers();
        populateNotifications();
        updateCoinDisplay();
        updateLocationDisplay();
        updateUserName();
        updateMatchBadge();
        updateChatBadge();
    } else if (page === 'matches') {
        populateAllMatches();
    } else if (page === 'chats') {
        populateChats();
        updateChatBadge();
    } else if (page === 'chatRoom') {
        populateMessages();
    } else if (page === 'profile') {
        updateProfileDisplay();
    } else if (page === 'notifications') {
        populateAllNotifications();
    } else if (page === 'waitingRequests') {
        populateWaitingRequests();
    } else if (page === 'discussion') {
        populateDiscussionFeed();
    } else if (page === 'calendar') {
        currentCalendarFilter = 'all';
        renderCalendarSessions();
        document.querySelectorAll('.calendar-filters .filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById('calFilter-all')?.classList.add('active');
    } else if (page === 'settings') {
        setTimeout(() => loadSettings(), 100);
    }

    window.scrollTo(0, 0);
}

function closeSidebar() {
    document.querySelectorAll('.sidebar').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar-overlay').forEach(o => o.classList.remove('active'));
}

function closeAllDropdowns() {
    document.getElementById('notificationDropdown')?.classList.remove('active');
    document.getElementById('matchesDropdown')?.classList.remove('active');
}

// ============================================
// LANDING PAGE
// ============================================
const typingTexts = [
    'Connect. Learn. Grow. Repeat.',
    'Your skills are currency here.',
    'Transform knowledge into opportunity.'
];
let textIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeText() {
    const typingElement = document.getElementById('typingText');
    if (!typingElement) return;

    const currentText = typingTexts[textIndex];

    if (isDeleting) {
        typingElement.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typingElement.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;
    }

    let typingSpeed = isDeleting ? 50 : 100;

    if (!isDeleting && charIndex === currentText.length) {
        typingSpeed = 2000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % typingTexts.length;
        typingSpeed = 500;
    }

    setTimeout(typeText, typingSpeed);
}

// ============================================
// SIGNUP & SETUP
// ============================================
function quickSignup() {
    navigateTo('skillSetup');
}

function tryUseDeviceLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported in your browser.');
        return;
    }

    navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        window.__deviceLocation = { lat, lng };
        alert('Device location captured. You can continue signup now.');
    }, (err) => {
        console.warn('Device geolocation failed', err);
        alert("We couldn't get your device location. Please enable location permissions or enter your address.");
    }, { timeout: 10000 });
}

// Secure variant triggered by the small tick in the setup page.
function tryUseDeviceLocationSecure(checkbox) {
    const status = document.getElementById('locationStatus');
    const addSkillBtn = document.getElementById('addSkillBtn');
    if (!checkbox.checked) {
        if (status) status.textContent = 'Not loaded';
        if (addSkillBtn) addSkillBtn.disabled = true;
        return;
    }

    if (!navigator.geolocation) {
        if (status) status.textContent = 'Not supported';
        checkbox.checked = false;
        return;
    }

    if (status) status.textContent = 'Requesting...';

    navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        window.__deviceLocation = { lat, lng };
        if (status) status.textContent = 'Loaded ✓';
        if (addSkillBtn) addSkillBtn.disabled = false;
        // enable finish button only if we have device location or server-side location will be available
        const finishBtn = document.getElementById('finishSetupBtn');
        if (finishBtn) finishBtn.disabled = false;
    }, (err) => {
        console.warn('Secure device geolocation failed', err);
        if (status) status.textContent = 'Denied';
        checkbox.checked = false;
        if (addSkillBtn) addSkillBtn.disabled = true;
        const finishBtn = document.getElementById('finishSetupBtn');
        if (finishBtn) finishBtn.disabled = true;
        alert('Unable to load device location. Please enable location permissions in your browser.');
    }, { timeout: 15000 });
}

// Utility: check whether we have a valid location on the user (local or server)
function hasValidLocation() {
    // If server returned user with location, use that
    if (currentUser && currentUser.location && Array.isArray(currentUser.location.coordinates) && currentUser.location.coordinates.length === 2) return true;
    // Otherwise check for a captured device location
    if (window.__deviceLocation && window.__deviceLocation.lat && window.__deviceLocation.lng) return true;
    return false;
}

// Ensure Finish Setup is only enabled if a valid location exists.
function updateFinishButtonState() {
    const finishBtn = document.getElementById('finishSetupBtn');
    if (!finishBtn) return;
    finishBtn.disabled = !hasValidLocation();
}

// Call on load to set initial state
document.addEventListener('DOMContentLoaded', () => {
    updateFinishButtonState();
});

function openEditLocationModal() {
    // Populate inputs with currentUser values
    document.getElementById('profileUniversityInput').value = currentUser.university || '';
    document.getElementById('profileCampusInput').value = currentUser.campus || '';
    document.getElementById('profileCityInput').value = currentUser.city || '';
    document.getElementById('profileRegionInput').value = currentUser.region || '';
    document.getElementById('profileResidenceInput').value = currentUser.dorm || '';
    document.getElementById('profileCountryInput').value = currentUser.country || '';

    openModal('editLocationModal');
}

async function handleSignupSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const region = document.getElementById('signupRegion')?.value;
    const city = document.getElementById('signupCity')?.value;
    const campus = document.getElementById('signupCampus')?.value;
    const dorm = document.getElementById('signupDorm')?.value;

    try {
        const payload = { name, email, password, university: campus, campus, city, region, dorm };
        // If user clicked 'Use Device Location' we store coords in temporary fields (set by tryUseDeviceLocation)
        if (window.__deviceLocation) {
            payload.useDeviceLocation = true;
            payload.deviceLat = window.__deviceLocation.lat;
            payload.deviceLng = window.__deviceLocation.lng;
        }

        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Registration failed");
            return;
        }

        // Save token
        localStorage.setItem('token', data.token);

        currentUser = data.user;
        trySocketJoin();

        alert("✅ Registration successful!");

        navigateTo('skillSetup');

    } catch (error) {
        console.error(error);
        alert("Server error");
    }

    return false;
}


function addSkill() {
    const category = document.getElementById('skillCategorySelect').value;
    const skillName = document.getElementById('skillNameInput').value.trim();
    const proficiency = document.getElementById('proficiencySelect').value;
    const specialization = document.getElementById('specializationInput').value.trim();

    if (!category || !skillName) {
        alert('Please select a category and enter a skill name!');
        return;
    }

    const skill = {
        id: Date.now(),
        category: category,
        name: skillName,
        proficiency: proficiency,
        specialization: specialization
    };

    temporarySkills.push(skill);
    displayAddedSkills();

    document.getElementById('skillCategorySelect').value = '';
    document.getElementById('skillNameInput').value = '';
    document.getElementById('proficiencySelect').value = 'beginner';
    document.getElementById('specializationInput').value = '';
}

function displayAddedSkills() {
    const container = document.getElementById('addedSkillsList');
    if (!container) return;

    if (temporarySkills.length === 0) {
        container.innerHTML = '<p class="subtitle" style="text-align: center; padding: 20px;">No skills added yet. Add your first skill below!</p>';
        return;
    }

    container.innerHTML = temporarySkills.map(skill => `
        <div class="added-skill-card glass-card hover-lift">
            <div class="skill-info">
                <div class="skill-name-badge">
                    <span class="skill-category-icon">${getCategoryIcon(skill.category)}</span>
                    <strong>${skill.name}</strong>
                    <span class="proficiency-badge">${skill.proficiency}</span>
                </div>
                ${skill.specialization ? `<div class="skill-specialization">${skill.specialization}</div>` : ''}
            </div>
            <button class="remove-skill-btn" onclick="removeSkill(${skill.id})">×</button>
        </div>
    `).join('');
}

function removeSkill(skillId) {
    temporarySkills = temporarySkills.filter(s => s.id !== skillId);
    displayAddedSkills();
}

function getCategoryIcon(category) {
    const iconMap = {
        'music': '🎵', 'coding': '💻', 'languages': '🗣️',
        'fitness': '💪', 'art': '🎨', 'public-speaking': '🎤',
        'education': '📚', 'sports': '⚽', 'theatre': '🎭',
        'cycling': '🚴', 'other': '✨'
    };
    return iconMap[category] || '📌';
}

function completeSetup() {
    const universitySelect = document.getElementById('universitySelect').value;
    const customUniversity = document.getElementById('customUniversityInput')?.value;
    const campusSelect = document.getElementById('campusSelect').value;
    const customCampus = document.getElementById('customCampusInput')?.value;
    const citySelect = document.getElementById('citySelect')?.value;
    const customCity = document.getElementById('customCityInput')?.value;
    const regionSelect = document.getElementById('regionSelect').value;
const customRegion = document.getElementById('customRegionInput')?.value;
const region = regionSelect === 'other' ? customRegion : regionSelect;

    const dorm = document.getElementById('dormSelect').value;
    const country = document.getElementById('countrySelect')?.value;
    
    // Get final values - use custom input if "custom" was selected
    const university = universitySelect === 'custom' ? customUniversity : universitySelect;
    const campus = campusSelect === 'custom' ? customCampus : campusSelect;
    const city = citySelect === 'custom' ? customCity : citySelect;

    if (!university || !campus || temporarySkills.length === 0) {
        alert('Please complete all fields and add at least one skill!');
        return;
    }

    // Persist to server and ensure geocoding succeeds. If geocoding fails,
    // prompt the user to allow device location and retry.
    const payload = {
        university: universitySelect === 'custom' ? customUniversity : university,
        campus: campusSelect === 'custom' ? customCampus : getCampusName(campus),
        city: city,
        region: getRegionName(region),
        dorm,
        country: country || currentUser.country
    };

    // Save skills locally optimistically
    currentUser.skills = [...temporarySkills];

    // Call server to update profile and generate coords
    patchProfileLocation(payload).then(({ ok, status, json }) => {
        if (ok) {
            // update currentUser with server data and continue
            currentUser = json.user || currentUser;
            openModal('welcomeCoinsModal');
        } else if (status === 400) {
            // Geocoding failed on server - ask user to allow device location
            document.getElementById('needLocationMsg').textContent = (json && json.message) ? json.message : "We couldn't verify your address. Please allow device location.";
            openModal('needLocationModal');
        } else {
            alert((json && json.message) ? json.message : 'Failed to save profile. Please try again later.');
        }
    }).catch(err => {
        console.error('Profile update error', err);
        alert('Server error when saving profile. Please try again later.');
    });
}

async function patchProfileLocation(body) {
    const token = localStorage.getItem('token');
    if (!token) {
        return { ok: false, status: 401, json: { message: 'Not authenticated' } };
    }

    try {
        const res = await fetch('http://localhost:5000/api/users/profile', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const json = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, json };
    } catch (e) {
        console.error('patchProfileLocation fetch error', e);
        throw e;
    }
}

async function useDeviceLocationAndRetry() {
    // Request device location and retry profile update including device coords
    if (!navigator.geolocation) {
        document.getElementById('needLocationMsg').textContent = 'Geolocation is not supported by your browser.';
        return;
    }

    const useDeviceBtn = document.getElementById('useDeviceBtn');
    if (useDeviceBtn) useDeviceBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Build same payload we tried earlier (read current inputs again in case user changed)
        const universitySelect = document.getElementById('universitySelect').value;
        const customUniversity = document.getElementById('customUniversityInput')?.value;
        const campusSelect = document.getElementById('campusSelect').value;
        const customCampus = document.getElementById('customCampusInput')?.value;
        const citySelect = document.getElementById('citySelect')?.value;
        const customCity = document.getElementById('customCityInput')?.value;
        const regionSelect = document.getElementById('regionSelect').value;
        const customRegion = document.getElementById('customRegionInput')?.value;
        const region = regionSelect === 'other' ? customRegion : regionSelect;
        const dorm = document.getElementById('dormSelect').value;
        const country = document.getElementById('countrySelect')?.value;

        const payload = {
            university: universitySelect === 'custom' ? customUniversity : getUniversityName(universitySelect),
            campus: campusSelect === 'custom' ? customCampus : getCampusName(campusSelect),
            city: citySelect === 'custom' ? customCity : citySelect,
            region: getRegionName(region),
            dorm,
            country: country || currentUser.country,
            useDeviceLocation: true,
            deviceLat: lat,
            deviceLng: lng
        };

        try {
            const { ok, status, json } = await patchProfileLocation(payload);
            if (ok) {
                currentUser = json.user || currentUser;
                closeModal('needLocationModal');
                openModal('welcomeCoinsModal');
            } else {
                document.getElementById('needLocationMsg').textContent = (json && json.message) ? json.message : 'Unable to verify location with device coords.';
            }
        } catch (e) {
            document.getElementById('needLocationMsg').textContent = 'Network/server error when verifying location.';
        } finally {
            if (useDeviceBtn) useDeviceBtn.disabled = false;
        }

    }, (err) => {
        console.warn('Device geolocation failed', err);
        document.getElementById('needLocationMsg').textContent = "We couldn't get your device location. Please enable location permissions and try again.";
        if (useDeviceBtn) useDeviceBtn.disabled = false;
    }, { timeout: 15000 });
}

function closeWelcomeModal() {
    closeModal('welcomeCoinsModal');
    navigateTo('dashboard');
}

function getUniversityName(value) {
    const universities = {
        'stanford': 'Stanford University', 'mit': 'MIT',
        'harvard': 'Harvard University', 'berkeley': 'UC Berkeley'
    };
    return universities[value] || value;
}

function getCampusName(value) {
    const campuses = {
        'main': 'Main Campus', 'north': 'North Campus',
        'south': 'South Campus', 'east': 'East Campus'
    };
    return campuses[value] || value;
}

function getRegionName(value) {
    const regions = {
        'california': 'California', 'massachusetts': 'Massachusetts',
        'new-york': 'New York', 'texas': 'Texas'
    };
    return regions[value] || value;
}

// ============================================
// DASHBOARD
// ============================================
function toggleSidebar() {
    document.querySelectorAll('.sidebar').forEach(s => s.classList.toggle('active'));
    document.querySelectorAll('.sidebar-overlay').forEach(o => o.classList.toggle('active'));
}

function updateUserName() {
    document.querySelectorAll('#userName').forEach(el => {
        el.textContent = currentUser.name;
    });
}

function populateUsers() {
    const grid = document.getElementById('usersGrid');
    if (!grid) return;

    const sortedUsers = [...mockUsers].sort((a, b) => {
        if (a.dorm === currentUser.dorm && b.dorm !== currentUser.dorm) return -1;
        if (b.dorm === currentUser.dorm && a.dorm !== currentUser.dorm) return 1;
        if (a.distance === b.distance) return b.rating - a.rating;
        return a.distance - b.distance;
    });

    grid.innerHTML = sortedUsers.map(user => `
        <div class="user-card glass-card hover-lift">
            <div class="user-header">
                <div class="user-avatar gradient-bg">${user.avatar}</div>
                <div class="user-info">
                    <h4>${user.name}</h4>
                    <div class="user-skill">${user.skill}</div>
                    <div class="user-location">📍 ${user.campus}${user.dorm ? ' • ' + user.dorm : ''} • ${user.distance}km</div>
                </div>
            </div>
            <div class="user-stats">
                <div class="stat">
                    <span class="icon">⭐</span>
                    <span>${user.rating}</span>
                </div>
                <div class="stat">
                    <span class="icon">🪙</span>
                    <span>${user.coins}</span>
                </div>
            </div>
            <button class="request-btn glow-effect" onclick="requestSession('${user.name}')">
                Request Session
            </button>
        </div>
    `).join('');
}

function requestSession(userName) {
    alert(`Session request sent to ${userName}! 🎉`);
}

function filterUsers() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = mockUsers.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.skill.toLowerCase().includes(query) ||
        (user.dorm && user.dorm.toLowerCase().includes(query))
    );

    const grid = document.getElementById('usersGrid');
    if (!grid) return;

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state">No users found</div>';
        return;
    }

    grid.innerHTML = filtered.map(user => `
        <div class="user-card glass-card hover-lift">
            <div class="user-header">
                <div class="user-avatar gradient-bg">${user.avatar}</div>
                <div class="user-info">
                    <h4>${user.name}</h4>
                    <div class="user-skill">${user.skill}</div>
                    <div class="user-location">📍 ${user.campus} • ${user.distance}km</div>
                </div>
            </div>
            <div class="user-stats">
                <div class="stat"><span>⭐</span> ${user.rating}</div>
                <div class="stat"><span>🪙</span> ${user.coins}</div>
            </div>
            <button class="request-btn glow-effect" onclick="requestSession('${user.name}')">Request</button>
        </div>
    `).join('');
}

function updateCoinDisplay() {
    document.querySelectorAll('#coinDisplay, #profileCoins, #currentBalanceDisplay').forEach(el => {
        if (el) el.textContent = currentUser.coins;
    });
}

function updateLocationDisplay() {
    const uni = document.getElementById('currentUniversity');
    const loc = document.getElementById('currentLocation');
    if (uni) uni.textContent = currentUser.university;
    if (loc) loc.textContent = currentUser.campus;
}

// ============================================
// MATCHES SYSTEM
// ============================================
function toggleMatches() {
    closeAllDropdowns();
    const dropdown = document.getElementById('matchesDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
        populateMatchesDropdown();
    }
}

function updateMatchBadge() {
    const pendingCount = matchRequests.filter(m => m.status === 'pending').length;
    const badges = document.querySelectorAll('#matchBadge, #sidebarMatchBadge');
    badges.forEach(badge => {
        badge.textContent = pendingCount;
        badge.style.display = pendingCount > 0 ? 'flex' : 'none';
    });
}

function populateMatchesDropdown() {
    const list = document.getElementById('matchesList');
    if (!list) return;

    const pending = matchRequests.filter(m => m.status === 'pending').slice(0, 3);

    if (pending.length === 0) {
        list.innerHTML = '<div class="empty-state">No pending matches</div>';
        return;
    }

    list.innerHTML = pending.map(match => `
        <div class="match-item glass-card">
            <div class="match-header">
                <div class="match-avatar">${match.avatar}</div>
                <div class="match-info">
                    <strong>${match.from}</strong>
                    <span class="match-skill">${match.skill}</span>
                    <span class="match-time">${match.timestamp}</span>
                </div>
            </div>
            <p class="match-description">${match.description}</p>
            <div class="match-coins">🪙 ${match.coinsOffered} coins</div>
            <div class="match-actions">
                <button class="btn-small btn-accept" onclick="acceptMatch(${match.id})">Accept</button>
                <button class="btn-small btn-negotiate" onclick="openNegotiate(${match.id})">Negotiate</button>
                <button class="btn-small btn-decline" onclick="declineMatch(${match.id})">Decline</button>
            </div>
        </div>
    `).join('');
}

function populateAllMatches() {
    const container = document.getElementById('allMatchesList');
    if (!container) return;

    if (matchRequests.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No Match Requests</h3><p>You don\'t have any requests yet.</p></div>';
        return;
    }

    container.innerHTML = matchRequests.map(match => `
        <div class="match-card glass-card hover-lift">
            <div class="match-header">
                <div class="match-avatar gradient-bg">${match.avatar}</div>
                <div class="match-info">
                    <h3>${match.from}</h3>
                    <span class="match-skill">${match.skill}</span>
                </div>
                <span class="status-badge ${match.status}">${match.status}</span>
            </div>
            <p class="match-description">${match.description}</p>
            <div class="match-footer">
                <div class="coins-offered"><span>🪙</span> ${match.coinsOffered} coins</div>
                <span class="match-time">${match.timestamp}</span>
            </div>
            ${match.status === 'pending' ? `
                <div class="match-actions">
                    <button class="btn btn-primary glow-effect" onclick="acceptMatch(${match.id})">Accept</button>
                    <button class="btn btn-secondary glass-effect" onclick="openNegotiate(${match.id})">Negotiate</button>
                    <button class="btn btn-decline" onclick="declineMatch(${match.id})">Decline</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function acceptMatch(matchId) {
    const match = matchRequests.find(m => m.id === matchId);
    if (match) {
        match.status = 'accepted';
        currentUser.coins += match.coinsOffered;
        
        notifications.unshift({
            id: notifications.length + 1,
            text: `You accepted ${match.from}'s request! Session scheduled.`,
            unread: true,
            type: 'confirmed',
            time: 'Just now'
        });

        // Add to chats
        chats.unshift({
            id: chats.length + 1,
            partner: match.from,
            avatar: match.avatar,
            lastMessage: 'Request accepted! Let\'s discuss details.',
            unread: 1,
            timestamp: 'Just now',
            online: true
        });

        updateMatchBadge();
        updateChatBadge();
        populateMatchesDropdown();
        alert(`Match accepted! 🎉 You earned ${match.coinsOffered} coins. Start chatting to plan your session!`);
    }
}

function declineMatch(matchId) {
    if (confirm('Are you sure you want to decline this request?')) {
        matchRequests = matchRequests.filter(m => m.id !== matchId);
        updateMatchBadge();
        populateMatchesDropdown();
        populateAllMatches();
    }
}

function openNegotiate(matchId) {
    currentNegotiateRequest = matchRequests.find(m => m.id === matchId);
    if (currentNegotiateRequest) {
        document.getElementById('negotiateOriginalOffer').textContent = currentNegotiateRequest.coinsOffered;
        document.getElementById('negotiateRequester').textContent = currentNegotiateRequest.from;
        openModal('negotiateModal');
    }
}

function submitNegotiation() {
    const counterOffer = parseInt(document.getElementById('counterOffer').value);
    const message = document.getElementById('negotiateMessage').value;

    if (!counterOffer || counterOffer < 1) {
        alert('Please enter a valid counter-offer!');
        return;
    }

    if (currentNegotiateRequest) {
        notifications.unshift({
            id: notifications.length + 1,
            text: `Counter-offer of ${counterOffer} coins sent to ${currentNegotiateRequest.from}`,
            unread: true,
            type: 'request',
            time: 'Just now'
        });

        alert(`Counter-offer sent! ${currentNegotiateRequest.from} will be notified.`);
        closeModal('negotiateModal');
        document.getElementById('counterOffer').value = '';
        document.getElementById('negotiateMessage').value = '';
    }
}

// ============================================
// CHAT SYSTEM
// ============================================
function toggleNotifications() {
    closeAllDropdowns();
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
        populateNotifications();
    }
}

function populateNotifications() {
    const list = document.getElementById('notificationList');
    if (!list) return;

    const recent = notifications.slice(0, 2);
    list.innerHTML = recent.map(notif => `
        <div class="notification-item ${notif.unread ? 'unread' : ''}">
            <p>${notif.text}</p>
            <span class="notif-time">${notif.time}</span>
        </div>
    `).join('');

    const unreadCount = notifications.filter(n => n.unread).length;
    const badge = document.getElementById('notifBadge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function populateAllNotifications() {
    const container = document.getElementById('allNotificationsList');
    if (!container) return;

    container.innerHTML = notifications.map(notif => `
        <div class="notification-card glass-card ${notif.unread ? 'unread' : ''}">
            <div class="notif-icon">${getNotificationIcon(notif.type)}</div>
            <div class="notif-content">
                <p>${notif.text}</p>
                <span class="notif-timestamp">${notif.time}</span>
            </div>
        </div>
    `).join('');

    setTimeout(() => {
        notifications.forEach(n => n.unread = false);
        populateNotifications();
    }, 1000);
}

function getNotificationIcon(type) {
    const icons = { 'request': '📩', 'confirmed': '✅', 'review': '⭐', 'reminder': '⏰' };
    return icons[type] || '📬';
}

function updateChatBadge() {
    const unreadCount = chats.reduce((sum, chat) => sum + chat.unread, 0);
    const badges = document.querySelectorAll('#chatBadge, #sidebarChatBadge');
    badges.forEach(badge => {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    });
}

function populateChats() {
    const container = document.getElementById('chatList');
    if (!container) return;

    if (chats.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No Chats Yet</h3><p>Start a conversation!</p></div>';
        return;
    }

    container.innerHTML = chats.map(chat => `
        <div class="chat-item glass-card hover-lift" onclick="openChat(${chat.id})">
            <div class="chat-avatar gradient-bg">${chat.avatar}</div>
            <div class="chat-info">
                <div class="chat-header-row">
                    <strong>${chat.partner}</strong>
                    <span class="chat-time">${chat.timestamp}</span>
                </div>
                <div class="chat-preview">
                    ${chat.lastMessage}
                    ${chat.unread > 0 ? `<span class="unread-badge">${chat.unread}</span>` : ''}
                </div>
            </div>
            ${chat.online ? '<span class="online-dot pulse"></span>' : ''}
        </div>
    `).join('');
}

function openChat(chatId) {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
        currentChatPartner = chat;
        chat.unread = 0;
        document.getElementById('chatPartnerName').textContent = chat.partner;
        navigateTo('chatRoom');
        updateChatBadge();
    }
}

function populateMessages() {
    const container = document.getElementById('messagesContainer');
    if (!container) return;

    container.innerHTML = currentChatMessages.map(msg => `
        <div class="message ${msg.from === 'me' ? 'message-sent' : 'message-received'}">
            <div class="message-bubble glass-card">
                <p>${msg.text}</p>
                <span class="message-time">${msg.timestamp}</span>
            </div>
        </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();

    if (!text) return;

    const newMessage = {
        id: currentChatMessages.length + 1,
        from: 'me',
        text: text,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    currentChatMessages.push(newMessage);
    
    if (currentChatPartner) {
        const chatIndex = chats.findIndex(c => c.partner === currentChatPartner.partner);
        if (chatIndex !== -1) {
            chats[chatIndex].lastMessage = text;
            chats[chatIndex].timestamp = 'Just now';
        }
    }

    populateMessages();
    input.value = '';
}

function handleMessageKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// ============================================
// OTHER FUNCTIONS
// ============================================
function populateWaitingRequests() {
    const container = document.getElementById('waitingRequestsList');
    if (!container) return;

    if (waitingRequests.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No Waiting Requests</h3></div>';
        return;
    }

    container.innerHTML = waitingRequests.map(req => `
        <div class="request-card glass-card">
            <div class="request-header">
                <h3>${req.skill}</h3>
                <span class="status-badge ${req.status}">${req.status}</span>
            </div>
            <p class="request-description">${req.description}</p>
            <div class="request-footer">
                <div class="coins-offered"><span>🪙</span> ${req.coinsOffered} coins</div>
                <span class="request-time">${req.timestamp}</span>
            </div>
        </div>
    `).join('');
}

function submitTicket() {
    const skill = document.getElementById('ticketSkill').value;
    const description = document.getElementById('ticketDescription').value.trim();
    const coinsOffered = parseInt(document.getElementById('ticketCoins').value);

    if (!skill || !description || !coinsOffered) {
        alert('Please fill in all fields!');
        return;
    }

    if (coinsOffered > currentUser.coins) {
        alert('Insufficient coins!');
        return;
    }

    waitingRequests.unshift({
        id: waitingRequests.length + 1,
        skill: skill,
        description: description,
        coinsOffered: coinsOffered,
        status: 'pending',
        timestamp: 'Just now'
    });

    alert('Request submitted! 🎯');
    closeModal('raiseTicketModal');
}

function updateProfileDisplay() {
    const elements = {
        profileName: currentUser.name,
        profileEmail: currentUser.email,
        profileUniversity: currentUser.university,
        profileCampus: currentUser.campus,
        profileRegion: currentUser.region,
        profileResidence: currentUser.dorm || 'Not specified',
        profileCoins: currentUser.coins
    };

    Object.entries(elements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });

    const skillsList = document.getElementById('profileSkillsList');
    if (skillsList) {
        if (currentUser.skills.length === 0) {
            skillsList.innerHTML = '<p class="subtitle">No skills yet</p>';
        } else {
            skillsList.innerHTML = currentUser.skills.map(skill => `
                <div class="profile-skill-item glass-card hover-lift">
                    <div class="skill-info">
                        <span class="skill-icon">${getCategoryIcon(skill.category)}</span>
                        <div>
                            <strong>${skill.name}</strong>
                            <span class="skill-level">${skill.proficiency}</span>
                        </div>
                    </div>
                    <button class="remove-skill-btn" onclick="removeProfileSkill(${skill.id})">×</button>
                </div>
            `).join('');
        }
    }
}

// Called when user edits location fields in profile settings
async function submitProfileLocationUpdate() {
    const university = document.getElementById('profileUniversityInput')?.value;
    const campus = document.getElementById('profileCampusInput')?.value;
    const city = document.getElementById('profileCityInput')?.value;
    const region = document.getElementById('profileRegionInput')?.value;
    const dorm = document.getElementById('profileResidenceInput')?.value;
    const country = document.getElementById('profileCountryInput')?.value;

    const useDevice = !!window.__deviceLocation;
    const payload = { university, campus, city, region, dorm, country };
    if (useDevice) {
        payload.useDeviceLocation = true;
        payload.deviceLat = window.__deviceLocation.lat;
        payload.deviceLng = window.__deviceLocation.lng;
    }

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/users/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.message || 'Failed to update profile location');
            return;
        }
        // Update UI
        currentUser = data.user;
        updateProfileDisplay();
        alert('✅ Location updated');
    } catch (e) {
        console.error(e);
        alert('Server error');
    }
}

function removeProfileSkill(skillId) {
    if (confirm('Remove this skill?')) {
        currentUser.skills = currentUser.skills.filter(s => s.id !== skillId);
        updateProfileDisplay();
    }
}

function saveNewSkill() {
    const category = document.getElementById('newSkillCategory').value;
    const name = document.getElementById('newSkillName').value.trim();
    const proficiency = document.getElementById('newSkillProficiency').value;

    if (!name) {
        alert('Please enter a skill name!');
        return;
    }

    currentUser.skills.push({
        id: Date.now(),
        category, name, proficiency,
        specialization: ''
    });

    updateProfileDisplay();
    closeModal('addSkillModal');
    document.getElementById('newSkillName').value = '';
}

function populateDiscussionFeed() {
    const container = document.getElementById('postsContainer');
    if (!container) return;

    container.innerHTML = discussionPosts.map(post => `
        <div class="post-card glass-card">
            <div class="post-header">
                <div class="post-avatar gradient-bg">${post.avatar}</div>
                <div class="post-author">
                    <strong>${post.author}</strong>
                    <span class="post-time">${post.timestamp}</span>
                </div>
            </div>
            ${post.content ? `<p class="post-content">${post.content}</p>` : ''}
            ${post.media ? `
                <div class="post-media">
                    ${post.media.type === 'image' ? 
                        `<img src="${post.media.url}" alt="Post media" onclick="openMediaModal('${post.media.url}', 'image')">` :
                        `<video controls src="${post.media.url}"></video>`
                    }
                </div>
            ` : ''}
            <div class="post-footer">
                <button class="post-action ${post.liked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                    👍 ${post.likes}
                </button>
                <button class="post-action">💬 ${post.comments}</button>
            </div>
        </div>
    `).join('');
}

function openMediaModal(url, type) {
    // Create a simple modal to view media in full size
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        cursor: pointer;
    `;
    
    if (type === 'image') {
        modal.innerHTML = `<img src="${url}" style="max-width: 90%; max-height: 90%; border-radius: 12px;">`;
    }
    
    modal.onclick = () => document.body.removeChild(modal);
    document.body.appendChild(modal);
}

// Normalize a server post document into the frontend shape and mark liked
function normalizePost(p) {
    const userId = currentUser && (currentUser._id || currentUser.id || currentUser._id?.toString?.());
    const likesArray = Array.isArray(p.likes) ? p.likes : [];

    const likedByCurrent = likesArray.some(l => {
        if (!userId) return false;
        if (!l) return false;
        if (typeof l === 'string') return l === String(userId);
        if (l._id) return String(l._id) === String(userId);
        if (l.toString) return String(l) === String(userId);
        return false;
    });

    return {
        id: p._id || p.id,
        author: p.author?.name || 'User',
        avatar: p.author?.profileImage || p.author?.avatar || '👤',
        content: p.content || '',
        likes: Array.isArray(p.likes) ? p.likes.length : (p.likes || 0),
        comments: Array.isArray(p.comments) ? p.comments.length : (p.comments || 0),
        timestamp: p.createdAt ? new Date(p.createdAt).toLocaleString() : (p.timestamp || 'Just now'),
        liked: !!likedByCurrent,
        media: p.media ? { url: p.media, type: p.mediaType } : null
    };
}

async function toggleLike(postId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please sign in to like posts');
        return;
    }

    // Optimistic UI: toggle locally while request is in-flight
    const post = discussionPosts.find(p => p.id === postId);
    if (!post) return;

    const prevLiked = post.liked;
    const prevLikes = post.likes;

    post.liked = !post.liked;
    post.likes = post.likes + (post.liked ? 1 : -1);
    populateDiscussionFeed();

    try {
        const res = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            // revert optimistic change
            post.liked = prevLiked;
            post.likes = prevLikes;
            populateDiscussionFeed();
            const err = await res.json().catch(() => ({}));
            console.warn('Like request failed', err);
        } else {
            // Server will emit 'postUpdated' via socket; final UI update happens there.
            // In case socket isn't connected, update from response now.
            const updated = await res.json();
            if (!socket) {
                const norm = normalizePost(updated);
                const idx = discussionPosts.findIndex(x => x.id === norm.id);
                if (idx !== -1) discussionPosts[idx] = norm;
                else discussionPosts.unshift(norm);
                populateDiscussionFeed();
            }
        }
    } catch (e) {
        post.liked = prevLiked;
        post.likes = prevLikes;
        populateDiscussionFeed();
        console.error('Like request error', e);
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        if (modalId === 'raiseTicketModal') updateCoinDisplay();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing SkillChain...');
    // Load public data (posts/notifications) then show landing
    loadInitialData().finally(() => {
        navigateTo('landing');
        console.log('Landing page should now be visible');
        setTimeout(typeText, 1000);
    });

    // Apply saved settings (theme/email prefs) on initial load
    try {
        loadSettings();
    } catch (e) {
        console.warn('loadSettings failed on init', e);
    }

    // Initialize socket.io client for realtime updates (posts, notifications)
    function initSocket() {
        try {
            if (typeof io !== 'undefined') {
                socket = io('http://localhost:5000');

                socket.on('connect', () => {
                    console.log('Connected to socket.io server');
                    trySocketJoin();
                });

                socket.on('postUpdated', (post) => {
                    try {
                        const norm = normalizePost(post);
                        const idx = discussionPosts.findIndex(p => p.id === norm.id);
                        if (idx !== -1) {
                            discussionPosts[idx] = norm;
                        } else {
                            discussionPosts.unshift(norm);
                        }
                        // If discussion page is visible, re-render feed
                        populateDiscussionFeed();
                    } catch (e) {
                        console.error('Error handling postUpdated', e);
                    }
                });

                socket.on('notification', (notif) => {
                    // Prepend notifications and update UI
                    notifications.unshift(notif);
                    populateNotifications();
                });
            } else {
                console.warn('socket.io client not available (io is undefined)');
            }
        } catch (e) {
            console.warn('Socket initialization error', e);
        }
    }

    if (typeof io === 'undefined') {
        // Try load socket.io client from CDN if not already available
        const s = document.createElement('script');
        s.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
        s.onload = initSocket;
        s.onerror = () => {
            console.warn('Failed to load socket.io client from CDN');
            initSocket();
        };
        document.head.appendChild(s);
    } else {
        initSocket();
    }

    // Language initialization removed (feature reverted)

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.icon-btn') && !e.target.closest('.dropdown-panel')) {
            closeAllDropdowns();
        }
    });
    
    console.log('SkillChain initialization complete!');
});

// ============================================
// SIGN IN FUNCTIONALITY
// ============================================
function quickSignIn() {
    navigateTo('dashboard');
}

async function handleSignInSubmit(event) {
    event.preventDefault();

    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;

    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Login failed");
            return;
        }

        localStorage.setItem('token', data.token);
        currentUser = data.user;
        trySocketJoin();

        alert("✅ Login successful!");
        navigateTo('dashboard');

    } catch (error) {
        console.error(error);
        alert("Server error");
    }

    return false;
}


function showForgotPassword() {
    alert('Password reset link will be sent to your email. This feature will be integrated with backend.');
}

// ============================================
// CUSTOM UNIVERSITY/CAMPUS/CITY HANDLERS
// ============================================
function handleUniversityChange() {
    const select = document.getElementById('universitySelect');
    const customInput = document.getElementById('customUniversityInput');
    
    if (select.value === 'custom') {
        customInput.style.display = 'block';
        customInput.required = true;
    } else {
        customInput.style.display = 'none';
        customInput.required = false;
        customInput.value = '';
    }
}

function handleCampusChange() {
    const select = document.getElementById('campusSelect');
    const customInput = document.getElementById('customCampusInput');
    
    if (select.value === 'custom') {
        customInput.style.display = 'block';
        customInput.required = true;
    } else {
        customInput.style.display = 'none';
        customInput.required = false;
        customInput.value = '';
    }
}

function handleCityChange() {
    const select = document.getElementById('citySelect');
    const customInput = document.getElementById('customCityInput');
    
    if (select.value === 'custom') {
        customInput.style.display = 'block';
        customInput.required = true;
    } else {
        customInput.style.display = 'none';
        customInput.required = false;
        customInput.value = '';
    }
}

function handleRegionChange() {
    const select = document.getElementById('regionSelect');
    const customInput = document.getElementById('customRegionInput');

    if (!select || !customInput) return;

    if (select.value === 'other') {
        customInput.style.display = 'block';
        customInput.required = true;
    } else {
        customInput.style.display = 'none';
        customInput.required = false;
        customInput.value = '';
    }
}

// Language / i18n feature removed per user request.

// ============================================
// MEDIA ATTACHMENT FOR POSTS
// ============================================
let selectedMediaFile = null;
let selectedMediaURL = null;

function handleMediaSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
        alert('Please select a valid image or video file (JPEG, PNG, GIF, WebP, MP4, WebM)');
        return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('File size should be less than 10MB');
        return;
    }
    
    selectedMediaFile = file;
    selectedMediaURL = URL.createObjectURL(file);
    
    // Show preview
    const preview = document.getElementById('postMediaPreview');
    const previewImage = document.getElementById('mediaPreviewImage');
    
    if (file.type.startsWith('image/')) {
        previewImage.src = selectedMediaURL;
        previewImage.style.display = 'block';
        preview.style.display = 'block';
    } else if (file.type.startsWith('video/')) {
        // For video, create a video element instead
        preview.innerHTML = `
            <video controls style="max-width: 100%; border-radius: 12px;">
                <source src="${selectedMediaURL}" type="${file.type}">
            </video>
            <button class="remove-media-btn" onclick="removeMedia()">×</button>
        `;
        preview.style.display = 'block';
    }
}

function removeMedia() {
    selectedMediaFile = null;
    if (selectedMediaURL) {
        URL.revokeObjectURL(selectedMediaURL);
        selectedMediaURL = null;
    }
    
    const preview = document.getElementById('postMediaPreview');
    const previewImage = document.getElementById('mediaPreviewImage');
    const mediaInput = document.getElementById('mediaInput');
    
    preview.style.display = 'none';
    previewImage.src = '';
    previewImage.style.display = 'none';
    mediaInput.value = '';
}

// Create post (sends to backend). Uses FormData for media uploads.
async function createPost() {
    const contentEl = document.getElementById('postContent');
    if (!contentEl) return;
    const content = contentEl.value.trim();

    if (!content && !selectedMediaFile) {
        alert('Please write something or attach media!');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please sign in to post.');
        return;
    }

    // Disable button while uploading
    const postBtn = document.querySelector('button[onclick="createPost()"]');
    if (postBtn) {
        postBtn.disabled = true;
        postBtn.textContent = 'Posting...';
    }

    try {
        const form = new FormData();
        form.append('content', content);
        if (selectedMediaFile) form.append('media', selectedMediaFile);

        const res = await fetch('http://localhost:5000/api/posts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: form
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(err.message || 'Failed to create post');
            return;
        }

        const created = await res.json();

        // If socket isn't connected or server didn't broadcast yet, ensure feed shows the new post
        if (!socket || !socket.connected) {
            const norm = normalizePost(created);
            const idx = discussionPosts.findIndex(p => p.id === norm.id);
            if (idx === -1) discussionPosts.unshift(norm);
            populateDiscussionFeed();
        }

        // Clear inputs
        contentEl.value = '';
        removeMedia();

    } catch (e) {
        console.error('Create post error', e);
        alert('Server error while creating post');
    } finally {
        if (postBtn) {
            postBtn.disabled = false;
            postBtn.textContent = 'Post';
        }
    }
}

// ============================================
// IMPROVED FILTERING WITH PRIORITY
// ============================================
function applyFilters() {
    const city = document.getElementById('filterCity')?.value || 'all';
    const region = document.getElementById('filterRegion')?.value || 'all';
    const university = document.getElementById('filterUniversity')?.value || 'all';
    const campus = document.getElementById('filterCampus')?.value || 'all';
    const skillCategory = document.getElementById('filterSkillCategory')?.value || 'all';
    const nearMe = document.getElementById('filterNearMe')?.checked || false;
    
    // Filter users based on multiple criteria with priority
    let filteredUsers = [...mockUsers];
    
    // Apply filters
    if (city !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.city?.toLowerCase() === city.toLowerCase());
    }
    
    if (region !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.region?.toLowerCase() === region.toLowerCase());
    }
    
    if (university !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.university?.toLowerCase().includes(university.toLowerCase()));
    }
    
    if (campus !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.campus?.toLowerCase().includes(campus.toLowerCase()));
    }
    
    if (skillCategory !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.category?.toLowerCase() === skillCategory.toLowerCase());
    }
    
    // Sort by priority if nearMe is checked
    if (nearMe) {
        filteredUsers.sort((a, b) => {
            // Priority: same campus > same city > same region > distance
            if (a.campus === currentUser.campus && b.campus !== currentUser.campus) return -1;
            if (a.campus !== currentUser.campus && b.campus === currentUser.campus) return 1;
            
            if (a.city === currentUser.city && b.city !== currentUser.city) return -1;
            if (a.city !== currentUser.city && b.city === currentUser.city) return 1;
            
            if (a.region === currentUser.region && b.region !== currentUser.region) return -1;
            if (a.region !== currentUser.region && b.region === currentUser.region) return 1;
            
            return (a.distance || 999) - (b.distance || 999);
        });
    }
    
    // Update display
    mockUsers = filteredUsers.length > 0 ? filteredUsers : mockUsers;
    populateUsers();
    closeModal('filterModal');
}


// ============================================
// SETTINGS PAGE FUNCTIONALITY
// ============================================
function saveSettings() {
    // Notification Settings
    const notifSettings = {
        matchRequests: document.getElementById('notifMatchRequests')?.checked,
        messages: document.getElementById('notifMessages')?.checked,
        reminders: document.getElementById('notifReminders')?.checked,
        reviews: document.getElementById('notifReviews')?.checked,
        posts: document.getElementById('notifPosts')?.checked
    };
    
    // Privacy Settings
    const privacySettings = {
        profileVisible: document.getElementById('privacyProfile')?.checked,
        showOnline: document.getElementById('privacyOnline')?.checked,
        showLocation: document.getElementById('privacyLocation')?.checked
    };
    
    // App Preferences
    const preferences = {
        theme: document.getElementById('prefTheme')?.value,
        emailFrequency: document.getElementById('prefEmailFreq')?.value
    };
    
    // Store settings (in production, send to backend)
    localStorage.setItem('notificationSettings', JSON.stringify(notifSettings));
    localStorage.setItem('privacySettings', JSON.stringify(privacySettings));
    localStorage.setItem('appPreferences', JSON.stringify(preferences));
    
    // Show success message
    alert('✅ Settings saved successfully!');
    
    // Apply theme if changed
    applyTheme(preferences.theme);
}

function loadSettings() {
    // Load saved settings from localStorage
    const notifSettings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    const privacySettings = JSON.parse(localStorage.getItem('privacySettings') || '{}');
    const preferences = JSON.parse(localStorage.getItem('appPreferences') || '{}');
    
    // Apply notification settings
    if (notifSettings.matchRequests !== undefined) {
        document.getElementById('notifMatchRequests').checked = notifSettings.matchRequests;
    }
    if (notifSettings.messages !== undefined) {
        document.getElementById('notifMessages').checked = notifSettings.messages;
    }
    if (notifSettings.reminders !== undefined) {
        document.getElementById('notifReminders').checked = notifSettings.reminders;
    }
    if (notifSettings.reviews !== undefined) {
        document.getElementById('notifReviews').checked = notifSettings.reviews;
    }
    if (notifSettings.posts !== undefined) {
        document.getElementById('notifPosts').checked = notifSettings.posts;
    }
    
    // Apply privacy settings
    if (privacySettings.profileVisible !== undefined) {
        document.getElementById('privacyProfile').checked = privacySettings.profileVisible;
    }
    if (privacySettings.showOnline !== undefined) {
        document.getElementById('privacyOnline').checked = privacySettings.showOnline;
    }
    if (privacySettings.showLocation !== undefined) {
        document.getElementById('privacyLocation').checked = privacySettings.showLocation;
    }
    
    // Apply preferences
    if (preferences.theme) {
        document.getElementById('prefTheme').value = preferences.theme;
        applyTheme(preferences.theme);
    }
    if (preferences.emailFrequency) {
        document.getElementById('prefEmailFreq').value = preferences.emailFrequency;
    }
}

// Apply theme choice: 'dark' | 'light' | 'auto'
function applyTheme(theme) {
    try {
        if (!theme || theme === 'dark') {
            document.body.classList.remove('light-mode');
            // remove any system listener
            if (window.__themeMediaListener) {
                window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', window.__themeMediaListener);
                window.__themeMediaListener = null;
            }
        } else if (theme === 'light') {
            document.body.classList.add('light-mode');
            if (window.__themeMediaListener) {
                window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', window.__themeMediaListener);
                window.__themeMediaListener = null;
            }
        } else if (theme === 'auto') {
            // follow system preference
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            const apply = () => {
                if (mq.matches) {
                    document.body.classList.remove('light-mode');
                } else {
                    document.body.classList.add('light-mode');
                }
            };
            apply();
            // store listener so we can remove it later
            if (window.__themeMediaListener) {
                mq.removeEventListener('change', window.__themeMediaListener);
            }
            window.__themeMediaListener = apply;
            mq.addEventListener('change', apply);
        }
    } catch (e) {
        console.warn('applyTheme error', e);
    }
}

function changePassword() {
    const newPassword = prompt('Enter your new password:');
    if (newPassword && newPassword.length >= 6) {
        alert('✅ Password changed successfully! (This would be sent to backend in production)');
    } else if (newPassword) {
        alert('❌ Password must be at least 6 characters long');
    }
}

function exportData() {
    // In production, this would trigger a backend process to export user data
    const userData = {
        user: currentUser,
        notifications: notifications,
        matches: matchRequests,
        chats: chats,
        posts: discussionPosts.filter(p => p.author === currentUser.name),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'skillchain-data-export.json';
    link.click();
    URL.revokeObjectURL(url);
    
    alert('✅ Your data has been exported!');
}

function deleteAccount() {
    const confirmation = confirm('⚠️ Are you sure you want to delete your account? This action cannot be undone!');
    if (confirmation) {
        const finalConfirmation = confirm('This will permanently delete all your data, matches, and messages. Are you absolutely sure?');
        if (finalConfirmation) {
            // In production, send delete request to backend
            alert('Account deletion request submitted. (Would be processed by backend in production)');
            // Optionally logout
            navigateTo('landing');
        }
    }
}

// ============================================
// CALENDAR FUNCTIONS
// ============================================

// Mock calendar sessions data
let calendarSessions = [
    {
        id: 1,
        title: 'Python Coding Session',
        partner: 'John Davidson',
        partnerAvatar: '👨‍💻',
        date: '2024-03-15',
        time: '2:00 PM',
        location: 'Main Campus Library',
        status: 'scheduled',
        type: 'provider',
        skill: 'Python',
        coins: 12
    },
    {
        id: 2,
        title: 'Guitar Lesson',
        partner: 'Sarah Martinez',
        partnerAvatar: '👩‍🎤',
        date: '2024-03-16',
        time: '4:30 PM',
        location: 'Music Room, Baker Hall',
        status: 'scheduled',
        type: 'requester',
        skill: 'Guitar',
        coins: 15
    },
    {
        id: 3,
        title: 'Spanish Conversation',
        partner: 'Emma Chen',
        partnerAvatar: '👩‍🏫',
        date: '2024-03-10',
        time: '1:00 PM',
        location: 'Student Center',
        status: 'completed',
        type: 'requester',
        skill: 'Spanish',
        coins: 10
    }
];

let currentCalendarFilter = 'all';

function filterCalendar(filter) {
    currentCalendarFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.calendar-filters .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`calFilter-${filter}`).classList.add('active');
    
    // Render sessions
    renderCalendarSessions();
}

function renderCalendarSessions() {
    const container = document.getElementById('calendarSessions');
    const emptyState = document.getElementById('emptyCalendar');
    
    if (!container) return;
    
    // Filter sessions
    let filteredSessions = calendarSessions;
    if (currentCalendarFilter !== 'all') {
        filteredSessions = calendarSessions.filter(s => s.status === currentCalendarFilter);
    }
    
    // Sort by date (upcoming first)
    filteredSessions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (filteredSessions.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    container.innerHTML = filteredSessions.map(session => {
        const sessionDate = new Date(session.date);
        const isUpcoming = sessionDate > new Date();
        const isPast = sessionDate < new Date();
        
        return `
            <div class="calendar-session glass-card hover-lift ${session.status}">
                <div class="session-header">
                    <div class="session-avatar">${session.partnerAvatar}</div>
                    <div class="session-info">
                        <h3>${session.title}</h3>
                        <p class="session-partner">
                            ${session.type === 'provider' ? '👨‍🏫 Teaching' : '👨‍🎓 Learning'} with ${session.partner}
                        </p>
                    </div>
                    <div class="session-status ${session.status}">
                        ${session.status === 'scheduled' ? (isUpcoming ? '📅 Upcoming' : '⏰ Today') : '✅ Completed'}
                    </div>
                </div>
                
                <div class="session-details">
                    <div class="session-detail">
                        <span class="detail-icon">📅</span>
                        <span>${formatDate(session.date)}</span>
                    </div>
                    <div class="session-detail">
                        <span class="detail-icon">🕐</span>
                        <span>${session.time}</span>
                    </div>
                    <div class="session-detail">
                        <span class="detail-icon">📍</span>
                        <span>${session.location}</span>
                    </div>
                    <div class="session-detail">
                        <span class="detail-icon">🪙</span>
                        <span>${session.coins} coins</span>
                    </div>
                </div>
                
                ${session.status === 'scheduled' ? `
                    <div class="session-actions">
                        <button class="btn btn-secondary glass-effect" onclick="rescheduleSession(${session.id})">
                            <span>Reschedule</span>
                        </button>
                        <button class="btn btn-primary glow-effect" onclick="viewSessionDetails(${session.id})">
                            <span>View Details</span>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
}

function rescheduleSession(sessionId) {
    const session = calendarSessions.find(s => s.id === sessionId);
    if (session) {
        // In production, this would open a modal for rescheduling
        const newDate = prompt(`Reschedule "${session.title}"\n\nCurrent: ${session.date} at ${session.time}\n\nEnter new date (YYYY-MM-DD):`);
        if (newDate) {
            const newTime = prompt('Enter new time (e.g., 2:00 PM):');
            if (newTime) {
                session.date = newDate;
                session.time = newTime;
                renderCalendarSessions();
                alert('✅ Session rescheduled successfully!');
            }
        }
    }
}

function viewSessionDetails(sessionId) {
    const session = calendarSessions.find(s => s.id === sessionId);
    if (session) {
        alert(`
📅 Session Details

Title: ${session.title}
Partner: ${session.partner}
Date: ${session.date}
Time: ${session.time}
Location: ${session.location}
Coins: ${session.coins}
Type: ${session.type === 'provider' ? 'Teaching Session' : 'Learning Session'}
Status: ${session.status}
        `);
    }
}

// Update navigateTo function to handle settings page

// ============================================
// ERROR HANDLING & DEBUGGING
// ============================================
window.onerror = function(message, source, lineno, colno, error) {
    console.error('JavaScript Error:', {
        message: message,
        source: source,
        line: lineno,
        column: colno,
        error: error
    });
    alert('An error occurred. Please check the browser console (F12) for details.');
    return false;
};

// Make navigateTo globally accessible for debugging
window.navigateTo = navigateTo;

console.log('Error handling initialized. navigateTo is now globally accessible.');
console.log('Try clicking buttons now!');
document.addEventListener("DOMContentLoaded", function() {
    const regionSelect = document.getElementById("regionSelect");
    const customRegionInput = document.getElementById("customRegionInput");

    if (regionSelect) {
        regionSelect.addEventListener("change", function() {
            if (this.value === "other") {
                customRegionInput.style.display = "block";
                customRegionInput.required = true;
            } else {
                customRegionInput.style.display = "none";
                customRegionInput.required = false;
                customRegionInput.value = "";
            }
        });
    }
});
