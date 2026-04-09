const saveState = {
    picksDirty: false,
    identityDirty: false,
    isSaving: false,
    lastSavedAt: null,
    failed: false
};

function getProfileStorageKey(email = userEmail) {
    return email ? `wc_pool_profile_${email}` : null;
}

function getNotificationSeenKey(email = userEmail) {
    return email ? `wc_pool_seen_notification_${email}` : null;
}

function getAuthRedirectUrl() {
    return `${window.location.origin}${window.location.pathname}`;
}

function saveProfileIdentityLocal(email, profile) {
    const storageKey = getProfileStorageKey(email);
    if (!storageKey || !profile) {
        return;
    }

    localStorage.setItem(storageKey, JSON.stringify({
        nickname: profile.nickname || '',
        realname: profile.realname || '',
        favoriteTeam: profile.favoriteTeam || '',
        homeCountry: profile.homeCountry || ''
    }));
}

function getLocalProfileIdentity(email) {
    const storageKey = getProfileStorageKey(email);
    if (!storageKey) {
        return null;
    }

    const raw = localStorage.getItem(storageKey);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

function getLastSeenNotificationId(email = userEmail) {
    const key = getNotificationSeenKey(email);
    if (!key) {
        return 0;
    }

    return Number(localStorage.getItem(key) || 0);
}

function markNotificationSeen(notificationId, email = userEmail) {
    const key = getNotificationSeenKey(email);
    if (!key || !notificationId) {
        return;
    }

    localStorage.setItem(key, String(notificationId));
}

function formatSavedTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
    });
}

function updateSaveStatusUI() {
    const status = document.getElementById('save-status');
    const dashboardStatus = document.getElementById('dashboard-save-status');

    if (!status && !dashboardStatus) {
        return;
    }

    const applyStatus = (element, mode, text, classes) => {
        if (!element) {
            return;
        }

        if (mode === 'dashboard') {
            element.className = 'mt-2 text-xl font-black uppercase italic';
            element.classList.add(classes.text);
        } else {
            element.className = 'rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-center md:text-left';
            element.classList.add(classes.text, classes.border, classes.background);
        }

        element.textContent = text;
    };

    const setContent = (text, classes) => {
        applyStatus(status, 'default', text, classes);
        applyStatus(dashboardStatus, 'dashboard', text, classes);
    };

    if (saveState.isSaving) {
        setContent('Saving changes...', { text: 'text-blue-300', border: 'border-blue-500/30', background: 'bg-blue-600/10' });
        return;
    }

    if (saveState.picksDirty || saveState.identityDirty) {
        setContent('Unsaved changes', { text: 'text-amber-300', border: 'border-amber-500/30', background: 'bg-amber-500/10' });
        return;
    }

    if (saveState.failed) {
        setContent('Save failed', { text: 'text-red-300', border: 'border-red-500/30', background: 'bg-red-500/10' });
        return;
    }

    if (!saveState.lastSavedAt && !saveState.picksDirty && !saveState.identityDirty && userEmail && myPicks.length === 0) {
        setContent('No team saved. Select a team.', { text: 'text-red-300', border: 'border-red-500/30', background: 'bg-red-500/10' });
        return;
    }

    if (saveState.lastSavedAt) {
        setContent(`Saved at ${formatSavedTime(saveState.lastSavedAt)}`, { text: 'text-green-300', border: 'border-green-500/30', background: 'bg-green-500/10' });
        return;
    }

    setContent('No changes yet', { text: 'text-gray-400', border: 'border-gray-800', background: 'bg-gray-900/70' });
}

