const teamResultsSortState = {
    'public-team-results-body': { key: 'team', direction: 'asc' }
};

function setupAdminPage() {
    const teamOneSelect = document.getElementById('admin-team1');
    const teamTwoSelect = document.getElementById('admin-team2');

    showAdminTab('matches');

    if (teamOneSelect && teamTwoSelect) {
        const options = [...teams]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((team) => `<option value="${team.name}">${team.flag} ${team.name}</option>`)
            .join('');

        teamOneSelect.innerHTML = `<option value="">Select Home Team...</option>${options}`;
        teamTwoSelect.innerHTML = `<option value="">Select Away Team...</option>${options}`;
    }

    fetchAdminHistory();
    fetchAdminUsers();
    fetchAdminPaidUsers();
    fetchAdminTeamResults();
    fetchStats();
}

function showAdminTab(tabId) {
    const panels = document.querySelectorAll('.admin-panel');
    const tabs = document.querySelectorAll('.admin-tab');

    panels.forEach((panel) => panel.classList.add('hidden'));
    tabs.forEach((tab) => {
        tab.classList.remove('active', 'border-blue-500/40', 'bg-blue-600/20', 'text-blue-300');
        tab.classList.add('border-gray-700', 'bg-gray-800', 'text-gray-300');
    });

    const activePanel = document.getElementById(`admin-panel-${tabId}`);
    const activeTab = document.getElementById(`admin-tab-${tabId}`);

    if (activePanel) {
        activePanel.classList.remove('hidden');
    }

    if (activeTab) {
        activeTab.classList.add('active', 'border-blue-500/40', 'bg-blue-600/20', 'text-blue-300');
        activeTab.classList.remove('border-gray-700', 'bg-gray-800', 'text-gray-300');
    }
}

function showResultsTab(tabId) {
    const panels = document.querySelectorAll('.results-panel');
    const tabs = document.querySelectorAll('.results-tab');

    panels.forEach((panel) => panel.classList.add('hidden'));
    tabs.forEach((tab) => {
        tab.classList.remove('active', 'border-blue-500/30', 'bg-blue-600/10', 'text-blue-700');
        tab.classList.add('border-gray-300', 'bg-white', 'text-gray-500');
    });

    const activePanel = document.getElementById(`results-panel-${tabId}`);
    const activeTab = document.getElementById(`results-tab-${tabId}`);

    if (activePanel) {
        activePanel.classList.remove('hidden');
    }

    if (activeTab) {
        activeTab.classList.add('active', 'border-blue-500/30', 'bg-blue-600/10', 'text-blue-700');
        activeTab.classList.remove('border-gray-300', 'bg-white', 'text-gray-500');
    }
}

function setupResultsPage() {
    showResultsTab('groups');
    renderGroups();
    fetchPublicResults();
    fetchPublicTeamResults();
}

function buildTeamPointsMap(matches = []) {
    const teamPointsMap = {};

    teams.forEach((team) => {
        teamPointsMap[team.name] = 0;
    });

    matches.forEach((match) => {
        const homePoints = getMatchPointsForTeam(match, match.team_home);
        const awayPoints = getMatchPointsForTeam(match, match.team_away);

        teamPointsMap[match.team_home] = (teamPointsMap[match.team_home] || 0) + homePoints;
        teamPointsMap[match.team_away] = (teamPointsMap[match.team_away] || 0) + awayPoints;
    });

    return teamPointsMap;
}

function buildLeaderboardData(allPicks = [], allMatches = []) {
    const teamPointsMap = buildTeamPointsMap(allMatches);
    const userMap = new Map();

    allPicks.forEach((pick) => {
        if (!userMap.has(pick.user_email)) {
            userMap.set(pick.user_email, {
                email: pick.user_email,
                nickname: pick.team_nickname || 'TBA',
                realname: pick.team_realname || 'Joined',
                totalPoints: 0,
                squad: []
            });
        }

        const user = userMap.get(pick.user_email);
        user.totalPoints += teamPointsMap[pick.team_name] || 0;

        const teamData = teams.find((team) => team.name === pick.team_name);
        if (teamData) {
            user.squad.push({
                name: teamData.name,
                flag: teamData.flag,
                cost: teamData.cost,
                tier: teamData.tier
            });
        }
    });

    return Array.from(userMap.values()).sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
        }

        return a.nickname.localeCompare(b.nickname);
    });
}

