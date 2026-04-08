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
        if (team.tier === 1 && myPicks.some((entry) => entry.tier === 1)) {
            return showToast('Only 1 Tier 1 allowed.');
        }

        myPicks.push(team);
    }

    updateUI();
}

async function handleLogin() {
    const input = document.getElementById('email-input').value.toLowerCase().trim();
    if (!input.includes('@')) {
        return showToast('Invalid email.');
    }

    userEmail = input;
    localStorage.setItem('wc_pool_user_email', userEmail);
    checkAdminStatus();

    document.getElementById('auth-overlay').classList.add('hidden');
    document.getElementById('top-nav').classList.remove('hidden');
    document.getElementById('main-app').classList.remove('hidden');

    setTimeout(() => {
        document.getElementById('main-app').classList.remove('opacity-0');
    }, 50);

    document.getElementById('user-display-nav').innerText = userEmail;

    const { data } = await supabaseClient
        .from('picks')
        .select('team_nickname, team_realname')
        .eq('user_email', userEmail)
        .limit(1);

    if (data?.[0]) {
        document.getElementById('nickname-input').value = data[0].team_nickname || '';
        document.getElementById('realname-input').value = data[0].team_realname || '';
    }

    renderPool();
    loadFromSupabase();
    startCountdown();
    showPage('instructions');
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

        showToast('Identity updated!', 'success');
    } catch (error) {
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
    button.innerText = '...';
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

        showToast('Saved!', 'success');
    } catch (error) {
        showToast(error.message);
    } finally {
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

window.addEventListener('DOMContentLoaded', () => {
    populateCountryFilter();

    const savedEmail = localStorage.getItem('wc_pool_user_email');
    if (savedEmail) {
        document.getElementById('email-input').value = savedEmail;
        handleLogin();
    }
});

Object.assign(window, {
    populateCountryFilter,
    checkAdminStatus,
    toggleTeam,
    handleLogin,
    saveIdentityOnly,
    saveToSupabase,
    loadFromSupabase
});