async function hydrateSavedTimestamp() {
    if (!userEmail) {
        saveState.lastSavedAt = null;
        updateSaveStatusUI();
        return;
    }

    try {
        const [
            { data: profile, error: profileError },
            { count, error: picksError }
        ] = await Promise.all([
            supabaseClient
                .from('profiles')
                .select('updated_at')
                .eq('email', userEmail)
                .maybeSingle(),
            supabaseClient
                .from('picks')
                .select('team_name', { count: 'exact', head: true })
                .eq('user_email', userEmail)
        ]);

        if (profileError) {
            throw profileError;
        }

        if (picksError) {
            throw picksError;
        }

        saveState.lastSavedAt = count > 0 ? (profile?.updated_at || null) : null;
    } catch (error) {
        saveState.lastSavedAt = null;
    }

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
    const favoriteTeamInput = document.getElementById('favorite-team-input');
    const homeCountryInput = document.getElementById('home-country-input');

    [nicknameInput, realnameInput, favoriteTeamInput, homeCountryInput].forEach((input) => {
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

function populateProfileSelectOptions() {
    const favoriteTeamSelect = document.getElementById('favorite-team-input');
    const homeCountrySelect = document.getElementById('home-country-input');

    [favoriteTeamSelect, homeCountrySelect].forEach((select) => {
        if (!select || select.dataset.optionsLoaded === 'true') {
            return;
        }

        const options = [...teams]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((team) => `<option value="${team.name}">${team.flag} ${team.name}</option>`)
            .join('');

        select.insertAdjacentHTML('beforeend', options);
        select.dataset.optionsLoaded = 'true';
    });

    attachAlphaJumpToSelect(favoriteTeamSelect);
    attachAlphaJumpToSelect(homeCountrySelect);
}

function setupProfile() {
    const emailDisplay = document.getElementById('profile-email-display');
    if (emailDisplay) {
        emailDisplay.textContent = userEmail || '-';
    }
}

async function fetchAppSettings() {
    try {
        const { data, error } = await supabaseClient
            .from('app_settings')
            .select('key, picks_locked, auto_lock_at_kickoff, hide_team_selection')
            .eq('key', 'global')
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (data) {
            appSettings.picksLocked = Boolean(data.picks_locked);
            appSettings.autoLockAtKickoff = data.auto_lock_at_kickoff !== false;
            appSettings.hideTeamSelection = Boolean(data.hide_team_selection);
        }
    } catch (error) {
        appSettings.picksLocked = false;
        appSettings.autoLockAtKickoff = true;
        appSettings.hideTeamSelection = false;
    }

    refreshLockState();
    return appSettings;
}

async function fetchAdvancedTeams() {
    try {
        const { data, error } = await supabaseClient
            .from('team_advancement')
            .select('team_name, advanced_to_knockouts');

        if (error) {
            throw error;
        }

        advancedTeams = new Set(
            (data || [])
                .filter((row) => row.advanced_to_knockouts)
                .map((row) => row.team_name)
        );
    } catch (error) {
        advancedTeams = new Set();
    }

    return advancedTeams;
}

async function saveAppSettings(nextSettings = {}) {
    const payload = {
        key: 'global',
        picks_locked: Boolean(nextSettings.picksLocked),
        auto_lock_at_kickoff: nextSettings.autoLockAtKickoff !== false,
        hide_team_selection: Boolean(nextSettings.hideTeamSelection)
    };

    const { error } = await supabaseClient
        .from('app_settings')
        .upsert(payload, { onConflict: 'key' });

    if (error) {
        throw error;
    }

    appSettings.picksLocked = payload.picks_locked;
    appSettings.autoLockAtKickoff = payload.auto_lock_at_kickoff;
    appSettings.hideTeamSelection = payload.hide_team_selection;
    refreshLockState();
    return appSettings;
}

function populateCountryFilter() {
    const select = document.getElementById('leaderboard-country-filter');
    const sortedTeams = [...teams]
        .filter((team) => team.qualified !== false)
        .sort((a, b) => a.name.localeCompare(b.name));

    sortedTeams.forEach((team) => {
        const option = document.createElement('option');
        option.value = team.name;
        option.innerText = team.name;
        select.appendChild(option);
    });

    attachAlphaJumpToSelect(select);
}

async function checkAdminStatus() {
    const desktopAdminLink = document.getElementById('nav-admin');
    const mobileAdminLink = document.getElementById('mobile-nav-admin');

    if (desktopAdminLink) {
        desktopAdminLink.classList.add('hidden');
    }

    if (mobileAdminLink) {
        mobileAdminLink.classList.add('hidden');
    }

    if (!userEmail) {
        return false;
    }

    try {
        const { data, error } = await supabaseClient
            .from('admins')
            .select('email')
            .eq('email', userEmail)
            .maybeSingle();

        if (error) {
            throw error;
        }

        const isAdmin = Boolean(data?.email);

        if (isAdmin) {
            desktopAdminLink?.classList.remove('hidden');
            mobileAdminLink?.classList.remove('hidden');
        }

        return isAdmin;
    } catch (error) {
        return false;
    }
}

function toggleTeam(name) {
    if (isLocked) {
        showConfirmModal({
            label: 'Locked',
            icon: '🔒',
            title: 'Picks Locked',
            message: 'The World Cup has started, the picks are locked. Good luck!',
            confirmText: 'Okay',
            singleAction: true
        });
        return;
    }

    const team = teams.find((entry) => entry.name === name);
    if (!team) {
        return;
    }

    if (team.qualified === false) {
        showConfirmModal({
            label: 'LOL',
            icon: '🇮🇹',
            title: 'Nice Try',
            message: 'Pick a team that qualified.',
            detail: 'Italy can still be your favourite team or home country.',
            confirmText: 'Okay',
            singleAction: true
        });
        return;
    }

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
        .from('profiles')
        .select('nickname, realname, favorite_team, home_country, has_paid, avatar_url, updated_at')
        .eq('email', email)
        .maybeSingle();

    if (error) {
        throw error;
    }

    const dbProfile = data || null;
    if (dbProfile) {
        return dbProfile;
    }

    const localProfile = getLocalProfileIdentity(email);
    if (!localProfile) {
        return null;
    }

    return {
        nickname: localProfile.nickname || '',
        realname: localProfile.realname || '',
        favorite_team: localProfile.favoriteTeam || '',
        home_country: localProfile.homeCountry || ''
    };
}

async function startGoogleLogin() {
    try {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: getAuthRedirectUrl()
            }
        });

        if (error) {
            throw error;
        }
    } catch (error) {
        showToast(error.message || 'Unable to start Google sign-in right now.');
    }
}

