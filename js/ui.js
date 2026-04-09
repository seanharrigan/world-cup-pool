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

function showConfirmModal({
    title = 'Are you sure?',
    message = '',
    detail = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel'
}) {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-modal-title');
    const messageEl = document.getElementById('confirm-modal-message');
    const detailEl = document.getElementById('confirm-modal-detail');
    const confirmButton = document.getElementById('confirm-modal-confirm');
    const cancelButton = document.getElementById('confirm-modal-cancel');

    if (!modal || !titleEl || !messageEl || !detailEl || !confirmButton || !cancelButton) {
        return Promise.resolve(window.confirm(message));
    }

    titleEl.textContent = title;
    messageEl.textContent = message;
    detailEl.textContent = detail;
    confirmButton.textContent = confirmText;
    cancelButton.textContent = cancelText;

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

function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach((page) => page.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach((link) => link.classList.remove('active'));

    const section = document.getElementById(`page-${pageId}`);
    if (section) {
        section.classList.remove('hidden');
    }

    const navLinks = document.querySelectorAll(`[id^='nav-${pageId}']`);
    navLinks.forEach((link) => link.classList.add('active'));

    if (pageId === 'picks') updateUI();
    if (pageId === 'leaderboard') fetchLeaderboard();
    if (pageId === 'groups') renderGroups();
    if (pageId === 'stats') fetchStats();
    if (pageId === 'admin') setupAdminPage();
    if (pageId === 'chat') setupChat();
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
            .sort((a, b) => b.cost - a.cost);

        const section = document.createElement('div');
        section.innerHTML = `
            <div class="flex items-center gap-4 mb-4 text-left">
                <div class="bg-gray-900 text-white px-3 py-1 font-black italic text-xs tracking-widest uppercase text-left">
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
                            <span class="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-xs text-left">$${team.cost}</span>
                        </div>
                        <div class="font-black uppercase text-[10px] tracking-tight truncate text-left text-gray-900">${team.name}</div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(section);
    });
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

function renderGroups() {
    const container = document.getElementById('groups-grid');
    container.innerHTML = '';

    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach((group) => {
        const groupTeams = teams.filter((team) => team.group === group);
        const card = document.createElement('div');
        card.className = 'bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-gray-900 text-left';
        card.innerHTML = `
            <h3 class="font-black italic text-xl mb-4 border-b pb-2 text-left text-gray-900">GROUP ${group}</h3>
            ${groupTeams.map((team) => `
                <div class="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 text-left text-gray-900">
                    <span class="text-2xl text-left">${team.flag}</span>
                    <span class="font-bold text-sm text-left">${team.name}</span>
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

    setInterval(() => {
        const distance = LOCK_DATE.getTime() - new Date().getTime();

        if (document.getElementById('days')) {
            document.getElementById('days').innerText = Math.floor(distance / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
            document.getElementById('hours').innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
            document.getElementById('minutes').innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        }
    }, 1000);
}

Object.assign(window, {
    showToast,
    showConfirmModal,
    showPage,
    toggleMobileMenu,
    toggleMobileRoster,
    renderPool,
    updateUI,
    renderGroups,
    startCountdown
});