async function setupDashboard() {
    const welcome = document.getElementById('dashboard-welcome');
    if (!welcome) {
        return;
    }

    welcome.textContent = 'Loading your pool snapshot...';

    const myPointsEl = document.getElementById('dashboard-my-points');
    const myRankEl = document.getElementById('dashboard-my-rank');
    const squadSizeEl = document.getElementById('dashboard-squad-size');
    const budgetLeftEl = document.getElementById('dashboard-budget-left');
    const saveStatusEl = document.getElementById('dashboard-save-status');
    const prizePotEl = document.getElementById('dashboard-prize-pot');
    const playerCountEl = document.getElementById('dashboard-player-count');
    const ctaButton = document.getElementById('dashboard-primary-cta');
    const leaderboardEl = document.getElementById('dashboard-leaderboard');
    const resultsEl = document.getElementById('dashboard-latest-results');
    const mostPickedEl = document.getElementById('dashboard-most-picked');

    if (leaderboardEl) leaderboardEl.innerHTML = '<div class="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading leaderboard...</div>';
    if (resultsEl) resultsEl.innerHTML = '<div class="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading results...</div>';
    if (mostPickedEl) mostPickedEl.innerHTML = '<div class="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading picks...</div>';

    if (saveStatusEl) {
        const sourceSaveStatus = document.getElementById('save-status');
        saveStatusEl.textContent = sourceSaveStatus ? sourceSaveStatus.textContent : 'No changes yet';
    }

    try {
        const [{ data: allPicks, error: picksError }, { data: allMatches, error: matchesError }] = await Promise.all([
            supabaseClient.from('picks').select('*'),
            supabaseClient.from('matches').select('*').order('match_date_manual', { ascending: false })
        ]);

        if (picksError) {
            throw picksError;
        }

        if (matchesError) {
            throw matchesError;
        }

        const picks = allPicks || [];
        const matches = allMatches || [];
        const teamPointsMap = buildTeamPointsMap(matches);
        const leaderboardData = buildLeaderboardData(picks, matches);
        const currentUserRows = picks.filter((pick) => pick.user_email === userEmail);
        const myEntry = leaderboardData.find((entry) => entry.email === userEmail);
        const savedSquad = currentUserRows
            .map((pick) => teams.find((team) => team.name === pick.team_name))
            .filter(Boolean);
        const liveSquad = myPicks.length > 0 ? myPicks : savedSquad;
        const spent = liveSquad.reduce((sum, team) => sum + team.cost, 0);
        const tierThreeCount = liveSquad.filter((team) => team.tier === 3).length;
        const myPoints = currentUserRows.reduce((sum, pick) => sum + (teamPointsMap[pick.team_name] || 0), 0);
        const myRank = leaderboardData.findIndex((entry) => entry.email === userEmail);
        const hasUnsaved = typeof saveState !== 'undefined' && (saveState.picksDirty || saveState.identityDirty);

        if (myPointsEl) myPointsEl.textContent = `${myPoints}`;
        if (myRankEl) myRankEl.textContent = myRank >= 0 ? `#${myRank + 1}` : '-';
        if (squadSizeEl) squadSizeEl.textContent = `${liveSquad.length}`;
        if (budgetLeftEl) budgetLeftEl.textContent = `$${150 - spent}`;

        const playerCount = leaderboardData.length;
        if (prizePotEl) prizePotEl.textContent = `$${(playerCount * 40).toLocaleString()}`;
        if (playerCountEl) playerCountEl.textContent = `${playerCount} ${playerCount === 1 ? 'entry' : 'entries'}`;

        if (welcome) {
            if (!myEntry && liveSquad.length === 0) {
                welcome.textContent = 'Start building your squad, save your picks, and track the pool from one place.';
            } else if (!myEntry) {
                welcome.textContent = 'Your current squad is local to this browser until you save it to the pool.';
            } else if (hasUnsaved) {
                welcome.textContent = `${myEntry?.nickname || 'Manager'}, you have unsaved changes in your squad right now.`;
            } else {
                welcome.textContent = `${myEntry?.nickname || 'Manager'}, you are currently ranked #${myRank + 1} with ${myPoints} points.`;
            }
        }

        if (ctaButton) {
            if (!myEntry && liveSquad.length === 0) {
                ctaButton.textContent = 'Start My Picks';
            } else if (liveSquad.length < 4 || tierThreeCount < 3 || spent > 150) {
                ctaButton.textContent = 'Finish My Picks';
            } else {
                ctaButton.textContent = 'View My Squad';
            }
        }

        if (leaderboardEl) {
            const leaders = leaderboardData.slice(0, 3);
            leaderboardEl.innerHTML = leaders.map((entry, index) => `
                <div class="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                    <div class="min-w-0">
                        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">#${index + 1}</div>
                        <div class="truncate text-lg font-black uppercase italic text-gray-900">${entry.nickname}</div>
                        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">${entry.realname}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-black text-gray-900">${entry.totalPoints}</div>
                        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Pts</div>
                    </div>
                </div>
            `).join('') || '<div class="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">No leaderboard data yet</div>';
        }

        if (resultsEl) {
            resultsEl.innerHTML = matches.slice(0, 3).map((match) => `
                <div class="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                    <div class="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">${match.match_date_manual || 'TBD'} | ${match.stage}</div>
                    <div class="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-sm font-black text-gray-900">
                        <div class="min-w-0 text-left">
                            <span class="truncate">${teams.find((team) => team.name === match.team_home)?.flag || ''} ${match.team_home}</span>
                        </div>
                        <div class="rounded-xl bg-gray-900 px-3 py-1 font-mono text-white text-center">${match.score_home}-${match.score_away}</div>
                        <div class="min-w-0 text-right">
                            <span class="truncate">${match.team_away} ${teams.find((team) => team.name === match.team_away)?.flag || ''}</span>
                        </div>
                    </div>
                </div>
            `).join('') || '<div class="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">No results logged yet</div>';
        }

        if (mostPickedEl) {
            const countryCounts = {};
            picks.forEach((pick) => {
                countryCounts[pick.team_name] = (countryCounts[pick.team_name] || 0) + 1;
            });

            const topTeams = Object.entries(countryCounts)
                .sort((a, b) => {
                    if (b[1] !== a[1]) {
                        return b[1] - a[1];
                    }

                    return a[0].localeCompare(b[0]);
                })
                .slice(0, 5);

            mostPickedEl.innerHTML = topTeams.map(([name, count]) => {
                const team = teams.find((entry) => entry.name === name);
                return `
                    <div class="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                        <div class="flex min-w-0 items-center gap-3">
                            <span class="text-2xl">${team?.flag || ''}</span>
                            <div class="truncate text-sm font-black uppercase text-gray-900">${name}</div>
                        </div>
                        <div class="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">${count}</div>
                    </div>
                `;
            }).join('') || '<div class="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">No picks saved yet</div>';
        }
    } catch (error) {
        if (welcome) {
            welcome.textContent = 'Unable to load the dashboard right now.';
        }
        if (leaderboardEl) leaderboardEl.innerHTML = '<div class="rounded-2xl border border-red-100 bg-red-50 px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Could not load leaderboard</div>';
        if (resultsEl) resultsEl.innerHTML = '<div class="rounded-2xl border border-red-100 bg-red-50 px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Could not load results</div>';
        if (mostPickedEl) mostPickedEl.innerHTML = '<div class="rounded-2xl border border-red-100 bg-red-50 px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Could not load picks</div>';
    }
}