async function upsertProfile(email, profile = {}) {
    const updatedAt = new Date().toISOString();
    const payload = {
        email,
        nickname: profile.nickname || '',
        realname: profile.realname || '',
        favorite_team: profile.favoriteTeam || '',
        home_country: profile.homeCountry || '',
        updated_at: updatedAt
    };

    if (typeof profile.has_paid === 'boolean') {
        payload.has_paid = profile.has_paid;
    }

    if (typeof profile.avatar_url === 'string') {
        payload.avatar_url = profile.avatar_url;
    }

    const { error } = await supabaseClient
        .from('profiles')
        .upsert(payload, { onConflict: 'email' });

    if (error) {
        throw error;
    }

    return updatedAt;
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

function showPaymentReminderModal() {
    return showConfirmModal({
        label: 'Payment Due',
        icon: '💸',
        title: 'Still To Pay',
        message: 'You have not paid yet.',
        detail: 'Please contact Connor or Sean for payment.',
        confirmText: 'Okay',
        singleAction: true
    });
}

async function showBroadcastNotification(notification) {
    if (!notification?.id || !notification?.message || !userEmail) {
        return;
    }

    if (activeNotificationId === notification.id || notification.id <= getLastSeenNotificationId()) {
        return;
    }

    activeNotificationId = notification.id;

    await showConfirmModal({
        label: 'Notification',
        icon: '📣',
        title: 'Pool Update',
        message: notification.message,
        detail: 'Sent by the commissioner desk.',
        confirmText: 'Okay',
        singleAction: true
    });

    markNotificationSeen(notification.id);
    activeNotificationId = null;
}

async function checkForBroadcastNotifications() {
    if (!userEmail) {
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('notifications')
            .select('id, message, created_at')
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (data) {
            await showBroadcastNotification(data);
        }
    } catch (error) {
        // Fail quietly if notifications are unavailable.
    }
}

function setupNotifications() {
    if (notificationChannel) {
        return;
    }

    notificationChannel = supabaseClient
        .channel('notifications-channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, async (payload) => {
            await showBroadcastNotification(payload.new);
        })
        .subscribe();
}

