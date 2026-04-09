const saveState = {
    picksDirty: false,
    identityDirty: false,
    isSaving: false,
    lastSavedAt: null,
    failed: false
};

function getSaveStatusStorageKey() {
    return userEmail ? `wc_pool_last_saved_${userEmail}` : null;
}

function formatSavedTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
    });
}

function updateSaveStatusUI() {
    const status = document.getElementById('save-status');
    if (!status) {
        return;
    }

    status.className = 'rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-center md:text-left';

    if (saveState.isSaving) {
        status.classList.add('border-blue-500/30', 'bg-blue-600/10', 'text-blue-300');
        status.textContent = 'Saving changes...';
        return;
    }

    if (saveState.picksDirty || saveState.identityDirty) {
        status.classList.add('border-amber-500/30', 'bg-amber-500/10', 'text-amber-300');
        status.textContent = 'Unsaved changes';
        return;
    }

    if (saveState.failed) {
        status.classList.add('border-red-500/30', 'bg-red-500/10', 'text-red-300');
        status.textContent = 'Save failed';
        return;
    }

    if (saveState.lastSavedAt) {
        status.classList.add('border-green-500/30', 'bg-green-500/10', 'text-green-300');
        status.textContent = `Saved at ${formatSavedTime(saveState.lastSavedAt)}`;
        return;
    }

    status.classList.add('border-gray-800', 'bg-gray-900/70', 'text-gray-400');
    status.textContent = 'No changes yet';
}

function setLastSavedNow() {
    saveState.lastSavedAt = new Date().toISOString();
    const storageKey = getSaveStatusStorageKey();

    if (storageKey) {
        localStorage.setItem(storageKey, saveState.lastSavedAt);
    }
}

function hydrateSavedTimestamp() {
    const storageKey = getSaveStatusStorageKey();
    saveState.lastSavedAt = storageKey ? localStorage.getItem(storageKey) : null;
    updateSaveStatusUI();
}

function markPicksDirty() {
    saveState.failed = false;
    saveState.picksDirty = true;
    updateSaveStatusUI();
}

function markIdentityDirty() {
    saveState.failed = false;
    saveState.identityDirty = true;
    updateSaveStatusUI();
}

function clearDirtyFlags() {
    saveState.failed = false;
    saveState.picksDirty = false;
    saveState.identityDirty = false;
    updateSaveStatusUI();
}

function setupIdentityChangeTracking() {
    const nicknameInput = document.getElementById('nickname-input');
    const realnameInput = document.getElementById('realname-input');

    [nicknameInput, realnameInput].forEach((input) => {
        if (!input || input.dataset.saveTrackingBound === 'true') {
            return;
        }

        input.addEventListener('input', () => {
            if (!userEmail) {
                return;
            }

            markIdentityDirty();
        });
        input.dataset.saveTrackingBound = 'true';
    });
}

function populateCountryFilter() {
    const select = document.getElementById('leaderboard-country-filter');
    const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));

    sortedTeams.forEach((team) => {
        const option = document.createElement('option');
        option.value = team.name;
        option.innerText = team.name;
        select.appendChild(option);
    });
}

function checkAdminStatus() {
    const admins = ['seanigan44@gmail.com', 'connorha@student.ubc.ca'];

    if (admins.includes(userEmail)) {
        document.getElementById('nav-admin').classList.remove('hidden');
        document.getElementById('mobile-nav-admin').classList.remove('hidden');
    }
}

function toggleTeam(name) {
    if (isLocked) {
        return;
    }

    const team = teams.find((entry) => entry.name === name);
    const existingIndex = myPicks.findIndex((entry) => entry.name === name);

    if (existingIndex > -1) {
        myPicks.splice(existingIndex, 1);
    } else {
        if (team.tier === 1) {
            myPicks = myPicks.filter((entry) => entry.tier !== 1);
        }

        myPicks.push(team);
    }

    updateUI();
    markPicksDirty();
}

async function getExistingProfile(email) {
    const { data, error } = await supabaseClient
        .from('picks')
        .select('team_nickname, team_realname')
        .eq('user_email', email)
        .limit(1);

    if (error) {
        throw error;
    }

    return data?.[0] || null;
}

function confirmNewProfileEmail(email) {
    return showConfirmModal({
        title: 'Create New Profile?',
        message: `No profile was found for ${email}.`,
        detail: 'Please double-check for typos before continuing.',
        confirmText: 'Create Profile',
        cancelText: 'Go Back'
    });
}