function updatePublicTeamSortIndicators() {
    const sortState = teamResultsSortState['public-team-results-body'];
    const keys = ['team', 'total', 'G1', 'G2', 'G3', 'R32', 'R16', 'QF', 'SM', 'F'];

    keys.forEach((key) => {
        const arrow = document.getElementById(`sort-arrow-public-${key}`);
        if (!arrow) {
            return;
        }

        if (sortState.key === key) {
            arrow.textContent = sortState.direction === 'asc' ? '↑' : '↓';
            arrow.classList.remove('text-gray-500');
            arrow.classList.add('text-blue-300');
            return;
        }

        arrow.textContent = '↑';
        arrow.classList.remove('text-blue-300');
        arrow.classList.add('text-gray-500');
    });
}

function setTeamResultsSort(targetId, key) {
    if (!teamResultsSortState[targetId]) {
        teamResultsSortState[targetId] = { key: 'team', direction: 'asc' };
    }

    const sortState = teamResultsSortState[targetId];

    if (sortState.key === key) {
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.key = key;
        sortState.direction = key === 'team' ? 'asc' : 'desc';
    }

    if (targetId === 'public-team-results-body') {
        fetchPublicTeamResults();
    }
}

async function fetchAdminUsers() {
    const body = document.getElementById('admin-users-body');
    if (!body) {
        return;
    }

    body.innerHTML = '<tr><td colspan="4" class="px-5 py-8 text-center text-gray-500 uppercase text-xs">Loading players...</td></tr>';

    try {
        const { data, error } = await supabaseClient
            .from('picks')
            .select('user_email, team_realname, team_nickname');

        if (error) {
            throw error;
        }

        const userMap = new Map();
        data?.forEach((row) => {
            if (!userMap.has(row.user_email)) {
                userMap.set(row.user_email, {
                    email: row.user_email,
                    realname: row.team_realname || '',
                    nickname: row.team_nickname || ''
                });
            }
        });

        const users = Array.from(userMap.values()).sort((a, b) => a.email.localeCompare(b.email));
        body.innerHTML = users.map((user) => `
            <tr class="border-t border-gray-800">
                <td class="px-5 py-4 align-top break-all">${user.email}</td>
                <td class="px-5 py-4 align-top">${user.realname || '<span class="text-gray-500">-</span>'}</td>
                <td class="px-5 py-4 align-top">${user.nickname || '<span class="text-gray-500">-</span>'}</td>
                <td class="px-5 py-4 text-right align-top">
                    <button onclick="deleteUserPicks('${user.email.replace(/'/g, "\\'")}')" class="rounded-xl bg-red-600 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-red-500 transition-colors">Delete</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="4" class="px-5 py-8 text-center text-gray-500 uppercase text-xs">No player records found.</td></tr>';
    } catch (error) {
        body.innerHTML = '<tr><td colspan="4" class="px-5 py-8 text-center text-red-400 uppercase text-xs">Could not load player records.</td></tr>';
    }
}

function sortAdminUsers(a, b) {
    const aName = (a.realname || a.nickname || a.email).toLowerCase();
    const bName = (b.realname || b.nickname || b.email).toLowerCase();

    if (aName !== bName) {
        return aName.localeCompare(bName);
    }

    return a.email.localeCompare(b.email);
}

async function getAdminUserRecords() {
    const { data, error } = await supabaseClient
        .from('picks')
        .select('*');

    if (error) {
        throw error;
    }

    const userMap = new Map();

    data?.forEach((row) => {
        if (!userMap.has(row.user_email)) {
            userMap.set(row.user_email, {
                email: row.user_email,
                realname: row.team_realname || '',
                nickname: row.team_nickname || '',
                hasPaid: Boolean(row.has_paid)
            });
        }
    });

    return Array.from(userMap.values()).sort(sortAdminUsers);
}

async function fetchAdminPaidUsers() {
    const body = document.getElementById('admin-paid-body');
    if (!body) {
        return;
    }

    body.innerHTML = '<tr><td colspan="4" class="px-5 py-8 text-center text-gray-500 uppercase text-xs">Loading payment statuses...</td></tr>';

    try {
        const users = await getAdminUserRecords();

        body.innerHTML = users.map((user) => `
            <tr class="border-t border-gray-800">
                <td class="px-5 py-4 align-top">${user.realname || '<span class="text-gray-500">Unnamed</span>'}</td>
                <td class="px-5 py-4 align-top">${user.nickname || '<span class="text-gray-500">-</span>'}</td>
                <td class="px-5 py-4 align-top break-all">${user.email}</td>
                <td class="px-5 py-4 text-right align-top">
                    <button onclick="toggleUserPaidStatus('${user.email.replace(/'/g, "\\'")}', ${user.hasPaid ? 'true' : 'false'})" class="rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${user.hasPaid ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}">
                        ${user.hasPaid ? 'Paid' : 'Not Paid'}
                    </button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="4" class="px-5 py-8 text-center text-gray-500 uppercase text-xs">No player records found.</td></tr>';
    } catch (error) {
        body.innerHTML = '<tr><td colspan="4" class="px-5 py-8 text-center text-red-400 uppercase text-xs">Could not load payment statuses.</td></tr>';
    }
}

