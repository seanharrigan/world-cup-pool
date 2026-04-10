function showToast(message, type = 'error') {
    const container = document.getElementById('toast-container');

    if (!container) {
        return;
    }

    const toast = document.createElement('div');
    const palette = type === 'success'
        ? 'bg-green-600 border-green-500 text-white'
        : 'bg-red-600 border-red-500 text-white';

    toast.className = `animate-bounce-in rounded-2xl border px-4 py-3 font-black uppercase tracking-wider shadow-2xl ${palette}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2800);
}

function attachAlphaJumpToSelect(select) {
    if (!select || select.dataset.alphaJumpBound === 'true') {
        return;
    }

    select.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) {
            return;
        }

        const letter = event.key.toLowerCase();
        if (!/[a-z]/.test(letter)) {
            return;
        }

        const options = Array.from(select.options);
        const currentIndex = Math.max(select.selectedIndex, 0);
        const matcher = (option) => (option.value || option.textContent || '').trim().toLowerCase().startsWith(letter);
        const nextIndex = options.findIndex((option, index) => index > currentIndex && matcher(option));
        const fallbackIndex = options.findIndex((option) => matcher(option));
        const targetIndex = nextIndex >= 0 ? nextIndex : fallbackIndex;

        if (targetIndex <= 0) {
            return;
        }

        event.preventDefault();
        select.selectedIndex = targetIndex;
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    select.dataset.alphaJumpBound = 'true';
}

function showConfirmModal({
    label = 'Confirm Email',
    icon = '✉️',
    title = 'Are you sure?',
    message = '',
    detail = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    singleAction = false
}) {
    const modal = document.getElementById('confirm-modal');
    const iconEl = document.getElementById('confirm-modal-icon');
    const labelEl = document.getElementById('confirm-modal-label');
    const titleEl = document.getElementById('confirm-modal-title');
    const messageEl = document.getElementById('confirm-modal-message');
    const detailEl = document.getElementById('confirm-modal-detail');
    const confirmButton = document.getElementById('confirm-modal-confirm');
    const cancelButton = document.getElementById('confirm-modal-cancel');

    if (!modal || !iconEl || !labelEl || !titleEl || !messageEl || !detailEl || !confirmButton || !cancelButton) {
        return Promise.resolve(window.confirm(message));
    }

    iconEl.textContent = icon;
    labelEl.textContent = label;
    titleEl.textContent = title;
    messageEl.textContent = message;
    detailEl.textContent = detail;
    confirmButton.textContent = confirmText;
    cancelButton.textContent = cancelText;
    cancelButton.classList.toggle('hidden', singleAction);
    confirmButton.classList.toggle('flex-1', !singleAction);
    confirmButton.classList.toggle('w-full', singleAction);

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    return new Promise((resolve) => {
        const cleanup = (result) => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            cancelButton.classList.remove('hidden');
            confirmButton.classList.remove('w-full');
            confirmButton.classList.add('flex-1');
            confirmButton.removeEventListener('click', handleConfirm);
            cancelButton.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleBackdrop);
            document.removeEventListener('keydown', handleEscape);
            resolve(result);
        };

        const handleConfirm = () => cleanup(true);
        const handleCancel = () => cleanup(false);
        const handleBackdrop = (event) => {
            if (event.target === modal) {
                cleanup(false);
            }
        };
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                cleanup(false);
            }
        };

        confirmButton.addEventListener('click', handleConfirm);
        cancelButton.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleBackdrop);
        document.addEventListener('keydown', handleEscape);
    });
}

function showProfileSetupModal(email, defaults = {}) {
    const modal = document.getElementById('profile-setup-modal');
    const messageEl = document.getElementById('profile-setup-message');
    const nicknameInput = document.getElementById('profile-setup-nickname');
    const realnameInput = document.getElementById('profile-setup-realname');
    const favoriteTeamInput = document.getElementById('profile-setup-favorite-team');
    const homeCountryInput = document.getElementById('profile-setup-home-country');
    const confirmButton = document.getElementById('profile-setup-confirm');
    const cancelButton = document.getElementById('profile-setup-cancel');

    if (!modal || !messageEl || !nicknameInput || !realnameInput || !favoriteTeamInput || !homeCountryInput || !confirmButton || !cancelButton) {
        return Promise.resolve(null);
    }

    if (favoriteTeamInput.dataset.optionsLoaded !== 'true') {
        const options = [...teams]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((team) => `<option value="${team.name}">${team.flag} ${team.name}</option>`)
            .join('');

        favoriteTeamInput.insertAdjacentHTML('beforeend', options);
        homeCountryInput.insertAdjacentHTML('beforeend', options);
        favoriteTeamInput.dataset.optionsLoaded = 'true';
        homeCountryInput.dataset.optionsLoaded = 'true';
    }

    attachAlphaJumpToSelect(favoriteTeamInput);
    attachAlphaJumpToSelect(homeCountryInput);

    messageEl.textContent = `You're creating a new profile for ${email}.`;
    nicknameInput.value = defaults.nickname || '';
    realnameInput.value = defaults.realname || '';
    favoriteTeamInput.value = defaults.favoriteTeam || '';
    homeCountryInput.value = defaults.homeCountry || '';

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    return new Promise((resolve) => {
        const cleanup = (result) => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            confirmButton.removeEventListener('click', handleConfirm);
            cancelButton.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleBackdrop);
            document.removeEventListener('keydown', handleEscape);
            nicknameInput.removeEventListener('keydown', handleEnter);
            realnameInput.removeEventListener('keydown', handleEnter);
            favoriteTeamInput.removeEventListener('keydown', handleEnter);
            homeCountryInput.removeEventListener('keydown', handleEnter);
            resolve(result);
        };

        const submitIfValid = () => {
            const nickname = nicknameInput.value.trim();
            const realname = realnameInput.value.trim();
            const favoriteTeam = favoriteTeamInput.value;
            const homeCountry = homeCountryInput.value;

            if (!nickname || !realname) {
                showToast('Enter nickname and real name.');
                return;
            }

            cleanup({ nickname, realname, favoriteTeam, homeCountry });
        };

        const handleConfirm = () => submitIfValid();
        const handleCancel = () => cleanup(null);
        const handleBackdrop = (event) => {
            if (event.target === modal) {
                cleanup(null);
            }
        };
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                cleanup(null);
            }
        };
        const handleEnter = (event) => {
            if (event.key !== 'Enter') {
                return;
            }

            event.preventDefault();
            submitIfValid();
        };

        confirmButton.addEventListener('click', handleConfirm);
        cancelButton.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleBackdrop);
        document.addEventListener('keydown', handleEscape);
        nicknameInput.addEventListener('keydown', handleEnter);
        realnameInput.addEventListener('keydown', handleEnter);
        favoriteTeamInput.addEventListener('keydown', handleEnter);
        homeCountryInput.addEventListener('keydown', handleEnter);
        setTimeout(() => nicknameInput.focus(), 0);
    });
}