async function completeLogin(email, existingProfile = null) {
    userEmail = email;
    localStorage.setItem('wc_pool_user_email', userEmail);
    await checkAdminStatus();
    await fetchAppSettings();

    document.getElementById('auth-overlay').classList.add('hidden');
    document.getElementById('top-nav').classList.remove('hidden');
    document.getElementById('main-app').classList.remove('hidden');

    setTimeout(() => {
        document.getElementById('main-app').classList.remove('opacity-0');
    }, 50);

    document.getElementById('user-display-nav').innerText = userEmail;
    setupProfile();
    populateProfileSelectOptions();

    if (existingProfile) {
        document.getElementById('nickname-input').value = existingProfile.nickname || '';
        document.getElementById('realname-input').value = existingProfile.realname || '';
        document.getElementById('favorite-team-input').value = existingProfile.favorite_team || '';
        document.getElementById('home-country-input').value = existingProfile.home_country || '';
    } else {
        document.getElementById('nickname-input').value = '';
        document.getElementById('realname-input').value = '';
        document.getElementById('favorite-team-input').value = '';
        document.getElementById('home-country-input').value = '';
    }

    await hydrateSavedTimestamp();
    renderPool();
    await loadFromSupabase();
    clearDirtyFlags();
    startCountdown();
    showPage('instructions');
    setupNotifications();

    if (existingProfile && existingProfile.has_paid === false) {
        await showPaymentReminderModal();
    }

    await checkForBroadcastNotifications();
}

async function handleAuthenticatedUser(authUser) {
    const email = authUser?.email?.toLowerCase().trim();
    if (!email) {
        return false;
    }

    const existingProfile = await getExistingProfile(email);

    if (!existingProfile) {
        const newProfile = await showProfileSetupModal(email, {
            realname: authUser.user_metadata?.full_name || authUser.user_metadata?.name || ''
        });

        if (!newProfile) {
            await supabaseClient.auth.signOut();
            return false;
        }

        saveProfileIdentityLocal(email, newProfile);
        await upsertProfile(email, {
            ...newProfile,
            avatar_url: authUser.user_metadata?.avatar_url || ''
        });

        await completeLogin(email, {
            nickname: newProfile.nickname,
            realname: newProfile.realname,
            favorite_team: newProfile.favoriteTeam,
            home_country: newProfile.homeCountry,
            avatar_url: authUser.user_metadata?.avatar_url || ''
        });
        return true;
    }

    if (authUser.user_metadata?.avatar_url && !existingProfile.avatar_url) {
        try {
            await upsertProfile(email, {
                nickname: existingProfile.nickname,
                realname: existingProfile.realname,
                favoriteTeam: existingProfile.favorite_team,
                homeCountry: existingProfile.home_country,
                has_paid: existingProfile.has_paid,
                avatar_url: authUser.user_metadata.avatar_url
            });
            existingProfile.avatar_url = authUser.user_metadata.avatar_url;
        } catch (error) {
            // Non-blocking profile enrichment.
        }
    }

    await completeLogin(email, existingProfile);
    return true;
}

async function restoreAuthLogin() {
    try {
        const { data, error } = await supabaseClient.auth.getUser();

        if (error) {
            throw error;
        }

        if (!data?.user) {
            return false;
        }

        return handleAuthenticatedUser(data.user);
    } catch (error) {
        return false;
    }
}

async function signOutUser() {
    try {
        await supabaseClient.auth.signOut();
    } catch (error) {
        // Fall through to local reset even if auth signout fails.
    }

    localStorage.removeItem('wc_pool_user_email');
    userEmail = '';
    myPicks = [];
    window.location.reload();
}