async function toggleUserPaidStatus(email, currentValue) {
    const nextValue = !currentValue;

    try {
        const { error } = await supabaseClient
            .from('picks')
            .update({ has_paid: nextValue })
            .eq('user_email', email);

        if (error) {
            throw error;
        }
    } catch (error) {
        showToast(error.message || 'Unable to update payment status.');
        return;
    }

    fetchAdminPaidUsers();
}

function getMatchPointsForTeam(match, teamName) {
    const multipliers = { Group: 1, R32: 2, R16: 3, Quarters: 5, Semis: 8, Finals: 12 };
    const multiplier = multipliers[match.stage] || 1;

    if (match.score_home === match.score_away) {
        return match.team_home === teamName || match.team_away === teamName ? 1 * multiplier : 0;
    }

    const winningTeam = match.score_home > match.score_away ? match.team_home : match.team_away;
    return winningTeam === teamName ? 3 * multiplier : 0;
}

function formatTeamResultsCell(match, teamName, theme = 'dark') {
    if (!match) {
        return '<div class="text-gray-600 text-center text-xs font-black uppercase">-</div>';
    }

    const homeTeam = teams.find((team) => team.name === match.team_home);
    const awayTeam = teams.find((team) => team.name === match.team_away);
    const points = getMatchPointsForTeam(match, teamName);
    const pointsClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const detailClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

    return `
        <div class="min-w-[92px] py-1 text-center">
            <div class="text-2xl font-black ${pointsClass} leading-none">${points}</div>
            <div class="mt-2 text-[10px] font-bold ${detailClass} whitespace-nowrap">
                ${homeTeam?.flag || ''} ${match.score_home}-${match.score_away} ${awayTeam?.flag || ''}
            </div>
        </div>
    `;
}