function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach((page) => page.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach((link) => link.classList.remove('active'));

    const section = document.getElementById(`page-${pageId}`);
    if (section) {
        section.classList.remove('hidden');
    }

    const navLinks = document.querySelectorAll(`[id^='nav-${pageId}']`);
    navLinks.forEach((link) => link.classList.add('active'));

    if (pageId === 'instructions') setupDashboard();
    if (pageId === 'picks') updateUI();
    if (pageId === 'leaderboard') fetchLeaderboard();
    if (pageId === 'admin') setupAdminPage();
    if (pageId === 'chat') setupChat();
    if (pageId === 'profile') setupProfile();
    if (pageId === 'results') setupResultsPage();

    document.getElementById('mobile-menu').classList.remove('open');
}

function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('open');
}

function toggleMobileRoster() {
    const panel = document.getElementById('roster-panel');
    const arrow = document.getElementById('roster-arrow');
    const isMinimized = panel.classList.toggle('roster-minimized');
    arrow.innerText = isMinimized ? '▲' : '▼';
}

function renderPool() {
    const container = document.getElementById('tiers-container');
    container.innerHTML = '';

    [1, 2, 3].forEach((tierNum) => {
        const tierTeams = teams
            .filter((team) => team.tier === tierNum)
            .sort((a, b) => {
                if (b.cost !== a.cost) {
                    return b.cost - a.cost;
                }

                return a.name.localeCompare(b.name);
            });

        const section = document.createElement('div');
        section.innerHTML = `
            <div class="flex items-center gap-4 mb-4 text-left">
                <div class="picks-tier-label px-3 py-1 font-black italic text-xs tracking-widest uppercase text-left">
                    Tier ${tierNum}
                </div>
                <div class="h-px bg-gray-200 flex-grow"></div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 text-left text-gray-900">
                ${tierTeams.map((team) => `
                    <div
                        onclick="toggleTeam('${team.name}')"
                        id="pool-${team.name.replace(/\s/g, '')}"
                        class="team-card bg-white border-2 border-gray-100 rounded-2xl p-2 shadow-sm ${isLocked ? 'locked-ui' : ''} text-gray-900 text-left"
                    >
                        <div class="flex justify-between items-start text-left mb-1 text-gray-900">
                            <span class="text-3xl text-left">${team.flag}</span>
                            <span class="picks-price-pill font-bold px-2 py-0.5 rounded text-xs text-left">$${team.cost}</span>
                        </div>
                        <div class="font-black uppercase text-[10px] tracking-tight truncate text-left text-gray-900">${team.name}</div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(section);
    });

    if (typeof window.applyPicksAccentTheme === 'function') {
        window.applyPicksAccentTheme(window.getCurrentProfileIdentity?.() || null);
    }
}