async function completeLogin(email, existingProfile = null) {
    userEmail = email;
    localStorage.setItem('wc_pool_user_email', userEmail);
    checkAdminStatus();

    document.getElementById('auth-overlay').classList.add('hidden');
    document.getElementById('top-nav').classList.remove('hidden');
    document.getElementById('main-app').classList.remove('hidden');

    setTimeout(() => {
        document.getElementById('main-app').classList.remove('opacity-0');
    }, 50);

    document.getElementById('user-display-nav').innerText = userEmail;

    if (existingProfile) {
        document.getElementById('nickname-input').value = existingProfile.team_nickname || '';
        document.getElementById('realname-input').value = existingProfile.team_realname || '';
    }

    hydrateSavedTimestamp();
    renderPool();
    await loadFromSupabase();
    clearDirtyFlags();
    startCountdown();
    showPage('instructions');
}

async function handleLogin(options = {}) {
    const { skipNewProfileConfirm = false } = options;
    const input = document.getElementById('email-input').value.toLowerCase().trim();

    if (!input.includes('@')) {
        return showToast('Invalid email.');
    }

    try {
        const existingProfile = await getExistingProfile(input);

        if (!existingProfile && !skipNewProfileConfirm) {
            const shouldCreate = await confirmNewProfileEmail(input);
            if (!shouldCreate) {
                return;
            }
        }

        await completeLogin(input, existingProfile);
    } catch (error) {
        showToast(error.message || 'Unable to log in right now.');
    }
}

async function saveIdentityOnly() {
    const nickname = document.getElementById('nickname-input').value.trim();
    const realname = document.getElementById('realname-input').value.trim();

    if (!nickname || !realname) {
        return showToast('Enter both names.');
    }

    try {
        await supabaseClient
            .from('picks')
            .update({ team_nickname: nickname, team_realname: realname })
            .eq('user_email', userEmail);

        saveState.failed = false;
        saveState.identityDirty = false;
        setLastSavedNow();
        updateSaveStatusUI();
        showToast('Identity updated!', 'success');
    } catch (error) {
        updateSaveStatusUI();
        showToast(error.message);
    }
}

async function saveToSupabase() {
    if (isLocked) {
        return;
    }

    const nickname = document.getElementById('nickname-input').value.trim();
    const realname = document.getElementById('realname-input').value.trim();

    if (!nickname || !realname) {
        return showToast('Set Nickname and Real Name.');
    }

    const spent = myPicks.reduce((sum, team) => sum + team.cost, 0);
    if (spent > 150) {
        return showToast('Over budget.');
    }

    if (myPicks.filter((team) => team.tier === 3).length < 3) {
        return showToast('Pick at least 3 Tier 3 teams.');
    }

    const button = document.getElementById('save-btn');
    saveState.failed = false;
    saveState.isSaving = true;
    updateSaveStatusUI();
    button.innerText = 'Saving...';
    button.classList.add('saving');

    try {
        await supabaseClient.from('picks').delete().eq('user_email', userEmail);
        await supabaseClient.from('picks').insert(
            myPicks.map((team) => ({
                user_email: userEmail,
                team_name: team.name,
                tier: team.tier,
                cost: team.cost,
                team_nickname: nickname,
                team_realname: realname
            }))
        );

        saveState.failed = false;
        saveState.picksDirty = false;
        saveState.identityDirty = false;
        setLastSavedNow();
        updateSaveStatusUI();
        showToast('Saved!', 'success');
    } catch (error) {
        saveState.isSaving = false;
        saveState.failed = true;
        updateSaveStatusUI();
        showToast(error.message);
    } finally {
        saveState.isSaving = false;
        updateSaveStatusUI();
        button.innerText = 'Save';
        button.classList.remove('saving');
    }
}

async function loadFromSupabase() {
    try {
        const { data } = await supabaseClient.from('picks').select('*').eq('user_email', userEmail);

        if (data?.length > 0) {
            myPicks = data
                .map((row) => teams.find((team) => team.name === row.team_name))
                .filter(Boolean);

            updateUI();
        }
    } catch (error) {
        console.error(error);
    }
}

function setupLoginKeyboardSubmit() {
    const emailInput = document.getElementById('email-input');

    if (!emailInput) {
        return;
    }

    emailInput.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') {
            return;
        }

        event.preventDefault();
        handleLogin();
    });
}

window.addEventListener('DOMContentLoaded', () => {
    populateCountryFilter();
    setupLoginKeyboardSubmit();
    setupIdentityChangeTracking();

    const savedEmail = localStorage.getItem('wc_pool_user_email');
    if (savedEmail) {
        document.getElementById('email-input').value = savedEmail;
        handleLogin({ skipNewProfileConfirm: true });
    }
});

Object.assign(window, {
    populateCountryFilter,
    checkAdminStatus,
    toggleTeam,
    handleLogin,
    saveIdentityOnly,
    saveToSupabase,
    loadFromSupabase,
    setupLoginKeyboardSubmit
});