async function renderTeamResultsTable(targetId, theme = 'dark') {
    const body = document.getElementById(targetId);
    if (!body) {
        return;
    }

    body.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-gray-500 uppercase text-xs">Loading team results...</td></tr>';

    try {
        const { data: matches, error } = await supabaseClient
            .from('matches')
            .select('*')
            .order('match_date_manual', { ascending: true });

        if (error) {
            throw error;
        }

        const knockoutStageMap = {
            R32: 'R32',
            R16: 'R16',
            Quarters: 'QF',
            Semis: 'SM',
            Finals: 'F'
        };

        const rows = [...teams]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((team) => {
                const teamMatches = (matches || [])
                    .filter((match) => match.team_home === team.name || match.team_away === team.name)
                    .sort((a, b) => {
                        const dateCompare = (a.match_date_manual || '').localeCompare(b.match_date_manual || '');
                        if (dateCompare !== 0) {
                            return dateCompare;
                        }

                        return (a.id || 0) - (b.id || 0);
                    });

                const slots = {
                    G1: null,
                    G2: null,
                    G3: null,
                    R32: null,
                    R16: null,
                    QF: null,
                    SM: null,
                    F: null
                };

                let groupIndex = 0;
                teamMatches.forEach((match) => {
                    if (match.stage === 'Group') {
                        groupIndex += 1;
                        const slotKey = `G${groupIndex}`;

                        if (slots[slotKey]) {
                            return;
                        }

                        slots[slotKey] = match;
                        return;
                    }

                    const slotKey = knockoutStageMap[match.stage];
                    if (slotKey && !slots[slotKey]) {
                        slots[slotKey] = match;
                    }
                });

                const totalPoints = teamMatches.reduce(
                    (sum, match) => sum + getMatchPointsForTeam(match, team.name),
                    0
                );

                return {
                    team,
                    totalPoints,
                    slotPoints: {
                        G1: slots.G1 ? getMatchPointsForTeam(slots.G1, team.name) : 0,
                        G2: slots.G2 ? getMatchPointsForTeam(slots.G2, team.name) : 0,
                        G3: slots.G3 ? getMatchPointsForTeam(slots.G3, team.name) : 0,
                        R32: slots.R32 ? getMatchPointsForTeam(slots.R32, team.name) : 0,
                        R16: slots.R16 ? getMatchPointsForTeam(slots.R16, team.name) : 0,
                        QF: slots.QF ? getMatchPointsForTeam(slots.QF, team.name) : 0,
                        SM: slots.SM ? getMatchPointsForTeam(slots.SM, team.name) : 0,
                        F: slots.F ? getMatchPointsForTeam(slots.F, team.name) : 0
                    },
                    html: `
                    <tr class="border-t border-gray-800 align-top">
                        <td class="px-4 py-4 min-w-[160px]">
                            <div class="flex items-center gap-3">
                                <span class="text-2xl">${team.flag}</span>
                                <div>
                                    <div class="font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-gray-900'}">
                                        ${team.name} <span class="text-gray-500">(${team.group})</span>
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td class="px-4 py-4">
                            <div class="min-w-[72px] py-1 text-center">
                                <div class="text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'} leading-none">${totalPoints}</div>
                            </div>
                        </td>
                        <td class="px-4 py-4">${formatTeamResultsCell(slots.G1, team.name, theme)}</td>
                        <td class="px-4 py-4">${formatTeamResultsCell(slots.G2, team.name, theme)}</td>
                        <td class="px-4 py-4">${formatTeamResultsCell(slots.G3, team.name, theme)}</td>
                        <td class="px-4 py-4">${formatTeamResultsCell(slots.R32, team.name, theme)}</td>
                        <td class="px-4 py-4">${formatTeamResultsCell(slots.R16, team.name, theme)}</td>
                        <td class="px-4 py-4">${formatTeamResultsCell(slots.QF, team.name, theme)}</td>
                        <td class="px-4 py-4">${formatTeamResultsCell(slots.SM, team.name, theme)}</td>
                        <td class="px-4 py-4">${formatTeamResultsCell(slots.F, team.name, theme)}</td>
                    </tr>
                `
                };
            });

        const sortState = teamResultsSortState[targetId];
        if (sortState) {
            rows.sort((a, b) => {
                let comparison = 0;

                if (sortState.key === 'team') {
                    comparison = a.team.name.localeCompare(b.team.name);
                } else if (sortState.key === 'total') {
                    comparison = a.totalPoints - b.totalPoints;
                } else {
                    comparison = (a.slotPoints[sortState.key] || 0) - (b.slotPoints[sortState.key] || 0);
                }

                if (comparison === 0) {
                    comparison = a.team.name.localeCompare(b.team.name);
                }

                return sortState.direction === 'asc' ? comparison : -comparison;
            });
        }

        body.innerHTML = rows.map((row) => row.html).join('') || '<tr><td colspan="10" class="px-4 py-8 text-center text-gray-500 uppercase text-xs">No teams found.</td></tr>';

        if (targetId === 'public-team-results-body') {
            updatePublicTeamSortIndicators();
        }
    } catch (error) {
        body.innerHTML = '<tr><td colspan="10" class="px-4 py-8 text-center text-red-400 uppercase text-xs">Could not load team results.</td></tr>';
    }
}

async function fetchAdminTeamResults() {
    return renderTeamResultsTable('admin-team-results-body', 'dark');
}

async function fetchPublicTeamResults() {
    return renderTeamResultsTable('public-team-results-body', 'light');
}

async function clearChatMessages() {
    const shouldClear = await showConfirmModal({
        title: 'Clear Entire Chat?',
        message: 'This will permanently delete all chat messages for everyone.',
        detail: 'This action cannot be undone.',
        confirmText: 'Clear Chat',
        cancelText: 'Cancel'
    });

    if (!shouldClear) {
        return;
    }

    const button = document.getElementById('admin-clear-chat-btn');
    if (button) {
        button.disabled = true;
        button.textContent = 'Clearing...';
    }

    try {
        const { error } = await supabaseClient.from('messages').delete().neq('id', 0);
        if (error) {
            throw error;
        }

        const chatBox = document.getElementById('chat-box');
        if (chatBox) {
            chatBox.innerHTML = '';
        }

        showToast('Chat cleared.', 'success');
    } catch (error) {
        showToast(error.message || 'Unable to clear chat.');
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = 'Clear Chat';
        }
    }
}