function updateUI() {
    let spent = 0;

    document.querySelectorAll('.team-card').forEach((element) => element.classList.remove('selected'));

    const list = document.getElementById('roster-list');
    if (!list) {
        return;
    }

    list.innerHTML = '';

    myPicks
        .sort((a, b) => b.cost - a.cost)
        .forEach((team) => {
            spent += team.cost;

            const poolElement = document.getElementById(`pool-${team.name.replace(/\s/g, '')}`);
            if (poolElement) {
                poolElement.classList.add('selected');
            }

            const item = document.createElement('div');
            item.className = 'flex items-center justify-between bg-gray-800 p-3 rounded-xl border border-gray-700 text-left text-white';
            item.innerHTML = `
                <div class="flex items-center gap-2 text-left text-white">
                    <span class="text-xl text-left text-white">${team.flag}</span>
                    <div class="text-[9px] font-black uppercase tracking-widest truncate text-left text-white">${team.name}</div>
                </div>
                <div class="flex items-center gap-2 text-white text-left">
                    <span class="text-green-400 font-mono font-bold text-xs text-left">$${team.cost}</span>
                    ${!isLocked ? `<button onclick="toggleTeam('${team.name}')" class="text-gray-500 hover:text-red-500 text-lg font-bold text-left text-white text-center">×</button>` : ''}
                </div>
            `;
            list.appendChild(item);
        });

    const remaining = 150 - spent;
    const display = document.getElementById('budget-display');
    display.innerText = `$${remaining}`;
    display.className = remaining < 0
        ? 'text-xl md:text-2xl font-mono font-bold text-red-500 text-left'
        : 'text-xl md:text-2xl font-mono font-bold text-green-400 text-left';

    document.getElementById('roster-count').innerText = `${myPicks.length}`;
}

async function renderGroups() {
    const container = document.getElementById('groups-grid');
    if (!container) {
        return;
    }

    container.innerHTML = '<div class="col-span-full rounded-2xl border border-gray-100 bg-white p-8 text-center text-xs font-black uppercase tracking-[0.3em] text-gray-400">Loading group standings...</div>';

    let matches = [];

    try {
        await fetchAdvancedTeams();

        const { data, error } = await supabaseClient
            .from('matches')
            .select('*')
            .order('match_date_manual', { ascending: true });

        if (error) {
            throw error;
        }

        matches = data || [];
    } catch (error) {
        matches = [];
    }

    container.innerHTML = '';

    const teamPointsMap = window.WorldCupScoring.buildTeamPointsMap(matches, teams, advancedTeams);

    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach((group) => {
        const groupTeams = teams
            .filter((team) => team.qualified !== false && team.group === group)
            .map((team) => {
                return {
                    ...team,
                    totalPoints: teamPointsMap[team.name] || 0
                };
            })
            .sort((a, b) => {
                if (b.totalPoints !== a.totalPoints) {
                    return b.totalPoints - a.totalPoints;
                }

                return a.name.localeCompare(b.name);
            });

        const card = document.createElement('div');
        card.className = 'bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-gray-900 text-left';
        card.innerHTML = `
            <h3 class="font-black italic text-xl mb-4 border-b pb-2 text-left text-gray-900">GROUP ${group}</h3>
            ${groupTeams.map((team) => `
                <div class="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0 text-left text-gray-900">
                    <div class="flex min-w-0 items-center gap-3">
                        <span class="shrink-0 text-2xl text-left">${team.flag}</span>
                        <div class="min-w-0">
                            <div class="font-bold text-sm text-left text-gray-900">${team.name}</div>
                            <div class="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 text-left">$${team.cost} <span class="text-gray-300">(Tier ${team.tier})</span></div>
                        </div>
                    </div>
                    <div class="shrink-0 text-right">
                        <div class="text-lg font-black italic leading-none text-gray-900">${team.totalPoints}</div>
                        <div class="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">Pts</div>
                    </div>
                </div>
            `).join('')}
        `;
        container.appendChild(card);
    });
}

function startCountdown() {
    if (countdownStarted) {
        return;
    }

    countdownStarted = true;

    const updateCountdownDisplays = async () => {
        const distance = LOCK_DATE.getTime() - new Date().getTime();

        if (distance <= 0) {
            if (!kickoffLockSyncAttempted) {
                kickoffLockSyncAttempted = true;
                if (appSettings.autoLockAtKickoff) {
                    appSettings.picksLocked = true;
                    try {
                        await saveAppSettings({
                            picksLocked: true,
                            autoLockAtKickoff: appSettings.autoLockAtKickoff
                        });
                    } catch (error) {
                        // Keep local lock even if remote persistence fails.
                    }
                }

                refreshLockState();
                renderPool();
                updateUI();
            }

            document.getElementById('countdown')?.remove();
            document.getElementById('dashboard-countdown')?.remove();
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');

        if (document.getElementById('days')) {
            document.getElementById('days').innerText = days;
            document.getElementById('hours').innerText = hours;
            document.getElementById('minutes').innerText = minutes;
        }

        if (document.getElementById('dashboard-days')) {
            document.getElementById('dashboard-days').innerText = days;
            document.getElementById('dashboard-hours').innerText = hours;
            document.getElementById('dashboard-minutes').innerText = minutes;
        }
    };

    updateCountdownDisplays();
    setInterval(updateCountdownDisplays, 1000);
}

Object.assign(window, {
    showToast,
    showConfirmModal,
    showProfileSetupModal,
    showPage,
    toggleMobileMenu,
    toggleMobileRoster,
    renderPool,
    updateUI,
    renderGroups,
    startCountdown
});
