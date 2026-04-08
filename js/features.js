function setupAdminPage() {
    const teamOneSelect = document.getElementById('admin-team1');
    const teamTwoSelect = document.getElementById('admin-team2');

    if (!teamOneSelect || !teamTwoSelect) {
        return;
    }

    const options = [...teams]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((team) => `<option value="${team.name}">${team.flag} ${team.name}</option>`)
        .join('');

    teamOneSelect.innerHTML = `<option value="">Select Home Team...</option>${options}`;
    teamTwoSelect.innerHTML = `<option value="">Select Away Team...</option>${options}`;

    fetchAdminHistory();
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

Object.assign(window, {
    setupAdminPage,
    fetchAdminHistory,
    fetchPublicResults,
    deleteMatch,
    submitManualResult,
    fetchLeaderboard,
    fetchStats,
    setupChat,
    fetchMessages,
    renderMessage,
    sendChatMessage
});