async function saveIdentityOnly() {
    const nickname = document.getElementById('nickname-input').value.trim();
    const realname = document.getElementById('realname-input').value.trim();
    const favoriteTeam = document.getElementById('favorite-team-input').value;
    const homeCountry = document.getElementById('home-country-input').value;

    if (!nickname || !realname) {
        return showToast('Enter both names.');
    }

    saveProfileIdentityLocal(userEmail, { nickname, realname, favoriteTeam, homeCountry });

    try {
        const savedAt = await upsertProfile(userEmail, { nickname, realname, favoriteTeam, homeCountry });

        saveState.failed = false;
        saveState.identityDirty = false;
        saveState.lastSavedAt = savedAt;
        updateSaveStatusUI();
        setupDashboard();
        fetchLeaderboard();
        fetchAdminUsers();
        fetchAdminPaidUsers();
        showToast('Identity updated!', 'success');
    } catch (error) {
        updateSaveStatusUI();
        showToast(error.message);
    }
}

async function saveToSupabase() {
    if (isLocked) {
        showConfirmModal({
            label: 'Locked',
            icon: '🔒',
            title: 'Picks Locked',
            message: 'The World Cup has started, the picks are locked. Good luck!',
            confirmText: 'Okay',
            singleAction: true
        });
        return;
    }

    const nickname = document.getElementById('nickname-input').value.trim();
    const realname = document.getElementById('realname-input').value.trim();
    const favoriteTeam = document.getElementById('favorite-team-input').value;
    const homeCountry = document.getElementById('home-country-input').value;

    if (!nickname || !realname) {
        return showToast('Set Nickname and Real Name.');
    }

    saveProfileIdentityLocal(userEmail, { nickname, realname, favoriteTeam, homeCountry });

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
        const { error: deleteError } = await supabaseClient
            .from('picks')
            .delete()
            .eq('user_email', userEmail);

        if (deleteError) {
            throw deleteError;
        }

        const pickRows = myPicks.map((team) => ({
            user_email: userEmail,
            team_name: team.name,
            tier: team.tier,
            cost: team.cost
        }));

        if (pickRows.length > 0) {
            const { error: insertError } = await supabaseClient
                .from('picks')
                .insert(pickRows);

            if (insertError) {
                throw insertError;
            }
        }

        const savedAt = await upsertProfile(userEmail, { nickname, realname, favoriteTeam, homeCountry });

        saveState.failed = false;
        saveState.picksDirty = false;
        saveState.identityDirty = false;
        saveState.lastSavedAt = savedAt;
        updateSaveStatusUI();
        await loadFromSupabase();
        fetchLeaderboard();
        fetchStats();
        fetchAdminUsers();
        fetchAdminPaidUsers();
        setupDashboard();
        showToast('Saved!', 'success');
    } catch (error) {
        saveState.isSaving = false;
        saveState.failed = true;
        updateSaveStatusUI();
        showToast(error.message || 'Could not save picks to the database.');
    } finally {
        saveState.isSaving = false;
        updateSaveStatusUI();
        button.innerText = 'Save';
        button.classList.remove('saving');
    }
}

async function loadFromSupabase() {
    try {
        const { data, error } = await supabaseClient
            .from('picks')
            .select('*')
            .eq('user_email', userEmail);

        if (error) {
            throw error;
        }

        if (data?.length > 0) {
            myPicks = data
                .map((row) => teams.find((team) => team.name === row.team_name))
                .filter(Boolean);

            updateUI();
            return;
        }

        myPicks = [];
        updateUI();
    } catch (error) {
        console.error(error);
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    populateCountryFilter();
    populateProfileSelectOptions();
    setupIdentityChangeTracking();
    fetchAppSettings();

    const restoredAuth = await restoreAuthLogin();
    if (restoredAuth) {
        return;
    }
});

Object.assign(window, {
    populateCountryFilter,
    populateProfileSelectOptions,
    fetchAppSettings,
    saveAppSettings,
    checkAdminStatus,
    setupProfile,
    toggleTeam,
    startGoogleLogin,
    restoreAuthLogin,
    signOutUser,
    saveIdentityOnly,
    saveToSupabase,
    loadFromSupabase
});