async function deleteUserPicks(email) {
    const shouldDelete = await showConfirmModal({
        title: 'Delete Player Picks?',
        message: `Remove all picks for ${email}?`,
        detail: 'This deletes their picks from the database.',
        confirmText: 'Delete Player',
        cancelText: 'Cancel'
    });

    if (!shouldDelete) {
        return;
    }

    try {
        const { error } = await supabaseClient.from('picks').delete().eq('user_email', email);
        if (error) {
            throw error;
        }

        if (userEmail === email) {
            myPicks = [];
            updateUI();
        }

        fetchAdminUsers();
        fetchAdminPaidUsers();
        fetchLeaderboard();
        fetchStats();
        showToast('Player picks deleted.', 'success');
    } catch (error) {
        showToast(error.message || 'Unable to delete player picks.');
    }
}

async function fetchAdminHistory() {
    const container = document.getElementById('admin-history-log');
    if (!container) {
        return;
    }

    const { data } = await supabaseClient
        .from('matches')
        .select('*')
        .order('match_date_manual', { ascending: false })
        .limit(20);

    container.innerHTML = data?.map((match) => `
        <div class="bg-gray-800 p-4 rounded-2xl border border-gray-700 flex justify-between items-center group">
            <div class="text-left text-white">
                <div class="text-[9px] font-black uppercase text-blue-500 text-left">${match.match_date_manual} | ${match.stage}</div>
                <div class="font-bold flex items-center gap-3 text-left">
                    <span>${match.team_home}</span>
                    <span class="bg-gray-950 px-2 py-1 rounded text-green-400 font-mono text-center">${match.score_home} - ${match.score_away}</span>
                    <span>${match.team_away}</span>
                    ${match.was_extra_time ? '<span class="text-[8px] bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded uppercase text-left">ET/P</span>' : ''}
                </div>
            </div>
            <button onclick="deleteMatch(${match.id})" class="text-gray-600 hover:text-red-500 font-bold px-4 text-xl transition-all text-white text-center">×</button>
        </div>
    `).join('') || '<div class="text-center py-10 text-gray-600 uppercase text-xs text-center text-gray-500">No matches logged</div>';
}

async function fetchPublicResults() {
    const container = document.getElementById('public-history-log');
    if (!container) {
        return;
    }

    const { data } = await supabaseClient
        .from('matches')
        .select('*')
        .order('match_date_manual', { ascending: false })
        .limit(50);

    container.innerHTML = data?.map((match) => `
        <div class="bg-white p-2 md:p-6 rounded-3xl border-2 border-gray-100 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4 text-left">
            <div class="text-left flex-grow w-full md:w-auto">
                <div class="text-[8px] md:text-[10px] text-blue-600 font-black uppercase mb-1">${match.match_date_manual} | ${match.stage}</div>
                <div class="flex items-center justify-between md:justify-start gap-2 md:gap-4 text-sm md:text-xl font-black">
                    <span class="flex-1 md:flex-none text-left">${teams.find((team) => team.name === match.team_home)?.flag} ${match.team_home}</span>
                    <span class="bg-gray-900 text-white px-2 md:px-3 py-0.5 md:py-1 rounded-lg md:rounded-xl font-mono text-center min-w-[50px] md:min-w-[70px]">${match.score_home} - ${match.score_away}</span>
                    <span class="flex-1 md:flex-none text-right md:text-left">${match.team_away} ${teams.find((team) => team.name === match.team_away)?.flag}</span>
                </div>
            </div>
            ${match.was_extra_time ? '<span class="text-[8px] md:text-[10px] font-black uppercase text-red-500 italic">ET/Pens Result</span>' : ''}
        </div>
    `).join('') || '<div class="text-center py-20 text-gray-400 font-bold uppercase text-xs text-center">Tournament results will appear here once matches begin.</div>';
}

async function deleteMatch(id) {
    if (!confirm('Delete result?')) {
        return;
    }

    await supabaseClient.from('matches').delete().eq('id', id);
    fetchAdminHistory();
    fetchLeaderboard();
    fetchAdminTeamResults();
    fetchPublicTeamResults();
    fetchPublicResults();
    renderGroups();
    fetchStats();
    setupDashboard();
}

async function submitManualResult() {
    const team1 = document.getElementById('admin-team1').value;
    const team2 = document.getElementById('admin-team2').value;
    const score1 = parseInt(document.getElementById('admin-score1').value, 10);
    const score2 = parseInt(document.getElementById('admin-score2').value, 10);
    const matchDate = document.getElementById('admin-match-date').value;
    const stage = document.getElementById('admin-stage').value;
    const wasExtraTime = document.getElementById('admin-extratime').value === 'true';

    if (!team1 || !team2 || Number.isNaN(score1) || Number.isNaN(score2) || !matchDate) {
        return showToast('Check all fields!');
    }

    if (team1 === team2) {
        return showToast('Teams must be different!');
    }

    const button = document.getElementById('admin-submit-btn');
    button.innerText = 'SAVING...';
    button.disabled = true;

    try {
        const { error } = await supabaseClient.from('matches').insert([{
            team_home: team1,
            team_away: team2,
            score_home: score1,
            score_away: score2,
            stage,
            is_finished: true,
            match_date: new Date().toISOString(),
            match_date_manual: matchDate,
            was_extra_time: wasExtraTime
        }]);

        if (error) {
            throw error;
        }

        showToast('Logged!', 'success');
        document.getElementById('admin-score1').value = '';
        document.getElementById('admin-score2').value = '';
        fetchAdminHistory();
        fetchAdminTeamResults();
        fetchPublicTeamResults();
        fetchPublicResults();
        renderGroups();
        fetchLeaderboard();
        fetchStats();
        setupDashboard();
    } catch (error) {
        showToast(error.message);
    } finally {
        button.innerText = 'Log Result';
        button.disabled = false;
    }
}

async function fetchLeaderboard() {
    const body = document.getElementById('leaderboard-body');
    body.innerHTML = '<tr><td colspan="3" class="p-8 text-center text-gray-500">Calculating Live Standings...</td></tr>';

    try {
        const { data: allPicks } = await supabaseClient.from('picks').select('*');
        const { data: allMatches } = await supabaseClient.from('matches').select('*');
        const multipliers = { Group: 1, R32: 2, R16: 3, Quarters: 5, Semis: 8, Finals: 12 };
        const teamPointsMap = {};

        teams.forEach((team) => {
            teamPointsMap[team.name] = 0;
        });

        allMatches?.forEach((match) => {
            const multiplier = multipliers[match.stage] || 1;

            if (match.score_home > match.score_away) {
                teamPointsMap[match.team_home] += 3 * multiplier;
            } else if (match.score_away > match.score_home) {
                teamPointsMap[match.team_away] += 3 * multiplier;
            } else {
                teamPointsMap[match.team_home] += 1 * multiplier;
                teamPointsMap[match.team_away] += 1 * multiplier;
            }
        });

        const userMap = new Map();
        allPicks?.forEach((pick) => {
            if (!userMap.has(pick.user_email)) {
                userMap.set(pick.user_email, {
                    nickname: pick.team_nickname || 'TBA',
                    realname: pick.team_realname || 'Joined',
                    totalPoints: 0,
                    squad: []
                });
            }

            const user = userMap.get(pick.user_email);
            user.totalPoints += teamPointsMap[pick.team_name] || 0;

            const teamData = teams.find((team) => team.name === pick.team_name);
            if (teamData) {
                user.squad.push({ flag: teamData.flag, cost: teamData.cost });
            }
        });

        let leaderboardData = Array.from(userMap.values()).sort((a, b) => b.totalPoints - a.totalPoints);
        const search = document.getElementById('leaderboard-search').value.toLowerCase();
        const filter = document.getElementById('leaderboard-country-filter').value;

        if (search) {
            leaderboardData = leaderboardData.filter((user) => (
                user.nickname.toLowerCase().includes(search) || user.realname.toLowerCase().includes(search)
            ));
        }

        if (filter) {
            leaderboardData = leaderboardData.filter((user) => (
                user.squad.some((squadTeam) => teams.find((team) => team.flag === squadTeam.flag).name === filter)
            ));
        }

        const playerCount = userMap.size;
        const totalPot = playerCount * 40;

        document.getElementById('total-players-count').innerText = playerCount;
        document.getElementById('total-prize-pot').innerText = `$${totalPot.toLocaleString()}`;
        document.getElementById('prize-1st').innerText = `$${Math.floor(totalPot * 0.65).toLocaleString()}`;
        document.getElementById('prize-2nd').innerText = `$${Math.floor(totalPot * 0.25).toLocaleString()}`;
        document.getElementById('prize-3rd').innerText = `$${Math.floor(totalPot * 0.10).toLocaleString()}`;

        body.innerHTML = leaderboardData.map((user, index) => `
            <tr class="border-b border-gray-100 hover:bg-blue-50 transition-colors text-left text-gray-900">
                <td class="px-6 py-4 text-center text-blue-600 italic">#${index + 1}</td>
                <td class="px-6 py-4 text-left">
                    <div class="text-sm font-black uppercase text-left text-gray-900">${user.nickname}</div>
                    <div class="text-[9px] text-gray-400 uppercase text-left">${user.realname}</div>
                    <div class="flex gap-1 mt-2 text-left">${user.squad.sort((a, b) => b.cost - a.cost).map((team) => `<span class="text-lg">${team.flag}</span>`).join('')}</div>
                </td>
                <td class="px-6 py-4 text-right font-mono text-2xl font-black text-blue-600 text-right">${user.totalPoints}</td>
            </tr>
        `).join('') || '<tr><td colspan="3" class="p-8 text-center text-gray-900">No players found</td></tr>';
    } catch (error) {
        body.innerHTML = '<tr><td colspan="3" class="p-8 text-center text-red-500 text-gray-900">Error calculating scores</td></tr>';
    }
}

async function fetchStats() {
    const countryBox = document.getElementById('country-pick-stats');
    const rosterBox = document.getElementById('roster-size-stats');

    countryBox.innerHTML = '<div class="animate-pulse text-gray-500 text-left">Analyzing...</div>';
    rosterBox.innerHTML = '<div class="animate-pulse text-gray-500 text-left">Calculating...</div>';

    try {
        const { data } = await supabaseClient.from('picks').select('team_name, user_email');
        if (!data) {
            return;
        }

        const countryCounts = {};
        const userRosterSizes = {};

        data.forEach((pick) => {
            countryCounts[pick.team_name] = (countryCounts[pick.team_name] || 0) + 1;
            userRosterSizes[pick.user_email] = (userRosterSizes[pick.user_email] || 0) + 1;
        });

        const sortedPicks = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]);
        countryBox.innerHTML = sortedPicks.map(([name, count]) => {
            const team = teams.find((entry) => entry.name === name);
            return `
                <div class="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 text-gray-900 text-left">
                    <div class="flex items-center gap-3">
                        <span>${team.flag}</span>
                        <span class="text-sm uppercase tracking-tighter">${name}</span>
                    </div>
                    <div class="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-black">${count} PICKS</div>
                </div>
            `;
        }).join('') || 'No picks yet.';

        const densityMap = {};
        Object.values(userRosterSizes).forEach((size) => {
            densityMap[size] = (densityMap[size] || 0) + 1;
        });

        const sortedDensities = Object.entries(densityMap).sort((a, b) => b[0] - a[0]);
        rosterBox.innerHTML = sortedDensities.map(([size, count]) => `
            <div class="flex justify-between items-center py-4 border-b border-gray-50 last:border-0 text-gray-900 text-left">
                <div>
                    <span class="text-3xl font-black text-gray-900">${size}</span>
                    <span class="text-[10px] text-gray-400 uppercase ml-2 text-gray-900 text-left">Teams</span>
                </div>
                <div class="text-right text-gray-900 text-right">
                    <div class="text-lg">${count}</div>
                    <div class="text-[8px] text-gray-400 uppercase text-left">Players</div>
                </div>
            </div>
        `).join('') || 'No rosters yet.';
    } catch (error) {
        console.error(error);
    }
}

function setupChat() {
    fetchMessages();
    setupChatKeyboardSubmit();

    if (chatChannel) {
        return;
    }

    chatChannel = supabaseClient
        .channel('chat-channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
            renderMessage(payload.new);
        })
        .subscribe();
}

async function fetchMessages() {
    const { data } = await supabaseClient
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

    const box = document.getElementById('chat-box');
    box.innerHTML = '';

    if (data) {
        data.forEach((message) => renderMessage(message));
    }
}

function renderMessage(message) {
    const box = document.getElementById('chat-box');
    if (!box) {
        return;
    }

    const isMe = message.user_email === userEmail;
    const messageElement = document.createElement('div');
    messageElement.className = `max-w-[80%] p-4 rounded-2xl text-left ${isMe ? 'bg-blue-600 text-white self-end rounded-tr-none' : 'bg-gray-100 self-start rounded-tl-none text-black'}`;
    messageElement.innerHTML = `
        <div class="text-[9px] font-black uppercase text-left ${isMe ? 'text-blue-100' : 'text-blue-600'}">
            ${message.nickname} <span class="opacity-50 text-left">(${message.realname})</span>
        </div>
        <div class="font-bold mt-1 text-sm text-left ${isMe ? 'text-white' : 'text-black'}">${message.content}</div>
    `;
    box.appendChild(messageElement);
    box.scrollTop = box.scrollHeight;
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const content = input.value.trim();
    const nickname = document.getElementById('nickname-input').value.trim();
    const realname = document.getElementById('realname-input').value.trim();

    if (!content || !nickname || !realname) {
        return showToast('Set your Name first!');
    }

    await supabaseClient.from('messages').insert([{
        user_email: userEmail,
        nickname,
        realname,
        content
    }]);

    input.value = '';
}

function setupChatKeyboardSubmit() {
    const input = document.getElementById('chat-input');

    if (!input || input.dataset.enterBound === 'true') {
        return;
    }

    input.dataset.enterBound = 'true';
    input.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' || event.shiftKey) {
            return;
        }

        event.preventDefault();
        sendChatMessage();
    });
}

Object.assign(window, {
    setupAdminPage,
    showAdminTab,
    showResultsTab,
    setupDashboard,
    setupResultsPage,
    setTeamResultsSort,
    fetchAdminHistory,
    fetchAdminUsers,
    fetchAdminPaidUsers,
    fetchAdminTeamResults,
    fetchPublicTeamResults,
    clearChatMessages,
    deleteUserPicks,
    toggleUserPaidStatus,
    fetchPublicResults,
    deleteMatch,
    submitManualResult,
    fetchLeaderboard,
    fetchStats,
    setupChat,
    fetchMessages,
    renderMessage,
    sendChatMessage,
    setupChatKeyboardSubmit
});
