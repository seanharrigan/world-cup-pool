const {
    getMatchPointsForTeam,
    buildTeamStageBreakdownMap,
    buildTeamPointsMap,
    buildProfilesMap,
    getDisplayProfile,
    buildLeaderboardData,
    getSquadSignature,
    buildBestAvailableSquadsData,
    buildBestAvailableSquadRankings,
    buildBestAvailableFilteredSquadRankings,
    buildBestAvailableTeamData
} = window.WorldCupScoring;

const {
    THIRD_PLACE_MAPPING
} = window.WorldCupThirdPlaceMapping || { THIRD_PLACE_MAPPING: {} };

const BEST_AVAILABLE_EXPLORER_LIMIT = 100;

function compareBestAvailablePoolContexts(a, b) {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    if (a.totalPoints !== b.totalPoints) return b.totalPoints - a.totalPoints;
    if (a.rankStart !== b.rankStart) return a.rankStart < b.rankStart ? -1 : 1;
    if (a.totalCost !== b.totalCost) return a.totalCost - b.totalCost;
    const aPoolRank = Number(a.displayRank || Number.POSITIVE_INFINITY);
    const bPoolRank = Number(b.displayRank || Number.POSITIVE_INFINITY);
    if (aPoolRank !== bPoolRank) return aPoolRank - bPoolRank;
    return String(a.nickname || a.realname || '').localeCompare(String(b.nickname || b.realname || ''));
}

function getTeamStatus(teamName) {
    return {
        advanced: advancedTeams.has(teamName),
        eliminated: eliminatedTeams.has(teamName)
    };
}

const teamResultsSortState = {
    'public-team-results-body': { key: 'team', direction: 'asc' }
};

const publicTeamResultsFilters = {
    tier: 'all',
    region: 'all',
    minCost: '',
    maxCost: ''
};

const stageMultiplierLabels = {
    Group: 'x1',
    R32: 'x2',
    R16: 'x3',
    Quarters: 'x5',
    Semis: 'x8',
    Finals: 'x12'
};

const PLAYER_CHIP_DEFINITIONS = {
    leader: { id: 'leader', emoji: '🥇', label: 'Leader', tone: 'positive', description: 'Ranked #1 overall right now.' },
    hot: { id: 'hot', emoji: '🔥', label: 'Hot', tone: 'positive', description: 'Most points in the most recently completed stage.' },
    group_king: { id: 'group_king', emoji: '🌟', label: 'Group King', tone: 'positive', description: 'Most group-stage points in the pool across all three matchdays.' },
    all_through: { id: 'all_through', emoji: '⚡', label: 'All Through', tone: 'positive', description: 'Every picked team made it through the group stage and none are currently eliminated.' },
    big_dog: { id: 'big_dog', emoji: '💎', label: 'Big Dog', tone: 'positive', description: 'Owns the priciest Tier 1 star in the pool.' },
    on_the_rise: { id: 'on_the_rise', emoji: '📈', label: 'On the Rise', tone: 'positive', description: 'Biggest positive jump in rank since the last leaderboard snapshot.' },
    sharpshooter: { id: 'sharpshooter', emoji: '🎯', label: 'Sharpshooter', tone: 'positive', description: 'Their squad has scored the most total goals in finished group matches.' },
    contrarian: { id: 'contrarian', emoji: '🦄', label: 'Contrarian', tone: 'positive', description: 'Holds the most teams that nobody else picked.' },
    value_pick: { id: 'value_pick', emoji: '💰', label: 'Value Pick', tone: 'positive', description: 'Best points return per budget dollar spent.' },
    still_standing: { id: 'still_standing', emoji: '🏟️', label: 'Still Standing', tone: 'positive', description: 'Has the most teams still alive in the tournament.' },
    wiped_out: { id: 'wiped_out', emoji: '💀', label: 'Wiped Out', tone: 'negative', description: 'Every picked team has already been eliminated.' },
    ice_cold: { id: 'ice_cold', emoji: '❄️', label: 'Ice Cold', tone: 'negative', description: 'Fewest points in the most recently completed stage.' },
    freefall: { id: 'freefall', emoji: '📉', label: 'Freefall', tone: 'negative', description: 'Biggest drop in rank since the last leaderboard snapshot.' },
    splurge: { id: 'splurge', emoji: '💸', label: 'Splurge', tone: 'negative', description: 'Spent almost everything while sitting in the bottom half of the table.' },
    early_graves: { id: 'early_graves', emoji: '⚰️', label: 'Early Graves', tone: 'negative', description: 'Has the most eliminated teams in their squad.' },
    united_nations: { id: 'united_nations', emoji: '🌍', label: 'United Nations', tone: 'neutral', description: 'Most varied squad by represented World Cup groups.' },
    crowd_pleaser: { id: 'crowd_pleaser', emoji: '🤝', label: 'Crowd Pleaser', tone: 'neutral', description: 'Carries the most of the pool’s most popular teams.' },
    all_in: { id: 'all_in', emoji: '🎰', label: 'All-In', tone: 'neutral', description: 'Running a squad right up against the $150 budget cap.' },
    best_student: { id: 'best_student', emoji: '🎓', label: 'Best Student', tone: 'positive', description: 'Highest pre-tournament report card score in the pool.' },
    worst_student: { id: 'worst_student', emoji: '📝', label: 'Worst Student', tone: 'negative', description: 'Lowest pre-tournament report card score in the pool.' }
};

const PLAYER_CHIP_TONE_CLASSES = {
    positive: {
        row: 'bg-green-100 border-2 border-green-600',
        card: 'bg-green-100 text-green-800 border-2 border-green-600'
    },
    negative: {
        row: 'bg-red-100 border-2 border-red-600',
        card: 'bg-red-100 text-red-800 border-2 border-red-600'
    },
    neutral: {
        row: 'bg-sky-100 border-2 border-sky-600',
        card: 'bg-sky-100 text-sky-800 border-2 border-sky-600'
    }
};

const FAVORITE_TEAM_BANNERS = {
    Spain: { slogan: 'VAMOS ESPANA', gradient: 'linear-gradient(135deg, #9f1239 0%, #dc2626 26%, #facc15 52%, #dc2626 76%, #9f1239 100%)', textColor: '#ffffff', accentColor: '#dc2626' },
    England: { slogan: "IT'S COMING HOME", gradient: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 42%, #dc2626 47%, #dc2626 53%, #ffffff 58%, #f8fafc 100%)', textColor: '#0f172a', accentColor: '#dc2626' },
    France: { slogan: 'ALLEZ LES BLEUS', gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 44%, #ffffff 49%, #ffffff 51%, #ef4444 56%, #b91c1c 100%)', textColor: '#0f172a', accentColor: '#1d4ed8' },
    Argentina: { slogan: 'VAMOS ARGENTINA', gradient: 'linear-gradient(135deg, #7dd3fc 0%, #bae6fd 45%, #ffffff 49%, #ffffff 51%, #bae6fd 55%, #7dd3fc 100%)', textColor: '#082f49', accentColor: '#0c4a6e' },
    Brazil: { slogan: 'RUMO AO HEXA', gradient: 'linear-gradient(135deg, #15803d 0%, #16a34a 34%, #facc15 70%, #eab308 100%)', textColor: '#052e16', accentColor: '#facc15' },
    Portugal: { slogan: 'FORCA PORTUGAL', gradient: 'linear-gradient(135deg, #15803d 0%, #16a34a 34%, #dc2626 66%, #991b1b 100%)', textColor: '#ffffff', accentColor: '#16a34a' },
    Germany: { slogan: 'DEUTSCHLAND VOR', gradient: 'linear-gradient(135deg, #111827 0%, #1f2937 35%, #b91c1c 68%, #facc15 100%)', textColor: '#ffffff', accentColor: '#facc15' },
    Netherlands: { slogan: 'HUP HOLLAND HUP', gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 46%, #ffffff 49%, #ffffff 51%, #2563eb 56%, #1d4ed8 100%)', textColor: '#0f172a', accentColor: '#ea580c' },
    Norway: { slogan: 'HEIA NORGE', gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 40%, #ffffff 49%, #ffffff 51%, #dc2626 58%, #991b1b 100%)', textColor: '#0f172a', accentColor: '#dc2626' },
    Belgium: { slogan: 'ALLEZ LES DIABLES', gradient: 'linear-gradient(135deg, #111827 0%, #1f2937 34%, #facc15 62%, #dc2626 100%)', textColor: '#ffffff', accentColor: '#facc15' },
    Colombia: { slogan: 'VAMOS COLOMBIA', gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 20%, #facc15 52%, #dc2626 86%, #b91c1c 100%)', textColor: '#0f172a', accentColor: '#facc15' },
    Morocco: { slogan: 'DIMA MAGHRIB', gradient: 'linear-gradient(135deg, #991b1b 0%, #dc2626 72%, #166534 100%)', textColor: '#ffffff', accentColor: '#166534' },
    USA: { slogan: 'GO USA', gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 42%, #ffffff 49%, #ffffff 51%, #ef4444 58%, #b91c1c 100%)', textColor: '#0f172a', accentColor: '#dc2626' },
    Japan: { slogan: 'NIPPON GANBARE', gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 46%, #ffffff 49%, #ffffff 51%, #e5e7eb 56%, #cbd5e1 100%)', textColor: '#0f172a', accentColor: '#1d4ed8' },
    Mexico: { slogan: 'VAMOS MEXICO', gradient: 'linear-gradient(135deg, #166534 0%, #16a34a 44%, #ffffff 49%, #ffffff 51%, #ef4444 58%, #b91c1c 100%)', textColor: '#0f172a', accentColor: '#166534' },
    Switzerland: { slogan: 'HOPP SCHWIIZ', gradient: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 72%, #7f1d1d 100%)', textColor: '#ffffff', accentColor: '#dc2626' },
    Uruguay: { slogan: 'VAMOS CELESTE', gradient: 'linear-gradient(135deg, #7dd3fc 0%, #bae6fd 46%, #ffffff 49%, #ffffff 51%, #e0f2fe 56%, #7dd3fc 100%)', textColor: '#0c4a6e', accentColor: '#0c4a6e' },
    Ecuador: { slogan: 'VAMOS ECUADOR', gradient: 'linear-gradient(135deg, #facc15 0%, #fde047 46%, #2563eb 54%, #dc2626 100%)', textColor: '#0f172a', accentColor: '#2563eb' },
    Croatia: { slogan: 'IDEMO VATRENI', gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 44%, #ffffff 49%, #ffffff 51%, #2563eb 58%, #1d4ed8 100%)', textColor: '#0f172a', accentColor: '#2563eb' },
    Austria: { slogan: 'AUF GEHTS OSTERREICH', gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 46%, #ffffff 49%, #ffffff 51%, #f8fafc 56%, #e5e7eb 100%)', textColor: '#0f172a', accentColor: '#dc2626' },
    Senegal: { slogan: 'ALLEZ LES LIONS', gradient: 'linear-gradient(135deg, #166534 0%, #16a34a 34%, #facc15 62%, #dc2626 100%)', textColor: '#052e16', accentColor: '#facc15' },
    Turkiye: { slogan: 'HAYDI TURKIYE', gradient: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 72%, #7f1d1d 100%)', textColor: '#ffffff', accentColor: '#dc2626' },
    Sweden: { slogan: 'HEJA SVERIGE', gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 34%, #facc15 100%)', textColor: '#082f49', accentColor: '#facc15' },
    Canada: { slogan: 'ALLEZ LES ROUGES', gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 28%, #ffffff 52%, #ef4444 76%, #dc2626 100%)', textColor: '#450a0a', accentColor: '#dc2626' },
    Paraguay: { slogan: 'VAMOS PARAGUAY', gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 44%, #ffffff 49%, #ffffff 51%, #2563eb 58%, #1d4ed8 100%)', textColor: '#0f172a', accentColor: '#2563eb' },
    Scotland: { slogan: 'ALBA GU BRATH', gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 46%, #ffffff 49%, #ffffff 51%, #e0f2fe 56%, #7dd3fc 100%)', textColor: '#082f49', accentColor: '#1d4ed8' },
    Bosnia: { slogan: 'IDEMO BOSNO', gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 54%, #facc15 100%)', textColor: '#082f49', accentColor: '#facc15' },
    Egypt: { slogan: 'YALLA MASR', gradient: 'linear-gradient(135deg, #111827 0%, #1f2937 44%, #ffffff 49%, #ffffff 51%, #dc2626 58%, #b91c1c 100%)', textColor: '#0f172a', accentColor: '#dc2626' },
    Czechia: { slogan: 'DO TOHO CESKO', gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 44%, #ffffff 49%, #ffffff 51%, #ef4444 58%, #dc2626 100%)', textColor: '#0f172a', accentColor: '#ef4444' },
    'Ivory Coast': { slogan: "ALLEZ LES ELEPHANTS", gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 44%, #ffffff 49%, #ffffff 51%, #16a34a 58%, #166534 100%)', textColor: '#0f172a', accentColor: '#ea580c' },
    Algeria: { slogan: 'ONE TWO THREE VIVA LALGERIE', gradient: 'linear-gradient(135deg, #166534 0%, #16a34a 44%, #ffffff 49%, #ffffff 51%, #ef4444 58%, #dc2626 100%)', textColor: '#0f172a', accentColor: '#ef4444' },
    Ghana: { slogan: 'GO BLACK STARS', gradient: 'linear-gradient(135deg, #b91c1c 0%, #ef4444 28%, #facc15 58%, #166534 100%)', textColor: '#052e16', accentColor: '#facc15' },
    Australia: { slogan: 'AUSSIE AUSSIE AUSSIE', gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 48%, #ffffff 70%, #ef4444 100%)', textColor: '#082f49', accentColor: '#ef4444' },
    Tunisia: { slogan: 'YALLA TUNIS', gradient: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 72%, #7f1d1d 100%)', textColor: '#ffffff', accentColor: '#dc2626' },
    Iran: { slogan: 'IRAN PIRUZ BAD', gradient: 'linear-gradient(135deg, #166534 0%, #16a34a 44%, #ffffff 49%, #ffffff 51%, #dc2626 58%, #b91c1c 100%)', textColor: '#0f172a', accentColor: '#dc2626' },
    'South Korea': { slogan: 'DAEHANMINGUK', gradient: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 46%, #2563eb 52%, #dc2626 100%)', textColor: '#0f172a', accentColor: '#dc2626' },
    'DR Congo': { slogan: 'ALLEZ LES LEOPARDS', gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 44%, #facc15 66%, #ef4444 100%)', textColor: '#082f49', accentColor: '#facc15' },
    Qatar: { slogan: 'YALLA QATAR', gradient: 'linear-gradient(135deg, #7f1d1d 0%, #9f1239 60%, #fdf2f8 100%)', textColor: '#ffffff', accentColor: '#9f1239' },
    'South Africa': { slogan: 'BAFANA BAFANA', gradient: 'linear-gradient(135deg, #166534 0%, #16a34a 32%, #facc15 54%, #1d4ed8 76%, #111827 100%)', textColor: '#052e16', accentColor: '#facc15' },
    'Saudi Arabia': { slogan: 'YALLA SAUDI', gradient: 'linear-gradient(135deg, #166534 0%, #16a34a 72%, #14532d 100%)', textColor: '#ffffff', accentColor: '#16a34a' },
    Panama: { slogan: 'VAMOS PANAMA', gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 44%, #ffffff 49%, #ffffff 51%, #ef4444 58%, #dc2626 100%)', textColor: '#0f172a', accentColor: '#ef4444' },
    'New Zealand': { slogan: 'GO ALL WHITES', gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 46%, #111827 100%)', textColor: '#ffffff', accentColor: '#1d4ed8' },
    Iraq: { slogan: 'YALLA IRAQ', gradient: 'linear-gradient(135deg, #111827 0%, #1f2937 42%, #ffffff 49%, #ffffff 51%, #16a34a 58%, #dc2626 100%)', textColor: '#0f172a', accentColor: '#dc2626' },
    'Cape Verde': { slogan: 'FORCA TUBAROES AZUIS', gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 52%, #facc15 78%, #ef4444 100%)', textColor: '#082f49', accentColor: '#facc15' },
    Curacao: { slogan: 'BIBA KORASOU', gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 58%, #facc15 84%, #ffffff 100%)', textColor: '#082f49', accentColor: '#facc15' },
    Uzbekistan: { slogan: 'OLGA UZBEKISTON', gradient: 'linear-gradient(135deg, #7dd3fc 0%, #bae6fd 42%, #ffffff 49%, #ffffff 51%, #16a34a 58%, #0f766e 100%)', textColor: '#0c4a6e', accentColor: '#16a34a' },
    Jordan: { slogan: 'YALLA AL NASHAMA', gradient: 'linear-gradient(135deg, #111827 0%, #1f2937 42%, #ffffff 49%, #ffffff 51%, #16a34a 58%, #dc2626 100%)', textColor: '#0f172a', accentColor: '#dc2626' },
    Haiti: { slogan: 'ALE AYITI', gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 46%, #dc2626 100%)', textColor: '#ffffff', accentColor: '#dc2626' },
    Italy: { slogan: 'FORZA AZZURRI', gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 44%, #ffffff 49%, #ffffff 51%, #ef4444 58%, #dc2626 100%)', textColor: '#0f172a', accentColor: '#ef4444' }
};

function getFavoriteTeamBannerConfig(teamName) {
    if (!teamName) {
        return {
            slogan: 'WORLD CUP DREAMING',
            gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 48%, #60a5fa 100%)',
            textColor: '#ffffff',
            accentColor: '#facc15'
        };
    }

    const team = teams.find((entry) => entry.name === teamName);
    const preset = FAVORITE_TEAM_BANNERS[teamName];

    if (preset) {
        return {
            ...preset,
            team,
            teamName
        };
    }

    return {
        slogan: `GO ${teamName.toUpperCase()}`,
        gradient: 'linear-gradient(135deg, #1f2937 0%, #334155 52%, #64748b 100%)',
        textColor: '#ffffff',
        accentColor: '#facc15',
        team,
        teamName
    };
}

function getThemeHexColors(config) {
    return [...new Set(
        (config.gradient.match(/#[0-9a-fA-F]{6}/g) || [])
            .map((color) => color.toLowerCase())
    )];
}

function getColorFamily(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    if (max < 55) return 'dark';
    if (delta < 18 && max > 200) return 'white';
    if (delta < 22) return 'neutral';

    let hue = 0;
    if (delta !== 0) {
        if (max === r) hue = ((g - b) / delta) % 6;
        else if (max === g) hue = (b - r) / delta + 2;
        else hue = (r - g) / delta + 4;
        hue *= 60;
        if (hue < 0) hue += 360;
    }

    if (hue < 20 || hue >= 340) return 'red';
    if (hue < 42) return 'orange';
    if (hue < 80) return 'yellow';
    if (hue < 170) return 'green';
    if (hue < 250) return 'blue';
    if (hue < 290) return 'purple';
    return 'red';
}

function getThemeColorContext(config) {
    const whiteLikeColors = new Set(['#ffffff', '#f8fafc', '#fdf2f8', '#e5e7eb', '#cbd5e1', '#e0f2fe', '#bae6fd']);
    const hexColors = getThemeHexColors(config);
    const nonWhiteColors = hexColors.filter((color) => !whiteLikeColors.has(color));
    const colorFamilies = [...new Set(nonWhiteColors.map(getColorFamily).filter((family) => family !== 'white' && family !== 'neutral'))];
    const yellowBackground = nonWhiteColors.find((color) => getColorFamily(color) === 'yellow');
    const backgroundColor = yellowBackground || nonWhiteColors[0] || config.accentColor || config.textColor;
    const backgroundFamily = getColorFamily(backgroundColor);

    return { nonWhiteColors, colorFamilies, backgroundColor, backgroundFamily };
}

function getContrastingThemeTextColor(config, backgroundColor = '') {
    if (config.menuTextColor) {
        return config.menuTextColor;
    }

    const { nonWhiteColors, colorFamilies, backgroundFamily } = getThemeColorContext(config);
    if (nonWhiteColors.length === 1) {
        return nonWhiteColors[0];
    }

    const nonYellowColors = nonWhiteColors.filter((color) => getColorFamily(color) !== 'yellow');
    const contrastingColor = nonYellowColors.find((color) => getColorFamily(color) !== backgroundFamily && color !== backgroundColor.toLowerCase());
    const alternateColor = nonYellowColors.find((color) => color !== backgroundColor.toLowerCase());
    const nonYellowAccent = config.accentColor && getColorFamily(config.accentColor.toLowerCase()) !== 'yellow'
        ? config.accentColor
        : null;
    const nonYellowText = config.textColor && getColorFamily(config.textColor.toLowerCase()) !== 'yellow'
        ? config.textColor
        : null;

    return contrastingColor || alternateColor || nonYellowAccent || nonYellowText || nonYellowColors[0] || nonWhiteColors[0] || config.textColor;
}

function hexToRgb(hex) {
    const normalized = hex.replace('#', '');
    return {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16)
    };
}

function rgbToHex({ r, g, b }) {
    return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function mixHexWithWhite(hex, ratio) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHex({
        r: Math.round(r + (255 - r) * ratio),
        g: Math.round(g + (255 - g) * ratio),
        b: Math.round(b + (255 - b) * ratio)
    });
}

function darkenHex(hex, ratio) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHex({
        r: Math.round(r * (1 - ratio)),
        g: Math.round(g * (1 - ratio)),
        b: Math.round(b * (1 - ratio))
    });
}

function getFavoriteTeamAccentTokens(favoriteTeam) {
    const config = getFavoriteTeamBannerConfig(favoriteTeam);
    const { nonWhiteColors } = getThemeColorContext(config);
    const usableColors = nonWhiteColors.filter((color) => getColorFamily(color) !== 'yellow');
    const nonYellowAccent = config.accentColor && getColorFamily(config.accentColor.toLowerCase()) !== 'yellow'
        ? config.accentColor.toLowerCase()
        : '';
    const primary = nonYellowAccent || usableColors[0] || '#3b82f6';

    return {
        primary,
        primaryRgb: hexToRgb(primary),
        text: darkenHex(primary, 0.12),
        onDark: mixHexWithWhite(primary, 0.68),
        soft: mixHexWithWhite(primary, 0.90),
        softStrong: mixHexWithWhite(primary, 0.78),
        pillBg: mixHexWithWhite(primary, 0.84),
        pillText: darkenHex(primary, 0.18)
    };
}

function rgbaFromHex(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getActiveThemeAccentTokens() {
    const rootStyles = getComputedStyle(document.documentElement);
    const cssPrimary = rootStyles.getPropertyValue('--theme-accent-primary').trim();
    if (cssPrimary && cssPrimary.startsWith('#')) {
        return {
            primary: cssPrimary,
            primaryRgb: hexToRgb(cssPrimary),
            text: darkenHex(cssPrimary, 0.12),
            soft: mixHexWithWhite(cssPrimary, 0.90),
            softStrong: mixHexWithWhite(cssPrimary, 0.78),
            pillBg: mixHexWithWhite(cssPrimary, 0.84),
            pillText: darkenHex(cssPrimary, 0.18)
        };
    }

    return getFavoriteTeamAccentTokens('');
}

function applyPicksAccentTheme(currentProfile = null) {
    const favoriteTeam = currentProfile?.favoriteTeam || '';
    const tokens = getFavoriteTeamAccentTokens(favoriteTeam);
    const root = document.documentElement;

    root.style.setProperty('--picks-accent-primary', tokens.primary);
    root.style.setProperty('--picks-accent-primary-rgb', `${tokens.primaryRgb.r}, ${tokens.primaryRgb.g}, ${tokens.primaryRgb.b}`);
    root.style.setProperty('--picks-accent-text', tokens.text);
    root.style.setProperty('--picks-accent-soft', tokens.soft);
    root.style.setProperty('--picks-accent-soft-strong', tokens.softStrong);
    root.style.setProperty('--picks-accent-pill-bg', tokens.pillBg);
    root.style.setProperty('--picks-accent-pill-text', tokens.pillText);
    root.style.setProperty('--theme-accent-primary', tokens.primary);
    root.style.setProperty('--theme-accent-primary-rgb', `${tokens.primaryRgb.r}, ${tokens.primaryRgb.g}, ${tokens.primaryRgb.b}`);
    root.style.setProperty('--theme-accent-text', tokens.text);
    root.style.setProperty('--theme-accent-on-dark', mixHexWithWhite(tokens.primary, 0.45));
    root.style.setProperty('--theme-accent-soft', tokens.soft);
    root.style.setProperty('--theme-accent-soft-strong', tokens.softStrong);
    root.style.setProperty('--theme-accent-button-hover', darkenHex(tokens.primary, 0.10));
    root.style.setProperty('--theme-accent-chat-meta', 'rgba(255,255,255,0.82)');
}

function applyFavoriteBanner(banner, bannerText, favoriteTeam) {
    if (!banner || !bannerText) {
        return;
    }

    const config = getFavoriteTeamBannerConfig(favoriteTeam);
    const team = config.team || teams.find((entry) => entry.name === favoriteTeam);
    const leftFlag = team?.flag || '🌍';
    const rightFlag = team?.flag || '🌍';
    const { backgroundColor } = getThemeColorContext(config);

    const statsBar = document.getElementById('dashboard-stats-bar');
    banner.className = 'px-6 py-5 text-center';
    banner.classList.remove('hidden');
    banner.style.background = `linear-gradient(rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.75)), ${config.gradient}`;

    const glowDividerBottom = document.getElementById('dashboard-glow-divider-bottom');
    if (glowDividerBottom) glowDividerBottom.classList.remove('hidden');
    if (statsBar) {
        statsBar.classList.remove('hidden');
        statsBar.style.background = '#f3f4f6';
        statsBar.style.color = '#111827';
    }
    bannerText.className = 'text-xl md:text-2xl font-black uppercase italic tracking-[0.08em]';
    bannerText.style.color = getContrastingThemeTextColor(config, backgroundColor);
    bannerText.textContent = `${leftFlag} ${config.slogan} ${rightFlag}`;
}

function renderDashboardFavoriteBanner(currentProfile) {
    const banner = document.getElementById('dashboard-favorite-banner');
    const bannerText = document.getElementById('dashboard-favorite-banner-text');
    const bannerSubtext = document.getElementById('dashboard-favorite-banner-subtext');

    if (!banner || !bannerText || !bannerSubtext) {
        return;
    }

    const favoriteTeam = currentProfile?.favoriteTeam || '';
    applyFavoriteBanner(banner, bannerText, favoriteTeam);
    bannerSubtext.className = 'hidden';
    bannerSubtext.textContent = '';
}

function renderProfileFavoriteBanner() {
    const banner = document.getElementById('profile-favorite-banner');
    const bannerText = document.getElementById('profile-favorite-banner-text');
    const bannerNote = document.getElementById('profile-favorite-banner-note');
    const favoriteTeamInput = document.getElementById('favorite-team-input');

    if (!banner || !bannerText || !favoriteTeamInput) {
        return;
    }

    applyFavoriteBanner(banner, bannerText, favoriteTeamInput.value || '');

    if (!bannerNote) {
        return;
    }

    const savedFavoriteTeam = favoriteTeamInput.dataset.savedValue || '';
    const hasUnsavedFavoriteTeamChange = (favoriteTeamInput.value || '') !== savedFavoriteTeam;

    bannerNote.classList.toggle('hidden', !hasUnsavedFavoriteTeamChange);
}

function renderTopNavFavoriteTheme(currentProfile) {
    const topNav = document.getElementById('top-nav');
    const topNavFlag = document.getElementById('top-nav-flag');
    const topNavIcon = document.getElementById('top-nav-icon');
    const topNavTitle = document.getElementById('top-nav-title');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenuLinks = document.querySelectorAll('#mobile-menu .mobile-menu-link');
    const desktopNavLinks = document.querySelectorAll('#top-nav .nav-link:not(#nav-admin)');
    const userDisplayNav = document.getElementById('user-display-nav');

    if (!topNav || !topNavFlag || !topNavIcon || !topNavTitle) {
        return;
    }

    const favoriteTeam = currentProfile?.favoriteTeam || '';
    const config = getFavoriteTeamBannerConfig(favoriteTeam);
    const team = config.team || teams.find((entry) => entry.name === favoriteTeam);
    const { backgroundColor: navBackgroundColor } = getThemeColorContext(config);
    const menuTextColor = getContrastingThemeTextColor(config, navBackgroundColor);

    if (!favoriteTeam || !team) {
        topNav.style.background = '';
        topNav.style.borderBottomColor = '';
        topNav.style.setProperty('--nav-accent', '');
        if (mobileMenu) {
            mobileMenu.style.background = '';
        }
        if (mobileMenuButton) {
            mobileMenuButton.style.color = '';
        }
        mobileMenuLinks.forEach((link) => {
            link.style.color = '';
            link.style.borderBottomColor = '';
        });
        topNavFlag.classList.add('hidden');
        topNavFlag.textContent = '';
        topNavIcon.classList.remove('hidden');
        topNavTitle.style.color = '';
        desktopNavLinks.forEach((link) => {
            link.style.color = '';
        });
        if (userDisplayNav) {
            userDisplayNav.style.color = '';
        }
        return;
    }

    topNav.style.background = `linear-gradient(rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.75)), ${navBackgroundColor}`;
    topNav.style.borderBottomColor = 'rgba(15, 23, 42, 0.18)';
    topNav.style.setProperty('--nav-accent', menuTextColor);
    if (mobileMenu) {
        mobileMenu.style.background = `linear-gradient(rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.75)), ${navBackgroundColor}`;
    }
    if (mobileMenuButton) {
        mobileMenuButton.style.setProperty('color', menuTextColor, 'important');
    }
    mobileMenuLinks.forEach((link) => {
        link.style.setProperty('color', menuTextColor, 'important');
        link.style.borderBottomColor = 'rgba(255, 255, 255, 0.95)';
    });
    topNavFlag.classList.remove('hidden');
    topNavFlag.textContent = team.flag;
    topNavIcon.classList.add('hidden');
    topNavTitle.style.setProperty('color', menuTextColor, 'important');
    desktopNavLinks.forEach((link) => {
        link.style.setProperty('color', menuTextColor, 'important');
    });
    if (userDisplayNav) {
        userDisplayNav.style.setProperty('color', menuTextColor, 'important');
    }
}

// ── Team Report Card Data ─────────────────────────────────────────────────────
// winProb: avg implied win% from DraftKings + ESPN/bet365 + BetMGM (Apr 2026)
// fifaRank: official FIFA ranking, April 1 2026 update
// dk/espn/betmgm: American odds (+xxx). betmgm null where only top-15 published.
// Sources: draftkings.com, espn.com/espn/betting, betmgm.com

const TEAM_REPORT_DATA = {
    'Spain':        { winProb: 18.18, fifaRank: 2,  dk: 450,    espn: 450,    betmgm: 450   },
    'France':       { winProb: 15.02, fifaRank: 1,  dk: 600,    espn: 550,    betmgm: 550   },
    'England':      { winProb: 13.33, fifaRank: 4,  dk: 650,    espn: 650,    betmgm: 650   },
    'Brazil':       { winProb: 10.72, fifaRank: 6,  dk: 850,    espn: 850,    betmgm: 800   },
    'Argentina':    { winProb: 10.72, fifaRank: 3,  dk: 850,    espn: 850,    betmgm: 800   },
    'Portugal':     { winProb: 8.37,  fifaRank: 5,  dk: 1200,   espn: 1100,   betmgm: 1000  },
    'Germany':      { winProb: 6.67,  fifaRank: 10, dk: 1400,   espn: 1400,   betmgm: 1400  },
    'Netherlands':  { winProb: 4.62,  fifaRank: 7,  dk: 2200,   espn: 2000,   betmgm: 2000  },
    'Norway':       { winProb: 3.51,  fifaRank: 31, dk: 3000,   espn: 2800,   betmgm: 2500  },
    'Belgium':      { winProb: 2.83,  fifaRank: 9,  dk: 3500,   espn: 3500,   betmgm: 3300  },
    'Colombia':     { winProb: 2.28,  fifaRank: 13, dk: 5000,   espn: 4000,   betmgm: 4000  },
    'Morocco':      { winProb: 1.57,  fifaRank: 8,  dk: 6600,   espn: 6000,   betmgm: null  },
    'USA':          { winProb: 1.83,  fifaRank: 16, dk: 6500,   espn: 6500,   betmgm: 4000  },
    'Japan':        { winProb: 1.75,  fifaRank: 18, dk: 7500,   espn: 5000,   betmgm: 5000  },
    'Mexico':       { winProb: 1.38,  fifaRank: 15, dk: 8000,   espn: 7000,   betmgm: 6600  },
    'Switzerland':  { winProb: 0.99,  fifaRank: 19, dk: 10000,  espn: 10000,  betmgm: null  },
    'Uruguay':      { winProb: 1.57,  fifaRank: 17, dk: 8000,   espn: 6500,   betmgm: 5000  },
    'Ecuador':      { winProb: 1.11,  fifaRank: 23, dk: 10000,  espn: 8000,   betmgm: null  },
    'Croatia':      { winProb: 1.04,  fifaRank: 11, dk: 10000,  espn: 9000,   betmgm: null  },
    'Austria':      { winProb: 0.83,  fifaRank: 24, dk: 15000,  espn: 10000,  betmgm: null  },
    'Senegal':      { winProb: 0.89,  fifaRank: 14, dk: 12500,  espn: 10000,  betmgm: null  },
    'Turkiye':      { winProb: 1.25,  fifaRank: 22, dk: 10000,  espn: 6500,   betmgm: null  },
    'Sweden':       { winProb: 0.95,  fifaRank: 38, dk: 15000,  espn: 8000,   betmgm: null  },
    'Bosnia':       { winProb: 0.40,  fifaRank: 65, dk: 25000,  espn: 25000,  betmgm: null  },
    'Canada':       { winProb: 0.50,  fifaRank: 30, dk: 20000,  espn: 20000,  betmgm: null  },
    'Paraguay':     { winProb: 0.50,  fifaRank: 40, dk: 20000,  espn: 20000,  betmgm: null  },
    'Scotland':     { winProb: 0.45,  fifaRank: 43, dk: 25000,  espn: 20000,  betmgm: null  },
    'Egypt':        { winProb: 0.33,  fifaRank: 29, dk: 30000,  espn: 30000,  betmgm: null  },
    'Czechia':      { winProb: 0.50,  fifaRank: 41, dk: 30000,  espn: 15000,  betmgm: null  },
    'Ivory Coast':  { winProb: 0.37,  fifaRank: 34, dk: 30000,  espn: 25000,  betmgm: null  },
    'Algeria':      { winProb: 0.27,  fifaRank: 28, dk: 40000,  espn: 35000,  betmgm: null  },
    'Ghana':        { winProb: 0.27,  fifaRank: 74, dk: 40000,  espn: 35000,  betmgm: null  },
    'Australia':    { winProb: 0.21,  fifaRank: 27, dk: 50000,  espn: 45000,  betmgm: null  },
    'Tunisia':      { winProb: 0.20,  fifaRank: 44, dk: 50000,  espn: 50000,  betmgm: null  },
    'Iran':         { winProb: 0.27,  fifaRank: 21, dk: 50000,  espn: 30000,  betmgm: null  },
    'South Korea':  { winProb: 0.24,  fifaRank: 25, dk: 50000,  espn: 35000,  betmgm: null  },
    'DR Congo':     { winProb: 0.14,  fifaRank: 46, dk: 75000,  espn: 70000,  betmgm: null  },
    'Qatar':        { winProb: 0.10,  fifaRank: 55, dk: 100000, espn: 100000, betmgm: null  },
    'South Africa': { winProb: 0.11,  fifaRank: 60, dk: 100000, espn: 80000,  betmgm: null  },
    'Saudi Arabia': { winProb: 0.10,  fifaRank: 61, dk: 100000, espn: 100000, betmgm: null  },
    'Panama':       { winProb: 0.08,  fifaRank: 33, dk: 150000, espn: 100000, betmgm: null  },
    'New Zealand':  { winProb: 0.07,  fifaRank: 85, dk: 200000, espn: 100000, betmgm: null  },
    'Iraq':         { winProb: 0.08,  fifaRank: 57, dk: 150000, espn: 100000, betmgm: null  },
    'Cape Verde':   { winProb: 0.07,  fifaRank: 69, dk: 200000, espn: 100000, betmgm: null  },
    'Uzbekistan':   { winProb: 0.06,  fifaRank: 50, dk: 200000, espn: 150000, betmgm: null  },
    'Curacao':      { winProb: 0.05,  fifaRank: 82, dk: 250000, espn: 150000, betmgm: null  },
    'Jordan':       { winProb: 0.05,  fifaRank: 63, dk: 250000, espn: 150000, betmgm: null  },
    'Haiti':        { winProb: 0.05,  fifaRank: 83, dk: 300000, espn: 150000, betmgm: null  },
};

function _computeRawUpside(squad) {
    return (squad || [])
        .filter((t) => !eliminatedTeams.has(t.name))
        .reduce((s, t) => s + (TEAM_REPORT_DATA[t.name]?.winProb || 0), 0);
}

// Pro-rata redistribute eliminated teams' win% across survivors so they still
// sum to the original pre-tournament total. Returns Map<teamName, adjustedProb>.
function _buildAdjustedWinProbMap() {
    let originalTotal = 0;
    let survivingTotal = 0;
    for (const name in TEAM_REPORT_DATA) {
        const prob = TEAM_REPORT_DATA[name]?.winProb || 0;
        originalTotal += prob;
        if (!eliminatedTeams.has(name)) survivingTotal += prob;
    }
    const scale = survivingTotal > 0 ? originalTotal / survivingTotal : 1;
    const map = new Map();
    for (const name in TEAM_REPORT_DATA) {
        if (!eliminatedTeams.has(name)) {
            map.set(name, (TEAM_REPORT_DATA[name].winProb || 0) * scale);
        }
    }
    return map;
}

// Solves the pool's constrained knapsack:
// cost ≤ 150, ≤ 1 Tier 1, ≥ 3 Tier 3, maximising Σ winProb.
// Returns { squad: [...], rawTotal } or { squad: [], rawTotal: 0 } if infeasible.
function _computeMaxPossibleSquad() {
    const candidates = (typeof teams !== 'undefined' ? teams : [])
        .filter((t) => t && t.name && t.qualified !== false && !eliminatedTeams.has(t.name))
        .map((t) => ({
            name: t.name,
            flag: t.flag || '',
            cost: t.cost || 0,
            tier: t.tier,
            group: t.group || '',
            winProb: (TEAM_REPORT_DATA[t.name]?.winProb) || 0
        }));

    const memo = new Map();
    const decision = new Map();

    function bestFrom(i, cost, t1, t3) {
        if (i >= candidates.length) return (cost <= 150 && t1 <= 1 && t3 >= 3) ? 0 : -Infinity;

        const key = `${i}|${cost}|${t1}|${Math.min(t3, 3)}`;
        if (memo.has(key)) return memo.get(key);

        const skip = bestFrom(i + 1, cost, t1, t3);

        let take = -Infinity;
        const c = candidates[i];
        const newT1 = t1 + (c.tier === 1 ? 1 : 0);
        const newCost = cost + c.cost;
        if (newT1 <= 1 && newCost <= 150) {
            const newT3 = t3 + (c.tier === 3 ? 1 : 0);
            const sub = bestFrom(i + 1, newCost, newT1, newT3);
            if (sub > -Infinity) take = sub + c.winProb;
        }

        const best = Math.max(skip, take);
        memo.set(key, best);
        decision.set(key, take > skip ? 'take' : 'skip');
        return best;
    }

    const total = bestFrom(0, 0, 0, 0);
    if (!isFinite(total) || total <= 0) return { squad: [], rawTotal: 0 };

    const picks = [];
    let i = 0, cost = 0, t1 = 0, t3 = 0;
    while (i < candidates.length) {
        const key = `${i}|${cost}|${t1}|${Math.min(t3, 3)}`;
        if (decision.get(key) === 'take') {
            const c = candidates[i];
            picks.push(c);
            cost += c.cost;
            t1 += (c.tier === 1 ? 1 : 0);
            t3 += (c.tier === 3 ? 1 : 0);
        }
        i++;
    }

    return { squad: picks, rawTotal: total };
}

// Returns Map<email, 0-100> normalised so the theoretical best legal squad = 100.
// Also stashes the best squad + raw total on window for modal reference.
function _buildUpsideMap(leaderboardData) {
    const best = _computeMaxPossibleSquad();
    const leaderboardRaws = (leaderboardData || []).map((e) => _computeRawUpside(e.squad));
    const fallbackMax = Math.max(...leaderboardRaws, 0.001);
    const maxRaw = best.rawTotal > 0 ? best.rawTotal : fallbackMax;

    window._poolBestUpsideSquad = best.squad;
    window._poolBestUpsideRaw = best.rawTotal;

    const map = new Map();
    (leaderboardData || []).forEach((e, idx) => {
        map.set(e.email, Math.round(leaderboardRaws[idx] / maxRaw * 100));
    });
    return map;
}

function _computeUpside(squad) {
    // Legacy single-squad call — returns raw winProb sum (use _buildUpsideMap for pool-relative scores)
    return _computeRawUpside(squad);
}

const _HOST_TEAMS = new Set(['USA', 'Canada', 'Mexico']);
const _CONTRARIAN_TEAMS = new Set(['Cape Verde', 'Curacao', 'Uzbekistan', 'Jordan', 'Haiti']);

function _computeFlavorText(squadData) {
    const names = squadData.map((t) => t.name);
    const profile = window._dashCurrentProfile;
    const favTeam = profile?.favoriteTeam || '';

    if (favTeam && names.includes(favTeam)) {
        return `Picking ${favTeam}? Not biased at all. Totally objective.`;
    }
    const hostPicks = names.filter((n) => _HOST_TEAMS.has(n));
    if (hostPicks.length >= 2) {
        return `${hostPicks.join(' and ')} at a home World Cup — brave, or just patriotic?`;
    }
    if (hostPicks.length === 1) {
        return `${hostPicks[0]} at home. Heart says yes. Odds say… we'll see.`;
    }
    const contrarian = names.filter((n) => _CONTRARIAN_TEAMS.has(n));
    if (contrarian.length >= 2) {
        return `${contrarian[0]} and ${contrarian[1]}? The scout reports must be incredible.`;
    }
    if (contrarian.length === 1) {
        return `${contrarian[0]} in the squad. Bold. Very bold.`;
    }
    const tier1 = squadData.filter((t) => t.tier === 1);
    if (tier1.length === 0) {
        return `No tier 1 team? Either a bold contrarian or a strict budget hawk.`;
    }
    const eliminated = squadData.filter((t) => t.eliminated);
    if (eliminated.length >= 3) {
        return `${eliminated.length} teams already eliminated. Respect the commitment.`;
    }
    const totalCost = squadData.reduce((s, t) => s + t.cost, 0);
    if (totalCost <= 80) {
        return `Under $80 total? Either genius budgeting or a very optimistic outlook.`;
    }
    if (totalCost >= 140) {
        return `Nearly maxing the budget — all in on quality. No room for sentiment.`;
    }
    return `Solid, unremarkable, reliable. The Switzerland of fantasy squads.`;
}

function _computeReportCard(squad) {
    if (!squad || squad.length === 0) return null;

    const squadData = squad.map((team) => {
        const d = TEAM_REPORT_DATA[team.name] || {};
        const winProb = d.winProb || 0;
        const cost = team.cost || 1;
        const valueRatio = winProb / cost;
        const fifaRank = d.fifaRank || 90;
        const rankScore = Math.max(0, Math.round((1 - (fifaRank - 1) / 89) * 100));
        return { ...team, winProb, valueRatio, fifaRank, rankScore, data: d };
    });

    const avgValue = squadData.reduce((s, t) => s + t.valueRatio, 0) / squadData.length;
    const avgRank = squadData.reduce((s, t) => s + t.rankScore, 0) / squadData.length;

    // Normalise value against the best achievable legal 8-team squad avg ratio (~0.106)
    const valueNorm = Math.min(avgValue / 0.106 * 100, 100);

    // Balance: tier 2 quality (50%) + tier 3 quality (30%) + tier 1 usage (20%)
    // Tier 2 is the key differentiator — huge range from Netherlands (35%) down to Canada (6%)
    const tier1Count = squadData.filter((t) => t.tier === 1).length;
    const tier2InSquad = squadData.filter((t) => t.tier === 2);
    const tier3InSquad = squadData.filter((t) => t.tier === 3);

    // Tier 2 quality: compare avg win% against the top possible tier 2 picks (best 4)
    const allTier2WinProbs = teams
        .filter((t) => t.tier === 2)
        .map((t) => (TEAM_REPORT_DATA[t.name] || {}).winProb || 0)
        .sort((a, b) => b - a);
    const bestTier2Avg = allTier2WinProbs.slice(0, 4).reduce((s, v) => s + v, 0) / 4;
    const myTier2Avg = tier2InSquad.length > 0
        ? tier2InSquad.reduce((s, t) => s + t.winProb, 0) / tier2InSquad.length
        : 0;
    const tier2Quality = bestTier2Avg > 0 ? Math.min(100, (myTier2Avg / bestTier2Avg) * 100) : 50;

    // Tier 3 quality: compare avg win% against best 3 tier 3s
    const allTier3WinProbs = teams
        .filter((t) => t.tier === 3)
        .map((t) => (TEAM_REPORT_DATA[t.name] || {}).winProb || 0)
        .sort((a, b) => b - a);
    const bestTier3Avg = allTier3WinProbs.slice(0, 3).reduce((s, v) => s + v, 0) / 3;
    const myTier3Avg = tier3InSquad.length > 0
        ? tier3InSquad.reduce((s, t) => s + t.winProb, 0) / tier3InSquad.length
        : 0;
    const tier3Quality = bestTier3Avg > 0 ? Math.min(100, (myTier3Avg / bestTier3Avg) * 100) : 0;

    // Tier 1 slot: using it (one elite team) is better
    const tier1Score = tier1Count === 1 ? 85 : 40;

    const balanceScore = tier2Quality * 0.50 + tier3Quality * 0.30 + tier1Score * 0.20;

    const rawTotal = valueNorm * 0.4 + avgRank * 0.3 + balanceScore * 0.3;
    const total = Math.min(100, rawTotal);

    const grades = [
        [90, 'A+', 'Scouting genius — the bookies can\'t hide value from you.'],
        [85, 'A',  'Elite squad. Sharp picks from top to bottom.'],
        [80, 'A-', 'Very strong. Almost everything here has a real case.'],
        [75, 'B+', 'Solid squad — you clearly know what you\'re doing.'],
        [70, 'B',  'Good mix. A couple of picks really stand out.'],
        [65, 'B-', 'Decent foundation. A few tweaks could push you higher.'],
        [58, 'C+', 'Some value here, some faith-based selections.'],
        [50, 'C',  'Mid-table manager. Serviceable but not scary.'],
        [40, 'C-', 'A few head-scratchers in here.'],
        [25, 'D',  'Brave choices. The market disagrees, strongly.'],
        [0,  'F',  'Pure heart, zero stats. Good luck — you\'ll need it.'],
    ];
    const [, grade, tagline] = grades.find(([threshold]) => total >= threshold) || grades[grades.length - 1];

    return { grade, total, valueNorm, avgRank, balanceScore, squadData, tagline, flavorText: _computeFlavorText(squadData) };
}

// ── 2026 World Cup Group Stage Schedule ──────────────────────────────────────
// All 72 group stage matches. Dates are "YYYY-MM-DD". Teams match the names in
// the global `teams` array exactly so flag lookups work automatically.

const GROUP_STAGE_SCHEDULE = [
    // Jun 11
    { match:  1, date: '2026-06-11', time: '12:00', group: 'A', home: 'Mexico'            , away: 'South Africa' },
    { match:  2, date: '2026-06-11', time: '19:00', group: 'A', home: 'South Korea'       , away: 'Czechia' },
    // Jun 12
    { match:  3, date: '2026-06-12', time: '12:00', group: 'B', home: 'Canada'            , away: 'Bosnia' },
    { match:  4, date: '2026-06-12', time: '18:00', group: 'D', home: 'USA'               , away: 'Paraguay' },
    // Jun 13
    { match:  8, date: '2026-06-13', time: '12:00', group: 'B', home: 'Qatar'             , away: 'Switzerland' },
    { match:  7, date: '2026-06-13', time: '15:00', group: 'C', home: 'Brazil'            , away: 'Morocco' },
    { match:  5, date: '2026-06-13', time: '18:00', group: 'C', home: 'Haiti'             , away: 'Scotland' },
    { match:  6, date: '2026-06-13', time: '21:00', group: 'D', home: 'Australia'         , away: 'Turkiye' },
    // Jun 14
    { match: 10, date: '2026-06-14', time: '10:00', group: 'E', home: 'Germany'           , away: 'Curacao' },
    { match:  9, date: '2026-06-14', time: '16:00', group: 'E', home: 'Ivory Coast'       , away: 'Ecuador' },
    { match: 11, date: '2026-06-14', time: '13:00', group: 'F', home: 'Netherlands'       , away: 'Japan' },
    { match: 12, date: '2026-06-14', time: '19:00', group: 'F', home: 'Sweden'            , away: 'Tunisia' },
    // Jun 15
    { match: 16, date: '2026-06-15', time: '12:00', group: 'G', home: 'Belgium'           , away: 'Egypt' },
    { match: 15, date: '2026-06-15', time: '18:00', group: 'G', home: 'Iran'              , away: 'New Zealand' },
    { match: 14, date: '2026-06-15', time: '09:00', group: 'H', home: 'Spain'             , away: 'Cape Verde' },
    { match: 13, date: '2026-06-15', time: '15:00', group: 'H', home: 'Saudi Arabia'      , away: 'Uruguay' },
    // Jun 16
    { match: 17, date: '2026-06-16', time: '12:00', group: 'I', home: 'France'            , away: 'Senegal' },
    { match: 18, date: '2026-06-16', time: '15:00', group: 'I', home: 'Iraq'              , away: 'Norway' },
    { match: 19, date: '2026-06-16', time: '18:00', group: 'J', home: 'Argentina'         , away: 'Algeria' },
    { match: 20, date: '2026-06-16', time: '21:00', group: 'J', home: 'Austria'           , away: 'Jordan' },
    // Jun 17
    { match: 23, date: '2026-06-17', time: '10:00', group: 'K', home: 'Portugal'          , away: 'DR Congo' },
    { match: 24, date: '2026-06-17', time: '19:00', group: 'K', home: 'Uzbekistan'        , away: 'Colombia' },
    { match: 22, date: '2026-06-17', time: '13:00', group: 'L', home: 'England'           , away: 'Croatia' },
    { match: 21, date: '2026-06-17', time: '16:00', group: 'L', home: 'Ghana'             , away: 'Panama' },
    // Jun 18
    { match: 25, date: '2026-06-18', time: '09:00', group: 'A', home: 'Czechia'           , away: 'South Africa' },
    { match: 28, date: '2026-06-18', time: '18:00', group: 'A', home: 'Mexico'            , away: 'South Korea' },
    { match: 26, date: '2026-06-18', time: '12:00', group: 'B', home: 'Switzerland'       , away: 'Bosnia' },
    { match: 27, date: '2026-06-18', time: '15:00', group: 'B', home: 'Canada'            , away: 'Qatar' },
    // Jun 19
    { match: 30, date: '2026-06-19', time: '15:00', group: 'C', home: 'Scotland'          , away: 'Morocco' },
    { match: 29, date: '2026-06-19', time: '17:30', group: 'C', home: 'Brazil'            , away: 'Haiti' },
    { match: 32, date: '2026-06-19', time: '12:00', group: 'D', home: 'USA'               , away: 'Australia' },
    { match: 31, date: '2026-06-19', time: '20:00', group: 'D', home: 'Turkiye'           , away: 'Paraguay' },
    // Jun 20
    { match: 33, date: '2026-06-20', time: '13:00', group: 'E', home: 'Germany'           , away: 'Ivory Coast' },
    { match: 34, date: '2026-06-20', time: '17:00', group: 'E', home: 'Ecuador'           , away: 'Curacao' },
    { match: 35, date: '2026-06-20', time: '10:00', group: 'F', home: 'Netherlands'       , away: 'Sweden' },
    { match: 36, date: '2026-06-20', time: '21:00', group: 'F', home: 'Tunisia'           , away: 'Japan' },
    // Jun 21
    { match: 39, date: '2026-06-21', time: '12:00', group: 'G', home: 'Belgium'           , away: 'Iran' },
    { match: 40, date: '2026-06-21', time: '18:00', group: 'G', home: 'New Zealand'       , away: 'Egypt' },
    { match: 38, date: '2026-06-21', time: '09:00', group: 'H', home: 'Spain'             , away: 'Saudi Arabia' },
    { match: 37, date: '2026-06-21', time: '15:00', group: 'H', home: 'Uruguay'           , away: 'Cape Verde' },
    // Jun 22
    { match: 42, date: '2026-06-22', time: '14:00', group: 'I', home: 'France'            , away: 'Iraq' },
    { match: 41, date: '2026-06-22', time: '17:00', group: 'I', home: 'Norway'            , away: 'Senegal' },
    { match: 43, date: '2026-06-22', time: '10:00', group: 'J', home: 'Argentina'         , away: 'Austria' },
    { match: 44, date: '2026-06-22', time: '20:00', group: 'J', home: 'Jordan'            , away: 'Algeria' },
    // Jun 23
    { match: 47, date: '2026-06-23', time: '10:00', group: 'K', home: 'Portugal'          , away: 'Uzbekistan' },
    { match: 48, date: '2026-06-23', time: '19:00', group: 'K', home: 'Colombia'          , away: 'DR Congo' },
    { match: 45, date: '2026-06-23', time: '13:00', group: 'L', home: 'England'           , away: 'Ghana' },
    { match: 46, date: '2026-06-23', time: '16:00', group: 'L', home: 'Panama'            , away: 'Croatia' },
    // Jun 24
    { match: 53, date: '2026-06-24', time: '18:00', group: 'A', home: 'Czechia'           , away: 'Mexico' },
    { match: 54, date: '2026-06-24', time: '18:00', group: 'A', home: 'South Africa'      , away: 'South Korea' },
    { match: 51, date: '2026-06-24', time: '12:00', group: 'B', home: 'Switzerland'       , away: 'Canada' },
    { match: 52, date: '2026-06-24', time: '12:00', group: 'B', home: 'Bosnia'            , away: 'Qatar' },
    { match: 49, date: '2026-06-24', time: '15:00', group: 'C', home: 'Scotland'          , away: 'Brazil' },
    { match: 50, date: '2026-06-24', time: '15:00', group: 'C', home: 'Morocco'           , away: 'Haiti' },
    // Jun 25
    { match: 59, date: '2026-06-25', time: '19:00', group: 'D', home: 'Turkiye'           , away: 'USA' },
    { match: 60, date: '2026-06-25', time: '19:00', group: 'D', home: 'Paraguay'          , away: 'Australia' },
    { match: 55, date: '2026-06-25', time: '13:00', group: 'E', home: 'Curacao'           , away: 'Ivory Coast' },
    { match: 56, date: '2026-06-25', time: '13:00', group: 'E', home: 'Ecuador'           , away: 'Germany' },
    { match: 57, date: '2026-06-25', time: '16:00', group: 'F', home: 'Japan'             , away: 'Sweden' },
    { match: 58, date: '2026-06-25', time: '16:00', group: 'F', home: 'Tunisia'           , away: 'Netherlands' },
    // Jun 26
    { match: 63, date: '2026-06-26', time: '20:00', group: 'G', home: 'Egypt'             , away: 'Iran' },
    { match: 64, date: '2026-06-26', time: '20:00', group: 'G', home: 'New Zealand'       , away: 'Belgium' },
    { match: 65, date: '2026-06-26', time: '17:00', group: 'H', home: 'Cape Verde'        , away: 'Saudi Arabia' },
    { match: 66, date: '2026-06-26', time: '17:00', group: 'H', home: 'Uruguay'           , away: 'Spain' },
    { match: 61, date: '2026-06-26', time: '12:00', group: 'I', home: 'Norway'            , away: 'France' },
    { match: 62, date: '2026-06-26', time: '12:00', group: 'I', home: 'Senegal'           , away: 'Iraq' },
    // Jun 27
    { match: 70, date: '2026-06-27', time: '19:00', group: 'J', home: 'Jordan'            , away: 'Argentina' },
    { match: 69, date: '2026-06-27', time: '19:00', group: 'J', home: 'Algeria'           , away: 'Austria' },
    { match: 71, date: '2026-06-27', time: '16:30', group: 'K', home: 'Colombia'          , away: 'Portugal' },
    { match: 72, date: '2026-06-27', time: '16:30', group: 'K', home: 'DR Congo'          , away: 'Uzbekistan' },
    { match: 67, date: '2026-06-27', time: '14:00', group: 'L', home: 'Panama'            , away: 'England' },
    { match: 68, date: '2026-06-27', time: '14:00', group: 'L', home: 'Croatia'           , away: 'Ghana' },
];

// ── 2026 World Cup Knockout Stage Schedule ───────────────────────────────────
// Seedings: 1X = Group X winner, 2X = Group X runner-up.
// July 4 R32 slots are for the best 8 third-place finishers (exact pairings TBD
// after the group stage). R16 and beyond are TBD until prior results are known.

const KNOCKOUT_SCHEDULE = [
    // ── Round of 32 ─── Jun 28 – Jul 3, 2026 (Pacific) ───────────────────────
    // Array order = bracket-vertical order so adjacency pairs (0+1, 2+3, …) feed
    // the matching R16 slot. Slot keys are NOT in chronological order; the FIFA
    // match # comments give the chronological mapping.
    { slotKey: 'r32-01', match: 74, date: '2026-06-29', time: '13:30', stage: 'R32', home: '1E', away: 'Best 3rd', awayCandidates: ['A', 'B', 'C', 'D', 'F'] },
    { slotKey: 'r32-02', match: 77, date: '2026-06-30', time: '14:00', stage: 'R32', home: '1I', away: 'Best 3rd', awayCandidates: ['C', 'D', 'F', 'G', 'H'] },
    { slotKey: 'r32-03', match: 73, date: '2026-06-28', time: '12:00', stage: 'R32', home: '2A', away: '2B' },
    { slotKey: 'r32-04', match: 75, date: '2026-06-29', time: '18:00', stage: 'R32', home: '1F', away: '2C' },
    { slotKey: 'r32-05', match: 83, date: '2026-07-02', time: '16:00', stage: 'R32', home: '2K', away: '2L' },
    { slotKey: 'r32-06', match: 84, date: '2026-07-02', time: '12:00', stage: 'R32', home: '1H', away: '2J' },
    { slotKey: 'r32-07', match: 81, date: '2026-07-01', time: '17:00', stage: 'R32', home: '1D', away: 'Best 3rd', awayCandidates: ['B', 'E', 'F', 'I', 'J'] },
    { slotKey: 'r32-08', match: 82, date: '2026-07-01', time: '13:00', stage: 'R32', home: '1G', away: 'Best 3rd', awayCandidates: ['A', 'E', 'H', 'I', 'J'] },
    { slotKey: 'r32-09', match: 76, date: '2026-06-29', time: '10:00', stage: 'R32', home: '1C', away: '2F' },
    { slotKey: 'r32-10', match: 78, date: '2026-06-30', time: '10:00', stage: 'R32', home: '2E', away: '2I' },
    { slotKey: 'r32-11', match: 79, date: '2026-06-30', time: '18:00', stage: 'R32', home: '1A', away: 'Best 3rd', awayCandidates: ['C', 'E', 'F', 'H', 'I'] },
    { slotKey: 'r32-12', match: 80, date: '2026-07-01', time: '09:00', stage: 'R32', home: '1L', away: 'Best 3rd', awayCandidates: ['E', 'H', 'I', 'J', 'K'] },
    { slotKey: 'r32-13', match: 86, date: '2026-07-03', time: '15:00', stage: 'R32', home: '1J', away: '2H' },
    { slotKey: 'r32-14', match: 88, date: '2026-07-03', time: '11:00', stage: 'R32', home: '2D', away: '2G' },
    { slotKey: 'r32-15', match: 85, date: '2026-07-02', time: '20:00', stage: 'R32', home: '1B', away: 'Best 3rd', awayCandidates: ['E', 'F', 'G', 'I', 'J'] },
    { slotKey: 'r32-16', match: 87, date: '2026-07-03', time: '18:30', stage: 'R32', home: '1K', away: 'Best 3rd', awayCandidates: ['D', 'E', 'I', 'J', 'L'] },
    // ── Round of 16 ─── Jul 4 – 7, 2026 ──────────────────────────────────────
    // Array order = bracket-vertical order, sequential pairing with R32.
    { slotKey: 'r16-01', match: 89, date: '2026-07-04', time: '14:00', stage: 'R16', home: 'W:r32-01', away: 'W:r32-02' },
    { slotKey: 'r16-02', match: 90, date: '2026-07-04', time: '10:00', stage: 'R16', home: 'W:r32-03', away: 'W:r32-04' },
    { slotKey: 'r16-03', match: 93, date: '2026-07-06', time: '12:00', stage: 'R16', home: 'W:r32-05', away: 'W:r32-06' },
    { slotKey: 'r16-04', match: 94, date: '2026-07-06', time: '17:00', stage: 'R16', home: 'W:r32-07', away: 'W:r32-08' },
    { slotKey: 'r16-05', match: 91, date: '2026-07-05', time: '13:00', stage: 'R16', home: 'W:r32-09', away: 'W:r32-10' },
    { slotKey: 'r16-06', match: 92, date: '2026-07-05', time: '17:00', stage: 'R16', home: 'W:r32-11', away: 'W:r32-12' },
    { slotKey: 'r16-07', match: 95, date: '2026-07-07', time: '09:00', stage: 'R16', home: 'W:r32-13', away: 'W:r32-14' },
    { slotKey: 'r16-08', match: 96, date: '2026-07-07', time: '13:00', stage: 'R16', home: 'W:r32-15', away: 'W:r32-16' },
    // ── Quarter-finals ─── Jul 9 – 11, 2026 ──────────────────────────────────
    // Sequential pairing — R16 is bracket-ordered so adjacency feeds correctly.
    { slotKey: 'qf-01', match: 97,  date: '2026-07-09', time: '13:00', stage: 'Quarters', home: 'W:r16-01', away: 'W:r16-02' },
    { slotKey: 'qf-02', match: 98,  date: '2026-07-10', time: '12:00', stage: 'Quarters', home: 'W:r16-03', away: 'W:r16-04' },
    { slotKey: 'qf-03', match: 99,  date: '2026-07-11', time: '14:00', stage: 'Quarters', home: 'W:r16-05', away: 'W:r16-06' },
    { slotKey: 'qf-04', match: 100, date: '2026-07-11', time: '18:00', stage: 'Quarters', home: 'W:r16-07', away: 'W:r16-08' },
    // ── Semi-finals ─── Jul 14 – 15, 2026 ────────────────────────────────────
    { slotKey: 'sf-01', match: 101, date: '2026-07-14', time: '12:00', stage: 'Semis', home: 'W:qf-01', away: 'W:qf-02' },
    { slotKey: 'sf-02', match: 102, date: '2026-07-15', time: '12:00', stage: 'Semis', home: 'W:qf-03', away: 'W:qf-04' },
    // ── Third-place play-off ─── Jul 18, 2026 ────────────────────────────────
    { slotKey: 'finals-01', match: 103, date: '2026-07-18', time: '14:00', stage: 'Finals', home: 'L:sf-01', away: 'L:sf-02' },
    // ── Grand Final ─── Jul 19, 2026 ─────────────────────────────────────────
    { slotKey: 'finals-02', match: 104, date: '2026-07-19', time: '12:00', stage: 'Finals', home: 'W:sf-01', away: 'W:sf-02' },
];

// Cache of already-logged matches for the schedule browser done/undone state
let _scheduleBrowserLoggedCache = [];
// Cache used by the public bracket tab (populated by fetchPublicResults)
let _publicMatchesCache = [];
// 'all' | 'A'–'L' | 'knockout-all' | 'R32' | 'R16' | 'Quarters' | 'Semis' | 'Finals'
let _scheduleBrowserActiveFilter = 'all';

function _scheduleTeam(name) {
    return teams.find((t) => t.name === name) || { name, flag: '🏳' };
}

function _formatScheduleDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00Z');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function _formatScheduleTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = String(timeStr).split(':').map(Number);
    if (Number.isNaN(h)) return '';
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return m ? `${h12}:${String(m).padStart(2, '0')} ${ampm}` : `${h12} ${ampm}`;
}

function _findGroupScheduleMatch(teamHome, teamAway, matchDate = '') {
    return GROUP_STAGE_SCHEDULE.find((match) =>
        (!matchDate || match.date === matchDate) &&
        ((match.home === teamHome && match.away === teamAway) ||
         (match.home === teamAway && match.away === teamHome))
    ) || null;
}

function _getMatchStageDisplayLabel(match) {
    if (!match || match.stage !== 'Group') return match?.stage || 'TBD';
    const groupLetter = match.group || _findGroupScheduleMatch(match.team_home, match.team_away, match.match_date_manual)?.group;
    return groupLetter ? `Group ${groupLetter}` : 'Group Stage';
}

function _isMatchLogged(m) {
    return _scheduleBrowserLoggedCache.some((r) =>
        r.stage === 'Group' &&
        ((r.team_home === m.home && r.team_away === m.away) ||
         (r.team_home === m.away && r.team_away === m.home))
    );
}

function _getLoggedResult(m) {
    return _scheduleBrowserLoggedCache.find((r) =>
        r.stage === 'Group' &&
        ((r.team_home === m.home && r.team_away === m.away) ||
         (r.team_home === m.away && r.team_away === m.home))
    );
}

function _hasLoggedKnockoutStage(cache, stage) {
    return (cache || []).some((match) => match.stage === stage);
}

function _getLatestLoggedScheduleMatch(cache = _scheduleBrowserLoggedCache) {
    const stageOrder = { Group: 0, R32: 1, R16: 2, Quarters: 3, Semis: 4, Finals: 5 };
    return [...(cache || [])]
        .sort((a, b) => {
            const dateCompare = String(b.match_date_manual || '').localeCompare(String(a.match_date_manual || ''));
            if (dateCompare !== 0) return dateCompare;
            const stageCompare = (stageOrder[b.stage] ?? -1) - (stageOrder[a.stage] ?? -1);
            if (stageCompare !== 0) return stageCompare;
            return (b.id || 0) - (a.id || 0);
        })[0] || null;
}

function _getDefaultScheduleFilter(cache = _scheduleBrowserLoggedCache) {
    const latestLogged = _getLatestLoggedScheduleMatch(cache);
    if (!latestLogged) return 'all';
    return latestLogged.stage === 'Group' ? 'all' : latestLogged.stage;
}

function _scrollScheduleToDate(date) {
    if (!date) return;
    const container = document.getElementById('page-admin');
    const target = document.querySelector(`#schedule-cards [data-schedule-date="${date}"]`);
    const stickyHeader = document.getElementById('admin-sticky-header');
    const stickyFilters = document.getElementById('schedule-group-filters');
    const headerOffset = (stickyHeader?.offsetHeight || 0) + (stickyFilters?.offsetHeight || 0) + 16;
    if (!container || !target) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const nextTop = container.scrollTop + (targetRect.top - containerRect.top) - headerOffset;
    container.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
}

function _scrollScheduleToTop() {
    const container = document.getElementById('page-admin');
    const target = document.getElementById('schedule-cards');
    const stickyHeader = document.getElementById('admin-sticky-header');
    const stickyFilters = document.getElementById('schedule-group-filters');
    const headerOffset = (stickyHeader?.offsetHeight || 0) + (stickyFilters?.offsetHeight || 0) + 12;
    if (!container || !target) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const nextTop = container.scrollTop + (targetRect.top - containerRect.top) - headerOffset;
    container.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
}

// Pins the schedule filter pills just below the sticky admin header so they
// also appear locked when scrolling through match cards.
function _syncScheduleFilterTop() {
    const header  = document.getElementById('admin-sticky-header');
    const filters = document.getElementById('schedule-group-filters');
    if (header && filters) filters.style.top = header.offsetHeight + 'px';
}

// Returns logged results for a knockout stage+date, sorted for display only.
// Knockout slot assignment must use real team pairs, not date/order position.
function _getKnockoutDayResults(stage, date, matchesCache = _scheduleBrowserLoggedCache) {
    return (matchesCache || [])
        .filter((r) => r.stage === stage && r.match_date_manual === date && _hasFinalScore(r))
        .sort((a, b) => {
            const dateCompare = String(a.match_date || '').localeCompare(String(b.match_date || ''));
            if (dateCompare !== 0) return dateCompare;
            return (a.id || 0) - (b.id || 0);
        });
}

function _getKnockoutScheduleMatchBySlot(slotKey) {
    return KNOCKOUT_SCHEDULE.find((match) => match.slotKey === slotKey) || null;
}

function _buildKnockoutResolutionContext(matchesCache = _scheduleBrowserLoggedCache) {
    const standings = computeGroupStandings(matchesCache || []);
    return {
        standings,
        bestThirdAssignments: _buildBestThirdAssignments(standings),
        matchesCache,
        memo: {}
    };
}

function _isSafeResolvedKnockoutTeam(res) {
    return !!(res && res.name && res.name !== 'TBD' && res.status !== 'none' && !res.fallback);
}

function _resolveKnockoutSlotTeams(scheduleMatch, standings, bestThirdAssignments, options = {}) {
    const {
        matchesCache = _scheduleBrowserLoggedCache,
        memo = {}
    } = options;
    const homeRes = _resolveKnockoutMatchTeam(scheduleMatch, 'home', standings, bestThirdAssignments, { matchesCache, memo });
    const awayRes = _resolveKnockoutMatchTeam(scheduleMatch, 'away', standings, bestThirdAssignments, { matchesCache, memo });
    const isSafe = _isSafeResolvedKnockoutTeam(homeRes) && _isSafeResolvedKnockoutTeam(awayRes);
    return {
        homeRes,
        awayRes,
        homeName: isSafe ? homeRes.name : '',
        awayName: isSafe ? awayRes.name : '',
        isSafe
    };
}

function _knockoutRowDate(row) {
    return row?.match_date_manual || row?.match_date || '';
}

function _knockoutTeamPairMatches(row, homeName, awayName) {
    return (
        (row.team_home === homeName && row.team_away === awayName) ||
        (row.team_home === awayName && row.team_away === homeName)
    );
}

function _findKnockoutSlotRow(scheduleMatch, rows, standings, bestThirdAssignments, options = {}) {
    if (!scheduleMatch || scheduleMatch.group || !scheduleMatch.stage) return null;
    const {
        matchesCache = _scheduleBrowserLoggedCache,
        memo = {},
        requireFinal = false,
        claimedIds = null
    } = options;
    const slotTeams = _resolveKnockoutSlotTeams(scheduleMatch, standings, bestThirdAssignments, { matchesCache, memo });
    if (!slotTeams.isSafe) return null;

    const candidates = (rows || []).filter((row) => {
        if (!row || row.stage !== scheduleMatch.stage) return false;
        if (claimedIds && row.id != null && claimedIds.has(row.id)) return false;
        if (requireFinal && !_hasFinalScore(row)) return false;
        return _knockoutTeamPairMatches(row, slotTeams.homeName, slotTeams.awayName);
    });

    if (!candidates.length) return null;
    const exactDate = candidates.filter((row) => _knockoutRowDate(row) === scheduleMatch.date);
    const safePool = exactDate.length ? exactDate : candidates;
    if (safePool.length !== 1) return null;

    const matched = safePool[0];
    if (claimedIds && matched.id != null) claimedIds.add(matched.id);
    return matched;
}

function _getKnockoutResultForSlot(slotKey, standings, bestThirdAssignments, options = {}) {
    const {
        matchesCache = _scheduleBrowserLoggedCache,
        memo = {}
    } = options;
    const memoKey = `result:${slotKey}`;
    if (Object.prototype.hasOwnProperty.call(memo, memoKey)) {
        return memo[memoKey];
    }

    const scheduleMatch = _getKnockoutScheduleMatchBySlot(slotKey);
    if (!scheduleMatch) {
        memo[memoKey] = null;
        return null;
    }

    const matched = _findKnockoutSlotRow(scheduleMatch, matchesCache, standings, bestThirdAssignments, {
        matchesCache,
        memo,
        requireFinal: true
    });
    memo[memoKey] = matched;
    return matched;
}

function _findKnockoutResultForMatch(scheduleMatch, standings, bestThirdAssignments, usedResultIds, options = {}) {
    return _findKnockoutSlotRow(scheduleMatch, options.matchesCache || _scheduleBrowserLoggedCache, standings, bestThirdAssignments, {
        matchesCache: options.matchesCache || _scheduleBrowserLoggedCache,
        memo: options.memo || {},
        requireFinal: true,
        claimedIds: usedResultIds
    });
}

// ── Group standings + knockout seeding resolution ─────────────────────────────

// Compute standings for every group from a match cache.
// status: 'none' = 0 matches played, 'partial' = some, 'complete' = all 6 played.
//
// Within-group ranking applies the FIFA 2026 tiebreakers in order:
//   1. Most overall points (entry condition)
//   2. H2H points (between tied teams only)
//   3. H2H goal difference
//   4. H2H goals scored
//   5. Re-apply 2-4 to any still-tied subset
//   6. Overall goal difference
//   7. Overall goals scored
//   8. (Fair play — UNVERIFIABLE: no card data on football-data.org TIER_ONE)
//   9. FIFA/Coca-Cola Men's World Ranking (lower number is better)
//  10. Name (deterministic last-resort)
// When step 9 (fifaRank) decides a tie, a tiebreaker warning is emitted by
// _detectTiebreakerWarnings so it surfaces in the Verify tab + CSV.
function _getFifaRank(teamName) {
    const r = TEAM_REPORT_DATA?.[teamName]?.fifaRank;
    return Number.isFinite(r) ? r : 999;
}
function computeGroupStandings(matchesCache) {
    if (matchesCache === undefined) matchesCache = _scheduleBrowserLoggedCache;
    const result = {};
    'ABCDEFGHIJKL'.split('').forEach((g) => {
        const sched = GROUP_STAGE_SCHEDULE.filter((m) => m.group === g);
        const names = [...new Set(sched.flatMap((m) => [m.home, m.away]))];
        const stats = {};
        names.forEach((n) => { stats[n] = { name: n, group: g, played: 0, w: 0, d: 0, l: 0, pts: 0, gf: 0, ga: 0, gd: 0 }; });
        let logged = 0;
        const groupMatches = [];
        sched.forEach((m) => {
            const r = matchesCache.find((r) =>
                r.stage === 'Group' &&
                ((r.team_home === m.home && r.team_away === m.away) ||
                 (r.team_home === m.away && r.team_away === m.home))
            );
            if (!r || !_hasFinalScore(r)) return;
            logged++;
            groupMatches.push(r);
            const h = stats[r.team_home];
            const a = stats[r.team_away];
            if (!h || !a) return;
            h.played++; a.played++;
            h.gf += r.score_home; h.ga += r.score_away; h.gd += r.score_home - r.score_away;
            a.gf += r.score_away; a.ga += r.score_home; a.gd += r.score_away - r.score_home;
            if (r.score_home > r.score_away)      { h.pts += 3; h.w++; a.l++; }
            else if (r.score_home < r.score_away) { a.pts += 3; a.w++; h.l++; }
            else                                  { h.pts += 1; a.pts += 1; h.d++; a.d++; }
        });
        const status = logged === 0 ? 'none' : logged < sched.length ? 'partial' : 'complete';
        const allTeams = Object.values(stats);
        let sorted;
        if (status === 'none') {
            sorted = allTeams.slice().sort((a, b) => {
                const teamA = teams.find((team) => team.name === a.name);
                const teamB = teams.find((team) => team.name === b.name);
                return (teamB?.cost || 0) - (teamA?.cost || 0) || a.name.localeCompare(b.name);
            });
        } else {
            sorted = _rankGroupTeams(allTeams, groupMatches);
        }
        result[g] = { teams: sorted, status };
    });
    return result;
}

// Phase 1 of within-group ranking: bucket by points, then resolve each
// bucket's tie chain via _rankTiedGroup.
function _rankGroupTeams(allTeams, groupMatches) {
    const byPoints = new Map();
    allTeams.forEach((t) => {
        if (!byPoints.has(t.pts)) byPoints.set(t.pts, []);
        byPoints.get(t.pts).push(t);
    });
    const sortedPointBuckets = [...byPoints.keys()].sort((a, b) => b - a);
    const ranked = [];
    for (const pts of sortedPointBuckets) {
        const bucket = byPoints.get(pts);
        if (bucket.length === 1) ranked.push(bucket[0]);
        else ranked.push(..._rankTiedGroup(bucket, groupMatches));
    }
    return ranked;
}

// FIFA tiebreaker steps 2-4 (H2H pts/gd/gf) with recursive narrowing for
// 3+ team ties. Falls through to overall gd/gf, then cost desc, then name.
function _rankTiedGroup(tied, groupMatches) {
    if (tied.length <= 1) return tied.slice();

    const tiedSet = new Set(tied.map((t) => t.name));
    const h2h = new Map();
    tied.forEach((t) => h2h.set(t.name, { pts: 0, gd: 0, gf: 0 }));
    groupMatches.forEach((m) => {
        if (!tiedSet.has(m.team_home) || !tiedSet.has(m.team_away)) return;
        const h = h2h.get(m.team_home);
        const a = h2h.get(m.team_away);
        h.gf += m.score_home; h.gd += m.score_home - m.score_away;
        a.gf += m.score_away; a.gd += m.score_away - m.score_home;
        if (m.score_home > m.score_away) h.pts += 3;
        else if (m.score_home < m.score_away) a.pts += 3;
        else { h.pts += 1; a.pts += 1; }
    });

    const sorted = tied.slice().sort((a, b) => {
        const ha = h2h.get(a.name);
        const hb = h2h.get(b.name);
        return (hb.pts - ha.pts) || (hb.gd - ha.gd) || (hb.gf - ha.gf);
    });

    const result = [];
    let i = 0;
    while (i < sorted.length) {
        let j = i + 1;
        while (j < sorted.length) {
            const ha = h2h.get(sorted[j - 1].name);
            const hb = h2h.get(sorted[j].name);
            if (ha.pts === hb.pts && ha.gd === hb.gd && ha.gf === hb.gf) j++;
            else break;
        }
        const subTied = sorted.slice(i, j);
        if (subTied.length === 1) {
            result.push(subTied[0]);
        } else if (subTied.length === tied.length) {
            // No H2H progress — fall through overall gd/gf → fifaRank → name.
            // Step 8 (fair play / cards) is skipped: no card data on TIER_ONE.
            result.push(...subTied.slice().sort((a, b) => {
                if (b.gd !== a.gd) return b.gd - a.gd;
                if (b.gf !== a.gf) return b.gf - a.gf;
                const rA = _getFifaRank(a.name);
                const rB = _getFifaRank(b.name);
                if (rA !== rB) return rA - rB;
                return a.name.localeCompare(b.name);
            }));
        } else {
            // Strict subset of original tie — recurse to re-narrow H2H scope.
            result.push(..._rankTiedGroup(subTied, groupMatches));
        }
        i = j;
    }
    return result;
}

// Cross-group comparator (used to rank 3rd-placed teams across groups, where
// H2H doesn't apply because the teams never met). Falls through to overall
// gd/gf → fifaRank → name. Fair-play (step 8 in the FIFA chain) is skipped:
// the football-data.org TIER_ONE feed has no card data.
function _compareStandingRows(a, b) {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    const rA = _getFifaRank(a.name);
    const rB = _getFifaRank(b.name);
    if (rA !== rB) return rA - rB;
    return a.name.localeCompare(b.name);
}

// Cross-group tie detector — true only if even fifaRank can't separate them
// (extremely rare). Used to flag ambiguous 3rd-place ranks for Annex C lookup.
function _isStandingTie(a, b) {
    if (!a || !b) return false;
    return _compareStandingRows(a, b) === 0;
}

// Detect ties resolved by step 9 (FIFA ranking) — meaning steps 1-7 of the
// tiebreaker chain all came up equal. Step 8 (fair-play / cards) is the gap
// we can't verify because the API feed has no card data, so every fifaRank-
// resolved tie is also a "fair-play unverifiable" tie.
//
// Two scopes:
//   - in-group: pts + H2H pts/gd/gf + overall gd/gf all tied for adjacent teams
//   - best-3rd cross-group: pts + overall gd/gf all tied (no H2H — never met)
//
// Returns array of warning records:
//   { scope, group?, teams, sharedStats, resolvedRanks }
function _detectTiebreakerWarnings(standings, allThirdsRanked, dbRows) {
    const warnings = [];
    const groupSched = (typeof GROUP_STAGE_SCHEDULE !== 'undefined' ? GROUP_STAGE_SCHEDULE : []);

    // 1. In-group ties resolved by fifaRank.
    Object.entries(standings || {}).forEach(([groupLetter, group]) => {
        if (!group?.teams || group.status !== 'complete') return;
        const sched = groupSched.filter((m) => m.group === groupLetter);
        const groupNames = new Set(sched.flatMap((m) => [m.home, m.away]));
        const groupMatches = (dbRows || []).filter((r) =>
            r.stage === 'Group' && _hasFinalScore(r) && groupNames.has(r.team_home) && groupNames.has(r.team_away)
        );

        // Walk each adjacent pair in the sorted order; if two teams share
        // identical pts + overall gd + overall gf AND identical H2H pts/gd/gf
        // against each other, then fifaRank decided them.
        const teams = group.teams;
        let i = 0;
        while (i < teams.length - 1) {
            const tied = [teams[i]];
            let j = i + 1;
            while (j < teams.length &&
                teams[j].pts === teams[i].pts &&
                teams[j].gd === teams[i].gd &&
                teams[j].gf === teams[i].gf) {
                // Compute H2H stats among the running tied set + this candidate
                const candidate = teams[j];
                const tiedNames = new Set([...tied.map((t) => t.name), candidate.name]);
                const h2h = {};
                tiedNames.forEach((n) => { h2h[n] = { pts: 0, gd: 0, gf: 0 }; });
                groupMatches.forEach((m) => {
                    if (!tiedNames.has(m.team_home) || !tiedNames.has(m.team_away)) return;
                    const h = h2h[m.team_home];
                    const a = h2h[m.team_away];
                    h.gf += m.score_home; h.gd += m.score_home - m.score_away;
                    a.gf += m.score_away; a.gd += m.score_away - m.score_home;
                    if (m.score_home > m.score_away) h.pts += 3;
                    else if (m.score_home < m.score_away) a.pts += 3;
                    else { h.pts += 1; a.pts += 1; }
                });
                const allH2hEqual = [...tiedNames].every((n) => {
                    const ref = h2h[[...tiedNames][0]];
                    return h2h[n].pts === ref.pts && h2h[n].gd === ref.gd && h2h[n].gf === ref.gf;
                });
                if (allH2hEqual) { tied.push(candidate); j++; }
                else break;
            }
            if (tied.length >= 2) {
                warnings.push({
                    scope: 'group',
                    group: groupLetter,
                    teams: tied.map((t) => ({
                        name: t.name,
                        pos: teams.indexOf(t) + 1,
                        fifaRank: _getFifaRank(t.name)
                    })),
                    sharedStats: { pts: tied[0].pts, gd: tied[0].gd, gf: tied[0].gf }
                });
                i = j;
            } else {
                i++;
            }
        }
    });

    // 2. Best-3rd cross-group ties resolved by fifaRank (no H2H step possible).
    if (Array.isArray(allThirdsRanked) && allThirdsRanked.length >= 2) {
        let i = 0;
        while (i < allThirdsRanked.length - 1) {
            const tied = [allThirdsRanked[i]];
            let j = i + 1;
            while (j < allThirdsRanked.length &&
                allThirdsRanked[j].pts === allThirdsRanked[i].pts &&
                allThirdsRanked[j].gd === allThirdsRanked[i].gd &&
                allThirdsRanked[j].gf === allThirdsRanked[i].gf) {
                tied.push(allThirdsRanked[j]);
                j++;
            }
            if (tied.length >= 2) {
                warnings.push({
                    scope: 'best-3rd',
                    teams: tied.map((t) => ({
                        name: t.name,
                        pos: allThirdsRanked.indexOf(t) + 1,
                        group: t.group,
                        fifaRank: _getFifaRank(t.name)
                    })),
                    sharedStats: { pts: tied[0].pts, gd: tied[0].gd, gf: tied[0].gf }
                });
                i = j;
            } else {
                i++;
            }
        }
    }

    return warnings;
}

function _hasClinchedGroupSlot(group, pos) {
    if (!group || !group.teams?.[pos]) return false;
    const targetTeam = group.teams[pos];
    const targetThreshold = targetTeam.pts;
    const contenders = group.teams.filter((team) => team.name !== targetTeam.name);
    const teamsThatCanStillReachOrPass = contenders.filter((team) => {
        const remainingMatches = Math.max(0, 3 - (team.played || 0));
        const maxPossiblePoints = team.pts + (remainingMatches * 3);
        return maxPossiblePoints >= targetThreshold;
    }).length;

    return teamsThatCanStillReachOrPass <= pos;
}

function _groupTeamsByCost(groupLetter) {
    return teams
        .filter((team) => team.group === groupLetter)
        .sort((a, b) => b.cost - a.cost || a.name.localeCompare(b.name));
}

function _hasClinchedTopTwoByPoints(group, teamName) {
    const team = group?.teams?.find((entry) => entry.name === teamName);
    if (!team) return false;
    const contenders = (group.teams || []).filter((entry) => entry.name !== teamName);
    const teamsThatCanStillReachOrPass = contenders.filter((entry) => {
        const remainingMatches = Math.max(0, 3 - (entry.played || 0));
        return entry.pts + (remainingMatches * 3) >= team.pts;
    }).length;
    return teamsThatCanStillReachOrPass <= 1;
}

function _hasClinchedBestThirdQualification(standings, teamName) {
    const allThirds = _getBestThirdPlaceTeams(standings);
    const targetTeam = allThirds.find((team) => team.name === teamName);
    if (!targetTeam || (targetTeam.played || 0) < 3) return false;

    const contenders = allThirds.filter((team) => team.name !== teamName);
    const teamsThatCanStillReachOrPass = contenders.filter((team) => {
        const remainingMatches = Math.max(0, 3 - (team.played || 0));
        return team.pts + (remainingMatches * 3) >= targetTeam.pts;
    }).length;

    return teamsThatCanStillReachOrPass <= 7;
}

function _fallbackTeamForGroupSlot(groupLetter, pos) {
    const rankedByCost = _groupTeamsByCost(groupLetter);
    return rankedByCost[pos] || rankedByCost[0] || null;
}

function _fallbackBestThirdTeams() {
    return 'ABCDEFGHIJKL'
        .split('')
        .map((groupLetter) => {
            const rankedByCost = _groupTeamsByCost(groupLetter);
            return rankedByCost[2] || rankedByCost[rankedByCost.length - 1] || null;
        })
        .filter(Boolean)
        .sort((a, b) => b.cost - a.cost || a.name.localeCompare(b.name));
}

function _fallbackResolvedTeam(label, fallbackTeam) {
    if (!fallbackTeam) return { name: 'TBD', flag: '', status: 'none', fallback: false };
    return { name: fallbackTeam.name, flag: fallbackTeam.flag, status: 'fallback', fallback: true };
}

// Returns sorted list of all 3rd-place finishers from groups that have started.
function _getBestThirdPlaceTeams(standings) {
    const thirds = [];
    Object.values(standings).forEach((g) => {
        if (g.status !== 'none' && g.teams.length >= 3) thirds.push(g.teams[2]);
    });
    return thirds.sort(_compareStandingRows);
}

function _getQualifiedBestThirdTeams(standings) {
    return _getBestThirdPlaceTeams(standings).slice(0, 8);
}

function _hasAmbiguousBestThirdRanking(allThirds, count) {
    const limit = Math.min(count, allThirds.length);
    for (let i = 0; i < limit; i++) {
        if (_isStandingTie(allThirds[i], allThirds[i - 1]) || _isStandingTie(allThirds[i], allThirds[i + 1])) {
            return true;
        }
    }
    return false;
}

function _getBestThirdSlots() {
    return KNOCKOUT_SCHEDULE
        .filter((match) => match.stage === 'R32')
        .flatMap((match) => {
            const slots = [];
            if (match.home === 'Best 3rd') {
                slots.push({ key: `${match.slotKey}:home`, side: 'home', allowedGroups: match.homeCandidates || [], match });
            }
            if (match.away === 'Best 3rd') {
                slots.push({ key: `${match.slotKey}:away`, side: 'away', allowedGroups: match.awayCandidates || [], match });
            }
            return slots;
        });
}

// Maps each group-winner seed (1X) to the R32 slot:side where its Best-3rd
// opponent sits. Must stay in sync with KNOCKOUT_SCHEDULE — the slot key
// here must match the R32 entry whose home === '1X' and away === 'Best 3rd'.
const THIRD_PLACE_WINNER_SLOT_MAP = {
    '1E': 'r32-01:away',
    '1I': 'r32-02:away',
    '1D': 'r32-07:away',
    '1G': 'r32-08:away',
    '1A': 'r32-11:away',
    '1L': 'r32-12:away',
    '1B': 'r32-15:away',
    '1K': 'r32-16:away'
};

function _buildQualifiedBestThirdKey(qualifiedThirds) {
    return qualifiedThirds
        .map((team) => team.group)
        .filter(Boolean)
        .sort()
        .join('');
}

function _getOfficialBestThirdMappingContext(standings) {
    const slots = _getBestThirdSlots();
    const allThirds = _getBestThirdPlaceTeams(standings);
    if (allThirds.length < slots.length) {
        return { allThirds, qualifiedThirds: [], qualifiedKey: '', mappingEntry: null, isResolvable: false };
    }

    const qualifiedThirds = allThirds.slice(0, slots.length);
    if (_hasAmbiguousBestThirdRanking(allThirds, slots.length)) {
        return { allThirds, qualifiedThirds, qualifiedKey: _buildQualifiedBestThirdKey(qualifiedThirds), mappingEntry: null, isResolvable: false };
    }

    const qualifiedKey = _buildQualifiedBestThirdKey(qualifiedThirds);
    const mappingEntry = THIRD_PLACE_MAPPING[qualifiedKey] || null;
    return {
        allThirds,
        qualifiedThirds,
        qualifiedKey,
        mappingEntry,
        isResolvable: Boolean(mappingEntry)
    };
}

function _isKnockoutFieldLocked(standings) {
    const groups = Object.values(standings || {});
    if (groups.length !== 12) return false;
    if (groups.some((group) => group.status !== 'complete')) return false;
    const mappingContext = _getOfficialBestThirdMappingContext(standings);
    return Boolean(mappingContext.isResolvable && mappingContext.mappingEntry);
}

function _buildBestThirdAssignments(standings) {
    const assignments = new Map();
    const slots = _getBestThirdSlots();
    const { qualifiedThirds, mappingEntry, isResolvable } = _getOfficialBestThirdMappingContext(standings);

    // Preferred path: official FIFA Annex C mapping
    if (isResolvable && mappingEntry) {
        const officialAssignments = mappingEntry.assignments || {};
        const teamByGroup = new Map(qualifiedThirds.map((team) => [team.group, team]));
        Object.entries(officialAssignments).forEach(([winnerSeed, thirdSeed]) => {
            const slotKey = THIRD_PLACE_WINNER_SLOT_MAP[winnerSeed];
            const groupLetter = thirdSeed?.[1];
            const team = teamByGroup.get(groupLetter);
            if (slotKey && team) assignments.set(slotKey, team);
        });
        if (assignments.size === slots.length) return assignments;
    }

    // Fallback path: uniqueness-safe greedy assignment when Annex C can't
    // resolve (e.g., ambiguous 3rd-place ranking after the full tiebreaker
    // chain — almost only happens in randomized simulations, never in real
    // tournaments where ties resolve via fair play / FIFA ranking).
    return _buildFallbackBestThirdAssignments(standings);
}

// Backtracking matcher: assigns top-8 third-placed teams to the 8 R32 "Best
// 3rd" slots respecting each slot's allowedGroups, with strict uniqueness.
// Returns a Map<slotKey:side, team> or empty Map if standings aren't ready.
function _buildFallbackBestThirdAssignments(standings) {
    const slots = _getBestThirdSlots();
    const allThirds = _getBestThirdPlaceTeams(standings);
    if (allThirds.length < slots.length) return new Map();
    const top8 = allThirds.slice(0, slots.length);

    const assignments = new Map();
    const used = new Set();

    function tryAssign(slotIdx) {
        if (slotIdx >= slots.length) return true;
        const slot = slots[slotIdx];
        for (const team of top8) {
            if (used.has(team.name)) continue;
            if (!slot.allowedGroups.includes(team.group)) continue;
            assignments.set(slot.key, team);
            used.add(team.name);
            if (tryAssign(slotIdx + 1)) return true;
            assignments.delete(slot.key);
            used.delete(team.name);
        }
        return false;
    }

    tryAssign(0);
    return assignments;
}

function _buildAdminVerifyGroupCards(standings, mappingContext) {
    const qualifiedThirdSet = new Set(mappingContext.qualifiedThirds.map((team) => team.name));
    return Object.entries(standings).map(([groupLetter, group]) => `
        <div class="rounded-2xl border border-gray-700 bg-gray-900/70 overflow-hidden">
            <div class="flex items-center justify-between border-b border-gray-700 bg-gray-950/80 px-4 py-3">
                <div class="text-sm font-black uppercase tracking-[0.2em] text-white">Group ${groupLetter}</div>
                <div class="text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">${group.status === 'complete' ? 'Complete' : group.status === 'partial' ? 'In Progress' : 'No Matches'}</div>
            </div>
            <div class="divide-y divide-gray-800">
                ${(() => {
                    const dividerIndex = group.teams.findIndex((team, index) => index >= 2 && !qualifiedThirdSet.has(team.name));
                    return group.teams.map((team, index) => {
                    const seedLabel = `${index + 1}${groupLetter}`;
                    const isAutoAdvance = index < 2;
                    const isBestThird = index === 2 && qualifiedThirdSet.has(team.name) && mappingContext.isResolvable;
                    const seedClass = isAutoAdvance || isBestThird ? 'text-emerald-300' : 'text-gray-500';
                    return `
                        <div class="flex items-center gap-3 px-4 py-2.5 text-sm ${(isAutoAdvance || isBestThird) ? 'bg-emerald-950/20' : ''} ${(dividerIndex > 0 && group.teams[dividerIndex - 1]?.name === team.name) ? 'border-b-2 border-emerald-300' : ''}">
                            <div class="w-8 shrink-0 text-[10px] font-black uppercase tracking-[0.18em] ${seedClass}">${seedLabel}</div>
                            <div class="min-w-0 flex-1 truncate font-black text-white">${_scheduleTeam(team.name).flag} ${team.name}</div>
                            <div class="shrink-0 text-[11px] font-black uppercase tracking-[0.18em] text-gray-300">${team.pts}</div>
                        </div>
                    `;
                }).join('');
                })()}
            </div>
        </div>
    `).join('');
}

async function fetchAdminKnockoutVerify() {
    const summaryEl = document.getElementById('admin-verify-summary');
    const advancedEl = document.getElementById('admin-verify-advanced');
    const thirdsEl = document.getElementById('admin-verify-thirds');
    const mappingEl = document.getElementById('admin-verify-mapping');
    if (!summaryEl || !advancedEl || !thirdsEl || !mappingEl) return;

    summaryEl.innerHTML = '<div class="md:col-span-3 rounded-2xl border border-gray-700 bg-gray-900/70 px-5 py-8 text-center text-xs font-black uppercase tracking-[0.25em] text-gray-400">Building verification view...</div>';
    advancedEl.innerHTML = '';
    thirdsEl.innerHTML = '';
    mappingEl.innerHTML = '';

    const { data: matches, error } = await supabaseClient
        .from('matches')
        .select('*');

    if (error) {
        summaryEl.innerHTML = `<div class="md:col-span-3 rounded-2xl border border-red-900/40 bg-red-950/30 px-5 py-8 text-center text-xs font-black uppercase tracking-[0.2em] text-red-300">${error.message || 'Unable to load verification data.'}</div>`;
        return;
    }

    const standings = computeGroupStandings(matches || []);
    const mappingContext = _getOfficialBestThirdMappingContext(standings);
    const bestThirdAssignments = _buildBestThirdAssignments(standings);
    const qualifiedThirdSet = new Set(mappingContext.qualifiedThirds.map((team) => team.name));

    summaryEl.innerHTML = `
        <div class="rounded-2xl border border-gray-700 bg-gray-900/70 px-5 py-4">
            <div class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Qualified 3rd Key</div>
            <div class="mt-2 text-2xl font-black uppercase text-white">${mappingContext.qualifiedKey || 'TBD'}</div>
        </div>
        <div class="rounded-2xl border border-gray-700 bg-gray-900/70 px-5 py-4">
            <div class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">CSV Row</div>
            <div class="mt-2 text-2xl font-black uppercase text-white">${mappingContext.mappingEntry?.rowNumber || 'TBD'}</div>
        </div>
        <div class="rounded-2xl border border-gray-700 bg-gray-900/70 px-5 py-4">
            <div class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Mapping Status</div>
            <div class="mt-2 text-sm font-black uppercase tracking-[0.2em] ${mappingContext.isResolvable ? 'text-emerald-300' : 'text-amber-300'}">${mappingContext.isResolvable ? 'Official Row Applied' : 'Waiting For Clear Top 8'}</div>
        </div>
    `;

    advancedEl.innerHTML = _buildAdminVerifyGroupCards(standings, mappingContext);

    thirdsEl.innerHTML = mappingContext.allThirds.map((team, index) => {
        const isQualified = qualifiedThirdSet.has(team.name) && mappingContext.isResolvable;
        const isProvisionalQualified = qualifiedThirdSet.has(team.name) && !mappingContext.isResolvable;
        return `
            <tr class="${isQualified ? 'bg-emerald-950/25' : ''}">
                <td class="px-4 py-3 text-gray-400">${index + 1}</td>
                <td class="px-4 py-3 ${isQualified ? 'text-emerald-300' : 'text-gray-400'}">3${team.group}</td>
                <td class="px-4 py-3 text-white">${_scheduleTeam(team.name).flag} ${team.name}</td>
                <td class="px-4 py-3 text-center text-gray-200">${team.pts}</td>
                <td class="px-4 py-3 text-center text-gray-200">${team.gd}</td>
                <td class="px-4 py-3 text-center text-gray-200">${team.gf}</td>
                <td class="px-4 py-3 text-center ${isQualified ? 'text-emerald-300' : isProvisionalQualified ? 'text-amber-300' : 'text-gray-500'}">${isQualified ? 'IN' : isProvisionalQualified ? 'LIVE' : 'OUT'}</td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="7" class="px-4 py-8 text-center text-xs font-black uppercase tracking-[0.2em] text-gray-500">No third-place data yet.</td></tr>';

    const mappingAssignments = mappingContext.mappingEntry?.assignments || {};
    const winnerSeedOrder = ['1A', '1B', '1D', '1E', '1G', '1I', '1K', '1L'];
    mappingEl.innerHTML = winnerSeedOrder.map((winnerSeed) => {
        const csvSeed = mappingAssignments[winnerSeed] || 'TBD';
        const slotKey = THIRD_PLACE_WINNER_SLOT_MAP[winnerSeed];
        const assignedTeam = bestThirdAssignments.get(slotKey);
        const winnerTeam = _resolveKnockoutTeam(winnerSeed, standings, [], 0);
        const slotLabel = slotKey ? slotKey.split(':')[0].toUpperCase() : 'TBD';
        return `
            <tr>
                <td class="px-4 py-3 text-blue-300">${winnerSeed}</td>
                <td class="px-4 py-3 text-white">${csvSeed}</td>
                <td class="px-4 py-3 text-gray-200">${assignedTeam ? `${_scheduleTeam(assignedTeam.name).flag} ${assignedTeam.name}` : 'TBD'}</td>
                <td class="px-4 py-3 text-gray-200">${winnerTeam?.name && assignedTeam ? `${winnerTeam.flag} ${winnerTeam.name}` : winnerTeam?.name ? `${winnerTeam.flag} ${winnerTeam.name}` : 'TBD'}</td>
                <td class="px-4 py-3 text-gray-400">${slotLabel}</td>
            </tr>
        `;
    }).join('');
}

// ── Tournament Audit ─────────────────────────────────────────────────────────
// Pure auditor: takes a `matches` cache (rows from Supabase), returns one
// canonical object the Verify Tournament tab renders + downloads.
function buildTournamentAudit(matchesCache) {
    const dbRows = Array.isArray(matchesCache) ? matchesCache : [];
    const standings = computeGroupStandings(dbRows);
    const mappingContext = _getOfficialBestThirdMappingContext(standings);
    const bestThirdAssignments = _buildBestThirdAssignments(standings);
    const memo = {};

    const todayPt = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' });
    const claimedDbIds = new Set();

    const findDbRow = (entry) => {
        const wantStage = entry.stage || (entry.group ? 'Group' : null);
        const candidates = dbRows.filter((row) => {
            if (claimedDbIds.has(row.id)) return false;
            if (wantStage && row.stage !== wantStage) return false;
            return true;
        });
        const sameDate = candidates.find((row) => row.match_date_manual === entry.date && (
            (row.team_home === entry.home && row.team_away === entry.away) ||
            (row.team_home === entry.away && row.team_away === entry.home)
        ));
        if (sameDate) return sameDate;
        return candidates.find((row) =>
            (row.team_home === entry.home && row.team_away === entry.away) ||
            (row.team_home === entry.away && row.team_away === entry.home)
        ) || null;
    };

    const findKnockoutDbRow = (entry, resolvedHome, resolvedAway) => {
        const candidates = dbRows.filter((row) => {
            if (claimedDbIds.has(row.id)) return false;
            return row.stage === entry.stage;
        });
        const homeName = resolvedHome?.name;
        const awayName = resolvedAway?.name;
        if (homeName && awayName) {
            const teamMatch = candidates.find((row) =>
                (row.team_home === homeName && row.team_away === awayName) ||
                (row.team_home === awayName && row.team_away === homeName)
            );
            if (teamMatch) return teamMatch;
        }
        return candidates.find((row) => row.match_date_manual === entry.date) || null;
    };

    // Section A: per-match audit rows for all 104 fixtures
    const matchRows = [];
    const groupEntries = (typeof GROUP_STAGE_SCHEDULE !== 'undefined' ? GROUP_STAGE_SCHEDULE : []).slice();
    const knockoutEntries = (typeof KNOCKOUT_SCHEDULE !== 'undefined' ? KNOCKOUT_SCHEDULE : []).slice();

    groupEntries.forEach((entry) => {
        const dbRow = findDbRow(entry);
        if (dbRow) claimedDbIds.add(dbRow.id);
        const issues = [];
        let schedulePass = true;
        if (dbRow) {
            const teamsMatch =
                (dbRow.team_home === entry.home && dbRow.team_away === entry.away) ||
                (dbRow.team_home === entry.away && dbRow.team_away === entry.home);
            const dateMatches = dbRow.match_date_manual === entry.date;
            if (!teamsMatch) { issues.push('mismatch_teams'); schedulePass = false; }
            if (!dateMatches) { issues.push('mismatch_date'); schedulePass = false; }
        } else if (entry.date < todayPt) {
            issues.push('missing_finished');
            schedulePass = false;
        }
        matchRows.push({
            matchNum: entry.match || null,
            stage: 'Group',
            group: entry.group || null,
            schedule: { date: entry.date, time: entry.time, home: entry.home, away: entry.away, slotKey: null },
            resolved: { home: { name: entry.home }, away: { name: entry.away } },
            db: dbRow,
            issues,
            schedulePass,
            bracketPass: null,
            isFuture: entry.date > todayPt
        });
    });

    knockoutEntries.forEach((entry) => {
        const resolvedHome = _resolveKnockoutMatchTeam(entry, 'home', standings, bestThirdAssignments, { matchesCache: dbRows, memo });
        const resolvedAway = _resolveKnockoutMatchTeam(entry, 'away', standings, bestThirdAssignments, { matchesCache: dbRows, memo });
        const dbRow = findKnockoutDbRow(entry, resolvedHome, resolvedAway);
        if (dbRow) claimedDbIds.add(dbRow.id);

        const issues = [];
        let schedulePass = true;
        let bracketPass = null;

        const hasResolved = resolvedHome?.status === 'confirmed' && resolvedAway?.status === 'confirmed';

        if (dbRow) {
            const teamsValid = !!(dbRow.team_home && dbRow.team_away);
            if (!teamsValid) {
                issues.push('mismatch_teams');
                schedulePass = false;
            }
            if (hasResolved) {
                const homeOk = dbRow.team_home === resolvedHome.name;
                const awayOk = dbRow.team_away === resolvedAway.name;
                if (!homeOk) issues.push('mismatch_home');
                if (!awayOk) issues.push('mismatch_away');
                bracketPass = homeOk && awayOk;
            } else {
                bracketPass = null; // provisional — can't fail until resolution is locked
            }
        } else if (entry.date < todayPt) {
            issues.push('missing_finished');
            schedulePass = false;
        }

        matchRows.push({
            matchNum: entry.match || null,
            stage: entry.stage,
            group: null,
            schedule: { date: entry.date, time: entry.time, home: entry.home, away: entry.away, slotKey: entry.slotKey },
            resolved: { home: resolvedHome, away: resolvedAway },
            db: dbRow,
            issues,
            schedulePass,
            bracketPass,
            isFuture: entry.date > todayPt
        });
    });

    matchRows.sort((a, b) => (a.matchNum || 0) - (b.matchNum || 0));

    // Orphan db rows (no schedule entry claimed them)
    const orphanRows = dbRows.filter((row) => !claimedDbIds.has(row.id));

    // Section B: per-group advancement audit
    const groupAudit = ['A','B','C','D','E','F','G','H','I','J','K','L'].map((groupLetter) => {
        const groupStandings = standings[groupLetter];
        const status = groupStandings?.status || 'none';
        const top1 = groupStandings?.teams?.[0]?.name || null;
        const top2 = groupStandings?.teams?.[1]?.name || null;

        // Pull actual R32 entrants for slots labelled 1X / 2X
        const slot1Entry = knockoutEntries.find((m) => m.stage === 'R32' && m.home === `1${groupLetter}`);
        const slot2Entry = knockoutEntries.find((m) =>
            m.stage === 'R32' && (m.home === `2${groupLetter}` || m.away === `2${groupLetter}`)
        );
        const findActualForLabel = (label) => {
            for (const m of knockoutEntries) {
                if (m.stage !== 'R32') continue;
                const isHome = m.home === label;
                const isAway = m.away === label;
                if (!isHome && !isAway) continue;
                const dbRow = matchRows.find((r) => r.schedule.slotKey === m.slotKey)?.db;
                if (dbRow) return isHome ? dbRow.team_home : dbRow.team_away;
            }
            return null;
        };
        const actualTop1 = findActualForLabel(`1${groupLetter}`);
        const actualTop2 = findActualForLabel(`2${groupLetter}`);

        let pass = null;
        if (status === 'none') pass = null; // not started
        else if (status === 'partial') pass = null; // in progress — provisional
        else {
            // Complete group — check top-2 match
            const top1Pass = !actualTop1 || actualTop1 === top1;
            const top2Pass = !actualTop2 || actualTop2 === top2;
            pass = top1Pass && top2Pass;
        }

        return {
            group: groupLetter,
            status,
            expectedTop1: top1,
            expectedTop2: top2,
            actualTop1,
            actualTop2,
            pass
        };
    });

    // Section C: best-3rd audit (mostly delegated to mappingContext + bestThirdAssignments)
    const bestThirdAudit = {
        qualifiedKey: mappingContext.qualifiedKey || null,
        mappingEntry: mappingContext.mappingEntry || null,
        isResolvable: mappingContext.isResolvable,
        rankings: mappingContext.allThirds || [],
        qualifiedSet: new Set((mappingContext.qualifiedThirds || []).map((t) => t.name)),
        assignments: bestThirdAssignments
    };

    // Section D: knockout bracket audit (32 entries, one per KO fixture)
    const bracketAudit = matchRows
        .filter((row) => row.stage !== 'Group')
        .map((row) => ({
            slotKey: row.schedule.slotKey,
            stage: row.stage,
            matchNum: row.matchNum,
            schedHome: row.schedule.home,
            schedAway: row.schedule.away,
            resolvedHome: row.resolved.home,
            resolvedAway: row.resolved.away,
            dbHome: row.db?.team_home || null,
            dbAway: row.db?.team_away || null,
            schedulePass: row.schedulePass,
            bracketPass: row.bracketPass,
            issues: row.issues
        }));

    // Duplicate detection per round (excluding Group)
    const duplicatesByRound = {};
    ['R32','R16','Quarters','Semis','Finals'].forEach((stage) => {
        const seen = new Map();
        const dupes = new Set();
        bracketAudit.filter((b) => b.stage === stage).forEach((b) => {
            [b.dbHome, b.dbAway].forEach((name) => {
                if (!name) return;
                if (seen.has(name)) dupes.add(name);
                else seen.set(name, true);
            });
        });
        duplicatesByRound[stage] = [...dupes];
    });

    // Independent structural checks (do NOT reuse computeGroupStandings,
    // _buildBestThirdAssignments, or _resolveKnockoutMatchTeam — pure
    // parallel implementation so a bug in those functions can't hide).
    const structural = _buildStructuralAudit(dbRows, standings, matchRows);

    // Tiebreaker warnings — ties resolved by fifaRank because the API has no
    // card data for FIFA's fair-play step. Surfaces in Verify tab + CSV.
    const tiebreakerWarnings = _detectTiebreakerWarnings(
        standings,
        bestThirdAudit.rankings,
        dbRows
    );

    // Summary counts
    const schedulePassCount = matchRows.filter((r) => r.schedulePass).length;
    const scheduleFailCount = matchRows.filter((r) => !r.schedulePass && !r.isFuture).length;
    const bracketPassCount = matchRows.filter((r) => r.bracketPass === true).length;
    const bracketFailCount = matchRows.filter((r) => r.bracketPass === false).length;
    const groupPassCount = groupAudit.filter((g) => g.pass === true).length;
    const groupFailCount = groupAudit.filter((g) => g.pass === false).length;
    const structuralFailCount = structural.standingsRecompute.mismatches.length
        + structural.r32GroupCheck.issues.length
        + structural.cascadeCheck.issues.length;
    // Tiebreaker warnings do NOT count as failures — they're advisory.
    const overallPass = scheduleFailCount === 0 && bracketFailCount === 0 && groupFailCount === 0
        && structuralFailCount === 0
        && Object.values(duplicatesByRound).every((arr) => arr.length === 0);

    return {
        standings,
        mappingContext,
        bestThirdAssignments,
        matchRows,
        orphanRows,
        groupAudit,
        bestThirdAudit,
        bracketAudit,
        duplicatesByRound,
        structural,
        tiebreakerWarnings,
        summary: {
            totalMatches: matchRows.length,
            dbMatchCount: dbRows.length,
            schedulePassCount,
            scheduleFailCount,
            bracketPassCount,
            bracketFailCount,
            groupPassCount,
            groupFailCount,
            structuralFailCount,
            tiebreakerWarningCount: tiebreakerWarnings.length,
            bestThirdResolved: !!mappingContext.isResolvable,
            overallPass
        }
    };
}

// Parallel-implementation auditor. Independent of computeGroupStandings,
// _buildBestThirdAssignments, _resolveKnockoutMatchTeam — anything those
// functions might silently agree with the simulator on, this catches.
function _buildStructuralAudit(dbRows, computedStandings, matchRows) {
    const groupSched = (typeof GROUP_STAGE_SCHEDULE !== 'undefined' ? GROUP_STAGE_SCHEDULE : []);
    const koSched = (typeof KNOCKOUT_SCHEDULE !== 'undefined' ? KNOCKOUT_SCHEDULE : []);
    const teamLookup = new Map((typeof teams !== 'undefined' ? teams : []).map((t) => [t.name, t]));

    // 1. Parallel standings recompute (raw stats only — no sort)
    const parallelStats = {};
    'ABCDEFGHIJKL'.split('').forEach((g) => {
        const sched = groupSched.filter((m) => m.group === g);
        const names = [...new Set(sched.flatMap((m) => [m.home, m.away]))];
        const stats = {};
        names.forEach((n) => { stats[n] = { name: n, group: g, pts: 0, gd: 0, gf: 0 }; });
        dbRows.filter((r) => r.stage === 'Group').forEach((r) => {
            if (!stats[r.team_home] || !stats[r.team_away]) return;
            stats[r.team_home].gf += r.score_home;
            stats[r.team_home].gd += r.score_home - r.score_away;
            stats[r.team_away].gf += r.score_away;
            stats[r.team_away].gd += r.score_away - r.score_home;
            if (r.score_home > r.score_away) stats[r.team_home].pts += 3;
            else if (r.score_home < r.score_away) stats[r.team_away].pts += 3;
            else { stats[r.team_home].pts += 1; stats[r.team_away].pts += 1; }
        });
        parallelStats[g] = stats;
    });

    const standingsMismatches = [];
    Object.entries(computedStandings).forEach(([g, group]) => {
        group.teams.forEach((t) => {
            const p = parallelStats[g]?.[t.name];
            if (!p) {
                standingsMismatches.push({ group: g, team: t.name, msg: 'team missing from parallel recompute' });
                return;
            }
            if (p.pts !== t.pts || p.gd !== t.gd || p.gf !== t.gf) {
                standingsMismatches.push({
                    group: g,
                    team: t.name,
                    msg: `pts ${p.pts}/${t.pts}, gd ${p.gd}/${t.gd}, gf ${p.gf}/${t.gf}`
                });
            }
        });
    });

    // 2. R32 group-letter sanity (independent of _resolveKnockoutMatchTeam)
    // Iterates over matchRows (already joined by team-pair in the main audit),
    // not by date — Jun 29/30/Jul 1-3 each have 3 R32 matches, so date-only
    // joining was misaligning slots. Team-pair joining is itself a structural
    // check on the schedule, so reusing it here doesn't compromise independence.
    const r32Issues = [];
    const r32Rows = (matchRows || []).filter((row) => row.stage === 'R32' && row.db);
    r32Rows.forEach((row) => {
        const entry = koSched.find((m) => m.slotKey === row.schedule.slotKey);
        if (!entry) return;
        const checkSide = (label, dbTeamName, side) => {
            if (!dbTeamName) return;
            const team = teamLookup.get(dbTeamName);
            if (!team) {
                r32Issues.push({ slot: entry.slotKey, side, msg: `unknown team "${dbTeamName}"` });
                return;
            }
            if (/^[12][A-L]$/.test(label)) {
                const expectedGroup = label[1];
                if (team.group !== expectedGroup) {
                    r32Issues.push({
                        slot: entry.slotKey,
                        side,
                        msg: `${dbTeamName} (group ${team.group}) doesn't match slot label ${label}`
                    });
                }
            } else if (label === 'Best 3rd') {
                const allowed = side === 'home' ? (entry.homeCandidates || []) : (entry.awayCandidates || []);
                if (allowed.length && !allowed.includes(team.group)) {
                    r32Issues.push({
                        slot: entry.slotKey,
                        side,
                        msg: `${dbTeamName} (group ${team.group}) not in allowedGroups [${allowed.join(',')}]`
                    });
                }
            }
        };
        // matchRows joins by team-pair in either order — the API may store
        // home/away swapped relative to schedule. Try both and keep the
        // alignment that produces fewer issues.
        const tryAlignment = (dbHome, dbAway) => {
            const beforeCount = r32Issues.length;
            checkSide(entry.home, dbHome, 'home');
            checkSide(entry.away, dbAway, 'away');
            return r32Issues.length - beforeCount;
        };
        const issuesA = tryAlignment(row.db.team_home, row.db.team_away);
        if (issuesA > 0) {
            const cutoff = r32Issues.length - issuesA;
            const issuesB = tryAlignment(row.db.team_away, row.db.team_home);
            if (issuesB < issuesA) r32Issues.splice(cutoff, issuesA);
            else r32Issues.splice(r32Issues.length - issuesB, issuesB);
        }
    });

    // 3. Cascade check: every team in stage X must have appeared in stage X-1
    const cascadeIssues = [];
    const stageOrder = ['Group', 'R32', 'R16', 'Quarters', 'Semis', 'Finals'];
    ['R16', 'Quarters', 'Semis', 'Finals'].forEach((stage) => {
        const earlierTeams = new Set();
        const earlierIdx = stageOrder.indexOf(stage);
        dbRows.forEach((r) => {
            if (stageOrder.indexOf(r.stage) < earlierIdx && stageOrder.indexOf(r.stage) >= 0) {
                if (r.team_home) earlierTeams.add(r.team_home);
                if (r.team_away) earlierTeams.add(r.team_away);
            }
        });
        dbRows.filter((r) => r.stage === stage).forEach((r) => {
            if (r.team_home && !earlierTeams.has(r.team_home)) {
                cascadeIssues.push({ stage, msg: `${r.team_home} appears in ${stage} but never played a prior round` });
            }
            if (r.team_away && !earlierTeams.has(r.team_away)) {
                cascadeIssues.push({ stage, msg: `${r.team_away} appears in ${stage} but never played a prior round` });
            }
        });
    });

    return {
        standingsRecompute: {
            ok: standingsMismatches.length === 0,
            mismatches: standingsMismatches
        },
        r32GroupCheck: {
            ok: r32Issues.length === 0,
            issues: r32Issues
        },
        cascadeCheck: {
            ok: cascadeIssues.length === 0,
            issues: cascadeIssues
        }
    };
}

let _verifyTournamentLastAudit = null;
let _verifyTournamentFilter = 'all'; // 'all' | 'failures'

async function fetchAdminVerifyTournament() {
    const summaryEl = document.getElementById('admin-vt-summary');
    const matchesEl = document.getElementById('admin-vt-section-matches');
    const groupsEl = document.getElementById('admin-vt-section-groups');
    const thirdsEl = document.getElementById('admin-vt-section-thirds');
    const tiebreakersEl = document.getElementById('admin-vt-section-tiebreakers');
    const bracketEl = document.getElementById('admin-vt-section-bracket');
    const structuralEl = document.getElementById('admin-vt-section-structural');
    if (!summaryEl || !matchesEl || !groupsEl || !thirdsEl || !bracketEl) return;

    summaryEl.innerHTML = '<div class="md:col-span-5 rounded-2xl border border-gray-700 bg-gray-900/70 px-5 py-8 text-center text-xs font-black uppercase tracking-[0.25em] text-gray-400">Auditing tournament…</div>';
    matchesEl.innerHTML = '';
    groupsEl.innerHTML = '';
    thirdsEl.innerHTML = '';
    if (tiebreakersEl) tiebreakersEl.innerHTML = '';
    bracketEl.innerHTML = '';
    if (structuralEl) structuralEl.innerHTML = '';

    const { data: matches, error } = await supabaseClient.from('matches').select('*');
    if (error) {
        summaryEl.innerHTML = `<div class="md:col-span-5 rounded-2xl border border-red-900/40 bg-red-950/30 px-5 py-8 text-center text-xs font-black uppercase tracking-[0.2em] text-red-300">${error.message || 'Unable to load audit data.'}</div>`;
        return;
    }

    const audit = buildTournamentAudit(matches || []);
    _verifyTournamentLastAudit = audit;

    summaryEl.innerHTML = _renderVerifyTournamentSummary(audit);
    matchesEl.innerHTML = _renderVerifyTournamentMatchTable(audit);
    groupsEl.innerHTML = _renderVerifyTournamentGroupAudit(audit);
    thirdsEl.innerHTML = _renderVerifyTournamentThirdsAudit(audit);
    if (tiebreakersEl) tiebreakersEl.innerHTML = _renderVerifyTournamentTiebreakers(audit);
    bracketEl.innerHTML = _renderVerifyTournamentBracketAudit(audit);
    if (structuralEl) structuralEl.innerHTML = _renderVerifyTournamentStructural(audit);
}

function _renderVerifyTournamentSummary(audit) {
    const { summary, duplicatesByRound } = audit;
    const dupCount = Object.values(duplicatesByRound).reduce((sum, arr) => sum + arr.length, 0);
    const totalIssues = summary.scheduleFailCount + summary.bracketFailCount + summary.groupFailCount + (summary.structuralFailCount || 0) + dupCount;
    const overallTone = summary.overallPass ? 'text-emerald-300' : (totalIssues > 0 ? 'text-red-300' : 'text-amber-300');
    const card = (title, value, tone) => `
        <div class="rounded-2xl border border-gray-700 bg-gray-900/70 px-5 py-4">
            <div class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">${title}</div>
            <div class="mt-2 text-xl font-black uppercase ${tone}">${value}</div>
        </div>`;
    const scheduleTone = summary.scheduleFailCount === 0 ? 'text-emerald-300' : 'text-red-300';
    const bracketTone = summary.bracketFailCount === 0 ? 'text-emerald-300' : 'text-red-300';
    const groupsTone = summary.groupFailCount === 0 ? 'text-emerald-300' : 'text-red-300';
    const thirdsTone = summary.bestThirdResolved ? 'text-emerald-300' : 'text-amber-300';
    const structTone = (summary.structuralFailCount || 0) === 0 ? 'text-emerald-300' : 'text-red-300';
    return `
        ${card('Schedule Pass', `${summary.schedulePassCount}/${summary.totalMatches}${summary.scheduleFailCount ? ` · ${summary.scheduleFailCount} fail` : ''}`, scheduleTone)}
        ${card('Bracket Pass', `${summary.bracketPassCount}/32${summary.bracketFailCount ? ` · ${summary.bracketFailCount} fail` : ''}`, bracketTone)}
        ${card('Groups Verified', `${summary.groupPassCount}/12${summary.groupFailCount ? ` · ${summary.groupFailCount} fail` : ''}`, groupsTone)}
        ${card('Best 3rd', summary.bestThirdResolved ? 'Resolved' : 'Pending', thirdsTone)}
        ${card('Structural', (summary.structuralFailCount || 0) === 0 ? 'Pass' : `${summary.structuralFailCount} fail`, structTone)}
        <div class="md:col-span-5 rounded-2xl border ${summary.overallPass ? 'border-emerald-700 bg-emerald-950/30' : 'border-gray-700 bg-gray-900/70'} px-5 py-4 flex items-center justify-between gap-3">
            <div>
                <div class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Overall</div>
                <div class="mt-1 text-sm font-black uppercase tracking-[0.2em] ${overallTone}">${summary.overallPass ? '✅ All checks passing' : `${totalIssues} issue(s) found`}</div>
            </div>
            <div class="flex gap-2">
                <button onclick="fetchAdminVerifyTournament()" class="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-[10px] font-black uppercase tracking-[0.2em] text-gray-200 hover:border-blue-500/60 hover:text-blue-300">Refresh</button>
                <button onclick="downloadTournamentVerifyCsv()" class="px-3 py-1.5 rounded-lg border border-emerald-500/50 bg-emerald-950/30 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200 hover:border-emerald-400">Download CSV</button>
            </div>
        </div>`;
}

// Yellow callout for ties resolved by FIFA ranking (because the API has no
// card data, fair-play is unverifiable). Hidden when there are zero warnings.
function _renderVerifyTournamentTiebreakers(audit) {
    const list = audit.tiebreakerWarnings || [];
    if (list.length === 0) {
        return `
            <div class="rounded-3xl border border-gray-800 bg-gray-950/40 px-5 py-3">
                <div class="flex items-center justify-between gap-2">
                    <div class="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Tiebreaker Resolution</div>
                    <div class="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">✓ No fifaRank-decided ties</div>
                </div>
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 mt-1">Every group + best-3rd ranking was decided by on-pitch stats (overall pts, H2H, gd/gf).</p>
            </div>`;
    }

    const renderItem = (w) => {
        const teamRows = w.teams.map((t) => {
            const posLabel = w.scope === 'group'
                ? `Pos ${t.pos}`
                : `Best 3rd #${t.pos}`;
            const groupLabel = t.group ? ` · Group ${t.group}` : '';
            return `
                <li class="flex items-baseline justify-between gap-3 text-[11px] font-bold text-amber-100">
                    <span>${escapeHtml(t.name)}${escapeHtml(groupLabel)}</span>
                    <span class="text-amber-300/80">FIFA #${t.fifaRank} · ${escapeHtml(posLabel)}</span>
                </li>`;
        }).join('');
        const scopeLabel = w.scope === 'group'
            ? `Group ${escapeHtml(w.group || '?')} — in-group tie`
            : 'Best 3rd cross-group tie';
        const stats = w.sharedStats;
        return `
            <div class="rounded-2xl border border-amber-700/50 bg-amber-950/20 px-4 py-3 space-y-2">
                <div class="flex items-center justify-between gap-2">
                    <div class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">${scopeLabel}</div>
                    <div class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">⚠ Resolved by FIFA ranking</div>
                </div>
                <div class="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/80">
                    Tied through: pts ${stats.pts} · gd ${stats.gd} · gf ${stats.gf}${w.scope === 'group' ? ' · all H2H stats equal' : ''}
                </div>
                <ul class="space-y-1">${teamRows}</ul>
            </div>`;
    };

    return `
        <div class="rounded-3xl border border-amber-700/50 bg-amber-950/20 px-5 py-4 space-y-3">
            <div>
                <h3 class="text-sm font-black uppercase tracking-[0.2em] text-amber-100">⚠ Tiebreaker Warnings (${list.length})</h3>
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/80">FIFA's fair-play step (yellow + red cards) is unverifiable — no card data on football-data.org TIER_ONE. Where a tie survived every on-pitch stat, FIFA world ranking decided it.</p>
            </div>
            ${list.map(renderItem).join('')}
        </div>`;
}

function _renderVerifyTournamentStructural(audit) {
    const s = audit.structural;
    if (!s) return '';
    const renderBlock = (title, ok, items, msgKey) => {
        const tone = ok ? 'border-emerald-700 bg-emerald-950/20' : 'border-red-700/50 bg-red-950/20';
        const headerTone = ok ? 'text-emerald-200' : 'text-red-200';
        const status = ok ? '✓ Pass' : `⚠ ${items.length} issue${items.length === 1 ? '' : 's'}`;
        const list = items.length === 0
            ? ''
            : `<ul class="space-y-1 text-[11px] font-bold text-gray-200 mt-2">
                  ${items.slice(0, 20).map((i) => `<li>· ${escapeHtml(i.group ? `Group ${i.group} · ${i.team || ''}` : (i.slot ? `${i.slot}${i.side ? `:${i.side}` : ''}` : i.stage || ''))}: ${escapeHtml(i[msgKey] || '')}</li>`).join('')}
                  ${items.length > 20 ? `<li class="text-gray-500">…and ${items.length - 20} more</li>` : ''}
               </ul>`;
        return `
            <div class="rounded-2xl border ${tone} px-4 py-3">
                <div class="flex items-center justify-between gap-2">
                    <div class="text-[10px] font-black uppercase tracking-[0.2em] ${headerTone}">${title}</div>
                    <div class="text-[10px] font-black uppercase tracking-[0.2em] ${ok ? 'text-emerald-300' : 'text-red-300'}">${status}</div>
                </div>
                ${list}
            </div>`;
    };

    return `
        <div class="rounded-3xl border border-gray-700 bg-gray-950/40 px-5 py-4 space-y-3">
            <div>
                <h3 class="text-sm font-black uppercase tracking-[0.2em] text-white">Pure Structural Checks</h3>
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Parallel implementation — does not reuse computeGroupStandings, _buildBestThirdAssignments, or _resolveKnockoutMatchTeam</p>
            </div>
            ${renderBlock('Standings recompute', s.standingsRecompute.ok, s.standingsRecompute.mismatches, 'msg')}
            ${renderBlock('R32 group-letter sanity', s.r32GroupCheck.ok, s.r32GroupCheck.issues, 'msg')}
            ${renderBlock('Cascade integrity (R16+ teams played a prior round)', s.cascadeCheck.ok, s.cascadeCheck.issues, 'msg')}
        </div>`;
}

function _vtIssueBadge(row) {
    if (row.isFuture && !row.db) return '<span class="text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">Upcoming</span>';
    if (!row.schedulePass && row.issues.includes('missing_finished')) return '<span class="text-[9px] font-black uppercase tracking-[0.18em] text-red-300">Missing</span>';
    if (!row.schedulePass) return `<span class="text-[9px] font-black uppercase tracking-[0.18em] text-red-300">Mismatch · ${row.issues.join(',')}</span>`;
    if (row.bracketPass === false) return `<span class="text-[9px] font-black uppercase tracking-[0.18em] text-red-300">Bracket fail · ${row.issues.join(',')}</span>`;
    if (row.bracketPass === null && row.stage !== 'Group' && row.db) return '<span class="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300">Provisional</span>';
    if (row.db) return '<span class="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">Pass</span>';
    return '<span class="text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">—</span>';
}

function _renderVerifyTournamentMatchTable(audit) {
    const filter = _verifyTournamentFilter;
    const visible = audit.matchRows.filter((row) => {
        if (filter === 'failures') return !row.schedulePass || row.bracketPass === false;
        return true;
    });
    const orphanRowsHtml = audit.orphanRows.length === 0 ? '' : `
        <div class="rounded-3xl border border-red-700/50 bg-red-950/20 overflow-hidden mt-4">
            <div class="border-b border-red-700/50 bg-red-900/40 px-5 py-3">
                <h3 class="text-sm font-black uppercase tracking-[0.2em] text-red-200">Unscheduled DB Rows · ${audit.orphanRows.length}</h3>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-[11px] font-bold text-gray-100">
                    <thead class="bg-red-950 text-red-200 uppercase text-[9px] tracking-[0.18em] font-black">
                        <tr><th class="px-3 py-2">Stage</th><th class="px-3 py-2">Date</th><th class="px-3 py-2">Home</th><th class="px-3 py-2">Away</th><th class="px-3 py-2">Score</th></tr>
                    </thead>
                    <tbody>
                        ${audit.orphanRows.map((r) => `<tr><td class="px-3 py-2">${escapeHtml(r.stage || '—')}</td><td class="px-3 py-2">${escapeHtml(r.match_date_manual || '—')}</td><td class="px-3 py-2">${escapeHtml(r.team_home || '—')}</td><td class="px-3 py-2">${escapeHtml(r.team_away || '—')}</td><td class="px-3 py-2">${r.score_home == null ? '—' : `${r.score_home}–${r.score_away}`}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;

    return `
        <div class="rounded-3xl border border-gray-700 overflow-hidden">
            <div class="border-b border-gray-700 bg-gray-900/80 px-5 py-4 flex items-center justify-between gap-3">
                <h3 class="text-sm font-black uppercase tracking-[0.2em] text-white">Match Schedule Audit · ${visible.length}/${audit.matchRows.length}</h3>
                <div class="flex gap-2">
                    <button onclick="setVerifyTournamentFilter('all')" class="px-3 py-1.5 rounded-lg border ${filter === 'all' ? 'border-blue-500 text-blue-300' : 'border-gray-700 text-gray-300'} bg-gray-800 text-[10px] font-black uppercase tracking-[0.2em] hover:border-blue-500/60">All</button>
                    <button onclick="setVerifyTournamentFilter('failures')" class="px-3 py-1.5 rounded-lg border ${filter === 'failures' ? 'border-red-500 text-red-300' : 'border-gray-700 text-gray-300'} bg-gray-800 text-[10px] font-black uppercase tracking-[0.2em] hover:border-red-500/60">Failures Only</button>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-[11px] font-bold text-gray-100">
                    <thead class="bg-gray-950 text-white uppercase text-[9px] tracking-[0.18em] font-black">
                        <tr>
                            <th class="px-3 py-2">G#</th>
                            <th class="px-3 py-2">Stage</th>
                            <th class="px-3 py-2">Date</th>
                            <th class="px-3 py-2">Sched Home</th>
                            <th class="px-3 py-2">Sched Away</th>
                            <th class="px-3 py-2">DB Home</th>
                            <th class="px-3 py-2">DB Away</th>
                            <th class="px-3 py-2 text-center">Score</th>
                            <th class="px-3 py-2">Status</th>
                        </tr>
                    </thead>
                    <tbody class="bg-gray-900">
                        ${visible.map((row) => {
                            const stageLbl = row.group ? `Group ${row.group}` : row.stage;
                            const dateLbl = row.schedule.date ? `${row.schedule.date} · ${row.schedule.time || ''}` : '';
                            const score = row.db && row.db.score_home != null ? `${row.db.score_home}–${row.db.score_away}${row.db.was_extra_time ? ' ET' : ''}` : '—';
                            const rowTone = !row.schedulePass && !row.isFuture ? 'bg-red-950/20'
                                : row.bracketPass === false ? 'bg-red-950/20'
                                : row.bracketPass === null && row.stage !== 'Group' && row.db ? 'bg-amber-950/20'
                                : row.db ? 'bg-emerald-950/10'
                                : '';
                            return `<tr class="${rowTone}">
                                <td class="px-3 py-2 text-amber-300">G${row.matchNum || '?'}</td>
                                <td class="px-3 py-2 text-gray-300">${escapeHtml(stageLbl)}</td>
                                <td class="px-3 py-2 text-gray-300">${escapeHtml(dateLbl)}</td>
                                <td class="px-3 py-2 text-gray-200">${escapeHtml(row.schedule.home || '—')}</td>
                                <td class="px-3 py-2 text-gray-200">${escapeHtml(row.schedule.away || '—')}</td>
                                <td class="px-3 py-2 text-white">${escapeHtml(row.db?.team_home || '—')}</td>
                                <td class="px-3 py-2 text-white">${escapeHtml(row.db?.team_away || '—')}</td>
                                <td class="px-3 py-2 text-center text-gray-200">${score}</td>
                                <td class="px-3 py-2">${_vtIssueBadge(row)}</td>
                            </tr>`;
                        }).join('') || '<tr><td colspan="9" class="px-3 py-6 text-center text-xs font-black uppercase tracking-[0.2em] text-gray-500">No rows match this filter.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
        ${orphanRowsHtml}`;
}

function _renderVerifyTournamentGroupAudit(audit) {
    const cards = _buildAdminVerifyGroupCards(audit.standings, audit.mappingContext);
    const tableRows = audit.groupAudit.map((g) => {
        const tone = g.pass === true ? 'bg-emerald-950/20' : g.pass === false ? 'bg-red-950/20' : '';
        const statusLabel = g.pass === true ? '<span class="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">Pass</span>'
            : g.pass === false ? '<span class="text-[9px] font-black uppercase tracking-[0.18em] text-red-300">Fail</span>'
            : g.status === 'none' ? '<span class="text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">Not started</span>'
            : '<span class="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300">In progress</span>';
        return `<tr class="${tone}">
            <td class="px-3 py-2 text-blue-300">${g.group}</td>
            <td class="px-3 py-2 text-gray-200">${escapeHtml(g.expectedTop1 || '—')}</td>
            <td class="px-3 py-2 text-gray-200">${escapeHtml(g.expectedTop2 || '—')}</td>
            <td class="px-3 py-2 text-white">${escapeHtml(g.actualTop1 || '—')}</td>
            <td class="px-3 py-2 text-white">${escapeHtml(g.actualTop2 || '—')}</td>
            <td class="px-3 py-2">${statusLabel}</td>
        </tr>`;
    }).join('');
    return `
        <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">${cards}</div>
            <div class="rounded-3xl border border-gray-700 overflow-hidden">
                <div class="border-b border-gray-700 bg-gray-900/80 px-5 py-3">
                    <h3 class="text-sm font-black uppercase tracking-[0.2em] text-white">Top-2 Advancement Audit</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-[11px] font-bold text-gray-100">
                        <thead class="bg-gray-950 text-white uppercase text-[9px] tracking-[0.18em] font-black">
                            <tr><th class="px-3 py-2">Grp</th><th class="px-3 py-2">Expected #1</th><th class="px-3 py-2">Expected #2</th><th class="px-3 py-2">R32 #1</th><th class="px-3 py-2">R32 #2</th><th class="px-3 py-2">Status</th></tr>
                        </thead>
                        <tbody class="bg-gray-900">${tableRows}</tbody>
                    </table>
                </div>
            </div>
        </div>`;
}

function _renderVerifyTournamentThirdsAudit(audit) {
    const { mappingContext, bestThirdAssignments } = audit;
    const qualifiedSet = audit.bestThirdAudit.qualifiedSet;
    const thirdsHtml = (mappingContext.allThirds || []).map((team, index) => {
        const isQualified = qualifiedSet.has(team.name) && mappingContext.isResolvable;
        const isProvisional = qualifiedSet.has(team.name) && !mappingContext.isResolvable;
        return `<tr class="${isQualified ? 'bg-emerald-950/25' : ''}">
            <td class="px-3 py-2 text-gray-400">${index + 1}</td>
            <td class="px-3 py-2 ${isQualified ? 'text-emerald-300' : 'text-gray-400'}">3${team.group}</td>
            <td class="px-3 py-2 text-white">${escapeHtml(team.name)}</td>
            <td class="px-3 py-2 text-center text-gray-200">${team.pts}</td>
            <td class="px-3 py-2 text-center text-gray-200">${team.gd}</td>
            <td class="px-3 py-2 text-center text-gray-200">${team.gf}</td>
            <td class="px-3 py-2 text-center ${isQualified ? 'text-emerald-300' : isProvisional ? 'text-amber-300' : 'text-gray-500'}">${isQualified ? 'IN' : isProvisional ? 'LIVE' : 'OUT'}</td>
        </tr>`;
    }).join('') || '<tr><td colspan="7" class="px-3 py-6 text-center text-xs font-black uppercase tracking-[0.2em] text-gray-500">No third-place data yet.</td></tr>';

    const winnerSeedOrder = ['1A','1B','1D','1E','1G','1I','1K','1L'];
    const mappingAssignments = mappingContext.mappingEntry?.assignments || {};
    const mappingHtml = winnerSeedOrder.map((winnerSeed) => {
        const csvSeed = mappingAssignments[winnerSeed] || 'TBD';
        const slotKey = (typeof THIRD_PLACE_WINNER_SLOT_MAP !== 'undefined') ? THIRD_PLACE_WINNER_SLOT_MAP[winnerSeed] : null;
        const assignedTeam = slotKey ? bestThirdAssignments.get(slotKey) : null;
        const winnerTeam = _resolveKnockoutTeam(winnerSeed, audit.standings, [], 0);
        const slotLabel = slotKey ? slotKey.split(':')[0].toUpperCase() : 'TBD';
        return `<tr>
            <td class="px-3 py-2 text-blue-300">${winnerSeed}</td>
            <td class="px-3 py-2 text-white">${csvSeed}</td>
            <td class="px-3 py-2 text-gray-200">${assignedTeam ? escapeHtml(assignedTeam.name) : 'TBD'}</td>
            <td class="px-3 py-2 text-gray-200">${winnerTeam?.name ? escapeHtml(winnerTeam.name) : 'TBD'}</td>
            <td class="px-3 py-2 text-gray-400">${slotLabel}</td>
        </tr>`;
    }).join('');

    return `
        <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="rounded-2xl border border-gray-700 bg-gray-900/70 px-5 py-4">
                    <div class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Qualified 3rd Key</div>
                    <div class="mt-2 text-2xl font-black uppercase text-white">${escapeHtml(mappingContext.qualifiedKey || 'TBD')}</div>
                </div>
                <div class="rounded-2xl border border-gray-700 bg-gray-900/70 px-5 py-4">
                    <div class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">CSV Row</div>
                    <div class="mt-2 text-2xl font-black uppercase text-white">${mappingContext.mappingEntry?.rowNumber || 'TBD'}</div>
                </div>
                <div class="rounded-2xl border border-gray-700 bg-gray-900/70 px-5 py-4">
                    <div class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Mapping Status</div>
                    <div class="mt-2 text-sm font-black uppercase tracking-[0.2em] ${mappingContext.isResolvable ? 'text-emerald-300' : 'text-amber-300'}">${mappingContext.isResolvable ? 'Official Row Applied' : 'Waiting For Clear Top 8'}</div>
                </div>
            </div>
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div class="rounded-3xl border border-gray-700 overflow-hidden">
                    <div class="border-b border-gray-700 bg-gray-900/80 px-5 py-3"><h3 class="text-sm font-black uppercase tracking-[0.2em] text-white">Third-Place Ranking</h3></div>
                    <div class="overflow-x-auto"><table class="w-full text-left text-[11px] font-bold text-gray-100"><thead class="bg-gray-950 text-white uppercase text-[9px] tracking-[0.18em] font-black"><tr><th class="px-3 py-2">Pos</th><th class="px-3 py-2">Seed</th><th class="px-3 py-2">Team</th><th class="px-3 py-2 text-center">Pts</th><th class="px-3 py-2 text-center">GD</th><th class="px-3 py-2 text-center">GF</th><th class="px-3 py-2 text-center">Status</th></tr></thead><tbody class="bg-gray-900">${thirdsHtml}</tbody></table></div>
                </div>
                <div class="rounded-3xl border border-gray-700 overflow-hidden">
                    <div class="border-b border-gray-700 bg-gray-900/80 px-5 py-3"><h3 class="text-sm font-black uppercase tracking-[0.2em] text-white">FIFA Annex C Mapping</h3></div>
                    <div class="overflow-x-auto"><table class="w-full text-left text-[11px] font-bold text-gray-100"><thead class="bg-gray-950 text-white uppercase text-[9px] tracking-[0.18em] font-black"><tr><th class="px-3 py-2">Winner Seed</th><th class="px-3 py-2">CSV Seed</th><th class="px-3 py-2">Assigned Team</th><th class="px-3 py-2">Plays Against</th><th class="px-3 py-2">R32 Slot</th></tr></thead><tbody class="bg-gray-900">${mappingHtml}</tbody></table></div>
                </div>
            </div>
        </div>`;
}

function _renderVerifyTournamentBracketAudit(audit) {
    const stages = ['R32','R16','Quarters','Semis','Finals'];
    const dupes = audit.duplicatesByRound;
    const dupeHtml = stages.flatMap((stage) => dupes[stage] || []).length === 0
        ? '<div class="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">✓ No duplicate teams within any round</div>'
        : `<div class="text-[10px] font-black uppercase tracking-[0.18em] text-red-300">⚠ Duplicates: ${stages.filter((s) => (dupes[s] || []).length).map((s) => `${s}: ${dupes[s].join(', ')}`).join(' · ')}</div>`;

    const sectionForStage = (stage) => {
        const rows = audit.bracketAudit.filter((b) => b.stage === stage);
        if (rows.length === 0) return '';
        const trs = rows.map((b) => {
            const tone = b.bracketPass === false ? 'bg-red-950/20'
                : b.bracketPass === null && b.dbHome ? 'bg-amber-950/20'
                : b.dbHome ? 'bg-emerald-950/10' : '';
            const statusLabel = b.bracketPass === true ? '<span class="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">Pass</span>'
                : b.bracketPass === false ? `<span class="text-[9px] font-black uppercase tracking-[0.18em] text-red-300">Fail · ${b.issues.join(',')}</span>`
                : b.dbHome ? '<span class="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300">Provisional</span>'
                : '<span class="text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">—</span>';
            return `<tr class="${tone}">
                <td class="px-3 py-2 text-gray-400">${escapeHtml(b.slotKey || '')}</td>
                <td class="px-3 py-2 text-amber-300">G${b.matchNum || '?'}</td>
                <td class="px-3 py-2 text-gray-300">${escapeHtml(b.schedHome || '')}</td>
                <td class="px-3 py-2 text-blue-300">${escapeHtml(b.resolvedHome?.name || 'TBD')}</td>
                <td class="px-3 py-2 text-white">${escapeHtml(b.dbHome || '—')}</td>
                <td class="px-3 py-2 text-gray-300">${escapeHtml(b.schedAway || '')}</td>
                <td class="px-3 py-2 text-blue-300">${escapeHtml(b.resolvedAway?.name || 'TBD')}</td>
                <td class="px-3 py-2 text-white">${escapeHtml(b.dbAway || '—')}</td>
                <td class="px-3 py-2">${statusLabel}</td>
            </tr>`;
        }).join('');
        return `
            <div class="rounded-3xl border border-gray-700 overflow-hidden">
                <div class="border-b border-gray-700 bg-gray-900/80 px-5 py-3"><h3 class="text-sm font-black uppercase tracking-[0.2em] text-white">${stage}</h3></div>
                <div class="overflow-x-auto"><table class="w-full text-left text-[11px] font-bold text-gray-100"><thead class="bg-gray-950 text-white uppercase text-[9px] tracking-[0.18em] font-black"><tr><th class="px-3 py-2">Slot</th><th class="px-3 py-2">G#</th><th class="px-3 py-2">Sched H</th><th class="px-3 py-2">Resolved H</th><th class="px-3 py-2">DB H</th><th class="px-3 py-2">Sched A</th><th class="px-3 py-2">Resolved A</th><th class="px-3 py-2">DB A</th><th class="px-3 py-2">Status</th></tr></thead><tbody class="bg-gray-900">${trs}</tbody></table></div>
            </div>`;
    };

    return `
        <div class="space-y-4">
            <div class="rounded-2xl border border-gray-700 bg-gray-900/40 px-4 py-3">${dupeHtml}</div>
            ${stages.map(sectionForStage).join('')}
        </div>`;
}

function setVerifyTournamentFilter(filter) {
    _verifyTournamentFilter = filter;
    if (_verifyTournamentLastAudit) {
        const matchesEl = document.getElementById('admin-vt-section-matches');
        if (matchesEl) matchesEl.innerHTML = _renderVerifyTournamentMatchTable(_verifyTournamentLastAudit);
    }
}

function downloadTournamentVerifyCsv() {
    const audit = _verifyTournamentLastAudit;
    if (!audit) {
        if (typeof showToast === 'function') showToast('Run audit first.');
        return;
    }

    const rows = [];
    const blank = () => rows.push([]);
    const sectionHeader = (label) => {
        blank();
        rows.push([`=== ${label} ===`]);
    };

    // ── Section 1: per-match audit ──────────────────────────────────────────
    rows.push(['=== TOURNAMENT MATCHES ===']);
    rows.push(['match_num','stage','group','date_pt','time_pt','schedule_home','schedule_away','db_home','db_away','score_home','score_away','was_extra_time','is_finished','manual_override','auto_synced_at','schedule_pass','bracket_pass','issues']);
    audit.matchRows.forEach((row) => {
        const db = row.db || {};
        rows.push([
            row.matchNum || '',
            row.stage || '',
            row.group || '',
            row.schedule.date || '',
            row.schedule.time || '',
            row.schedule.home || '',
            row.schedule.away || '',
            db.team_home || '',
            db.team_away || '',
            db.score_home == null ? '' : db.score_home,
            db.score_away == null ? '' : db.score_away,
            db.was_extra_time == null ? '' : (db.was_extra_time ? 'true' : 'false'),
            db.is_finished == null ? '' : (db.is_finished ? 'true' : 'false'),
            db.manual_override == null ? '' : (db.manual_override ? 'true' : 'false'),
            db.auto_synced_at || '',
            row.schedulePass ? 'Y' : 'N',
            row.bracketPass === null ? 'N/A' : (row.bracketPass ? 'Y' : 'N'),
            row.issues.join(';')
        ]);
    });

    // ── Section 2: group standings ──────────────────────────────────────────
    sectionHeader('GROUP STANDINGS');
    rows.push(['group','rank','team','status','played','w','d','l','pts','gf','ga','gd','fifa_rank']);
    Object.entries(audit.standings || {}).forEach(([groupLetter, group]) => {
        (group.teams || []).forEach((t, idx) => {
            rows.push([
                groupLetter,
                idx + 1,
                t.name || '',
                group.status || '',
                t.played ?? '',
                t.w ?? '',
                t.d ?? '',
                t.l ?? '',
                t.pts ?? '',
                t.gf ?? '',
                t.ga ?? '',
                t.gd ?? '',
                _getFifaRank(t.name)
            ]);
        });
    });

    // ── Section 3: top-3rd ranking (12 third-placed teams across groups) ────
    sectionHeader('TOP 3 (BEST 3RD RANKING)');
    rows.push(['rank','seed','team','group','pts','gd','gf','fifa_rank','status']);
    const qualifiedSet = audit.bestThirdAudit.qualifiedSet;
    const isResolvable = audit.bestThirdAudit.isResolvable;
    (audit.bestThirdAudit.rankings || []).forEach((team, idx) => {
        const isIn = qualifiedSet.has(team.name) && isResolvable;
        const isLive = qualifiedSet.has(team.name) && !isResolvable;
        rows.push([
            idx + 1,
            `3${team.group || ''}`,
            team.name || '',
            team.group || '',
            team.pts ?? '',
            team.gd ?? '',
            team.gf ?? '',
            _getFifaRank(team.name),
            isIn ? 'IN' : isLive ? 'LIVE' : 'OUT'
        ]);
    });

    // ── Section 4: FIFA Annex C selection (the 1-of-196 row used) ───────────
    sectionHeader('FIFA ANNEX C MAPPING');
    rows.push(['qualified_3rd_key','csv_row_number','status']);
    rows.push([
        audit.bestThirdAudit.qualifiedKey || 'TBD',
        audit.bestThirdAudit.mappingEntry?.rowNumber || 'TBD',
        audit.bestThirdAudit.isResolvable ? 'Official Row Applied' : 'Waiting For Clear Top 8'
    ]);
    blank();
    rows.push(['winner_seed','csv_seed','assigned_team','assigned_group','r32_slot']);
    const winnerSeedOrder = ['1A','1B','1D','1E','1G','1I','1K','1L'];
    const officialMap = audit.bestThirdAudit.mappingEntry?.assignments || {};
    const slotByWinner = (typeof THIRD_PLACE_WINNER_SLOT_MAP !== 'undefined') ? THIRD_PLACE_WINNER_SLOT_MAP : {};
    winnerSeedOrder.forEach((winnerSeed) => {
        const csvSeed = officialMap[winnerSeed] || 'TBD';
        const slotKey = slotByWinner[winnerSeed] || '';
        const assigned = slotKey ? audit.bestThirdAssignments.get(slotKey) : null;
        rows.push([
            winnerSeed,
            csvSeed,
            assigned?.name || 'TBD',
            assigned?.group || '',
            slotKey ? slotKey.split(':')[0] : ''
        ]);
    });

    // ── Section 5: knockout seeding (all 32 R32 entrants) ──────────────────
    sectionHeader('KNOCKOUT SEEDING');
    rows.push(['seed','team','group','fifa_rank','route']);
    'ABCDEFGHIJKL'.split('').forEach((g) => {
        const groupTeams = audit.standings?.[g]?.teams || [];
        const winner = groupTeams[0];
        const runner = groupTeams[1];
        rows.push([`1${g}`, winner?.name || 'TBD', g, winner ? _getFifaRank(winner.name) : '', `Group ${g} winner`]);
        rows.push([`2${g}`, runner?.name || 'TBD', g, runner ? _getFifaRank(runner.name) : '', `Group ${g} runner-up`]);
    });
    // 8 best-3rd entrants (using Annex C / fallback assignments)
    const koSched = (typeof KNOCKOUT_SCHEDULE !== 'undefined' ? KNOCKOUT_SCHEDULE : []);
    const best3rdSlots = koSched.filter((m) => m.stage === 'R32' && m.away === 'Best 3rd');
    best3rdSlots.forEach((entry) => {
        const slotKey = `${entry.slotKey}:away`;
        const assigned = audit.bestThirdAssignments.get(slotKey);
        rows.push([
            assigned ? `3${assigned.group}` : 'TBD',
            assigned?.name || 'TBD',
            assigned?.group || '',
            assigned ? _getFifaRank(assigned.name) : '',
            `Best 3rd -> ${entry.slotKey} (vs ${entry.home})`
        ]);
    });

    // ── Section 6: bracket flow (every KO match: winner/loser/next-slot) ────
    sectionHeader('BRACKET FLOW');
    rows.push(['match_num','stage','slot','winner','loser','was_et','advances_to']);
    const koRows = audit.matchRows.filter((r) => r.stage !== 'Group');
    // Build a reverse-lookup: slotKey → which slotKey references its winner/loser
    const advancesToBySlot = {};
    koSched.forEach((s) => {
        const refSide = (label, side) => {
            if (!label) return;
            const m = label.match(/^([WL]):(.+)$/);
            if (!m) return;
            const refKey = m[2];
            const wOrL = m[1] === 'W' ? 'winner' : 'loser';
            if (!advancesToBySlot[refKey]) advancesToBySlot[refKey] = [];
            advancesToBySlot[refKey].push(`${s.slotKey} ${side} (${wOrL})`);
        };
        refSide(s.home, 'home');
        refSide(s.away, 'away');
    });
    const advancesLabel = (slotKey) => {
        if (slotKey === 'finals-02') return 'World Cup Champion';
        if (slotKey === 'finals-01') return '3rd place';
        const refs = advancesToBySlot[slotKey] || [];
        return refs.length ? refs.join(' & ') : '—';
    };
    koRows.forEach((row) => {
        const db = row.db;
        if (!db || db.score_home == null || db.score_away == null) {
            rows.push([row.matchNum || '', row.stage, row.schedule.slotKey || '', 'TBD', 'TBD', '', advancesLabel(row.schedule.slotKey)]);
            return;
        }
        const winner = _winnerFromMatchRow(db);
        const loser = _loserFromMatchRow(db);
        rows.push([
            row.matchNum || '',
            row.stage,
            row.schedule.slotKey || '',
            winner,
            loser,
            db.was_extra_time ? 'Yes' : 'No',
            advancesLabel(row.schedule.slotKey)
        ]);
    });

    // ── Section 7: final standings (gold/silver/bronze/4th) ─────────────────
    sectionHeader('FINAL STANDINGS');
    rows.push(['position','team','result']);
    const finalRow = audit.matchRows.find((r) => r.schedule.slotKey === 'finals-02')?.db;
    const bronzeRow = audit.matchRows.find((r) => r.schedule.slotKey === 'finals-01')?.db;
    const goldChamp = finalRow && finalRow.score_home != null ? _winnerFromMatchRow(finalRow) : 'TBD';
    const silverRunner = finalRow && finalRow.score_home != null ? _loserFromMatchRow(finalRow) : 'TBD';
    const bronzeWinner = bronzeRow && bronzeRow.score_home != null ? _winnerFromMatchRow(bronzeRow) : 'TBD';
    const fourth = bronzeRow && bronzeRow.score_home != null ? _loserFromMatchRow(bronzeRow) : 'TBD';
    rows.push([1, goldChamp, 'World Cup Champion']);
    rows.push([2, silverRunner, 'Runner-up (lost final)']);
    rows.push([3, bronzeWinner, 'Bronze (won 3rd-place play-off)']);
    rows.push([4, fourth, '4th (lost 3rd-place play-off)']);

    // ── Section 8: tiebreaker warnings (ties resolved by FIFA ranking) ──────
    // FIFA's fair-play tiebreaker (yellow + red cards, step 8) is unverifiable
    // because football-data.org TIER_ONE has no card data. Where every on-pitch
    // step came up tied, FIFA world ranking decided the order.
    sectionHeader('TIEBREAKER WARNINGS');
    const warnings = audit.tiebreakerWarnings || [];
    if (warnings.length === 0) {
        rows.push(['count', 0]);
        rows.push(['note', 'No fifaRank-decided ties — every group + best-3rd ranking was decided by on-pitch stats.']);
    } else {
        rows.push(['count', warnings.length]);
        rows.push(['note', 'Fair-play (cards) step is UNVERIFIABLE on this data feed; FIFA ranking applied as next available step.']);
        blank();
        rows.push(['scope','group','position','team','team_group','fifa_rank','tied_pts','tied_gd','tied_gf']);
        warnings.forEach((w) => {
            w.teams.forEach((t) => {
                rows.push([
                    w.scope,
                    w.group || '',
                    t.pos,
                    t.name,
                    t.group || w.group || '',
                    t.fifaRank,
                    w.sharedStats.pts,
                    w.sharedStats.gd,
                    w.sharedStats.gf
                ]);
            });
        });
    }

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    downloadCsv(`wc-pool-tournament-verify-${ts}.csv`, rows);
}

function _fallbackBestThirdTeamForGroups(allowedGroups, standings) {
    const liveThird = _getBestThirdPlaceTeams(standings).find((team) => allowedGroups.includes(team.group));
    if (liveThird) {
        const liveTeam = teams.find((team) => team.name === liveThird.name);
        return liveTeam || null;
    }
    return _fallbackBestThirdTeams().find((team) => allowedGroups.includes(team.group)) || null;
}

function _bestThirdSeedLabel(teamName) {
    const teamData = teams.find((team) => team.name === teamName);
    return teamData?.group ? `3${teamData.group}` : '3?';
}

function _seedDisplayLabel(res, rawLabel) {
    if (rawLabel?.startsWith('W:') || rawLabel?.startsWith('L:')) return '';
    if (res?.seedLabel) return res.seedLabel;
    if (rawLabel === 'Best 3rd') return '3?';
    return rawLabel;
}

function _resolveKnockoutMatchTeam(match, side, standings, bestThirdAssignments, options = {}) {
    const {
        matchesCache = _scheduleBrowserLoggedCache,
        memo = {}
    } = options;
    const label = match[side];
    if (label?.startsWith('W:') || label?.startsWith('L:')) {
        const outcome = label[0];
        const sourceSlot = label.slice(2);
        const sourceResult = _getKnockoutResultForSlot(sourceSlot, standings, bestThirdAssignments, { matchesCache, memo });
        if (!sourceResult) {
            return { name: 'TBD', flag: '', status: 'none', fallback: false, qualified: false, seedLabel: '' };
        }
        const teamName = outcome === 'L'
            ? _loserFromMatchRow(sourceResult)
            : _winnerFromMatchRow(sourceResult);
        return {
            name: teamName,
            flag: _scheduleTeam(teamName).flag,
            seedLabel: '',
            status: 'confirmed',
            qualified: true,
            fallback: false
        };
    }
    if (label !== 'Best 3rd') {
        return _resolveKnockoutTeam(label, standings, [], 0);
    }

    const assignmentKey = `${match.slotKey}:${side}`;
    const assignedTeam = bestThirdAssignments.get(assignmentKey);
    const allowedGroups = side === 'home' ? (match.homeCandidates || []) : (match.awayCandidates || []);
    if (!assignedTeam) {
        const fallbackTeam = _fallbackBestThirdTeamForGroups(allowedGroups, standings);
        const fallbackResolved = _fallbackResolvedTeam(label, fallbackTeam);
        return {
            ...fallbackResolved,
            seedLabel: fallbackTeam ? _bestThirdSeedLabel(fallbackTeam.name) : '3',
            qualified: fallbackTeam ? _hasClinchedBestThirdQualification(standings, fallbackTeam.name) : false
        };
    }

    const td = _scheduleTeam(assignedTeam.name);
    const completedGroups = Object.values(standings).filter((group) => group.status === 'complete').length;
        return {
            name: assignedTeam.name,
            flag: td.flag,
            seedLabel: _bestThirdSeedLabel(assignedTeam.name),
            status: completedGroups >= 12 ? 'confirmed' : 'provisional',
            qualified: true,
            fallback: false
        };
}

// Resolve a seeding label like '1A', '2B', 'Best 3rd', 'TBD' to { name, flag, status }.
// status: 'none' = unresolved  'fallback' = cost-based placeholder  'provisional' = in progress  'confirmed' = group complete
function _resolveKnockoutTeam(label, standings, best3rdList, best3rdSlot) {
    if (label === 'TBD') return { name: 'TBD', flag: '🏳', status: 'none', fallback: false };
    if (label === 'Best 3rd') {
        const fallbackTeam = _fallbackBestThirdTeams()[best3rdSlot || 0] || _fallbackBestThirdTeams()[0] || null;
        const t = best3rdList[best3rdSlot || 0];
        if (!t) {
            const fallbackResolved = _fallbackResolvedTeam(label, fallbackTeam);
            return { ...fallbackResolved, seedLabel: fallbackTeam ? _bestThirdSeedLabel(fallbackTeam.name) : '3?', qualified: fallbackTeam ? _hasClinchedBestThirdQualification(standings, fallbackTeam.name) : false };
        }
        const prev = best3rdList[(best3rdSlot || 0) - 1];
        const next = best3rdList[(best3rdSlot || 0) + 1];
        if (_isStandingTie(t, prev) || _isStandingTie(t, next)) {
            const fallbackResolved = _fallbackResolvedTeam(label, fallbackTeam);
            return { ...fallbackResolved, seedLabel: fallbackTeam ? _bestThirdSeedLabel(fallbackTeam.name) : '3?', qualified: fallbackTeam ? _hasClinchedBestThirdQualification(standings, fallbackTeam.name) : false };
        }
        const td = _scheduleTeam(t.name);
        const completedGroups = Object.values(standings).filter((g) => g.status === 'complete').length;
        return { name: t.name, flag: td.flag, seedLabel: _bestThirdSeedLabel(t.name), status: completedGroups >= 12 ? 'confirmed' : 'provisional', qualified: true, fallback: false };
    }
    // '1A' → group A winner, '2B' → group B runner-up, etc.
    const pos = parseInt(label[0], 10) - 1;
    const grp  = label[1];
    const group = standings[grp];
    const fallbackTeam = _fallbackTeamForGroupSlot(grp, pos);
    if (!group || group.status === 'none') return { ..._fallbackResolvedTeam(label, fallbackTeam), seedLabel: label };
    const t = group.teams[pos];
    if (!t) return { ..._fallbackResolvedTeam(label, fallbackTeam), seedLabel: label };
    const prev = group.teams[pos - 1];
    const next = group.teams[pos + 1];
    if (_isStandingTie(t, prev) || _isStandingTie(t, next)) {
        return { ..._fallbackResolvedTeam(label, fallbackTeam), seedLabel: label };
    }
    const td = _scheduleTeam(t.name);
    return {
        name: t.name,
        flag: td.flag,
        seedLabel: label,
        status: group.status === 'complete' || _hasClinchedGroupSlot(group, pos) ? 'confirmed' : 'provisional',
        qualified: _hasClinchedTopTwoByPoints(group, t.name),
        fallback: false
    };
}

function renderScheduleBrowser() {
    const filterEl = document.getElementById('schedule-group-filters');
    const cardsEl  = document.getElementById('schedule-cards');
    if (!filterEl || !cardsEl) return;

    const f          = _scheduleBrowserActiveFilter;
    const currentFilter = _getDefaultScheduleFilter(_scheduleBrowserLoggedCache);
    const allGroups  = ['A','B','C','D','E','F','G','H','I','J','K','L'];
    const koStages   = ['R32', 'R16', 'Quarters', 'Semis', 'Finals'];
    const koLabels   = { R32: 'R32', R16: 'R16', Quarters: 'QF', Semis: 'Semi', Finals: 'Final' };
    const isKnockout = koStages.includes(f) || f === 'knockout-all';

    const active   = 'border-blue-400/40 bg-white text-gray-950 shadow-lg shadow-blue-500/10';
    const inactive = 'border-transparent bg-transparent text-gray-400 hover:border-gray-700 hover:bg-gray-800/80 hover:text-white';
    const current  = 'border-gray-600 text-gray-100';
    const tabClasses = (filter, wide = false) => {
        const stateClass = f === filter ? active : inactive;
        const currentClass = currentFilter === filter && f !== filter ? current : '';
        const widthClass = wide ? 'min-w-[84px]' : 'min-w-[42px]';
        return `shrink-0 ${widthClass} rounded-xl border px-3 py-2 text-center text-[9px] font-black uppercase tracking-[0.18em] transition-all duration-200 ${stateClass} ${currentClass}`;
    };

    // ── Counts for pill labels ────────────────────────────────────────────────
    const groupDone = GROUP_STAGE_SCHEDULE.filter(_isMatchLogged).length;
    const koDone    = _scheduleBrowserLoggedCache.filter((r) => r.stage !== 'Group').length;

    // ── Filter strip ──────────────────────────────────────────────────────────
    filterEl.innerHTML = `
        <div class="overflow-x-auto no-scrollbar">
            <div class="flex min-w-full items-center gap-2 rounded-3xl border border-gray-800 bg-gray-950/70 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                <div class="flex flex-1 items-center justify-between gap-1.5">
                    <button onclick="setScheduleFilter('all')"
                        class="${tabClasses('all', true)}">
                        Groups <span class="opacity-60">${groupDone}/${GROUP_STAGE_SCHEDULE.length}</span>
                    </button>
                    ${allGroups.map((g) => `
                        <button onclick="setScheduleFilter('${g}')"
                            class="${tabClasses(g)}">
                            ${g}
                        </button>
                    `).join('')}
                </div>
                <span class="mx-1 h-7 w-px shrink-0 bg-gray-800"></span>
                <div class="flex flex-1 items-center justify-between gap-1.5">
                    <button onclick="setScheduleFilter('knockout-all')"
                        class="${tabClasses('knockout-all', true)}">
                        KO <span class="opacity-60">${koDone}/${KNOCKOUT_SCHEDULE.length}</span>
                    </button>
                    ${koStages.map((s) => `
                        <button onclick="setScheduleFilter('${s}')"
                            class="${tabClasses(s)}">
                            ${koLabels[s]}
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    // ── Which matches to display ──────────────────────────────────────────────
    let filtered;
    if (isKnockout) {
        filtered = f === 'knockout-all' ? KNOCKOUT_SCHEDULE
            : KNOCKOUT_SCHEDULE.filter((m) => m.stage === f);
    } else {
        filtered = f === 'all' ? GROUP_STAGE_SCHEDULE
            : GROUP_STAGE_SCHEDULE.filter((m) => m.group === f);
    }

    // ── Group matches by date ─────────────────────────────────────────────────
    const byDate = {};
    filtered.forEach((m) => {
        if (!byDate[m.date]) byDate[m.date] = [];
        byDate[m.date].push(m);
    });

    if (!Object.keys(byDate).length) {
        cardsEl.innerHTML = '<div class="text-center py-8 text-gray-600 text-[10px] font-black uppercase tracking-[0.2em]">No matches</div>';
        return;
    }

    // Pre-compute standings so knockout cards can show resolved team names
    const _standings  = computeGroupStandings();
    const _best3rdAssignments = _buildBestThirdAssignments(_standings);
    const _knockoutMemo = {};
    const useSeedStatusColours = !_isKnockoutFieldLocked(_standings);

    cardsEl.innerHTML = Object.entries(byDate).map(([date, matches]) => {
        let cards;

        if (isKnockout) {
            const usedResultIds = new Set();

            cards = matches.map((m) => {
                const result = _findKnockoutResultForMatch(m, _standings, _best3rdAssignments, usedResultIds, { memo: _knockoutMemo });
                const isLogged = !!result;

                if (isLogged) {
                    const homeTeam = _scheduleTeam(result.team_home);
                    const awayTeam = _scheduleTeam(result.team_away);
                    const timeChip = m.time ? `<span class="hidden sm:inline-block shrink-0 mr-3 text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 w-16">${_formatScheduleTime(m.time)} PT</span>` : '';
                    return `
                        <div class="w-full rounded-2xl border border-gray-800 bg-gray-900/50 px-4 py-3">
                            <div class="flex items-center justify-between">
                                ${timeChip}
                                <div class="flex items-center gap-2 min-w-0 flex-1">
                                    <span class="text-xl shrink-0">${homeTeam.flag}</span>
                                    <span class="font-black text-sm text-white truncate">${result.team_home}</span>
                                </div>
                                <div class="flex items-center shrink-0">
                                    <span class="font-black text-white text-lg mx-2">${result.score_home} – ${result.score_away}</span>
                                </div>
                                <div class="flex items-center gap-2 min-w-0 flex-1 justify-end">
                                    <span class="font-black text-sm text-white truncate">${result.team_away}</span>
                                    <span class="text-xl shrink-0">${awayTeam.flag}</span>
                                </div>
                                <div class="ml-3 shrink-0">
                                    <button onclick="editScheduleMatch('','','${m.stage}','${m.date}',${result.id})"
                                        class="px-2 py-1 rounded-lg border border-gray-600 bg-gray-800 text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 hover:border-yellow-500/60 hover:text-yellow-400 transition-colors">
                                        Edit
                                    </button>
                                </div>
                            </div>
                        </div>`;
                }

                // Unlogged knockout card — resolve seedings from group standings
                const homeRes = _resolveKnockoutMatchTeam(m, 'home', _standings, _best3rdAssignments);
                const awayRes = _resolveKnockoutMatchTeam(m, 'away', _standings, _best3rdAssignments);

                const _seedLabel = (res, raw) => {
                    const displaySeed = _seedDisplayLabel(res, raw);
                    const nameTone = res.status === 'confirmed'
                        ? 'text-white'
                        : res.qualified
                            ? 'text-gray-300'
                            : 'text-gray-400';
                    const seedTone = res.status === 'confirmed'
                        ? 'text-gray-500'
                        : res.qualified
                            ? 'text-gray-500'
                            : 'text-gray-600';
                    if (res.status === 'none')
                        return `<span class="inline-flex items-center gap-1.5 min-w-0 font-black text-sm uppercase tracking-[0.14em] text-gray-500">
                                    <span class="truncate">TBD</span>
                                </span>`;
                    if (res.status === 'fallback')
                        return `<span class="inline-flex items-center gap-1.5 min-w-0 font-black text-sm">
                                    <span class="text-base leading-none shrink-0">${res.flag}</span>
                                    <span class="${nameTone} truncate">${res.name}</span>
                                    <span class="shrink-0 text-[10px] font-black ${seedTone}">(${displaySeed})</span>
                                </span>`;
                    if (res.status === 'provisional')
                        return `<span class="inline-flex items-center gap-1.5 min-w-0 font-black text-sm">
                                    <span class="text-base leading-none shrink-0">${res.flag}</span>
                                    <span class="${nameTone} truncate">${res.name}</span>
                                    <span class="shrink-0 text-[10px] font-black ${seedTone}">(${displaySeed})</span>
                                </span>`;
                    return `<span class="inline-flex items-center gap-1.5 min-w-0 font-black text-sm text-white">
                                <span class="text-base leading-none shrink-0">${res.flag}</span>
                                <span class="truncate">${res.name}</span>
                                <span class="shrink-0 text-[10px] font-black text-gray-500">(${displaySeed})</span>
                            </span>`;
                };
                const enterHomeName = (homeRes && homeRes.status !== 'none' ? homeRes.name : '').replace(/'/g,"\\'");
                const enterAwayName = (awayRes && awayRes.status !== 'none' ? awayRes.name : '').replace(/'/g,"\\'");

                const koTimeChip = m.time ? `<span class="hidden sm:inline-block shrink-0 mr-3 text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 w-16">${_formatScheduleTime(m.time)} PT</span>` : '';
                return `
                    <button onclick="prefillFromSchedule('${enterHomeName}','${enterAwayName}','${m.stage}','${m.date}')"
                        class="w-full text-left rounded-2xl border border-gray-700 bg-gray-800 hover:border-blue-500/50 hover:bg-gray-700 active:scale-[0.99] px-4 py-3 transition-all">
                        <div class="flex items-center justify-between">
                            ${koTimeChip}
                            <div class="flex items-center gap-2 min-w-0 flex-1">
                                ${_seedLabel(homeRes, m.home)}
                            </div>
                            <div class="flex items-center shrink-0">
                                <span class="text-gray-600 font-black text-sm mx-2">vs</span>
                            </div>
                            <div class="flex items-center gap-2 min-w-0 flex-1 justify-end">
                                ${_seedLabel(awayRes, m.away)}
                                <span class="text-[9px] font-black uppercase tracking-[0.15em] text-blue-400 ml-1">Enter</span>
                            </div>
                        </div>
                    </button>`;
            }).join('');

            // Count how many slots on this date are filled
            const stageOnDay = matches[0]?.stage;
            const dayDone    = Math.min(
                _scheduleBrowserLoggedCache.filter((r) => r.stage === stageOnDay && r.match_date_manual === date).length,
                matches.length
            );
            const stageTag   = koLabels[stageOnDay] || stageOnDay;

            return `
                <div class="space-y-1.5" data-schedule-date="${date}">
                    <div class="flex items-center justify-between px-1 pt-3 pb-1">
                        <span class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">${_formatScheduleDate(date)} <span class="text-gray-600">· ${stageTag}</span></span>
                        <span class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-600">${dayDone}/${matches.length} logged</span>
                    </div>
                    ${cards}
                </div>`;
        }

        // ── Group stage cards ─────────────────────────────────────────────────
        cards = matches.map((m) => {
            const logged   = _isMatchLogged(m);
            const result   = logged ? _getLoggedResult(m) : null;
            const homeTeam = _scheduleTeam(m.home);
            const awayTeam = _scheduleTeam(m.away);

            let scoreHtml;
            if (result) {
                const sh = result.team_home === m.home ? result.score_home : result.score_away;
                const sa = result.team_home === m.home ? result.score_away : result.score_home;
                scoreHtml = `<span class="font-black text-white text-lg mx-2">${sh} – ${sa}</span>`;
            } else {
                scoreHtml = `<span class="text-gray-600 font-black text-sm mx-2">vs</span>`;
            }

            const groupTimeChip = m.time ? `<span class="hidden sm:inline-block shrink-0 mr-3 text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 w-16">${_formatScheduleTime(m.time)} PT</span>` : '';
            if (logged) {
                return `
                    <div class="w-full rounded-2xl border border-gray-800 bg-gray-900/50 px-4 py-3">
                        <div class="flex items-center justify-between">
                            ${groupTimeChip}
                            <div class="flex items-center gap-2 min-w-0 flex-1">
                                <span class="text-xl shrink-0">${homeTeam.flag}</span>
                                <span class="font-black text-sm text-white truncate">${m.home}</span>
                            </div>
                            <div class="flex items-center shrink-0">${scoreHtml}</div>
                            <div class="flex items-center gap-2 min-w-0 flex-1 justify-end">
                                <span class="font-black text-sm text-white truncate">${m.away}</span>
                                <span class="text-xl shrink-0">${awayTeam.flag}</span>
                            </div>
                            <div class="ml-3 shrink-0">
                                <button onclick="editScheduleMatch('${m.home.replace(/'/g,"\\'")}','${m.away.replace(/'/g,"\\'")}','${m.group}','${m.date}',${result.id})"
                                    class="px-2 py-1 rounded-lg border border-gray-600 bg-gray-800 text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 hover:border-yellow-500/60 hover:text-yellow-400 transition-colors">
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>`;
            }

            return `
                <button onclick="prefillFromSchedule('${m.home.replace(/'/g,"\\'")}','${m.away.replace(/'/g,"\\'")}','${m.group}','${m.date}')"
                    class="w-full text-left rounded-2xl border border-gray-700 bg-gray-800 hover:border-blue-500/50 hover:bg-gray-700 active:scale-[0.99] px-4 py-3 transition-all">
                    <div class="flex items-center justify-between">
                        ${groupTimeChip}
                        <div class="flex items-center gap-2 min-w-0 flex-1">
                            <span class="text-xl shrink-0">${homeTeam.flag}</span>
                            <span class="font-black text-sm text-white truncate">${m.home}</span>
                        </div>
                        <div class="flex items-center shrink-0">${scoreHtml}</div>
                        <div class="flex items-center gap-2 min-w-0 flex-1 justify-end">
                            <span class="font-black text-sm text-white truncate">${m.away}</span>
                            <span class="text-xl shrink-0">${awayTeam.flag}</span>
                        </div>
                        <div class="ml-3 shrink-0">
                            <span class="text-[9px] font-black uppercase tracking-[0.15em] text-blue-400">Enter</span>
                        </div>
                    </div>
                </button>`;
        }).join('');

        return `
            <div class="space-y-1.5" data-schedule-date="${date}">
                <div class="flex items-center justify-between px-1 pt-3 pb-1">
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">${_formatScheduleDate(date)}</span>
                    <span class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-600">${matches.filter(_isMatchLogged).length}/${matches.length} logged</span>
                </div>
                ${cards}
            </div>`;
    }).join('');

    // Keep sub-tab pills pinned below the sticky admin header
    _syncScheduleFilterTop();
}

function setScheduleFilter(filter) {
    _scheduleBrowserActiveFilter = filter;
    renderScheduleBrowser();
    requestAnimationFrame(() => _scrollScheduleToTop());
}

function _syncScheduleBrowserToCurrentProgress() {
    const latestLogged = _getLatestLoggedScheduleMatch(_scheduleBrowserLoggedCache);
    _scheduleBrowserActiveFilter = _getDefaultScheduleFilter(_scheduleBrowserLoggedCache);
    renderScheduleBrowser();
    if (latestLogged) {
        requestAnimationFrame(() => _scrollScheduleToDate(latestLogged.match_date_manual));
    }
}

// ── Public Knockout Bracket ───────────────────────────────────────────────────
// Renders a horizontally-scrollable bracket grid into #bracket-container.
// matchesCache defaults to _publicMatchesCache when called from the public page.
function renderKnockoutBracket(matchesCache) {
    const container = document.getElementById('bracket-container');
    const guide = document.getElementById('bracket-guide');
    if (!container) return;
    if (matchesCache === undefined) matchesCache = _publicMatchesCache;

    const standings = computeGroupStandings(matchesCache);
    const best3rdAssignments = _buildBestThirdAssignments(standings);
    const knockoutMemo = {};
    const useSeedStatusColours = !_isKnockoutFieldLocked(standings);
    if (guide) guide.classList.toggle('hidden', !useSeedStatusColours);

    const SLOT_H = 80;
    const TOTAL_H = SLOT_H * 16;
    const HEADER_H = 64;
    const CARD_H = 74;
    const COLUMN_GAP = 20;
    const COLUMN_W = 196;
    const CARD_W = 184;
    const CARD_OFFSET_X = Math.round((COLUMN_W - CARD_W) / 2);

    const stageConfigs = [
        { stage: 'R32',      label: 'Round of 32',    units: 1 },
        { stage: 'R16',      label: 'Round of 16',    units: 2 },
        { stage: 'Quarters', label: 'Quarter-finals', units: 4 },
        { stage: 'Semis',    label: 'Semi-finals',    units: 8 },
        { stage: 'Finals',   label: 'Medal Matches',  units: 8 },
    ];

    const stageLayouts = [];
    stageConfigs.forEach((config, index) => {
        const left = index * (COLUMN_W + COLUMN_GAP);
        stageLayouts.push({ ...config, left, width: COLUMN_W });
    });
    const sceneWidth = stageLayouts.length * COLUMN_W + ((stageLayouts.length - 1) * COLUMN_GAP);
    const sceneHeight = HEADER_H + TOTAL_H;

    const matchCard = (logged, homeRes, awayRes, rawHomeLabel, rawAwayLabel, matchMeta = {}) => {
        const seedText = (rawLabel, tone = 'neutral') => {
            if (!rawLabel || rawLabel === 'TBD') return '';
            const toneClass = !useSeedStatusColours
                ? tone === 'winner'
                    ? 'text-gray-700'
                    : 'text-gray-400'
                : tone === 'winner'
                    ? 'text-emerald-700'
                    : tone === 'qualified'
                        ? 'text-amber-700'
                        : tone === 'live'
                            ? 'text-rose-700'
                            : 'text-gray-400';
            return `<span class="shrink-0 text-[8px] font-black uppercase tracking-[0.18em] ${toneClass}">${rawLabel}</span>`;
        };
        const wrapperClass = matchMeta.isTitleMatch
            ? 'rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-md'
            : matchMeta.isThirdPlace
                ? 'rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-slate-50 shadow-sm'
                : 'rounded-xl border border-gray-200 bg-white shadow-sm';
        const matchTag = matchMeta.label
            ? `<div class="px-2.5 pt-2 pb-1 text-[8px] font-black uppercase tracking-[0.2em] ${matchMeta.isTitleMatch ? 'text-amber-600' : matchMeta.isThirdPlace ? 'text-sky-600' : 'text-gray-400'}">${matchMeta.label}</div>`
            : '';
        const matchNumberTag = matchMeta.matchNumber
            ? `<div class="px-2.5 pt-1 text-[7px] font-black uppercase tracking-[0.2em] text-gray-300 leading-none">G${matchMeta.matchNumber}</div>`
            : '';

        if (logged) {
            const hWon = logged.score_home > logged.score_away;
            const aWon = logged.score_away > logged.score_home;
            const hFlag = (_scheduleTeam(logged.team_home)).flag;
            const aFlag = (_scheduleTeam(logged.team_away)).flag;
            const homeSeedLabel = rawHomeLabel === 'Best 3rd' ? _bestThirdSeedLabel(logged.team_home) : rawHomeLabel;
            const awaySeedLabel = rawAwayLabel === 'Best 3rd' ? _bestThirdSeedLabel(logged.team_away) : rawAwayLabel;
            const winnerEtTag = (isWinner) => (
                logged.was_extra_time && isWinner
                    ? '<span class="shrink-0 text-[8px] font-black uppercase tracking-[0.18em] text-red-400">E/P</span>'
                    : ''
            );
            return `
                <div class="${wrapperClass} overflow-hidden" style="width:${matchMeta.width || CARD_W}px">
                    ${matchNumberTag}
                    ${matchTag}
                    <div onclick="showTeamOwners('${logged.team_home.replace(/'/g, "\\'")}')" class="theme-hover-row cursor-pointer px-2.5 py-1.5 flex items-center justify-between gap-1 ${hWon ? 'bg-green-50' : ''} transition-colors">
                        <div class="flex items-center gap-1 min-w-0">
                            ${seedText(homeSeedLabel, hWon ? 'winner' : 'muted')}
                            <span class="text-sm leading-none">${hFlag}</span>
                            <span class="text-[11px] font-black ${hWon ? 'text-gray-900' : 'text-gray-400'} truncate">${logged.team_home}</span>
                        </div>
                        <div class="flex items-center gap-2 shrink-0 ml-1">
                            ${winnerEtTag(hWon)}
                            <span class="text-[11px] font-black ${hWon ? 'text-gray-900' : 'text-gray-400'}">${logged.score_home}</span>
                        </div>
                    </div>
                    <div class="h-px bg-gray-100"></div>
                    <div onclick="showTeamOwners('${logged.team_away.replace(/'/g, "\\'")}')" class="theme-hover-row cursor-pointer px-2.5 py-1.5 flex items-center justify-between gap-1 ${aWon ? 'bg-green-50' : ''} transition-colors">
                        <div class="flex items-center gap-1 min-w-0">
                            ${seedText(awaySeedLabel, aWon ? 'winner' : 'muted')}
                            <span class="text-sm leading-none">${aFlag}</span>
                            <span class="text-[11px] font-black ${aWon ? 'text-gray-900' : 'text-gray-400'} truncate">${logged.team_away}</span>
                        </div>
                        <div class="flex items-center gap-2 shrink-0 ml-1">
                            ${winnerEtTag(aWon)}
                            <span class="text-[11px] font-black ${aWon ? 'text-gray-900' : 'text-gray-400'}">${logged.score_away}</span>
                        </div>
                    </div>
                </div>`;
        }

        const _teamRow = (res, rawLabel) => {
            const displaySeed = _seedDisplayLabel(res, rawLabel);
            const badgeTone = !useSeedStatusColours
                ? 'muted'
                : res.status === 'confirmed'
                    ? 'winner'
                    : res.qualified
                        ? 'qualified'
                        : 'live';
            const nameTone = res.status === 'confirmed'
                ? 'text-gray-700'
                : res.qualified
                    ? 'text-gray-500'
                    : 'text-gray-300';
            const rowTone = !useSeedStatusColours
                ? 'bg-transparent'
                : badgeTone === 'winner'
                    ? 'bg-emerald-100'
                    : badgeTone === 'qualified'
                        ? 'bg-amber-100'
                        : badgeTone === 'live'
                            ? 'bg-rose-100'
                            : 'bg-transparent';
            if (res.status === 'none')
                return `<div class="px-2.5 py-1.5 flex items-center gap-1.5 min-w-0">
                            <span class="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-300 truncate">TBD</span>
                        </div>`;
            const clickAttr = `onclick="showTeamOwners('${res.name.replace(/'/g, "\\'")}')" class="theme-hover-row cursor-pointer px-2.5 py-1.5 flex items-center gap-1.5 min-w-0 ${rowTone} transition-colors"`;
            if (res.status === 'fallback')
                return `<div ${clickAttr}>
                            ${seedText(displaySeed, badgeTone)}
                            <span class="text-sm leading-none">${res.flag}</span>
                            <span class="text-[11px] font-black ${nameTone} truncate">${res.name}</span>
                        </div>`;
            if (res.status === 'provisional')
                return `<div ${clickAttr}>
                            ${seedText(displaySeed, badgeTone)}
                            <span class="text-sm leading-none">${res.flag}</span>
                            <span class="text-[11px] font-black ${nameTone} truncate">${res.name}</span>
                        </div>`;
            return `<div ${clickAttr}>
                        ${seedText(displaySeed, 'winner')}
                        <span class="text-sm leading-none">${res.flag}</span>
                        <span class="text-[11px] font-black text-gray-700 truncate">${res.name}</span>
                    </div>`;
        };

        const hasAny = homeRes.status !== 'none' || awayRes.status !== 'none';
        return `
            <div class="${hasAny ? wrapperClass : 'rounded-xl border border-dashed border-gray-200 bg-gray-50'} overflow-hidden" style="width:${matchMeta.width || CARD_W}px">
                ${matchNumberTag}
                ${matchTag}
                ${_teamRow(homeRes, rawHomeLabel)}
                <div class="h-px bg-gray-100"></div>
                ${_teamRow(awayRes, rawAwayLabel)}
            </div>`;
    };

    const columnMarkup = stageLayouts.map(({ stage, label, units, width, left }) => {
        const schedMatches = KNOCKOUT_SCHEDULE.filter((m) => m.stage === stage);
        const blockH = SLOT_H * units;
        const sceneMidY = HEADER_H + (TOTAL_H / 2);

        const cards = schedMatches.map((m, slotIdx) => {
            const logged = _findKnockoutSlotRow(m, matchesCache, standings, best3rdAssignments, {
                matchesCache,
                memo: knockoutMemo,
                requireFinal: true
            });
            let homeRes, awayRes;

            if (!logged) {
                homeRes = _resolveKnockoutMatchTeam(m, 'home', standings, best3rdAssignments, { matchesCache, memo: knockoutMemo });
                awayRes = _resolveKnockoutMatchTeam(m, 'away', standings, best3rdAssignments, { matchesCache, memo: knockoutMemo });
            }

            const meta = {
                width: stage === 'Finals'
                    ? (slotIdx === 1 ? CARD_W + 12 : CARD_W - 6)
                    : CARD_W,
                label: stage === 'Finals'
                    ? (slotIdx === 0 ? 'Third Place Match' : 'World Cup Final')
                    : '',
                isThirdPlace: stage === 'Finals' && slotIdx === 0,
                isTitleMatch: stage === 'Finals' && slotIdx === 1,
                matchNumber: m.match || null
            };
            const centerY = stage === 'Finals'
                ? (slotIdx === 1 ? sceneMidY - 84 : sceneMidY + 84)
                : HEADER_H + (slotIdx * blockH) + (blockH / 2);
            const top = Math.round(centerY - (CARD_H / 2));
            const cardLeft = Math.round((width - meta.width) / 2);

            return `
                <div style="position:absolute;left:${stage === 'Finals' ? cardLeft : CARD_OFFSET_X}px;top:${top}px;width:${meta.width}px;">
                    ${matchCard(logged, homeRes, awayRes, m.home, m.away, meta)}
                </div>`;
        }).join('');

        return `
            <div style="position:absolute;left:${left}px;top:0;width:${width}px;height:${sceneHeight}px;">
                <div class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 text-center leading-tight">${label}</div>
                ${cards}
            </div>`;
    }).join('');

    // Connector lines between rounds
    // Each pair of adjacent-stage matches shares a ┤ bracket: two horizontal stubs,
    // a vertical join, then an outgoing horizontal to the next card.
    // Geometry is derived from the same constants used for card placement.
    const svgPaths = [];
    const CARD_RIGHT_X = (colLeft) => colLeft + CARD_OFFSET_X + CARD_W;
    const CARD_LEFT_X  = (colLeft) => colLeft + CARD_OFFSET_X;

    const addBracketConnectors = (numNextStageMatches, srcColLeft, dstColLeft, srcCenterY, dstCenterY) => {
        const rx   = CARD_RIGHT_X(srcColLeft);
        const lx   = CARD_LEFT_X(dstColLeft);
        const mx   = Math.round((rx + lx) / 2);
        for (let i = 0; i < numNextStageMatches; i++) {
            const topY  = srcCenterY(2 * i);
            const botY  = srcCenterY(2 * i + 1);
            const nextY = dstCenterY(i);
            svgPaths.push(
                `<line x1="${rx}" y1="${topY}"  x2="${mx}"  y2="${topY}"/>`,
                `<line x1="${rx}" y1="${botY}"  x2="${mx}"  y2="${botY}"/>`,
                `<line x1="${mx}" y1="${topY}"  x2="${mx}"  y2="${botY}"/>`,
                `<line x1="${mx}" y1="${nextY}" x2="${lx}"  y2="${nextY}"/>`
            );
        }
    };

    const r32CY  = (i) => HEADER_H + i * SLOT_H + SLOT_H / 2;
    const r16CY  = (i) => HEADER_H + i * SLOT_H * 2 + SLOT_H;
    const qfCY   = (i) => HEADER_H + i * SLOT_H * 4 + SLOT_H * 2;
    const semiCY = (i) => HEADER_H + i * SLOT_H * 8 + SLOT_H * 4;

    const [r32Left, r16Left, qfLeft, semiLeft, finalsLeft] = stageLayouts.slice(0, 5).map((s) => s.left);

    addBracketConnectors(8, r32Left,  r16Left,  r32CY,  r16CY);
    addBracketConnectors(4, r16Left,  qfLeft,   r16CY,  qfCY);
    addBracketConnectors(2, qfLeft,   semiLeft, qfCY,   semiCY);

    // Semis → World Cup Final only (Third Place Match stands alone)
    {
        const rx     = CARD_RIGHT_X(semiLeft);               // 838
        const lx     = finalsLeft;                            // 864 — Final card has cardLeft=0
        const mx     = Math.round((rx + lx) / 2);            // 851
        const topY   = semiCY(0);                            // 336
        const botY   = semiCY(1);                            // 880
        const finalY = HEADER_H + TOTAL_H / 2 - 84;         // 524 — sceneMidY - 84
        svgPaths.push(
            `<line x1="${rx}" y1="${topY}"   x2="${mx}"  y2="${topY}"/>`,
            `<line x1="${rx}" y1="${botY}"   x2="${mx}"  y2="${botY}"/>`,
            `<line x1="${mx}" y1="${topY}"   x2="${mx}"  y2="${botY}"/>`,
            `<line x1="${mx}" y1="${finalY}" x2="${lx}"  y2="${finalY}"/>`
        );
    }

    const connectorSvg = `<svg style="position:absolute;left:0;top:0;pointer-events:none;overflow:visible" width="${sceneWidth}" height="${sceneHeight}" xmlns="http://www.w3.org/2000/svg"><g stroke="#d1d5db" stroke-width="1.5" fill="none" stroke-linecap="round">${svgPaths.join('')}</g></svg>`;

    container.innerHTML = `
        <div class="min-w-max pb-6">
            <div class="relative" style="width:${sceneWidth}px;height:${sceneHeight}px">
                ${connectorSvg}
                ${columnMarkup}
            </div>
        </div>`;
}

function prefillFromSchedule(homeName, awayName, groupOrStage, date) {
    const knockoutStages = ['R32', 'R16', 'Quarters', 'Semis', 'Finals'];
    const isKnockout = knockoutStages.includes(groupOrStage);
    const isKnownTeam = (name) => teams.some((team) => team.name === name);

    // For group matches, ignore taps on already-logged matches
    if (!isKnockout && _isMatchLogged({ home: homeName, away: awayName })) return;

    showAdminTab('matches');

    const team1     = document.getElementById('admin-team1');
    const team2     = document.getElementById('admin-team2');
    const stage     = document.getElementById('admin-stage');
    const score1    = document.getElementById('admin-score1');
    const score2    = document.getElementById('admin-score2');
    const matchDate = document.getElementById('admin-match-date');
    const extraTime = document.getElementById('admin-extratime');

    if (isKnockout) {
        if (team1) team1.value = isKnownTeam(homeName) ? homeName : '';
        if (team2) team2.value = isKnownTeam(awayName) ? awayName : '';
        if (stage) stage.value = groupOrStage;
    } else {
        if (team1) team1.value = homeName;
        if (team2) team2.value = awayName;
        if (stage) stage.value = 'Group';
    }

    if (matchDate && date) matchDate.value = date;
    if (extraTime) extraTime.value = 'false';
    if (score1) score1.value = '';
    if (score2) score2.value = '';
    _primeAdminScoresIfReady();
    if (score1) score1.focus();

    window._editingMatchId = null;
    const submitBtn = document.getElementById('admin-submit-btn');
    if (submitBtn) submitBtn.textContent = 'LOG SCORE';

    const form = document.getElementById('admin-match-entry-form');
    if (form) _scrollAdminFormIntoView(form);
}

function _scrollAdminFormIntoView(formEl) {
    if (!formEl) return;
    const scrollContainer = document.getElementById('page-admin');
    const stickyHeader = document.getElementById('admin-sticky-header');
    const headerOffset = (stickyHeader?.offsetHeight || 0) + 20;

    if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const formRect = formEl.getBoundingClientRect();
        const nextTop = scrollContainer.scrollTop + (formRect.top - containerRect.top) - headerOffset;
        scrollContainer.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
        return;
    }

    const absoluteTop = window.scrollY + formEl.getBoundingClientRect().top - headerOffset;
    window.scrollTo({ top: Math.max(0, absoluteTop), behavior: 'smooth' });
}

function _primeAdminScoresIfReady(force = false) {
    const team1 = document.getElementById('admin-team1');
    const team2 = document.getElementById('admin-team2');
    const score1 = document.getElementById('admin-score1');
    const score2 = document.getElementById('admin-score2');
    if (!team1 || !team2 || !score1 || !score2) return;
    if (!team1.value || !team2.value) return;
    if (force || score1.value === '') score1.value = '0';
    if (force || score2.value === '') score2.value = '0';
}

function editScheduleMatch(_homeName, _awayName, _group, date, matchId) {
    const result = _scheduleBrowserLoggedCache.find((r) => r.id === matchId);
    if (!result) return;

    showAdminTab('matches');

    const team1 = document.getElementById('admin-team1');
    const team2 = document.getElementById('admin-team2');
    const stage = document.getElementById('admin-stage');
    const score1 = document.getElementById('admin-score1');
    const score2 = document.getElementById('admin-score2');
    const matchDate = document.getElementById('admin-match-date');
    const extraTime = document.getElementById('admin-extratime');
    const submitBtn = document.getElementById('admin-submit-btn');

    // Always use home=result.team_home so scores align correctly
    if (team1) team1.value = result.team_home;
    if (team2) team2.value = result.team_away;
    if (stage) stage.value = result.stage;
    if (matchDate) matchDate.value = result.match_date_manual || date || '';
    if (extraTime) extraTime.value = result.was_extra_time ? 'true' : 'false';
    if (score1) score1.value = result.score_home;
    if (score2) score2.value = result.score_away;
    if (submitBtn) submitBtn.textContent = 'UPDATE SCORE';

    window._editingMatchId = matchId;

    _primeAdminScoresIfReady(true);
    score1?.focus();
    _scrollAdminFormIntoView(document.getElementById('admin-match-entry-form'));
}

function setupAdminPage() {
    const teamOneSelect = document.getElementById('admin-team1');
    const teamTwoSelect = document.getElementById('admin-team2');

    showAdminTab('manager');

    if (teamOneSelect && teamTwoSelect) {
        const options = [...teams]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((team) => `<option value="${team.name}">${team.flag} ${team.name}</option>`)
            .join('');

        teamOneSelect.innerHTML = `<option value="">Select Home Team...</option>${options}`;
        teamTwoSelect.innerHTML = `<option value="">Select Away Team...</option>${options}`;
        attachAlphaJumpToSelect(teamOneSelect);
        attachAlphaJumpToSelect(teamTwoSelect);
        if (teamOneSelect.dataset.defaultScoreBound !== 'true') {
            const onSelectTeam = () => _primeAdminScoresIfReady();
            teamOneSelect.addEventListener('change', onSelectTeam);
            teamTwoSelect.addEventListener('change', onSelectTeam);
            teamOneSelect.dataset.defaultScoreBound = 'true';
            teamTwoSelect.dataset.defaultScoreBound = 'true';
        }
    }

    fetchAdminHistory();
    fetchAdminUsers();
    fetchAdminNotifications();
    fetchAdminAdvancement();
    fetchAdminKnockoutVerify();
    fetchStats();
    syncAdminToggleControls();

    if (appSettings.autoTeamStatusSync) {
        syncDerivedTeamStatus({ silent: true }).catch(() => {});
    }
}

function applyPublicVisibilityStyles() {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('hide-upside', Boolean(appSettings.hideTeamSelection));
}

function syncAdminToggleControls() {
    const lockToggle = document.getElementById('admin-lock-picks-toggle');
    const autoLockToggle = document.getElementById('admin-auto-lock-toggle');
    const hideTeamSelectionToggle = document.getElementById('admin-hide-team-selection-toggle');
    const hidePlayerChipsToggle = document.getElementById('admin-hide-player-chips-toggle');
    const autoTeamStatusToggle = document.getElementById('admin-auto-team-status-toggle');

    if (lockToggle) {
        lockToggle.checked = Boolean(appSettings.picksLocked);
    }

    if (autoLockToggle) {
        autoLockToggle.checked = appSettings.autoLockAtKickoff !== false;
    }

    if (hideTeamSelectionToggle) {
        hideTeamSelectionToggle.checked = Boolean(appSettings.hideTeamSelection);
    }

    if (hidePlayerChipsToggle) {
        hidePlayerChipsToggle.checked = Boolean(appSettings.hidePlayerChips);
    }

    if (autoTeamStatusToggle) {
        autoTeamStatusToggle.checked = Boolean(appSettings.autoTeamStatusSync);
    }
}

const MATCH_SYNC_URL = 'https://ttqvchhzuyzhzeumysks.supabase.co/functions/v1/sync-world-cup';

async function runMatchSync(execute = true) {
    const btn = document.getElementById('matchsync-btn');
    const lastEl = document.getElementById('matchsync-last-synced');
    const rowsEl = document.getElementById('matchsync-rows');
    const summaryEl = document.getElementById('matchsync-summary');
    if (!btn || !rowsEl) return;
    btn.disabled = true;
    if (lastEl) lastEl.textContent = 'Syncing…';
    if (rowsEl) rowsEl.innerHTML = '<div class="px-4 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 animate-pulse">Calling API…</div>';
    try {
        const url = execute ? `${MATCH_SYNC_URL}?execute=true` : MATCH_SYNC_URL;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'Sync failed');
        _renderMatchSyncSummary(data.summary, summaryEl);
        _renderMatchSyncRows(data.planned || [], rowsEl);
        if (lastEl) lastEl.textContent = `Last synced ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Vancouver' })} PT · ${data.summary.totalApiMatches} matches`;
    } catch (err) {
        if (rowsEl) rowsEl.innerHTML = `<div class="px-4 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-red-400">Error: ${escapeHtml(err.message || String(err))}</div>`;
        if (lastEl) lastEl.textContent = 'Sync failed';
    } finally {
        btn.disabled = false;
    }
}

function _renderMatchSyncSummary(summary, el) {
    if (!el || !summary) return;
    el.classList.remove('hidden');
    const cell = (label, value, color = 'text-white') => `
        <div class="text-center">
            <div class="text-[8px] font-black uppercase tracking-[0.18em] text-gray-500">${label}</div>
            <div class="text-base font-black ${color}">${value}</div>
        </div>`;
    el.innerHTML = [
        cell('Total', summary.totalApiMatches),
        cell('Upcoming', summary.upcoming || 0, 'text-gray-300'),
        cell('In Play', summary.inPlay || 0, summary.inPlay ? 'text-yellow-300' : 'text-gray-500'),
        cell('Auto-synced', summary.executedInserts + summary.executedUpdates, 'text-green-400'),
        cell('Skip Manual', summary.plannedSkipManual || 0, 'text-orange-300'),
        cell('Errors', (summary.errors || []).length, summary.errors?.length ? 'text-red-400' : 'text-gray-500'),
    ].join('');
}

function _renderMatchSyncRows(planned, rowsEl) {
    if (!rowsEl) return;
    if (!planned.length) {
        rowsEl.innerHTML = '<div class="px-4 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">No matches in the API response.</div>';
        return;
    }
    const sorted = [...planned].sort((a, b) => (a.utc_date || '').localeCompare(b.utc_date || ''));
    rowsEl.innerHTML = sorted.map((p) => {
        const dt = p.utc_date ? new Date(p.utc_date) : null;
        const dateStr = dt ? dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Vancouver' }) : '—';
        const timeStr = dt ? dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Vancouver' }) : '';
        const apiBadge = _matchSyncApiBadge(p.api_status);
        const score = (p.score_home != null && p.score_away != null)
            ? `<span class="font-black text-white">${p.score_home}–${p.score_away}</span>${p.was_extra_time ? '<span class="text-[8px] font-black text-yellow-300 ml-1">ET</span>' : ''}`
            : '<span class="text-gray-600">–</span>';
        const dbBadge = _matchSyncDbBadge(p);
        return `<div class="grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-[11px] text-gray-300">
            <div class="col-span-2 font-black text-white">${dateStr}<div class="text-[9px] font-bold text-gray-500">${timeStr}</div></div>
            <div class="col-span-4 font-black text-gray-200">${escapeHtml(p.team_home)} <span class="text-gray-600 font-normal">v</span> ${escapeHtml(p.team_away)}</div>
            <div class="col-span-2 text-center">${apiBadge}</div>
            <div class="col-span-2 text-center">${score}</div>
            <div class="col-span-2 text-right text-[10px]">${dbBadge}</div>
        </div>`;
    }).join('');
}

function _matchSyncApiBadge(status) {
    const map = {
        FINISHED: ['🟢', 'Finished', 'text-green-400'],
        IN_PLAY: ['🟡', 'Live', 'text-yellow-400 animate-pulse'],
        PAUSED: ['🟡', 'HT', 'text-yellow-400'],
        TIMED: ['⚪️', 'Upcoming', 'text-gray-400'],
        SCHEDULED: ['⚪️', 'Sched', 'text-gray-400'],
        POSTPONED: ['⚠️', 'Postponed', 'text-orange-400'],
        CANCELLED: ['❌', 'Cancelled', 'text-red-400'],
        SUSPENDED: ['⚠️', 'Suspended', 'text-orange-400'],
    };
    const [icon, label, color] = map[status] || ['•', status || '?', 'text-gray-500'];
    return `<span class="text-[10px] font-black uppercase tracking-[0.12em] ${color}">${icon} ${label}</span>`;
}

function _matchSyncDbBadge(p) {
    if (p.db_manual_override === true) {
        return '<span class="text-orange-300 font-black">✏️ Manual</span>';
    }
    if (p.db_auto_synced_at) {
        const ago = _shortAgo(p.db_auto_synced_at);
        return `<span class="text-green-400 font-black">🟢 Auto · ${ago}</span>`;
    }
    if (p.action === 'insert') return '<span class="text-blue-300 font-black">＋ New</span>';
    if (p.action === 'update') return '<span class="text-blue-300 font-black">↻ Update</span>';
    if (p.action === 'no-change') return '<span class="text-gray-500">unchanged</span>';
    if (p.action === 'skip-unmapped') return `<span class="text-red-300 font-black" title="${escapeHtml(p.reason || '')}">⚠️ Unmapped</span>`;
    return '<span class="text-gray-600">–</span>';
}

function _matchSourceBadge(match) {
    if (match?.manual_override === true) {
        return '<div class="mt-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-orange-300" title="Saved by an admin — auto-sync skips this row">✏️ Manual</div>';
    }
    if (match?.auto_synced_at) {
        return `<div class="mt-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-green-400" title="Last synced ${new Date(match.auto_synced_at).toLocaleString()}">🟢 Auto · ${escapeHtml(_shortAgo(match.auto_synced_at))}</div>`;
    }
    return '';
}

function _shortAgo(isoString) {
    const ms = Date.now() - new Date(isoString).getTime();
    if (!isFinite(ms) || ms < 0) return 'just now';
    const min = Math.floor(ms / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    return `${day}d ago`;
}

// ── Match Manager admin tab ───────────────────────────────────────────────────
let _managerApiPlanned = [];
let _managerLastSyncAt = null;
let _managerFilter = 'all';
let _managerExpandedKey = null;

// Match Manager API sync. `execute=true` writes API results to DB; `execute=false`
// is preview-only (fetches API state, refreshes the right column, no DB writes).
async function runManagerSync(execute = true) {
    const previewBtn = document.getElementById('manager-preview-btn');
    const syncBtn = document.getElementById('manager-refresh-btn');
    const statusEl = document.getElementById('manager-status');
    [previewBtn, syncBtn].forEach((b) => { if (b) b.disabled = true; });
    if (statusEl) statusEl.textContent = execute ? 'Syncing…' : 'Previewing…';
    try {
        // Pass-through ?test_finish from page URL so admin can simulate a FINISHED match end-to-end
        const pageParams = new URLSearchParams(window.location.search);
        const testFinish = pageParams.get('test_finish');
        const params = [];
        if (execute) params.push('execute=true');
        if (testFinish) params.push(`test_finish=${encodeURIComponent(testFinish)}`);
        const url = `${MATCH_SYNC_URL}${params.length ? `?${params.join('&')}` : ''}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'Sync failed');
        _managerApiPlanned = data.planned || [];
        _managerLastSyncAt = new Date();
        if (execute) await fetchAdminHistory();
        _renderMatchManager();
        const writes = (data.summary?.executedInserts || 0) + (data.summary?.executedUpdates || 0);
        const t = _managerLastSyncAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Vancouver' });
        const verb = execute ? 'Synced' : 'Previewed';
        const writeNote = execute && writes ? ` · ${writes} new from API` : (execute ? '' : ' · DB unchanged');
        if (statusEl) statusEl.textContent = `${verb} ${data.summary?.totalApiMatches ?? '?'} matches at ${t} PT${writeNote}`;
    } catch (err) {
        if (statusEl) statusEl.textContent = `Error: ${err.message || String(err)}`;
    } finally {
        [previewBtn, syncBtn].forEach((b) => { if (b) b.disabled = false; });
    }
}

// Toggle the gear-icon dropdown of archived admin tabs (Schedule, Verify,
// Match Sync). The tabs themselves still exist as panels — this menu is just
// how admins reach them now that they're off the main nav.
function toggleManagerArchiveMenu() {
    const menu = document.getElementById('manager-archive-menu');
    if (!menu) return;
    menu.classList.toggle('hidden');
    if (!menu.classList.contains('hidden')) {
        const closeOnOutside = (ev) => {
            if (!menu.contains(ev.target) && ev.target?.id !== 'manager-archive-btn') {
                menu.classList.add('hidden');
                document.removeEventListener('click', closeOnOutside);
            }
        };
        // Defer so the click that opened the menu doesn't immediately close it
        setTimeout(() => document.addEventListener('click', closeOnOutside), 0);
    }
}

// Switch to one of the archived admin tabs from the gear menu.
function openArchivedAdminTab(tabId) {
    const menu = document.getElementById('manager-archive-menu');
    if (menu) menu.classList.add('hidden');
    showAdminTab(tabId);
}

function _hasFinalScore(match) {
    if (!match || match.is_finished === false || match.score_home == null || match.score_away == null) {
        return false;
    }

    return Number.isFinite(Number(match.score_home)) && Number.isFinite(Number(match.score_away));
}

function _managerSortByUtc(matches = []) {
    return [...matches].sort((a, b) => (a.utc_date || '').localeCompare(b.utc_date || ''));
}

function _managerBuildApiIndex(plannedRows = _managerApiPlanned) {
    const byPair = new Map();
    const byStage = { R32: [], R16: [], Quarters: [], Semis: [], Finals: [], QF: [], SM: [], F: [], NULL: [] };
    for (const p of plannedRows || []) {
        if (p.team_home && p.team_away) {
            byPair.set(`${p.team_home}|${p.team_away}`, p);
            byPair.set(`${p.team_away}|${p.team_home}`, p);
        }
        const stageKey = p.stage || 'NULL';
        if (byStage[stageKey]) byStage[stageKey].push(p);
    }
    Object.values(byStage).forEach(arr => arr.sort((a, b) => (a.utc_date || '').localeCompare(b.utc_date || '')));
    // Split NULL into R32 (date < 2026-07-15) and 3rd place (>= 2026-07-15)
    const nulls = byStage.NULL;
    const r32FromNull = nulls.filter(p => p.utc_date < '2026-07-15');
    const thirdPlace = nulls.filter(p => p.utc_date >= '2026-07-15');
    return {
        allRows: plannedRows || [],
        byPair,
        byStage,
        r32FromNull,
        r32Matches: _managerSortByUtc([...byStage.R32, ...r32FromNull]),
        r16Matches: _managerSortByUtc(byStage.R16),
        quarterMatches: _managerSortByUtc([...byStage.Quarters, ...byStage.QF]),
        semiMatches: _managerSortByUtc([...byStage.Semis, ...byStage.SM]),
        finalMatches: _managerSortByUtc([...byStage.Finals, ...byStage.F]),
        thirdPlace
    };
}

function _managerFindApiMatch(scheduleEntry, apiIndex, stageOrderCounters, knockoutContext = null) {
    // Try team-pair match first (works for groups + post-bracket KO)
    if (apiIndex.byPair.has(`${scheduleEntry.home}|${scheduleEntry.away}`)) {
        return apiIndex.byPair.get(`${scheduleEntry.home}|${scheduleEntry.away}`);
    }
    if (!scheduleEntry.group && scheduleEntry.stage) {
        const context = knockoutContext || _buildKnockoutResolutionContext();
        return _findKnockoutSlotRow(
            scheduleEntry,
            apiIndex.allRows || [],
            context.standings,
            context.bestThirdAssignments,
            {
                matchesCache: context.matchesCache || _scheduleBrowserLoggedCache,
                memo: context.memo || {}
            }
        );
    }
    return null;
}

function _managerGetEntriesForFilter(filter = _managerFilter) {
    const allGroups = ['A','B','C','D','E','F','G','H','I','J','K','L'];
    if (filter === 'all') return [...GROUP_STAGE_SCHEDULE, ...KNOCKOUT_SCHEDULE];
    if (filter === 'groups') return [...GROUP_STAGE_SCHEDULE];
    if (filter === 'knockout') return [...KNOCKOUT_SCHEDULE];
    if (allGroups.includes(filter)) return GROUP_STAGE_SCHEDULE.filter(e => e.group === filter);
    return KNOCKOUT_SCHEDULE.filter(e => e.stage === filter);
}

function _managerGetEntriesInRenderOrder(entries = []) {
    const byDate = {};
    for (const entry of entries || []) {
        if (!byDate[entry.date]) byDate[entry.date] = [];
        byDate[entry.date].push(entry);
    }

    return Object.entries(byDate)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .flatMap(([, matches]) => matches);
}

function _managerFindDbRow(scheduleEntry, dbCache, claimedIds, knockoutContext = null) {
    // Group: match by team-pair (any direction) + date
    if (scheduleEntry.group) {
        return dbCache.find(r =>
            r.match_date_manual === scheduleEntry.date &&
            ((r.team_home === scheduleEntry.home && r.team_away === scheduleEntry.away) ||
             (r.team_home === scheduleEntry.away && r.team_away === scheduleEntry.home))
        ) || null;
    }
    // Knockout rows are keyed by real teams, while the schedule may still use
    // placeholders like 1C/2F. Resolve the slot first; never claim by order.
    const context = knockoutContext || _buildKnockoutResolutionContext(dbCache);
    return _findKnockoutSlotRow(scheduleEntry, dbCache, context.standings, context.bestThirdAssignments, {
        matchesCache: context.matchesCache || dbCache,
        memo: context.memo || {},
        claimedIds
    });
}

function _managerTeamPairMatches(row, home, away) {
    return (
        (row.team_home === home && row.team_away === away) ||
        (row.team_home === away && row.team_away === home)
    );
}

function _managerDateDistanceDays(dateA, dateB) {
    if (!dateA || !dateB) return Number.POSITIVE_INFINITY;
    const aMs = Date.parse(`${dateA}T12:00:00Z`);
    const bMs = Date.parse(`${dateB}T12:00:00Z`);
    if (!Number.isFinite(aMs) || !Number.isFinite(bMs)) return Number.POSITIVE_INFINITY;
    return Math.abs(aMs - bMs) / 86400000;
}

function _managerFindImportTargetDbRow(scheduleEntry, dbCache, claimedIds) {
    const exact = _managerFindDbRow(scheduleEntry, dbCache, claimedIds);
    if (exact?.manual_override) return null;
    if (exact) return exact;

    const stage = scheduleEntry.stage || (scheduleEntry.group ? 'Group' : '');
    const candidates = (dbCache || [])
        .filter((row) =>
            row.stage === stage &&
            row.manual_override !== true &&
            row.match_date_manual !== scheduleEntry.date &&
            _managerDateDistanceDays(row.match_date_manual, scheduleEntry.date) <= 1 &&
            _managerTeamPairMatches(row, scheduleEntry.home, scheduleEntry.away)
        )
        .sort((a, b) =>
            _managerDateDistanceDays(a.match_date_manual, scheduleEntry.date) -
            _managerDateDistanceDays(b.match_date_manual, scheduleEntry.date)
        );

    return candidates[0] || null;
}

function _managerStatusBadge(status) {
    const map = {
        FINISHED: ['🟢', 'Finished', 'text-green-400'],
        IN_PLAY: ['🟡', 'Live', 'text-yellow-400 animate-pulse'],
        PAUSED: ['🟡', 'HT', 'text-yellow-400'],
        TIMED: ['⚪️', 'Upcoming', 'text-gray-400'],
        SCHEDULED: ['⚪️', 'Sched', 'text-gray-400'],
        POSTPONED: ['⚠️', 'Postponed', 'text-orange-400'],
        CANCELLED: ['❌', 'Cancelled', 'text-red-400'],
    };
    const [icon, label, color] = map[status] || ['•', status || '?', 'text-gray-500'];
    return `<span class="text-[10px] font-black uppercase tracking-[0.12em] ${color}">${icon} ${label}</span>`;
}

function _renderMatchManager() {
    const rowsEl = document.getElementById('manager-rows');
    const filterEl = document.getElementById('manager-filter-strip');
    if (!rowsEl || !filterEl) return;

    const apiIndex = _managerBuildApiIndex();
    const dbCache = _scheduleBrowserLoggedCache || [];
    const knockoutContext = _buildKnockoutResolutionContext(dbCache);

    // Filter strip (reuse Schedule tab pattern)
    const allGroups = ['A','B','C','D','E','F','G','H','I','J','K','L'];
    const koStages = [['R32','R32'], ['R16','R16'], ['Quarters','QF'], ['Semis','Semi'], ['Finals','Final']];
    const f = _managerFilter;
    const tabClass = (filter, wide = false) => {
        const active = filter === f;
        const wcls = wide ? 'min-w-[84px]' : 'min-w-[42px]';
        return `shrink-0 ${wcls} rounded-xl border px-3 py-2 text-center text-[9px] font-black uppercase tracking-[0.18em] transition-all duration-200 ${active ? 'border-blue-400/40 bg-white text-gray-950 shadow-lg shadow-blue-500/10' : 'border-transparent bg-transparent text-gray-400 hover:border-gray-700 hover:bg-gray-800/80 hover:text-white'}`;
    };
    filterEl.innerHTML = `
        <div class="overflow-x-auto no-scrollbar">
            <div class="flex min-w-full items-center gap-2 rounded-3xl border border-gray-800 bg-gray-950/70 p-2">
                <div class="flex flex-1 items-center justify-between gap-1.5">
                    <button onclick="setManagerFilter('all')" class="${tabClass('all', true)}">All</button>
                    <button onclick="setManagerFilter('groups')" class="${tabClass('groups', true)}">Groups</button>
                    ${allGroups.map(g => `<button onclick="setManagerFilter('${g}')" class="${tabClass(g)}">${g}</button>`).join('')}
                </div>
                <span class="mx-1 h-7 w-px shrink-0 bg-gray-800"></span>
                <div class="flex flex-1 items-center justify-between gap-1.5">
                    <button onclick="setManagerFilter('knockout')" class="${tabClass('knockout', true)}">KO</button>
                    ${koStages.map(([key, label]) => `<button onclick="setManagerFilter('${key}')" class="${tabClass(key)}">${label}</button>`).join('')}
                </div>
            </div>
        </div>
    `;

    // Filter the schedule
    const allEntries = _managerGetEntriesForFilter(f);

    if (!allEntries.length) {
        rowsEl.innerHTML = '<div class="px-4 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">No matches</div>';
        return;
    }

    // Group by date
    const byDate = {};
    for (const e of allEntries) {
        if (!byDate[e.date]) byDate[e.date] = [];
        byDate[e.date].push(e);
    }

    // Reset stage-order counters per render
    const stageCounters = {};
    // Claim db rows as schedule entries consume them — prevents 3 KO matches
    // on the same date all returning the same db row.
    const claimedDbIds = new Set();

    rowsEl.innerHTML = Object.entries(byDate)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, matches]) => {
            const dayHeader = `
                <div class="flex items-center gap-3 pt-2 pb-1">
                    <div class="h-px flex-1 bg-gray-800"></div>
                    <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">${_formatScheduleDate(date)}</div>
                    <div class="h-px flex-1 bg-gray-800"></div>
                </div>`;
            const cards = matches.map(entry => _managerRenderRow(entry, apiIndex, dbCache, stageCounters, claimedDbIds, knockoutContext)).join('');
            return dayHeader + cards;
        }).join('');
}

function _managerRenderRow(entry, apiIndex, dbCache, stageCounters, claimedDbIds, knockoutContext) {
    const apiMatch = _managerFindApiMatch(entry, apiIndex, stageCounters, knockoutContext);
    const dbRow = _managerFindDbRow(entry, dbCache, claimedDbIds, knockoutContext);
    const rowKey = entry.slotKey || `${entry.home}|${entry.away}|${entry.date}`;
    const isExpanded = _managerExpandedKey === rowKey;
    const safeKey = rowKey.replace(/'/g, "\\'");

    const homeLabel = dbRow?.team_home || entry.home;
    const awayLabel = dbRow?.team_away || entry.away;
    const homeFlag = (typeof teams !== 'undefined' ? teams : []).find(t => t.name === homeLabel)?.flag || '';
    const awayFlag = (typeof teams !== 'undefined' ? teams : []).find(t => t.name === awayLabel)?.flag || '';

    // LEFT column — your pool
    const leftHasScore = _hasFinalScore(dbRow);
    const leftScore = leftHasScore
        ? `<div class="flex items-center gap-2"><span class="text-2xl font-black font-mono text-white">${dbRow.score_home}–${dbRow.score_away}</span>${dbRow.was_extra_time ? '<span class="text-[9px] font-black text-yellow-300">ET</span>' : ''}</div>`
        : `<div class="text-2xl font-black font-mono text-gray-700">— : —</div>`;
    const leftBadge = dbRow?.manual_override
        ? '<span class="text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">✏️ Manual</span>'
        : dbRow?.auto_synced_at
            ? `<span class="text-[9px] font-black uppercase tracking-[0.12em] text-green-400">🟢 Auto · ${_shortAgo(dbRow.auto_synced_at)}</span>`
            : '<span class="text-[9px] font-black uppercase tracking-[0.12em] text-gray-600">no entry</span>';
    const editLabel = dbRow ? 'Edit' : 'Log Result';

    // RIGHT column — API
    let rightContent;
    if (!apiMatch) {
        rightContent = `
            <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between gap-2">
                    <div class="text-[9px] font-black uppercase tracking-[0.18em] text-gray-600">no api data</div>
                </div>
                <div class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-600">match not yet listed by football-data.org</div>
            </div>`;
    } else {
        const apiHome = apiMatch.team_home || '—';
        const apiAway = apiMatch.team_away || '—';
        const apiHomeFlag = (typeof teams !== 'undefined' ? teams : []).find(t => t.name === apiHome)?.flag || '';
        const apiAwayFlag = (typeof teams !== 'undefined' ? teams : []).find(t => t.name === apiAway)?.flag || '';
        const apiUtc = apiMatch.utc_date ? new Date(apiMatch.utc_date) : null;
        const apiTimeChip = apiUtc
            ? `${apiUtc.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Vancouver' })} · ${apiUtc.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Vancouver' })} PT`
            : '';
        const apiScore = (apiMatch.score_home != null && apiMatch.score_away != null)
            ? `<div class="flex items-center gap-2"><span class="text-2xl font-black font-mono text-white">${apiMatch.score_home}–${apiMatch.score_away}</span>${apiMatch.was_extra_time ? '<span class="text-[9px] font-black text-yellow-300">ET</span>' : ''}</div>`
            : '<div class="text-2xl font-black font-mono text-gray-700">— : —</div>';
        // Mismatch coloring lifted to outer scope (uses isMismatched defined later)
        rightContent = `
            <div class="flex items-center justify-between gap-2">
                <div class="text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">${apiTimeChip}${entry.match ? ` · <span class="text-amber-400">G${entry.match}</span>` : ''}</div>
                ${_managerStatusBadge(apiMatch.api_status)}
            </div>
            <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="text-lg shrink-0">${apiHomeFlag}</span>
                    <span class="font-black text-sm text-white truncate">${escapeHtml(apiHome)}</span>
                </div>
                <div class="justify-self-center">${apiScore}</div>
                <div class="flex items-center gap-2 min-w-0 justify-end">
                    <span class="font-black text-sm text-white truncate">${escapeHtml(apiAway)}</span>
                    <span class="text-lg shrink-0">${apiAwayFlag}</span>
                </div>
            </div>`;
    }

    const editForm = isExpanded ? _managerEditForm(entry, dbRow, safeKey) : '';

    // Decide row container styling: red if teams mismatched, yellow if API
    // calendar date doesn't match schedule (PT), blue if expanded, gray default.
    const placeholderRe = /^[12][A-L]$|^W:|^L:|^Best /;
    const expectsRealNames = !placeholderRe.test(homeLabel) && !placeholderRe.test(awayLabel);
    const apiHome = apiMatch?.team_home;
    const apiAway = apiMatch?.team_away;
    const isMismatched = expectsRealNames && apiHome && apiAway && !(
        (apiHome === homeLabel && apiAway === awayLabel) ||
        (apiHome === awayLabel && apiAway === homeLabel)
    );
    const apiUtcForCheck = apiMatch?.utc_date ? new Date(apiMatch.utc_date) : null;
    const apiUtcValid = apiUtcForCheck && !isNaN(apiUtcForCheck);
    const apiDatePt = apiUtcValid
        ? apiUtcForCheck.toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' })
        : null;
    const apiTimePt = apiUtcValid
        ? apiUtcForCheck.toLocaleTimeString('en-GB', { timeZone: 'America/Vancouver', hour: '2-digit', minute: '2-digit', hour12: false })
        : null;
    const isDateMismatched = !!(apiDatePt && entry.date && apiDatePt !== entry.date);
    const isTimeMismatched = !!(apiTimePt && entry.time && !isDateMismatched && apiTimePt !== entry.time);
    const isWhenMismatched = isDateMismatched || isTimeMismatched;
    const containerClass = isMismatched
        ? 'border-red-500/60 bg-red-950/20'
        : isWhenMismatched
            ? 'border-yellow-500/70 bg-yellow-950/20'
            : isExpanded
                ? 'border-blue-500/60 bg-gray-900/50'
                : 'border-gray-800 bg-gray-900/50';

    // Import button — show when API has a FINISHED score AND teams match AND left isn't manual-override
    const apiHasResult = apiMatch && apiMatch.api_status === 'FINISHED'
        && apiMatch.score_home != null && apiMatch.score_away != null;
    const canImport = apiHasResult && !isMismatched && !dbRow?.manual_override;
    const apiScoreEqualsDb = dbRow && apiMatch && dbRow.score_home === apiMatch.score_home && dbRow.score_away === apiMatch.score_away;
    const showImportBtn = canImport && (!dbRow || !apiScoreEqualsDb);

    return `
        <div class="rounded-2xl border ${containerClass} overflow-hidden transition-colors">
            <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800">
                <div class="p-4 space-y-2">
                    <div class="flex items-center justify-between gap-2">
                        <div class="text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">
                            ${entry.date ? _formatScheduleDate(entry.date) + ' · ' : ''}${entry.time ? _formatScheduleTime(entry.time) + ' PT' : ''}
                            ${entry.match ? ` · <span class="text-amber-400">G${entry.match}</span>` : ''}
                            ${entry.group ? ` · Group ${entry.group}` : ''}
                            ${!entry.group && entry.stage ? ` · ${entry.stage}` : ''}
                            ${entry.stage && entry.stage !== 'Group' ? ` · <span class="text-gray-400">${escapeHtml(entry.home)} vs ${escapeHtml(entry.away)}${entry.awayCandidates ? ' ' + entry.awayCandidates.join('') : ''}</span>` : ''}
                        </div>
                        ${leftBadge}
                    </div>
                    <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="text-lg shrink-0">${homeFlag || ''}</span>
                            <span class="font-black text-sm text-white truncate">${escapeHtml(homeLabel)}</span>
                        </div>
                        <div class="justify-self-center">${leftScore}</div>
                        <div class="flex items-center gap-2 min-w-0 justify-end">
                            <span class="font-black text-sm text-white truncate">${escapeHtml(awayLabel)}</span>
                            <span class="text-lg shrink-0">${awayFlag || ''}</span>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-1">
                        ${showImportBtn ? `<button onclick="managerImportApi('${safeKey}')" class="px-3 py-1 rounded-lg border border-green-500/50 bg-green-950/40 text-[10px] font-black uppercase tracking-[0.18em] text-green-300 hover:bg-green-900/50 hover:border-green-400 transition-colors">Import API</button>` : ''}
                        <button onclick="toggleManagerEdit('${safeKey}')" class="px-3 py-1 rounded-lg border ${isExpanded ? 'border-blue-500 text-blue-300' : 'border-gray-700 text-gray-300'} bg-gray-800 text-[10px] font-black uppercase tracking-[0.18em] hover:border-blue-500/60 hover:text-blue-300 transition-colors">${isExpanded ? 'Cancel' : editLabel}</button>
                    </div>
                </div>
                <div class="p-4 ${isMismatched ? 'bg-red-950/20' : isWhenMismatched ? 'bg-yellow-950/20' : 'bg-gray-950/40'} space-y-2">
                    ${rightContent}
                    ${isMismatched ? '<div class="text-[9px] font-black uppercase tracking-[0.15em] text-red-300">⚠️ API teams differ from schedule</div>' : ''}
                    ${!isMismatched && isDateMismatched ? `<div class="text-[9px] font-black uppercase tracking-[0.15em] text-yellow-300">⚠️ API date differs · API ${escapeHtml(apiDatePt)} · Schedule ${escapeHtml(entry.date)}</div>` : ''}
                    ${!isMismatched && !isDateMismatched && isTimeMismatched ? `<div class="text-[9px] font-black uppercase tracking-[0.15em] text-yellow-300">⚠️ API time differs · API ${escapeHtml(apiTimePt)} PT · Schedule ${escapeHtml(entry.time)} PT</div>` : ''}
                </div>
            </div>
            ${editForm}
        </div>`;
}

async function managerImportApi(safeKey) {
    // Find the entry + apiMatch from current state
    const currentEntries = _managerGetEntriesInRenderOrder(_managerGetEntriesForFilter(_managerFilter));
    const fallbackEntries = _managerGetEntriesInRenderOrder([...GROUP_STAGE_SCHEDULE, ...KNOCKOUT_SCHEDULE]);
    const allEntries = currentEntries.some(e => (e.slotKey || `${e.home}|${e.away}|${e.date}`) === safeKey)
        ? currentEntries
        : fallbackEntries;
    const entry = allEntries.find(e => (e.slotKey || `${e.home}|${e.away}|${e.date}`) === safeKey);
    if (!entry) return;
    const apiIndex = _managerBuildApiIndex();
    const stageCounters = {};
    const dbCache = _scheduleBrowserLoggedCache || [];
    const knockoutContext = _buildKnockoutResolutionContext(dbCache);
    const claimedDbIds = new Set();
    // Walk the schedule in same order as render so the counter + claim Set
    // both end up at the right position when we hit the target entry.
    for (const e of allEntries) {
        if ((e.slotKey || `${e.home}|${e.away}|${e.date}`) === safeKey) break;
        _managerFindApiMatch(e, apiIndex, stageCounters, knockoutContext);
        _managerFindDbRow(e, dbCache, claimedDbIds, knockoutContext);
    }
    const apiMatch = _managerFindApiMatch(entry, apiIndex, stageCounters, knockoutContext);
    if (!apiMatch || apiMatch.api_status !== 'FINISHED' || apiMatch.score_home == null || apiMatch.score_away == null) {
        showToast?.('No FINISHED API result for this match.');
        return;
    }
    const stage = apiMatch.stage || entry.stage || (entry.group ? 'Group' : '');
    const matchDate = apiMatch.match_date || entry.date;
    const importEntry = {
        ...entry,
        home: apiMatch.team_home,
        away: apiMatch.team_away,
        stage,
        date: matchDate
    };
    const dbRow = _managerFindImportTargetDbRow(importEntry, dbCache, new Set());
    const payload = {
        team_home: apiMatch.team_home,
        team_away: apiMatch.team_away,
        score_home: apiMatch.score_home,
        score_away: apiMatch.score_away,
        stage,
        is_finished: true,
        match_date_manual: matchDate,
        was_extra_time: !!apiMatch.was_extra_time,
        manual_override: false,
        auto_synced_at: new Date().toISOString(),
    };
    try {
        let error;
        if (dbRow?.id) {
            ({ error } = await supabaseClient.from('matches').update(payload).eq('id', dbRow.id));
        } else {
            ({ error } = await supabaseClient.from('matches').insert([{ ...payload, match_date: new Date().toISOString() }]));
        }
        if (error) throw error;
        showToast?.('Imported from API.');
        await fetchAdminHistory();
        _renderMatchManager();
    } catch (err) {
        showToast?.(`Import failed: ${err.message || String(err)}`);
    }
}

function _managerEditForm(entry, dbRow, safeKey) {
    const home = entry.home;
    const away = entry.away;
    // Knockout entries can have placeholder names like "1A" — only allow editing if real names
    const isPlaceholder = (n) => /^[12][A-L]$|^W:|^L:|^Best /.test(n);
    if (isPlaceholder(home) || isPlaceholder(away)) {
        return `
            <div class="px-4 py-3 border-t border-gray-800 bg-gray-950/40">
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Teams not yet known — log this match in <span class="text-blue-300">Match Results</span> after the bracket fills.</p>
            </div>`;
    }
    const sh = dbRow?.score_home ?? '';
    const sa = dbRow?.score_away ?? '';
    const et = dbRow?.was_extra_time ? 'true' : 'false';
    const editId = dbRow?.id || '';
    const stage = entry.stage || (entry.group ? 'Group' : '');
    return `
        <div class="px-4 py-3 border-t border-blue-500/30 bg-gray-950/60">
            <form class="flex flex-wrap items-end gap-3" onsubmit="event.preventDefault(); managerSubmitEdit('${safeKey}'); return false;">
                <div class="flex flex-col gap-1">
                    <label class="text-[8px] font-black uppercase tracking-[0.18em] text-gray-500">${escapeHtml(home)}</label>
                    <input id="mgr-home-${safeKey}" type="number" inputmode="numeric" min="0" value="${sh}" class="w-20 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-center text-base font-black text-white outline-none focus:border-blue-500">
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-[8px] font-black uppercase tracking-[0.18em] text-gray-500">${escapeHtml(away)}</label>
                    <input id="mgr-away-${safeKey}" type="number" inputmode="numeric" min="0" value="${sa}" class="w-20 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-center text-base font-black text-white outline-none focus:border-blue-500">
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-[8px] font-black uppercase tracking-[0.18em] text-gray-500">ET / Pens?</label>
                    <select id="mgr-et-${safeKey}" class="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm font-bold text-white outline-none focus:border-blue-500">
                        <option value="false" ${et === 'false' ? 'selected' : ''}>No</option>
                        <option value="true" ${et === 'true' ? 'selected' : ''}>Yes</option>
                    </select>
                </div>
                <input type="hidden" id="mgr-stage-${safeKey}" value="${escapeHtml(stage)}">
                <input type="hidden" id="mgr-date-${safeKey}" value="${entry.date}">
                <input type="hidden" id="mgr-home-name-${safeKey}" value="${escapeHtml(home)}">
                <input type="hidden" id="mgr-away-name-${safeKey}" value="${escapeHtml(away)}">
                <input type="hidden" id="mgr-edit-id-${safeKey}" value="${editId}">
                <button type="submit" class="rounded-2xl bg-green-500 px-5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-950 hover:bg-green-400 transition-colors">Save</button>
            </form>
            <div id="mgr-status-${safeKey}" class="mt-2 text-[9px] font-black uppercase tracking-[0.18em] text-gray-500"></div>
        </div>`;
}

async function managerSubmitEdit(safeKey) {
    const home = document.getElementById(`mgr-home-name-${safeKey}`)?.value || '';
    const away = document.getElementById(`mgr-away-name-${safeKey}`)?.value || '';
    const stage = document.getElementById(`mgr-stage-${safeKey}`)?.value || '';
    const matchDate = document.getElementById(`mgr-date-${safeKey}`)?.value || '';
    const editId = document.getElementById(`mgr-edit-id-${safeKey}`)?.value || '';
    const sh = parseInt(document.getElementById(`mgr-home-${safeKey}`)?.value, 10);
    const sa = parseInt(document.getElementById(`mgr-away-${safeKey}`)?.value, 10);
    const et = document.getElementById(`mgr-et-${safeKey}`)?.value === 'true';
    const statusEl = document.getElementById(`mgr-status-${safeKey}`);

    if (Number.isNaN(sh) || Number.isNaN(sa) || sh < 0 || sa < 0) {
        if (statusEl) statusEl.textContent = 'Enter valid scores.';
        return;
    }
    if (statusEl) statusEl.textContent = 'Saving…';

    try {
        let error;
        if (editId) {
            ({ error } = await supabaseClient.from('matches').update({
                team_home: home, team_away: away, score_home: sh, score_away: sa,
                stage, is_finished: true, match_date_manual: matchDate,
                was_extra_time: et, manual_override: true,
            }).eq('id', parseInt(editId, 10)));
        } else {
            ({ error } = await supabaseClient.from('matches').insert([{
                team_home: home, team_away: away, score_home: sh, score_away: sa,
                stage, is_finished: true,
                match_date: new Date().toISOString(),
                match_date_manual: matchDate,
                was_extra_time: et, manual_override: true,
            }]));
        }
        if (error) throw error;
        if (statusEl) statusEl.textContent = 'Saved ✓';
        _managerExpandedKey = null;
        await fetchAdminHistory();
        _renderMatchManager();
    } catch (err) {
        if (statusEl) statusEl.textContent = `Error: ${err.message || String(err)}`;
    }
}

function toggleManagerEdit(safeKey) {
    _managerExpandedKey = _managerExpandedKey === safeKey ? null : safeKey;
    _renderMatchManager();
}

function setManagerFilter(filter) {
    _managerFilter = filter;
    _managerExpandedKey = null;
    _renderMatchManager();
}

function showAdminTab(tabId) {
    const panels = document.querySelectorAll('.admin-panel');
    const tabs = document.querySelectorAll('.admin-tab');

    panels.forEach((panel) => panel.classList.add('hidden'));
    tabs.forEach((tab) => {
        tab.classList.remove('active', 'border-blue-400/40', 'bg-white', 'text-gray-950', 'shadow-lg', 'shadow-blue-500/10');
        tab.classList.add('border-transparent', 'bg-transparent', 'text-gray-400');
    });

    const activePanel = document.getElementById(`admin-panel-${tabId}`);
    const activeTab = document.getElementById(`admin-tab-${tabId}`);

    if (activePanel) {
        activePanel.classList.remove('hidden');
    }

    if (activeTab) {
        activeTab.classList.add('active', 'border-blue-400/40', 'bg-white', 'text-gray-950', 'shadow-lg', 'shadow-blue-500/10');
        activeTab.classList.remove('border-transparent', 'bg-transparent', 'text-gray-400');
    }

    if (tabId === 'schedule') {
        _syncScheduleFilterTop();
        _syncScheduleBrowserToCurrentProgress();
    }
    if (tabId === 'verify') fetchAdminKnockoutVerify();
    if (tabId === 'verifytournament') fetchAdminVerifyTournament();
    if (tabId === 'matchsync') {
        // Auto-load on first open (read-only, no execute)
        const rowsEl = document.getElementById('matchsync-rows');
        if (rowsEl && rowsEl.children.length === 1 && rowsEl.firstElementChild?.textContent?.includes('No data loaded')) {
            runMatchSync(false);
        }
    }
    if (tabId === 'manager') {
        // First open: refresh both API + DB cache, then render. Subsequent opens just re-render.
        if (!_managerApiPlanned.length) {
            runManagerSync(true);
        } else {
            _renderMatchManager();
        }
    }
}

function showResultsTab(tabId) {
    const panels = document.querySelectorAll('.results-panel');
    const tabs = document.querySelectorAll('.results-tab');

    panels.forEach((panel) => panel.classList.add('hidden'));
    tabs.forEach((tab) => {
        tab.classList.remove('active', 'style-c-active');
        tab.classList.add('text-gray-500');
    });

    const activePanel = document.getElementById(`results-panel-${tabId}`);
    const activeTab = document.getElementById(`results-tab-${tabId}`);

    if (activePanel) activePanel.classList.remove('hidden');

    if (activeTab) {
        activeTab.classList.add('active', 'style-c-active');
        activeTab.classList.remove('text-gray-500');
    }

    const tabLabels = { groups: 'Results by Group', bracket: 'Bracket', pool: 'Results Table', matches: 'Match Results' };
    const dropdownLabel = document.getElementById('results-tab-dropdown-label');
    const dropdownPanel = document.getElementById('results-tab-dropdown-panel');
    const dropdownChevron = document.getElementById('results-tab-dropdown-chevron');
    if (dropdownLabel) dropdownLabel.textContent = tabLabels[tabId] || tabId;
    if (dropdownPanel) { dropdownPanel.classList.add('hidden'); dropdownPanel.classList.remove('open'); }
    if (dropdownChevron) dropdownChevron.style.transform = '';
    document.querySelectorAll('.results-tab-option').forEach((btn) => {
        const isActive = btn.dataset.tab === tabId;
        btn.classList.toggle('inactive', !isActive);
    });
}

function toggleResultsTabDropdown() {
    const panel = document.getElementById('results-tab-dropdown-panel');
    const chevron = document.getElementById('results-tab-dropdown-chevron');
    if (!panel) return;
    const isOpen = !panel.classList.contains('hidden');
    if (isOpen) {
        panel.classList.add('hidden');
        panel.classList.remove('open');
        chevron.style.transform = '';
    } else {
        panel.classList.remove('hidden');
        panel.classList.add('open');
        chevron.style.transform = 'rotate(180deg)';
    }
}

document.addEventListener('click', (e) => {
    const wrap = document.getElementById('results-tab-dropdown-wrap');
    if (!wrap || wrap.contains(e.target)) return;
    const panel = document.getElementById('results-tab-dropdown-panel');
    const chevron = document.getElementById('results-tab-dropdown-chevron');
    if (panel) { panel.classList.add('hidden'); panel.classList.remove('open'); }
    if (chevron) chevron.style.transform = '';
});

function setupResultsPage() {
    updateResultsSelectionVisibility();
    showResultsTab('groups');
    renderGroups();
    renderKnockoutBracket([]);
    fetchPublicResults();
    fetchPublicTeamResults();
}

function setupStatsPage() {
    fetchSelectionMap();
    renderMapIfNeeded();
    syncMapPanelHeight();
    syncMapSearchPlaceholder();
}

function syncMapPanelHeight() {
    const mapCard = document.getElementById('map-aspect-card');
    const leftPanel = document.getElementById('map-left-panel');
    if (!mapCard || !leftPanel) return;
    const h = mapCard.getBoundingClientRect().bottom - leftPanel.getBoundingClientRect().top;
    if (h > 0) leftPanel.style.height = h + 'px';
}

function syncMapSearchPlaceholder() {
    const input = document.getElementById('map-country-search-input');
    if (!input) return;
    input.placeholder = window.innerWidth >= 768 ? 'Select a team…' : 'Team…';
}

window.addEventListener('resize', () => { syncMapPanelHeight(); syncMapSearchPlaceholder(); });

function escapeCsvValue(value) {
    const stringValue = value == null ? '' : String(value);
    if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

function downloadCsv(filename, rows) {
    const csv = rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

async function exportAllTablesXlsx() {
    const button = document.getElementById('admin-export-all-btn');
    const tables = [
        'profiles', 'picks', 'matches', 'messages', 'message_reactions',
        'notifications', 'app_settings', 'team_advancement', 'admins', 'planner_photos'
    ];

    if (button) {
        button.disabled = true;
        button.textContent = 'Exporting...';
    }

    try {
        if (typeof XLSX === 'undefined') {
            throw new Error('Spreadsheet library failed to load. Check your connection and retry.');
        }

        const workbook = XLSX.utils.book_new();

        for (const tableName of tables) {
            const { data, error } = await supabaseClient.from(tableName).select('*'); // read only
            if (error) {
                throw error;
            }

            const rows = data || [];
            const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

            // Flatten nested objects/arrays (e.g. picked teams) to JSON text so each cell
            // holds a plain value rather than "[object Object]".
            const sheetData = rows.map((row) =>
                headers.reduce((acc, key) => {
                    const v = row[key];
                    acc[key] = (v !== null && typeof v === 'object') ? JSON.stringify(v) : v;
                    return acc;
                }, {})
            );

            const worksheet = rows.length > 0
                ? XLSX.utils.json_to_sheet(sheetData, { header: headers })
                : XLSX.utils.aoa_to_sheet([['(no rows)']]);

            // Sheet names: max 31 chars, no Excel-illegal chars — table names are safe.
            XLSX.utils.book_append_sheet(workbook, worksheet, tableName.slice(0, 31));
        }

        const stamp = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `wc-pool-backup-${stamp}.xlsx`);
        showToast('Backup downloaded.', 'success');
    } catch (error) {
        showToast(error.message || 'Unable to export data.');
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = 'Export XLSX Backup';
        }
    }
}

async function sendAdminNotification() {
    const textarea = document.getElementById('admin-notification-message');
    const button = document.getElementById('admin-send-notification-btn');
    const message = textarea?.value.trim();

    if (!message) {
        showToast('Enter a message first.');
        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent = 'Sending...';
    }

    try {
        const { error } = await supabaseClient
            .from('notifications')
            .insert([{
                message,
                created_by: userEmail || 'commissioner'
            }]);

        if (error) {
            throw error;
        }

        if (textarea) {
            textarea.value = '';
        }

        fetchAdminNotifications();
        showToast('Notification sent.', 'success');
        // Mirror to chat so users who have it open see the notification immediately.
        postSystemMessage('admin_notification', `📢 ${message}`);
    } catch (error) {
        showToast(error.message || 'Unable to send notification.');
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = 'Send Notification';
        }
    }
}

function formatNotificationDate(timestamp) {
    if (!timestamp) {
        return '-';
    }

    return new Date(timestamp).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

async function fetchAdminNotifications() {
    const body = document.getElementById('admin-notifications-body');
    if (!body) {
        return;
    }

    body.innerHTML = '<tr><td colspan="3" class="px-5 py-8 text-center text-gray-500 uppercase text-xs">Loading notifications...</td></tr>';

    try {
        const { data, error } = await supabaseClient
            .from('notifications')
            .select('id, message, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        body.innerHTML = (data || []).map((notification) => `
            <tr class="border-t border-gray-800">
                <td class="px-5 py-4 align-top whitespace-nowrap text-gray-300">${formatNotificationDate(notification.created_at)}</td>
                <td class="px-5 py-4 align-top text-white">${notification.message}</td>
                <td class="px-5 py-4 align-top text-right">
                    <button onclick="deleteAdminNotification(${notification.id})" class="rounded-xl bg-red-600 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-red-500">X</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="3" class="px-5 py-8 text-center text-gray-500 uppercase text-xs">No notifications sent yet.</td></tr>';
    } catch (error) {
        body.innerHTML = '<tr><td colspan="3" class="px-5 py-8 text-center text-red-400 uppercase text-xs">Could not load notifications.</td></tr>';
    }
}

async function deleteAdminNotification(id) {
    const shouldDelete = await showConfirmModal({
        label: 'Delete',
        icon: '🗑️',
        title: 'Delete Notification?',
        message: 'This removes the popup from future delivery.',
        detail: 'Players who already saw it will not be affected.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
    });

    if (!shouldDelete) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('notifications')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        fetchAdminNotifications();
        showToast('Notification deleted.', 'success');
    } catch (error) {
        showToast(error.message || 'Unable to delete notification.');
    }
}

async function togglePicksLock(checked) {
    try {
        await saveAppSettings({
            picksLocked: checked,
            autoLockAtKickoff: appSettings.autoLockAtKickoff,
            hideTeamSelection: appSettings.hideTeamSelection,
            hidePlayerChips: appSettings.hidePlayerChips
        });
        syncAdminToggleControls();
        renderPool();
        updateUI();
        showToast(checked ? 'Picks locked.' : 'Picks unlocked.', 'success');
    } catch (error) {
        syncAdminToggleControls();
        showToast(error.message || 'Unable to update picks lock.');
    }
}

async function toggleAutoLock(checked) {
    try {
        await saveAppSettings({
            picksLocked: appSettings.picksLocked,
            autoLockAtKickoff: checked,
            hideTeamSelection: appSettings.hideTeamSelection,
            hidePlayerChips: appSettings.hidePlayerChips
        });
        syncAdminToggleControls();
        showToast(checked ? 'Auto-lock enabled.' : 'Auto-lock disabled.', 'success');
    } catch (error) {
        syncAdminToggleControls();
        showToast(error.message || 'Unable to update auto-lock.');
    }
}

async function toggleHideTeamSelection(checked) {
    try {
        await saveAppSettings({
            picksLocked: appSettings.picksLocked,
            autoLockAtKickoff: appSettings.autoLockAtKickoff,
            hideTeamSelection: checked,
            hidePlayerChips: appSettings.hidePlayerChips
        });
        syncAdminToggleControls();
        applyPublicVisibilityStyles();
        setupDashboard();
        fetchLeaderboard();
        updateResultsSelectionVisibility();
        fetchPublicResults();
        fetchPublicTeamResults();
        fetchPublicSelectionStats();
        showToast(checked ? 'Team selection hidden.' : 'Team selection visible.', 'success');
    } catch (error) {
        syncAdminToggleControls();
        showToast(error.message || 'Unable to update team visibility.');
    }
}

async function toggleHidePlayerChips(checked) {
    try {
        await saveAppSettings({
            picksLocked: appSettings.picksLocked,
            autoLockAtKickoff: appSettings.autoLockAtKickoff,
            hideTeamSelection: appSettings.hideTeamSelection,
            hidePlayerChips: checked
        });
        syncAdminToggleControls();
        setupDashboard();
        fetchLeaderboard();
        showToast(checked ? 'Player chips hidden.' : 'Player chips visible.', 'success');
    } catch (error) {
        syncAdminToggleControls();
        showToast(error.message || 'Unable to update chip visibility.');
    }
}

function _buildDerivedTeamStatusRows(matches) {
    const statusByTeam = new Map(
        teams
            .filter((team) => team.qualified !== false)
            .map((team) => [team.name, { team_name: team.name, advanced_to_knockouts: false, eliminated: false }])
    );

    const standings = computeGroupStandings(matches);
    const bestThirdAssignments = _buildBestThirdAssignments(standings);
    const qualifiedBestThirdTeams = new Set([...bestThirdAssignments.values()].map((team) => team.name));
    const thirdPlaceResolved = bestThirdAssignments.size === _getBestThirdSlots().length;

    Object.values(standings).forEach((group) => {
        if (group.status !== 'complete') return;
        const [first, second, third, fourth] = group.teams;
        if (first && statusByTeam.has(first.name)) statusByTeam.get(first.name).advanced_to_knockouts = true;
        if (second && statusByTeam.has(second.name)) statusByTeam.get(second.name).advanced_to_knockouts = true;
        if (fourth && statusByTeam.has(fourth.name)) statusByTeam.get(fourth.name).eliminated = true;

        if (third && statusByTeam.has(third.name) && thirdPlaceResolved) {
            const thirdStatus = statusByTeam.get(third.name);
            if (qualifiedBestThirdTeams.has(third.name)) thirdStatus.advanced_to_knockouts = true;
            else thirdStatus.eliminated = true;
        }
    });

    matches
        .filter((match) => match.stage !== 'Group' && _hasFinalScore(match) && match.score_home !== match.score_away)
        .forEach((match) => {
            const loser = match.score_home > match.score_away ? match.team_away : match.team_home;
            if (statusByTeam.has(loser)) statusByTeam.get(loser).eliminated = true;
        });

    return [...statusByTeam.values()];
}

async function syncDerivedTeamStatus(options = {}) {
    const { silent = false } = options;
    const { data, error } = await supabaseClient
        .from('matches')
        .select('*');

    if (error) throw error;

    const derivedRows = _buildDerivedTeamStatusRows(data || []);
    const { error: upsertError } = await supabaseClient
        .from('team_advancement')
        .upsert(derivedRows, { onConflict: 'team_name' });

    if (upsertError) throw upsertError;

    await fetchAdvancedTeams();
    await fetchAdminAdvancement();
    fetchLeaderboard();
    fetchPublicTeamResults();
    setupDashboard();

    if (!silent) {
        showToast('Team status synced from results.', 'success');
    }
}

async function toggleAutoTeamStatusSync(checked) {
    const previousValue = Boolean(appSettings.autoTeamStatusSync);
    try {
        await saveAppSettings({
            picksLocked: appSettings.picksLocked,
            autoLockAtKickoff: appSettings.autoLockAtKickoff,
            hideTeamSelection: appSettings.hideTeamSelection,
            hidePlayerChips: appSettings.hidePlayerChips,
            autoTeamStatusSync: checked
        });
        syncAdminToggleControls();

        if (checked) {
            await syncDerivedTeamStatus({ silent: true });
            showToast('Auto team sync enabled.', 'success');
        } else {
            showToast('Auto team sync disabled.', 'success');
        }
    } catch (error) {
        appSettings.autoTeamStatusSync = previousValue;
        if (checked && previousValue !== checked) {
            try {
                await saveAppSettings({
                    picksLocked: appSettings.picksLocked,
                    autoLockAtKickoff: appSettings.autoLockAtKickoff,
                    hideTeamSelection: appSettings.hideTeamSelection,
                    hidePlayerChips: appSettings.hidePlayerChips,
                    autoTeamStatusSync: previousValue
                });
            } catch (_rollbackError) {
                appSettings.autoTeamStatusSync = previousValue;
            }
        }
        syncAdminToggleControls();
        showToast(error.message || 'Unable to update auto team sync.');
    }
}

function updateResultsSelectionVisibility() {
    const selectionTab = document.getElementById('results-tab-selection');
    const selectionColumns = document.querySelectorAll('.results-selection-column');
    const selectionLocked = document.getElementById('results-selection-locked');
    const selectionContent = document.getElementById('results-selection-content');

    if (selectionTab) {
        selectionTab.classList.remove('hidden');
    }

    selectionColumns.forEach((column) => {
        column.classList.toggle('hidden', Boolean(appSettings.hideTeamSelection));
    });

    if (selectionLocked) {
        selectionLocked.classList.toggle('hidden', !appSettings.hideTeamSelection);
    }

    if (selectionContent) {
        selectionContent.classList.toggle('hidden', Boolean(appSettings.hideTeamSelection));
    }

    const sortState = teamResultsSortState['public-team-results-body'];
    if (appSettings.hideTeamSelection && sortState?.key === 'pickedPct') {
        sortState.key = 'team';
        sortState.direction = 'asc';
    }
}

function buildSelectionStatsSnapshot(picks = [], profiles = []) {
    const playersInPool = new Set((profiles || []).map((profile) => profile.email).filter(Boolean));
    const uniquePickUsers = new Set();
    const countryCounts = {};
    const userRosterSizes = {};
    const groupCounts = {};
    const pickedUsersByTeam = new Map();

    (picks || []).forEach((pick) => {
        if (!pick?.team_name || !pick?.user_email) {
            return;
        }

        uniquePickUsers.add(pick.user_email);
        countryCounts[pick.team_name] = (countryCounts[pick.team_name] || 0) + 1;
        userRosterSizes[pick.user_email] = (userRosterSizes[pick.user_email] || 0) + 1;

        if (!pickedUsersByTeam.has(pick.team_name)) {
            pickedUsersByTeam.set(pick.team_name, new Set());
        }
        pickedUsersByTeam.get(pick.team_name).add(pick.user_email);

        const teamData = teams.find((team) => team.name === pick.team_name);
        if (teamData?.group) {
            groupCounts[teamData.group] = (groupCounts[teamData.group] || 0) + 1;
        }
    });

    const totalPlayers = playersInPool.size || uniquePickUsers.size;
    const sortedCountryCounts = Object.entries(countryCounts)
        .map(([teamName, count]) => {
            const teamData = teams.find((team) => team.name === teamName);
            const pickedCount = pickedUsersByTeam.get(teamName)?.size || 0;
            const percentage = totalPlayers > 0 ? Math.round((pickedCount / totalPlayers) * 100) : 0;

            return {
                teamName,
                count,
                pickedCount,
                percentage,
                teamData
            };
        })
        .sort((a, b) => b.count - a.count || a.teamName.localeCompare(b.teamName));

    const densityMap = {};
    Object.values(userRosterSizes).forEach((size) => {
        densityMap[size] = (densityMap[size] || 0) + 1;
    });

    const rosterDensityEntries = Object.entries(densityMap)
        .map(([size, count]) => ({ size: Number(size), count }))
        .sort((a, b) => b.size - a.size);

    const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const groupDensityEntries = groupLetters
        .map((group) => ({
            group,
            count: groupCounts[group] || 0
        }))
        .sort((a, b) => b.count - a.count || a.group.localeCompare(b.group));
    const maxGroupCount = Math.max(1, ...groupDensityEntries.map((entry) => entry.count));

    return {
        totalPlayers,
        sortedCountryCounts,
        rosterDensityEntries,
        groupDensityEntries,
        maxGroupCount
    };
}

const selectionMapPositions = {
    Canada: { x: 16, y: 19 },
    USA: { x: 18, y: 31 },
    Mexico: { x: 15, y: 41 },
    Panama: { x: 22, y: 49 },
    Curacao: { x: 26, y: 44 },
    Colombia: { x: 28, y: 55 },
    Ecuador: { x: 25, y: 63 },
    Paraguay: { x: 31, y: 71 },
    Uruguay: { x: 34, y: 78 },
    Argentina: { x: 31, y: 86 },
    Brazil: { x: 37, y: 65 },
    Morocco: { x: 48, y: 32 },
    Algeria: { x: 50, y: 29 },
    Tunisia: { x: 53, y: 30 },
    Egypt: { x: 58, y: 31 },
    Senegal: { x: 46, y: 43 },
    'Ivory Coast': { x: 48, y: 46 },
    Ghana: { x: 50, y: 49 },
    'Cape Verde': { x: 40, y: 41 },
    England: { x: 47, y: 18 },
    Scotland: { x: 46, y: 13 },
    Ireland: { x: 43, y: 18 },
    France: { x: 49, y: 22 },
    Belgium: { x: 50, y: 19 },
    Netherlands: { x: 50, y: 16 },
    Germany: { x: 54, y: 18 },
    Switzerland: { x: 52, y: 23 },
    Austria: { x: 55, y: 22 },
    Croatia: { x: 56, y: 25 },
    Bosnia: { x: 57, y: 24 },
    Czechia: { x: 55, y: 19 },
    Sweden: { x: 54, y: 10 },
    Norway: { x: 52, y: 6 },
    Portugal: { x: 43, y: 25 },
    Spain: { x: 45, y: 24 },
    Italy: { x: 54, y: 27 },
    'South Africa': { x: 53, y: 83 },
    'Saudi Arabia': { x: 64, y: 35 },
    Qatar: { x: 66, y: 38 },
    Iraq: { x: 66, y: 32 },
    Iran: { x: 70, y: 30 },
    Turkiye: { x: 60, y: 24 },
    Jordan: { x: 63, y: 33 },
    'DR Congo': { x: 56, y: 58 },
    Uzbekistan: { x: 76, y: 24 },
    India: { x: 76, y: 43 },
    Japan: { x: 88, y: 31 },
    'South Korea': { x: 85, y: 28 },
    Australia: { x: 84, y: 78 },
    'New Zealand': { x: 92, y: 87 },
    Haiti: { x: 24, y: 38 }
};

function escapeSvgText(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderSelectionBarRows(entries, options = {}) {
    const {
        emptyMessage = 'No selection data yet.',
        valueFormatter = (entry) => String(entry.value ?? 0),
        subFormatter = () => '',
        labelFormatter = (entry) => entry.label,
        iconFormatter = () => '',
        maxValue = 1,
        theme = 'percent'
    } = options;

    if (!entries.length) {
        return `<div class="px-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">${emptyMessage}</div>`;
    }

    const accentTokens = getActiveThemeAccentTokens();
    const safeMax = Math.max(1, maxValue);
    const fillOpacity = theme === 'volume' ? 0.94 : 0.9;
    const barFill = `linear-gradient(90deg, ${rgbaFromHex(accentTokens.primary, fillOpacity)} 0%, ${rgbaFromHex(accentTokens.primary, Math.max(0.72, fillOpacity - 0.12))} 100%)`;

    return `
        <div class="space-y-3">
            ${entries.map((entry) => {
                const widthPercent = Math.max(8, Math.round(((entry.value ?? 0) / safeMax) * 100));
                const label = escapeSvgText(labelFormatter(entry));
                const sub = escapeSvgText(subFormatter(entry));
                const value = escapeSvgText(valueFormatter(entry));
                const icon = escapeSvgText(iconFormatter(entry));

                return `
                    <div class="space-y-2">
                        <div class="flex items-start justify-between gap-4">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2">
                                    ${icon ? `<span class="text-base leading-none">${icon}</span>` : ''}
                                    <div class="truncate text-[15px] font-black uppercase tracking-[0.05em] text-gray-900">${label}</div>
                                </div>
                                <div class="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">${sub}</div>
                            </div>
                            <div class="shrink-0 text-right text-[15px] font-black uppercase leading-none tracking-[0.05em] text-gray-900">${value}</div>
                        </div>
                        <div class="h-2 rounded-full bg-gray-100">
                            <div class="h-2 rounded-full" style="width:${widthPercent}%; background:${barFill}"></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderSelectionBarChart(entries, options = {}) {
    return renderSelectionBarRows(entries, options);
}

async function fetchPublicSelectionStats() {
    const lockedState = document.getElementById('results-selection-locked');
    const content = document.getElementById('results-selection-content');
    const entryCount = document.getElementById('public-selection-entry-count');
    const countryBox = document.getElementById('public-country-pick-stats');
    const rosterBox = document.getElementById('public-roster-size-stats');
    const groupBox = document.getElementById('public-group-density-stats');
    if (!countryBox || !rosterBox || !groupBox || !entryCount) {
        return;
    }

    if (appSettings.hideTeamSelection) {
        if (lockedState) lockedState.classList.remove('hidden');
        if (content) content.classList.add('hidden');
        return;
    }

    if (lockedState) lockedState.classList.add('hidden');
    if (content) content.classList.remove('hidden');

    entryCount.textContent = '...';
    countryBox.innerHTML = '<div class="px-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading selection leaders...</div>';
    rosterBox.innerHTML = '<div class="px-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading roster density...</div>';
    groupBox.innerHTML = '<div class="px-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading group density...</div>';

    try {
        const [
            { data: picks, error: picksError },
            { data: profiles, error: profilesError }
        ] = await Promise.all([
            supabaseClient.from('picks').select('team_name, user_email'),
            supabaseClient.from('profiles').select('email')
        ]);

        if (picksError) throw picksError;
        if (profilesError) throw profilesError;

        const stats = buildSelectionStatsSnapshot(picks || [], profiles || []);
        entryCount.textContent = stats.totalPlayers;

        countryBox.innerHTML = renderSelectionBarRows(stats.sortedCountryCounts.slice(0, 8).map((entry) => ({
            ...entry,
            label: entry.teamName,
            value: entry.percentage
        })), {
            emptyMessage: 'No saved picks yet.',
            maxValue: Math.max(1, ...stats.sortedCountryCounts.slice(0, 8).map((entry) => entry.percentage)),
            valueFormatter: (entry) => `${entry.percentage}%`,
            subFormatter: (entry) => `${entry.pickedCount} ${entry.pickedCount === 1 ? 'picked' : 'picked'} · ${entry.count} total picks`,
            labelFormatter: (entry) => entry.teamName,
            iconFormatter: (entry) => entry.teamData?.flag || ''
        });

        rosterBox.innerHTML = renderSelectionBarRows(stats.rosterDensityEntries.map((entry) => ({
            ...entry,
            label: `${entry.size} Picks`,
            value: entry.count
        })), {
            emptyMessage: 'No roster density yet.',
            maxValue: Math.max(1, ...stats.rosterDensityEntries.map((entry) => entry.count)),
            valueFormatter: (entry) => `${entry.count}`,
            subFormatter: (entry) => `${entry.count === 1 ? '1 player' : `${entry.count} players`}`,
            labelFormatter: (entry) => `${entry.size} Picks`
        });

        groupBox.innerHTML = renderSelectionBarRows(stats.groupDensityEntries.map((entry) => ({
            ...entry,
            label: `Group ${entry.group}`,
            value: entry.count
        })), {
            emptyMessage: 'No group density yet.',
            maxValue: stats.maxGroupCount,
            valueFormatter: (entry) => `${entry.count}`,
            subFormatter: (entry) => `${entry.count === 1 ? '1 selection' : `${entry.count} selections`}`,
            labelFormatter: (entry) => `Group ${entry.group}`
        });
    } catch (error) {
        countryBox.innerHTML = '<div class="px-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Could not load selection stats.</div>';
        rosterBox.innerHTML = '<div class="px-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Could not load roster density.</div>';
        groupBox.innerHTML = '<div class="px-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Could not load group density.</div>';
        entryCount.textContent = '0';
    }
}

const TEAM_ISO_NUMERIC = {
    Canada: 124, USA: 840, Mexico: 484, Panama: 591, Curacao: 531,
    Colombia: 170, Ecuador: 218, Paraguay: 600, Uruguay: 858, Argentina: 32, Brazil: 76, Haiti: 332,
    Morocco: 504, Algeria: 12, Tunisia: 788, Egypt: 818, Senegal: 686,
    'Ivory Coast': 384, Ghana: 288, 'Cape Verde': 132, 'South Africa': 710, 'DR Congo': 180,
    England: 826, Scotland: 826, Ireland: 372, France: 250, Belgium: 56,
    Netherlands: 528, Germany: 276, Switzerland: 756, Austria: 40,
    Croatia: 191, Bosnia: 70, Czechia: 203, Sweden: 752, Norway: 578,
    Portugal: 620, Spain: 724, Italy: 380,
    Turkiye: 792, 'Saudi Arabia': 682, Qatar: 634, Iraq: 368, Iran: 364, Jordan: 400,
    Uzbekistan: 860, India: 356, Japan: 392, 'South Korea': 410,
    Australia: 36, 'New Zealand': 554,
};

let _mapCachedData = null;
let _mapState = null;
let _highlightedIso = null;
let _highlightedGroup = null;
let _mapColorMode = 'ownership'; // 'ownership' | 'groups'
let _mapTableSort = 'picked'; // 'picked' | 'points' | 'goals'

const _STAGE_MULT = { Group: 1, R32: 2, R16: 3, QF: 5, Semi: 8, Final: 12, Third: 8 };

function buildTeamMatchStats(matches) {
    const stats = {};
    (matches || []).forEach((m) => {
        if (m.score_home == null || m.score_away == null) return;
        const mult = _STAGE_MULT[m.stage] || 1;
        const h = +m.score_home, a = +m.score_away;
        if (!stats[m.team_home]) stats[m.team_home] = { goals: 0, poolPoints: 0 };
        if (!stats[m.team_away]) stats[m.team_away] = { goals: 0, poolPoints: 0 };
        stats[m.team_home].goals += h;
        stats[m.team_home].poolPoints += h > a ? 3 * mult : h === a ? 1 * mult : 0;
        stats[m.team_away].goals += a;
        stats[m.team_away].poolPoints += a > h ? 3 * mult : a === h ? 1 * mult : 0;
    });
    return stats;
}

function setMapTableSort(sort) {
    const hideOwnership = Boolean(appSettings.hideTeamSelection);
    if (hideOwnership && sort === 'picked') sort = 'points';
    _mapTableSort = sort;
    document.querySelectorAll('.map-sort-btn').forEach((btn) => {
        const active = btn.dataset.sort === sort;
        btn.classList.toggle('bg-white', active);
        btn.classList.toggle('shadow-sm', active);
        btn.classList.toggle('text-gray-900', active);
        btn.classList.toggle('text-gray-500', !active);
        if (btn.dataset.sort === 'picked') btn.classList.toggle('hidden', hideOwnership);
    });
    renderMapSideTable();
}

function _matchResult(m, teamName) {
    if (!_hasFinalScore(m)) return null;
    const mult = _STAGE_MULT[m.stage] || 1;
    const isHome = m.team_home === teamName;
    const scored = isHome ? +m.score_home : +m.score_away;
    const conceded = isHome ? +m.score_away : +m.score_home;
    if (scored > conceded) return { result: 'W', pts: 3 * mult };
    if (scored === conceded) return { result: 'D', pts: mult };
    return { result: 'L', pts: 0 };
}

function _matchRowHtml(m, teamNames) {
    const played = _hasFinalScore(m);
    const homeT = teams.find((t) => t.name === m.team_home);
    const awayT = teams.find((t) => t.name === m.team_away);
    const hHighlight = teamNames.has(m.team_home);
    const aHighlight = teamNames.has(m.team_away);

    const scoreEl = played
        ? `<span class="text-sm font-black text-gray-900 tabular-nums">${m.score_home}–${m.score_away}</span>`
        : `<span class="text-[10px] font-black text-gray-300">vs</span>`;

    const stageLabel = m.stage === 'Group'
        ? `Group ${m.group || ''}`
        : (m.stage || '');

    let ptsHtml = '';
    if (played && (hHighlight || aHighlight)) {
        const isDraw = m.score_home === m.score_away;
        const multiplier = { Group: 1, R32: 2, R16: 3, Quarters: 5, Semis: 8, Finals: 12 }[m.stage] || 1;
        if (isDraw) {
            ptsHtml = `<div class="text-[9px] text-gray-400 mt-0.5 text-center">1 pt each</div>`;
        } else {
            const winner = m.score_home > m.score_away ? m.team_home : m.team_away;
            if (teamNames.has(winner)) {
                ptsHtml = `<div class="text-[9px] text-gray-400 mt-0.5 text-center">${3 * multiplier} pts awarded</div>`;
            }
        }
    }

    return `
        <div class="py-2 px-1 rounded-xl hover:bg-gray-50 transition-colors">
            <div class="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 text-center mb-1">${stageLabel}</div>
            <div class="flex items-center gap-1">
                <div class="flex items-center gap-1 flex-1 justify-end min-w-0">
                    <span class="text-[10px] font-black text-gray-900 truncate">${escapeHtml(m.team_home)}</span>
                    <span class="shrink-0 text-base leading-none">${homeT?.flag || ''}</span>
                </div>
                <div class="shrink-0 w-9 text-center">${scoreEl}</div>
                <div class="flex items-center gap-1 flex-1 min-w-0">
                    <span class="shrink-0 text-base leading-none">${awayT?.flag || ''}</span>
                    <span class="text-[10px] font-black text-gray-900 truncate">${escapeHtml(m.team_away)}</span>
                </div>
            </div>
            ${ptsHtml}
        </div>`;
}

function renderMapSideTable() {
    const containers = document.querySelectorAll('.map-side-table-content');
    if (!containers.length || !_mapCachedData) return;

    const { stats, matchStats, matchRows } = _mapCachedData;
    const accentTokens = getActiveThemeAccentTokens();
    const accentColor = accentTokens.primary;

    // Determine which teams to show
    let visibleTeams;
    let titleText = 'All Teams';
    if (_highlightedGroup) {
        visibleTeams = teams.filter((t) => t.qualified !== false && t.group === _highlightedGroup);
        titleText = `Group ${_highlightedGroup}`;
    } else if (_highlightedIso !== null) {
        visibleTeams = teams.filter((t) => t.qualified !== false && TEAM_ISO_NUMERIC[t.name] === _highlightedIso);
        titleText = visibleTeams[0]?.name || 'Team';
    } else if (_mapColorMode === 'me') {
        const myPickNames = new Set((myPicks || []).map((p) => p.name || p));
        visibleTeams = teams.filter((t) => myPickNames.has(t.name));
        titleText = 'My Picks';
    } else {
        visibleTeams = teams.filter((t) => t.qualified !== false);
    }

    document.querySelectorAll('.map-table-title').forEach((el) => { el.textContent = titleText; });

    // ── Matches view ─────────────────────────────────────────────────────────
    if (_mapTableSort === 'matches') {
        const teamNames = new Set(visibleTeams.map((t) => t.name));
        if (teamNames.size === 0) {
            const msg = '<div class="px-4 py-6 text-center text-[10px] text-gray-400 uppercase font-black tracking-widest">Select a team or group</div>';
            containers.forEach((el) => { el.innerHTML = msg; });
            return;
        }
        const all = (matchRows || []).filter((m) => teamNames.has(m.team_home) || teamNames.has(m.team_away));
        const upcoming = all
            .filter((m) => m.score_home == null || m.score_away == null)
            .sort((a, b) => (a.match_date_manual || '').localeCompare(b.match_date_manual || ''))
            .slice(0, 3);
        const previous = all
            .filter((m) => m.score_home != null && m.score_away != null)
            .sort((a, b) => (b.match_date_manual || '').localeCompare(a.match_date_manual || ''));

        if (!all.length) {
            containers.forEach((el) => { el.innerHTML = '<div class="px-4 py-6 text-center text-[10px] text-gray-400 uppercase font-black tracking-widest">No matches</div>'; });
            return;
        }

        const dateHeader = (dateStr) =>
            `<div class="flex items-center gap-2 px-1 pt-3 pb-1">
                <div class="flex-1 h-px bg-gray-100"></div>
                <span class="text-[8px] font-black uppercase tracking-[0.2em] text-gray-300 shrink-0">${dateStr}</span>
                <div class="flex-1 h-px bg-gray-100"></div>
            </div>`;

        const groupByDate = (arr) => {
            const groups = [];
            let lastDate = null;
            arr.forEach((m) => {
                const d = m.match_date_manual
                    ? new Date(m.match_date_manual + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                    : 'TBD';
                if (d !== lastDate) { groups.push({ date: d, matches: [] }); lastDate = d; }
                groups[groups.length - 1].matches.push(m);
            });
            return groups;
        };

        let html = '';
        if (upcoming.length) {
            groupByDate(upcoming).forEach(({ date, matches }) => {
                html += dateHeader(date);
                html += matches.map((m) => _matchRowHtml(m, teamNames)).join('');
            });
        }
        if (previous.length) {
            groupByDate(previous).forEach(({ date, matches }) => {
                html += dateHeader(date);
                html += matches.map((m) => _matchRowHtml(m, teamNames)).join('');
            });
        }
        containers.forEach((el) => { el.innerHTML = html; });
        return;
    }

    // ── Ranked stats view ─────────────────────────────────────────────────────
    const rows = visibleTeams.map((t) => {
        const ownership = stats.sortedCountryCounts.find((e) => e.teamName === t.name);
        const ms = matchStats?.[t.name] || { goals: 0, poolPoints: 0 };
        return {
            team: t,
            picked: ownership?.percentage || 0,
            pickedCount: ownership?.pickedCount || 0,
            points: ms.poolPoints,
            goals: ms.goals,
        };
    });

    rows.sort((a, b) => b[_mapTableSort] - a[_mapTableSort] || a.team.name.localeCompare(b.team.name));

    const maxVal = Math.max(1, ...rows.map((r) => r[_mapTableSort]));
    const tierColors = { 1: 'text-yellow-600', 2: 'text-blue-500', 3: 'text-gray-400' };

    const html = rows.map((row, i) => {
        const val = row[_mapTableSort];
        const barW = Math.max(3, Math.round((val / maxVal) * 100));
        const label = _mapTableSort === 'picked' ? `${val}%` : `${val}`;
        const sub = _mapTableSort === 'picked'
            ? `${row.pickedCount} ${row.pickedCount === 1 ? 'entry' : 'entries'}`
            : _mapTableSort === 'points' ? 'pool pts' : 'goals';
        return `
            <div onclick="showTeamOwners('${row.team.name.replace(/'/g, "\\'")}')"
                 class="flex items-center gap-2.5 rounded-xl px-2.5 py-2 cursor-pointer hover:bg-gray-50 transition-colors">
                <span class="text-[10px] font-black text-gray-300 w-4 shrink-0 text-right">${i + 1}</span>
                <span class="text-xl leading-none shrink-0">${row.team.flag}</span>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5 mb-1">
                        <span class="text-[11px] font-black text-gray-900 truncate">${escapeHtml(row.team.name)}</span>
                        <span class="shrink-0 text-[8px] font-black ${tierColors[row.team.tier] || tierColors[3]}">T${row.team.tier}</span>
                    </div>
                    <div class="h-1 rounded-full bg-gray-100 overflow-hidden">
                        <div class="h-full rounded-full" style="width:${barW}%; background:${accentColor};"></div>
                    </div>
                </div>
                <div class="text-right shrink-0">
                    <div class="text-sm font-black text-gray-900">${label}</div>
                    <div class="text-[9px] text-gray-400">${sub}</div>
                </div>
            </div>`;
    }).join('') || '<div class="px-4 py-6 text-center text-[10px] text-gray-400 uppercase font-black tracking-widest">No data</div>';
    containers.forEach((el) => { el.innerHTML = html; });
}

const GROUP_COLORS = {
    A: '#e63946', B: '#f4a261', C: '#2a9d8f', D: '#457b9d',
    E: '#6a4c93', F: '#f72585', G: '#4cc9f0', H: '#06d6a0',
    I: '#fb8500', J: '#8338ec', K: '#3a86ff', L: '#e9c46a',
};

function _computeMapFill(iso, state) {
    const { isoDataMap, qualifiedIsos, isoToTeamNames, colorFilled, ZERO_PCT, NOT_QUALIFIED, accentColor } = state;

    // Country spotlight
    if (_highlightedIso !== null) {
        let spotColor = accentColor;
        if (_mapColorMode === 'groups') {
            const names = isoToTeamNames[_highlightedIso];
            const team = names && teams.find((t) => names.includes(t.name));
            if (team?.group && GROUP_COLORS[team.group]) spotColor = GROUP_COLORS[team.group];
        }
        const lightTint = d3.interpolateRgb('#ffffff', spotColor)(0.18);
        if (iso === _highlightedIso) return spotColor;
        if (qualifiedIsos.has(iso)) return lightTint;
        return NOT_QUALIFIED;
    }

    // Group spotlight: use that group's own colour in groups mode, accent in ownership mode
    if (_highlightedGroup !== null) {
        const spotColor = (_mapColorMode === 'groups' && GROUP_COLORS[_highlightedGroup])
            ? GROUP_COLORS[_highlightedGroup]
            : accentColor;
        const lightTint = d3.interpolateRgb('#ffffff', spotColor)(0.18);
        const names = isoToTeamNames[iso];
        const inGroup = names && teams.some((t) => names.includes(t.name) && t.group === _highlightedGroup);
        if (inGroup) return spotColor;
        if (qualifiedIsos.has(iso)) return lightTint;
        return NOT_QUALIFIED;
    }

    // My Picks mode — user's teams highlighted, others faded
    if (_mapColorMode === 'me') {
        const picks = myPicks || [];
        const myIsos = new Set(picks.map((t) => TEAM_ISO_NUMERIC[t.name || t]).filter((iso) => iso !== undefined));
        const lightTint = d3.interpolateRgb('#ffffff', accentColor)(0.18);
        if (myIsos.has(iso)) return accentColor;
        if (qualifiedIsos.has(iso)) return lightTint;
        return NOT_QUALIFIED;
    }

    // Groups coloring mode — distinct color per group
    if (_mapColorMode === 'groups') {
        const names = isoToTeamNames[iso];
        if (names) {
            const team = teams.find((t) => names.includes(t.name));
            if (team?.group && GROUP_COLORS[team.group]) return GROUP_COLORS[team.group];
        }
        return NOT_QUALIFIED;
    }

    // Ownership mode — gradient by pick %
    const data = isoDataMap[iso];
    if (data && data.entry.percentage > 0) return colorFilled(data.entry.percentage);
    if (qualifiedIsos.has(iso)) return ZERO_PCT;
    return NOT_QUALIFIED;
}

function repaintMapPaths() {
    if (!_mapState) return;
    const container = document.getElementById('selection-map-container');
    if (!container) return;
    d3.select(container).selectAll('path.country-path')
        .attr('fill', (d) => d ? _computeMapFill(+d.id, _mapState) : _mapState.NOT_QUALIFIED);
}

function setMapColorMode(mode) {
    const hideOwnership = Boolean(appSettings.hideTeamSelection);
    if (hideOwnership && mode === 'ownership') mode = 'me';
    _mapColorMode = mode;
    ['ownership', 'groups', 'me'].forEach((m) => {
        const btn = document.getElementById(`map-mode-${m}`);
        if (!btn) return;
        const active = m === mode;
        btn.classList.toggle('bg-white', active);
        btn.classList.toggle('shadow-sm', active);
        btn.classList.toggle('text-gray-900', active);
        btn.classList.toggle('text-gray-500', !active);
        if (m === 'ownership') btn.classList.toggle('hidden', hideOwnership);
    });
    updateMapLegend();
    repaintMapPaths();
    renderMapSideTable();
}

function updateMapLegend() {
    const owLegend = document.getElementById('map-legend-ownership');
    const grLegend = document.getElementById('map-legend-groups-bar');
    if (!owLegend || !grLegend) return;
    const isGroups = _mapColorMode === 'groups';
    owLegend.style.display = isGroups ? 'none' : '';
    grLegend.style.display = isGroups ? 'flex' : 'none';
    grLegend.style.flexWrap = 'wrap';
    grLegend.style.alignItems = 'center';
    grLegend.style.gap = '12px';
    if (isGroups) {
        const el = document.getElementById('map-legend-groups-items');
        if (el && !el.children.length) {
            el.innerHTML = Object.entries(GROUP_COLORS).map(([g, c]) => `
                <div class="flex items-center gap-1.5">
                    <span class="inline-block w-4 h-4 rounded" style="background:${c};"></span>
                    <span class="text-xs font-bold text-gray-600">Group&nbsp;${g}</span>
                </div>
            `).join('');
        }
    }
}

function selectMapCountry(teamName) {
    const iso = TEAM_ISO_NUMERIC[teamName];
    _highlightedIso = (iso !== undefined) ? iso : null;
    _highlightedGroup = null;
    _syncGroupHighlightUI();
    const team = teams.find((t) => t.name === teamName);
    const input = document.getElementById('map-country-search-input');
    if (input) input.value = team ? `${team.flag} ${teamName}` : teamName;
    document.getElementById('map-country-search-clear')?.classList.remove('hidden');
    document.getElementById('map-country-search-dropdown')?.classList.add('hidden');
    repaintMapPaths();
    renderMapSideTable();
}

function clearMapCountrySearch() {
    const input = document.getElementById('map-country-search-input');
    if (input) input.value = '';
    document.getElementById('map-country-search-clear')?.classList.add('hidden');
    document.getElementById('map-country-search-dropdown')?.classList.add('hidden');
    _highlightedIso = null;
    _highlightedGroup = null;
    _syncGroupHighlightUI();
    repaintMapPaths();
    renderMapSideTable();
}

function openMapCountrySearch() {
    const input = document.getElementById('map-country-search-input');
    if (input) input.value = '';
    filterMapCountrySearch('');
}

function filterMapCountrySearch(query) {
    const dd = document.getElementById('map-country-search-dropdown');
    if (!dd) return;
    // Strip emoji/non-ASCII so "🇧🇷 Brazil" still matches after re-focus clears
    const q = query.replace(/[^\x20-\x7E]/g, '').trim().toLowerCase();
    const qualified = teams.filter((t) => t.qualified !== false)
        .sort((a, b) => a.name.localeCompare(b.name));
    const matches = q ? qualified.filter((t) => t.name.toLowerCase().includes(q)) : qualified;
    dd.innerHTML = matches.map((t) => `
        <div class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
             onmousedown="selectMapCountry('${t.name.replace(/'/g, "\\'")}')">
            <span class="text-lg leading-none">${t.flag}</span>
            <span class="text-sm font-bold text-gray-800">${escapeHtml(t.name)}</span>
        </div>
    `).join('') || '<div class="px-4 py-3 text-sm text-gray-400">No matches</div>';
    dd.classList.remove('hidden');
}

function closeMapCountrySearch() {
    document.getElementById('map-country-search-dropdown')?.classList.add('hidden');
}

function _syncGroupHighlightUI() {
    document.querySelectorAll('[data-group-heat]').forEach((el) => {
        const isActive = el.dataset.groupHeat === _highlightedGroup;
        el.style.outline = isActive ? '3px solid #fbbf24' : '';
        el.style.outlineOffset = isActive ? '2px' : '';
    });
    document.querySelectorAll('[data-group-btn]').forEach((el) => {
        const isActive = el.dataset.groupBtn === _highlightedGroup;
        el.classList.toggle('bg-white', isActive);
        el.classList.toggle('shadow-sm', isActive);
        el.classList.toggle('text-gray-900', isActive);
        el.classList.toggle('text-gray-500', !isActive);
    });
}

function selectMapGroup(groupName) {
    _highlightedGroup = (_highlightedGroup === groupName) ? null : groupName;
    _highlightedIso = null;
    const input = document.getElementById('map-country-search-input');
    if (input) input.value = '';
    document.getElementById('map-country-search-clear')?.classList.add('hidden');
    _syncGroupHighlightUI();
    repaintMapPaths();
    renderMapSideTable();
    if (_highlightedGroup) {
        document.getElementById('selection-map-container')
            ?.closest('[style*="aspect-ratio"]')
            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

async function fetchSelectionMap() {
    const loading = document.getElementById('selection-map-loading');
    if (appSettings.hideTeamSelection) {
        if (loading) loading.textContent = 'Map visible once the World Cup starts.';
        return;
    }

    try {
        const [
            { data: picks, error: picksError },
            { data: profiles, error: profilesError },
            { data: matchRows, error: matchesError },
            worldData
        ] = await Promise.all([
            supabaseClient.from('picks').select('team_name, user_email'),
            supabaseClient.from('profiles').select('email'),
            supabaseClient.from('matches').select('team_home, team_away, score_home, score_away, stage'),
            fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((r) => r.json())
        ]);
        if (picksError) throw picksError;
        if (profilesError) throw profilesError;
        // matchesError is non-fatal — table may be empty pre-tournament

        const stats = buildSelectionStatsSnapshot(picks || [], profiles || []);
        const matchStats = buildTeamMatchStats(matchRows || []);
        _mapCachedData = { stats, worldData, matchStats, matchRows: matchRows || [] };

        const container = document.getElementById('selection-map-container');
        if (container && !container.querySelector('svg')) {
            if (loading) loading.classList.add('hidden');
            renderChoroplethMap(stats, worldData);
        }
    } catch (err) {
        if (loading) loading.textContent = 'Could not load map.';
    }
}

function renderMapIfNeeded() {
    if (!_mapCachedData) return;
    const container = document.getElementById('selection-map-container');
    if (!container || container.querySelector('svg')) return;
    const loading = document.getElementById('selection-map-loading');
    if (loading) loading.classList.add('hidden');
    if (appSettings.hideTeamSelection && _mapColorMode === 'ownership') _mapColorMode = 'me';
    if (appSettings.hideTeamSelection && _mapTableSort === 'picked') _mapTableSort = 'points';
    renderChoroplethMap(_mapCachedData.stats, _mapCachedData.worldData);
}

function renderChoroplethMap(stats, worldData) {
    const container = document.getElementById('selection-map-container');
    if (!container) return;
    if (typeof d3 === 'undefined' || typeof topojson === 'undefined') {
        container.innerHTML = '<div class="flex h-full items-center justify-center text-xs text-gray-500">Map libraries not loaded.</div>';
        return;
    }

    const { sortedCountryCounts } = stats;

    // Build iso numeric → { entry, team }; for shared codes (England/Scotland) use the higher %
    const isoDataMap = {};
    sortedCountryCounts.forEach((entry) => {
        const iso = TEAM_ISO_NUMERIC[entry.teamName];
        if (iso === undefined) return;
        if (!isoDataMap[iso] || entry.percentage > isoDataMap[iso].entry.percentage) {
            isoDataMap[iso] = { entry, team: teams.find((t) => t.name === entry.teamName) };
        }
    });

    // Set of ISO codes for ALL qualified pool teams (including 0% picked)
    const qualifiedIsos = new Set();
    const isoToTeamNames = {};
    teams.filter((t) => t.qualified !== false).forEach((t) => {
        const iso = TEAM_ISO_NUMERIC[t.name];
        if (iso !== undefined) {
            qualifiedIsos.add(iso);
            if (!isoToTeamNames[iso]) isoToTeamNames[iso] = [];
            isoToTeamNames[iso].push(t.name);
        }
    });

    const maxPct = Math.max(1, ...sortedCountryCounts.map((e) => e.percentage));

    // Use theme accent color for high-ownership end
    const accentTokens = getActiveThemeAccentTokens();
    const accentColor = accentTokens.primary;

    // Update legend swatches to match current accent
    const legendEl = document.getElementById('map-legend-gradient');
    const zeroTint = d3.interpolateRgb('#ffffff', accentColor)(0.12);
    if (legendEl) legendEl.style.background = `linear-gradient(to right, ${zeroTint}, ${accentColor})`;
    const legendZeroEl = document.getElementById('map-legend-zero');
    if (legendZeroEl) legendZeroEl.style.background = zeroTint;

    // Color scale: white (0%) → accent (maxPct%)
    const ZERO_PCT = d3.interpolateRgb('#ffffff', accentColor)(0.12); // 12% tint of accent
    const colorFilled = d3.scaleSequential()
        .domain([0, maxPct])
        .interpolator(d3.interpolateRgb(ZERO_PCT, accentColor));

    const OCEAN = '#f9fafb';         // same as page bg — water is invisible
    const NOT_QUALIFIED = '#d1d5db'; // gray-300: light, clearly land but not in pool
    const BORDER = '#e5e7eb';        // gray-200: subtle country borders

    // W:H = 2:1 exactly matches the container aspect-ratio, eliminating letterbox bars
    const W = 960, H = 480;
    container.innerHTML = '';
    const svg = d3.select(container).append('svg')
        .attr('viewBox', `0 0 ${W} ${H}`)
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('display', 'block');

    svg.append('rect').attr('width', W).attr('height', H).attr('fill', OCEAN);

    const projection = d3.geoNaturalEarth1()
        .scale(W / 6.3)
        .translate([W / 2, H / 2]);
    const path = d3.geoPath().projection(projection);
    const countries = topojson.feature(worldData, worldData.objects.countries);

    _mapState = { isoDataMap, qualifiedIsos, isoToTeamNames, colorFilled, ZERO_PCT, NOT_QUALIFIED, accentColor };
    const getFill = (d) => _computeMapFill(+d.id, _mapState);

    const tooltip = document.getElementById('map-tooltip');

    svg.append('g')
        .selectAll('path')
        .data(countries.features)
        .join('path')
        .classed('country-path', true)
        .attr('d', path)
        .attr('fill', getFill)
        .attr('stroke', BORDER)
        .attr('stroke-width', 0.5)
        .style('cursor', (d) => {
            const iso = +d.id;
            return (isoDataMap[iso] || qualifiedIsos.has(iso)) ? 'pointer' : 'default';
        })
        .on('mouseenter', function (event, d) {
            const iso = +d.id;
            const data = isoDataMap[iso];
            const isQualified = qualifiedIsos.has(iso);
            if (!isQualified && !data) return;
            if (tooltip) {
                if (data && data.entry.percentage > 0) {
                    const { entry, team } = data;
                    document.getElementById('map-tooltip-flag').textContent = team?.flag || '';
                    document.getElementById('map-tooltip-name').textContent = entry.teamName;
                    document.getElementById('map-tooltip-stats').textContent =
                        `T${team?.tier} · ${entry.percentage}% · ${entry.pickedCount} ${entry.pickedCount === 1 ? 'player' : 'players'}`;
                } else {
                    const names = isoToTeamNames[iso] || [];
                    const team = teams.find((t) => names.includes(t.name));
                    document.getElementById('map-tooltip-flag').textContent =
                        names.map((n) => teams.find((t) => t.name === n)?.flag || '').join(' ');
                    document.getElementById('map-tooltip-name').textContent = names.join(' / ') || '—';
                    document.getElementById('map-tooltip-stats').textContent =
                        `T${team?.tier || '?'} · 0% · 0 players`;
                }
                tooltip.classList.remove('hidden');
            }
            const hovered = d3.color(getFill(d));
            d3.select(this).attr('fill', hovered?.brighter(0.4)?.toString() || '#fcd34d');
        })
        .on('mousemove', function (event) {
            if (!tooltip) return;
            const rect = container.getBoundingClientRect();
            tooltip.style.left = `${event.clientX - rect.left}px`;
            tooltip.style.top = `${event.clientY - rect.top}px`;
        })
        .on('mouseleave', function (event, d) {
            if (tooltip) tooltip.classList.add('hidden');
            d3.select(this).attr('fill', getFill(d));
        })
        .on('click', function (event, d) {
            const iso = +d.id;
            const data = isoDataMap[iso];
            if (data) {
                showTeamOwners(data.entry.teamName);
            } else if (qualifiedIsos.has(iso)) {
                const names = isoToTeamNames[iso] || [];
                if (names.length > 0) showTeamOwners(names[0]);
            }
        });

    svg.append('path')
        .datum(topojson.mesh(worldData, worldData.objects.countries, (a, b) => a !== b))
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', BORDER)
        .attr('stroke-width', 0.4);

    renderMapSideTable();
    requestAnimationFrame(syncMapPanelHeight);
}


function buildAdvancementGroupsMarkup() {
    return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map((group) => {
        const groupTeams = teams
            .filter((team) => team.qualified !== false && team.group === group)
            .sort((a, b) => a.name.localeCompare(b.name));

        return `
            <div class="rounded-2xl border border-gray-700 bg-gray-900/70 p-5">
                <div class="mb-4 text-sm font-black uppercase text-white">Group ${group}</div>
                <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    ${groupTeams.map((team) => `
                        <div class="rounded-2xl border border-gray-800 bg-gray-950/70 px-3 py-3">
                            <div class="mb-3 flex items-center gap-2">
                                <span class="text-xl">${team.flag}</span>
                                <div class="text-sm font-black uppercase text-white">${team.name}</div>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div class="text-left">
                                    <div class="mb-1 text-[8px] font-black uppercase tracking-[0.18em] text-emerald-300">Advanced</div>
                                    <label class="relative inline-flex cursor-pointer items-center">
                                        <input data-advancement-team="${team.name}" type="checkbox" class="peer sr-only" onchange="toggleTeamAdvancement('${team.name.replace(/'/g, "\\'")}', this.checked)">
                                        <span class="h-7 w-12 rounded-full bg-gray-700 transition-colors peer-checked:bg-emerald-600"></span>
                                        <span class="absolute left-1 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5"></span>
                                    </label>
                                </div>
                                <div class="text-right">
                                    <div class="mb-1 text-[8px] font-black uppercase tracking-[0.18em] text-red-300">Eliminated</div>
                                    <label class="relative inline-flex cursor-pointer items-center">
                                        <input data-eliminated-team="${team.name}" type="checkbox" class="peer sr-only" onchange="toggleTeamElimination('${team.name.replace(/'/g, "\\'")}', this.checked)">
                                        <span class="h-7 w-12 rounded-full bg-gray-700 transition-colors peer-checked:bg-red-600"></span>
                                        <span class="absolute left-1 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

async function fetchAdminAdvancement() {
    const container = document.getElementById('admin-advancement-groups');
    if (!container) {
        return;
    }

    container.innerHTML = '<div class="col-span-full rounded-2xl border border-gray-700 bg-gray-900/70 px-5 py-8 text-center text-xs font-black uppercase tracking-[0.25em] text-gray-400">Loading advancement controls...</div>';

    await fetchAdvancedTeams();

    container.innerHTML = buildAdvancementGroupsMarkup();

    container.querySelectorAll('[data-advancement-team]').forEach((input) => {
        input.checked = advancedTeams.has(input.dataset.advancementTeam);
    });

    container.querySelectorAll('[data-eliminated-team]').forEach((input) => {
        input.checked = eliminatedTeams.has(input.dataset.eliminatedTeam);
    });
}

async function toggleTeamAdvancement(teamName, checked) {
    // The checkbox is already visually toggled — update state silently in the background.
    const checkbox = document.querySelector(`[data-advancement-team="${teamName}"]`);
    try {
        const currentStatus = getTeamStatus(teamName);
        const { error } = await supabaseClient
            .from('team_advancement')
            .upsert({
                team_name: teamName,
                advanced_to_knockouts: checked,
                eliminated: currentStatus.eliminated
            }, { onConflict: 'team_name' });

        if (error) throw error;

        await fetchAdvancedTeams();
        renderGroups();
        fetchLeaderboard();
        fetchPublicTeamResults();
        setupDashboard();
    } catch (error) {
        showToast(error.message || 'Unable to update advancement.');
        // Revert the checkbox since the save failed
        if (checkbox) checkbox.checked = !checked;
    }
}

async function toggleTeamElimination(teamName, checked) {
    // The checkbox is already visually toggled — update state silently in the background.
    const checkbox = document.querySelector(`[data-eliminated-team="${teamName}"]`);
    try {
        const currentStatus = getTeamStatus(teamName);
        const { error } = await supabaseClient
            .from('team_advancement')
            .upsert({
                team_name: teamName,
                advanced_to_knockouts: currentStatus.advanced,
                eliminated: checked
            }, { onConflict: 'team_name' });

        if (error) throw error;

        await fetchAdvancedTeams();
        fetchLeaderboard();
        setupDashboard();

        if (checked) {
            const teamData = teams.find((t) => t.name === teamName);
            postSystemMessage('elimination', `${teamData ? teamData.flag : ''} ${teamName} eliminated`);
        }
    } catch (error) {
        showToast(error.message || 'Unable to update elimination status.');
        if (checkbox) checkbox.checked = !checked;
    }
}

let _dashMatchCache = null;
let _dashMatchMode = 'squad';
let _dashMapZoom = 1;
let _dashMapMode = 'picks';
let _dashRankingsSort = { col: 'fifaRank', dir: 'asc' };
let _dashReportRanked = null;
let _dashReportSelectedEmail = null;
let _dashChipsPlayerList = null;
let _dashChipsSelectedEmail = null;

function showDashPointsModal() {
    const modal = document.getElementById('dash-points-modal');
    const body = document.getElementById('dash-points-modal-body');
    if (!modal || !body) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const lb = window._leaderboardData || [];
    const myEntry = lb.find((u) => u.email === userEmail);
    if (!myEntry) {
        body.innerHTML = '<div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-center py-4">No data yet</div>';
        return;
    }

    const sp = myEntry.stagePoints || {};
    const stages = [
        { label: 'Group Stage', key: 'group', pts: (sp.G1 || 0) + (sp.G2 || 0) + (sp.G3 || 0), mult: '×1' },
        { label: 'Bonus (advancing)', key: 'bonus', pts: sp.Bonus || 0, mult: '+1' },
        { label: 'Round of 32', key: 'r32', pts: sp.R32 || 0, mult: '×2' },
        { label: 'Round of 16', key: 'r16', pts: sp.R16 || 0, mult: '×3' },
        { label: 'Quarter-Finals', key: 'qf', pts: sp.QF || 0, mult: '×5' },
        { label: 'Semi-Finals', key: 'sm', pts: sp.SM || 0, mult: '×8' },
        { label: 'Final', key: 'f', pts: sp.F || 0, mult: '×12' },
    ];

    body.innerHTML = `
        <div class="mb-4 flex items-baseline gap-2">
            <div class="text-4xl font-black text-white">${myEntry.totalPoints}</div>
            <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">total pts</div>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-3">
        ${stages.map((s) => `
            <div class="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-800 px-3 py-2.5 ${s.pts === 0 ? 'opacity-40' : ''} ${s.key === 'f' ? 'col-span-2' : ''}">
                <div>
                    <div class="text-[11px] font-black uppercase text-white">${s.label}</div>
                    <div class="text-[9px] font-bold text-gray-400">${s.mult}</div>
                </div>
                <div class="text-base font-black text-white">${s.pts || '—'}</div>
            </div>
        `).join('')}
        </div>
        <div class="mt-3 rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3">
            <div class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Team Contributions</div>
            ${myEntry.squad ? [...myEntry.squad].sort((a, b) => ((window._dashTeamPointsMap?.[b.name] || 0) - (window._dashTeamPointsMap?.[a.name] || 0))).map((t) => {
            const tPts = window._dashTeamPointsMap?.[t.name] || 0;
            return `
                <div class="flex items-center justify-between py-1.5 border-b border-gray-700 last:border-0">
                    <div class="flex items-center gap-2">
                        <span class="text-base">${t.flag || ''}</span>
                        <span class="text-[11px] font-black uppercase text-white">${escapeHtml(t.name)}</span>
                        ${t.eliminated ? '<span class="text-[8px] font-black uppercase text-red-400 ml-1">out</span>' : ''}
                    </div>
                    <div class="text-[11px] font-black text-gray-300">${tPts} pts</div>
                </div>
            `;
        }).join('') : ''}
        </div>
    `;
}

function closeDashPointsModal() {
    const modal = document.getElementById('dash-points-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function showDashRankModal() {
    const modal = document.getElementById('dash-rank-modal');
    const body = document.getElementById('dash-rank-modal-body');
    if (!modal || !body) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const lb = window._leaderboardData || [];
    if (!lb.length) {
        body.innerHTML = '<div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-center py-4">No data yet</div>';
        return;
    }

    const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
    body.innerHTML = lb.map((entry, i) => {
        const isMe = entry.email === userEmail;
        const rank = i === 0 ? 1 : (entry.totalPoints < lb[i - 1].totalPoints ? i + 1 : lb.slice(0, i).findIndex((e) => e.totalPoints === entry.totalPoints) + 1);
        const medal = medals[rank] || '';
        return `
            <div class="flex items-center justify-between rounded-xl px-4 py-3 ${isMe ? 'bg-gray-700 border border-gray-600' : 'bg-gray-800 border border-gray-800'}">
                <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 text-center shrink-0">${medal || `<span class="text-[10px] font-black text-gray-500">#${rank}</span>`}</div>
                    ${_renderPlayerAvatar(entry.avatarUrl, entry.favoriteTeam, 32, entry.nickname)}
                    <div class="min-w-0">
                        <div class="text-sm font-black uppercase italic text-white truncate">${escapeHtml(entry.nickname)}</div>
                        ${isMe ? '<div class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">You</div>' : ''}
                    </div>
                </div>
                <div class="text-base font-black text-white shrink-0">${entry.totalPoints} <span class="text-[9px] font-black text-gray-400">pts</span></div>
            </div>
        `;
    }).join('');
}

function closeDashRankModal() {
    const modal = document.getElementById('dash-rank-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

const _RC_GRADE_COLORS = {
    'A+': '#22c55e', 'A': '#4ade80', 'A-': '#86efac',
    'B+': '#bef264', 'B': '#facc15', 'B-': '#fbbf24',
    'C+': '#fb923c', 'C': '#f97316', 'C-': '#ef4444',
    'D': '#f87171', 'F': '#dc2626'
};

function showDashReportCard() {
    const modal = document.getElementById('dash-report-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    if (appSettings.hideTeamSelection) {
        const sidebar = document.getElementById('dash-report-sidebar');
        const body = document.getElementById('dash-report-modal-body');
        if (sidebar) sidebar.innerHTML = '';
        if (body) {
            body.innerHTML = `
                <div class="max-w-md mx-auto text-center py-10 space-y-4">
                    <div class="text-6xl">🎓</div>
                    <div class="text-lg font-black uppercase tracking-[0.15em] text-white">Report Card</div>
                    <div class="text-sm text-gray-400 leading-relaxed">
                        Each squad gets a letter grade based on the quality of its picks — a weighted blend of <span class="text-blue-400 font-black">odds value</span>, <span class="text-purple-400 font-black">FIFA rankings</span>, and <span class="text-emerald-400 font-black">squad balance</span>.
                    </div>
                    <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 pt-2">
                        Grades will appear here once the World Cup starts.
                    </div>
                </div>`;
        }
        return;
    }

    const allEntries = window._leaderboardData || [];
    _dashReportRanked = allEntries
        .map((entry) => ({ entry, rc: _computeReportCard(entry.squad) }))
        .filter(({ rc }) => rc)
        .sort((a, b) => b.rc.total - a.rc.total);

    _dashReportSelectedEmail = userEmail;
    _renderReportSidebar();
    _renderReportCardDetail(userEmail);
}

function _renderReportSidebar() {
    const sidebar = document.getElementById('dash-report-sidebar');
    if (!sidebar) return;
    if (!_dashReportRanked || _dashReportRanked.length === 0) {
        sidebar.innerHTML = '';
        return;
    }
    sidebar.innerHTML = _dashReportRanked.map(({ entry, rc }) => {
        const isMe = entry.email === userEmail;
        const isSelected = entry.email === _dashReportSelectedEmail;
        const color = _RC_GRADE_COLORS[rc.grade] || '#9ca3af';
        return `<button data-email="${escapeHtml(entry.email)}" onclick="selectDashReportCard('${escapeHtml(entry.email)}')"
            class="w-full text-left rounded-xl px-3 py-2 transition-colors ${isSelected ? 'bg-gray-700' : 'hover:bg-gray-800'}">
            <div class="flex items-center gap-2">
                ${_renderPlayerAvatar(entry.avatarUrl, entry.favoriteTeam, 28, entry.nickname)}
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-1">
                        <div class="text-[11px] font-black text-white truncate">${isMe ? '★ ' + escapeHtml(entry.nickname) : escapeHtml(entry.nickname)}</div>
                        <div class="text-sm font-black italic shrink-0" style="color:${color};">${rc.grade}</div>
                    </div>
                    <div class="text-[9px] text-gray-500">${Math.round(rc.total)}/100</div>
                </div>
            </div>
        </button>`;
    }).join('');
}

function openReportDrawer() {
    const sidebar = document.getElementById('dash-report-sidebar');
    const bg = document.getElementById('dash-report-drawer-bg');
    if (sidebar) sidebar.classList.remove('-translate-x-full');
    if (bg) bg.classList.remove('hidden');
}

function closeReportDrawer() {
    const sidebar = document.getElementById('dash-report-sidebar');
    const bg = document.getElementById('dash-report-drawer-bg');
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (bg) bg.classList.add('hidden');
}

function selectDashReportCard(email) {
    _dashReportSelectedEmail = email;
    const sidebar = document.getElementById('dash-report-sidebar');
    if (sidebar) {
        sidebar.querySelectorAll('button[data-email]').forEach((btn) => {
            const sel = btn.dataset.email === email;
            btn.classList.toggle('bg-gray-700', sel);
            btn.classList.toggle('hover:bg-gray-800', !sel);
        });
    }
    _renderReportCardDetail(email);
    closeReportDrawer();
}

function _renderReportCardDetail(email) {
    const body = document.getElementById('dash-report-modal-body');
    if (!body) return;

    let rc = null;
    let label = 'Your Picks';
    if (_dashReportRanked) {
        const item = _dashReportRanked.find(({ entry }) => entry.email === email);
        if (item) {
            rc = item.rc;
            label = email === userEmail ? 'Your Picks' : `${item.entry.nickname}'s Picks`;
        }
    } else if (email === userEmail) {
        rc = window._dashReportCard;
    }

    if (!rc) {
        body.innerHTML = '<div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-center py-10">No picks found.</div>';
        return;
    }
    _renderReportCardHtml(body, rc, label);
}

function _renderReportCardHtml(body, rc, label) {
    const color = _RC_GRADE_COLORS[rc.grade] || '#9ca3af';
    const bar = (pct, col) => `<div class="h-2 rounded-full overflow-hidden bg-gray-800"><div class="h-full rounded-full transition-all" style="width:${Math.round(pct)}%;background-color:${col};"></div></div>`;
    const oddsStr = (d) => {
        const parts = [];
        if (d.dk)     parts.push(`<a href="https://sportsbook.draftkings.com/leagues/soccer/world-cup-2026" target="_blank" class="text-blue-400 hover:underline">DK +${d.dk.toLocaleString()}</a>`);
        if (d.espn)   parts.push(`<a href="https://www.espn.com/espn/betting/story/_/id/48386952" target="_blank" class="text-blue-400 hover:underline">ESPN +${d.espn.toLocaleString()}</a>`);
        if (d.betmgm) parts.push(`<a href="https://sports.betmgm.com/en/blog/world-cup/fifa-world-cup-odds-to-win-bm16/" target="_blank" class="text-blue-400 hover:underline">MGM +${d.betmgm.toLocaleString()}</a>`);
        return parts.join('<span class="text-gray-600 mx-1">·</span>');
    };
    body.innerHTML = `
        <div class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">${escapeHtml(label)}</div>
        <div class="flex items-center gap-5 mb-4">
            <div class="text-7xl font-black italic shrink-0" style="color:${color};">${rc.grade}</div>
            <div>
                <div class="text-white text-base font-black uppercase tracking-[0.1em]">${rc.tagline}</div>
                ${rc.flavorText ? `<div class="text-gray-400 text-xs italic mt-1 leading-relaxed">${escapeHtml(rc.flavorText)}</div>` : ''}
                <div class="text-gray-500 text-xs font-black uppercase tracking-[0.18em] mt-1">Score: ${Math.round(rc.total)}/100</div>
            </div>
        </div>
        <div class="rounded-xl bg-gray-800 border border-gray-700 px-3 py-2.5 mb-5 text-[10px] text-gray-400 leading-relaxed">
            <span class="font-black text-gray-300 uppercase tracking-[0.15em]">Score = weighted average of three components, each 0–100 · </span>
            <span class="font-semibold text-blue-400">40% Odds Value</span> — win probability per budget point spent.
            <span class="font-semibold text-purple-400"> 30% FIFA Rankings</span> — how well-ranked your teams are on average.
            <span class="font-semibold text-emerald-400"> 30% Squad Balance</span> — quality of your tier 2 picks (the key differentiator), your tier 3s, and using your tier 1 slot.
        </div>
        <div class="space-y-3 mb-6">
            <div>
                <div class="flex justify-between mb-1"><span class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Odds Value</span><span class="text-[10px] font-black text-gray-400">${Math.round(rc.valueNorm)}/100</span></div>
                ${bar(rc.valueNorm, '#60a5fa')}
            </div>
            <div>
                <div class="flex justify-between mb-1"><span class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">FIFA Rankings</span><span class="text-[10px] font-black text-gray-400">${Math.round(rc.avgRank)}/100</span></div>
                ${bar(rc.avgRank, '#a78bfa')}
            </div>
            <div>
                <div class="flex justify-between mb-1"><span class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Squad Balance</span><span class="text-[10px] font-black text-gray-400">${Math.round(rc.balanceScore)}/100</span></div>
                ${bar(rc.balanceScore, '#34d399')}
            </div>
        </div>
        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Picks</div>
        <div class="grid grid-cols-2 gap-2">
            ${rc.squadData.sort((a, b) => b.winProb - a.winProb).map((t) => {
                const val = t.valueRatio / 0.106 * 100;
                const valColor = val >= 50 ? '#34d399' : val >= 25 ? '#facc15' : '#f87171';
                return `<div class="rounded-xl border border-gray-800 bg-gray-800 px-3 py-2.5 ${t.eliminated ? 'opacity-40' : ''}">
                    <div class="flex items-center gap-1.5 mb-1.5">
                        <span class="text-lg">${t.flag || ''}</span>
                        <div>
                            <div class="text-xs font-black uppercase text-white leading-tight">${escapeHtml(t.name)}</div>
                            <div class="text-[10px] text-gray-500">FIFA #${t.fifaRank}</div>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="text-[10px] font-black" style="color:${valColor};">${t.winProb.toFixed(2)}% win</div>
                        <div class="text-[10px] text-gray-500">$${t.cost}</div>
                    </div>
                    <div class="text-[9px] text-gray-600 leading-relaxed mt-1">${oddsStr(t.data)}</div>
                </div>`;
            }).join('')}
        </div>
        <div class="mt-5 pt-4 border-t border-gray-800 text-[9px] text-gray-600 space-y-1">
            <div class="font-black uppercase tracking-[0.15em] text-gray-500 mb-2">Sources</div>
            <div><a href="https://sportsbook.draftkings.com/leagues/soccer/world-cup-2026" target="_blank" class="text-blue-500 hover:underline">DraftKings Sportsbook</a> · <a href="https://www.espn.com/espn/betting/story/_/id/48386952" target="_blank" class="text-blue-500 hover:underline">ESPN/bet365</a> · <a href="https://sports.betmgm.com/en/blog/world-cup/fifa-world-cup-odds-to-win-bm16/" target="_blank" class="text-blue-500 hover:underline">BetMGM</a></div>
            <div><a href="https://inside.fifa.com/fifa-world-ranking/men" target="_blank" class="text-blue-500 hover:underline">FIFA World Rankings (April 2026)</a></div>
            <div class="text-gray-700 mt-1">Odds averaged Apr 2026. For entertainment only.</div>
        </div>
    `;
}

function closeDashReportCard() {
    const modal = document.getElementById('dash-report-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    closeReportDrawer();
}

function showDashChips() {
    if (appSettings.hidePlayerChips) return;
    const modal = document.getElementById('dash-chips-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const allEntries = window._leaderboardData || [];
    const chipsMap = window._playerChipsByEmail || {};
    _dashChipsPlayerList = allEntries
        .map((entry) => ({
            entry,
            chips: entry.chips || chipsMap[entry.email] || []
        }))
        .sort((a, b) => b.chips.length - a.chips.length);

    _dashChipsSelectedEmail = userEmail;
    _renderChipsSidebar();
    _renderChipsDetail(userEmail);
}

function _renderChipsSidebar() {
    const sidebar = document.getElementById('dash-chips-sidebar');
    if (!sidebar || !_dashChipsPlayerList) return;
    sidebar.innerHTML = _dashChipsPlayerList.map(({ entry, chips }) => {
        const isMe = entry.email === userEmail;
        const isSelected = entry.email === _dashChipsSelectedEmail;
        const preview = chips.length > 0
            ? chips.slice(0, 4).map((c) => c.emoji).join('') + (chips.length > 4 ? ` +${chips.length - 4}` : '')
            : '—';
        return `<button data-email="${escapeHtml(entry.email)}" onclick="selectDashChips('${escapeHtml(entry.email)}')"
            class="w-full text-left rounded-xl px-3 py-2 transition-colors ${isSelected ? 'bg-gray-700' : 'hover:bg-gray-800'}">
            <div class="flex items-center gap-2">
                ${_renderPlayerAvatar(entry.avatarUrl, entry.favoriteTeam, 28, entry.nickname)}
                <div class="flex-1 min-w-0">
                    <div class="text-[11px] font-black text-white truncate">${isMe ? '★ ' + escapeHtml(entry.nickname) : escapeHtml(entry.nickname)}</div>
                    <div class="text-[11px] text-gray-400">${preview}</div>
                </div>
            </div>
        </button>`;
    }).join('');
}

function openChipsDrawer() {
    const sidebar = document.getElementById('dash-chips-sidebar');
    const bg = document.getElementById('dash-chips-drawer-bg');
    if (sidebar) sidebar.classList.remove('-translate-x-full');
    if (bg) bg.classList.remove('hidden');
}

function closeChipsDrawer() {
    const sidebar = document.getElementById('dash-chips-sidebar');
    const bg = document.getElementById('dash-chips-drawer-bg');
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (bg) bg.classList.add('hidden');
}

function selectDashChips(email) {
    _dashChipsSelectedEmail = email;
    const sidebar = document.getElementById('dash-chips-sidebar');
    if (sidebar) {
        sidebar.querySelectorAll('button[data-email]').forEach((btn) => {
            const sel = btn.dataset.email === email;
            btn.classList.toggle('bg-gray-700', sel);
            btn.classList.toggle('hover:bg-gray-800', !sel);
        });
    }
    _renderChipsDetail(email);
    closeChipsDrawer();
}

function _renderChipsDetail(email) {
    const body = document.getElementById('dash-chips-body');
    if (!body) return;

    const player = _dashChipsPlayerList?.find((p) => p.entry.email === email);
    const chips = player?.chips
        || (window._leaderboardData?.find((e) => e.email === email))?.chips
        || (window._playerChipsByEmail || {})[email]
        || [];
    const nickname = player?.entry?.nickname || email;
    const isMe = email === userEmail;
    const label = isMe ? 'Your Chips' : `${nickname}'s Chips`;

    const toneStyle = {
        positive: 'bg-green-500/15 border-green-500/60 text-green-300',
        negative: 'bg-red-500/15 border-red-500/60 text-red-300',
        neutral: 'bg-sky-500/15 border-sky-500/60 text-sky-300'
    };

    const chipToneOrder = { positive: 0, neutral: 1, negative: 2 };
    const sortedChips = [...chips].sort((a, b) => (chipToneOrder[a.tone] ?? 1) - (chipToneOrder[b.tone] ?? 1));

    const squad = player?.entry?.squad || [];
    const teamPointsMap = window._dashTeamPointsMap || {};

    const renderSquadTeam = (t) => {
        const pts = teamPointsMap[t.name] || 0;
        const teamDef = teams.find((td) => td.name === t.name);
        const group = t.group || teamDef?.group || '';
        return `<div class="flex flex-col items-center text-center ${t.eliminated ? 'opacity-40' : ''}">
            <span class="text-xl mb-0.5">${t.flag || teamDef?.flag || ''}</span>
            <div class="text-[10px] font-black text-white truncate w-full leading-snug">${escapeHtml(t.name)}</div>
            <div class="text-[9px] leading-snug mt-0.5">
                <span class="font-black text-gray-300">${pts}pts</span>${group ? `<span class="font-normal text-gray-400"> · Grp ${group}</span>` : ''}
            </div>
        </div>`;
    };

    let squadHtml = '';
    if (squad.length > 0) {
        const sortedSquad = [...squad].sort((a, b) => (b.cost || 0) - (a.cost || 0));
        const firstRow = sortedSquad.slice(0, 4);
        const secondRow = sortedSquad.slice(4);
        squadHtml = `<div class="mb-4 rounded-xl border border-gray-600/50 bg-gray-800/60 p-3">
            <div class="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Squad</div>
            <div class="grid grid-cols-4 gap-x-2">${firstRow.map(renderSquadTeam).join('')}</div>
            ${secondRow.length > 0 ? `<div class="border-t border-gray-700/60 mt-3 pt-3">
                <div class="grid grid-cols-4 gap-x-2">${secondRow.map(renderSquadTeam).join('')}</div>
            </div>` : ''}
        </div>`;
    }

    body.innerHTML = `
        <div class="text-sm font-black text-white uppercase tracking-[0.1em] mb-3">${escapeHtml(label)}</div>
        ${squadHtml}
        ${sortedChips.length === 0
            ? `<div class="text-gray-500 text-sm text-center py-12">No chips earned yet.<br><span class="text-[10px] text-gray-600 mt-1 block">Chips are awarded based on performance as the tournament progresses.</span></div>`
            : `<div class="space-y-2">
                ${sortedChips.map((chip) => {
                    const cls = toneStyle[chip.tone] || toneStyle.neutral;
                    return `<div class="rounded-xl border-2 px-4 py-3 flex items-center gap-3 ${cls}">
                        <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-2xl ${cls.includes('green') ? 'bg-green-100 border-green-600' : cls.includes('red') ? 'bg-red-100 border-red-600' : 'bg-sky-100 border-sky-600'}">${chip.emoji}</span>
                        <div>
                            <div class="text-sm font-black">${escapeHtml(chip.label)}</div>
                            <div class="text-[11px] opacity-75 mt-0.5">${escapeHtml(chip.description)}</div>
                        </div>
                    </div>`;
                }).join('')}
            </div>`
        }
    `;
}

function closeDashChips() {
    const modal = document.getElementById('dash-chips-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    closeChipsDrawer();
}

function setDashRightTab(tab) {
    const oddsHidden = Boolean(appSettings.hideTeamSelection);
    if (oddsHidden && tab === 'rankings') tab = 'board';
    ['board', 'matches', 'rankings', 'groups', 'map'].forEach((t) => {
        const content = document.getElementById(`dash-tab-content-${t}`);
        const btn = document.getElementById(`dash-tab-btn-${t}`);
        if (content) content.classList.toggle('hidden', t !== tab);
        if (btn) {
            btn.classList.toggle('theme-primary-button', t === tab);
            btn.classList.toggle('text-gray-500', t !== tab);
            if (t === 'rankings') btn.classList.toggle('hidden', oddsHidden);
        }
    });
    if (tab === 'matches') renderDashMatchesTab();
    if (tab === 'rankings') renderDashRankingsTab();
    if (tab === 'groups') renderDashGroupsTab();
    if (tab === 'map') renderDashMapTab();
}

function toggleDashSheet() {
    const panel = document.getElementById('dashboard-tabs-panel');
    const arrow = document.getElementById('dash-sheet-arrow');
    const helper = document.getElementById('dash-sheet-helper');
    if (!panel) return;
    const isMinimized = panel.classList.toggle('dash-sheet-minimized');
    if (!isMinimized && window.innerWidth < 1024) {
        const parent = panel.parentElement;
        const parentRect = parent ? parent.getBoundingClientRect() : null;
        const headerEl = document.getElementById('dashboard-squad-header');
        const headerRect = headerEl ? headerEl.getBoundingClientRect() : null;
        const targetH = (parentRect && headerRect)
            ? Math.round(parentRect.bottom - headerRect.bottom) - 12
            : (parent ? parent.offsetHeight : 600);
        panel.style.height = targetH + 'px';
    } else {
        panel.style.height = '';
    }
    if (arrow) arrow.textContent = isMinimized ? '▲' : '▼';
    if (helper) helper.textContent = isMinimized ? 'Tap to view' : 'Tap to close';
}

function toggleDashMatchMode() {
    setDashMatchMode(_dashMatchMode === 'squad' ? 'all' : 'squad');
}

function setDashMatchMode(mode) {
    _dashMatchMode = mode;
    const toggle = document.getElementById('dash-matches-toggle');
    const knob = document.getElementById('dash-matches-knob');
    const labelSquad = document.getElementById('dash-matches-label-squad');
    const labelAll = document.getElementById('dash-matches-label-all');
    const isAll = mode === 'all';
    if (toggle) toggle.style.backgroundColor = isAll ? 'var(--theme-accent-primary)' : '#d1d5db';
    if (knob) knob.style.transform = isAll ? 'translateX(16px)' : 'translateX(0)';
    if (labelSquad) {
        labelSquad.classList.toggle('theme-accent-text', !isAll);
        labelSquad.classList.toggle('text-gray-400', isAll);
    }
    if (labelAll) {
        labelAll.classList.toggle('theme-accent-text', isAll);
        labelAll.classList.toggle('text-gray-400', !isAll);
    }
    renderDashMatchesTab();
}

function renderDashMatchesTab() {
    const body = document.getElementById('dash-matches-body');
    if (!body || !_dashMatchCache) return;
    const data = _dashMatchCache[_dashMatchMode] || _dashMatchCache.all || {};
    const empty = (msg) => `<div class="text-[10px] font-black uppercase tracking-[0.15em] text-gray-300 text-center py-4">${msg}</div>`;
    body.innerHTML = `
        <div class="grid grid-cols-2 divide-x divide-gray-100 h-full overflow-hidden">
            <div class="flex flex-col h-full overflow-hidden">
                <div class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 px-3 pt-1 pb-1.5 shrink-0 text-center">Recent Scores</div>
                <div class="flex-1 flex flex-col px-3 pb-3 gap-2 overflow-hidden">${data.prevHtml || empty('No results yet')}</div>
            </div>
            <div class="flex flex-col h-full overflow-hidden">
                <div class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 px-3 pt-1 pb-1.5 shrink-0 text-center">Upcoming Fixtures</div>
                <div class="flex-1 flex flex-col px-3 pb-3 gap-2 overflow-hidden">${data.nextHtml || empty('No upcoming fixtures')}</div>
            </div>
        </div>
    `;
}

function setDashMapZoom(value) {
    _dashMapZoom = parseFloat(value);
    const svg = document.querySelector('#dash-map-svg-container svg');
    if (!svg) return;
    const W = 960, H = 480;
    const z = _dashMapZoom;
    const w = W / z, h = H / z;
    if (z <= 1.01) {
        window._dashMapDragTranslate = { x: 0, y: 0 };
        svg.style.cursor = 'default';
    } else {
        svg.style.cursor = 'grab';
    }
    const dt = window._dashMapDragTranslate || { x: 0, y: 0 };
    const maxX = (W - w) / 2, maxY = (H - h) / 2;
    dt.x = Math.max(-maxX, Math.min(maxX, dt.x));
    dt.y = Math.max(-maxY, Math.min(maxY, dt.y));
    svg.setAttribute('viewBox', `${(W - w) / 2 - dt.x} ${(H - h) / 2 - dt.y} ${w} ${h}`);
}

function setDashRankingsSort(col) {
    const defaultDir = { fifaRank: 'asc', name: 'asc', cost: 'desc', tier: 'asc', winProb: 'desc' };
    if (_dashRankingsSort.col === col) {
        _dashRankingsSort.dir = _dashRankingsSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
        _dashRankingsSort = { col, dir: defaultDir[col] || 'asc' };
    }
    renderDashRankingsTab();
}

function renderDashRankingsTab() {
    const container = document.getElementById('dash-rankings-body');
    if (!container) return;

    const { col, dir } = _dashRankingsSort;
    const mult = dir === 'asc' ? 1 : -1;

    const rows = [...teams]
        .filter((t) => TEAM_REPORT_DATA[t.name])
        .map((t) => ({ t, d: TEAM_REPORT_DATA[t.name] }))
        .sort((a, b) => {
            let va, vb;
            if (col === 'name')     { va = a.t.name; vb = b.t.name; return va.localeCompare(vb) * mult; }
            if (col === 'fifaRank') { va = a.d.fifaRank || 999; vb = b.d.fifaRank || 999; }
            else if (col === 'cost')    { va = a.t.cost; vb = b.t.cost; }
            else if (col === 'tier')    { va = a.t.tier; vb = b.t.tier; }
            else if (col === 'winProb') { va = a.d.winProb; vb = b.d.winProb; }
            else { va = 0; vb = 0; }
            return (va - vb) * mult;
        });

    const tierBadge = (tier) => {
        const cls = tier === 1 ? 'bg-amber-100 text-amber-700' : tier === 2 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500';
        return `<span class="text-[8px] font-black px-1 py-0.5 rounded-full ${cls}">T${tier}</span>`;
    };

    const arrow = (c) => {
        if (_dashRankingsSort.col !== c) return `<span class="text-gray-300 ml-0.5 text-[7px]">▲▼</span>`;
        return `<span class="ml-0.5">${_dashRankingsSort.dir === 'asc' ? '▲' : '▼'}</span>`;
    };

    const th = (c, label) =>
        `<th class="py-2.5 text-[10px] font-black uppercase tracking-[0.08em] text-gray-600 cursor-pointer hover:text-gray-900 select-none text-center" onclick="setDashRankingsSort('${c}')">${label}${arrow(c)}</th>`;

    container.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full border-collapse">
                <thead>
                    <tr class="border-b-2 border-gray-100">
                        ${th('fifaRank', 'FIFA')}
                        <th class="py-2.5 text-[10px] font-black uppercase tracking-[0.08em] text-gray-600 cursor-pointer hover:text-gray-900 select-none text-left" onclick="setDashRankingsSort('name')">Country${arrow('name')}</th>
                        ${th('cost', 'Cost $')}
                        ${th('tier', 'Tier')}
                        ${th('winProb', 'Win%')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(({ t, d }) => `
                        <tr class="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors" onclick="showTeamOwners('${t.name.replace(/'/g, "\\'")}')">
                            <td class="py-2 text-xs font-black text-gray-600 text-center tabular-nums">${d.fifaRank}</td>
                            <td class="py-2 min-w-0">
                                <div class="flex items-center gap-2.5">
                                    <span class="shrink-0">${t.flag}</span>
                                    <span class="text-xs font-black text-gray-900 truncate">${escapeHtml(t.name)}</span>
                                </div>
                            </td>
                            <td class="py-2 text-xs font-black text-gray-700 text-center tabular-nums">$${t.cost}</td>
                            <td class="py-2 text-center">${tierBadge(t.tier)}</td>
                            <td class="py-2 text-xs font-black text-gray-700 text-center tabular-nums">${d.winProb.toFixed(1)}%</td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

function renderDashGroupsTab() {
    const body = document.getElementById('dash-groups-body');
    if (!body) return;

    const standings = computeGroupStandings(window._dashMatches || []);
    const teamPointsMap = window._dashTeamPointsMap || {};

    const groupKeys = Object.keys(standings).sort();
    body.innerHTML = `<div class="grid grid-cols-2 gap-3">
        ${groupKeys.map((g) => {
            const { teams: groupTeams } = standings[g];
            const sorted = [...groupTeams].sort((a, b) =>
                (teamPointsMap[b.name] || 0) - (teamPointsMap[a.name] || 0) || b.pts - a.pts || b.gd - a.gd
            );
            return `
            <div class="rounded-xl border border-gray-100 bg-gray-50 p-2.5">
                <div class="grid grid-cols-[1fr_20px_20px_24px] items-center gap-x-1.5 mb-1.5">
                    <div class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">Group ${g}</div>
                    <span class="text-[9px] font-black uppercase tracking-[0.12em] text-gray-500 text-center">GF</span>
                    <span class="text-[9px] font-black uppercase tracking-[0.12em] text-gray-500 text-center">GA</span>
                    <span class="text-[9px] font-black uppercase tracking-[0.12em] text-gray-600 text-center">Pts</span>
                </div>
                <div class="space-y-1">
                    ${sorted.map((teamRow) => {
                        const teamDef = teams.find((t) => t.name === teamRow.name);
                        const isElim = eliminatedTeams.has(teamRow.name);
                        const poolPts = teamPointsMap[teamRow.name] || 0;
                        const ga = (teamRow.gf || 0) - (teamRow.gd || 0);
                        return `
                        <div class="grid grid-cols-[1fr_20px_20px_24px] items-center gap-x-1.5 ${isElim ? 'opacity-40' : ''}">
                            <div class="flex items-center gap-1 min-w-0">
                                <span class="text-sm shrink-0">${teamDef?.flag || ''}</span>
                                <div class="text-[10px] font-black text-gray-800 truncate">${escapeHtml(teamRow.name)}</div>
                            </div>
                            <span class="text-[10px] font-black text-gray-600 tabular-nums text-center">${teamRow.gf || 0}</span>
                            <span class="text-[10px] font-black text-gray-600 tabular-nums text-center">${ga}</span>
                            <span class="text-[10px] font-black text-gray-800 tabular-nums text-center">${poolPts}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

function setDashMapMode(mode) {
    const hidePicks = Boolean(appSettings.hideTeamSelection);
    if (hidePicks && mode === 'picks') mode = 'groups';
    _dashMapMode = mode;
    ['groups', 'picks'].forEach((m) => {
        const btn = document.getElementById(`dash-map-mode-${m}`);
        if (!btn) return;
        const active = m === mode;
        const hidden = hidePicks && m === 'picks';
        btn.style.cssText = `padding:2px 8px; border-radius:6px; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:0.1em; border:none; cursor:pointer; transition:all 0.15s; ${active ? 'background:#4b5563; color:#fff;' : 'background:transparent; color:#9ca3af;'}${hidden ? ' display:none;' : ''}`;
    });
    _renderDashMapSvg(_mapCachedData?.worldData);
}

async function renderDashMapTab() {
    const body = document.getElementById('dash-map-body');
    if (!body) return;

    if (appSettings.hideTeamSelection && _dashMapMode === 'picks') _dashMapMode = 'groups';
    _dashMapZoom = 1;
    window._dashMapDragTranslate = { x: 0, y: 0 };
    body.innerHTML = `
        <div style="display:flex; gap:8px; align-items:stretch;">
            <div style="display:flex; flex-direction:column; align-items:center; gap:4px; flex-shrink:0; padding:2px 0;">
                <span style="font-size:11px; font-weight:900; color:#9ca3af; line-height:1; user-select:none;">+</span>
                <input type="range" id="dash-map-zoom-slider" min="1" max="4" step="0.1" value="1"
                    oninput="setDashMapZoom(this.value)"
                    style="writing-mode:vertical-lr; direction:rtl; cursor:pointer; flex:1; min-height:0; accent-color:var(--theme-accent-primary);">
                <span style="font-size:11px; font-weight:900; color:#9ca3af; line-height:1; user-select:none;">−</span>
            </div>
            <div style="flex:1; display:flex; flex-direction:column;">
                <div id="dash-map-svg-container" class="relative w-full rounded-xl overflow-hidden bg-gray-50" style="aspect-ratio:2/1; flex-shrink:0;">
                    <div id="dash-map-loading" class="absolute inset-0 flex items-center justify-center text-xs text-gray-400">Loading map…</div>
                    <div id="dash-map-tooltip" class="pointer-events-none absolute hidden z-50 rounded-lg bg-white shadow-lg border border-gray-100 px-2.5 py-1.5 text-xs leading-snug" style="max-width:150px; top:0; left:0;"></div>
                </div>
                <div id="dash-map-legend" class="mt-2"></div>
                <div style="display:flex; justify-content:center; margin-top:10px;">
                    <div style="display:flex; background:rgba(31,41,55,0.82); border-radius:8px; padding:2px; gap:2px;">
                        <button id="dash-map-mode-picks" onclick="setDashMapMode('picks')"
                            style="padding:2px 12px; border-radius:6px; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:0.1em; border:none; cursor:pointer; transition:all 0.15s; ${_dashMapMode === 'picks' ? 'background:#4b5563; color:#fff;' : 'background:transparent; color:#9ca3af;'}">Picks</button>
                        <button id="dash-map-mode-groups" onclick="setDashMapMode('groups')"
                            style="padding:2px 12px; border-radius:6px; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:0.1em; border:none; cursor:pointer; transition:all 0.15s; ${_dashMapMode === 'groups' ? 'background:#4b5563; color:#fff;' : 'background:transparent; color:#9ca3af;'}">Groups</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    let worldData = _mapCachedData?.worldData;
    if (!worldData) {
        try {
            const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
            worldData = await res.json();
            if (!_mapCachedData) window._mapCachedData = {};
            _mapCachedData = _mapCachedData || {};
            _mapCachedData.worldData = worldData;
        } catch (_) {
            const loading = document.getElementById('dash-map-loading');
            if (loading) loading.textContent = 'Map unavailable.';
            return;
        }
    }

    _renderDashMapSvg(worldData);
}

function _renderDashMapSvg(worldDataArg) {
    const worldData = worldDataArg || _mapCachedData?.worldData;
    const container = document.getElementById('dash-map-svg-container');
    if (!container || !worldData) return;
    if (typeof d3 === 'undefined' || typeof topojson === 'undefined') {
        container.innerHTML = '<div class="flex h-full items-center justify-center text-xs text-gray-400">Map libraries not loaded.</div>';
        return;
    }

    const loading = document.getElementById('dash-map-loading');
    if (loading) loading.classList.add('hidden');

    const existingSvg = container.querySelector('svg');
    if (existingSvg) existingSvg.remove();

    const isoToColor = {};
    const isoToTeamName = {};
    const qualifiedIsos = new Set();

    const sortedTeams = [...teams].filter((t) => t.qualified !== false).sort((a, b) => (b.cost || 0) - (a.cost || 0));

    if (_dashMapMode === 'groups') {
        sortedTeams.forEach((t) => {
            const iso = TEAM_ISO_NUMERIC[t.name];
            if (iso !== undefined && !isoToColor[iso]) {
                isoToColor[iso] = GROUP_COLORS[t.group] || '#9ca3af';
                isoToTeamName[iso] = t.name;
                qualifiedIsos.add(iso);
            }
        });
    } else {
        const entries = window._leaderboardData || [];
        const total = entries.length || 1;
        const pickCount = {};
        entries.forEach((e) => { (e.squad || []).forEach((t) => { pickCount[t.name] = (pickCount[t.name] || 0) + 1; }); });

        const accentTokens = getActiveThemeAccentTokens();
        const accentColor = accentTokens.primary;
        const maxPct = Math.max(1, ...Object.values(pickCount).map((c) => (c / total) * 100));
        const ZERO_TINT = d3.interpolateRgb('#ffffff', accentColor)(0.12);
        const colorScale = d3.scaleSequential().domain([0, maxPct]).interpolator(d3.interpolateRgb(ZERO_TINT, accentColor));

        sortedTeams.forEach((t) => {
            const iso = TEAM_ISO_NUMERIC[t.name];
            if (iso !== undefined && !isoToColor[iso]) {
                const pct = ((pickCount[t.name] || 0) / total) * 100;
                isoToColor[iso] = colorScale(pct);
                isoToTeamName[iso] = t.name;
                qualifiedIsos.add(iso);
            }
        });
    }

    const W = 960, H = 480;
    const OCEAN = '#f9fafb';
    const NOT_QUALIFIED = '#e2e8f0';
    const BORDER = '#e5e7eb';

    const svg = d3.select(container).append('svg')
        .attr('viewBox', `0 0 ${W} ${H}`)
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('display', 'block');

    svg.append('rect').attr('width', W).attr('height', H).attr('fill', OCEAN);

    const projection = d3.geoNaturalEarth1().scale(W / 6.3).translate([W / 2, H / 2]);
    const path = d3.geoPath().projection(projection);
    const countries = topojson.feature(worldData, worldData.objects.countries);

    const tooltip = document.getElementById('dash-map-tooltip');

    svg.append('g')
        .selectAll('path')
        .data(countries.features)
        .join('path')
        .attr('d', path)
        .attr('fill', (d) => isoToColor[+d.id] || NOT_QUALIFIED)
        .attr('stroke', BORDER)
        .attr('stroke-width', 0.5)
        .style('cursor', (d) => qualifiedIsos.has(+d.id) ? 'pointer' : 'default')
        .on('mouseenter', function (event, d) {
            const iso = +d.id;
            const teamName = isoToTeamName[iso];
            if (!teamName || !tooltip) return;
            const team = teams.find((t) => t.name === teamName);
            if (!team) return;
            if (_dashMapMode === 'picks') {
                const entries = window._leaderboardData || [];
                const total = entries.length || 1;
                const count = entries.filter((e) => (e.squad || []).some((t) => t.name === teamName)).length;
                const pct = Math.round((count / total) * 100);
                tooltip.innerHTML = `<span class="font-black">${team.flag} ${escapeHtml(teamName)}</span><br><span class="text-gray-500">${pct}% · ${count} picks</span>`;
            } else {
                const color = GROUP_COLORS[team.group] || '#9ca3af';
                tooltip.innerHTML = `<span class="font-black">${team.flag} ${escapeHtml(teamName)}</span><br><span class="font-black" style="color:${color}">Group ${escapeHtml(team.group)}</span>`;
            }
            tooltip.classList.remove('hidden');
            const fill = isoToColor[iso] || NOT_QUALIFIED;
            d3.select(this).attr('fill', d3.color(fill)?.brighter(0.35)?.toString() || fill);
        })
        .on('mousemove', function (event) {
            if (!tooltip) return;
            const rect = container.getBoundingClientRect();
            const x = event.clientX - rect.left + 10;
            const y = event.clientY - rect.top - 10;
            tooltip.style.left = `${Math.min(x, rect.width - 155)}px`;
            tooltip.style.top = `${Math.max(4, y)}px`;
        })
        .on('mouseleave', function (event, d) {
            const iso = +d.id;
            d3.select(this).attr('fill', isoToColor[iso] || NOT_QUALIFIED);
            if (tooltip) tooltip.classList.add('hidden');
        })
        .on('click', function (event, d) {
            if (event.defaultPrevented) return; // swallowed by drag
            const teamName = isoToTeamName[+d.id];
            if (teamName) showTeamOwners(teamName);
        });

    // Drag to pan when zoomed in
    const dragBehavior = d3.drag()
        .filter(() => _dashMapZoom > 1.05)
        .on('start', () => { svg.style('cursor', 'grabbing'); })
        .on('drag', (event) => {
            if (_dashMapZoom <= 1.05) return;
            const containerW = container.clientWidth || 400;
            const W = 960;
            const scale = (W / _dashMapZoom) / containerW;
            if (!window._dashMapDragTranslate) window._dashMapDragTranslate = { x: 0, y: 0 };
            window._dashMapDragTranslate.x += event.dx * scale;
            window._dashMapDragTranslate.y += event.dy * scale;
            setDashMapZoom(_dashMapZoom);
        })
        .on('end', () => { svg.style('cursor', _dashMapZoom > 1.05 ? 'grab' : 'default'); });
    svg.call(dragBehavior);

    // Legend
    const legendEl = document.getElementById('dash-map-legend');
    if (legendEl) {
        if (_dashMapMode === 'groups') {
            const groupKeys = Object.keys(GROUP_COLORS).sort();
            legendEl.innerHTML = `<div class="flex flex-wrap justify-center gap-x-3 gap-y-1">
                ${groupKeys.map((g) => {
                    const color = GROUP_COLORS[g];
                    return `<span class="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.1em] text-gray-600">
                        <span class="inline-block w-2 h-2 rounded-full shrink-0" style="background-color:${color};"></span>${g}
                    </span>`;
                }).join('')}
            </div>`;
        } else {
            const accentTokens = getActiveThemeAccentTokens();
            const accentColor = accentTokens.primary;
            const ZERO_TINT = d3.interpolateRgb('#ffffff', accentColor)(0.12);
            legendEl.innerHTML = `<div class="flex flex-col items-center gap-1">
                <div class="w-36 h-2 rounded-full" style="background: linear-gradient(to right, ${ZERO_TINT}, ${accentColor});"></div>
                <div class="flex justify-between w-36">
                    <span class="text-[8px] font-black uppercase tracking-[0.1em] text-gray-400">Low picks</span>
                    <span class="text-[8px] font-black uppercase tracking-[0.1em] text-gray-400">High picks</span>
                </div>
            </div>`;
        }
    }
}

function renderDashOddsTab() {
    const body = document.getElementById('dash-odds-body');
    if (!body) return;
    const withOdds = teams.filter((t) => TEAM_REPORT_DATA[t.name])
        .sort((a, b) => (TEAM_REPORT_DATA[b.name].winProb || 0) - (TEAM_REPORT_DATA[a.name].winProb || 0));
    const withoutOdds = teams.filter((t) => !TEAM_REPORT_DATA[t.name]);
    const ordered = [...withOdds, ...withoutOdds];
    const tierColor = { 1: 'bg-amber-100 text-amber-700', 2: 'bg-blue-100 text-blue-600', 3: 'bg-gray-100 text-gray-500' };
    const tierLabel = { 1: 'T1', 2: 'T2', 3: 'T3' };
    body.innerHTML = `
        <div class="grid grid-cols-[1fr_auto_auto_auto] text-[9px] font-black uppercase tracking-[0.12em] text-gray-400 border-b border-gray-100 pb-1.5 mb-1.5 gap-x-2">
            <div>Team</div><div class="text-right">Win%</div><div class="text-right">Cost</div><div class="text-right">FIFA</div>
        </div>
        <div class="space-y-0.5">
            ${ordered.map((t) => {
                const d = TEAM_REPORT_DATA[t.name];
                const tCls = tierColor[t.tier] || tierColor[3];
                const winPct = d ? `${d.winProb.toFixed(1)}%` : '—';
                const fifa = d ? `#${d.fifaRank}` : '—';
                return `<div class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-2 py-1 border-b border-gray-50">
                    <div class="flex items-center gap-1.5 min-w-0">
                        <span class="text-sm shrink-0">${t.flag}</span>
                        <div class="text-[10px] font-black text-gray-800 truncate">${escapeHtml(t.name)}</div>
                        <span class="text-[8px] font-black px-1 py-0.5 rounded-full ${tCls} shrink-0">${tierLabel[t.tier]}</span>
                    </div>
                    <div class="text-[10px] font-black text-gray-600 text-right">${winPct}</div>
                    <div class="text-[10px] font-black text-gray-600 text-right">$${t.cost}</div>
                    <div class="text-[10px] font-black text-gray-500 text-right">${fifa}</div>
                </div>`;
            }).join('')}
        </div>
    `;
}

async function setupDashboard() {
    const myPointsEl = document.getElementById('dashboard-my-points');
    if (!myPointsEl) return;

    const myRankEl = document.getElementById('dashboard-my-rank');
    const reportGradeEl = document.getElementById('dashboard-report-grade');
    const chipsPreviewEl = document.getElementById('dashboard-chips-preview');
    const prizePotEl = document.getElementById('dashboard-prize-pot');
    const playerCountEl = document.getElementById('dashboard-player-count');
    const leaderboardEl = document.getElementById('dashboard-leaderboard');

    // Skeleton loading states
    const dashSkeletonCard = `
        <div class="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 flex items-center justify-between gap-4">
            <div class="space-y-2">
                <div class="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div class="h-3 w-16 bg-gray-100 rounded animate-pulse"></div>
            </div>
            <div class="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
        </div>`;
    if (leaderboardEl) leaderboardEl.innerHTML = dashSkeletonCard.repeat(3);

    try {
        const [
            { data: allPicks, error: picksError },
            { data: allMatches, error: matchesError },
            { data: allProfiles, error: profilesError }
        ] = await Promise.all([
            supabaseClient.from('picks').select('*'),
            supabaseClient.from('matches').select('*').order('match_date_manual', { ascending: false }),
            supabaseClient.from('profiles').select('email, nickname, realname, favorite_team, home_country, has_paid, avatar_url, updated_at')
        ]);

        if (picksError) {
            throw picksError;
        }

        if (matchesError) {
            throw matchesError;
        }

        if (profilesError) {
            throw profilesError;
        }

        const picks = allPicks || [];
        const matches = allMatches || [];
        window._dashMatches = matches;
        const profilesMap = buildProfilesMap(allProfiles);
        const selectionStats = buildSelectionStatsSnapshot(picks, allProfiles || []);
        window._dashSelectionStats = selectionStats;
        const teamOwnership = new Map();
        selectionStats.sortedCountryCounts.forEach((entry) => {
            teamOwnership.set(entry.teamName, {
                pickedCount: entry.pickedCount,
                percentage: entry.percentage
            });
        });
        await fetchAdvancedTeams();
        const teamPointsMap = buildTeamPointsMap(matches, teams, advancedTeams);
        window._dashTeamPointsMap = teamPointsMap;
        window._dashBestAvailableTeam = buildBestAvailableTeamData(matches || [], teams, advancedTeams, eliminatedTeams);
        const leaderboardData = buildLeaderboardData(picks, matches, profilesMap, teams, advancedTeams, eliminatedTeams);
        const previousRanks = JSON.parse(localStorage.getItem('wc_pool_lb_ranks') || '{}');
        const dashPlayerChips = computePlayerChips(leaderboardData, matches, previousRanks);
        const enrichedLeaderboardData = leaderboardData.map((user) => ({
            ...user,
            chips: dashPlayerChips.get(user.email) || []
        }));
        window._playerChipsByEmail = Object.fromEntries(dashPlayerChips);
        window._leaderboardData = enrichedLeaderboardData;
        const currentUserRows = picks.filter((pick) => pick.user_email === userEmail);
        const currentProfile = getDisplayProfile(userEmail, profilesMap);
        window._dashCurrentProfile = currentProfile;
        renderDashboardFavoriteBanner(currentProfile);
        renderTopNavFavoriteTheme(currentProfile);
        const myEntry = leaderboardData.find((entry) => entry.email === userEmail);
        const savedSquad = currentUserRows
            .map((pick) => teams.find((team) => team.name === pick.team_name))
            .filter(Boolean);
        const liveSquad = myPicks.length > 0 ? myPicks : savedSquad;

        const localTodayKey = (() => {
            const now = new Date();
            const offsetMs = now.getTimezoneOffset() * 60000;
            return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
        })();
        const getMatchSortKey = (match) => `${match?.match_date_manual || '9999-99-99'}-${String(match?.id || 0).padStart(8, '0')}`;
        const ownershipMarkup = (teamName, align = 'left') => {
            if (appSettings.hideTeamSelection) {
                return '';
            }

            const pickedCount = teamOwnership.get(teamName)?.pickedCount || 0;
            const percentage = teamOwnership.get(teamName)?.percentage || 0;
            const alignClass = align === 'right' ? 'text-right' : 'text-left';
            return `
                <div class="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 ${alignClass}">
                    ${pickedCount}${selectionStats.totalPlayers > 0 ? ` (${percentage}%)` : ''}
                </div>
            `;
        };
        const buildPointsAwardedLabel = (match) => {
            if (!match?.is_finished) {
                return match?.match_date_manual || 'Upcoming';
            }

            if (match.score_home === match.score_away) {
                const drawPoints = getMatchPointsForTeam(match, match.team_home);
                return `${drawPoints} pt${drawPoints === 1 ? '' : 's'} each`;
            }

            const winningTeam = match.score_home > match.score_away ? match.team_home : match.team_away;
            const awardedPoints = getMatchPointsForTeam(match, winningTeam);
            return `${awardedPoints} pts`;
        };
        const renderDashboardMatchCard = (match, { squadNames = null } = {}) => {
            const homeTeam = teams.find((team) => team.name === match.team_home);
            const awayTeam = teams.find((team) => team.name === match.team_away);
            const isHomeMine = squadNames?.has(match.team_home);
            const isAwayMine = squadNames?.has(match.team_away);
            const stageLabel = _getMatchStageDisplayLabel(match);

            // Mobile-abbreviated stage label
            const stageAbbr = stageLabel.startsWith('Group')
                ? stageLabel.replace('Group Stage', 'Grp').replace('Group ', 'Grp ')
                : ({ 'Round of 32': 'R32', 'Round of 16': 'R16', 'Quarter-final': 'QF', 'Semi-final': 'SF', 'Third Place': '3rd' }[match.stage] || stageLabel);

            // Date: short on mobile (Jun 15), full on desktop (June 15)
            const dateStr = match.match_date_manual || '';
            const fmtDate = (str, short) => {
                if (!str) return '';
                const d = new Date(str + 'T12:00:00Z');
                return d.toLocaleDateString('en-US', { month: short ? 'short' : 'long', day: 'numeric', timeZone: 'UTC' });
            };

            // Points: awarded (green) for finished, potential win pts (gray) for upcoming
            const stageMultiplierMap = { 'Group': 1, 'Round of 32': 2, 'Round of 16': 3, 'Quarter-final': 5, 'Semi-final': 8, 'Final': 12, 'Third Place': 8 };
            const mult = stageMultiplierMap[match.stage] || 1;
            const ptsLabel = match.is_finished ? buildPointsAwardedLabel(match) : `${3 * mult} pts`;
            const ptsColor = match.is_finished ? 'text-green-500' : 'text-gray-400';

            const scoreMarkup = match.is_finished ? `${match.score_home}–${match.score_away}` : 'TBD';
            const safeHome = match.team_home.replace(/'/g, "\\'");
            const safeAway = match.team_away.replace(/'/g, "\\'");

            return `
                <div class="flex-1 flex flex-col justify-center bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 min-h-0">
                    <div class="flex items-center justify-between mb-1">
                        <div class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">
                            <span class="sm:hidden">${stageAbbr}</span><span class="hidden sm:inline">${stageLabel}</span>
                        </div>
                        ${dateStr ? `<div class="text-[9px] font-black uppercase tracking-[0.12em] text-gray-400">
                            <span class="sm:hidden">${fmtDate(dateStr, true)}</span><span class="hidden sm:inline">${fmtDate(dateStr, false)}</span>
                        </div>` : ''}
                        <div class="text-[9px] font-black uppercase tracking-[0.15em] ${ptsColor}">${ptsLabel}</div>
                    </div>
                    <div class="grid grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] items-center gap-2">
                        <div onclick="showTeamOwners('${safeHome}')" class="min-w-0 text-right truncate text-sm font-black text-gray-900 cursor-pointer hover:text-gray-500 transition-colors">${isHomeMine ? '<span class="text-amber-400">★</span> ' : ''}${homeTeam?.flag || ''}<span class="hidden sm:inline"> ${escapeHtml(match.team_home)}</span></div>
                        <div class="shrink-0 text-base font-black text-gray-700 text-center tabular-nums leading-none">${scoreMarkup}</div>
                        <div onclick="showTeamOwners('${safeAway}')" class="min-w-0 text-left truncate text-sm font-black text-gray-900 cursor-pointer hover:text-gray-500 transition-colors"><span class="hidden sm:inline">${escapeHtml(match.team_away)} </span>${awayTeam?.flag || ''}${isAwayMine ? ' <span class="text-amber-400">★</span>' : ''}</div>
                    </div>
                    <div class="grid grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] gap-2">
                        <div>${ownershipMarkup(match.team_home, 'right')}</div>
                        <div></div>
                        <div>${ownershipMarkup(match.team_away, 'left')}</div>
                    </div>
                    ${match.was_extra_time ? '<div class="text-[9px] font-black uppercase text-red-400 italic text-center mt-0.5">ET/Pens</div>' : ''}
                </div>
            `;
        };

        const spent = liveSquad.reduce((sum, team) => sum + team.cost, 0);
        const myPoints = currentUserRows.reduce((sum, pick) => sum + (teamPointsMap[pick.team_name] || 0), 0);

        const currentRanksMap = _getPlayerDisplayRanks(leaderboardData);
        const myDisplayRank = currentRanksMap[userEmail] || null;
        const tiedCount = myDisplayRank ? Object.values(currentRanksMap).filter((r) => r === myDisplayRank).length : 0;
        const isTied = tiedCount > 1;

        localStorage.setItem('wc_pool_lb_ranks', JSON.stringify(currentRanksMap));

        // Deltas compare against the state BEFORE the most recent match-input date.
        let pointsDelta = 0;
        let rankDelta = 0;
        const allPointsDeltaMap = new Map();
        const datedMatches = matches.filter((m) => m.match_date_manual);
        const uniqueMatchDates = [...new Set(datedMatches.map((m) => m.match_date_manual))].sort((a, b) => b.localeCompare(a));
        if (uniqueMatchDates.length >= 2) {
            const mostRecentDate = uniqueMatchDates[0];
            const prevMatches = datedMatches.filter((m) => m.match_date_manual < mostRecentDate);
            const prevLeaderboard = buildLeaderboardData(picks, prevMatches, profilesMap, teams, advancedTeams, eliminatedTeams);
            const prevRanksMap = _getPlayerDisplayRanks(prevLeaderboard);
            const prevEntry = prevLeaderboard.find((e) => e.email === userEmail);
            const prevMyPoints = prevEntry?.totalPoints ?? myPoints;
            const prevMyRank = prevRanksMap[userEmail] ?? myDisplayRank;
            pointsDelta = myPoints - prevMyPoints;
            rankDelta = (prevMyRank && myDisplayRank) ? (prevMyRank - myDisplayRank) : 0;
            prevLeaderboard.forEach((prev) => {
                const curr = leaderboardData.find((l) => l.email === prev.email);
                if (curr) allPointsDeltaMap.set(prev.email, curr.totalPoints - prev.totalPoints);
            });
        }

        if (myPointsEl) {
            myPointsEl.innerHTML = `${_renderDashDelta(pointsDelta)}<span>${myPoints}</span>`;
        }
        if (myRankEl) {
            if (myDisplayRank) {
                const suffix = _ordinalSuffix(myDisplayRank);
                const tiePrefix = isTied ? `<span class="text-[11px] font-black text-gray-400 mr-0.5">T</span>` : '';
                myRankEl.innerHTML = `${_renderDashDelta(rankDelta)}<span class="inline-flex items-baseline">${tiePrefix}${myDisplayRank}<sup class="text-[11px] font-black ml-0.5">${suffix}</sup></span>`;
            } else {
                myRankEl.textContent = '-';
            }
        }
        // Report card grade
        if (reportGradeEl) {
            if (appSettings.hideTeamSelection) {
                reportGradeEl.innerHTML = '<span class="text-sm">TBD</span>';
                window._dashReportCard = null;
            } else if (liveSquad.length > 0) {
                const rc = _computeReportCard(liveSquad);
                reportGradeEl.textContent = rc ? rc.grade : '—';
                window._dashReportCard = rc;
            }
        }
        // Chips preview
        const myLbEntry = leaderboardData.find((e) => e.email === userEmail);
        const chips = myLbEntry?.chips || window._playerChipsByEmail?.[userEmail] || [];
        const chipsButton = chipsPreviewEl?.closest('button');
        if (chipsButton) {
            chipsButton.classList.toggle('hidden', Boolean(appSettings.hidePlayerChips));
        }
        if (chipsPreviewEl && !appSettings.hidePlayerChips) {
            if (chips.length > 0) {
                const toneClasses = { positive: 'bg-green-100 border-2 border-green-600', negative: 'bg-red-100 border-2 border-red-600', neutral: 'bg-sky-100 border-2 border-sky-600' };
                const first = chips[0];
                const mobileOverflow = chips.length > 1 ? chips.length - 1 : 0;
                const mobileHtml = first ? `<div class="relative inline-flex items-center justify-center">
                    <span class="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${toneClasses[first.tone] || toneClasses.neutral}">${first.emoji}</span>
                    ${mobileOverflow > 0 ? `<span class="absolute -top-1 -right-1.5 h-[14px] min-w-[14px] px-0.5 inline-flex items-center justify-center rounded-full bg-gray-200 border border-gray-300 text-[7px] font-black text-blue-900 z-20">+${mobileOverflow}</span>` : ''}
                </div>` : '';
                const deskVisible = chips.slice(0, 3);
                const deskOverflow = chips.length > 3 ? chips.length - 3 : 0;
                const deskHtml = deskVisible.map((c) => `<span class="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${toneClasses[c.tone] || toneClasses.neutral}">${c.emoji}</span>`).join('') +
                    (deskOverflow > 0 ? `<span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 border-2 border-gray-400 text-[10px] font-black text-gray-600">+${deskOverflow}</span>` : '');
                chipsPreviewEl.innerHTML = `
                    <div class="sm:hidden flex items-center justify-center">${mobileHtml}</div>
                    <div class="hidden sm:flex items-center gap-1 justify-center">${deskHtml}</div>
                `;
            } else {
                chipsPreviewEl.textContent = '—';
            }
        }

        // Player-card-style squad
        const favTeamObj = teams.find((t) => t.name === currentProfile?.favoriteTeam);
        const favFlag = favTeamObj?.flag || '';
        const cardAccent = getPlayerCardAccentStyle(currentProfile?.favoriteTeam || '');
        const squadCard = document.getElementById('dashboard-squad-card');
        const squadInner = document.getElementById('dashboard-squad-inner');
        const squadBudgetBar = document.getElementById('dashboard-squad-budget-bar');
        if (squadCard) {
            squadCard.style.cssText = `${cardAccent.style}; background-color: #0f172a;`;
        }
        // Glow effect on outer pill using accent primary color
        const outerPill = squadCard?.closest('.rounded-3xl');
        if (outerPill) {
            const rgb = cardAccent.tokens.primaryRgb;
            outerPill.style.boxShadow = `0 0 60px -15px rgba(${rgb.r},${rgb.g},${rgb.b},0.45), 0 25px 50px -12px rgba(0,0,0,0.5)`;
        }
        if (squadInner) {
            const headerHtml = `
                <div id="dashboard-squad-header" class="flex items-center gap-4 mb-5 shrink-0">
                    ${_renderPlayerAvatar(currentProfile?.avatarUrl, currentProfile?.favoriteTeam, 48, currentProfile?.nickname || '')}
                    <div class="min-w-0 flex-1">
                        <div class="text-xl font-black italic tracking-tight text-white truncate">${escapeHtml(currentProfile?.nickname || '')}</div>
                        <div class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">${currentProfile?.realname ? escapeHtml(currentProfile.realname) : ''}</div>
                    </div>
                    <div class="text-right shrink-0">
                        <div class="text-2xl font-black" style="color: var(--player-card-accent-on-dark);">${myPoints}</div>
                        <div class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">pts</div>
                    </div>
                </div>
            `;
            const editBtn = !isLocked ? `<div class="pt-3 shrink-0"><button onclick="showPage('picks')" class="w-full rounded-xl bg-gray-700 hover:bg-gray-600 px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-white transition-colors">Edit Picks</button></div>` : '';
            squadInner.innerHTML = headerHtml + `<div class="flex-1 overflow-y-auto min-h-0"><div id="dashboard-squad-strip" class="grid grid-cols-2 gap-2"></div></div>` + editBtn;
        }
        const freshStripEl = document.getElementById('dashboard-squad-strip');
        if (freshStripEl) {
            freshStripEl.innerHTML = liveSquad.length > 0
                ? liveSquad
                    .sort((a, b) => (b.cost || 0) - (a.cost || 0) || a.name.localeCompare(b.name))
                    .map((team) => `
                        <div class="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 flex items-center gap-2 cursor-pointer hover:border-gray-500 transition-colors ${team.eliminated ? 'opacity-40' : ''}" onclick="showDashTeamStats('${team.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')">
                            <span class="text-xl">${team.flag || ''}</span>
                            <div class="flex-1 min-w-0">
                                <div class="text-[10px] sm:text-xs font-black uppercase text-white truncate">${escapeHtml(team.name)}</div>
                                <div class="text-[10px] font-bold text-gray-400">${team.group ? `${team.group} · ` : ''}$${team.cost}${team.eliminated ? ' · out' : ''}</div>
                            </div>
                            <div class="text-[10px] sm:text-xs font-black shrink-0" style="color: var(--player-card-accent-on-dark);">${teamPointsMap[team.name] || 0} pts</div>
                            <svg class="w-3 h-3 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                        </div>
                    `)
                    .join('')
                : `<div class="col-span-2 text-center py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">No squad yet — <button onclick="showPage('picks')" class="underline text-gray-400">pick teams</button></div>`;
        }
        if (squadBudgetBar && spent > 0 && !isLocked) {
            squadBudgetBar.classList.remove('hidden');
            squadBudgetBar.innerHTML = `
                <div class="flex items-center justify-between mb-1.5">
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Budget Used</span>
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-white">$${spent} / $150</span>
                </div>
                <div class="h-2 rounded-full overflow-hidden" style="background-color: rgba(var(--player-card-accent-primary-rgb, 59,130,246), 0.18);">
                    <div class="h-full rounded-full" style="width: ${Math.round(spent / 150 * 100)}%; background: linear-gradient(90deg, var(--player-card-accent-primary, #3b82f6), var(--player-card-accent-on-dark, #93c5fd));"></div>
                </div>
            `;
        } else if (squadBudgetBar) {
            squadBudgetBar.classList.add('hidden');
        }

        // Build pool-relative upside map (used by score bar + leaderboard rows)
        const poolUpsideMap = _buildUpsideMap(leaderboardData);
        window._poolUpsideMap = poolUpsideMap;

        // Score position bar + Upside bar (locked only)
        const squadScoreBar = document.getElementById('dashboard-squad-score-bar');
        if (squadScoreBar && isLocked && spent > 0) {
            const allPts = leaderboardData.map((e) => e.totalPoints);
            const maxPts = Math.max(...allPts);
            const minPts = Math.min(...allPts);
            const myEntry = leaderboardData.find((e) => e.email === userEmail);
            const myPts = myEntry?.totalPoints ?? 0;
            const range = maxPts - minPts || 1;
            const pct = Math.round(((myPts - minPts) / range) * 100);
            const upside = poolUpsideMap.get(userEmail) ?? 0;
            window._dashUpsideSquad = myEntry?.squad || liveSquad;
            squadScoreBar.classList.remove('hidden');
            squadScoreBar.innerHTML = `
                <div class="cursor-pointer hover:opacity-80 transition-opacity mb-3" onclick="showMyScoreCard()">
                    <div class="flex items-center justify-between mb-1.5">
                        <span class="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Your Score <svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg></span>
                        <span class="text-[10px] font-black uppercase tracking-[0.2em] text-white">${myPts} pts</span>
                    </div>
                    <div class="relative h-2 rounded-full overflow-visible" style="background-color: rgba(var(--player-card-accent-primary-rgb, 59,130,246), 0.18);">
                        <div class="h-full rounded-full" style="width: ${pct}%; background: linear-gradient(90deg, var(--player-card-accent-primary, #3b82f6), var(--player-card-accent-on-dark, #93c5fd));"></div>
                        ${pct > 0 && pct < 100 ? `<div id="score-bar-dot" class="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-gray-900 shadow" style="left: calc(${pct}% - 6px); background-color: var(--player-card-accent-on-dark, var(--player-card-accent-primary));"></div>` : ''}
                    </div>
                    <div class="flex items-center justify-between mt-1">
                        <span class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-600">${minPts} min</span>
                        <span class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-600">${maxPts} max</span>
                    </div>
                </div>
                <div class="cursor-pointer hover:opacity-80 transition-opacity" onclick="showMyUpsideCard()">
                    <div class="flex items-center justify-between mb-1.5">
                        <span class="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Upside <svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg></span>
                        <span class="text-[10px] font-black uppercase tracking-[0.2em] text-white">${upside} / 100</span>
                    </div>
                    <div class="relative h-2 rounded-full overflow-visible" style="background-color: rgba(var(--player-card-accent-primary-rgb, 59,130,246), 0.18);">
                        <div class="h-full rounded-full" style="width: ${upside}%; background: linear-gradient(90deg, var(--player-card-accent-primary, #3b82f6), var(--player-card-accent-on-dark, #93c5fd));"></div>
                        <div id="upside-bar-dot" class="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-gray-900 shadow" style="left: calc(${upside}% - 6px); background-color: var(--player-card-accent-on-dark, var(--player-card-accent-primary));"></div>
                    </div>
                    <div class="flex items-center justify-between mt-1">
                        <span class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-600">0 worst</span>
                        <span class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-600">100 best</span>
                    </div>
                </div>
            `;
            requestAnimationFrame(() => {
                ['upside-bar-dot', 'score-bar-dot'].forEach((id) => {
                    const dot = document.getElementById(id);
                    if (dot) { dot.classList.remove('upside-dot-pulse'); void dot.offsetWidth; dot.classList.add('upside-dot-pulse'); }
                });
            });
        } else if (squadScoreBar) {
            squadScoreBar.classList.add('hidden');
        }

        // Leaderboard with prize badges for P1/P2/P3
        const playerCount = leaderboardData.length;
        const pot = playerCount * 50;
        if (prizePotEl) prizePotEl.textContent = `$${pot.toLocaleString()}`;
        if (playerCountEl) playerCountEl.textContent = `${playerCount} ${playerCount === 1 ? 'entry' : 'entries'}`;
        const prizes = [Math.floor(pot * 0.65), Math.floor(pot * 0.25), Math.floor(pot * 0.10)];

        if (leaderboardEl) {
            const rankStyleMap = {
                1: { border: 'border-yellow-200', bg: '#fffbeb', bar: '#f59e0b', medal: '🥇' },
                2: { border: 'border-gray-200',   bg: '#f8fafc', bar: '#94a3b8', medal: '🥈' },
                3: { border: 'border-orange-100', bg: '#fff7f0', bar: '#f97316', medal: '🥉' },
            };
            const defaultStyle = { border: 'border-gray-100', bg: '#f9fafb', bar: '#9ca3af', medal: '' };

            // Standard competition ranking: two players tied at top both get rank 1,
            // next player gets rank 3 (not 2), etc.
            const ranked = leaderboardData.map((entry) => ({
                entry,
                rank: leaderboardData.filter(e => e.totalPoints > entry.totalPoints).length + 1,
            }));

            // Prize splits: each rank group consumes consecutive prize slots
            let slotIdx = 0;
            const prizeForRank = {};
            for (const rankN of [1, 2, 3]) {
                const count = ranked.filter(r => r.rank === rankN).length;
                if (count === 0) continue;
                const end = Math.min(slotIdx + count, prizes.length);
                const total = prizes.slice(slotIdx, end).reduce((a, b) => a + b, 0);
                const perPlayer = Math.floor(total / count);
                if (perPlayer > 0) prizeForRank[rankN] = `$${perPlayer.toLocaleString()}`;
                slotIdx += count;
                if (slotIdx >= prizes.length) break;
            }

            const renderRow = (entry, rank, prize) => {
                const s = rankStyleMap[rank] || defaultStyle;
                const safeEmail = (entry.email || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                const upside = poolUpsideMap.get(entry.email) ?? 0;
                const ptsDelta = allPointsDeltaMap.get(entry.email) ?? 0;
                return `<div class="dash-lb-row relative flex items-center gap-3 rounded-xl border ${s.border} overflow-visible px-3 py-2 w-full cursor-pointer hover:opacity-90 transition-opacity" style="background-color: ${s.bg};" onclick="showPlayerProfile('${safeEmail}')">
                    <div class="absolute left-0 top-0 bottom-0 w-[3px]" style="background-color: ${s.bar};"></div>
                    ${s.medal ? `<span class="text-xl leading-none shrink-0 pl-1">${s.medal}</span>` : `<span class="text-sm font-black text-gray-400 pl-1 shrink-0 w-6 text-center">#${rank}</span>`}
                    ${_renderPlayerAvatar(entry.avatarUrl, entry.favoriteTeam, 32, entry.nickname)}
                    <div class="min-w-0 flex-1">
                        <div class="truncate text-sm font-black uppercase italic text-gray-900 leading-tight">${escapeHtml(entry.nickname)}</div>
                        ${prize ? `<div class="text-xs font-black" style="color: ${s.bar};">${prize}</div>` : ''}
                    </div>
                    <div class="shrink-0 text-right">
                        <div class="flex items-center justify-end gap-1">
                            ${_renderDashDelta(ptsDelta)}
                            <span class="text-xl font-black text-gray-900">${entry.totalPoints}</span>
                        </div>
                        <div class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">pts</div>
                        ${appSettings.hideTeamSelection ? '' : `<div class="text-[9px] font-black uppercase tracking-[0.15em] mt-0.5" style="color: ${s.bar};">Upside: ${upside}</div>`}
                    </div>
                </div>`;
            };

            const prizeEntries = ranked.filter(({ rank }) => rank <= 3);
            let html = prizeEntries.map(({ entry, rank }) => renderRow(entry, rank, prizeForRank[rank] || '')).join('');

            const myRanked = ranked.find(r => r.entry.email === userEmail);
            const isInPrize = prizeEntries.some(({ entry }) => entry.email === userEmail);
            if (!isInPrize && myRanked) {
                html += `<div class="flex items-center gap-2 py-1 my-1 lg:shrink-0">
                    <div class="flex-1 h-px bg-gray-200"></div>
                    <span class="text-[8px] font-black uppercase tracking-[0.2em] text-gray-300">you</span>
                    <div class="flex-1 h-px bg-gray-200"></div>
                </div>`;
                html += renderRow(myRanked.entry, myRanked.rank, '');
            }

            leaderboardEl.innerHTML = html || '<div class="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">No leaderboard data yet</div>';
        }

        // Build matches cache for both modes (squad + all), then render
        const squadNames = new Set(liveSquad.map((t) => t.name));
        const allFinished = matches.filter((m) => m.is_finished)
            .sort((a, b) => getMatchSortKey(b).localeCompare(getMatchSortKey(a)));
        const squadFinished = allFinished.filter((m) => squadNames.has(m.team_home) || squadNames.has(m.team_away));

        const standings = computeGroupStandings(matches);
        const bestThirdAssignments = _buildBestThirdAssignments(standings);
        const loggedKeySet = new Set(
            matches.filter((m) => m?.match_date_manual)
                .map((m) => `${m.stage}|${m.match_date_manual}|${m.team_home}|${m.team_away}`)
        );
        const upcomingGroupAll = GROUP_STAGE_SCHEDULE
            .filter((m) => m.date >= localTodayKey && !loggedKeySet.has(`Group|${m.date}|${m.home}|${m.away}`) && !loggedKeySet.has(`Group|${m.date}|${m.away}|${m.home}`))
            .map((m) => ({ stage: 'Group', match_date_manual: m.date, team_home: m.home, team_away: m.away, is_finished: false, was_extra_time: false }));
        const upcomingKnockoutAll = KNOCKOUT_SCHEDULE
            .filter((m) => m.date >= localTodayKey)
            .map((m) => {
                const homeRes = _resolveKnockoutMatchTeam(m, 'home', standings, bestThirdAssignments, { matchesCache: matches });
                const awayRes = _resolveKnockoutMatchTeam(m, 'away', standings, bestThirdAssignments, { matchesCache: matches });
                return { stage: m.stage, match_date_manual: m.date, team_home: homeRes?.status !== 'none' ? homeRes.name : 'TBD', team_away: awayRes?.status !== 'none' ? awayRes.name : 'TBD', is_finished: false, was_extra_time: false };
            })
            .filter((m) => !loggedKeySet.has(`${m.stage}|${m.match_date_manual}|${m.team_home}|${m.team_away}`) && !loggedKeySet.has(`${m.stage}|${m.match_date_manual}|${m.team_away}|${m.team_home}`));
        const allUpcoming = [...upcomingGroupAll, ...upcomingKnockoutAll].sort((a, b) => getMatchSortKey(a).localeCompare(getMatchSortKey(b)));
        const squadUpcoming = allUpcoming.filter((m) => squadNames.has(m.team_home) || squadNames.has(m.team_away));

        const toHtml = (arr, opts) => arr.slice(0, 3).map((m) => renderDashboardMatchCard(m, opts)).join('');
        _dashMatchCache = {
            squad: {
                prevHtml: toHtml(squadFinished, { squadNames }),
                nextHtml: toHtml(squadUpcoming, { squadNames }),
            },
            all: {
                prevHtml: toHtml(allFinished, {}),
                nextHtml: toHtml(allUpcoming, {}),
            },
        };
        renderDashMatchesTab();
    } catch (error) {
        if (leaderboardEl) leaderboardEl.innerHTML = '<div class="rounded-2xl border border-red-100 bg-red-50 px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Could not load leaderboard</div>';
    }

    // Mobile hint: nudge the Pool Overview handle twice on load, then again after 5s
    if (window.innerWidth < 1024) {
        const nudge = () => {
            const panel = document.getElementById('dashboard-tabs-panel');
            if (!panel || !panel.classList.contains('dash-sheet-minimized')) return;
            panel.classList.remove('dash-sheet-nudge');
            void panel.offsetWidth; // force reflow to restart animation
            panel.classList.add('dash-sheet-nudge');
            panel.addEventListener('animationend', () => panel.classList.remove('dash-sheet-nudge'), { once: true });
        };
        setTimeout(nudge, 800);
        setTimeout(nudge, 5800);
    }
}

function updatePublicTeamSortIndicators() {
    const sortState = teamResultsSortState['public-team-results-body'];
    const keys = ['team', 'group', 'pickedPct', 'pointsPerDollar', 'total', 'G1', 'G2', 'G3', 'Bonus', 'R32', 'R16', 'QF', 'SM', 'F'];

    keys.forEach((key) => {
        const arrow = document.getElementById(`sort-arrow-public-${key}`);
        if (!arrow) {
            return;
        }

        if (sortState.key === key) {
            arrow.textContent = sortState.direction === 'asc' ? '↑' : '↓';
            arrow.classList.remove('text-gray-500');
            arrow.classList.add('theme-accent-text');
            return;
        }

        arrow.textContent = '↑';
        arrow.classList.remove('theme-accent-text');
        arrow.classList.add('text-gray-500');
    });
}

function updatePublicTeamResultsFilterControls(visibleCount = null) {
    ['all', '1', '2', '3'].forEach((tier) => {
        const button = document.getElementById(`results-tier-filter-${tier}`);
        if (!button) return;
        const isActive = publicTeamResultsFilters.tier === tier;
        button.classList.toggle('bg-gray-900', isActive);
        button.classList.toggle('text-white', isActive);
        button.classList.toggle('shadow-sm', isActive);
        button.classList.toggle('text-gray-500', !isActive);
        button.classList.toggle('hover:text-gray-900', !isActive);
    });

    const regionSelect = document.getElementById('results-region-filter');
    if (regionSelect && regionSelect.value !== publicTeamResultsFilters.region) {
        regionSelect.value = publicTeamResultsFilters.region;
    }

    const minCostInput = document.getElementById('results-cost-min');
    if (minCostInput && minCostInput.value !== publicTeamResultsFilters.minCost) {
        minCostInput.value = publicTeamResultsFilters.minCost;
    }

    const maxCostInput = document.getElementById('results-cost-max');
    if (maxCostInput && maxCostInput.value !== publicTeamResultsFilters.maxCost) {
        maxCostInput.value = publicTeamResultsFilters.maxCost;
    }

    const countLabel = document.getElementById('results-filter-count');
    if (countLabel && visibleCount !== null) {
        countLabel.textContent = `${visibleCount} ${visibleCount === 1 ? 'team' : 'teams'}`;
    }
}

function normalizePublicCostFilter(value) {
    if (value === null || value === undefined || value === '') return '';
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return '';
    return String(Math.max(0, Math.min(50, Math.round(parsed))));
}

function setPublicTeamResultsFilter(key, value) {
    if (!(key in publicTeamResultsFilters)) return;

    if (key === 'tier') {
        publicTeamResultsFilters.tier = ['all', '1', '2', '3'].includes(String(value)) ? String(value) : 'all';
    } else if (key === 'region') {
        publicTeamResultsFilters.region = String(value || 'all');
    } else {
        publicTeamResultsFilters[key] = normalizePublicCostFilter(value);
    }

    updatePublicTeamResultsFilterControls();
    fetchPublicTeamResults();
}

function resetPublicTeamResultsFilters() {
    publicTeamResultsFilters.tier = 'all';
    publicTeamResultsFilters.region = 'all';
    publicTeamResultsFilters.minCost = '';
    publicTeamResultsFilters.maxCost = '';
    updatePublicTeamResultsFilterControls();
    fetchPublicTeamResults();
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
        sortState.direction = key === 'team' || key === 'group' ? 'asc' : 'desc';
    }

    if (targetId === 'public-team-results-body') {
        fetchPublicTeamResults();
    }
}

async function fetchAdminUsers() {
    const body = document.getElementById('admin-players-body');
    if (!body) {
        return;
    }

    body.innerHTML = '<tr><td colspan="7" class="px-5 py-8 text-center text-gray-500 uppercase text-xs">Loading players...</td></tr>';

    try {
        const users = await getAdminUserRecords();
        body.innerHTML = users.map((user) => `
            <tr class="border-t border-gray-800">
                <td class="px-3.5 py-3 align-top min-w-[165px]">
                    <div class="text-[12px] text-white">${user.realname || user.nickname || user.email}</div>
                    <div class="mt-1 text-[9px] italic text-gray-400">${user.nickname || '<span class="not-italic text-gray-500">No nickname</span>'}</div>
                </td>
                <td class="px-3.5 py-3 align-top break-all min-w-[195px] text-[12px]">${user.email}</td>
                <td class="px-3.5 py-3 align-top min-w-[165px]">${renderAdminTeamFlagsByTier(user.teamGroups)}</td>
                <td class="px-3.5 py-3 align-top min-w-[125px]">${formatAdminTeamSavedAt(user.lastTeamSavedAt, user.picksSaveCount)}</td>
                <td class="px-3.5 py-3 align-top text-center">
                    <button aria-label="${user.hasPaid ? 'Set unpaid' : 'Set paid'}" onclick="toggleUserPaidStatus(this, '${user.email.replace(/'/g, "\\'")}', ${user.hasPaid ? 'true' : 'false'})" class="inline-flex h-8 w-[72px] items-center rounded-full border border-gray-600 px-1 transition-colors ${user.hasPaid ? 'bg-green-600/90 border-green-500 justify-end' : 'bg-gray-700 justify-start'}">
                        <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[7px] font-black uppercase tracking-[0.1em] ${user.hasPaid ? 'text-green-700' : 'text-gray-500'}">${user.hasPaid ? 'Paid' : ''}</span>
                    </button>
                </td>
                <td class="px-3.5 py-3 align-top text-center">
                    <button aria-label="${isProtectedAdminEmail(user.email) ? 'Admin account protected' : user.blocked ? 'Set active' : 'Set blocked'}" onclick="${isProtectedAdminEmail(user.email) ? '' : `toggleUserBlockedStatus(this, '${user.email.replace(/'/g, "\\'")}', ${user.blocked ? 'true' : 'false'})`}" class="inline-flex h-8 w-[72px] items-center rounded-full border border-gray-600 px-1 transition-colors ${isProtectedAdminEmail(user.email) ? 'bg-gray-800 border-gray-700 justify-start cursor-not-allowed opacity-70' : user.blocked ? 'bg-red-600/90 border-red-500 justify-end' : 'bg-gray-700 justify-start'}">
                        <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[7px] font-black uppercase tracking-[0.1em] ${isProtectedAdminEmail(user.email) ? 'text-gray-500' : user.blocked ? 'text-red-700' : 'text-gray-500'}">${isProtectedAdminEmail(user.email) ? 'Adm' : user.blocked ? 'Blk' : ''}</span>
                    </button>
                </td>
                <td class="px-3.5 py-3 text-center align-top">
                    <button onclick="deleteUserPicks('${user.email.replace(/'/g, "\\'")}')" class="rounded-xl bg-red-600 px-3.5 py-2 text-[8px] font-black uppercase tracking-[0.16em] text-white hover:bg-red-500 transition-colors">Delete</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="7" class="px-5 py-8 text-center text-gray-500 uppercase text-xs">No player records found.</td></tr>';
    } catch (error) {
        body.innerHTML = '<tr><td colspan="7" class="px-5 py-8 text-center text-red-400 uppercase text-xs">Could not load player records.</td></tr>';
    }
}

function isProtectedAdminEmail(email) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    return normalizedEmail === 'seanigan44@gmail.com' || normalizedEmail === 'harrigan.j.connor@gmail.com';
}

function refreshAdminUsersPreservingScroll() {
    const adminPage = document.getElementById('page-admin');
    const currentScrollTop = adminPage ? adminPage.scrollTop : window.scrollY;
    fetchAdminUsers().finally(() => {
        requestAnimationFrame(() => {
            if (adminPage) {
                adminPage.scrollTop = currentScrollTop;
                return;
            }
            window.scrollTo(0, currentScrollTop);
        });
    });
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
    const [
        { data: profiles, error: profilesError },
        { data: picks, error: picksError }
    ] = await Promise.all([
        supabaseClient.from('profiles').select('email, nickname, realname, has_paid, blocked, avatar_url, updated_at, picks_save_count'),
        supabaseClient.from('picks').select('user_email, team_name, team_nickname, team_realname, updated_at, tier, cost')
    ]);

    if (profilesError) {
        throw profilesError;
    }

    if (picksError) {
        throw picksError;
    }

    const userMap = new Map();

    profiles?.forEach((profile) => {
        userMap.set(profile.email, {
            email: profile.email,
            realname: profile.realname || '',
            nickname: profile.nickname || '',
            hasPaid: Boolean(profile.has_paid),
            blocked: Boolean(profile.blocked),
            teamGroups: { 1: [], 2: [], 3: [] },
            lastTeamSavedAt: null,
            picksSaveCount: Number(profile.picks_save_count || 0)
        });
    });

    picks?.forEach((row) => {
        const teamMeta = teams.find((team) => team.name === row.team_name);
        const tier = Number(row.tier ?? teamMeta?.tier ?? 0);

        if (!userMap.has(row.user_email)) {
            userMap.set(row.user_email, {
                email: row.user_email,
                realname: row.team_realname || '',
                nickname: row.team_nickname || '',
                hasPaid: false,
                blocked: false,
                teamGroups: { 1: [], 2: [], 3: [] },
                lastTeamSavedAt: null,
                picksSaveCount: 0
            });
        }

        const user = userMap.get(row.user_email);

        if (!user.realname && row.team_realname) {
            user.realname = row.team_realname;
        }

        if (!user.nickname && row.team_nickname) {
            user.nickname = row.team_nickname;
        }

        if (teamMeta && user.teamGroups[tier]) {
            user.teamGroups[tier].push(teamMeta);
        }

        if (row.updated_at && (!user.lastTeamSavedAt || new Date(row.updated_at) > new Date(user.lastTeamSavedAt))) {
            user.lastTeamSavedAt = row.updated_at;
        }
    });

    return Array.from(userMap.values()).sort(sortAdminUsers);
}

function renderAdminTeamFlagsByTier(teamGroups) {
    const segments = [1, 2, 3]
        .map((tier) => {
            const tierTeams = (teamGroups?.[tier] || [])
                .slice()
                .sort((a, b) => b.cost - a.cost || a.name.localeCompare(b.name));

            if (tierTeams.length === 0) {
                return '';
            }

            return `
                <div class="flex items-center gap-2">
                    <span class="min-w-[18px] text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">T${tier}</span>
                    <div class="flex flex-wrap gap-1">${tierTeams.map((team) => `<span title="${team.name}" class="text-base">${team.flag}</span>`).join('')}</div>
                </div>
            `;
        })
        .filter(Boolean);

    return segments.join('<div class="h-1"></div>') || '<span class="text-xs italic text-gray-500">No team saved</span>';
}

function formatAdminTeamSavedAt(timestamp, picksSaveCount = 0) {
    if (!timestamp) {
        return `
            <div class="text-xs italic text-red-400">No team saved</div>
            <div class="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">${picksSaveCount} ${picksSaveCount === 1 ? 'save' : 'saves'}</div>
        `;
    }

    const formattedTimestamp = new Date(timestamp).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });

    return `
        <div>${formattedTimestamp}</div>
        <div class="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">${picksSaveCount} ${picksSaveCount === 1 ? 'save' : 'saves'}</div>
    `;
}

function applyPaidToggleVisuals(btn, isPaid) {
    const span = btn.querySelector('span');
    if (isPaid) {
        btn.classList.remove('bg-gray-700', 'justify-start');
        btn.classList.add('bg-green-600/90', 'border-green-500', 'justify-end');
        span.classList.remove('text-gray-500');
        span.classList.add('text-green-700');
        span.textContent = 'Paid';
        btn.setAttribute('aria-label', 'Set unpaid');
    } else {
        btn.classList.remove('bg-green-600/90', 'border-green-500', 'justify-end');
        btn.classList.add('bg-gray-700', 'justify-start');
        span.classList.remove('text-green-700');
        span.classList.add('text-gray-500');
        span.textContent = '';
        btn.setAttribute('aria-label', 'Set paid');
    }
}

function applyBlockedToggleVisuals(btn, isBlocked) {
    const span = btn.querySelector('span');
    if (isBlocked) {
        btn.classList.remove('bg-gray-700', 'justify-start');
        btn.classList.add('bg-red-600/90', 'border-red-500', 'justify-end');
        span.classList.remove('text-gray-500');
        span.classList.add('text-red-700');
        span.textContent = 'Blk';
        btn.setAttribute('aria-label', 'Set active');
    } else {
        btn.classList.remove('bg-red-600/90', 'border-red-500', 'justify-end');
        btn.classList.add('bg-gray-700', 'justify-start');
        span.classList.remove('text-red-700');
        span.classList.add('text-gray-500');
        span.textContent = '';
        btn.setAttribute('aria-label', 'Set blocked');
    }
}

async function toggleUserPaidStatus(btn, email, currentValue) {
    const nextValue = !currentValue;

    // Flip visually right away — no reload needed
    applyPaidToggleVisuals(btn, nextValue);
    btn.onclick = () => toggleUserPaidStatus(btn, email, nextValue);

    const { error } = await supabaseClient
        .from('profiles')
        .update({ has_paid: nextValue })
        .eq('email', email);

    if (error) {
        showToast(error.message || 'Unable to update payment status.');
        // Revert visuals on failure
        applyPaidToggleVisuals(btn, currentValue);
        btn.onclick = () => toggleUserPaidStatus(btn, email, currentValue);
    }
}

async function toggleUserBlockedStatus(btn, email, currentValue) {
    if (isProtectedAdminEmail(email)) {
        showToast('Admin accounts cannot be blocked.');
        return;
    }

    const nextValue = !currentValue;

    applyBlockedToggleVisuals(btn, nextValue);
    btn.onclick = () => toggleUserBlockedStatus(btn, email, nextValue);

    const { error } = await supabaseClient
        .from('profiles')
        .update({ blocked: nextValue })
        .eq('email', email);

    if (error) {
        showToast(error.message || 'Unable to update blocked status.');
        applyBlockedToggleVisuals(btn, currentValue);
        btn.onclick = () => toggleUserBlockedStatus(btn, email, currentValue);
    }
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
    const hasScore = _hasFinalScore(match);

    return `
        <div class="min-w-[92px] py-1 text-center">
            <div class="text-[15px] font-black ${pointsClass} leading-none">${points}</div>
            <div class="mt-2 text-[10px] font-bold ${detailClass} whitespace-nowrap">
                ${homeTeam?.flag || ''} ${hasScore ? `${match.score_home}-${match.score_away}` : 'TBD'} ${awayTeam?.flag || ''}
            </div>
        </div>
    `;
}

async function renderTeamResultsTable(targetId, theme = 'dark') {
    const body = document.getElementById(targetId);
    if (!body) {
        return;
    }
    const isPublicResultsTable = targetId === 'public-team-results-body';
    const columnCount = isPublicResultsTable ? 14 : 13;

    const knockoutStageMap = {
        R32: 'R32',
        R16: 'R16',
        Quarters: 'QF',
        Semis: 'SM',
        Finals: 'F'
    };

    body.innerHTML = `<tr><td colspan="${columnCount}" class="px-4 py-8 text-center text-gray-500 uppercase text-xs">Loading team results...</td></tr>`;

    try {
        await fetchAdvancedTeams();

        const [
            { data: matches, error: matchesError },
            { data: picks, error: picksError },
            { data: profiles, error: profilesError }
        ] = await Promise.all([
            supabaseClient
                .from('matches')
                .select('*')
                .order('match_date_manual', { ascending: true }),
            supabaseClient
                .from('picks')
                .select('user_email, team_name'),
            supabaseClient
                .from('profiles')
                .select('email')
        ]);

        if (matchesError) {
            throw matchesError;
        }

        if (picksError) {
            throw picksError;
        }

        if (profilesError) {
            throw profilesError;
        }

        const playersInPool = new Set((profiles || []).map((profile) => profile.email).filter(Boolean));
        const totalPlayers = playersInPool.size || new Set((picks || []).map((pick) => pick.user_email).filter(Boolean)).size;
        const pickedUsersByTeam = new Map();

        (picks || []).forEach((pick) => {
            if (!pick.team_name || !pick.user_email) {
                return;
            }

            if (!pickedUsersByTeam.has(pick.team_name)) {
                pickedUsersByTeam.set(pick.team_name, new Set());
            }

            pickedUsersByTeam.get(pick.team_name).add(pick.user_email);
        });

        const teamBreakdownMap = buildTeamStageBreakdownMap(matches || [], teams, advancedTeams);

        let rows = [...teams]
            .filter((team) => team.qualified !== false)
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

                const stageBreakdown = teamBreakdownMap[team.name] || {
                    G1: 0,
                    G2: 0,
                    G3: 0,
                    Bonus: 0,
                    R32: 0,
                    R16: 0,
                    QF: 0,
                    SM: 0,
                    F: 0,
                    total: 0
                };
                const totalPoints = stageBreakdown.total;
                const pickedCount = pickedUsersByTeam.get(team.name)?.size || 0;
                const pickedPct = totalPlayers > 0 ? Math.round((pickedCount / totalPlayers) * 100) : 0;
                const teamCost = Number(team.cost || 0);
                const pointsPerDollar = teamCost > 0 ? totalPoints / teamCost : 0;

                return {
                    team,
                    totalPoints,
                    pickedPct,
                    pointsPerDollar,
                    slotPoints: {
                        G1: stageBreakdown.G1,
                        G2: stageBreakdown.G2,
                        G3: stageBreakdown.G3,
                        Bonus: stageBreakdown.Bonus,
                        R32: stageBreakdown.R32,
                        R16: stageBreakdown.R16,
                        QF: stageBreakdown.QF,
                        SM: stageBreakdown.SM,
                        F: stageBreakdown.F
                    },
                    html: `
                    <tr class="border-t border-gray-800 align-top">
                        <td class="px-3 py-3 min-w-[150px]">
                            <div onclick="showTeamOwners('${team.name.replace(/'/g, "\\'")}')" class="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                                <span class="text-2xl">${team.flag}</span>
                                <div>
                                    <div class="text-[12px] font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-gray-900'} hover:underline">
                                        ${team.name}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td class="px-3 py-3 text-center">
                            <div class="min-w-[44px] text-xs font-black uppercase tracking-[0.15em] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}">${team.group}</div>
                        </td>
                        <td class="results-selection-column px-3 py-3 text-center">
                            <div class="min-w-[64px] py-1 text-center">
                                <div class="text-[15px] font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'} leading-none">${pickedPct}%</div>
                                <div class="mt-1 text-[9px] font-black uppercase tracking-[0.14em] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}">${pickedCount} picked</div>
                            </div>
                        </td>
                        ${isPublicResultsTable ? `
                        <td class="px-3 py-3">
                            <div class="min-w-[70px] py-1 text-center">
                                <div class="text-[15px] font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'} leading-none">${pointsPerDollar.toFixed(2)}</div>
                                <div class="mt-1 text-[9px] font-black uppercase tracking-[0.14em] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}">$${teamCost}</div>
                            </div>
                        </td>` : ''}
                        <td class="px-3 py-3">
                            <div class="min-w-[64px] py-1 text-center">
                                <div class="text-[15px] font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'} leading-none">${totalPoints}</div>
                            </div>
                        </td>
                        <td class="px-3 py-3">${formatTeamResultsCell(slots.G1, team.name, theme)}</td>
                        <td class="px-3 py-3">${formatTeamResultsCell(slots.G2, team.name, theme)}</td>
                        <td class="px-3 py-3">${formatTeamResultsCell(slots.G3, team.name, theme)}</td>
                        <td class="px-3 py-3">
                            <div class="min-w-[64px] py-1 text-center">
                                <div class="text-[15px] font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'} leading-none">${stageBreakdown.Bonus || '-'}</div>
                            </div>
                        </td>
                        <td class="px-3 py-3">${formatTeamResultsCell(slots.R32, team.name, theme)}</td>
                        <td class="px-3 py-3">${formatTeamResultsCell(slots.R16, team.name, theme)}</td>
                        <td class="px-3 py-3">${formatTeamResultsCell(slots.QF, team.name, theme)}</td>
                        <td class="px-3 py-3">${formatTeamResultsCell(slots.SM, team.name, theme)}</td>
                        <td class="px-3 py-3">${formatTeamResultsCell(slots.F, team.name, theme)}</td>
                    </tr>
                `
                };
            });

        if (isPublicResultsTable) {
            const minCost = publicTeamResultsFilters.minCost === '' ? null : Number(publicTeamResultsFilters.minCost);
            const maxCost = publicTeamResultsFilters.maxCost === '' ? null : Number(publicTeamResultsFilters.maxCost);
            rows = rows.filter((row) => {
                const teamCost = Number(row.team.cost || 0);
                if (publicTeamResultsFilters.tier !== 'all' && String(row.team.tier) !== publicTeamResultsFilters.tier) return false;
                if (publicTeamResultsFilters.region !== 'all' && row.team.region !== publicTeamResultsFilters.region) return false;
                if (minCost !== null && teamCost < minCost) return false;
                if (maxCost !== null && teamCost > maxCost) return false;
                return true;
            });
        }

        const sortState = teamResultsSortState[targetId];
        if (isPublicResultsTable && appSettings.hideTeamSelection && sortState?.key === 'pickedPct') {
            sortState.key = 'team';
            sortState.direction = 'asc';
        }
        if (sortState) {
            rows.sort((a, b) => {
                let comparison = 0;

                if (sortState.key === 'team') {
                    comparison = a.team.name.localeCompare(b.team.name);
                } else if (sortState.key === 'group') {
                    comparison = a.team.group.localeCompare(b.team.group);
                } else if (sortState.key === 'pickedPct') {
                    comparison = a.pickedPct - b.pickedPct;
                } else if (sortState.key === 'pointsPerDollar') {
                    comparison = a.pointsPerDollar - b.pointsPerDollar;
                } else if (sortState.key === 'total') {
                    comparison = a.totalPoints - b.totalPoints;
                } else {
                    comparison = (a.slotPoints[sortState.key] || 0) - (b.slotPoints[sortState.key] || 0);
                }

                if (comparison === 0) {
                    return a.team.name.localeCompare(b.team.name);
                }

                return sortState.direction === 'asc' ? comparison : -comparison;
            });
        }

        body.innerHTML = rows.map((row) => row.html).join('') || `<tr><td colspan="${columnCount}" class="px-4 py-8 text-center text-gray-500 uppercase text-xs">No teams found.</td></tr>`;

        if (targetId === 'public-team-results-body') {
            updateResultsSelectionVisibility();
            updatePublicTeamSortIndicators();
            updatePublicTeamResultsFilterControls(rows.length);
        }
    } catch (error) {
        body.innerHTML = `<tr><td colspan="${columnCount}" class="px-4 py-8 text-center text-red-400 uppercase text-xs">Could not load team results.</td></tr>`;
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

async function resetAllTeamStatus() {
    const shouldReset = await showConfirmModal({
        label: 'Are You Sure?',
        icon: '⚠️',
        title: 'Reset Tournament Progression?',
        message: 'This will mark every team as not advanced and not eliminated.',
        detail: 'All knockout and elimination flags will be cleared.',
        confirmText: 'Yes, Reset Progression',
        cancelText: 'Cancel'
    });

    if (!shouldReset) return;

    const finalReset = await showConfirmModal({
        label: 'Final Check',
        icon: '🔄',
        title: 'One Last Time',
        message: 'This will wipe all advancement and elimination data for every team.',
        detail: 'Are you absolutely sure?',
        confirmText: 'Reset Progression',
        cancelText: 'Cancel'
    });

    if (!finalReset) return;

    const button = document.getElementById('admin-reset-teams-btn');
    if (button) {
        button.disabled = true;
        button.textContent = 'Resetting...';
    }

    try {
        const { error } = await supabaseClient
            .from('team_advancement')
            .update({ advanced_to_knockouts: false, eliminated: false })
            .neq('team_name', '');
        if (error) throw error;
        showToast('All team status reset.', 'success');
    } catch (error) {
        showToast(error.message || 'Unable to reset team status.');
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = 'Reset Progression';
        }
    }
}

async function clearAllPicks() {
    const shouldClear = await showConfirmModal({
        label: 'Are You Sure?',
        icon: '⚠️',
        title: "Clear Everyone's Picks?",
        message: "This will delete every saved squad in the pool.",
        detail: 'Accounts, profiles, chat history, and payment status will stay intact. Every player will need to re-pick from scratch.',
        confirmText: 'Yes, Clear All Picks',
        cancelText: 'Cancel'
    });
    if (!shouldClear) return;

    const finalClear = await showConfirmModal({
        label: 'Final Check',
        icon: '🗑️',
        title: 'One Last Time',
        message: 'Every saved squad will be permanently deleted.',
        detail: 'Are you absolutely sure?',
        confirmText: 'Clear All Picks',
        cancelText: 'Cancel'
    });
    if (!finalClear) return;

    const button = document.getElementById('admin-clear-picks-btn');
    if (button) {
        button.disabled = true;
        button.textContent = 'Clearing...';
    }

    try {
        const { error } = await supabaseClient
            .from('picks')
            .delete()
            .neq('user_email', '');
        if (error) throw error;

        if (Array.isArray(myPicks) && myPicks.length) {
            myPicks = [];
            updateUI();
        }

        fetchAdminUsers();
        fetchLeaderboard();
        fetchStats();
        showToast("All picks cleared. Players can now re-pick.", 'success');
    } catch (error) {
        showToast(error.message || 'Unable to clear picks.');
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = 'Clear All Picks';
        }
    }
}

async function resetAllMatches() {
    const shouldReset = await showConfirmModal({
        label: 'Are You Sure?',
        icon: '⚠️',
        title: 'Delete All Matches?',
        message: 'This will permanently delete every match result.',
        detail: 'All scores and results will be wiped.',
        confirmText: 'Yes, Delete Matches',
        cancelText: 'Cancel'
    });

    if (!shouldReset) return;

    const finalReset = await showConfirmModal({
        label: 'Final Check',
        icon: '🗑️',
        title: 'One Last Time',
        message: 'Every match result will be permanently deleted.',
        detail: 'Are you absolutely sure?',
        confirmText: 'Delete All Matches',
        cancelText: 'Cancel'
    });

    if (!finalReset) return;

    const button = document.getElementById('admin-reset-matches-btn');
    if (button) {
        button.disabled = true;
        button.textContent = 'Deleting...';
    }

    try {
        const { error } = await supabaseClient
            .from('matches')
            .delete()
            .neq('id', 0);
        if (error) throw error;
        if (appSettings.autoTeamStatusSync) {
            await syncDerivedTeamStatus({ silent: true });
        }
        showToast('All matches deleted.', 'success');
    } catch (error) {
        showToast(error.message || 'Unable to delete matches.');
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = 'Delete All Matches';
        }
    }
}

function _randomInt(maxExclusive) {
    return Math.floor(Math.random() * maxExclusive);
}

function _buildRandomScorePair({ knockout = false } = {}) {
    const weightedScores = [0, 0, 1, 1, 1, 2, 2, 3, 4];
    let scoreHome = weightedScores[_randomInt(weightedScores.length)];
    let scoreAway = weightedScores[_randomInt(weightedScores.length)];
    let wasExtraTime = false;

    if (knockout && scoreHome === scoreAway) {
        wasExtraTime = true;
        if (Math.random() < 0.5) scoreHome += 1;
        else scoreAway += 1;
    }

    return { scoreHome, scoreAway, wasExtraTime };
}

function _buildSimulatedMatchRow(teamHome, teamAway, scheduleMatch, rowIndex, knockout = false) {
    const { scoreHome, scoreAway, wasExtraTime } = _buildRandomScorePair({ knockout });
    const matchDate = new Date(Date.UTC(2026, 0, 1, 0, 0, rowIndex)).toISOString();
    return {
        team_home: teamHome,
        team_away: teamAway,
        score_home: scoreHome,
        score_away: scoreAway,
        stage: scheduleMatch.stage || 'Group',
        is_finished: true,
        match_date: matchDate,
        match_date_manual: scheduleMatch.date,
        was_extra_time: wasExtraTime
    };
}

function _winnerFromMatchRow(matchRow) {
    return matchRow.score_home > matchRow.score_away ? matchRow.team_home : matchRow.team_away;
}

function _loserFromMatchRow(matchRow) {
    return matchRow.score_home > matchRow.score_away ? matchRow.team_away : matchRow.team_home;
}

function _simulateKnockoutRoundRows(stage, entrants, rowIndexStart) {
    const scheduleMatches = KNOCKOUT_SCHEDULE.filter((match) => match.stage === stage);
    const rows = [];
    const winners = [];
    const losers = [];

    entrants.forEach((entry, index) => {
        const scheduleMatch = scheduleMatches[index];
        if (!scheduleMatch) return;
        const row = _buildSimulatedMatchRow(entry.home, entry.away, scheduleMatch, rowIndexStart + index, true);
        rows.push(row);
        winners.push(_winnerFromMatchRow(row));
        losers.push(_loserFromMatchRow(row));
    });

    return { rows, winners, losers };
}

const SIMULATION_STAGE_LABELS = {
    GroupMatchday1: 'group matchday 1',
    GroupMatchday2: 'group matchday 2',
    Group: 'group stage',
    R32: 'Round of 32',
    R16: 'Round of 16',
    Quarters: 'quarter-finals',
    Semis: 'semi-finals',
    Finals: 'tournament'
};

function _buildSimulatedGroupRowsThroughMatchday(maxMatchday) {
    const allowedMatchIds = new Set();

    'ABCDEFGHIJKL'.split('').forEach((groupLetter) => {
        GROUP_STAGE_SCHEDULE
            .filter((match) => match.group === groupLetter)
            .slice(0, Math.max(0, Math.min(3, maxMatchday)) * 2)
            .forEach((match) => allowedMatchIds.add(`${match.group}:${match.date}:${match.home}:${match.away}`));
    });

    return GROUP_STAGE_SCHEDULE
        .filter((match) => allowedMatchIds.has(`${match.group}:${match.date}:${match.home}:${match.away}`))
        .map((match, index) => _buildSimulatedMatchRow(match.home, match.away, { ...match, stage: 'Group' }, index, false));
}

async function simulateAllScheduledMatches() {
    const targetStage = await showSimulationStageModal('Finals');
    if (!targetStage) return;

    const targetLabel = SIMULATION_STAGE_LABELS[targetStage] || 'tournament';
    const shouldSimulate = await showConfirmModal({
        label: 'Testing Tool',
        icon: '🎲',
        title: `Simulate To ${targetLabel[0].toUpperCase()}${targetLabel.slice(1)}?`,
        message: `This will replace all current match results with random scores through the ${targetLabel}.`,
        detail: 'The bracket, table, and standings will all refresh from the simulated results.',
        confirmText: 'Run Simulation',
        cancelText: 'Cancel'
    });

    if (!shouldSimulate) return;

    const button = document.getElementById('admin-simulate-matches-btn');
    if (button) {
        button.disabled = true;
        button.textContent = 'Simulating...';
    }

    try {
        const allQualifiedTeams = teams.filter((team) => team.qualified !== false);
        const groupMatchdayLimit = targetStage === 'GroupMatchday1' ? 1 : targetStage === 'GroupMatchday2' ? 2 : 3;
        const groupRows = _buildSimulatedGroupRowsThroughMatchday(groupMatchdayLimit);

        let allRows = [...groupRows];

        const standings = computeGroupStandings(groupRows);
        const best3rdAssignments = _buildBestThirdAssignments(standings);
        const r32Entrants = KNOCKOUT_SCHEDULE
            .filter((match) => match.stage === 'R32')
            .map((match) => ({
                home: _resolveKnockoutMatchTeam(match, 'home', standings, best3rdAssignments).name,
                away: _resolveKnockoutMatchTeam(match, 'away', standings, best3rdAssignments).name
            }));

        let rowIndex = groupRows.length;
        if (!['GroupMatchday1', 'GroupMatchday2', 'Group'].includes(targetStage)) {
            const r32Round = _simulateKnockoutRoundRows('R32', r32Entrants, rowIndex);
            allRows.push(...r32Round.rows);
            rowIndex += r32Round.rows.length;

            if (['R16', 'Quarters', 'Semis', 'Finals'].includes(targetStage)) {
                const r16Entrants = Array.from({ length: 8 }, (_, index) => ({
                    home: r32Round.winners[index * 2],
                    away: r32Round.winners[index * 2 + 1]
                }));
                const r16Round = _simulateKnockoutRoundRows('R16', r16Entrants, rowIndex);
                allRows.push(...r16Round.rows);
                rowIndex += r16Round.rows.length;

                if (['Quarters', 'Semis', 'Finals'].includes(targetStage)) {
                    const qfEntrants = Array.from({ length: 4 }, (_, index) => ({
                        home: r16Round.winners[index * 2],
                        away: r16Round.winners[index * 2 + 1]
                    }));
                    const qfRound = _simulateKnockoutRoundRows('Quarters', qfEntrants, rowIndex);
                    allRows.push(...qfRound.rows);
                    rowIndex += qfRound.rows.length;

                    if (['Semis', 'Finals'].includes(targetStage)) {
                        const semiEntrants = Array.from({ length: 2 }, (_, index) => ({
                            home: qfRound.winners[index * 2],
                            away: qfRound.winners[index * 2 + 1]
                        }));
                        const semiRound = _simulateKnockoutRoundRows('Semis', semiEntrants, rowIndex);
                        allRows.push(...semiRound.rows);
                        rowIndex += semiRound.rows.length;

                        if (targetStage === 'Finals') {
                            const finalsEntrants = [
                                { home: semiRound.losers[0], away: semiRound.losers[1] },
                                { home: semiRound.winners[0], away: semiRound.winners[1] }
                            ];
                            const finalsRound = _simulateKnockoutRoundRows('Finals', finalsEntrants, rowIndex);
                            allRows.push(...finalsRound.rows);
                        }
                    }
                }
            }
        }

        let error;
        ({ error } = await supabaseClient.from('matches').delete().neq('id', 0));
        if (error) throw error;

        ({ error } = await supabaseClient.from('matches').insert(allRows.map((r) => ({ ...r, manual_override: true }))));
        if (error) throw error;

        const derivedTeamStatusRows = _buildDerivedTeamStatusRows(allRows);
        const advancementRows = derivedTeamStatusRows.concat(
            allQualifiedTeams
                .filter((team) => !derivedTeamStatusRows.some((row) => row.team_name === team.name))
                .map((team) => ({ team_name: team.name, advanced_to_knockouts: false, eliminated: false }))
        );

        ({ error } = await supabaseClient
            .from('team_advancement')
            .upsert(advancementRows, { onConflict: 'team_name' }));
        if (error) throw error;

        if (appSettings.autoTeamStatusSync) {
            await syncDerivedTeamStatus({ silent: true });
        }

        await fetchAdvancedTeams();
        await fetchAdminHistory(true);
        await fetchAdminAdvancement();
        await Promise.all([
            fetchPublicResults(),
            fetchPublicTeamResults(),
            fetchLeaderboard(),
            fetchStats(),
            setupDashboard()
        ]);
        renderGroups();

        showToast(`Random simulation complete through the ${targetLabel}.`, 'success');
    } catch (error) {
        showToast(error.message || 'Unable to simulate matches.');
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = 'Run Simulation';
        }
    }
}

async function deleteUserPicks(email) {
    const shouldDelete = await showConfirmModal({
        label: 'Are You Sure?',
        icon: '⚠️',
        title: 'Delete Saved Picks?',
        message: `This will delete only the saved team picks for ${email}.`,
        detail: 'Their account, profile, chat history, and payment status will stay intact.',
        confirmText: 'Yes, Delete Picks',
        cancelText: 'No, Keep'
    });

    if (!shouldDelete) {
        return;
    }

    const finalDelete = await showConfirmModal({
        label: 'Final Check',
        icon: '🗑️',
        title: 'One Last Time',
        message: 'I will ask you one last time.',
        detail: 'Are you absolutely sure you want to permanently remove this player’s saved picks?',
        confirmText: 'Delete Picks',
        cancelText: 'Keep Picks'
    });

    if (!finalDelete) {
        return;
    }

    try {
        const { error: picksError } = await supabaseClient
            .from('picks')
            .delete()
            .eq('user_email', email);

        if (picksError) {
            throw picksError;
        }

        if (userEmail === email) {
            myPicks = [];
            updateUI();
        }

        fetchAdminUsers();
        fetchLeaderboard();
        fetchStats();
        showToast('Saved picks deleted.', 'success');
    } catch (error) {
        showToast(error.message || 'Unable to delete saved picks.');
    }
}

async function fetchAdminHistory(highlightLatest = false) {
    const container = document.getElementById('admin-history-log');
    if (!container) return;

    const [
        { data: matches },
        { data: picks },
        { data: profiles }
    ] = await Promise.all([
        supabaseClient.from('matches').select('*').order('match_date_manual', { ascending: false }),
        supabaseClient.from('picks').select('user_email, team_name'),
        supabaseClient.from('profiles').select('email')
    ]);

    // Keep schedule browser in sync
    _scheduleBrowserLoggedCache = matches || [];
    _syncScheduleBrowserToCurrentProgress();
    const historyMatches = (matches || []).slice(0, 100);

    const selectionStats = buildSelectionStatsSnapshot(picks || [], profiles || []);
    const teamOwnership = new Map();
    selectionStats.sortedCountryCounts.forEach((entry) => {
        teamOwnership.set(entry.teamName, { pickedCount: entry.pickedCount, percentage: entry.percentage });
    });

    const ownershipMarkup = (teamName) => {
        if (appSettings.hideTeamSelection) return '';
        const { pickedCount = 0, percentage = 0 } = teamOwnership.get(teamName) || {};
        return `<div class="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">${pickedCount} picked${selectionStats.totalPlayers > 0 ? ` · ${percentage}%` : ''}</div>`;
    };

    const buildPointsLabel = (match) => {
        if (!_hasFinalScore(match)) {
            return 'Upcoming';
        }

        if (match.score_home === match.score_away) {
            const pts = getMatchPointsForTeam(match, match.team_home);
            return `${pts} pt${pts === 1 ? '' : 's'} each`;
        }
        const winner = match.score_home > match.score_away ? match.team_home : match.team_away;
        const pts = getMatchPointsForTeam(match, winner);
        return `${pts} pts awarded`;
    };
    const groupedMatches = historyMatches.reduce((acc, match, index) => {
        const dateKey = match.match_date_manual || 'TBD';
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push({ match, index });
        return acc;
    }, {});

    container.innerHTML = Object.entries(groupedMatches).map(([date, dateMatches]) => `
        <div class="space-y-2">
            <div class="flex items-center gap-3 pt-2">
                <div class="h-px flex-1 bg-gray-700"></div>
                <div class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">${date}</div>
                <div class="h-px flex-1 bg-gray-700"></div>
            </div>
            <div class="space-y-2">
                ${dateMatches.map(({ match, index }) => {
                    const homeTeam = teams.find((t) => t.name === match.team_home);
                    const awayTeam = teams.find((t) => t.name === match.team_away);
                    const stageLabel = _getMatchStageDisplayLabel(match);
                    const hasScore = _hasFinalScore(match);
                    return `
                        <div class="bg-gray-800 rounded-2xl border border-gray-700 px-4 py-3 ${highlightLatest && index === 0 ? 'result-flash' : ''}">
                            <div class="grid grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)_24px] md:grid-cols-[minmax(0,1fr)_128px_minmax(0,1fr)_24px] items-center gap-3">
                                <div class="text-left min-w-0">
                                    <div class="text-sm md:text-base font-black text-white truncate">${homeTeam?.flag || ''} ${match.team_home}</div>
                                    ${ownershipMarkup(match.team_home)}
                                </div>
                                <div class="text-center">
                                    <div class="text-[8px] font-black uppercase tracking-[0.15em] text-gray-500 mb-1">${stageLabel}</div>
                                    <div class="bg-gray-950 text-white font-mono font-black text-sm md:text-base tabular-nums px-2.5 py-1 rounded-lg text-center">${hasScore ? `${match.score_home} – ${match.score_away}` : 'TBD'}</div>
                                    <div class="mt-1 text-[8px] font-black uppercase tracking-[0.12em] text-gray-500">${buildPointsLabel(match)}</div>
                                    ${match.was_extra_time ? '<div class="mt-0.5 text-[8px] font-black uppercase text-red-400">E/P</div>' : ''}
                                    ${_matchSourceBadge(match)}
                                </div>
                                <div class="text-right min-w-0">
                                    <div class="text-sm md:text-base font-black text-white truncate">${match.team_away} ${awayTeam?.flag || ''}</div>
                                    ${ownershipMarkup(match.team_away)}
                                </div>
                                <div class="text-right">
                                    <button onclick="deleteMatch(${match.id})" class="text-gray-600 hover:text-red-500 text-lg font-black transition-colors leading-none">×</button>
                                </div>
                            </div>
                        </div>`;
                }).join('')}
            </div>
        </div>
    `).join('') || '<div class="text-center py-10 text-gray-600 uppercase text-xs font-black">No matches logged yet</div>';
}

async function fetchPublicResults() {
    const container = document.getElementById('public-history-log');
    if (!container) {
        return;
    }

    const [
        { data: matches, error: matchesError },
        { data: picks, error: picksError },
        { data: profiles, error: profilesError }
    ] = await Promise.all([
        supabaseClient
            .from('matches')
            .select('*')
            .order('match_date_manual', { ascending: false })
            .limit(200),
        supabaseClient
            .from('picks')
            .select('user_email, team_name'),
        supabaseClient
            .from('profiles')
            .select('email')
    ]);

    if (matchesError) {
        throw matchesError;
    }

    if (picksError) {
        throw picksError;
    }

    if (profilesError) {
        throw profilesError;
    }

    const selectionStats = buildSelectionStatsSnapshot(picks || [], profiles || []);
    const teamOwnership = new Map();
    selectionStats.sortedCountryCounts.forEach((entry) => {
        teamOwnership.set(entry.teamName, {
            pickedCount: entry.pickedCount,
            percentage: entry.percentage
        });
    });

    const ownershipMarkup = (teamName) => {
        if (appSettings.hideTeamSelection) {
            return '';
        }

        const pickedCount = teamOwnership.get(teamName)?.pickedCount || 0;
        const percentage = teamOwnership.get(teamName)?.percentage || 0;
        return `
            <div class="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                ${pickedCount} picked${selectionStats.totalPlayers > 0 ? ` · ${percentage}%` : ''}
            </div>
        `;
    };
    const buildPointsAwardedLabel = (match) => {
        if (!_hasFinalScore(match)) {
            return 'Upcoming';
        }

        if (match.score_home === match.score_away) {
            const drawPoints = getMatchPointsForTeam(match, match.team_home);
            return `${drawPoints} pt${drawPoints === 1 ? '' : 's'} each`;
        }

        const winningTeam = match.score_home > match.score_away ? match.team_home : match.team_away;
        const awardedPoints = getMatchPointsForTeam(match, winningTeam);
        return `${awardedPoints} pts awarded`;
    };

    // Keep public bracket in sync
    _publicMatchesCache = matches || [];
    renderKnockoutBracket(_publicMatchesCache);

    const groupedMatches = (matches || []).reduce((acc, match) => {
        const dateKey = match.match_date_manual || 'TBD';
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(match);
        return acc;
    }, {});

    container.innerHTML = Object.entries(groupedMatches).map(([date, dateMatches]) => `
        <section class="space-y-2">
            <div class="flex items-center gap-3 px-1 pt-1">
                <div class="h-px flex-1 bg-gray-200"></div>
                <div class="theme-accent-text text-[9px] font-black uppercase tracking-[0.22em]">${date}</div>
                <div class="h-px flex-1 bg-gray-200"></div>
            </div>
            <div class="space-y-2">
                ${dateMatches.map((match) => {
                    const homeTeam = teams.find((team) => team.name === match.team_home);
                    const awayTeam = teams.find((team) => team.name === match.team_away);
                    const stageLabel = _getMatchStageDisplayLabel(match);
                    const hasScore = _hasFinalScore(match);

                    return `
                        <div class="rounded-[24px] border border-gray-200 bg-white px-3 py-2.5 md:px-4 md:py-3 text-left">
                            <div class="grid grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)] items-center gap-2.5 md:grid-cols-[minmax(180px,1fr)_108px_minmax(180px,1fr)] md:gap-4">
                                <div class="min-w-0 text-left">
                                    <div onclick="showTeamOwners('${match.team_home.replace(/'/g, "\\'")}')" class="text-[13px] md:text-base font-black leading-tight truncate cursor-pointer hover:underline">${homeTeam?.flag || ''} ${match.team_home}</div>
                                    ${ownershipMarkup(match.team_home)}
                                </div>
                                <div class="text-center">
                                    <div class="mb-1 text-[8px] font-black uppercase tracking-[0.16em] text-gray-400">
                                        ${stageLabel}
                                    </div>
                                    <div class="rounded-lg bg-gray-900 px-2 py-1 text-center font-mono text-sm md:text-lg font-black tabular-nums text-white">
                                        ${hasScore ? `${match.score_home} - ${match.score_away}` : 'TBD'}
                                    </div>
                                    <div class="mt-1 text-[8px] font-black uppercase tracking-[0.12em] text-gray-400">
                                        ${buildPointsAwardedLabel(match)}
                                    </div>
                                </div>
                                <div class="min-w-0 text-right">
                                    <div onclick="showTeamOwners('${match.team_away.replace(/'/g, "\\'")}')" class="text-[13px] md:text-base font-black leading-tight truncate cursor-pointer hover:underline">${match.team_away} ${awayTeam?.flag || ''}</div>
                                    ${ownershipMarkup(match.team_away)}
                                </div>
                            </div>
                            ${match.was_extra_time ? '<div class="mt-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-red-500 text-right">ET/Pens Result</div>' : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </section>
    `).join('') || '<div class="text-center py-20 text-gray-400 font-bold uppercase text-xs text-center">Tournament results will appear here once matches begin.</div>';
}

async function deleteMatch(id) {
    const shouldDelete = await showConfirmModal({
        label: 'Are You Sure?',
        icon: '🗑️',
        title: 'Delete Match Result?',
        message: 'This will remove the saved score for this match.',
        detail: 'The schedule, standings, bracket, and leaderboard will refresh afterward.',
        confirmText: 'Delete Result',
        cancelText: 'Cancel'
    });

    if (!shouldDelete) {
        return;
    }

    await supabaseClient.from('matches').delete().eq('id', id);
    if (appSettings.autoTeamStatusSync) {
        await syncDerivedTeamStatus({ silent: true });
    }
    fetchAdminHistory();
    fetchLeaderboard();
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
    const knockoutStages = ['R32', 'R16', 'Quarters', 'Semis', 'Finals'];

    if (!team1 || !team2 || Number.isNaN(score1) || Number.isNaN(score2) || !matchDate) {
        return showToast('Check all fields!');
    }

    if (team1 === team2) {
        return showToast('Teams must be different!');
    }

    if (knockoutStages.includes(stage) && score1 === score2) {
        await showConfirmModal({
            label: 'Winner Needed',
            icon: '⚠️',
            title: 'Knockout Matches Need A Winner',
            message: 'A knockout match cannot be saved as a draw.',
            detail: 'If it went to penalties or extra time, enter the final winning score such as 2-1 and set Extra Time / Pens to Yes.',
            confirmText: 'Okay',
            singleAction: true
        });
        return;
    }

    const button = document.getElementById('admin-submit-btn');
    button.innerText = 'SAVING...';
    button.disabled = true;

    const editId = window._editingMatchId || null;

    try {
        let error;

        if (editId) {
            ({ error } = await supabaseClient.from('matches').update({
                team_home: team1,
                team_away: team2,
                score_home: score1,
                score_away: score2,
                stage,
                is_finished: true,
                match_date_manual: matchDate,
                was_extra_time: wasExtraTime,
                manual_override: true
            }).eq('id', editId));
        } else {
            ({ error } = await supabaseClient.from('matches').insert([{
                team_home: team1,
                team_away: team2,
                score_home: score1,
                score_away: score2,
                stage,
                is_finished: true,
                match_date: new Date().toISOString(),
                match_date_manual: matchDate,
                was_extra_time: wasExtraTime,
                manual_override: true
            }]));
        }

        if (error) {
            throw error;
        }

        window._editingMatchId = null;
        showToast(editId ? 'Updated!' : 'Logged!', 'success');
        document.getElementById('admin-score1').value = '';
        document.getElementById('admin-score2').value = '';

        // Refresh history with the flash animation on the new top row, then scroll to it
        await fetchAdminHistory(true);
        const historyEl = document.getElementById('admin-history-log');
        if (historyEl) {
            historyEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        fetchPublicTeamResults();
        fetchPublicResults();
        renderGroups();
        fetchLeaderboard();
        fetchStats();
        setupDashboard();
        if (appSettings.autoTeamStatusSync) {
            await syncDerivedTeamStatus({ silent: true });
        }

        // Post a match result system message to the chat so everyone sees the score.
        const getFlag = (name) => (teams.find((t) => t.name === name) || {}).flag || '';
        const stageLabels = { R32: 'Round of 32', R16: 'Round of 16', Quarters: 'Quarter-Final', Semis: 'Semi-Final', Finals: 'Final' };
        const stageLabel = stage === 'Group'
            ? (_findGroupScheduleMatch(team1, team2, matchDate)?.group ? `Group ${_findGroupScheduleMatch(team1, team2, matchDate).group}` : 'Group Stage')
            : (stageLabels[stage] || stage);
        postSystemMessage('match_result', `${getFlag(team1)} ${team1} ${score1}–${score2} ${team2} ${getFlag(team2)} · ${stageLabel}`);

        // For knockout matches with a clear winner, also post an elimination strip.
        if (stage !== 'Group' && score1 !== score2) {
            const loser = score1 < score2 ? team1 : team2;
            postSystemMessage('elimination', `${getFlag(loser)} ${loser} eliminated`);
        }
    } catch (error) {
        showToast(error.message);
    } finally {
        button.innerText = 'Log Result';
        button.disabled = false;
    }
}

function _renderPlayerAvatar(avatarUrl, favoriteTeam, size = 32, nickname = '') {
    const favKey = (favoriteTeam || '').trim().toLowerCase();
    const fav = favKey
        ? (typeof teams !== 'undefined' ? teams : []).find((t) => (t.name || '').trim().toLowerCase() === favKey)
        : null;
    const flag = fav?.flag || '';
    const initial = (nickname || '').trim().charAt(0).toUpperCase() || '?';

    let badgeBg = '#111827';
    let badgeBorder = '#374151';
    if (fav && typeof getFavoriteTeamAccentTokens === 'function') {
        try {
            const tokens = getFavoriteTeamAccentTokens(fav.name);
            if (tokens?.softStrong) badgeBg = tokens.softStrong;
            if (tokens?.primary) badgeBorder = tokens.primary;
        } catch (e) { /* keep defaults */ }
    }

    const img = avatarUrl
        ? `<img src="${escapeHtml(avatarUrl)}" alt="" class="w-full h-full object-cover" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling && (this.nextElementSibling.style.display='flex');">
           <div class="w-full h-full bg-gray-700 text-gray-200 font-black flex items-center justify-center" style="display:none;font-size:${Math.round(size * 0.45)}px">${escapeHtml(initial)}</div>`
        : `<div class="w-full h-full bg-gray-700 text-gray-200 font-black flex items-center justify-center" style="font-size:${Math.round(size * 0.45)}px">${escapeHtml(initial)}</div>`;
    const badgeSize = Math.max(16, Math.round(size * 0.6));
    const badgeOffset = -Math.round(badgeSize * 0.3);
    const flagBadge = flag
        ? `<span class="avatar-flag-badge absolute rounded-full flex items-center justify-center leading-none" style="top:${badgeOffset}px;left:${badgeOffset}px;background-color:${badgeBg};border:1.5px solid ${badgeBorder};width:${badgeSize}px;height:${badgeSize}px;font-size:${Math.round(badgeSize * 0.65)}px;z-index:10">${flag}</span>`
        : '';
    return `<div class="relative rounded-full overflow-visible shrink-0" style="width:${size}px;height:${size}px">
        <div class="absolute inset-0 rounded-full overflow-hidden">${img}</div>
        ${flagBadge}
    </div>`;
}

function _ordinalSuffix(n) {
    const m100 = n % 100;
    if (m100 >= 11 && m100 <= 13) return 'th';
    switch (n % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

function _renderDashDelta(delta) {
    if (!delta || delta === 0) return '';
    if (delta > 0) return `<span class="mr-1 text-[10px] font-black text-green-500 leading-none">↑${delta}</span>`;
    return `<span class="mr-1 text-[10px] font-black text-red-500 leading-none">↓${Math.abs(delta)}</span>`;
}

function _getPlayerDisplayRanks(leaderboardData = []) {
    const ranks = {};
    let displayRank = 0;
    let previousPoints = null;

    leaderboardData.forEach((user, index) => {
        if (user.totalPoints !== previousPoints) {
            displayRank = index + 1;
            previousPoints = user.totalPoints;
        }
        ranks[user.email] = displayRank;
    });

    return ranks;
}

function _awardPlayerChip(chipsByEmail, emails, chipId, chipBuilder = null) {
    const chip = PLAYER_CHIP_DEFINITIONS[chipId];
    if (!chip) {
        return;
    }

    [...new Set((emails || []).filter(Boolean))].forEach((email) => {
        if (!chipsByEmail.has(email)) {
            chipsByEmail.set(email, []);
        }
        const list = chipsByEmail.get(email);
        if (!list.some((entry) => entry.id === chipId)) {
            const builtChip = typeof chipBuilder === 'function' ? chipBuilder(email) : null;
            list.push({ ...chip, ...(builtChip || {}) });
        }
    });
}

function _buildTeamGoalsMap(matches = []) {
    const goalsByTeam = new Map();

    (matches || []).forEach((match) => {
        if (match.stage !== 'Group') {
            return;
        }

        const homeGoals = Number(match.score_home);
        const awayGoals = Number(match.score_away);
        if (!Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) {
            return;
        }

        goalsByTeam.set(match.team_home, (goalsByTeam.get(match.team_home) || 0) + homeGoals);
        goalsByTeam.set(match.team_away, (goalsByTeam.get(match.team_away) || 0) + awayGoals);
    });

    return goalsByTeam;
}

function _getLatestCompletedStageKey(leaderboardData = []) {
    const stageOrder = ['F', 'SM', 'QF', 'R16', 'R32', 'Bonus', 'G3', 'G2', 'G1'];
    return stageOrder.find((stageKey) => (
        leaderboardData.some((user) => Number(user.stagePoints?.[stageKey] || 0) > 0)
    )) || null;
}

function _getStageDisplayName(stageKey) {
    const labels = {
        G1: 'Group Matchday 1',
        G2: 'Group Matchday 2',
        G3: 'Group Matchday 3',
        Bonus: 'Group Bonus',
        R32: 'Round of 32',
        R16: 'Round of 16',
        QF: 'Quarter-finals',
        SM: 'Semi-finals',
        F: 'Finals'
    };
    return labels[stageKey] || stageKey;
}

function computePlayerChips(leaderboardData = [], matches = [], previousRanks = {}) {
    const chipsByEmail = new Map();
    const currentRanks = _getPlayerDisplayRanks(leaderboardData);
    const goalsByTeam = _buildTeamGoalsMap(matches);
    const latestStageKey = _getLatestCompletedStageKey(leaderboardData);
    const teamOwnershipCounts = new Map();

    leaderboardData.forEach((user) => {
        chipsByEmail.set(user.email, []);
        const uniqueTeams = new Set((user.squad || []).map((team) => team.name));
        uniqueTeams.forEach((teamName) => {
            teamOwnershipCounts.set(teamName, (teamOwnershipCounts.get(teamName) || 0) + 1);
        });
    });

    const squadCostByEmail = new Map();
    const uniqueTeamCountByEmail = new Map();
    const mostPopularTeamCount = Math.max(0, ...teamOwnershipCounts.values());
    const mostPopularTeams = new Set(
        [...teamOwnershipCounts.entries()]
            .filter(([, count]) => count === mostPopularTeamCount && count > 0)
            .map(([teamName]) => teamName)
    );

    const playerMetrics = leaderboardData.map((user) => {
        const squad = user.squad || [];
        const squadCost = squad.reduce((sum, team) => sum + Number(team.cost || 0), 0);
        const eliminatedCount = squad.filter((team) => eliminatedTeams.has(team.name)).length;
        const remainingCount = squad.filter((team) => !eliminatedTeams.has(team.name)).length;
        const tierOneMaxCost = Math.max(0, ...squad.filter((team) => Number(team.tier) === 1).map((team) => Number(team.cost || 0)));
        const groupPoints = Number(user.stagePoints?.G1 || 0) + Number(user.stagePoints?.G2 || 0) + Number(user.stagePoints?.G3 || 0);
        const recentStagePoints = latestStageKey ? Number(user.stagePoints?.[latestStageKey] || 0) : null;
        const uniqueOnlyCount = squad.filter((team) => teamOwnershipCounts.get(team.name) === 1).length;
        const totalGoals = squad.reduce((sum, team) => sum + Number(goalsByTeam.get(team.name) || 0), 0);
        const distinctGroups = new Set(squad.map((team) => team.group).filter(Boolean)).size;
        const crowdPleaserCount = squad.filter((team) => mostPopularTeams.has(team.name)).length;
        const rank = currentRanks[user.email] || null;
        const previousRank = Number(previousRanks?.[user.email]);
        const rankDelta = Number.isFinite(previousRank) ? previousRank - rank : null;
        const allThrough = squad.length > 0
            && Number(user.stagePoints?.Bonus || 0) >= squad.length
            && squad.every((team) => !eliminatedTeams.has(team.name));
        const wipedOut = squad.length > 0 && eliminatedCount === squad.length;

        squadCostByEmail.set(user.email, squadCost);
        uniqueTeamCountByEmail.set(user.email, new Set(squad.map((team) => team.name)).size);

        return {
            user,
            squad,
            squadCost,
            eliminatedCount,
            remainingCount,
            tierOneMaxCost,
            groupPoints,
            recentStagePoints,
            uniqueOnlyCount,
            totalGoals,
            distinctGroups,
            crowdPleaserCount,
            rank,
            rankDelta,
            allThrough,
            wipedOut,
            valueRatio: squadCost > 0 ? user.totalPoints / squadCost : 0
        };
    });

    const playerMetricByEmail = new Map(playerMetrics.map((entry) => [entry.user.email, entry]));

    const awardMax = (chipId, getValue, predicate = (value) => value > 0, describe = null) => {
        let best = null;
        let emails = [];

        playerMetrics.forEach((entry) => {
            const value = getValue(entry);
            if (!predicate(value, entry)) {
                return;
            }

            if (best === null || value > best) {
                best = value;
                emails = [entry.user.email];
            } else if (value === best) {
                emails.push(entry.user.email);
            }
        });

        _awardPlayerChip(chipsByEmail, emails, chipId, describe ? (email) => describe(playerMetricByEmail.get(email), best) : null);
    };

    const awardMin = (chipId, getValue, predicate = () => true, describe = null) => {
        let best = null;
        let emails = [];

        playerMetrics.forEach((entry) => {
            const value = getValue(entry);
            if (!predicate(value, entry)) {
                return;
            }

            if (best === null || value < best) {
                best = value;
                emails = [entry.user.email];
            } else if (value === best) {
                emails.push(entry.user.email);
            }
        });

        _awardPlayerChip(chipsByEmail, emails, chipId, describe ? (email) => describe(playerMetricByEmail.get(email), best) : null);
    };

    _awardPlayerChip(
        chipsByEmail,
        playerMetrics.filter((entry) => entry.rank === 1).map((entry) => entry.user.email),
        'leader',
        (email) => {
            const entry = playerMetricByEmail.get(email);
            return {
                description: `Sitting in 1st place with ${entry?.user.totalPoints || 0} total points.`
            };
        }
    );

    if (latestStageKey) {
        awardMax(
            'hot',
            (entry) => entry.recentStagePoints,
            (value) => Number.isFinite(value) && value > 0,
            (entry, best) => ({ description: `Led the pool with ${best} points in the ${_getStageDisplayName(latestStageKey)}.` })
        );
        awardMin(
            'ice_cold',
            (entry) => entry.recentStagePoints,
            (value, entry) => Number.isFinite(value) && entry.user.totalPoints > 0,
            (entry, best) => ({ description: `${best} points in ${_getStageDisplayName(latestStageKey)} was the lowest return among active scorers.` })
        );
    }

    awardMax(
        'group_king',
        (entry) => entry.groupPoints,
        (value) => value > 0,
        (entry, best) => ({ description: `Led the pool with ${best} group-stage points across all three matchdays.` })
    );
    _awardPlayerChip(
        chipsByEmail,
        playerMetrics.filter((entry) => entry.allThrough).map((entry) => entry.user.email),
        'all_through',
        (email) => {
            const entry = playerMetricByEmail.get(email);
            return {
                description: `${entry?.remainingCount || 0} of ${entry?.squad.length || 0} picks are still alive after every squad team got through the groups.`
            };
        }
    );
    awardMax(
        'big_dog',
        (entry) => entry.tierOneMaxCost,
        (value) => value > 0,
        (entry, best) => ({ description: `Carries a Tier 1 heavyweight worth $${best}.` })
    );
    awardMax(
        'on_the_rise',
        (entry) => entry.rankDelta,
        (value) => Number.isFinite(value) && value > 0,
        (entry, best) => ({ description: `Up ${best} spot${best === 1 ? '' : 's'} since the last leaderboard snapshot.` })
    );
    awardMin(
        'freefall',
        (entry) => entry.rankDelta,
        (value) => Number.isFinite(value) && value < 0,
        (entry, best) => ({ description: `Down ${Math.abs(best)} spot${Math.abs(best) === 1 ? '' : 's'} since the last leaderboard snapshot.` })
    );
    awardMax(
        'sharpshooter',
        (entry) => entry.totalGoals,
        (value) => value > 0,
        (entry, best) => ({ description: `${best} total group-stage goals from teams in this squad.` })
    );
    awardMax(
        'contrarian',
        (entry) => entry.uniqueOnlyCount,
        (value) => value > 0,
        (entry, best) => ({ description: `${best} uniquely owned team${best === 1 ? '' : 's'} that nobody else picked.` })
    );
    awardMax(
        'value_pick',
        (entry) => entry.valueRatio,
        (value) => Number.isFinite(value) && value > 0,
        (entry) => ({ description: `${entry.user.totalPoints} points from a $${entry.squadCost} squad is the best points-per-budget return.` })
    );
    awardMax(
        'still_standing',
        (entry) => entry.remainingCount,
        (value) => value > 0,
        (entry, best) => ({ description: `${best} team${best === 1 ? '' : 's'} still alive in the tournament.` })
    );
    _awardPlayerChip(
        chipsByEmail,
        playerMetrics.filter((entry) => entry.wipedOut).map((entry) => entry.user.email),
        'wiped_out',
        (email) => {
            const entry = playerMetricByEmail.get(email);
            return {
                description: `${entry?.eliminatedCount || 0} of ${entry?.squad.length || 0} picks have been eliminated.`
            };
        }
    );
    awardMax(
        'early_graves',
        (entry) => entry.eliminatedCount,
        (value) => value > 0,
        (entry, best) => ({ description: `${best} squad team${best === 1 ? '' : 's'} have already been knocked out.` })
    );
    awardMax(
        'united_nations',
        (entry) => entry.distinctGroups,
        (value) => value > 0,
        (entry, best) => ({ description: `This squad spans ${best} different World Cup group${best === 1 ? '' : 's'}.` })
    );
    awardMax(
        'crowd_pleaser',
        (entry) => entry.crowdPleaserCount,
        (value) => value > 0,
        (entry, best) => ({ description: `${best} of the pool’s most popular team picks are in this squad.` })
    );
    awardMax(
        'all_in',
        (entry) => entry.squadCost,
        (value) => value >= 145,
        (entry) => ({ description: `$${entry.squadCost} spent, leaving just $${Math.max(0, 150 - entry.squadCost)} in the bank.` })
    );

    const bottomHalfThreshold = Math.ceil(playerMetrics.length / 2);
    awardMax(
        'splurge',
        (entry) => entry.squadCost,
        (value, entry) => value >= 145 && Number(entry.rank || 0) > bottomHalfThreshold,
        (entry) => ({ description: `$${entry.squadCost} spent while sitting ${entry.rank}${entry.rank === 1 ? 'st' : entry.rank === 2 ? 'nd' : entry.rank === 3 ? 'rd' : 'th'} overall.` })
    );

    const reportCardScores = playerMetrics.map((entry) => {
        const rc = _computeReportCard(entry.squad);
        return { email: entry.user.email, total: rc ? rc.total : null };
    }).filter((e) => e.total !== null);

    awardMax(
        'best_student',
        (entry) => { const r = reportCardScores.find((e) => e.email === entry.user.email); return r ? r.total : -1; },
        (value) => value >= 0,
        (entry) => {
            const r = reportCardScores.find((e) => e.email === entry.user.email);
            return { description: `Report card score of ${r ? Math.round(r.total) : '?'}/100 — highest pre-tournament grade in the pool.` };
        }
    );
    awardMin(
        'worst_student',
        (entry) => { const r = reportCardScores.find((e) => e.email === entry.user.email); return r ? r.total : Infinity; },
        (value) => Number.isFinite(value),
        (entry) => {
            const r = reportCardScores.find((e) => e.email === entry.user.email);
            return { description: `Report card score of ${r ? Math.round(r.total) : '?'}/100 — lowest pre-tournament grade in the pool.` };
        }
    );

    return chipsByEmail;
}

function getPlayerCardAccentStyle(favoriteTeam = '') {
    const tokens = getFavoriteTeamAccentTokens(favoriteTeam);
    return {
        tokens,
        style: [
            `--player-card-accent-primary: ${tokens.primary}`,
            `--player-card-accent-primary-rgb: ${tokens.primaryRgb.r}, ${tokens.primaryRgb.g}, ${tokens.primaryRgb.b}`,
            `--player-card-accent-text: ${tokens.text}`,
            `--player-card-accent-on-dark: ${tokens.onDark}`,
            `--player-card-accent-soft: ${tokens.soft}`,
            `--player-card-accent-soft-strong: ${tokens.softStrong}`
        ].join('; ')
    };
}

function getPlayerChipById(email, chipId) {
    const chips = window._playerChipsByEmail?.[email]
        || window._leaderboardData?.find((entry) => entry.email === email)?.chips
        || [];
    return chips.find((chip) => chip.id === chipId) || null;
}

function renderPlayerChips(chips = [], email = '', variant = 'row', scopeId = '') {
    if (appSettings.hideTeamSelection && email && email !== userEmail) {
        return '';
    }
    if (appSettings.hidePlayerChips) {
        return '';
    }
    if (!chips.length) {
        return '';
    }

    const toneOrder = { positive: 0, neutral: 1, negative: 2 };
    const sortedChips = [...chips].sort((a, b) => (
        (toneOrder[a.tone] ?? 99) - (toneOrder[b.tone] ?? 99) || a.label.localeCompare(b.label)
    ));
    const visibleChips = variant === 'row' ? sortedChips.slice(0, 3) : sortedChips;
    const overflowCount = variant === 'row' ? Math.max(0, sortedChips.length - visibleChips.length) : 0;
    const safeEmail = String(email || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const safeScopeId = String(scopeId || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    if (variant === 'row') {
        return `
            <div class="flex flex-wrap gap-1">
                ${visibleChips.map((chip) => {
                    const toneClasses = PLAYER_CHIP_TONE_CLASSES[chip.tone]?.row || PLAYER_CHIP_TONE_CLASSES.neutral.row;
                    return `<button type="button"
                        title="${escapeHtml(`${chip.label} — ${chip.description}`)}"
                        onclick="showPlayerChipInfo('${chip.id}', '${safeEmail}', event)"
                        class="lb-chip-row inline-flex items-center justify-center rounded-full text-[10px] ${toneClasses} transition-transform hover:scale-110 shrink-0" style="width:19px;height:19px">${chip.emoji}</button>`;
                }).join('')}
                ${overflowCount > 0 ? `<span class="lb-chip-row inline-flex items-center justify-center rounded-full bg-gray-200 border border-gray-400 text-[7px] font-black text-gray-600" style="width:19px;height:19px">+${overflowCount}</span>` : ''}
            </div>
        `;
    }

    return `
        <div class="mt-2">
            <div class="flex flex-wrap gap-1">
            ${visibleChips.map((chip) => {
                const toneClasses = PLAYER_CHIP_TONE_CLASSES[chip.tone]?.card || PLAYER_CHIP_TONE_CLASSES.neutral.card;
                return `<button type="button"
                    title="${escapeHtml(`${chip.label} — ${chip.description}`)}"
                    onclick="showProfileChipsPopup('${safeEmail}', event)"
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] md:text-[9px] font-black uppercase tracking-[0.06em] ${toneClasses} transition-transform hover:scale-[1.02]">
                    <span class="text-xs">${chip.emoji}</span>
                    <span>${escapeHtml(chip.label)}</span>
                </button>`;
            }).join('')}
            </div>
        </div>
    `;
}

function togglePlayerChipInline(scopeId, chipId, email, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const panel = document.getElementById(`${scopeId}-chip-inline`);
    const chip = getPlayerChipById(email, chipId);
    if (!panel || !chip) {
        return;
    }

    if (panel.dataset.activeChip === chipId && panel.classList.contains('open')) {
        panel.classList.remove('open');
        panel.dataset.activeChip = '';
        window.setTimeout(() => {
            if (!panel.classList.contains('open')) {
                panel.innerHTML = '';
            }
        }, 220);
        return;
    }

    panel.dataset.activeChip = chipId;
    const escapedScopeId = String(scopeId).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const escapedChipId = String(chipId).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const escapedEmail = String(email).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const nextHtml = `
        <div class="rounded-2xl border px-4 py-3 shadow-sm" style="border-color: var(--player-card-accent-soft-strong, #374151); background-color: rgba(var(--player-card-accent-primary-rgb, 59, 130, 246), 0.08);">
            <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xl" style="background-color: rgba(var(--player-card-accent-primary-rgb, 59, 130, 246), 0.14);">${chip.emoji}</div>
                <div class="min-w-0 flex-1">
                    <div class="text-[10px] font-black uppercase tracking-[0.22em]" style="color: var(--player-card-accent-on-dark, #60a5fa);">Chip Detail</div>
                    <div class="mt-1 text-sm font-black uppercase tracking-[0.08em] text-white">${escapeHtml(chip.label)}</div>
                    <p class="mt-2 text-sm font-bold leading-relaxed text-gray-200">${escapeHtml(chip.description)}</p>
                </div>
                <button type="button" onclick="togglePlayerChipInline('${escapedScopeId}', '${escapedChipId}', '${escapedEmail}', event)" class="shrink-0 h-8 w-8 rounded-full border border-gray-700 bg-gray-800 text-xs font-black text-gray-300 transition-colors hover:bg-gray-700 hover:text-white" aria-label="Close chip detail">✕</button>
            </div>
        </div>
    `;

    if (panel.classList.contains('open')) {
        panel.classList.remove('open');
        window.setTimeout(() => {
            if (panel.dataset.activeChip !== chipId) {
                return;
            }
            panel.innerHTML = nextHtml;
            requestAnimationFrame(() => {
                panel.classList.add('open');
            });
        }, 140);
        return;
    }

    panel.innerHTML = nextHtml;
    requestAnimationFrame(() => {
        panel.classList.add('open');
    });
}

async function showPlayerChipInfo(chipId, email, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const chip = getPlayerChipById(email, chipId) || PLAYER_CHIP_DEFINITIONS[chipId];
    if (!chip) {
        return;
    }

    const leaderboardEntry = (window._leaderboardData || []).find((entry) => entry.email === email);
    const playerName = leaderboardEntry?.nickname || leaderboardEntry?.realname || email || 'Player';
    const shell = document.getElementById('chip-popover-shell');
    const card = document.getElementById('chip-popover-card');
    const emojiEl = document.getElementById('chip-popover-emoji');
    const titleEl = document.getElementById('chip-popover-title');
    const kickerEl = document.getElementById('chip-popover-kicker');
    const messageEl = document.getElementById('chip-popover-message');
    const detailEl = document.getElementById('chip-popover-detail');
    if (!shell || !card || !emojiEl || !titleEl || !kickerEl || !messageEl || !detailEl) {
        return;
    }

    const toneMap = {
        positive: 'Positive Token',
        negative: 'Watchlist Token',
        neutral: 'Fun Token'
    };

    emojiEl.textContent = chip.emoji;
    titleEl.textContent = chip.label;
    kickerEl.textContent = toneMap[chip.tone] || 'Player Chip';
    messageEl.textContent = chip.description;
    detailEl.textContent = `${playerName} currently holds this stat token.`;

    shell.classList.remove('hidden');
    shell.classList.add('flex');
    card.classList.remove('chip-popover-enter');
    card.classList.remove('chip-popover-leave');
    void card.offsetWidth;
    card.classList.add('chip-popover-enter');

    if (window._chipPopoverEscapeHandler) {
        document.removeEventListener('keydown', window._chipPopoverEscapeHandler);
    }

    window._chipPopoverEscapeHandler = (keyboardEvent) => {
        if (keyboardEvent.key === 'Escape') {
            closeChipPopover();
        }
    };
    document.addEventListener('keydown', window._chipPopoverEscapeHandler);
}

function closeChipPopover() {
    const shell = document.getElementById('chip-popover-shell');
    const card = document.getElementById('chip-popover-card');
    if (!shell || !card) {
        return;
    }

    card.classList.remove('chip-popover-enter');
    card.classList.add('chip-popover-leave');

    window.setTimeout(() => {
        card.classList.remove('chip-popover-leave');
        shell.classList.add('hidden');
        shell.classList.remove('flex');
    }, 160);

    if (window._chipPopoverEscapeHandler) {
        document.removeEventListener('keydown', window._chipPopoverEscapeHandler);
        window._chipPopoverEscapeHandler = null;
    }
}

let _lbShowSelection = true;
let _lbShowChips = true;

function toggleLbSelection(checked) {
    _lbShowSelection = checked !== undefined ? checked : !_lbShowSelection;
    document.querySelectorAll('.lb-squad-cell').forEach((el) => { el.classList.toggle('lb-collapsed', !_lbShowSelection); });
}

function toggleLbChips(checked) {
    _lbShowChips = checked !== undefined ? checked : !_lbShowChips;
    document.querySelectorAll('.lb-badge-cell').forEach((el) => { el.classList.toggle('lb-collapsed', !_lbShowChips); });
}

function toggleLbLegend() {
    const el = document.getElementById('lb-legend');
    if (!el) return;
    el.classList.toggle('lb-legend-open');
}

function hideLeaderboardSelfCard() {
    const card = document.getElementById('leaderboard-self-card');
    if (!card) return;
    card.classList.add('hidden');
    card.innerHTML = '';
}

function _leaderboardSelfRankSpectrumSkeletonHtml() {
    return `
        <div class="mt-3 rounded-2xl border border-gray-200/80 bg-white/70 px-3 py-3">
            <div class="relative h-11 px-2">
                <div class="absolute left-0 right-0 top-5 h-2 animate-pulse rounded-full bg-gray-200"></div>
                <div class="absolute left-0 top-4 h-4 w-4 animate-pulse rounded-full border-2 border-white bg-emerald-200 ring-4 ring-emerald-50"></div>
                <div class="absolute left-[14%] top-4 h-4 w-4 animate-pulse rounded-full border-2 border-white bg-blue-200 ring-4 ring-blue-50"></div>
                <div class="absolute left-[50%] top-4 h-4 w-4 animate-pulse rounded-full border-2 border-white bg-gray-300 ring-4 ring-gray-100"></div>
                <div class="absolute right-[14%] top-4 h-4 w-4 animate-pulse rounded-full border-2 border-white bg-amber-200 ring-4 ring-amber-50"></div>
                <div class="absolute right-0 top-4 h-4 w-4 animate-pulse rounded-full border-2 border-white bg-gray-300 ring-4 ring-gray-100"></div>
            </div>
            <div class="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                ${Array.from({ length: 5 }).map(() => `
                    <div class="rounded-xl border border-gray-200 bg-white/70 px-3 py-2.5">
                        <div class="h-2 w-20 animate-pulse rounded bg-gray-200"></div>
                        <div class="mt-2 h-3 w-24 animate-pulse rounded bg-gray-200"></div>
                        <div class="mt-2 h-3 w-16 animate-pulse rounded bg-gray-200"></div>
                        <div class="mt-1.5 h-2 w-12 animate-pulse rounded bg-gray-200"></div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderLeaderboardSelfCardSkeleton() {
    const card = document.getElementById('leaderboard-self-card');
    if (!card) return;
    if (!userEmail) {
        hideLeaderboardSelfCard();
        return;
    }

    card.innerHTML = `
        <div class="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(500px,0.95fr)] lg:items-center xl:grid-cols-[minmax(0,1.45fr)_minmax(560px,0.95fr)]">
            <div class="flex min-w-0 items-center gap-4">
                <div class="h-14 w-14 shrink-0 animate-pulse rounded-full bg-emerald-100"></div>
                <div class="min-w-0 flex-1 space-y-2">
                    <div class="h-3 w-28 animate-pulse rounded bg-emerald-100"></div>
                    <div class="h-7 w-56 max-w-full animate-pulse rounded bg-gray-200"></div>
                    <div class="h-3 w-32 animate-pulse rounded bg-gray-200"></div>
                    <div class="flex gap-1.5 pt-1">
                        <div class="h-4 w-6 animate-pulse rounded bg-gray-200"></div>
                        <div class="h-4 w-6 animate-pulse rounded bg-gray-200"></div>
                        <div class="h-4 w-6 animate-pulse rounded bg-gray-200"></div>
                        <div class="h-4 w-6 animate-pulse rounded bg-gray-200"></div>
                    </div>
                </div>
            </div>
            <div class="grid w-full grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                ${['Rank', 'Points', 'Behind 1st', 'To Money'].map((label) => `
                    <div class="min-w-0">
                        <div class="text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">${label}</div>
                        <div class="mt-2 h-5 w-20 animate-pulse rounded bg-gray-200"></div>
                    </div>
                `).join('')}
            </div>
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 lg:col-span-2">
                <div class="h-14 animate-pulse rounded-xl bg-white/70"></div>
                <div class="h-14 animate-pulse rounded-xl bg-white/70"></div>
                <div class="h-14 animate-pulse rounded-xl bg-white/70"></div>
                <div class="h-14 animate-pulse rounded-xl bg-white/70"></div>
            </div>
            <div class="border-t border-gray-200/80 pt-4 lg:col-span-2">
                <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="min-w-0 space-y-2">
                        <div class="h-3 w-28 animate-pulse rounded bg-emerald-100"></div>
                        <div class="h-3 w-80 max-w-full animate-pulse rounded bg-gray-200"></div>
                    </div>
                    <div class="grid min-w-[250px] grid-cols-2 gap-3">
                        <div class="h-12 animate-pulse rounded-xl bg-white/70"></div>
                        <div class="h-12 animate-pulse rounded-xl bg-white/70"></div>
                    </div>
                </div>
                ${_leaderboardSelfRankSpectrumSkeletonHtml()}
            </div>
        </div>
    `;
    card.classList.remove('hidden');
}

function _getMyPoolLabData(filters = DEFAULT_MY_POOL_LAB_FILTERS) {
    return _getCachedBestAvailableLabData({ ...filters, realisticOnly: true });
}

function _getMyPoolLabContext(email = userEmail, filters = DEFAULT_MY_POOL_LAB_FILTERS) {
    if (!email) return null;
    return (_getMyPoolLabData(filters).contexts || []).find((context) => context.email === email) || null;
}

function toggleLeaderboardSelfLabInfo(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    const info = document.getElementById('leaderboard-self-lab-info');
    if (info) info.classList.toggle('hidden');
}

function _getLeaderboardSelfGlobalRankKey(entry) {
    if (!entry) return '';
    return [
        userEmail || '',
        Number(entry.totalPoints || 0),
        getSquadSignature(entry.squad || []),
        _bestAvailableLabCacheKey(DEFAULT_MY_POOL_LAB_FILTERS)
    ].join('|');
}

function _getLeaderboardSelfGlobalRankSnapshot(entry) {
    const key = _getLeaderboardSelfGlobalRankKey(entry);
    return _leaderboardSelfGlobalRankSnapshot?.key === key ? _leaderboardSelfGlobalRankSnapshot : null;
}

function _scheduleLeaderboardSelfGlobalRankUpdate(entry) {
    if (appSettings.hideTeamSelection || !entry || !userEmail) return;

    const key = _getLeaderboardSelfGlobalRankKey(entry);
    if (_leaderboardSelfGlobalRankSnapshot?.key === key) return;

    const requestId = ++_leaderboardSelfGlobalRankRequestId;
    const calculate = () => {
        const data = _getMyPoolLabData(DEFAULT_MY_POOL_LAB_FILTERS);
        const contexts = data.contexts || [];
        const context = contexts.find((candidate) => candidate.email === userEmail) || null;
        const poolContexts = contexts
            .filter((candidate) => Number(candidate.displayRank || 0) > 0)
            .sort((a, b) => {
                const rankDelta = Number(a.displayRank || 0) - Number(b.displayRank || 0);
                if (rankDelta !== 0) return rankDelta;
                return compareBestAvailableLabContexts(a, b);
            });
        const poolLeader = poolContexts[0] || null;
        const poolLast = [...poolContexts]
            .sort((a, b) => {
                const rankDelta = Number(b.displayRank || 0) - Number(a.displayRank || 0);
                if (rankDelta !== 0) return rankDelta;
                if (a.totalPoints !== b.totalPoints) return a.totalPoints - b.totalPoints;
                return String(a.nickname || a.realname || '').localeCompare(String(b.nickname || b.realname || ''));
            })[0] || null;
        const worstBucket = (data.buckets || []).reduce((worst, bucket) => {
            if (!worst) return bucket;
            if (bucket.score !== worst.score) return bucket.score < worst.score ? bucket : worst;
            if (bucket.cost !== worst.cost) return bucket.cost > worst.cost ? bucket : worst;
            return bucket.size > worst.size ? bucket : worst;
        }, null);
        const contextAnchor = (candidate, label) => candidate ? {
            label,
            name: candidate.nickname || candidate.realname || 'Pool entry',
            rankLabel: candidate.filteredLegal ? _formatBestAvailableRankMidpointLabel({ ...candidate, legal: true }) : 'Outside',
            points: Number(candidate.totalPoints || 0),
            rankEnd: candidate.filteredLegal ? candidate.rankEnd : null,
            percentileLabel: candidate.filteredLegal ? _formatBestAvailablePercentile({ ...candidate, legal: true }) : ''
        } : null;
        if (requestId !== _leaderboardSelfGlobalRankRequestId) return;

        _leaderboardSelfGlobalRankSnapshot = {
            key,
            allLegalTotal: _getAllLegalSquadCount(),
            realisticTotal: data.totalLegalSquads,
            rankLabel: context?.filteredLegal ? _formatBestAvailableRankMidpointLabel({ ...context, legal: true }) : 'Outside field',
            percentileLabel: context?.filteredLegal ? _formatBestAvailablePercentile({ ...context, legal: true }) : '-',
            rankStart: context?.filteredLegal ? context.rankStart : null,
            rankEnd: context?.filteredLegal ? context.rankEnd : null,
            anchors: {
                bestOverall: data.bestBucket ? {
                    label: 'Best overall',
                    name: 'Generated best',
                    rankLabel: '#1',
                    points: Number(data.bestBucket.score || 0),
                    rankEnd: 1n,
                    percentileLabel: 'Top'
                } : null,
                poolLeader: contextAnchor(poolLeader, 'Pool 1st'),
                you: contextAnchor(context, 'You'),
                poolLast: contextAnchor(poolLast, 'Pool last'),
                worstOverall: worstBucket ? {
                    label: 'Worst overall',
                    name: 'Generated worst',
                    rankLabel: `#${_formatBestAvailableRankMidpointNumber(data.totalLegalSquads)}`,
                    points: Number(worstBucket.score || 0),
                    rankEnd: data.totalLegalSquads,
                    percentileLabel: 'Bottom'
                } : null
            },
            reasonText: context && !context.filteredLegal
                ? [...(context.invalidReasons || []), ...(context.filterReasons || [])].slice(0, 1).join('')
                : ''
        };

        const leaderboardData = window._leaderboardData || [];
        if (leaderboardData.some((candidate) => candidate.email === userEmail)) {
            renderLeaderboardSelfCard(leaderboardData);
        }
    };

    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(calculate, { timeout: 1200 });
    } else {
        window.setTimeout(calculate, 0);
    }
}

function _renderLeaderboardSelfLabPreview(entry) {
    if (appSettings.hideTeamSelection) return '';

    const snapshot = _getLeaderboardSelfGlobalRankSnapshot(entry);
    const allLegal = snapshot ? _formatBestAvailableRankMidpointNumber(snapshot.allLegalTotal) : '';
    const realisticTotal = snapshot ? _formatBestAvailableRankMidpointNumber(snapshot.realisticTotal) : '';
    const rankLabel = snapshot?.rankLabel || 'Loading';
    const percentileLabel = snapshot?.percentileLabel || 'Loading';
    const summaryLines = snapshot
        ? [
            `${realisticTotal} realistic squads ranked by points.`,
            `${allLegal} total legal combinations exist, but this view filters out low-spend builds nobody would realistically pick.`
        ]
        : [
            'Leaderboard loads first.',
            'Global rank is calculating in the background.'
        ];
    const rankPositionPct = (rankEnd) => rankEnd && snapshot?.realisticTotal
        ? Math.max(0.5, Math.min(99.5, (Number(rankEnd) / Math.max(1, Number(snapshot.realisticTotal))) * 100))
        : null;
    const anchorToneClasses = {
        bestOverall: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        poolLeader: 'border-blue-200 bg-blue-50 text-blue-700',
        you: 'border-gray-900 bg-gray-900 text-white',
        poolLast: 'border-amber-200 bg-amber-50 text-amber-700',
        worstOverall: 'border-gray-300 bg-gray-100 text-gray-600'
    };
    const anchorDotClasses = {
        bestOverall: 'bg-emerald-500',
        poolLeader: 'bg-blue-500',
        you: 'bg-gray-900',
        poolLast: 'bg-amber-500',
        worstOverall: 'bg-gray-400'
    };
    const anchorDotRingClasses = {
        bestOverall: 'ring-emerald-100',
        poolLeader: 'ring-blue-100',
        you: 'ring-gray-200',
        poolLast: 'ring-amber-100',
        worstOverall: 'ring-gray-100'
    };
    const spectrumAnchors = snapshot ? [
        ['bestOverall', snapshot.anchors?.bestOverall],
        ['poolLeader', snapshot.anchors?.poolLeader],
        ['you', snapshot.anchors?.you],
        ['poolLast', snapshot.anchors?.poolLast],
        ['worstOverall', snapshot.anchors?.worstOverall]
    ].filter(([, anchor]) => anchor).map(([key, anchor]) => ({
        ...anchor,
        key,
        positionPct: rankPositionPct(anchor.rankEnd)
    })) : [];
    const markerAnchors = (() => {
        const anchors = spectrumAnchors
            .filter((anchor) => anchor.positionPct !== null)
            .map((anchor) => ({ ...anchor, markerPct: anchor.positionPct }))
            .sort((a, b) => a.positionPct - b.positionPct);
        const minGap = 2.8;

        anchors.forEach((anchor, index) => {
            if (index === 0) {
                anchor.markerPct = Math.max(0.5, anchor.markerPct);
                return;
            }
            anchor.markerPct = Math.max(anchor.markerPct, anchors[index - 1].markerPct + minGap);
        });

        if (anchors.length && anchors[anchors.length - 1].markerPct > 99.5) {
            anchors[anchors.length - 1].markerPct = 99.5;
            for (let index = anchors.length - 2; index >= 0; index -= 1) {
                anchors[index].markerPct = Math.min(anchors[index].markerPct, anchors[index + 1].markerPct - minGap);
            }
        }

        anchors.forEach((anchor, index) => {
            anchor.markerPct = Math.max(0.5, Math.min(99.5, anchor.markerPct));
            if (index > 0 && anchor.markerPct - anchors[index - 1].markerPct < minGap) {
                anchor.markerPct = Math.min(99.5, anchors[index - 1].markerPct + minGap);
            }
        });

        return anchors;
    })();
    const spectrumMarkerHtml = markerAnchors
        .filter((anchor) => anchor.positionPct !== null)
        .map((anchor) => {
            const alignClass = _bestAvailableRankAlignClass(anchor.markerPct);
            const titlePercentile = anchor.percentileLabel && !['bestOverall', 'worstOverall'].includes(anchor.key)
                ? `${anchor.percentileLabel}, `
                : '';
            return `
                <div class="absolute top-4 h-4 w-4 ${alignClass} rounded-full border-2 border-white ${anchorDotClasses[anchor.key]} shadow-sm ring-4 ${anchorDotRingClasses[anchor.key]}" style="left:${anchor.markerPct}%" title="${escapeHtml(`${anchor.label}: ${anchor.rankLabel}, ${titlePercentile}${anchor.points} pts`)}"></div>
            `;
        }).join('');
    const percentileChipHtml = (anchor) => anchor.percentileLabel && !['bestOverall', 'worstOverall'].includes(anchor.key)
        ? `<span class="rounded-full bg-white/70 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.08em] opacity-90">${escapeHtml(anchor.percentileLabel)}</span>`
        : '';
    const spectrumCardHtml = spectrumAnchors.map((anchor) => `
        <div class="rounded-xl border ${anchorToneClasses[anchor.key]} px-3 py-2.5 shadow-sm">
            <div class="text-[8px] font-black uppercase tracking-[0.16em] opacity-75">${escapeHtml(anchor.label)}</div>
            <div class="mt-1 truncate text-xs font-black">${escapeHtml(anchor.name || anchor.label)}</div>
            <div class="mt-1 flex flex-wrap items-center gap-1.5">
                <span class="text-[11px] font-black">${escapeHtml(anchor.rankLabel || '-')}</span>
                ${percentileChipHtml(anchor)}
            </div>
            <div class="text-[9px] font-black uppercase tracking-[0.1em] opacity-75">${Number(anchor.points || 0)} pts</div>
        </div>
    `).join('');
    const rankSpectrumHtml = snapshot ? `
        <div class="mt-3 rounded-2xl border border-gray-200/80 bg-white/70 px-3 py-3">
            <div class="relative h-11 px-2">
                <div class="absolute left-0 right-0 top-5 h-2 rounded-full bg-gray-200"></div>
                <div class="absolute left-0 top-5 h-2 rounded-full bg-emerald-300" style="width:${rankPositionPct(snapshot.rankEnd) ?? 0}%"></div>
                ${spectrumMarkerHtml}
            </div>
            <div class="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                ${spectrumCardHtml}
            </div>
        </div>
    ` : `
        ${_leaderboardSelfRankSpectrumSkeletonHtml()}
    `;
    const squadRows = _getMyPoolLabSquadRows(entry);
    const mostPoints = [...squadRows]
        .sort((a, b) => b.points - a.points || b.pointsPerDollar - a.pointsPerDollar || a.name.localeCompare(b.name))[0] || null;
    const bestValue = [...squadRows]
        .filter((team) => team.points > 0)
        .sort((a, b) => b.pointsPerDollar - a.pointsPerDollar || b.points - a.points || a.name.localeCompare(b.name))[0] || null;
    const biggestBust = [...squadRows]
        .sort((a, b) => Number(b.eliminated) - Number(a.eliminated) || a.pointsPerDollar - b.pointsPerDollar || b.cost - a.cost || a.name.localeCompare(b.name))[0] || null;
    const bestLiveTeam = [...squadRows]
        .filter((team) => !team.eliminated)
        .sort((a, b) => b.points - a.points || b.pointsPerDollar - a.pointsPerDollar || a.name.localeCompare(b.name))[0] || null;
    const pickTile = (label, team, fallback) => `
        <div class="rounded-xl border border-gray-200/80 bg-white/60 px-3 py-2">
            <div class="text-[8px] font-black uppercase tracking-[0.18em] text-gray-500">${escapeHtml(label)}</div>
            <div class="mt-1 flex min-w-0 items-center gap-2">
                ${team ? `<span class="shrink-0 text-base leading-none ${team.eliminated ? 'opacity-60 grayscale' : ''}">${team.flag || ''}</span>` : ''}
                <div class="min-w-0">
                    <div class="truncate text-sm font-black text-gray-900">${team ? escapeHtml(team.name) : escapeHtml(fallback)}</div>
                    ${team ? `<div class="text-[9px] font-black uppercase tracking-[0.1em] text-gray-500">${Number(team.points || 0)} pts · ${team.pointsPerDollar.toFixed(2)} / $</div>` : ''}
                </div>
            </div>
        </div>
    `;

    return `
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 lg:col-span-2">
            ${pickTile('Most Points', mostPoints, 'No points yet')}
            ${pickTile('Best Value', bestValue, 'No value pick yet')}
            ${pickTile('Biggest Bust', biggestBust, 'No bust yet')}
            ${pickTile('Best Live Team', bestLiveTeam, 'No live team')}
        </div>
        <div class="border-t border-gray-200/80 pt-4 lg:col-span-2">
            <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="theme-accent-text text-[9px] font-black uppercase tracking-[0.22em]">Global Rank</span>
                        <button type="button" onclick="toggleLeaderboardSelfLabInfo(event)"
                            class="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white text-[10px] font-black text-gray-500 transition-colors hover:border-emerald-400 hover:text-emerald-700"
                            aria-label="Explain global rank">i</button>
                    </div>
                    <div class="mt-1 max-w-2xl space-y-0.5 text-[10px] font-bold leading-relaxed text-gray-500">
                        ${summaryLines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}
                    </div>
                </div>
                <div class="grid min-w-[250px] grid-cols-2 gap-3 text-right">
                    <div class="rounded-xl border border-gray-200/80 bg-white/60 px-3 py-2">
                        <div class="text-[8px] font-black uppercase tracking-[0.18em] text-gray-500">Global Rank</div>
                        <div class="mt-1 text-base font-black text-gray-900 ${snapshot ? '' : 'animate-pulse text-gray-500'}">${rankLabel}</div>
                    </div>
                    <div class="rounded-xl border border-gray-200/80 bg-white/60 px-3 py-2">
                        <div class="text-[8px] font-black uppercase tracking-[0.18em] text-gray-500">Percentile</div>
                        <div class="mt-1 text-base font-black text-gray-900 ${snapshot ? '' : 'animate-pulse text-gray-500'}">${percentileLabel || '-'}</div>
                    </div>
                </div>
            </div>
            <div id="leaderboard-self-lab-info" class="hidden mt-3 rounded-xl border border-emerald-200 bg-white/80 px-3 py-2 text-[10px] font-bold leading-relaxed text-gray-600">
                Global rank compares your squad to the realistic squad universe, not every possible legal squad. Realistic means $140-$150 spent, 3-5 Tier 3 teams, 0 or 1 Tier 1 team, and the rest mostly Tier 2 teams. The larger all-legal number includes low-spend and throwaway combinations, so it is shown only as context.
            </div>
            ${rankSpectrumHtml}
        </div>
    `;
}

function renderLeaderboardSelfCard(leaderboardData = [], profilesMap = new Map()) {
    const card = document.getElementById('leaderboard-self-card');
    if (!card) return;

    if (!userEmail) {
        hideLeaderboardSelfCard();
        return;
    }

    const myEntry = leaderboardData.find((entry) => entry.email === userEmail);
    const fallbackProfile = getDisplayProfile(userEmail, profilesMap);
    const profile = myEntry || fallbackProfile;
    const nickname = profile.nickname || userEmail.split('@')[0];
    const realname = profile.realname || '';
    const avatarUrl = profile.avatarUrl || null;
    const favoriteTeam = profile.favoriteTeam || '';

    if (!myEntry) {
        card.innerHTML = `
            <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div class="flex min-w-0 flex-1 items-center gap-4">
                    ${_renderPlayerAvatar(avatarUrl, favoriteTeam, 52, nickname)}
                    <div class="min-w-0 flex-1">
                        <div class="theme-accent-text text-[9px] font-black uppercase tracking-[0.24em]">Your Standing</div>
                        <div class="mt-1 break-words text-xl font-black uppercase italic leading-tight tracking-tight text-gray-900">${escapeHtml(nickname)}</div>
                        ${realname ? `<div class="mt-0.5 truncate text-[10px] font-black uppercase tracking-[0.16em] text-gray-600">${escapeHtml(realname)}</div>` : ''}
                    </div>
                </div>
                <div class="text-left md:text-right">
                    <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Rank</div>
                    <div class="mt-1 text-lg font-black text-gray-900">No rank yet</div>
                </div>
            </div>
        `;
        card.classList.remove('hidden');
        return;
    }

    const rank = myEntry.displayRank || null;
    const rankNumberText = rank ? String(rank) : '-';
    const rankOrdinalText = rank ? `${rank}${_ordinalSuffix(rank)}` : '-';
    const topEntry = leaderboardData[0] || myEntry;
    const pointsBehindFirst = Math.max(0, Number(topEntry.totalPoints || 0) - Number(myEntry.totalPoints || 0));
    const thirdEntry = leaderboardData[2] || null;
    const pointsToMoney = thirdEntry ? Math.max(0, Number(thirdEntry.totalPoints || 0) - Number(myEntry.totalPoints || 0)) : 0;
    const moneyLabel = rank && rank <= 3
        ? `${rankOrdinalText} prize spot`
        : thirdEntry
            ? `${pointsToMoney} pts to 3rd`
            : 'Prize picture forming';
    const behindLabel = pointsBehindFirst === 0 ? 'Tied for 1st' : `${pointsBehindFirst} behind 1st`;
    const squadFlags = !appSettings.hideTeamSelection
        ? [...(myEntry.squad || [])]
            .sort((a, b) => (b.cost || 0) - (a.cost || 0) || a.name.localeCompare(b.name))
            .map((team) => `<span title="${escapeHtml(team.name)}" class="text-xl leading-none ${team.eliminated ? 'opacity-35 grayscale' : ''}">${team.flag || ''}</span>`)
            .join('')
        : '';

    card.innerHTML = `
        <div class="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(500px,0.95fr)] lg:items-center xl:grid-cols-[minmax(0,1.45fr)_minmax(560px,0.95fr)]">
            <div class="flex min-w-0 items-center gap-4">
                ${_renderPlayerAvatar(myEntry.avatarUrl, myEntry.favoriteTeam, 56, myEntry.nickname)}
                <div class="min-w-0 flex-1">
                    <div class="theme-accent-text text-[9px] font-black uppercase tracking-[0.24em]">Your Standing</div>
                    <div class="mt-1 break-words text-2xl font-black uppercase italic leading-tight tracking-tight text-gray-900">${escapeHtml(myEntry.nickname)}</div>
                    ${myEntry.realname ? `<div class="mt-0.5 truncate text-[10px] font-black uppercase tracking-[0.16em] text-gray-600">${escapeHtml(myEntry.realname)}</div>` : ''}
                    ${squadFlags ? `<div class="mt-2 flex flex-wrap items-center gap-1.5">${squadFlags}</div>` : ''}
                </div>
            </div>
            <div class="grid w-full grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                <div class="min-w-0">
                    <div class="text-[9px] font-black uppercase tracking-[0.18em] text-gray-600">Rank</div>
                    <div class="mt-1 text-xl font-black text-gray-900">#${rankNumberText}</div>
                </div>
                <div class="min-w-0">
                    <div class="text-[9px] font-black uppercase tracking-[0.18em] text-gray-600">Points</div>
                    <div class="mt-1 text-xl font-black text-gray-900">${Number(myEntry.totalPoints || 0)}</div>
                </div>
                <div class="min-w-0">
                    <div class="text-[9px] font-black uppercase tracking-[0.18em] text-gray-600">Behind 1st</div>
                    <div class="mt-1 text-sm font-black text-gray-900">${escapeHtml(behindLabel)}</div>
                </div>
                <div class="min-w-0">
                    <div class="text-[9px] font-black uppercase tracking-[0.18em] text-gray-600">To Money</div>
                    <div class="mt-1 text-sm font-black text-gray-900">${escapeHtml(moneyLabel)}</div>
                </div>
            </div>
            ${_renderLeaderboardSelfLabPreview(myEntry)}
        </div>
    `;
    card.classList.remove('hidden');
    _scheduleLeaderboardSelfGlobalRankUpdate(myEntry);
}

async function fetchLeaderboard() {
    const body = document.getElementById('leaderboard-body');
    _leaderboardSelfGlobalRankSnapshot = null;
    _leaderboardSelfGlobalRankRequestId += 1;
    renderLeaderboardSelfCardSkeleton();
    // Show animated placeholder rows while scores are calculated.
    // Columns: rank, points, player+squad, upside, then 7 stage-points cols (G, Bonus, R32, R16, QF, SM, F)
    const skeletonCell = '<td class="px-2 py-2.5 text-center"><div class="h-4 w-6 bg-gray-200 rounded animate-pulse mx-auto"></div></td>';
    const skeletonRow = `
        <tr class="border-b border-gray-100">
            <td class="w-[52px] md:w-[72px] px-1 md:px-2 py-2.5 text-center"><div class="h-5 w-6 bg-gray-200 rounded animate-pulse mx-auto"></div></td>
            <td class="w-[52px] md:w-[72px] px-1 md:px-2 py-2.5 text-center"><div class="h-6 w-10 bg-gray-200 rounded animate-pulse mx-auto"></div></td>
            <td class="px-4 py-2.5"><div class="space-y-2"><div class="h-4 w-28 bg-gray-200 rounded animate-pulse"></div><div class="h-3 w-20 bg-gray-100 rounded animate-pulse"></div></div></td>
            ${skeletonCell.repeat(8)}
        </tr>`;
    body.innerHTML = skeletonRow.repeat(5);

    try {
        const [
            { data: allPicks, error: picksError },
            { data: allMatches, error: matchesError },
            { data: allProfiles, error: profilesError }
        ] = await Promise.all([
            supabaseClient.from('picks').select('*'),
            supabaseClient.from('matches').select('*'),
            supabaseClient.from('profiles').select('email, nickname, realname, favorite_team, has_paid, avatar_url, updated_at')
        ]);

        if (picksError) {
            throw picksError;
        }

        if (matchesError) {
            throw matchesError;
        }

        if (profilesError) {
            throw profilesError;
        }

        await fetchAdvancedTeams();
        const profilesMap = buildProfilesMap(allProfiles);
        const leaderboardData = buildLeaderboardData(allPicks || [], allMatches || [], profilesMap, teams, advancedTeams, eliminatedTeams);
        const leaderboardTeamPointsMap = buildTeamPointsMap(allMatches || [], teams, advancedTeams);
        const leaderboardTeamBreakdownMap = buildTeamStageBreakdownMap(allMatches || [], teams, advancedTeams);
        const bestAvailableSquads = buildBestAvailableSquadsData(allMatches || [], teams, advancedTeams, eliminatedTeams, { limit: BEST_AVAILABLE_EXPLORER_LIMIT });
        const bestAvailableTeam = bestAvailableSquads[0] ? {
            ...bestAvailableSquads[0],
            email: 'best-available-team',
            nickname: 'Best Available Team to Date',
            realname: 'Highest-scoring legal squad so far'
        } : null;
        const playerCount = leaderboardData.length;
        const nameFilterWrap = document.getElementById('leaderboard-name-filter');
        const nameFilter = nameFilterWrap?.dataset?.value || '';
        const countryFilterWrap = document.getElementById('leaderboard-country-filter');
        const filter = countryFilterWrap?.dataset?.value || '';
        const countryFilterBtn = document.getElementById('country-filter-btn');
        const previousRanks = JSON.parse(localStorage.getItem('wc_pool_lb_ranks') || '{}');
        const currentRanks = _getPlayerDisplayRanks(leaderboardData);
        const playerChips = computePlayerChips(leaderboardData, allMatches || [], previousRanks);
        const enrichedLeaderboardData = leaderboardData.map((user) => ({
            ...user,
            displayRank: currentRanks[user.email] || null,
            chips: playerChips.get(user.email) || []
        }));
        const bestAvailableOwnersBySignature = new Map();
        enrichedLeaderboardData.forEach((user) => {
            if (!Array.isArray(user.squad) || user.squad.length === 0) return;
            const signature = getSquadSignature(user.squad);
            if (!signature) return;
            const owners = bestAvailableOwnersBySignature.get(signature) || [];
            owners.push({
                email: user.email,
                nickname: user.nickname,
                realname: user.realname,
                avatarUrl: user.avatarUrl,
                favoriteTeam: user.favoriteTeam,
                displayRank: user.displayRank,
                totalPoints: user.totalPoints
            });
            bestAvailableOwnersBySignature.set(signature, owners);
        });
        const annotatedBestAvailableSquads = bestAvailableSquads.map((candidate, index) => ({
            ...candidate,
            rank: index + 1,
            owners: bestAvailableOwnersBySignature.get(candidate.signature) || []
        }));
        const bestAvailablePoolContexts = buildBestAvailableSquadRankings(
            allMatches || [],
            teams,
            advancedTeams,
            eliminatedTeams,
            enrichedLeaderboardData.map((user) => ({
                email: user.email,
                nickname: user.nickname,
                realname: user.realname,
                avatarUrl: user.avatarUrl,
                favoriteTeam: user.favoriteTeam,
                displayRank: user.displayRank,
                leaderboardPoints: user.totalPoints,
                squad: user.squad || []
            }))
        ).map((context) => {
            const displayedSquad = annotatedBestAvailableSquads.find((squad) => squad.signature === context.signature);
            return {
                ...context,
                exactTopRank: displayedSquad?.rank || null,
                shownInTopList: Boolean(displayedSquad)
            };
        });
        const bestAvailablePoolContext = [...bestAvailablePoolContexts]
            .filter((context) => context.legal)
            .sort(compareBestAvailablePoolContexts)[0] || null;

        const lbUpsideMap = _buildUpsideMap(leaderboardData);

        const lbPointsDeltaMap = new Map();
        const lbRankDeltaMap = new Map();
        {
            const lbDatedMatches = (allMatches || []).filter((m) => m.match_date_manual);
            const lbUniqueDates = [...new Set(lbDatedMatches.map((m) => m.match_date_manual))].sort((a, b) => b.localeCompare(a));
            if (lbUniqueDates.length >= 2) {
                const prevMatches = lbDatedMatches.filter((m) => m.match_date_manual < lbUniqueDates[0]);
                const prevLb = buildLeaderboardData(allPicks || [], prevMatches, profilesMap, teams, advancedTeams, eliminatedTeams);
                const prevRanks = _getPlayerDisplayRanks(prevLb);
                prevLb.forEach((prev) => {
                    const curr = leaderboardData.find((l) => l.email === prev.email);
                    if (curr) {
                        lbPointsDeltaMap.set(prev.email, curr.totalPoints - prev.totalPoints);
                        const prevR = prevRanks[prev.email];
                        const currR = currentRanks[prev.email];
                        if (prevR != null && currR != null) lbRankDeltaMap.set(prev.email, prevR - currR);
                    }
                });
            }
        }

        if (countryFilterBtn) {
            countryFilterBtn.disabled = Boolean(appSettings.hideTeamSelection);
            countryFilterBtn.classList.toggle('opacity-50', Boolean(appSettings.hideTeamSelection));
            countryFilterBtn.classList.toggle('pointer-events-none', Boolean(appSettings.hideTeamSelection));
        }

        updateNameFilterOptions(enrichedLeaderboardData);

        let filteredLeaderboardData = [...enrichedLeaderboardData];

        if (nameFilter) {
            filteredLeaderboardData = filteredLeaderboardData.filter((user) => user.email === nameFilter);
        }

        if (!appSettings.hideTeamSelection && filter) {
            filteredLeaderboardData = filteredLeaderboardData.filter((user) => (
                user.squad.some((squadTeam) => teams.find((team) => team.flag === squadTeam.flag).name === filter)
            ));
        }

        const totalPot = playerCount * 50;

        document.getElementById('total-players-count').innerText = playerCount;
        document.getElementById('total-prize-pot').innerText = `$${totalPot.toLocaleString()}`;
        document.getElementById('prize-1st').innerText = `$${Math.floor(totalPot * 0.65).toLocaleString()}`;
        document.getElementById('prize-2nd').innerText = `$${Math.floor(totalPot * 0.25).toLocaleString()}`;
        document.getElementById('prize-3rd').innerText = `$${Math.floor(totalPot * 0.10).toLocaleString()}`;
        _clearBestAvailableLabDataCache();
        window._leaderboardData = enrichedLeaderboardData;
        window._bestAvailableSquads = annotatedBestAvailableSquads;
        window._bestAvailablePoolContext = bestAvailablePoolContext;
        window._bestAvailablePoolContexts = bestAvailablePoolContexts;
        window._leaderboardTeamPointsMap = leaderboardTeamPointsMap;
        window._leaderboardTeamBreakdownMap = leaderboardTeamBreakdownMap;
        window._matchesCache = allMatches || [];
        window._picksCache = allPicks || [];
        renderLeaderboardSelfCard(enrichedLeaderboardData, profilesMap);

        const renderSquadSummary = (user, muted = false) => {
            if (appSettings.hideTeamSelection) {
                return '<div class="lb-squad-cell text-[8px] font-black tracking-[0.18em] text-gray-400">Teams to be displayed when WC starts</div>';
            }

            const sortedSquad = [...user.squad].sort((a, b) => b.cost - a.cost || a.name.localeCompare(b.name));
            const remainingFlags = sortedSquad.filter((team) => !team.eliminated).map((team) => `<span class="lb-flag text-lg leading-none">${team.flag}</span>`).join('');
            const eliminatedFlags = sortedSquad.filter((team) => team.eliminated).map((team) => `<span class="lb-flag text-lg leading-none opacity-70">${team.flag}</span>`).join('');
            const remainingTone = muted ? 'text-gray-400' : 'text-gray-500';
            const eliminatedTone = muted ? 'text-gray-300' : 'text-gray-400';

            return `
                <div class="lb-squad-cell text-left">
                    <div class="flex items-start gap-1 leading-tight text-[8px] font-black tracking-[0.18em] ${remainingTone}">
                        <span class="shrink-0">Rem:</span>
                        <span class="inline-flex min-w-0 max-w-full flex-wrap gap-0.5 align-middle" style="font-size:12px">${remainingFlags || '<span class="text-gray-300" style="font-size:8px">-</span>'}</span>
                    </div>
                    <div class="mt-px flex items-start gap-1 leading-tight text-[8px] font-black tracking-[0.18em] ${eliminatedTone}">
                        <span class="shrink-0">Elim:</span>
                        <span class="inline-flex min-w-0 max-w-full flex-wrap gap-0.5 align-middle" style="font-size:12px">${eliminatedFlags || '<span class="text-gray-300" style="font-size:8px">-</span>'}</span>
                    </div>
                </div>
            `;
        };

        const bestRowMarkup = (bestAvailableTeam && !appSettings.hideTeamSelection) ? `
            <tr class="leaderboard-best-available-pulse border-b border-gray-100 bg-gray-50 text-left text-gray-700 cursor-pointer transition-colors hover:bg-emerald-50/70 focus-within:bg-emerald-50/70" role="button" tabindex="0" aria-label="Open best available explorer" onclick="showBestAvailableExplorer()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();showBestAvailableExplorer();}">
                <td class="w-[52px] md:w-[72px] px-1 md:px-2 py-2.5 text-center text-lg font-black text-gray-400">-</td>
                <td class="w-[52px] md:w-[72px] px-1 md:px-2 py-2.5 text-center text-lg font-black text-gray-500">${bestAvailableTeam.totalPoints}</td>
                <td class="px-4 py-2.5 text-left">
                    <div class="flex items-start gap-3">
                        <div class="relative rounded-full shrink-0 bg-gray-300 flex items-center justify-center overflow-hidden" style="width:36px;height:36px;font-size:18px">🤖</div>
                        <div class="flex-1 min-w-0">
                            <div class="text-sm font-black text-gray-500 text-left">${bestAvailableTeam.nickname}</div>
                            <div class="leaderboard-best-available-cta text-[8px] font-black uppercase tracking-[0.16em] text-emerald-600 text-left">Explore top ${BEST_AVAILABLE_EXPLORER_LIMIT}</div>
                            <div class="mt-1 text-left">
                                ${renderSquadSummary(bestAvailableTeam, true)}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="px-2 py-2.5 text-center font-black text-gray-500">100</td>
                <td class="px-2 py-2.5 text-center font-black text-gray-500">${(bestAvailableTeam.stagePoints.G1 + bestAvailableTeam.stagePoints.G2 + bestAvailableTeam.stagePoints.G3) || '-'}</td>
                <td class="px-2 py-2.5 text-center font-black text-gray-500">${bestAvailableTeam.stagePoints.Bonus || '-'}</td>
                <td class="px-2 py-2.5 text-center font-black text-gray-500">${bestAvailableTeam.stagePoints.R32 || '-'}</td>
                <td class="px-2 py-2.5 text-center font-black text-gray-500">${bestAvailableTeam.stagePoints.R16 || '-'}</td>
                <td class="px-2 py-2.5 text-center font-black text-gray-500">${bestAvailableTeam.stagePoints.QF || '-'}</td>
                <td class="px-2 py-2.5 text-center font-black text-gray-500">${bestAvailableTeam.stagePoints.SM || '-'}</td>
                <td class="px-2 py-2.5 text-center font-black text-gray-500">${bestAvailableTeam.stagePoints.F || '-'}</td>
            </tr>
        ` : '';

        const newRanks = { ...currentRanks };

        const glowDividerRow = `<tr><td colspan="11" class="p-0">
            <div class="h-px w-full opacity-40" style="background: linear-gradient(90deg, transparent 0%, var(--theme-accent-primary) 30%, var(--theme-accent-primary) 70%, transparent 100%); box-shadow: 0 0 6px 0px var(--theme-accent-primary);"></div>
        </td></tr>`;

        body.innerHTML = bestRowMarkup + (filteredLeaderboardData.map((user, idx) => {
            // Compute rank change indicator
            const prevRank = previousRanks[user.email];
            let rankIndicator;
            if (prevRank === undefined || prevRank === null) {
                rankIndicator = '';
            } else {
                const delta = lbRankDeltaMap.get(user.email) ?? (prevRank - user.displayRank);
                if (delta > 0) rankIndicator = `<span class="text-green-500 text-xs font-black">↑${delta}</span>`;
                else if (delta < 0) rankIndicator = `<span class="text-red-400 text-xs font-black">↓${Math.abs(delta)}</span>`;
                else rankIndicator = '';
            }

            const podiumRankClass = [1, 2, 3].includes(Number(user.displayRank))
                ? `leaderboard-podium-row leaderboard-rank-${user.displayRank}`
                : '';
            const rowTone = podiumRankClass || (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50');
            const ownRowClass = user.email === userEmail ? 'leaderboard-own-row' : '';
            const safeEmail = user.email.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            const rowEmail = escapeHtml(user.email);
            const previousVisibleRank = Number(filteredLeaderboardData[idx - 1]?.displayRank || 0);
            const currentVisibleRank = Number(user.displayRank || 0);
            const separator = previousVisibleRank > 0 && previousVisibleRank <= 3 && currentVisibleRank > 3 ? glowDividerRow : '';
            const ptsDelta = lbPointsDeltaMap.get(user.email) ?? 0;
            const ptsDeltaHtml = ptsDelta > 0
                ? `<span class="text-green-500 text-xs font-black">↑${ptsDelta}</span>`
                : ptsDelta < 0 ? `<span class="text-red-400 text-xs font-black">↓${Math.abs(ptsDelta)}</span>` : '';
            const upside = lbUpsideMap.get(user.email) ?? 0;

            return separator + `
            <tr data-leaderboard-email="${rowEmail}" class="theme-hover-row ${rowTone} ${ownRowClass} border-b border-gray-100 transition-colors text-left text-gray-900 cursor-pointer" onclick="showPlayerProfile('${safeEmail}')">
                <td class="w-[52px] md:w-[72px] px-1 md:px-2 py-2.5 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <div class="w-7 shrink-0 text-right">${rankIndicator}</div>
                        <div class="text-lg font-black text-gray-900">#${user.displayRank}</div>
                    </div>
                </td>
                <td class="w-[52px] md:w-[72px] px-1 md:px-2 py-2.5 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        <div class="w-4 text-right">${ptsDeltaHtml}</div>
                        <div class="text-lg font-black text-gray-900">${user.totalPoints}</div>
                    </div>
                </td>
                <td class="px-4 py-2.5 text-left">
                    <div class="flex items-center gap-3">
                        ${_renderPlayerAvatar(user.avatarUrl, user.favoriteTeam, 36, user.nickname)}
                        <div class="flex-1 min-w-0">
                            <div class="flex flex-wrap items-center gap-1.5 text-left">
                                <div class="max-w-[42rem] whitespace-normal break-words text-left text-sm font-black leading-tight text-gray-900">${formatLeaderboardNickname(user.nickname)}</div>
                                <span class="lb-badge-cell">${renderPlayerChips(user.chips, user.email, 'row')}</span>
                            </div>
                            <div class="mt-0.5 text-[9px] font-bold tracking-[0.08em] text-gray-400 text-left">${user.realname}</div>
                            <div class="mt-0.5 text-left">
                                ${renderSquadSummary(user)}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="lb-upside-col px-2 py-2.5 text-center">
                    <div class="text-sm font-black text-gray-900">${upside}</div>
                    <div class="text-[8px] font-black text-gray-400 leading-none">/100</div>
                </td>
                <td class="px-2 py-2.5 text-center font-black text-gray-900">${(user.stagePoints.G1 + user.stagePoints.G2 + user.stagePoints.G3) || '-'}</td>
                <td class="px-2 py-2.5 text-center font-black text-gray-900">${user.stagePoints.Bonus || '-'}</td>
                <td class="px-2 py-2.5 text-center font-black text-gray-900">${user.stagePoints.R32 || '-'}</td>
                <td class="px-2 py-2.5 text-center font-black text-gray-900">${user.stagePoints.R16 || '-'}</td>
                <td class="px-2 py-2.5 text-center font-black text-gray-900">${user.stagePoints.QF || '-'}</td>
                <td class="px-2 py-2.5 text-center font-black text-gray-900">${user.stagePoints.SM || '-'}</td>
                <td class="px-2 py-2.5 text-center font-black text-gray-900">${user.stagePoints.F || '-'}</td>
            </tr>
        `;
        }).join('') || '<tr><td colspan="11" class="p-8 text-center text-gray-900">No players found</td></tr>');

        if (!_lbShowSelection) document.querySelectorAll('.lb-squad-cell').forEach((el) => { el.classList.add('lb-collapsed'); });
        if (!_lbShowChips) document.querySelectorAll('.lb-badge-cell').forEach((el) => { el.classList.add('lb-collapsed'); });

        // Persist ranks for next page load comparison, cache data for player profile modal
        localStorage.setItem('wc_pool_lb_ranks', JSON.stringify(newRanks));
        window._leaderboardData = enrichedLeaderboardData;
        window._bestAvailableSquads = annotatedBestAvailableSquads;
        window._bestAvailablePoolContext = bestAvailablePoolContext;
        window._bestAvailablePoolContexts = bestAvailablePoolContexts;
        window._leaderboardTeamPointsMap = leaderboardTeamPointsMap;
        window._leaderboardTeamBreakdownMap = leaderboardTeamBreakdownMap;
        window._playerChipsByEmail = Object.fromEntries(playerChips);
        window._matchesCache = allMatches || [];
        window._picksCache = allPicks || [];
        window._profilesTotalCount = new Set((allProfiles || []).map((p) => p.email).filter(Boolean)).size;
        resolvePendingLeaderboardSelfScroll();
    } catch (error) {
        body.innerHTML = '<tr><td colspan="11" class="p-8 text-center text-red-500 text-gray-900">Error calculating scores</td></tr>';
    }
}

async function fetchStats() {
    const countryBox = document.getElementById('country-pick-stats');
    const rosterBox = document.getElementById('roster-size-stats');

    countryBox.innerHTML = '<div class="animate-pulse text-gray-500 text-left">Analyzing...</div>';
    rosterBox.innerHTML = '<div class="animate-pulse text-gray-500 text-left">Calculating...</div>';

    try {
        const [
            { data: picksData, error: picksError },
            { data: profilesData, error: profilesError }
        ] = await Promise.all([
            supabaseClient.from('picks').select('team_name, user_email'),
            supabaseClient.from('profiles').select('email')
        ]);

        if (picksError) {
            throw picksError;
        }

        if (profilesError) {
            throw profilesError;
        }

        const stats = buildSelectionStatsSnapshot(picksData || [], profilesData || []);

        countryBox.innerHTML = stats.sortedCountryCounts.map((entry) => {
            const team = teams.find((teamEntry) => teamEntry.name === entry.teamName);
            return `
                <div class="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 text-gray-900 text-left">
                    <div class="flex items-center gap-3">
                        <span>${team.flag}</span>
                        <span class="text-sm uppercase tracking-tighter">${entry.teamName}</span>
                    </div>
                    <div class="picks-price-pill px-3 py-1 rounded-full text-xs font-black">${entry.count} PICKS</div>
                </div>
            `;
        }).join('') || 'No picks yet.';

        rosterBox.innerHTML = stats.rosterDensityEntries.map((entry) => `
            <div class="flex justify-between items-center py-4 border-b border-gray-50 last:border-0 text-gray-900 text-left">
                <div>
                    <span class="text-3xl font-black text-gray-900">${entry.size}</span>
                    <span class="text-[10px] text-gray-400 uppercase ml-2 text-gray-900 text-left">Teams</span>
                </div>
                <div class="text-right text-gray-900 text-right">
                    <div class="text-lg">${entry.count}</div>
                    <div class="text-[8px] text-gray-400 uppercase text-left">Players</div>
                </div>
            </div>
        `).join('') || 'No rosters yet.';
    } catch (error) {
        console.error(error);
    }
}

// ── System Messages ──────────────────────────────────────────────────────────
// Posts a centred notification strip into the chat (match results, eliminations,
// admin announcements). These have type != 'user' and never show reactions.

async function postSystemMessage(type, content) {
    await supabaseClient.from('messages').insert([{
        user_email: 'system',
        nickname: 'system',
        realname: 'system',
        content,
        type
    }]);
}

// Escape special HTML characters so raw message content can't inject markup.
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeJsSingleQuoted(str) {
    return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n');
}

const LEADERBOARD_NICKNAME_SOFT_BREAK_CHARS = 44;
const LEADERBOARD_NICKNAME_SOFT_BREAK_WINDOW = 4;

function _findLeaderboardNicknameBreakIndex(segment, targetIndex) {
    const min = Math.max(1, targetIndex - LEADERBOARD_NICKNAME_SOFT_BREAK_WINDOW);
    const max = Math.min(segment.length - 1, targetIndex + LEADERBOARD_NICKNAME_SOFT_BREAK_WINDOW);
    let bestIndex = null;
    let bestDistance = Infinity;

    for (let index = min; index <= max; index++) {
        const isCamelBoundary = /[a-z0-9]/.test(segment[index - 1] || '') && /[A-Z]/.test(segment[index] || '');
        if (!isCamelBoundary) continue;

        const distance = Math.abs(targetIndex - index);
        if (distance < bestDistance || (distance === bestDistance && index < targetIndex)) {
            bestIndex = index;
            bestDistance = distance;
        }
    }

    return bestIndex || targetIndex;
}

function _splitLeaderboardNicknameSegment(segment) {
    const parts = [];
    let remaining = String(segment);

    while (remaining.length > LEADERBOARD_NICKNAME_SOFT_BREAK_CHARS) {
        const breakIndex = _findLeaderboardNicknameBreakIndex(remaining, LEADERBOARD_NICKNAME_SOFT_BREAK_CHARS);
        parts.push(remaining.slice(0, breakIndex));
        remaining = remaining.slice(breakIndex);
    }

    if (remaining) parts.push(remaining);
    return parts;
}

function formatLeaderboardNickname(nickname) {
    return String(nickname || '')
        .split(/(\s+)/)
        .map((segment) => {
            if (!segment || /\s+/.test(segment)) return escapeHtml(segment);
            return _splitLeaderboardNicknameSegment(segment)
                .map((part) => escapeHtml(part))
                .join('&shy;');
        })
        .join('');
}

// Replace @[Nickname] tokens with a clickable highlighted span that opens the player profile.
function parseMentions(content, isOwnMessage = false) {
    return escapeHtml(content).replace(/@\[([^\]]+)\]/g, (_, name) => {
        const safe = escapeHtml(name).replace(/'/g, '&#39;');
        if (isOwnMessage) {
            return `<span class="font-black text-white cursor-pointer hover:opacity-80" onclick="showProfileByNickname('${safe}')">@${escapeHtml(name)}</span>`;
        }
        const color = mentionColorMap[name] || '#60a5fa';
        return `<span class="font-black cursor-pointer hover:underline" style="color:${color}" onclick="showProfileByNickname('${safe}')">@${escapeHtml(name)}</span>`;
    });
}

// ── @mention autocomplete ────────────────────────────────────────────────────

let mentionProfilesCache = null;
let mentionColorMap = {}; // nickname → team accent hex

async function getMentionProfiles() {
    if (mentionProfilesCache) return mentionProfilesCache;
    const { data } = await supabaseClient
        .from('profiles')
        .select('email, nickname, realname, favorite_team')
        .not('nickname', 'is', null);
    mentionProfilesCache = (data || []).filter((p) => p.nickname);
    mentionColorMap = {};
    mentionProfilesCache.forEach((p) => {
        if (p.favorite_team) {
            const tokens = getFavoriteTeamAccentTokens(p.favorite_team);
            mentionColorMap[p.nickname] = tokens.primary;
        }
    });
    return mentionProfilesCache;
}

async function showProfileByNickname(nickname) {
    const profiles = await getMentionProfiles();
    const profile = profiles.find((p) => p.nickname === nickname);
    if (profile?.email) showPlayerProfile(profile.email);
}

// Returns info about an active @-mention being typed at the cursor, or null.
function getMentionQuery() {
    const input = document.getElementById('chat-input');
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;

    const range = sel.getRangeAt(0);
    if (!input || !input.contains(range.startContainer)) return null;

    const textNode = range.startContainer;
    if (textNode.nodeType !== Node.TEXT_NODE) return null;

    const before = textNode.textContent.slice(0, range.startOffset);
    const atIndex = before.lastIndexOf('@');
    if (atIndex === -1) return null;

    const query = before.slice(atIndex + 1);
    if (query.includes(' ')) return null; // space = mention ended

    return { query, atIndex, textNode, cursorOffset: range.startOffset };
}

// Read the contenteditable div, converting mention chips back to @[Name] tokens.
function getChatContent() {
    const input = document.getElementById('chat-input');
    if (!input) return '';

    let result = '';
    function walk(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            result += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList.contains('mention-chip')) {
                result += `@[${node.dataset.mentionName}]`;
            } else {
                node.childNodes.forEach(walk);
            }
        }
    }
    input.childNodes.forEach(walk);
    // Collapse non-breaking spaces back to regular spaces and trim
    return result.replace(/\u00A0/g, ' ').trim();
}

function insertMention(nickname) {
    const input = document.getElementById('chat-input');
    const dropdown = document.getElementById('mention-dropdown');
    if (!input) return;

    const info = getMentionQuery();
    if (!info) return;

    const { atIndex, textNode, cursorOffset } = info;
    const afterText = textNode.textContent.slice(cursorOffset);

    // Trim the @query from the text node
    textNode.textContent = textNode.textContent.slice(0, atIndex);

    // Insert a non-editable chip span
    const chip = document.createElement('span');
    chip.contentEditable = 'false';
    chip.className = 'mention-chip inline-block text-blue-600 font-black bg-blue-50 rounded-md px-1 mx-px cursor-default select-all text-sm';
    chip.dataset.mentionName = nickname;
    chip.textContent = `@${nickname}`;

    // Space node after the chip so the cursor lands in the right place
    const spaceNode = document.createTextNode('\u00A0' + afterText);

    textNode.after(chip);
    chip.after(spaceNode);

    // Move cursor to after the space
    const sel = window.getSelection();
    const newRange = document.createRange();
    newRange.setStart(spaceNode, 1);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

    input.focus();
    if (dropdown) dropdown.classList.add('hidden');
}

function setupMentionAutocomplete() {
    const input = document.getElementById('chat-input');
    if (!input || input.dataset.mentionBound === 'true') return;
    input.dataset.mentionBound = 'true';

    const dropdown = document.getElementById('mention-dropdown');
    if (!dropdown) return;

    let activeIndex = -1; // which row is keyboard-highlighted

    function getRows() {
        return Array.from(dropdown.querySelectorAll('button[data-mention-row]'));
    }

    function highlight(index) {
        const rows = getRows();
        rows.forEach((r, i) => {
            r.classList.toggle('bg-gray-100', i === index);
            r.classList.toggle('bg-white', i !== index);
        });
        activeIndex = index;
    }

    async function updateDropdown() {
        const info = getMentionQuery();
        if (!info) {
            dropdown.classList.add('hidden');
            activeIndex = -1;
            return;
        }

        const query = info.query.toLowerCase();
        const profiles = await getMentionProfiles();

        // Match against both nickname and realname so you can type either.
        const filtered = profiles.filter((p) =>
            p.nickname.toLowerCase().includes(query) ||
            (p.realname && p.realname.toLowerCase().includes(query))
        );

        if (!filtered.length) {
            dropdown.classList.add('hidden');
            activeIndex = -1;
            return;
        }

        dropdown.innerHTML = filtered.map((p) => `
            <button data-mention-row data-nickname="${escapeHtml(p.nickname)}"
                    class="w-full text-left px-4 py-2.5 bg-white hover:bg-gray-100 text-sm font-bold text-gray-700 flex items-center gap-2 transition-colors"
                    onmousedown="event.preventDefault(); insertMention('${escapeHtml(p.nickname)}')">
                <span class="theme-accent-text">@${escapeHtml(p.nickname)}</span>
                <span class="text-xs font-normal text-gray-400">${escapeHtml(p.realname || '')}</span>
            </button>`).join('');

        activeIndex = -1;
        dropdown.classList.remove('hidden');
    }

    input.addEventListener('input', updateDropdown);
    input.addEventListener('keyup', updateDropdown); // contenteditable fires keyup too

    // Keyboard navigation: ArrowUp / ArrowDown to move, Tab / Enter to confirm, Escape to close.
    input.addEventListener('keydown', (e) => {
        if (dropdown.classList.contains('hidden')) return;
        const rows = getRows();

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlight(Math.min(activeIndex + 1, rows.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlight(Math.max(activeIndex - 1, 0));
        } else if (e.key === 'Tab' || e.key === 'Enter') {
            const target = activeIndex >= 0 ? rows[activeIndex] : rows[0];
            if (target) {
                e.preventDefault();
                insertMention(target.dataset.nickname);
            }
        } else if (e.key === 'Escape') {
            dropdown.classList.add('hidden');
            activeIndex = -1;
        }
    });

    // Use blur instead of click-outside so mobile tap-to-select still works
    // (mousedown on a row uses preventDefault to keep focus on the input).
    input.addEventListener('blur', () => {
        setTimeout(() => { dropdown.classList.add('hidden'); activeIndex = -1; }, 150);
    });
}

// ── Long-press / Edit / Undo Send ────────────────────────────────────────────

// Cross-platform long-press: fires callback after 500ms hold on touch or mouse.
function addLongPressHandler(el, callback) {
    let timer = null;
    const start = () => { timer = setTimeout(callback, 500); };
    const cancel = () => { clearTimeout(timer); timer = null; };

    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchend', cancel);
    el.addEventListener('touchmove', cancel);
    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', cancel);
    el.addEventListener('mouseleave', cancel);
}

// Create the singleton action menu (Edit / Undo Send) once, appended to body.
function setupMessageActionMenu() {
    if (document.getElementById('message-action-menu')) return;

    const menu = document.createElement('div');
    menu.id = 'message-action-menu';
    menu.className = 'hidden fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden min-w-[160px]';
    menu.innerHTML = `
        <button id="msg-action-edit"
                class="flex items-center gap-3 px-5 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 w-full text-left transition-colors">
            ✏️ Edit
        </button>
        <div class="h-px bg-gray-100 mx-3"></div>
        <button id="msg-action-undo"
                class="flex items-center gap-3 px-5 py-3.5 text-sm font-bold text-red-500 hover:bg-red-50 w-full text-left transition-colors">
            🗑 Undo Send
        </button>`;
    document.body.appendChild(menu);

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#message-action-menu')) {
            menu.classList.add('hidden');
        }
    });
}

// Show the action menu anchored near anchorEl (the bubble).
// Only within the 3-minute edit window — no-ops silently if outside.
function showMessageActionMenu(messageId, createdAt, anchorEl) {
    const menu = document.getElementById('message-action-menu');
    if (!menu) return;

    const ageMs = Date.now() - new Date(createdAt).getTime();
    if (ageMs > 3 * 60 * 1000) return; // outside the 3-min window, ignore

    const editBtn = document.getElementById('msg-action-edit');
    const undoBtn = document.getElementById('msg-action-undo');

    editBtn.onclick = () => { menu.classList.add('hidden'); startEditMessage(messageId); };
    undoBtn.onclick = () => { menu.classList.add('hidden'); undoSendMessage(messageId); };

    // Position above or beside the bubble, keeping within viewport
    const rect = anchorEl.getBoundingClientRect();
    const menuW = 180;
    let left = rect.right - menuW;
    let top = rect.top - 110;

    left = Math.max(8, Math.min(left, window.innerWidth - menuW - 8));
    top = Math.max(8, top);

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.classList.remove('hidden');
}

function startEditMessage(messageId) {
    const wrapper = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!wrapper) return;

    const contentDiv = wrapper.querySelector('.message-content');
    if (!contentDiv || contentDiv.dataset.editing === 'true') return;
    contentDiv.dataset.editing = 'true';

    const rawContent = contentDiv.dataset.rawContent || '';

    contentDiv.innerHTML = `
        <div class="flex flex-col gap-2 mt-1">
            <textarea class="w-full rounded-xl border border-gray-300 p-2 text-sm font-bold text-gray-900 outline-none resize-none bg-white" rows="2">${escapeHtml(rawContent)}</textarea>
            <div class="flex gap-2">
                <button onclick="saveEditMessage(${messageId})"
                        class="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-green-500 text-white hover:bg-green-400 transition-colors">
                    Save
                </button>
                <button onclick="cancelEditMessage(${messageId})"
                        class="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
                    Cancel
                </button>
            </div>
        </div>`;

    contentDiv.querySelector('textarea').focus();
}

async function saveEditMessage(messageId) {
    const wrapper = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!wrapper) return;

    const contentDiv = wrapper.querySelector('.message-content');
    const textarea = contentDiv?.querySelector('textarea');
    if (!textarea) return;

    const newContent = textarea.value.trim();
    if (!newContent) return;

    const { error } = await supabaseClient
        .from('messages')
        .update({ content: newContent })
        .eq('id', messageId)
        .eq('user_email', userEmail);

    if (error) { showToast('Could not save edit.'); return; }

    contentDiv.dataset.rawContent = newContent;
    contentDiv.dataset.editing = 'false';
    contentDiv.innerHTML = `${parseMentions(newContent)}<span class="text-[9px] opacity-40 ml-1 font-normal italic">edited</span>`;
}

function cancelEditMessage(messageId) {
    const wrapper = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!wrapper) return;

    const contentDiv = wrapper.querySelector('.message-content');
    if (!contentDiv) return;

    contentDiv.dataset.editing = 'false';
    contentDiv.innerHTML = parseMentions(contentDiv.dataset.rawContent || '');
}

async function undoSendMessage(messageId) {
    const wrapper = document.querySelector(`[data-message-id="${messageId}"]`);

    const { error } = await supabaseClient
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('user_email', userEmail);

    if (error) { showToast('Could not delete message.'); return; }
    if (wrapper) wrapper.remove();
}

// ── Chat Unread Badge ─────────────────────────────────────────────────────────
let chatUnreadCount = 0;

function updateChatBadge() {
    const display = chatUnreadCount > 9 ? '9+' : String(chatUnreadCount);
    ['chat-unread-badge', 'chat-unread-badge-mobile'].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = display;
        el.classList.toggle('hidden', chatUnreadCount === 0);
        // Mobile badge uses inline-flex; desktop badge uses flex — sync display value
        if (chatUnreadCount > 0) {
            el.style.display = id === 'chat-unread-badge-mobile' ? 'inline-flex' : 'flex';
        }
    });
}

function clearChatBadge() {
    chatUnreadCount = 0;
    updateChatBadge();
}

function setupChat() {
    clearChatBadge();
    fetchMessages();
    setupChatKeyboardSubmit();
    setupMentionAutocomplete();
    setupMessageActionMenu();

    // Register a single document-level click handler to dismiss open emoji pickers
    // when the user taps anywhere outside a picker or its trigger button.
    // The flag prevents duplicate listeners if setupChat is called more than once.
    if (!document._emojiPickerDismissSetup) {
        document._emojiPickerDismissSetup = true;
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.emoji-add-btn') && !e.target.closest('[id^="emoji-picker-"]')) {
                document.querySelectorAll('[id^="emoji-picker-"]').forEach((p) => {
                    p.classList.add('hidden');
                    p.classList.remove('flex');
                });
            }
        });
    }

    if (chatChannel) {
        return;
    }

    chatChannel = supabaseClient
        .channel('chat-channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
            // Skip if already rendered optimistically by the sender
            if (document.querySelector(`[data-message-id="${payload.new.id}"]`)) return;
            // Remove empty state if present
            const box = document.getElementById('chat-box');
            if (box && box.querySelector('.flex-col.items-center')) {
                box.innerHTML = '';
            }
            renderMessage(payload.new);
            // Badge: only for real user messages from others, not system messages
            if (payload.new.type && payload.new.type !== 'user') return; // system msgs don't count
            if (payload.new.user_email === userEmail) return; // own messages don't count
            const chatPage = document.getElementById('page-chat');
            if (!chatPage || chatPage.classList.contains('hidden')) {
                chatUnreadCount++;
                updateChatBadge();
            }
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
            const el = document.querySelector(`[data-message-id="${payload.old.id}"]`);
            if (el) el.remove();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, () => {
            const box = document.getElementById('chat-box');
            if (!box) return;
            const ids = Array.from(box.querySelectorAll('[data-message-id]'))
                .map((el) => parseInt(el.dataset.messageId))
                .filter(Boolean);
            if (ids.length) loadAllReactions(ids);
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

    if (data && data.length > 0) {
        data.forEach((message) => renderMessage(message));
        loadAllReactions(data.map((m) => m.id));
    } else {
        box.innerHTML = `
            <div class="flex flex-col items-center justify-center flex-1 text-center py-16 text-gray-400">
                <div class="text-5xl mb-4">💬</div>
                <p class="font-black uppercase tracking-[0.2em] text-sm">No messages yet</p>
                <p class="text-xs mt-2 font-bold uppercase tracking-wider opacity-70">Say hello to kick things off!</p>
            </div>`;
    }
}

function formatMessageTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (isToday) return `Today ${timeStr}`;
    if (isYesterday) return `Yesterday ${timeStr}`;
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr}`;
}

function renderMessage(message) {
    const box = document.getElementById('chat-box');
    if (!box) {
        return;
    }

    // System messages (match results, eliminations, admin notifications) render as
    // centred, pill-shaped notification strips — no bubble, reactions, or + button.
    if (message.type && message.type !== 'user') {
        const strip = document.createElement('div');
        strip.className = 'w-full flex justify-center my-1';
        let pillClass = 'text-xs font-bold tracking-wide text-center px-4 py-1.5 rounded-full max-w-xs';
        if (message.type === 'match_result') {
            pillClass += ' bg-gray-100 text-gray-500';
        } else if (message.type === 'elimination') {
            pillClass += ' bg-red-50 text-red-400';
        } else if (message.type === 'admin_notification') {
            pillClass += ' bg-blue-50 text-blue-500';
        } else {
            pillClass += ' bg-gray-100 text-gray-400';
        }
        strip.innerHTML = `<div class="${pillClass}">${escapeHtml(message.content)}</div>`;
        box.appendChild(strip);
        box.scrollTop = box.scrollHeight;
        return;
    }

    const isMe = message.user_email === userEmail;
    const EMOJI_SET = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

    const wrapper = document.createElement('div');
    wrapper.className = `max-w-[80%] ${isMe ? 'self-end' : 'self-start'} message-enter`;
    wrapper.dataset.messageId = message.id;

    const emojiPickerButtons = EMOJI_SET.map((e) =>
        `<button class="text-base hover:scale-125 transition-transform" data-message-id="${message.id}" data-emoji="${e}" onclick="handleEmojiReaction(this)">${e}</button>`
    ).join('');

    // The + button sits beside the bubble at the top corner (left for own messages, right for others),
    // mirroring the iMessage tapback position. The picker floats above the button via bottom-full.
    const addBtnContainer = `
        <div class="relative flex-shrink-0">
            <button class="emoji-add-btn mt-1 w-6 h-6 rounded-full bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-xs text-gray-400 shadow-sm transition-colors" onclick="toggleEmojiPicker(${message.id})">＋</button>
            <div id="emoji-picker-${message.id}" class="hidden absolute bottom-full mb-1 ${isMe ? 'left-0' : 'right-0'} z-30 items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-lg whitespace-nowrap">
                ${emojiPickerButtons}
            </div>
        </div>`;

    const bubble = `
        <div data-bubble class="px-3 py-2.5 rounded-2xl text-left ${isMe ? 'theme-chat-own rounded-tr-none' : 'bg-gray-100 rounded-tl-none'}">
            <div class="text-[9px] font-black uppercase text-left ${isMe ? 'theme-chat-own-meta' : 'theme-accent-text'}">
                ${isMe
                    ? `${escapeHtml(message.nickname)} <span class="opacity-60">(${escapeHtml(message.realname)})</span>`
                    : `<span class="cursor-pointer hover:underline" onclick="showPlayerProfile('${message.user_email}')">${escapeHtml(message.nickname)}</span> <span class="opacity-50">(${escapeHtml(message.realname)})</span>`
                }
            </div>
            <div class="message-content font-bold mt-0.5 text-sm text-left ${isMe ? 'text-white' : 'text-black'}"
                 data-raw-content="${escapeHtml(message.content)}">${parseMentions(message.content, isMe)}</div>
            <div class="text-[9px] mt-1 text-left font-medium ${isMe ? 'opacity-60' : 'opacity-40'}">${formatMessageTime(message.created_at)}</div>
        </div>`;

    const senderEntry = (window._leaderboardData || []).find((e) => e.email === message.user_email);
    const avatarHtml = _renderPlayerAvatar(senderEntry?.avatarUrl || null, senderEntry?.favoriteTeam || '', 32, message.nickname);

    wrapper.innerHTML = `
        <div class="flex items-start gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}">
            ${isMe ? addBtnContainer + bubble + avatarHtml : avatarHtml + bubble + addBtnContainer}
        </div>
        <div id="reactions-${message.id}" class="flex flex-wrap items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}"></div>
    `;

    box.appendChild(wrapper);
    box.scrollTop = box.scrollHeight;

    // Long-press (mobile) and right-click (desktop) both open the edit/undo menu
    if (isMe) {
        const bubbleEl = wrapper.querySelector('[data-bubble]');
        if (bubbleEl) {
            addLongPressHandler(bubbleEl, () => {
                showMessageActionMenu(message.id, message.created_at, bubbleEl);
            });
            bubbleEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showMessageActionMenu(message.id, message.created_at, bubbleEl);
            });
        }
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const content = getChatContent();
    const nickname = document.getElementById('nickname-input').value.trim();
    const realname = document.getElementById('realname-input').value.trim();

    if (!content || !nickname || !realname) {
        return showToast('Set your Name first!');
    }

    // Clear input immediately so it feels instant
    input.innerHTML = '';
    input.focus();

    // Insert and get the saved row back so we can render it optimistically
    const { data, error } = await supabaseClient
        .from('messages')
        .insert([{ user_email: userEmail, nickname, realname, content }])
        .select()
        .single();

    if (error) {
        showToast('Message failed to send.');
        return;
    }

    // Render immediately — the realtime handler will skip it since it's already in the DOM
    renderMessage(data);
}

function setupChatKeyboardSubmit() {
    const input = document.getElementById('chat-input');

    if (!input || input.dataset.enterBound === 'true') {
        return;
    }

    input.dataset.enterBound = 'true';
    // contenteditable fires keydown; Enter sends, Shift+Enter is a newline
    input.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' || event.shiftKey) {
            return;
        }

        event.preventDefault();
        sendChatMessage();
    });
}

// ── Emoji Reactions ──────────────────────────────────────────────────────────

function toggleEmojiPicker(messageId) {
    const picker = document.getElementById(`emoji-picker-${messageId}`);
    if (!picker) return;
    const isHidden = picker.classList.contains('hidden');
    // Close all open pickers first
    document.querySelectorAll('[id^="emoji-picker-"]').forEach((p) => {
        p.classList.add('hidden');
        p.classList.remove('flex');
    });
    if (isHidden) {
        picker.classList.remove('hidden');
        picker.classList.add('flex');
    }
}

function handleEmojiReaction(btn) {
    toggleReaction(parseInt(btn.dataset.messageId), btn.dataset.emoji);
}

async function toggleReaction(messageId, emoji) {
    const picker = document.getElementById(`emoji-picker-${messageId}`);
    if (picker) {
        picker.classList.add('hidden');
        picker.classList.remove('flex');
    }

    const { data: existing } = await supabaseClient
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_email', userEmail)
        .eq('emoji', emoji)
        .maybeSingle();

    if (existing) {
        await supabaseClient.from('message_reactions').delete().eq('id', existing.id);
    } else {
        await supabaseClient.from('message_reactions').insert({ message_id: messageId, user_email: userEmail, emoji });
    }

    await renderReactions(messageId);
}

async function renderReactions(messageId) {
    const { data } = await supabaseClient
        .from('message_reactions')
        .select('emoji, user_email')
        .eq('message_id', messageId);

    updateReactionDisplay(messageId, data || []);
}

function updateReactionDisplay(messageId, reactions) {
    const area = document.getElementById(`reactions-${messageId}`);
    if (!area) return;

    // Group reactions by emoji
    const counts = {};
    reactions.forEach((r) => {
        if (!counts[r.emoji]) counts[r.emoji] = { count: 0, mine: false };
        counts[r.emoji].count++;
        if (r.user_email === userEmail) counts[r.emoji].mine = true;
    });

    area.innerHTML = '';
    Object.entries(counts).forEach(([emoji, { count, mine }]) => {
        const btn = document.createElement('button');
        btn.className = `reaction-count-btn text-xs px-2 py-0.5 rounded-full border font-bold transition-colors ${mine ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`;
        btn.dataset.messageId = messageId;
        btn.dataset.emoji = emoji;
        btn.onclick = function () { handleEmojiReaction(this); };
        btn.textContent = `${emoji} ${count}`;
        area.appendChild(btn);
    });
}

async function loadAllReactions(messageIds) {
    if (!messageIds.length) return;

    const { data } = await supabaseClient
        .from('message_reactions')
        .select('message_id, emoji, user_email')
        .in('message_id', messageIds);

    if (!data) return;

    const byMessage = {};
    data.forEach((r) => {
        if (!byMessage[r.message_id]) byMessage[r.message_id] = [];
        byMessage[r.message_id].push(r);
    });

    messageIds.forEach((id) => updateReactionDisplay(id, byMessage[id] || []));
}

// ── Player Profile Modal ──────────────────────────────────────────────────────

async function showPlayerProfile(email) {
    const modal = document.getElementById('player-profile-modal');
    const content = document.getElementById('player-profile-modal-content');
    if (!modal || !content) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Close on Escape key
    const onEscape = (e) => { if (e.key === 'Escape') { closePlayerProfile(); document.removeEventListener('keydown', onEscape); } };
    document.addEventListener('keydown', onEscape);
    content.innerHTML = '<div class="p-8 text-center text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Loading...</div>';

    // Pull from cached leaderboard data (set after each fetchLeaderboard render)
    const lb = window._leaderboardData || [];
    const playerEntry = lb.find((u) => u.email === email);

    // Fetch profile details not in leaderboard data
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('nickname, realname, favorite_team, home_country, avatar_url')
        .eq('email', email)
        .single();

    const nickname = profile?.nickname || playerEntry?.nickname || email.split('@')[0];
    const realname = profile?.realname || playerEntry?.realname || '';
    const favTeam = teams.find((t) => t.name === profile?.favorite_team);
    const favFlag = favTeam?.flag || '';
    const playerChips = playerEntry?.chips || window._playerChipsByEmail?.[email] || [];
    const cardAccent = getPlayerCardAccentStyle(profile?.favorite_team || '');

    // Squad section
    let squadHtml = '';
    let budgetUsed = 0;
    const squadHidden = Boolean(appSettings.hideTeamSelection) && email !== userEmail;
    if (squadHidden) {
        squadHtml = '<div class="col-span-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 py-2">Teams to be displayed when WC starts</div>';
    } else if (playerEntry?.squad?.length > 0) {
        budgetUsed = playerEntry.squad.reduce((sum, t) => sum + (t.cost || 0), 0);
        const teamBreakdownMap = buildTeamStageBreakdownMap(window._matchesCache || [], teams, advancedTeams);
        squadHtml = playerEntry.squad
            .sort((a, b) => (b.cost || 0) - (a.cost || 0) || a.name.localeCompare(b.name))
            .map((t) => {
                const teamPts = teamBreakdownMap[t.name]?.total || 0;
                const ptsLabel = teamPts > 0 ? ` · <span class="font-black text-gray-200">${teamPts} PTS</span>` : '';
                return `
                <div class="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 flex items-center gap-2 ${t.eliminated ? 'opacity-40' : ''} cursor-pointer hover:border-gray-500 hover:bg-gray-750 transition-colors" onclick="showProfileTeam('${t.name.replace(/'/g, "\\'")}')">
                    <span class="text-xl">${t.flag || ''}</span>
                    <div class="flex-1 min-w-0">
                        <div class="text-xs font-black uppercase text-white truncate">${escapeHtml(t.name)}</div>
                        <div class="text-[10px] font-bold text-gray-400">T${t.tier} · $${t.cost}${t.eliminated ? ' · out' : ''}${ptsLabel}</div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-gray-600 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
                </div>
                `;
            }).join('');
    } else {
        squadHtml = '<div class="col-span-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 py-2">No squad saved yet</div>';
    }

    // Points stage breakdown
    let stageBreakdownHtml = '';
    if (playerEntry) {
        const sp = playerEntry.stagePoints || {};
        const groupPts = (sp.G1 || 0) + (sp.G2 || 0) + (sp.G3 || 0);
        [
            { label: 'Group', pts: groupPts },
            { label: 'Bonus', pts: sp.Bonus || 0 },
            { label: 'R32', pts: sp.R32 || 0 },
            { label: 'R16', pts: sp.R16 || 0 },
            { label: 'QF', pts: sp.QF || 0 },
            { label: 'Semi', pts: sp.SM || 0 },
            { label: 'Final', pts: sp.F || 0 },
        ].forEach(({ label, pts }) => {
            stageBreakdownHtml += `
                <div class="text-center">
                    <div class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">${label}</div>
                    <div class="text-sm font-black text-white">${pts || '—'}</div>
                </div>`;
        });
    }

    const budgetBarHtml = budgetUsed > 0 ? `
        <div class="px-6 pb-5" style="${cardAccent.style}">
            <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Budget Used</span>
                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-white">$${budgetUsed} / $150</span>
            </div>
            <div class="h-2 rounded-full overflow-hidden" style="background-color: rgba(var(--player-card-accent-primary-rgb, 59, 130, 246), 0.18);">
                <div class="h-full rounded-full" style="width: ${Math.round(budgetUsed / 150 * 100)}%; background: linear-gradient(90deg, var(--player-card-accent-primary, #3b82f6), var(--player-card-accent-on-dark, #93c5fd));"></div>
            </div>
        </div>` : '';

    content.innerHTML = `
        <div class="p-6 space-y-4" style="${cardAccent.style}">
            <div class="flex items-center gap-3">
                ${_renderPlayerAvatar(profile?.avatar_url, profile?.favorite_team, 48, nickname)}
                <div class="min-w-0 flex-1 flex flex-col gap-0.5">
                    <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                        <span class="text-lg font-black uppercase italic tracking-tight text-white">${escapeHtml(nickname)}</span>
                        ${realname ? `<span class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">${escapeHtml(realname)}</span>` : ''}
                    </div>
                    ${(profile?.favorite_team || profile?.home_country) ? `<div class="flex flex-wrap items-center gap-x-2 gap-y-0">
                        ${profile?.favorite_team ? `<span class="text-[10px] font-black uppercase tracking-[0.15em] text-gray-300">${favFlag} ${escapeHtml(profile.favorite_team)}</span>` : ''}
                        ${profile?.home_country ? `<span class="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">${escapeHtml(profile.home_country)}</span>` : ''}
                    </div>` : ''}
                </div>
                ${playerEntry ? `<div class="text-right shrink-0">
                    <div class="text-2xl font-black" style="color: var(--player-card-accent-on-dark);">${playerEntry.totalPoints}</div>
                    <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">pts</div>
                </div>` : ''}
            </div>
            ${renderPlayerChips(playerChips, email, 'card', 'player-profile')}

            ${playerEntry && stageBreakdownHtml ? `
            <div class="rounded-2xl border px-4 py-3" style="border-color: var(--player-card-accent-soft-strong); background-color: ${rgbaFromHex(cardAccent.tokens.primary, 0.12)};">
                <div class="text-[9px] font-black uppercase tracking-[0.25em] text-gray-500 mb-3">Points by Stage</div>
                <div class="grid grid-cols-7 gap-1">${stageBreakdownHtml}</div>
            </div>` : ''}

            <div>
                <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Squad</div>
                <div class="grid grid-cols-2 gap-2">${squadHtml}</div>
            </div>
        </div>
        ${budgetBarHtml}
    `;
}

function showProfileChipsPopup(email, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const modal = document.getElementById('profile-chips-popup');
    const titleEl = document.getElementById('profile-chips-popup-title');
    const body = document.getElementById('profile-chips-popup-body');
    if (!modal || !body) return;

    const lb = window._leaderboardData || [];
    const player = lb.find((e) => e.email === email);
    const chips = player?.chips || (window._playerChipsByEmail || {})[email] || [];
    const nickname = player?.nickname || email;
    const isMe = email === userEmail;
    if (titleEl) titleEl.textContent = isMe ? 'Your Chips' : `${nickname}'s Chips`;

    const toneStyle = {
        positive: 'bg-green-500/15 border-green-500/60 text-green-300',
        negative: 'bg-red-500/15 border-red-500/60 text-red-300',
        neutral: 'bg-sky-500/15 border-sky-500/60 text-sky-300'
    };
    const chipToneOrder = { positive: 0, neutral: 1, negative: 2 };
    const sortedChips = [...chips].sort((a, b) => (chipToneOrder[a.tone] ?? 1) - (chipToneOrder[b.tone] ?? 1));

    body.innerHTML = sortedChips.length === 0
        ? `<div class="text-gray-500 text-sm text-center py-12">No chips earned yet.<br><span class="text-[10px] text-gray-600 mt-1 block">Chips are awarded based on performance as the tournament progresses.</span></div>`
        : `<div class="space-y-2">${sortedChips.map((chip) => {
            const cls = toneStyle[chip.tone] || toneStyle.neutral;
            const circleCls = cls.includes('green') ? 'bg-green-100 border-green-600' : cls.includes('red') ? 'bg-red-100 border-red-600' : 'bg-sky-100 border-sky-600';
            return `<div class="rounded-xl border-2 px-4 py-3 flex items-center gap-3 ${cls}">
                <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-2xl ${circleCls}">${chip.emoji}</span>
                <div>
                    <div class="text-sm font-black">${escapeHtml(chip.label)}</div>
                    <div class="text-[11px] opacity-75 mt-0.5">${escapeHtml(chip.description)}</div>
                </div>
            </div>`;
        }).join('')}</div>`;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function _closeModalWithAnimation(modalId, onDone) {
    const modal = document.getElementById(modalId);
    if (!modal) { if (onDone) onDone(); return; }
    const card = modal.querySelector('.modal-card');
    const finish = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        if (card) card.classList.remove('modal-exiting');
        if (onDone) onDone();
    };
    if (card) {
        card.classList.add('modal-exiting');
        card.addEventListener('animationend', finish, { once: true });
    } else {
        finish();
    }
}

function closeProfileChipsPopup() {
    _closeModalWithAnimation('profile-chips-popup');
}

function closePlayerProfile() {
    closeChipPopover();
    _closeModalWithAnimation('player-profile-modal', () => closeProfileTeam());
}

function closeProfileTeam() {
    const container = document.getElementById('player-profile-container');
    const panel = document.getElementById('player-profile-team-panel');
    if (!container || !panel) return;
    panel.classList.add('hidden');
    panel.classList.remove('flex');
    container.classList.remove('profile-team-open');
}

async function showProfileTeam(teamName) {
    const container = document.getElementById('player-profile-container');
    const panel = document.getElementById('player-profile-team-panel');
    const content = document.getElementById('player-profile-team-content');
    if (!container || !panel || !content) return;

    panel.classList.remove('hidden');
    panel.classList.add('flex');
    container.classList.add('profile-team-open');

    const team = teams.find((t) => t.name === teamName);
    if (!team) {
        content.innerHTML = '<div class="p-8 text-center text-red-400 text-xs font-black uppercase">Team not found.</div>';
        return;
    }

    await fetchAdvancedTeams();

    const hasCachedData = window._matchesCache && window._picksCache;
    let matches, picks, totalPlayers;

    if (hasCachedData) {
        matches = window._matchesCache;
        picks = window._picksCache.map((p) => ({ user_email: p.user_email, team_name: p.team_name }));
        totalPlayers = window._profilesTotalCount || 0;
    } else {
        content.innerHTML = '<div class="p-8 text-center text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Loading...</div>';
        const [
            { data: matchData },
            { data: picksData },
            { data: profilesData }
        ] = await Promise.all([
            supabaseClient.from('matches').select('*').order('match_date_manual', { ascending: true }),
            supabaseClient.from('picks').select('user_email, team_name'),
            supabaseClient.from('profiles').select('email')
        ]);
        matches = matchData || [];
        picks = picksData || [];
        totalPlayers = new Set((profilesData || []).map((p) => p.email).filter(Boolean)).size;
    }

    const pickedSet = (picks || []).reduce((set, p) => { if (p.team_name === teamName) set.add(p.user_email); return set; }, new Set());
    const pickedCount = pickedSet.size;
    const pickedPct = totalPlayers > 0 ? Math.round(pickedCount / totalPlayers * 100) : 0;

    const teamBreakdownMap = buildTeamStageBreakdownMap(matches || [], teams, advancedTeams);
    const stageBreakdown = teamBreakdownMap[teamName] || { G1: 0, G2: 0, G3: 0, Bonus: 0, R32: 0, R16: 0, QF: 0, SM: 0, F: 0, total: 0 };

    const knockoutStageMap = { R32: 'R32', R16: 'R16', Quarters: 'QF', Semis: 'Semi', Finals: 'Final' };
    const teamMatches = (matches || [])
        .filter((m) => m.team_home === teamName || m.team_away === teamName)
        .sort((a, b) => (a.match_date_manual || '').localeCompare(b.match_date_manual || '') || (a.id || 0) - (b.id || 0));

    const matchesHtml = teamMatches.length > 0
        ? teamMatches.map((match) => {
            const isHome = match.team_home === teamName;
            const oppName = isHome ? match.team_away : match.team_home;
            const opp = teams.find((t) => t.name === oppName);
            const stageLabel = match.stage === 'Group' ? 'Group' : (knockoutStageMap[match.stage] || match.stage);
            const pts = getMatchPointsForTeam(match, teamName);
            const hasScore = _hasFinalScore(match);
            const myScore = hasScore ? (isHome ? match.score_home : match.score_away) : null;
            const oppScore = hasScore ? (isHome ? match.score_away : match.score_home) : null;
            const won = hasScore && myScore > oppScore;
            const drew = hasScore && myScore === oppScore;
            const resultColor = won ? 'text-green-400' : drew ? 'text-yellow-400' : 'text-gray-500';
            const resultLabel = hasScore ? (won ? 'W' : drew ? 'D' : 'L') : 'TBD';
            const scoreLabel = hasScore ? `${myScore}–${oppScore}` : 'TBD';
            return `
                <div class="rounded-xl border border-gray-700 bg-gray-800/50 px-3 py-2.5">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">${stageLabel}</span>
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-black ${resultColor}">${resultLabel}</span>
                            <span class="text-xs font-black text-white">${pts} pts</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 text-xs font-bold text-gray-200">
                        <span class="text-base">${team.flag}</span>
                        <span class="font-black">${scoreLabel}</span>
                        <span class="text-base">${opp?.flag || ''}</span>
                        <span class="truncate text-gray-400">${escapeHtml(oppName)}</span>
                    </div>
                </div>
            `;
        }).join('')
        : '<div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 py-2">No matches yet</div>';

    const isElim = eliminatedTeams.has(teamName);
    const isAdv = advancedTeams.has(teamName);
    const statusHtml = isElim
        ? '<span class="text-[9px] font-black uppercase tracking-[0.12em] px-2 py-0.5 rounded-full bg-red-900/40 text-red-400">Eliminated</span>'
        : isAdv
        ? '<span class="text-[9px] font-black uppercase tracking-[0.12em] px-2 py-0.5 rounded-full bg-green-900/40 text-green-400">Advanced</span>'
        : '';

    const stageRows = [
        { label: 'Group', pts: (stageBreakdown.G1 || 0) + (stageBreakdown.G2 || 0) + (stageBreakdown.G3 || 0) },
        { label: 'Bonus', pts: stageBreakdown.Bonus || 0 },
        { label: 'R32', pts: stageBreakdown.R32 || 0 },
        { label: 'R16', pts: stageBreakdown.R16 || 0 },
        { label: 'QF', pts: stageBreakdown.QF || 0 },
        { label: 'Semi', pts: stageBreakdown.SM || 0 },
        { label: 'Final', pts: stageBreakdown.F || 0 },
    ].map(({ label, pts }) => `
        <div class="text-center">
            <div class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">${label}</div>
            <div class="text-sm font-black text-white">${pts || '—'}</div>
        </div>
    `).join('');

    content.innerHTML = `
        <div class="p-5 space-y-4">
            <div class="flex items-center gap-3">
                <span class="text-4xl leading-none">${team.flag}</span>
                <div class="flex-1 min-w-0">
                    <div class="text-base font-black uppercase text-white truncate">${escapeHtml(team.name)}</div>
                    <div class="flex flex-wrap items-center gap-2 mt-0.5">
                        <span class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">T${team.tier} · $${team.cost} · Grp ${team.group}</span>
                        ${statusHtml}
                    </div>
                </div>
                <div class="text-right shrink-0">
                    <div class="text-2xl font-black text-white">${stageBreakdown.total}</div>
                    <div class="text-[10px] font-black uppercase text-gray-400">pts</div>
                </div>
            </div>

            <div class="rounded-2xl border border-gray-700 bg-gray-800/50 px-4 py-3">
                <div class="flex items-center justify-between mb-2.5">
                    <span class="text-[9px] font-black uppercase tracking-[0.25em] text-gray-500">Points by Stage</span>
                    <span class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">${pickedPct}% picked · ${pickedCount} players</span>
                </div>
                <div class="grid grid-cols-4 gap-x-2 gap-y-2">${stageRows}</div>
            </div>

            <div>
                <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Matches</div>
                <div class="space-y-2">${matchesHtml}</div>
            </div>
        </div>
    `;
}

let _pendingLeaderboardSelfScroll = false;

function toggleNameFilter() {
    const panel = document.getElementById('name-filter-panel');
    const btn = document.getElementById('name-filter-btn');
    if (!panel) return;
    const isOpen = !panel.classList.contains('hidden');
    if (isOpen) {
        closeNameFilter();
    } else {
        panel.classList.remove('hidden');
        panel.classList.add('open');
        const chevron = btn?.querySelector('.team-dropdown-chevron');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
        setTimeout(() => document.getElementById('name-filter-search')?.focus(), 50);
        setTimeout(() => {
            const handler = (e) => {
                if (!document.getElementById('leaderboard-name-filter')?.contains(e.target)) {
                    closeNameFilter();
                    document.removeEventListener('mousedown', handler);
                }
            };
            document.addEventListener('mousedown', handler);
        }, 0);
    }
}

function closeNameFilter() {
    const panel = document.getElementById('name-filter-panel');
    const btn = document.getElementById('name-filter-btn');
    if (!panel) return;
    panel.classList.add('hidden');
    panel.classList.remove('open');
    const chevron = btn?.querySelector('.team-dropdown-chevron');
    if (chevron) chevron.style.transform = '';
}

function setNameFilterState(email = '', label = '') {
    const wrap = document.getElementById('leaderboard-name-filter');
    const input = document.getElementById('leaderboard-name-filter-input');
    const labelEl = document.getElementById('name-filter-label');
    if (!wrap || !input || !labelEl) return false;
    wrap.dataset.value = email || '';
    input.value = email || '';
    labelEl.textContent = label || 'All Players';
    if (label) {
        labelEl.classList.remove('text-gray-400');
        labelEl.classList.add('text-gray-900', 'font-black');
    } else {
        labelEl.classList.add('text-gray-400');
        labelEl.classList.remove('text-gray-900', 'font-black');
    }
    return true;
}

function selectNameFilter(email, label) {
    if (!setNameFilterState(email, label)) return;
    const searchEl = document.getElementById('name-filter-search');
    if (searchEl) searchEl.value = '';
    closeNameFilter();
    fetchLeaderboard();
}

function filterNameDropdownOptions() {
    const search = (document.getElementById('name-filter-search')?.value || '').toLowerCase();
    document.querySelectorAll('#name-filter-list .name-filter-option').forEach((item) => {
        const text = item.dataset.searchText || '';
        item.hidden = search ? !text.includes(search) : false;
    });
}

function bindNameFilterList() {
    const list = document.getElementById('name-filter-list');
    if (!list || list.dataset.nameFilterBound === 'true') return;

    list.addEventListener('click', (event) => {
        if (!(event.target instanceof Element)) {
            return;
        }

        const optionButton = event.target.closest('[data-name-filter-email]');
        if (!optionButton || !list.contains(optionButton)) {
            return;
        }

        selectNameFilter(
            optionButton.dataset.nameFilterEmail || '',
            optionButton.dataset.nameFilterLabel || ''
        );
    });

    list.dataset.nameFilterBound = 'true';
}

function updateNameFilterOptions(leaderboardData) {
    const list = document.getElementById('name-filter-list');
    if (!list) return;
    bindNameFilterList();
    const currentValue = document.getElementById('leaderboard-name-filter')?.dataset?.value || '';
    const players = [...leaderboardData].sort((a, b) => (a.nickname || '').localeCompare(b.nickname || ''));

    const allIcon = '<span class="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700"><svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>';
    const allOption = `<button type="button" data-name-filter-email="" data-name-filter-label="" class="name-filter-option w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 ${!currentValue ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}" data-search-text="all players">${allIcon}<span>All Players</span></button>`;

    const playerOptions = players.map((user) => {
        const label = user.nickname || user.email.split('@')[0];
        const searchText = `${label} ${user.realname || ''} ${user.email || ''}`.toLowerCase();
        const isSelected = user.email === currentValue;
        const showFlag = !appSettings.hideTeamSelection && user.squad?.[0]?.flag;
        const flagEl = showFlag ? `<span>${user.squad[0].flag}</span>` : '';
        const gapClass = showFlag ? ' flex items-center gap-2' : '';
        return `<button type="button" data-name-filter-email="${escapeHtml(user.email)}" data-name-filter-label="${escapeHtml(label)}" class="name-filter-option w-full text-left px-4 py-2.5 text-sm font-bold${gapClass} ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}" data-search-text="${escapeHtml(searchText)}">${flagEl}<div class="min-w-0"><div class="truncate">${escapeHtml(label)}</div>${user.realname ? `<div class="text-[10px] text-gray-400">${escapeHtml(user.realname)}</div>` : ''}</div></button>`;
    });

    list.innerHTML = allOption + playerOptions.join('');
    const search = document.getElementById('name-filter-search')?.value;
    if (search) filterNameDropdownOptions();
}

function findCurrentLeaderboardRow() {
    if (!userEmail) return null;
    return Array.from(document.querySelectorAll('#leaderboard-body [data-leaderboard-email]'))
        .find((row) => row.dataset.leaderboardEmail === userEmail) || null;
}

function flashLeaderboardRow(row) {
    if (!row) return;
    row.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    row.classList.remove('leaderboard-self-highlight');
    void row.offsetWidth;
    row.classList.add('leaderboard-self-highlight');
    row.addEventListener('animationend', () => row.classList.remove('leaderboard-self-highlight'), { once: true });
}

function clearLeaderboardFiltersForSelfJump() {
    setNameFilterState('', '');
    const searchEl = document.getElementById('name-filter-search');
    if (searchEl) searchEl.value = '';
    closeNameFilter();

    if (typeof setTeamDropdownValue === 'function') {
        setTeamDropdownValue('leaderboard-country-filter', '', { silent: true });
    } else {
        const countryWrap = document.getElementById('leaderboard-country-filter');
        const countryInput = document.getElementById('leaderboard-country-filter-input');
        const countryLabel = document.getElementById('country-filter-label');
        if (countryWrap) countryWrap.dataset.value = '';
        if (countryInput) countryInput.value = '';
        if (countryLabel) {
            countryLabel.textContent = 'All Countries';
            countryLabel.classList.add('text-gray-400');
            countryLabel.classList.remove('text-gray-900');
        }
    }

    if (typeof closeCountryFilter === 'function') closeCountryFilter();
}

function resolvePendingLeaderboardSelfScroll() {
    if (!_pendingLeaderboardSelfScroll) return;
    _pendingLeaderboardSelfScroll = false;
    requestAnimationFrame(() => {
        const row = findCurrentLeaderboardRow();
        if (row) {
            flashLeaderboardRow(row);
        } else if (typeof showToast === 'function') {
            showToast('Could not find your leaderboard row.');
        }
    });
}

function scrollLeaderboardToSelf() {
    if (!userEmail) {
        if (typeof showToast === 'function') showToast('Sign in to jump to your leaderboard row.');
        return;
    }

    const row = findCurrentLeaderboardRow();
    if (row) {
        flashLeaderboardRow(row);
        return;
    }

    const nameFilter = document.getElementById('leaderboard-name-filter')?.dataset?.value || '';
    const countryFilter = document.getElementById('leaderboard-country-filter')?.dataset?.value || '';
    if (nameFilter || countryFilter) {
        _pendingLeaderboardSelfScroll = true;
        clearLeaderboardFiltersForSelfJump();
        fetchLeaderboard();
        return;
    }

    if (typeof showToast === 'function') showToast('Could not find your leaderboard row.');
}

function showR32SeatingInfo() {
    const modal = document.getElementById('r32-seating-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    const onEscape = (e) => { if (e.key === 'Escape') { closeR32SeatingInfo(); document.removeEventListener('keydown', onEscape); } };
    document.addEventListener('keydown', onEscape);
}

function closeR32SeatingInfo() {
    _closeModalWithAnimation('r32-seating-modal');
}

let _upsideRanked = [];
let _upsideSelectedEmail = '';

let _scoreRanked = [];
let _scoreSelectedEmail = '';
const SCORE_BEST_EMAIL = '__best_available__';
let _bestAvailableExplorerSelectedSignature = '';
let _bestAvailableExplorerView = 'explorer';
let _bestAvailableLabFocusEmail = '';
let _bestAvailableLabInfoOpen = false;
const DEFAULT_BEST_AVAILABLE_LAB_FILTERS = {
    minScore: '',
    maxScore: '',
    minCost: '',
    maxCost: '',
    requireTierOne: false,
    requireTierTwo: false,
    realisticOnly: true
};
let _bestAvailableLabFilters = { ...DEFAULT_BEST_AVAILABLE_LAB_FILTERS };
const ALL_LEGAL_LAB_FILTERS = {
    minScore: '',
    maxScore: '',
    minCost: '',
    maxCost: '',
    requireTierOne: false,
    requireTierTwo: false,
    realisticOnly: false
};
const DEFAULT_MY_POOL_LAB_FILTERS = { ...DEFAULT_BEST_AVAILABLE_LAB_FILTERS };
let _myPoolLabFilters = { ...DEFAULT_MY_POOL_LAB_FILTERS };
let _myPoolLabInfoOpen = false;
let _bestAvailableLabDataCache = new Map();
let _leaderboardSelfGlobalRankSnapshot = null;
let _leaderboardSelfGlobalRankRequestId = 0;

function showBestAvailableExplorer() {
    if (appSettings.hideTeamSelection) {
        if (typeof showToast === 'function') showToast('Team selections are currently hidden.');
        return;
    }

    const modal = document.getElementById('best-available-modal');
    const squads = window._bestAvailableSquads || [];
    if (!modal || squads.length === 0) {
        if (typeof showToast === 'function') showToast('Best available squads are still loading.');
        return;
    }

    if (!_bestAvailableExplorerSelectedSignature || !squads.some((squad) => squad.signature === _bestAvailableExplorerSelectedSignature)) {
        _bestAvailableExplorerSelectedSignature = squads[0].signature;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    _renderBestAvailableExplorerView();

    if (window._bestAvailableEscapeHandler) {
        document.removeEventListener('keydown', window._bestAvailableEscapeHandler);
    }

    window._bestAvailableEscapeHandler = (event) => {
        if (event.key === 'Escape') {
            closeBestAvailableExplorer();
        }
    };
    document.addEventListener('keydown', window._bestAvailableEscapeHandler);
}

function _setBestAvailableSidebarTitle(label) {
    const title = document.getElementById('best-available-sidebar-title');
    if (title) title.textContent = label;
}

function _renderBestAvailableExplorerView() {
    _bestAvailableExplorerView = 'explorer';
    _setBestAvailableSidebarTitle('Top squads');
    _renderBestAvailableRankStrip();
    _renderBestAvailableExplorerList();
    _renderBestAvailableExplorerDetail();
}

function _getSelectedBestAvailableSquad() {
    const squads = window._bestAvailableSquads || [];
    return squads.find((squad) => squad.signature === _bestAvailableExplorerSelectedSignature) || squads[0] || null;
}

function _bestAvailableRankPosition(rank, totalRanks) {
    const denominator = Math.max(1, totalRanks - 1);
    return Math.max(0, Math.min(100, ((Number(rank || 1) - 1) / denominator) * 100));
}

function _bestAvailableRankAlignClass(positionPct) {
    if (positionPct <= 2) return 'translate-x-0';
    if (positionPct >= 98) return '-translate-x-full';
    return '-translate-x-1/2';
}

function _formatBestAvailableInteger(value) {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'bigint') return value.toLocaleString();
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toLocaleString() : '-';
}

function _formatCompactBestAvailableNumber(value) {
    if (value === null || value === undefined) return '-';
    const parsed = typeof value === 'bigint' ? Number(value) : Number(value);
    if (!Number.isFinite(parsed)) return '-';
    const abs = Math.abs(parsed);
    const trim = (number) => String(number).replace(/\.0$/, '');
    if (abs >= 1_000_000_000) return `${trim((parsed / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 1 : 2))}B`;
    if (abs >= 1_000_000) return `${trim((parsed / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2))}M`;
    if (abs >= 100_000) return `${Math.round(parsed / 1_000)}K`;
    if (abs >= 10_000) return `${trim((parsed / 1_000).toFixed(1))}K`;
    return Math.round(parsed).toLocaleString();
}

function _formatBestAvailableRankRangeCompact(context) {
    if (!context?.legal && !context?.filteredLegal) return 'Not legal';
    if (Number(context.exactTopRank || 0) > 0) return `#${_formatCompactBestAvailableNumber(context.exactTopRank)}`;
    if (context.rankStart === null || context.rankStart === undefined) return '-';

    const start = _formatCompactBestAvailableNumber(context.rankStart);
    const end = _formatCompactBestAvailableNumber(context.rankEnd ?? context.rankStart);
    if (!_isBestAvailableRankRange(context)) return `#${start}`;
    return start === end ? `~#${end}` : `#${start}-${end}`;
}

function _formatBestAvailableRankMidpointNumber(value) {
    const parsed = typeof value === 'bigint' ? Number(value) : Number(value);
    if (!Number.isFinite(parsed)) return '-';
    const abs = Math.abs(parsed);
    if (abs >= 1_000_000_000) return `${(parsed / 1_000_000_000).toFixed(2)}B`;
    if (abs >= 1_000_000) return `${(parsed / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${(parsed / 1_000).toFixed(1)}K`;
    return Math.round(parsed).toLocaleString();
}

function _formatBestAvailableRankMidpointLabel(context) {
    if (!context?.legal && !context?.filteredLegal) return 'Not legal';
    if (Number(context.exactTopRank || 0) > 0) return `#${_formatCompactBestAvailableNumber(context.exactTopRank)}`;
    if (context.rankStart === null || context.rankStart === undefined) return '-';

    const start = Number(context.rankStart);
    const end = Number(context.rankEnd ?? context.rankStart);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return '-';
    if (start === end) return `#${_formatCompactBestAvailableNumber(start)}`;

    return `#${_formatBestAvailableRankMidpointNumber((start + end) / 2)}`;
}

function _bestAvailableLabCacheKey(filters = {}) {
    const normalized = {
        minScore: filters.minScore || '',
        maxScore: filters.maxScore || '',
        minCost: filters.minCost || '',
        maxCost: filters.maxCost || '',
        requireTierOne: Boolean(filters.requireTierOne),
        requireTierTwo: Boolean(filters.requireTierTwo),
        realisticOnly: Boolean(filters.realisticOnly)
    };
    return JSON.stringify(normalized);
}

function _clearBestAvailableLabDataCache() {
    _bestAvailableLabDataCache = new Map();
}

function _getCachedBestAvailableLabData(filters = DEFAULT_BEST_AVAILABLE_LAB_FILTERS) {
    const key = _bestAvailableLabCacheKey(filters);
    if (_bestAvailableLabDataCache.has(key)) {
        return _bestAvailableLabDataCache.get(key);
    }

    const data = buildBestAvailableFilteredSquadRankings(
        window._matchesCache || window._dashMatches || [],
        teams,
        advancedTeams,
        eliminatedTeams,
        _getBestAvailableLabEntries(),
        filters
    );
    _bestAvailableLabDataCache.set(key, data);
    return data;
}

function _getAllLegalSquadCount() {
    const contextCount = window._bestAvailablePoolContext?.totalLegalSquads
        || (window._bestAvailablePoolContexts || []).find((context) => context.totalLegalSquads)?.totalLegalSquads;
    if (contextCount) return contextCount;
    return _getCachedBestAvailableLabData(ALL_LEGAL_LAB_FILTERS).totalLegalSquads;
}

function _isBestAvailableRankRange(context) {
    return Boolean(context?.rankStart !== null && context?.rankEnd !== null && context.rankEnd > context.rankStart);
}

function _formatBestAvailableRankLabel(context) {
    if (!context?.legal) return 'Not legal';
    if (Number(context.exactTopRank || 0) > 0) return `#${Number(context.exactTopRank)}`;

    return _formatBestAvailableRankRangeCompact(context);
}

function _formatBestAvailablePercentile(context) {
    if (!context?.legal) return '';
    const total = Number(context.totalLegalSquads || 0);
    const rank = Number(context.exactTopRank || context.rankEnd || context.rankStart || 0);
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(rank) || rank <= 0) return '';

    const pct = Math.min(100, Math.max(0, (rank / total) * 100));
    const formatPct = (value) => {
        if (value < 0.01) return '<0.01%';
        if (value < 1) return `${value.toFixed(2)}%`;
        if (value < 10) return `${value.toFixed(1)}%`;
        return `${Math.round(value)}%`;
    };

    if (pct <= 50) return `Top ${formatPct(pct)}`;
    return `Bottom ${formatPct(100 - pct)}`;
}

function _getBestAvailableRealisticPoolContext() {
    const data = _getCachedBestAvailableLabData(DEFAULT_BEST_AVAILABLE_LAB_FILTERS);
    const context = [...(data.contexts || [])]
        .filter((candidate) => candidate.filteredLegal)
        .sort(compareBestAvailableLabContexts)[0] || null;

    if (!context) return null;

    const displayedSquad = (window._bestAvailableSquads || [])
        .find((squad) => squad.signature === context.signature);

    return {
        ...context,
        exactTopRank: null,
        shownInTopList: Boolean(displayedSquad),
        topListRank: displayedSquad?.rank || null,
        totalLegalSquads: data.totalLegalSquads
    };
}

function _renderBestAvailablePoolContextCard() {
    const context = _getBestAvailableRealisticPoolContext();
    if (!context) {
        return `<div class="mt-3 rounded-2xl border border-gray-800 bg-gray-950/55 px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">
            No real pool squads are available for this comparison yet.
        </div>`;
    }

    const safeEmail = escapeJsSingleQuoted(context.email || '');
    const playerName = context.nickname || context.realname || 'Best pool entry';
    const rankLabel = _formatBestAvailableRankRangeCompact({ ...context, legal: true, exactTopRank: null });
    const percentileLabel = _formatBestAvailablePercentile({ ...context, legal: true, exactTopRank: null });
    const totalLegal = _formatCompactBestAvailableNumber(context.totalLegalSquads);
    const locationLabel = context.shownInTopList
        ? `Shown in the top ${BEST_AVAILABLE_EXPLORER_LIMIT}`
        : `Outside the top ${BEST_AVAILABLE_EXPLORER_LIMIT}`;
    const poolRankLabel = Number(context.displayRank || 0) > 0 ? `Pool rank #${Number(context.displayRank)}` : 'Pool rank unavailable';
    const tieNote = _isBestAvailableRankRange(context)
        ? 'Range means other realistic squads are tied on points and cost.'
        : 'Realistic rank uses points first, then lower cost.';

    return `<button type="button" onclick="showBestAvailableLab('${safeEmail}')"
        class="mt-3 flex w-full flex-col gap-3 rounded-2xl border border-emerald-500/35 bg-emerald-950/35 px-3 py-3 text-left transition-colors hover:border-emerald-300/70 hover:bg-emerald-900/40 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-center gap-3">
            ${_renderPlayerAvatar(context.avatarUrl, context.favoriteTeam, 36, playerName)}
            <div class="min-w-0">
                <div class="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">Best real pool entry</div>
                <div class="truncate text-sm font-black text-white">${escapeHtml(playerName)}</div>
                <div class="mt-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-emerald-200/80">
                    ${poolRankLabel} &middot; ${Number(context.totalPoints || 0)} pts &middot; ${locationLabel}
                </div>
            </div>
        </div>
        <div class="shrink-0 rounded-xl border border-emerald-400/30 bg-gray-950/50 px-3 py-2 text-left sm:text-right">
            <div class="text-lg font-black text-emerald-200">${rankLabel}</div>
            ${percentileLabel ? `<div class="mt-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">${percentileLabel}</div>` : ''}
            <div class="text-[9px] font-black uppercase tracking-[0.12em] text-gray-400">of ${totalLegal} realistic squads</div>
            <div class="mt-1 text-[9px] font-bold text-gray-500">${tieNote}</div>
        </div>
    </button>`;
}

function _renderBestAvailableLabHeader() {
    const strip = document.getElementById('best-available-rank-strip');
    if (!strip) return;

    strip.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
                <div class="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-300">Best Available Lab</div>
                <div class="mt-1 text-[10px] font-bold leading-relaxed text-gray-400">
                    Showing realistic squads by default, with filters for the useful comparison set.
                </div>
            </div>
            <button type="button" onclick="showBestAvailableExplorerHome()"
                class="shrink-0 rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-gray-300 transition-colors hover:border-emerald-400 hover:text-emerald-200">
                Back to top 100
            </button>
        </div>
    `;
}

function _bestAvailableLabNumberInput(label, key, placeholder) {
    const value = _bestAvailableLabFilters[key] ?? '';
    return `<label class="block">
        <span class="text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">${label}</span>
        <input type="number" inputmode="numeric" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}"
            oninput="updateBestAvailableLabFilter('${key}', this.value)"
            class="mt-1 w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-sm font-black text-white outline-none transition-colors placeholder:text-gray-700 focus:border-emerald-500">
    </label>`;
}

function _bestAvailableLabCheckbox(label, key) {
    const checked = _bestAvailableLabFilters[key] ? 'checked' : '';
    return `<label class="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-950/55 px-3 py-2.5 transition-colors hover:border-gray-700">
        <span class="text-[10px] font-black uppercase tracking-[0.14em] text-gray-300">${label}</span>
        <input type="checkbox" ${checked} onchange="updateBestAvailableLabFilter('${key}', this.checked)" class="h-4 w-4 accent-emerald-500">
    </label>`;
}

function _renderBestAvailableLabControls() {
    const list = document.getElementById('best-available-list');
    if (!list) return;

    const infoMarkup = _bestAvailableLabInfoOpen ? `
        <div class="rounded-xl border border-emerald-500/25 bg-emerald-950/25 p-3 text-[10px] font-bold leading-relaxed text-emerald-100/80">
            There are about ${_formatCompactBestAvailableNumber(_getAllLegalSquadCount())} all-legal combinations. This lab uses realistic squads: $140-$150 spent, 3-5 Tier 3s, and then mostly Tier 2s. Squads can use 0 or 1 Tier 1; Tier-1 builds need at least two Tier 2s, and no-Tier-1 builds need at least four Tier 2s.
        </div>
    ` : '';

    list.innerHTML = `
        <div class="space-y-4 p-1">
            <div>
                <div class="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Points</div>
                <div class="grid grid-cols-2 gap-2">
                    ${_bestAvailableLabNumberInput('Min', 'minScore', 'Any')}
                    ${_bestAvailableLabNumberInput('Max', 'maxScore', 'Any')}
                </div>
            </div>
            <div>
                <div class="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Cost</div>
                <div class="grid grid-cols-2 gap-2">
                    ${_bestAvailableLabNumberInput('Min $', 'minCost', 'Any')}
                    ${_bestAvailableLabNumberInput('Max $', 'maxCost', '150')}
                </div>
            </div>
            <div class="space-y-2">
                ${_bestAvailableLabCheckbox('Require Tier 1', 'requireTierOne')}
                ${_bestAvailableLabCheckbox('Require Tier 2', 'requireTierTwo')}
            </div>
            <div class="space-y-2 rounded-2xl border border-gray-800 bg-gray-950/35 p-3">
                <div class="flex items-center justify-between gap-3">
                    <span class="text-[10px] font-black uppercase tracking-[0.14em] text-gray-200">Realistic squads only</span>
                    <button type="button" onclick="toggleBestAvailableLabInfo()"
                        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-700 text-[11px] font-black text-gray-400 transition-colors hover:border-emerald-400 hover:text-emerald-200"
                        aria-label="Explain realistic squads">
                        i
                    </button>
                </div>
                ${infoMarkup}
            </div>
            <button type="button" onclick="resetBestAvailableLabFilters()"
                class="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-gray-300 transition-colors hover:border-emerald-400 hover:text-emerald-200">
                Reset filters
            </button>
        </div>
    `;
}

function _getBestAvailableLabEntries() {
    return (window._leaderboardData || []).map((user) => ({
        email: user.email,
        nickname: user.nickname,
        realname: user.realname,
        avatarUrl: user.avatarUrl,
        favoriteTeam: user.favoriteTeam,
        displayRank: user.displayRank,
        leaderboardPoints: user.totalPoints,
        squad: user.squad || []
    }));
}

function _getBestAvailableLabData() {
    return _getCachedBestAvailableLabData(_bestAvailableLabFilters);
}

function compareBestAvailableLabContexts(a, b) {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    if (a.filteredLegal !== b.filteredLegal) return a.filteredLegal ? -1 : 1;
    if (a.filteredLegal && b.filteredLegal && a.rankStart !== b.rankStart) return a.rankStart < b.rankStart ? -1 : 1;
    if (a.totalPoints !== b.totalPoints) return b.totalPoints - a.totalPoints;
    if (a.totalCost !== b.totalCost) return a.totalCost - b.totalCost;
    const aPoolRank = Number(a.displayRank || Number.POSITIVE_INFINITY);
    const bPoolRank = Number(b.displayRank || Number.POSITIVE_INFINITY);
    if (aPoolRank !== bPoolRank) return aPoolRank - bPoolRank;
    return String(a.nickname || a.realname || '').localeCompare(String(b.nickname || b.realname || ''));
}

function _formatBestAvailableLabRankLabel(context) {
    if (!context?.filteredLegal) return 'Outside filter';
    return _formatBestAvailableRankRangeCompact({ ...context, legal: true });
}

function _formatBestAvailableLabPercentile(context) {
    if (!context?.filteredLegal) return '';
    return _formatBestAvailablePercentile({ ...context, legal: true });
}

function _renderBestAvailableLabContextCard(context, label = '') {
    if (!context) {
        return `<div class="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">No entry available.</div>`;
    }

    const playerName = context.nickname || context.realname || 'Pool entry';
    const rankLabel = _formatBestAvailableLabRankLabel(context);
    const percentileLabel = _formatBestAvailableLabPercentile(context);
    const totalLegal = _formatCompactBestAvailableNumber(context.totalLegalSquads);
    const reasonText = [...(context.invalidReasons || []), ...(context.filterReasons || [])].slice(0, 2).join(' · ');
    const statusClass = context.filteredLegal
        ? 'border-emerald-500/35 bg-emerald-950/25'
        : 'border-gray-800 bg-gray-950/45';
    const rankTone = context.filteredLegal ? 'text-emerald-200' : 'text-gray-400';
    const squadFlags = (context.squad || [])
        .sort((a, b) => (b.cost || 0) - (a.cost || 0) || a.name.localeCompare(b.name))
        .map((team) => `<span title="${escapeHtml(team.name)}" class="text-base leading-none ${team.eliminated ? 'opacity-35 grayscale' : ''}">${team.flag || ''}</span>`)
        .join('');

    return `<div class="rounded-2xl border ${statusClass} p-4">
        <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
                ${_renderPlayerAvatar(context.avatarUrl, context.favoriteTeam, 34, playerName)}
                <div class="min-w-0">
                    ${label ? `<div class="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-300">${escapeHtml(label)}</div>` : ''}
                    <div class="truncate text-sm font-black text-white">${escapeHtml(playerName)}</div>
                    <div class="mt-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-gray-500">
                        Pool #${Number(context.displayRank || 0) || '-'} &middot; ${Number(context.totalPoints || 0)} pts &middot; $${Number(context.totalCost || 0)}
                    </div>
                </div>
            </div>
            <div class="shrink-0 text-right">
                <div class="text-sm font-black ${rankTone}">${rankLabel}</div>
                ${percentileLabel ? `<div class="mt-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-300">${percentileLabel}</div>` : ''}
            </div>
        </div>
        <div class="mt-3 flex flex-wrap gap-1">${squadFlags}</div>
        <div class="mt-3 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-gray-500">
            <span>${Number(context.squadSize || 0)} teams</span>
            <span>T1 ${Number(context.tierOneCount || 0)}</span>
            <span>T2 ${Number(context.tierTwoCount || 0)}</span>
            <span>T3 ${Number(context.tierThreeCount || 0)}</span>
            ${context.filteredLegal ? `<span>of ${totalLegal}</span>` : ''}
        </div>
        ${reasonText ? `<div class="mt-3 rounded-xl border border-gray-800 bg-gray-950/55 px-3 py-2 text-[10px] font-bold leading-relaxed text-gray-400">${escapeHtml(reasonText)}</div>` : ''}
    </div>`;
}

function _renderBestAvailableLabMetric(label, value, subtext = '') {
    return `<div class="rounded-2xl border border-gray-800 bg-gray-950/45 p-4">
        <div class="text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">${escapeHtml(label)}</div>
        <div class="mt-2 text-xl font-black text-white">${escapeHtml(value)}</div>
        ${subtext ? `<div class="mt-1 text-[10px] font-bold leading-relaxed text-gray-500">${escapeHtml(subtext)}</div>` : ''}
    </div>`;
}

function _renderBestAvailableLabDetail() {
    const body = document.getElementById('best-available-detail');
    if (!body) return;

    const data = _getBestAvailableLabData();
    const contexts = data.contexts || [];
    const rankedContexts = contexts
        .filter((context) => context.filteredLegal)
        .sort(compareBestAvailableLabContexts);
    const topThree = rankedContexts.slice(0, 3);
    const bestReal = topThree[0] || null;
    const me = userEmail ? contexts.find((context) => context.email === userEmail) : null;
    const focused = _bestAvailableLabFocusEmail
        ? contexts.find((context) => context.email === _bestAvailableLabFocusEmail)
        : null;
    const showPinnedMe = me && !topThree.some((context) => context.email === me.email);
    const showFocused = focused && !topThree.some((context) => context.email === focused.email) && focused.email !== me?.email;
    const bestBucket = data.bestBucket || null;
    const totalLegalText = _formatCompactBestAvailableNumber(data.totalLegalSquads);
    const bestGeneratedValue = bestBucket ? `${Number(bestBucket.score || 0)} pts` : '-';
    const bestGeneratedSubtext = bestBucket
        ? `$${Number(bestBucket.cost || 0)} cost · ${Number(bestBucket.size || 0)} teams · ${_formatCompactBestAvailableNumber(bestBucket.count)} counted build${bestBucket.count === 1n ? '' : 's'} in this bucket`
        : 'No generated squads match the active filters.';
    const bestRealValue = bestReal ? _formatBestAvailableLabRankLabel(bestReal) : '-';
    const bestRealSubtext = bestReal
        ? `${bestReal.nickname || bestReal.realname || 'Pool entry'} · ${_formatBestAvailableLabPercentile(bestReal) || 'Percentile unavailable'}`
        : 'No real pool entry matches the active filters.';
    const meValue = me ? _formatBestAvailableLabRankLabel(me) : '-';
    const meSubtext = me
        ? (me.filteredLegal ? `${_formatBestAvailableLabPercentile(me) || 'Percentile unavailable'} · ${Number(me.totalPoints || 0)} pts` : [...(me.invalidReasons || []), ...(me.filterReasons || [])].slice(0, 1).join(''))
        : 'Current user not found in the loaded leaderboard.';

    body.innerHTML = `
        <div class="space-y-5">
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                ${_renderBestAvailableLabMetric('Filtered universe', totalLegalText, 'Generated legal squads after these filters.')}
                ${_renderBestAvailableLabMetric('Best generated', bestGeneratedValue, bestGeneratedSubtext)}
                ${_renderBestAvailableLabMetric('Best real entry', bestRealValue, bestRealSubtext)}
                ${_renderBestAvailableLabMetric('You', meValue, meSubtext)}
            </div>
            <div>
                <div class="mb-2 flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Top 3 pool entries under these filters</div>
                        <div class="mt-1 text-[10px] font-bold text-gray-500">Rank uses points first, then lower cost. Filters do not change anyone's score.</div>
                    </div>
                </div>
                <div class="grid gap-3 xl:grid-cols-3">
                    ${topThree.length > 0
                        ? topThree.map((context, index) => _renderBestAvailableLabContextCard(context, `Filtered #${index + 1}`)).join('')
                        : `<div class="xl:col-span-3 rounded-2xl border border-gray-800 bg-gray-950/45 p-5 text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">No real pool entries match the active filters.</div>`}
                </div>
            </div>
            ${showPinnedMe ? `<div>
                <div class="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Your entry</div>
                ${_renderBestAvailableLabContextCard(me, 'You')}
            </div>` : ''}
            ${showFocused ? `<div>
                <div class="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Opened entry</div>
                ${_renderBestAvailableLabContextCard(focused, 'Opened from explorer')}
            </div>` : ''}
        </div>
    `;
}

function showBestAvailableLab(focusEmail = '') {
    _bestAvailableExplorerView = 'lab';
    _bestAvailableLabFocusEmail = focusEmail || _bestAvailableLabFocusEmail || '';
    _setBestAvailableSidebarTitle('Lab filters');
    _renderBestAvailableLabHeader();
    _renderBestAvailableLabControls();
    _renderBestAvailableLabDetail();
}

function showBestAvailableExplorerHome() {
    _renderBestAvailableExplorerView();
}

function updateBestAvailableLabFilter(key, value) {
    if (!(key in _bestAvailableLabFilters)) return;
    _bestAvailableLabFilters[key] = typeof value === 'boolean' ? value : String(value || '');
    _bestAvailableLabFilters.realisticOnly = true;
    _renderBestAvailableLabDetail();
}

function resetBestAvailableLabFilters() {
    _bestAvailableLabFilters = { ...DEFAULT_BEST_AVAILABLE_LAB_FILTERS };
    _renderBestAvailableLabControls();
    _renderBestAvailableLabDetail();
}

function toggleBestAvailableLabInfo() {
    _bestAvailableLabInfoOpen = !_bestAvailableLabInfoOpen;
    _renderBestAvailableLabControls();
}

function _myPoolLabNumberInput(label, key, placeholder) {
    const value = _myPoolLabFilters[key] ?? '';
    return `<label class="block">
        <span class="text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">${escapeHtml(label)}</span>
        <input type="number" inputmode="numeric" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}"
            oninput="updateMyPoolLabFilter('${key}', this.value)"
            class="mt-1 w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-sm font-black text-white outline-none transition-colors placeholder:text-gray-700 focus:border-emerald-500">
    </label>`;
}

function _myPoolLabCheckbox(label, key) {
    const checked = _myPoolLabFilters[key] ? 'checked' : '';
    return `<label class="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-950/55 px-3 py-2.5 transition-colors hover:border-gray-700">
        <span class="text-[10px] font-black uppercase tracking-[0.14em] text-gray-300">${escapeHtml(label)}</span>
        <input type="checkbox" ${checked} onchange="updateMyPoolLabFilter('${key}', this.checked)" class="h-4 w-4 accent-emerald-500">
    </label>`;
}

function _renderMyPoolLabControls() {
    const body = document.getElementById('my-pool-lab-filters');
    if (!body) return;

    const infoMarkup = _myPoolLabInfoOpen ? `
        <div class="rounded-xl border border-emerald-500/25 bg-emerald-950/25 p-3 text-[10px] font-bold leading-relaxed text-emerald-100/80">
            ${_formatCompactBestAvailableNumber(_getAllLegalSquadCount())} all-legal combinations shrink to ${_formatCompactBestAvailableNumber(_getMyPoolLabData(DEFAULT_MY_POOL_LAB_FILTERS).totalLegalSquads)} realistic squads by removing low-spend and throwaway builds.
        </div>
    ` : '';

    body.innerHTML = `
        <div class="space-y-4">
            <div class="space-y-2 rounded-2xl border border-gray-800 bg-gray-950/35 p-3">
                <div class="flex items-center justify-between gap-3">
                    <span class="text-[10px] font-black uppercase tracking-[0.14em] text-gray-200">Realistic baseline</span>
                    <button type="button" onclick="toggleMyPoolLabInfo()"
                        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-700 text-[11px] font-black text-gray-400 transition-colors hover:border-emerald-400 hover:text-emerald-200"
                        aria-label="Explain realistic squad universe">i</button>
                </div>
                <div class="text-[10px] font-bold leading-relaxed text-gray-500">$140-$150 spend · 3-5 Tier 3s · 0-1 Tier 1 · rest mostly Tier 2s.</div>
                ${infoMarkup}
            </div>
            <div>
                <div class="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Points</div>
                <div class="grid grid-cols-2 gap-2">
                    ${_myPoolLabNumberInput('Min', 'minScore', 'Any')}
                    ${_myPoolLabNumberInput('Max', 'maxScore', 'Any')}
                </div>
            </div>
            <div>
                <div class="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Cost</div>
                <div class="grid grid-cols-2 gap-2">
                    ${_myPoolLabNumberInput('Min $', 'minCost', 'Any')}
                    ${_myPoolLabNumberInput('Max $', 'maxCost', '150')}
                </div>
            </div>
            <div class="space-y-2">
                ${_myPoolLabCheckbox('Require Tier 1', 'requireTierOne')}
                ${_myPoolLabCheckbox('Require Tier 2', 'requireTierTwo')}
            </div>
            <button type="button" onclick="resetMyPoolLabFilters()"
                class="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-gray-300 transition-colors hover:border-emerald-400 hover:text-emerald-200">
                Reset realistic filters
            </button>
            <button type="button" onclick="jumpToLeaderboardSelfFromLab()"
                class="w-full rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200 transition-colors hover:border-emerald-300 hover:bg-emerald-900/40">
                Jump to my row
            </button>
        </div>
    `;
}

function _getMyPoolLabStanding(entry) {
    const lb = window._leaderboardData || [];
    const topEntry = lb[0] || entry;
    const thirdEntry = lb[2] || null;
    const rank = Number(entry?.displayRank || 0);
    const pointsBehindFirst = Math.max(0, Number(topEntry?.totalPoints || 0) - Number(entry?.totalPoints || 0));
    const pointsToMoney = thirdEntry ? Math.max(0, Number(thirdEntry.totalPoints || 0) - Number(entry?.totalPoints || 0)) : 0;
    const rankDistanceToMoney = rank ? Math.max(0, rank - 3) : 0;
    const moneyLabel = rank && rank <= 3
        ? `${rank}${_ordinalSuffix(rank)} prize spot`
        : thirdEntry
            ? `${pointsToMoney} pts to 3rd / ${rankDistanceToMoney} rank${rankDistanceToMoney === 1 ? '' : 's'}`
            : 'Prize picture forming';
    return {
        rankLabel: rank ? `#${rank}` : '-',
        pointsLabel: Number(entry?.totalPoints || 0).toLocaleString(),
        behindLabel: pointsBehindFirst === 0 ? 'Tied for 1st' : `${pointsBehindFirst} behind 1st`,
        moneyLabel
    };
}

function _getMyPoolLabSquadRows(context) {
    const teamPointsMap = window._leaderboardTeamPointsMap || window._dashTeamPointsMap || buildTeamPointsMap(window._matchesCache || window._dashMatches || [], teams, advancedTeams);
    const squad = context?.squad || [];
    return squad.map((team) => {
        const points = Number(teamPointsMap[team.name] || 0);
        const cost = Number(team.cost || 0);
        return {
            ...team,
            points,
            pointsPerDollar: cost > 0 ? points / cost : 0,
            eliminated: Boolean(team.eliminated || eliminatedTeams.has(team.name))
        };
    });
}

function _renderMyPoolLabPickList(title, rows, emptyText) {
    return `<div class="rounded-2xl border border-gray-800 bg-gray-950/45 p-4">
        <div class="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">${escapeHtml(title)}</div>
        <div class="space-y-2">
            ${rows.length ? rows.map((team) => `
                <div class="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-2 ${team.eliminated ? 'opacity-65' : ''}">
                    <span class="shrink-0 text-lg leading-none">${team.flag || ''}</span>
                    <div class="min-w-0 flex-1">
                        <div class="truncate text-xs font-black uppercase text-white ${team.eliminated ? 'line-through' : ''}">${escapeHtml(team.name)}</div>
                        <div class="text-[9px] font-black uppercase tracking-[0.12em] text-gray-500">Tier ${Number(team.tier || 0)} · $${Number(team.cost || 0)} · ${team.eliminated ? 'eliminated' : 'live'}</div>
                    </div>
                    <div class="shrink-0 text-right">
                        <div class="text-xs font-black text-white">${Number(team.points || 0)} pts</div>
                        <div class="text-[9px] font-black uppercase text-gray-500">${team.pointsPerDollar.toFixed(2)} / $</div>
                    </div>
                </div>
            `).join('') : `<div class="rounded-xl border border-dashed border-gray-800 bg-gray-900/40 px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">${escapeHtml(emptyText)}</div>`}
        </div>
    </div>`;
}

function _renderMyPoolLabDetail() {
    const body = document.getElementById('my-pool-lab-body');
    if (!body) return;

    const data = _getMyPoolLabData(_myPoolLabFilters);
    const contexts = data.contexts || [];
    const myContext = userEmail ? contexts.find((context) => context.email === userEmail) : null;
    const rankedContexts = contexts
        .filter((context) => context.filteredLegal)
        .sort(compareBestAvailableLabContexts);
    const topThree = rankedContexts.slice(0, 3);
    const bestReal = topThree[0] || null;
    const bestBucket = data.bestBucket || null;

    if (!myContext) {
        body.innerHTML = '<div class="rounded-2xl border border-gray-800 bg-gray-950/45 p-5 text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">Your leaderboard entry is not loaded yet.</div>';
        return;
    }

    const standing = _getMyPoolLabStanding(myContext);
    const squadRows = _getMyPoolLabSquadRows(myContext);
    const totalCost = squadRows.reduce((sum, team) => sum + Number(team.cost || 0), 0);
    const liveTeams = squadRows.filter((team) => !team.eliminated);
    const eliminatedSpend = squadRows.filter((team) => team.eliminated).reduce((sum, team) => sum + Number(team.cost || 0), 0);
    const tierSummary = [1, 2, 3].map((tier) => `T${tier} ${squadRows.filter((team) => Number(team.tier) === tier).length}`).join(' · ');
    const reasonText = !myContext.filteredLegal
        ? [...(myContext.invalidReasons || []), ...(myContext.filterReasons || [])].slice(0, 2).join(' · ')
        : `${_formatBestAvailablePercentile({ ...myContext, legal: true })} among realistic squads`;
    const bestByPoints = [...squadRows].sort((a, b) => b.points - a.points || b.cost - a.cost || a.name.localeCompare(b.name)).slice(0, 3);
    const bestValue = [...squadRows].filter((team) => team.points > 0).sort((a, b) => b.pointsPerDollar - a.pointsPerDollar || b.points - a.points || a.name.localeCompare(b.name)).slice(0, 3);
    const flops = [...squadRows].sort((a, b) => Number(b.eliminated) - Number(a.eliminated) || a.pointsPerDollar - b.pointsPerDollar || b.cost - a.cost || a.name.localeCompare(b.name)).slice(0, 3);
    const showPinnedMe = !topThree.some((context) => context.email === myContext.email);

    body.innerHTML = `
        <div class="space-y-5">
            <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="flex min-w-0 items-center gap-3">
                    ${_renderPlayerAvatar(myContext.avatarUrl, myContext.favoriteTeam, 42, myContext.nickname)}
                    <div class="min-w-0">
                        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Your realistic universe rank</div>
                        <div class="mt-1 text-xl font-black uppercase italic text-white">${escapeHtml(myContext.nickname || myContext.realname || 'Your entry')}</div>
                        <div class="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">${standing.rankLabel} in pool · ${standing.pointsLabel} pts · $${totalCost} · ${tierSummary}</div>
                    </div>
                </div>
                <button type="button" onclick="jumpToLeaderboardSelfFromLab()"
                    class="rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-gray-300 transition-colors hover:border-emerald-400 hover:text-emerald-200">
                    Jump to row
                </button>
            </div>
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                ${_renderBestAvailableLabMetric('Realistic rank', myContext.filteredLegal ? _formatBestAvailableRankRangeCompact({ ...myContext, legal: true }) : 'Outside realistic', reasonText)}
                ${_renderBestAvailableLabMetric('Realistic universe', _formatCompactBestAvailableNumber(data.totalLegalSquads), `From ${_formatCompactBestAvailableNumber(_getAllLegalSquadCount())} all-legal combos`)}
                ${_renderBestAvailableLabMetric('Best generated', bestBucket ? `${Number(bestBucket.score || 0)} pts` : '-', bestBucket ? `$${Number(bestBucket.cost || 0)} cost · ${Number(bestBucket.size || 0)} teams` : 'No generated squads match')}
                ${_renderBestAvailableLabMetric('Prize picture', standing.moneyLabel, `${standing.behindLabel} · ${liveTeams.length} live teams · $${eliminatedSpend} eliminated`)}
            </div>
            <div>
                <div class="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Top 3 pool entries in this realistic set</div>
                <div class="grid gap-3 xl:grid-cols-3">
                    ${topThree.length ? topThree.map((context, index) => _renderBestAvailableLabContextCard(context, `Realistic #${index + 1}`)).join('') : `<div class="xl:col-span-3 rounded-2xl border border-gray-800 bg-gray-950/45 p-5 text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">No pool entries match these filters.</div>`}
                </div>
            </div>
            ${showPinnedMe ? `<div>
                <div class="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Your entry</div>
                ${_renderBestAvailableLabContextCard(myContext, 'You')}
            </div>` : ''}
            <div class="grid gap-3 xl:grid-cols-3">
                ${_renderMyPoolLabPickList('Best point picks', bestByPoints, 'No point-scoring picks yet.')}
                ${_renderMyPoolLabPickList('Best value picks', bestValue, 'No value picks yet.')}
                ${_renderMyPoolLabPickList('Flops so far', flops, 'No flops to show yet.')}
            </div>
            ${bestReal ? `<div class="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4 text-[10px] font-bold leading-relaxed text-emerald-100/80">
                Best real pool entry in this view: <span class="font-black text-white">${escapeHtml(bestReal.nickname || bestReal.realname || 'Pool entry')}</span>, ${_formatBestAvailableRankRangeCompact({ ...bestReal, legal: true })}.
            </div>` : ''}
        </div>
    `;
}

function showMyPoolLab() {
    if (!userEmail) {
        if (typeof showToast === 'function') showToast('Sign in to open your pool lab.');
        return;
    }

    const modal = document.getElementById('my-pool-lab-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    _renderMyPoolLabControls();
    _renderMyPoolLabDetail();

    if (window._myPoolLabEscapeHandler) {
        document.removeEventListener('keydown', window._myPoolLabEscapeHandler);
    }
    window._myPoolLabEscapeHandler = (event) => {
        if (event.key === 'Escape') closeMyPoolLab();
    };
    document.addEventListener('keydown', window._myPoolLabEscapeHandler);
}

function closeMyPoolLab() {
    const modal = document.getElementById('my-pool-lab-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    if (window._myPoolLabEscapeHandler) {
        document.removeEventListener('keydown', window._myPoolLabEscapeHandler);
        window._myPoolLabEscapeHandler = null;
    }
}

function updateMyPoolLabFilter(key, value) {
    if (!(key in _myPoolLabFilters)) return;
    _myPoolLabFilters[key] = typeof value === 'boolean' ? value : String(value || '');
    _myPoolLabFilters.realisticOnly = true;
    _renderMyPoolLabDetail();
}

function resetMyPoolLabFilters() {
    _myPoolLabFilters = { ...DEFAULT_MY_POOL_LAB_FILTERS };
    _renderMyPoolLabControls();
    _renderMyPoolLabDetail();
}

function toggleMyPoolLabInfo() {
    _myPoolLabInfoOpen = !_myPoolLabInfoOpen;
    _renderMyPoolLabControls();
}

function jumpToLeaderboardSelfFromLab() {
    closeMyPoolLab();
    scrollLeaderboardToSelf();
}

function _renderBestAvailableRankStrip() {
    const strip = document.getElementById('best-available-rank-strip');
    if (!strip) return;

    const squads = window._bestAvailableSquads || [];
    if (squads.length === 0) {
        strip.innerHTML = '';
        return;
    }

    const selected = _getSelectedBestAvailableSquad();
    const totalRanks = Math.max(BEST_AVAILABLE_EXPLORER_LIMIT, squads.length);
    const anchorRanks = [1, 25, 50, 75, 100].filter((rank) => rank <= squads.length);
    const matchedSquads = squads.filter((squad) => (squad.owners || []).length > 0);
    const exactOwnerCount = matchedSquads.reduce((sum, squad) => sum + (squad.owners || []).length, 0);
    const selectedPct = selected ? _bestAvailableRankPosition(selected.rank, totalRanks) : 0;

    const anchorMarkup = anchorRanks.map((rank) => {
        const squad = squads[rank - 1];
        const pct = _bestAvailableRankPosition(rank, totalRanks);
        const alignClass = _bestAvailableRankAlignClass(pct);
        const textAlignClass = pct <= 2 ? 'text-left' : pct >= 98 ? 'text-right' : 'text-center';
        const mobileHideClass = rank === 25 || rank === 75 ? 'hidden sm:block' : '';
        return `<div class="absolute top-7 ${alignClass} ${textAlignClass} ${mobileHideClass}" style="left:${pct}%">
            <div class="mx-auto h-3 w-px rounded-full bg-gray-600"></div>
            <div class="mt-2 whitespace-nowrap text-[9px] font-black uppercase tracking-[0.12em] text-gray-400">#${rank}</div>
            <div class="whitespace-nowrap text-[9px] font-black uppercase tracking-[0.08em] text-gray-600">${Number(squad?.totalPoints || 0)} pts</div>
        </div>`;
    }).join('');

    const selectedAlignClass = _bestAvailableRankAlignClass(selectedPct);
    const selectedMarkup = selected ? `<button type="button" onclick="selectBestAvailableSquad('${escapeJsSingleQuoted(selected.signature)}', { scrollList: true })"
        class="absolute top-[27px] z-10 h-4 w-4 ${selectedAlignClass} rounded-full border-2 border-emerald-200 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.55)]"
        style="left:${selectedPct}%"
        title="Selected rank #${selected.rank}, ${Number(selected.totalPoints || 0)} points">
        <span class="sr-only">Selected rank #${selected.rank}</span>
    </button>` : '';

    const markerMarkup = matchedSquads.map((squad) => {
        const owners = squad.owners || [];
        const pct = _bestAvailableRankPosition(squad.rank, totalRanks);
        const ownerNames = owners.map((owner) => owner.nickname || owner.realname || 'Player').join(', ');
        const safeSignature = escapeJsSingleQuoted(squad.signature);
        const title = escapeHtml(`#${squad.rank} · ${Number(squad.totalPoints || 0)} pts · ${ownerNames}`);
        const alignClass = _bestAvailableRankAlignClass(pct);
        return `<button type="button" onclick="selectBestAvailableSquad('${safeSignature}', { scrollList: true })"
            class="absolute top-0 z-20 flex ${alignClass} items-center gap-1 rounded-full border border-emerald-400/40 bg-gray-950/95 px-1.5 py-1 shadow-lg transition-colors hover:border-emerald-200 hover:bg-emerald-950"
            style="left:${pct}%"
            title="${title}">
            <span class="flex -space-x-1">
                ${owners.slice(0, 3).map((owner) => _renderPlayerAvatar(owner.avatarUrl, owner.favoriteTeam, 22, owner.nickname)).join('')}
            </span>
            <span class="whitespace-nowrap text-[9px] font-black uppercase tracking-[0.08em] text-emerald-200">${Number(squad.totalPoints || 0)}</span>
            ${owners.length > 3 ? `<span class="text-[9px] font-black text-emerald-300">+${owners.length - 3}</span>` : ''}
        </button>`;
    }).join('');

    strip.innerHTML = `
        <div class="flex items-center justify-between gap-4">
            <div class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Rank map</div>
            <div class="text-right text-[9px] font-black uppercase tracking-[0.14em] ${exactOwnerCount > 0 ? 'text-emerald-300' : 'text-gray-600'}">
                ${exactOwnerCount > 0 ? `${exactOwnerCount} exact player ${exactOwnerCount === 1 ? 'match' : 'matches'}` : `No player squads in top ${BEST_AVAILABLE_EXPLORER_LIMIT}`}
            </div>
        </div>
        <div class="mt-2 px-2 pb-1 sm:px-3">
            <div class="relative h-16 w-full sm:h-20">
                <div class="absolute left-0 right-0 top-9 h-1 rounded-full bg-gray-800"></div>
                <div class="absolute left-0 top-9 h-1 rounded-full bg-emerald-400/60" style="width:${selectedPct}%"></div>
                ${anchorMarkup}
                ${selectedMarkup}
                ${markerMarkup}
            </div>
        </div>
        ${_renderBestAvailablePoolContextCard()}
    `;
}

function _renderBestAvailableExplorerList() {
    const list = document.getElementById('best-available-list');
    if (!list) return;

    const squads = window._bestAvailableSquads || [];
    if (squads.length === 0) {
        list.innerHTML = '<div class="p-4 text-xs font-black uppercase tracking-[0.14em] text-gray-500">No legal squads found.</div>';
        return;
    }

    list.innerHTML = squads.map((squad, index) => {
        const isSelected = squad.signature === _bestAvailableExplorerSelectedSignature;
        const flags = (squad.squad || [])
            .map((team) => `<span class="text-sm leading-none">${team.flag || ''}</span>`)
            .join('');
        const owners = squad.owners || [];
        const ownerMarkup = owners.length > 0
            ? `<div class="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
                ${owners.slice(0, 2).map((owner) => `
                    <span class="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full bg-emerald-900/35 px-1.5 py-1 text-emerald-200">
                        ${_renderPlayerAvatar(owner.avatarUrl, owner.favoriteTeam, 20, owner.nickname)}
                        <span class="min-w-0 truncate text-[9px] font-black uppercase tracking-[0.1em]">${escapeHtml(owner.nickname || owner.realname || 'Player')}</span>
                    </span>
                `).join('')}
                ${owners.length > 2 ? `<span class="text-[9px] font-black uppercase tracking-[0.1em] text-emerald-300">+${owners.length - 2}</span>` : ''}
            </div>`
            : '<span class="text-gray-500">No exact pick</span>';

        return `<button type="button" data-best-signature="${escapeHtml(squad.signature || '')}" onclick="selectBestAvailableSquad(${index})"
            class="w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${isSelected ? 'border-emerald-500/70 bg-emerald-900/35' : 'border-gray-800 bg-gray-950/50 hover:border-gray-700 hover:bg-gray-800/70'}">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <div class="text-[11px] font-black uppercase tracking-[0.16em] ${isSelected ? 'text-emerald-200' : 'text-white'}">#${squad.rank}</div>
                    <div class="mt-1 flex max-w-full flex-wrap gap-1">${flags}</div>
                </div>
                <div class="shrink-0 text-right">
                    <div class="text-sm font-black ${isSelected ? 'text-emerald-200' : 'text-white'}">${Number(squad.totalPoints || 0)}</div>
                    <div class="text-[9px] font-black uppercase text-gray-500">pts</div>
                </div>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-black uppercase tracking-[0.12em]">
                <span class="text-gray-400">Cost $${Number(squad.totalCost || 0)} / $150</span>
                ${ownerMarkup}
            </div>
        </button>`;
    }).join('');
}

function _renderBestAvailableStageBuckets(breakdown = {}) {
    const groupPoints = (breakdown.G1 || 0) + (breakdown.G2 || 0) + (breakdown.G3 || 0);
    const buckets = [
        ['G', groupPoints],
        ['B', breakdown.Bonus || 0],
        ['R32', breakdown.R32 || 0],
        ['R16', breakdown.R16 || 0],
        ['QF', breakdown.QF || 0],
        ['SM', breakdown.SM || 0],
        ['F', breakdown.F || 0]
    ];

    return buckets
        .filter(([, points]) => points > 0)
        .map(([label, points]) => `<span class="rounded-full bg-gray-800 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-gray-300">${label} ${points}</span>`)
        .join('') || '<span class="rounded-full bg-gray-800 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-gray-500">No points yet</span>';
}

function _renderBestAvailableExplorerDetail() {
    const body = document.getElementById('best-available-detail');
    if (!body) return;

    const selected = _getSelectedBestAvailableSquad();
    if (!selected) {
        body.innerHTML = '<div class="p-6 text-xs font-black uppercase tracking-[0.14em] text-gray-500">Select a squad.</div>';
        return;
    }

    const teamPointsMap = window._leaderboardTeamPointsMap || window._dashTeamPointsMap || buildTeamPointsMap(window._matchesCache || window._dashMatches || [], teams, advancedTeams);
    const teamBreakdownMap = window._leaderboardTeamBreakdownMap || buildTeamStageBreakdownMap(window._matchesCache || window._dashMatches || [], teams, advancedTeams);
    const rows = [...(selected.squad || [])]
        .map((team) => ({
            ...team,
            points: teamPointsMap[team.name] || 0,
            breakdown: teamBreakdownMap[team.name] || {}
        }))
        .sort((a, b) => b.points - a.points || b.cost - a.cost || a.name.localeCompare(b.name));
    const maxPoints = Math.max(...rows.map((team) => team.points), 1);
    const totalCost = Number(selected.totalCost || rows.reduce((sum, team) => sum + (team.cost || 0), 0));
    const tierSummary = [1, 2, 3]
        .map((tier) => `T${tier}: ${rows.filter((team) => Number(team.tier) === tier).length}`)
        .join(' | ');
    const owners = selected.owners || [];
    const ownerMarkup = owners.length > 0
        ? owners.map((owner) => {
            const safeEmail = escapeJsSingleQuoted(owner.email);
            const rankLabel = owner.displayRank ? `Rank #${owner.displayRank}` : 'Unranked';
            return `<button type="button" onclick="closeBestAvailableExplorer();showPlayerProfile('${safeEmail}')"
                class="flex min-w-[170px] flex-1 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-900/20 px-3 py-2 text-left transition-colors hover:bg-emerald-900/35">
                ${_renderPlayerAvatar(owner.avatarUrl, owner.favoriteTeam, 30, owner.nickname)}
                <span class="min-w-0">
                    <span class="block truncate text-xs font-black text-emerald-100">${escapeHtml(owner.nickname || owner.realname || 'Player')}</span>
                    <span class="block text-[9px] font-black uppercase tracking-[0.12em] text-emerald-300/80">${rankLabel} &middot; ${Number(owner.totalPoints || 0)} pts</span>
                </span>
            </button>`;
        }).join('')
        : '<div class="rounded-xl border border-dashed border-gray-700 bg-gray-950/40 px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">No player has this exact squad.</div>';

    const teamRows = rows.map((team) => {
        const isEliminated = Boolean(team.eliminated || eliminatedTeams.has(team.name));
        const barPct = Math.min(100, Math.round((team.points / maxPoints) * 100));
        return `<div class="rounded-xl border border-gray-800 bg-gray-950/45 p-3 ${isEliminated ? 'opacity-60' : ''}">
            <div class="flex items-center gap-3">
                <span class="shrink-0 text-lg leading-none">${team.flag || ''}</span>
                <div class="min-w-0 flex-1">
                    <div class="truncate text-xs font-black uppercase text-white ${isEliminated ? 'line-through' : ''}">${escapeHtml(team.name)}</div>
                    <div class="text-[9px] font-black uppercase tracking-[0.12em] text-gray-500">Tier ${Number(team.tier || 0)} &middot; $${Number(team.cost || 0)} cost${isEliminated ? ' &middot; eliminated' : ''}</div>
                </div>
                <div class="shrink-0 text-right">
                    <div class="text-sm font-black text-white">${team.points}</div>
                    <div class="text-[9px] font-black uppercase text-gray-500">pts</div>
                </div>
            </div>
            <div class="mt-2 h-1 overflow-hidden rounded-full bg-gray-800">
                <div class="h-full rounded-full bg-emerald-400" style="width:${barPct}%"></div>
            </div>
            <div class="mt-2 flex flex-wrap gap-1.5">${_renderBestAvailableStageBuckets(team.breakdown)}</div>
        </div>`;
    }).join('');

    body.innerHTML = `
        <div class="space-y-5">
            <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="min-w-0">
                    <div class="text-lg font-black uppercase italic text-emerald-300">Best Available #${selected.rank}</div>
                    <div class="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">$${totalCost} / $150 cost &middot; ${rows.length} ${rows.length === 1 ? 'team' : 'teams'} &middot; ${tierSummary}</div>
                </div>
                <div class="shrink-0 text-right">
                    <div class="text-4xl font-black text-white">${Number(selected.totalPoints || 0)}</div>
                    <div class="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">points</div>
                </div>
            </div>
            <div>
                <div class="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Exact Player Match</div>
                <div class="flex flex-wrap gap-2">${ownerMarkup}</div>
            </div>
            <div>
                <div class="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Team Breakdown</div>
                <div class="grid grid-cols-1 gap-2.5 lg:grid-cols-2">${teamRows}</div>
            </div>
        </div>`;
}

function _scrollBestAvailableListToSignature(signature) {
    const list = document.getElementById('best-available-list');
    if (!list || !signature) return;
    const target = Array.from(list.querySelectorAll('[data-best-signature]'))
        .find((element) => element.dataset.bestSignature === signature);
    if (!target) return;
    target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
}

function selectBestAvailableSquad(indexOrSignature, options = {}) {
    const squads = window._bestAvailableSquads || [];
    const selected = typeof indexOrSignature === 'number'
        ? squads[indexOrSignature]
        : squads.find((squad) => squad.signature === indexOrSignature);
    if (!selected) return;

    _bestAvailableExplorerView = 'explorer';
    _setBestAvailableSidebarTitle('Top squads');
    _bestAvailableExplorerSelectedSignature = selected.signature;
    _renderBestAvailableRankStrip();
    _renderBestAvailableExplorerList();
    _renderBestAvailableExplorerDetail();
    if (options?.scrollList) {
        window.requestAnimationFrame(() => _scrollBestAvailableListToSignature(selected.signature));
    }
}

function closeBestAvailableExplorer() {
    const modal = document.getElementById('best-available-modal');
    if (!modal) return;

    modal.classList.add('hidden');
    modal.classList.remove('flex');
    if (window._bestAvailableEscapeHandler) {
        document.removeEventListener('keydown', window._bestAvailableEscapeHandler);
        window._bestAvailableEscapeHandler = null;
    }
}

function showMyScoreCard() {
    const modal = document.getElementById('score-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const lb = window._leaderboardData || [];
    _scoreRanked = [...lb].sort((a, b) => b.totalPoints - a.totalPoints || (a.nickname || '').localeCompare(b.nickname || ''));
    _scoreSelectedEmail = userEmail;
    _renderScoreSidebar();
    _renderScoreDetail(userEmail);
}

function _renderScoreSidebar() {
    const sidebar = document.getElementById('score-sidebar');
    if (!sidebar) return;
    const best = window._dashBestAvailableTeam;
    const bestRow = best && Array.isArray(best.squad) && best.squad.length > 0 && !appSettings.hideTeamSelection
        ? (() => {
            const isSelected = _scoreSelectedEmail === SCORE_BEST_EMAIL;
            return `<button data-email="${SCORE_BEST_EMAIL}" onclick="selectScorePlayer('${SCORE_BEST_EMAIL}')"
                class="w-full text-left rounded-xl px-3 py-2 transition-colors relative overflow-hidden border border-dashed border-emerald-500/60 ${isSelected ? 'bg-emerald-900/40' : 'hover:bg-emerald-900/20'}">
                <div class="absolute left-0 top-0 bottom-0 w-[3px]" style="background-color:#10b981;"></div>
                <div class="pl-2 text-[11px] font-black text-emerald-300 truncate uppercase tracking-[0.12em]">Best Available</div>
                <div class="pl-2 text-[11px] text-emerald-400/80">${best.totalPoints} pts · benchmark</div>
            </button>`;
        })()
        : '';
    const playerRows = _scoreRanked.map((u, i) => {
        const isMe = u.email === userEmail;
        const isSelected = u.email === _scoreSelectedEmail;
        const barColor = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#f97316' : isMe ? '#3b82f6' : '#4b5563';
        const safeEmail = u.email.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `<button data-email="${escapeHtml(u.email)}" onclick="selectScorePlayer('${safeEmail}')"
            class="w-full text-left rounded-xl px-3 py-2 transition-colors relative ${isSelected ? 'bg-gray-700' : 'hover:bg-gray-800'}">
            <div class="absolute left-0 top-0 bottom-0 w-[3px]" style="background-color:${barColor};"></div>
            <div class="pl-2 flex items-center gap-2">
                ${_renderPlayerAvatar(u.avatarUrl, u.favoriteTeam, 28, u.nickname)}
                <div class="flex-1 min-w-0">
                    <div class="text-[11px] font-black text-white truncate">${isMe ? '★ ' + escapeHtml(u.nickname) : escapeHtml(u.nickname)}</div>
                    <div class="text-[11px] text-gray-400">${u.totalPoints} pts</div>
                </div>
            </div>
        </button>`;
    }).join('');
    sidebar.innerHTML = bestRow + playerRows;
}

function selectScorePlayer(email) {
    _scoreSelectedEmail = email;
    _renderScoreSidebar();
    _renderScoreDetail(email);
    closeScoreDrawer();
}

function openScoreDrawer() {
    const sidebar = document.getElementById('score-sidebar');
    const bg = document.getElementById('score-drawer-bg');
    if (sidebar) sidebar.classList.remove('-translate-x-full');
    if (bg) bg.classList.remove('hidden');
}

function closeScoreDrawer() {
    const sidebar = document.getElementById('score-sidebar');
    const bg = document.getElementById('score-drawer-bg');
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (bg) bg.classList.add('hidden');
}

function _renderScoreDetail(email) {
    const body = document.getElementById('score-modal-body');
    if (!body) return;
    const teamPointsMap = window._dashTeamPointsMap || {};

    const teamRow = (t, pts, maxPts) => {
        const elim = eliminatedTeams.has(t.name);
        const barPct = Math.min(100, Math.round(pts / maxPts * 100));
        return `<div class="flex items-center gap-3 ${elim ? 'opacity-60' : ''}">
            <span class="text-lg leading-none shrink-0">${t.flag || ''}</span>
            <div class="flex-1 min-w-0">
                <div class="text-xs font-black uppercase ${elim ? 'text-gray-400 line-through' : 'text-white'} truncate">${escapeHtml(t.name)}</div>
                <div class="mt-1 h-1 rounded-full bg-gray-700 overflow-hidden"><div class="h-full rounded-full" style="width:${barPct}%; background: linear-gradient(90deg, #3b82f6, #93c5fd);"></div></div>
            </div>
            <div class="shrink-0 text-right">
                <div class="text-xs font-black text-white">${pts}</div>
                <div class="text-[9px] font-black uppercase text-gray-500">${elim ? 'eliminated' : 'pts'}</div>
            </div>
        </div>`;
    };

    if (email === SCORE_BEST_EMAIL) {
        if (appSettings.hideTeamSelection) { _renderScoreDetail(userEmail); return; }
        const best = window._dashBestAvailableTeam;
        if (!best) return;
        const rows = [...(best.squad || [])]
            .map((t) => ({ ...t, pts: teamPointsMap[t.name] || 0 }))
            .sort((a, b) => b.pts - a.pts);
        const maxPts = Math.max(...rows.map((r) => r.pts), 1);
        const totalCost = (best.squad || []).reduce((s, t) => s + (t.cost || 0), 0);
        body.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <div class="text-base font-black uppercase italic text-emerald-300">Best Available Squad</div>
                        <div class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 mt-0.5 leading-relaxed">
                            Highest-scoring legal squad to date — the ceiling everyone is chasing.
                        </div>
                        <div class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500 mt-1">
                            $${totalCost} / $150 cost · ${rows.length} ${rows.length === 1 ? 'team' : 'teams'}
                        </div>
                    </div>
                    <div class="text-right shrink-0">
                        <div class="text-4xl font-black text-emerald-300">${best.totalPoints}</div>
                        <div class="text-[10px] font-black uppercase text-gray-400">pts</div>
                    </div>
                </div>
                <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Optimal Lineup</div>
                <div class="space-y-3">${rows.map((r) => teamRow(r, r.pts, maxPts)).join('')}</div>
            </div>`;
        return;
    }

    const u = _scoreRanked.find((e) => e.email === email);
    if (!u) return;
    const isMe = email === userEmail;
    const squad = u.squad || [];
    const rank = _scoreRanked.findIndex((e) => e.email === email) + 1;
    const totalPoints = u.totalPoints ?? 0;

    const rows = [...squad]
        .map((t) => ({ ...t, pts: teamPointsMap[t.name] || 0 }))
        .sort((a, b) => b.pts - a.pts);
    const maxPts = Math.max(...rows.map((r) => r.pts), 1);

    body.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <div class="text-base font-black uppercase italic text-white">${isMe ? 'Your Score' : escapeHtml(u.nickname)}</div>
                    <div class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 mt-0.5 leading-relaxed">
                        Rank #${rank} of ${_scoreRanked.length} · points contributed by each team.
                    </div>
                </div>
                <div class="text-right shrink-0">
                    <div class="text-4xl font-black text-white">${totalPoints}</div>
                    <div class="text-[10px] font-black uppercase text-gray-400">pts</div>
                </div>
            </div>
            <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Squad Breakdown</div>
            <div class="space-y-3">${rows.map((r) => teamRow(r, r.pts, maxPts)).join('')}</div>
        </div>`;
}

function closeScoreModal() {
    const modal = document.getElementById('score-modal');
    if (!modal) return;
    closeScoreDrawer();
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

const UPSIDE_BEST_EMAIL = '__best_possible__';

function showMyUpsideCard() {
    if (appSettings.hideTeamSelection) return;
    const modal = document.getElementById('upside-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const lb = window._leaderboardData || [];
    const upsideMap = window._poolUpsideMap || _buildUpsideMap(lb);
    _upsideRanked = [...lb]
        .map((e) => ({ ...e, upside: upsideMap.get(e.email) ?? 0 }))
        .sort((a, b) => b.upside - a.upside || b.totalPoints - a.totalPoints);

    _upsideSelectedEmail = userEmail;
    _renderUpsideSidebar();
    _renderUpsideDetail(userEmail);
}

function _renderUpsideSidebar() {
    const sidebar = document.getElementById('upside-sidebar');
    if (!sidebar) return;
    const bestSquad = window._poolBestUpsideSquad || [];
    const bestRow = bestSquad.length > 0
        ? (() => {
            const isSelected = _upsideSelectedEmail === UPSIDE_BEST_EMAIL;
            return `<button data-email="${UPSIDE_BEST_EMAIL}" onclick="selectUpsidePlayer('${UPSIDE_BEST_EMAIL}')"
                class="w-full text-left rounded-xl px-3 py-2 transition-colors relative overflow-hidden border border-dashed border-emerald-500/60 ${isSelected ? 'bg-emerald-900/40' : 'hover:bg-emerald-900/20'}">
                <div class="absolute left-0 top-0 bottom-0 w-[3px]" style="background-color:#10b981;"></div>
                <div class="pl-2 text-[11px] font-black text-emerald-300 truncate uppercase tracking-[0.12em]">Best Possible</div>
                <div class="pl-2 text-[11px] text-emerald-400/80">100 / 100 · benchmark</div>
            </button>`;
        })()
        : '';
    const playerRows = _upsideRanked.map((u, i) => {
        const isMe = u.email === userEmail;
        const isSelected = u.email === _upsideSelectedEmail;
        const barColor = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#f97316' : isMe ? '#3b82f6' : '#4b5563';
        const safeEmail = u.email.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `<button data-email="${escapeHtml(u.email)}" onclick="selectUpsidePlayer('${safeEmail}')"
            class="w-full text-left rounded-xl px-3 py-2 transition-colors relative ${isSelected ? 'bg-gray-700' : 'hover:bg-gray-800'}">
            <div class="absolute left-0 top-0 bottom-0 w-[3px]" style="background-color:${barColor};"></div>
            <div class="pl-2 flex items-center gap-2">
                ${_renderPlayerAvatar(u.avatarUrl, u.favoriteTeam, 28, u.nickname)}
                <div class="flex-1 min-w-0">
                    <div class="text-[11px] font-black text-white truncate">${isMe ? '★ ' + escapeHtml(u.nickname) : escapeHtml(u.nickname)}</div>
                    <div class="text-[11px] text-gray-400">${u.upside} / 100</div>
                </div>
            </div>
        </button>`;
    }).join('');
    sidebar.innerHTML = bestRow + playerRows;
}

function selectUpsidePlayer(email) {
    _upsideSelectedEmail = email;
    _renderUpsideSidebar();
    _renderUpsideDetail(email);
    closeUpsideDrawer();
}

function openUpsideDrawer() {
    const sidebar = document.getElementById('upside-sidebar');
    const bg = document.getElementById('upside-drawer-bg');
    if (sidebar) sidebar.classList.remove('-translate-x-full');
    if (bg) bg.classList.remove('hidden');
}

function closeUpsideDrawer() {
    const sidebar = document.getElementById('upside-sidebar');
    const bg = document.getElementById('upside-drawer-bg');
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (bg) bg.classList.add('hidden');
}

function _renderUpsideDetail(email) {
    const body = document.getElementById('upside-modal-body');
    if (!body) return;

    const adjustedMap = _buildAdjustedWinProbMap();

    const teamRow = (t, dim, maxProb) => {
        const orig = TEAM_REPORT_DATA[t.name]?.winProb || 0;
        const adj = adjustedMap.get(t.name) ?? orig;
        const barPct = Math.min(100, Math.round(adj / maxProb * 100));
        const shifted = Math.abs(adj - orig) >= 0.05;
        return `<div class="flex items-center gap-3 ${dim ? 'opacity-35' : ''}">
            <span class="text-lg leading-none shrink-0">${t.flag || ''}</span>
            <div class="flex-1 min-w-0">
                <div class="text-xs font-black uppercase text-white truncate">${escapeHtml(t.name)}</div>
                ${!dim ? `<div class="mt-1 h-1 rounded-full bg-gray-700 overflow-hidden"><div class="h-full rounded-full" style="width:${barPct}%; background: linear-gradient(90deg, #3b82f6, #93c5fd);"></div></div>` : ''}
            </div>
            <div class="shrink-0 text-right">
                ${!dim ? `<div class="text-xs font-black text-white">${adj.toFixed(1)}%</div>${shifted ? `<div class="text-[9px] font-black uppercase text-emerald-400/80">was ${orig.toFixed(1)}%</div>` : ''}<div class="text-[9px] font-black uppercase text-gray-500">win odds</div>` : `<div class="text-xs font-black text-gray-400 line-through">${orig.toFixed(1)}%</div><div class="text-[9px] font-black uppercase text-gray-500">eliminated</div>`}
            </div>
        </div>`;
    };

    if (email === UPSIDE_BEST_EMAIL) {
        const squad = window._poolBestUpsideSquad || [];
        const sorted = [...squad].sort((a, b) => (adjustedMap.get(b.name) ?? b.winProb ?? 0) - (adjustedMap.get(a.name) ?? a.winProb ?? 0));
        const maxProb = Math.max(...sorted.map((t) => adjustedMap.get(t.name) ?? t.winProb ?? 0), 0.001);
        const totalCost = squad.reduce((s, t) => s + (t.cost || 0), 0);
        body.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <div class="text-base font-black uppercase italic text-emerald-300">Best Possible Squad</div>
                        <div class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 mt-0.5 leading-relaxed">
                            The highest-upside legal squad under pool rules — the benchmark everyone is scored against.
                        </div>
                        <div class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500 mt-1">
                            $${totalCost} / $150 cost · ${sorted.length} ${sorted.length === 1 ? 'team' : 'teams'}
                        </div>
                    </div>
                    <div class="text-right shrink-0">
                        <div class="text-4xl font-black text-emerald-300">100</div>
                        <div class="text-[10px] font-black uppercase text-gray-400">/ 100</div>
                    </div>
                </div>
                <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Optimal Lineup</div>
                <div class="space-y-3">${sorted.map((t) => teamRow(t, false, maxProb)).join('')}</div>
            </div>`;
        return;
    }

    const u = _upsideRanked.find((e) => e.email === email);
    if (!u) return;
    const isMe = email === userEmail;
    const upsideMap = window._poolUpsideMap || _buildUpsideMap(window._leaderboardData || []);
    const upside = upsideMap.get(email) ?? 0;
    const squad = u.squad || [];
    const aliveTeams = squad
        .filter((t) => !eliminatedTeams.has(t.name))
        .sort((a, b) => (adjustedMap.get(b.name) ?? 0) - (adjustedMap.get(a.name) ?? 0));
    const elimTeams = squad.filter((t) => eliminatedTeams.has(t.name));
    const maxProb = Math.max(...aliveTeams.map((t) => adjustedMap.get(t.name) ?? 0), 0.001);
    body.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <div class="text-base font-black uppercase italic text-white">${isMe ? 'Your Upside' : escapeHtml(u.nickname)}</div>
                    <div class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 mt-0.5 leading-relaxed">
                        ${isMe ? 'Combined win odds of your surviving teams vs the best legal squad.' : 'Combined win odds of surviving teams vs the best legal squad.'}
                    </div>
                </div>
                <div class="text-right shrink-0">
                    <div class="text-4xl font-black text-white">${upside}</div>
                    <div class="text-[10px] font-black uppercase text-gray-400">/ 100</div>
                </div>
            </div>
            ${aliveTeams.length > 0 ? `<div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Still Alive</div><div class="space-y-3">${aliveTeams.map((t) => teamRow(t, false, maxProb)).join('')}</div>` : ''}
            ${elimTeams.length > 0 ? `<div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mt-4 mb-3">Eliminated</div><div class="space-y-3">${elimTeams.map((t) => teamRow(t, true, maxProb)).join('')}</div>` : ''}
        </div>`;
}

function closeUpsideModal() {
    const modal = document.getElementById('upside-modal');
    if (!modal) return;
    closeUpsideDrawer();
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function showDashTeamStats(teamName) {
    const modal = document.getElementById('team-owners-modal');
    const headerEl = document.getElementById('team-owners-header');
    const listEl = document.getElementById('team-owners-list');
    if (!modal || !headerEl || !listEl) return;

    const team = teams.find((t) => t.name === teamName);
    if (!team) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    headerEl.innerHTML = `<div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 animate-pulse">Loading…</div>`;
    listEl.innerHTML = '';

    await fetchAdvancedTeams();

    const hasCachedData = window._matchesCache && window._picksCache;
    let matches, picks, totalPlayers;
    if (hasCachedData) {
        matches = window._matchesCache;
        picks = window._picksCache.map((p) => ({ user_email: p.user_email, team_name: p.team_name }));
        totalPlayers = window._profilesTotalCount || 0;
    } else {
        const [{ data: matchData }, { data: picksData }, { data: profilesData }] = await Promise.all([
            supabaseClient.from('matches').select('*').order('match_date_manual', { ascending: true }),
            supabaseClient.from('picks').select('user_email, team_name'),
            supabaseClient.from('profiles').select('email')
        ]);
        matches = matchData || [];
        picks = picksData || [];
        totalPlayers = new Set((profilesData || []).map((p) => p.email).filter(Boolean)).size;
    }

    const pickedSet = (picks || []).reduce((set, p) => { if (p.team_name === teamName) set.add(p.user_email); return set; }, new Set());
    const pickedCount = pickedSet.size;
    const pickedPct = totalPlayers > 0 ? Math.round(pickedCount / totalPlayers * 100) : 0;
    const teamBreakdownMap = buildTeamStageBreakdownMap(matches || [], teams, advancedTeams);
    const stageBreakdown = teamBreakdownMap[teamName] || { G1: 0, G2: 0, G3: 0, Bonus: 0, R32: 0, R16: 0, QF: 0, SM: 0, F: 0, total: 0 };
    const knockoutStageMap = { R32: 'R32', R16: 'R16', Quarters: 'QF', Semis: 'Semi', Finals: 'Final' };
    const teamMatches = (matches || [])
        .filter((m) => m.team_home === teamName || m.team_away === teamName)
        .sort((a, b) => (a.match_date_manual || '').localeCompare(b.match_date_manual || '') || (a.id || 0) - (b.id || 0));

    const matchesHtml = teamMatches.length > 0
        ? teamMatches.map((match) => {
            const isHome = match.team_home === teamName;
            const oppName = isHome ? match.team_away : match.team_home;
            const opp = teams.find((t) => t.name === oppName);
            const stageLabel = match.stage === 'Group' ? 'Group' : (knockoutStageMap[match.stage] || match.stage);
            const pts = getMatchPointsForTeam(match, teamName);
            const hasScore = _hasFinalScore(match);
            const myScore = hasScore ? (isHome ? match.score_home : match.score_away) : null;
            const oppScore = hasScore ? (isHome ? match.score_away : match.score_home) : null;
            const won = hasScore && myScore > oppScore;
            const drew = hasScore && myScore === oppScore;
            const resultColor = won ? 'text-green-400' : drew ? 'text-yellow-400' : 'text-gray-500';
            const resultLabel = hasScore ? (won ? 'W' : drew ? 'D' : 'L') : 'TBD';
            const scoreLabel = hasScore ? `${myScore}–${oppScore}` : 'TBD';
            return `
                <div class="rounded-xl border border-gray-700 bg-gray-800/50 px-3 py-2.5">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">${stageLabel}</span>
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-black ${resultColor}">${resultLabel}</span>
                            <span class="text-xs font-black text-white">${pts} pts</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 text-xs font-bold text-gray-200">
                        <span class="text-base">${team.flag}</span>
                        <span class="font-black">${scoreLabel}</span>
                        <span class="text-base">${opp?.flag || ''}</span>
                        <span class="truncate text-gray-400">${escapeHtml(oppName)}</span>
                    </div>
                </div>`;
        }).join('')
        : '<div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 py-2">No matches yet</div>';

    const isElim = eliminatedTeams.has(teamName);
    const isAdv = advancedTeams.has(teamName);
    const statusHtml = isElim
        ? '<span class="text-[9px] font-black uppercase tracking-[0.12em] px-2 py-0.5 rounded-full bg-red-900/40 text-red-400">Eliminated</span>'
        : isAdv ? '<span class="text-[9px] font-black uppercase tracking-[0.12em] px-2 py-0.5 rounded-full bg-green-900/40 text-green-400">Advanced</span>'
        : '';

    const stageRows = [
        { label: 'Group', pts: (stageBreakdown.G1 || 0) + (stageBreakdown.G2 || 0) + (stageBreakdown.G3 || 0) },
        { label: 'Bonus', pts: stageBreakdown.Bonus || 0 },
        { label: 'R32', pts: stageBreakdown.R32 || 0 },
        { label: 'R16', pts: stageBreakdown.R16 || 0 },
        { label: 'QF', pts: stageBreakdown.QF || 0 },
        { label: 'Semi', pts: stageBreakdown.SM || 0 },
        { label: 'Final', pts: stageBreakdown.F || 0 },
    ].map(({ label, pts }) => `
        <div class="text-center">
            <div class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">${label}</div>
            <div class="text-sm font-black text-white">${pts || '—'}</div>
        </div>`).join('');

    headerEl.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="text-4xl leading-none">${team.flag}</span>
            <div class="flex-1 min-w-0">
                <div class="text-base font-black uppercase text-white truncate">${escapeHtml(team.name)}</div>
                <div class="flex flex-wrap items-center gap-2 mt-0.5">
                    <span class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">T${team.tier} · $${team.cost} · Grp ${team.group}</span>
                    ${statusHtml}
                </div>
            </div>
            <div class="text-right shrink-0">
                <div class="text-2xl font-black text-white">${stageBreakdown.total}</div>
                <div class="text-[10px] font-black uppercase text-gray-400">pts</div>
            </div>
        </div>
        <div class="rounded-2xl border border-gray-700 bg-gray-800/50 px-4 py-3 mt-4">
            <div class="flex items-center justify-between mb-2.5">
                <span class="text-[9px] font-black uppercase tracking-[0.25em] text-gray-500">Points by Stage</span>
                <span class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">${pickedPct}% picked · ${pickedCount} players</span>
            </div>
            <div class="grid grid-cols-4 gap-x-2 gap-y-2">${stageRows}</div>
        </div>
    `;
    listEl.innerHTML = `
        <div class="px-6 pb-4">
            <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Matches</div>
            <div class="space-y-2">${matchesHtml}</div>
        </div>
    `;
}

async function showTeamOwners(teamName) {
    if (appSettings.hideTeamSelection) return;
    const modal = document.getElementById('team-owners-modal');
    const headerEl = document.getElementById('team-owners-header');
    const listEl = document.getElementById('team-owners-list');
    if (!modal || !headerEl || !listEl) return;

    const team = teams.find((t) => t.name === teamName);
    const flag = team?.flag || '';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    closeOwnerPlayer(); // reset to single-panel view

    headerEl.innerHTML = `
        <div class="flex items-center gap-4">
            <span class="text-5xl leading-none">${flag}</span>
            <div>
                <div class="text-xl font-black uppercase italic tracking-tight text-white">${escapeHtml(teamName)}</div>
                <div class="mt-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading…</div>
            </div>
        </div>`;
    listEl.innerHTML = '<div class="p-8 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 animate-pulse">Loading...</div>';

    const onEscape = (e) => { if (e.key === 'Escape') { closeTeamOwners(); document.removeEventListener('keydown', onEscape); } };
    document.addEventListener('keydown', onEscape);

    let owners = [];

    let lb = window._leaderboardData || [];
    if (lb.length > 0) {
        owners = lb
            .filter((u) => u.squad.some((t) => t.name === teamName))
            .sort((a, b) => b.totalPoints - a.totalPoints || a.nickname.localeCompare(b.nickname))
            .map((u) => ({ email: u.email, nickname: u.nickname, realname: u.realname || '', totalPoints: u.totalPoints, squad: u.squad, stagePoints: u.stagePoints }));
    } else {
        try {
            const [{ data: allPicks }, { data: allProfiles }, { data: allMatches }] = await Promise.all([
                supabaseClient.from('picks').select('*'),
                supabaseClient.from('profiles').select('email, nickname, realname'),
                supabaseClient.from('matches').select('*')
            ]);

            const profilesMap = window.WorldCupScoring.buildProfilesMap(allProfiles || []);
            const leaderboardData = window.WorldCupScoring.buildLeaderboardData(
                allPicks || [], allMatches || [], profilesMap, teams, advancedTeams, eliminatedTeams
            );
            const previousRanks = JSON.parse(localStorage.getItem('wc_pool_lb_ranks') || '{}');
            const currentRanks = _getPlayerDisplayRanks(leaderboardData);
            const playerChips = computePlayerChips(leaderboardData, allMatches || [], previousRanks);
            const enrichedLeaderboardData = leaderboardData.map((user) => ({
                ...user,
                displayRank: currentRanks[user.email] || null,
                chips: playerChips.get(user.email) || []
            }));

            // Prime the cache so subsequent opens are instant
            window._leaderboardData = enrichedLeaderboardData;
            window._playerChipsByEmail = Object.fromEntries(playerChips);
            lb = enrichedLeaderboardData;

            owners = enrichedLeaderboardData
                .filter((u) => u.squad.some((t) => t.name === teamName))
                .sort((a, b) => b.totalPoints - a.totalPoints || a.nickname.localeCompare(b.nickname))
                .map((u) => ({ email: u.email, nickname: u.nickname, realname: u.realname || '', totalPoints: u.totalPoints, squad: u.squad, stagePoints: u.stagePoints }));
        } catch (_) {
            listEl.innerHTML = '<div class="p-8 text-center text-[10px] font-black uppercase tracking-[0.2em] text-red-400">Could not load picks.</div>';
            return;
        }
    }

    window._teamOwnersState = { teamName, owners };

    headerEl.innerHTML = `
        <div class="flex items-center gap-4">
            <span class="text-5xl leading-none">${flag}</span>
            <div>
                <div class="text-xl font-black uppercase italic tracking-tight text-white">${escapeHtml(teamName)}</div>
                <div class="mt-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">${owners.length} ${owners.length === 1 ? 'player' : 'players'} picked this team</div>
            </div>
        </div>`;

    if (owners.length === 0) {
        listEl.innerHTML = '<div class="p-8 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">No players have picked this team</div>';
        return;
    }

    listEl.innerHTML = owners.map((u) => {
        const squadFlags = appSettings.hideTeamSelection ? '' : [...u.squad]
            .sort((a, b) => (b.cost || 0) - (a.cost || 0))
            .map((t) => `<span class="text-base leading-none${t.eliminated ? ' opacity-30' : ''}">${t.flag || ''}</span>`)
            .join('');
        const safeEmail = u.email.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `
            <button data-owner-email="${escapeHtml(u.email)}" onclick="showOwnerPlayer('${safeEmail}')"
                class="owner-list-row w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0">
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-black uppercase text-white truncate">${escapeHtml(u.nickname)}</div>
                    ${u.realname ? `<div class="text-[10px] font-bold text-gray-500 truncate">${escapeHtml(u.realname)}</div>` : ''}
                    ${squadFlags ? `<div class="mt-1.5 flex flex-wrap gap-0.5">${squadFlags}</div>` : ''}
                </div>
                ${u.totalPoints !== null ? `<div class="shrink-0 text-right ml-2">
                    <div class="text-lg font-black text-white">${u.totalPoints}</div>
                    <div class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">pts</div>
                </div>` : ''}
            </button>`;
    }).join('');

    // Auto-open the top player
    if (owners.length > 0) showOwnerPlayer(owners[0].email);
}

async function showOwnerPlayer(email) {
    const rightPanel = document.getElementById('team-owners-right');
    const playerContent = document.getElementById('team-owners-player-content');
    const container = document.getElementById('team-owners-container');
    if (!rightPanel || !playerContent || !container) return;

    playerContent.innerHTML = '<div class="p-8 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 animate-pulse">Loading...</div>';
    rightPanel.classList.remove('hidden');
    rightPanel.classList.add('flex');
    container.classList.add('team-owners-expanded');

    // Highlight active row in list
    document.querySelectorAll('.owner-list-row').forEach((btn) => {
        const isActive = btn.dataset.ownerEmail === email;
        btn.classList.toggle('bg-gray-800', isActive);
        btn.classList.toggle('hover:bg-gray-800', !isActive);
    });

    // Pull stored squad data (fetched during showTeamOwners)
    const state = window._teamOwnersState;
    const ownerData = state?.owners.find((u) => u.email === email);

    const lb = window._leaderboardData || [];
    const playerEntry = lb.find((u) => u.email === email);

    // Profile fetch
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('nickname, realname, favorite_team, home_country')
        .eq('email', email)
        .single();

    const nickname = profile?.nickname || ownerData?.nickname || email.split('@')[0];
    const realname = profile?.realname || ownerData?.realname || '';
    const favTeam = teams.find((t) => t.name === profile?.favorite_team);
    const favFlag = favTeam?.flag || '';
    const playerChips = playerEntry?.chips || window._playerChipsByEmail?.[email] || [];
    const cardAccent = getPlayerCardAccentStyle(profile?.favorite_team || '');

    const squad = playerEntry?.squad || ownerData?.squad || [];
    const totalPoints = playerEntry?.totalPoints ?? ownerData?.totalPoints ?? null;
    const stagePoints = playerEntry?.stagePoints || ownerData?.stagePoints;

    let squadHtml = '';
    let budgetUsed = 0;
    if (appSettings.hideTeamSelection && email !== userEmail) {
        squadHtml = '<div class="col-span-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 py-2">Teams to be displayed when WC starts</div>';
    } else if (squad.length > 0) {
        budgetUsed = squad.reduce((sum, t) => sum + (t.cost || 0), 0);
        squadHtml = [...squad]
            .sort((a, b) => (b.cost || 0) - (a.cost || 0) || a.name.localeCompare(b.name))
            .map((t) => `
                <div class="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 flex items-center gap-2 ${t.eliminated ? 'opacity-40' : ''}">
                    <span class="text-xl">${t.flag || ''}</span>
                    <div class="flex-1 min-w-0">
                        <div class="text-xs font-black uppercase text-white truncate">${escapeHtml(t.name)}</div>
                        <div class="text-[10px] font-bold text-gray-400">${(() => { const td = teams.find((x) => x.name === t.name); const g = t.group || td?.group || ''; return g ? `Grp ${g} · ` : ''; })()}$${t.cost}${t.eliminated ? ' · out' : ''}</div>
                    </div>
                </div>`).join('');
    } else {
        squadHtml = '<div class="col-span-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 py-2">No squad data</div>';
    }

    let stageBreakdownHtml = '';
    if (stagePoints) {
        const sp = stagePoints;
        const groupPts = (sp.G1 || 0) + (sp.G2 || 0) + (sp.G3 || 0);
        [
            { label: 'Group', pts: groupPts },
            { label: 'Bonus', pts: sp.Bonus || 0 },
            { label: 'R32',   pts: sp.R32 || 0 },
            { label: 'R16',   pts: sp.R16 || 0 },
            { label: 'QF',    pts: sp.QF  || 0 },
            { label: 'Semi',  pts: sp.SM  || 0 },
            { label: 'Final', pts: sp.F   || 0 },
        ].forEach(({ label, pts }) => {
            stageBreakdownHtml += `
                <div class="text-center">
                    <div class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">${label}</div>
                    <div class="text-sm font-black text-white">${pts || '—'}</div>
                </div>`;
        });
    }

    const budgetBarHtml = budgetUsed > 0 ? `
        <div class="px-5 pb-5" style="${cardAccent.style}">
            <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Budget Used</span>
                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-white">$${budgetUsed} / $150</span>
            </div>
            <div class="h-2 rounded-full overflow-hidden" style="background-color: rgba(var(--player-card-accent-primary-rgb, 59, 130, 246), 0.18);">
                <div class="h-full rounded-full" style="width: ${Math.round(budgetUsed / 150 * 100)}%; background: linear-gradient(90deg, var(--player-card-accent-primary, #3b82f6), var(--player-card-accent-on-dark, #93c5fd));"></div>
            </div>
        </div>` : '';

    playerContent.innerHTML = `
        <div class="p-5 space-y-4" style="${cardAccent.style}">
            <div>
                <div class="flex items-center gap-3">
                    <span class="text-3xl shrink-0">${favFlag || '👤'}</span>
                    <div class="min-w-0 flex-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span class="text-lg font-black uppercase italic tracking-tight text-white">${escapeHtml(nickname)}</span>
                        ${realname ? `<span class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">${escapeHtml(realname)}</span>` : ''}
                        ${profile?.favorite_team ? `<span class="text-[10px] font-black uppercase tracking-[0.15em] text-gray-300">${favFlag} ${escapeHtml(profile.favorite_team)}</span>` : ''}
                        ${profile?.home_country ? `<span class="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">${escapeHtml(profile.home_country)}</span>` : ''}
                    </div>
                    ${totalPoints !== null ? `<div class="text-right shrink-0">
                        <div class="text-2xl font-black leading-none" style="color: var(--player-card-accent-on-dark);">${totalPoints}</div>
                        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">pts</div>
                    </div>` : ''}
                </div>
                ${renderPlayerChips(playerChips, email, 'card', 'owner-player')}
            </div>

            ${stageBreakdownHtml ? `
            <div class="rounded-2xl border px-4 py-3" style="border-color: var(--player-card-accent-soft-strong); background-color: ${rgbaFromHex(cardAccent.tokens.primary, 0.12)};">
                <div class="text-[9px] font-black uppercase tracking-[0.25em] text-gray-500 mb-3">Points by Stage</div>
                <div class="grid grid-cols-7 gap-1">${stageBreakdownHtml}</div>
            </div>` : ''}

            <div>
                <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Squad</div>
                <div class="grid grid-cols-2 gap-2">${squadHtml}</div>
            </div>
        </div>
        ${budgetBarHtml}
    `;
}

function closeOwnerPlayer() {
    const rightPanel = document.getElementById('team-owners-right');
    const container = document.getElementById('team-owners-container');
    if (!rightPanel) return;
    closeChipPopover();
    rightPanel.classList.add('hidden');
    rightPanel.classList.remove('flex');
    if (container) container.classList.remove('team-owners-expanded');
}

function closeTeamOwners() {
    closeChipPopover();
    _closeModalWithAnimation('team-owners-modal', () => closeOwnerPlayer());
}

// ── Real-time Leaderboard ─────────────────────────────────────────────────────
// Subscribes to match and team_advancement changes so the leaderboard updates
// automatically when the admin logs a result — no manual reload needed.

let leaderboardChannel = null;
let leaderboardDebounceTimer = null;

function setupLeaderboardRealtime() {
    if (leaderboardChannel) return; // Only subscribe once per session

    leaderboardChannel = supabaseClient
        .channel('leaderboard-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
            // Debounce 500ms so rapid admin edits (e.g. score corrections) don't fire multiple fetches
            clearTimeout(leaderboardDebounceTimer);
            leaderboardDebounceTimer = setTimeout(() => {
                fetchLeaderboard();
                setupDashboard(); // Also refresh the dashboard snapshot
            }, 500);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_advancement' }, () => {
            clearTimeout(leaderboardDebounceTimer);
            leaderboardDebounceTimer = setTimeout(() => {
                fetchLeaderboard();
            }, 500);
        })
        .subscribe();
}

// ============================================================================
// Pool "Wrapped" — admin-only swipeable summary deck (full-screen popup).
// Read-only: only .select() against picks/profiles in the logged-in session.
// ============================================================================
const WRAPPED_ENTRY_FEE = 50;            // $50 CAD per player (Rules page)
const WRAPPED_SPLIT = { first: 0.65, second: 0.25, third: 0.10 };
const WRAPPED_HOSTS = ['USA', 'Mexico', 'Canada'];
const WRAPPED_EXCLUDE = new Set(['seanigan44@gmail.com']); // test account — excluded from all stats
let _wrappedKeyHandler = null;

// Registry of published update decks (newest first). Add an entry to publish a new one.
// `build` selects the builder; only 'picks' (the pool recap) exists for now.
const WRAPPED_DECKS = [
    { id: 'picks-are-in', title: 'Picks Are In', date: 'Jun 11, 2026', build: 'picks' }
];

function _wrappedTeamByName() {
    const map = {};
    (typeof teams !== 'undefined' ? teams : []).forEach((t) => { map[t.name] = t; });
    return map;
}
function _wrappedEsc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function _wrappedMoney(n) { return '$' + Math.round(n).toLocaleString(); }
function _wrappedPeople(n) { return n === 1 ? '1 player' : n + ' players'; }

// Public table on the Updates page — one row per published deck.
function renderUpdatesTable() {
    const body = document.getElementById('updates-table');
    if (!body) return;
    body.innerHTML = WRAPPED_DECKS.map((d) =>
        '<tr class="text-gray-900">'
        + '<td class="px-5 py-4"><div class="text-sm font-black uppercase">' + _wrappedEsc(d.title) + '</div>'
        + '<div class="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Pool recap</div></td>'
        + '<td class="px-5 py-4 hidden sm:table-cell text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">' + _wrappedEsc(d.date) + '</td>'
        + '<td class="px-5 py-4 text-right"><button onclick="openWrappedDeck(\'' + _wrappedEsc(d.id) + '\')" class="rounded-xl bg-gray-900 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-gray-700">Open ▶</button></td>'
        + '</tr>'
    ).join('');
}

// Admin Slides button — opens the first/primary deck. (Admin tab is already gated.)
function showWrappedDeck() {
    openWrappedDeck('picks-are-in');
}

// Shared opener — used by both the admin Slides button and the public Updates table.
// No admin gate: the same picks/profiles data is already shown to all logged-in users
// on the leaderboard, and reads are RLS-protected.
async function openWrappedDeck(deckId) {
    const deck = WRAPPED_DECKS.find((d) => d.id === deckId) || WRAPPED_DECKS[0];
    const modal = document.getElementById('wrapped-deck-modal');
    const host = document.getElementById('wrapped-deck-host');
    if (!modal || !host) return;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    host.innerHTML = '<div class="wr-state"><div class="wr-spinner"></div><div class="wr-sub">Loading…</div></div>';

    try {
        const [picksRes, profRes] = await Promise.all([
            supabaseClient.from('picks').select('user_email, team_name, tier, cost'),
            supabaseClient.from('profiles').select('email, nickname, realname, favorite_team, home_country, has_paid, blocked, picks_save_count')
        ]);
        if (picksRes.error) throw picksRes.error;
        if (profRes.error) throw profRes.error;
        // Only the 'picks' builder exists for now; future decks can branch on deck.build.
        _buildWrappedDeck(host, picksRes.data || [], profRes.data || []);
    } catch (e) {
        host.innerHTML = '<div class="wr-state"><div class="wr-headline" style="font-size:30px">Couldn\'t load</div>'
            + '<p class="wr-caption" style="margin-top:12px">' + _wrappedEsc((e && e.message) || 'Could not reach the pool data.') + '</p></div>';
    }
}

function closeWrappedDeck() {
    const modal = document.getElementById('wrapped-deck-modal');
    const host = document.getElementById('wrapped-deck-host');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    if (_wrappedKeyHandler) { document.removeEventListener('keydown', _wrappedKeyHandler); _wrappedKeyHandler = null; }
    if (host) host.innerHTML = '';
}

function _buildWrappedDeck(host, picks, profiles) {
    const TEAM_BY_NAME = _wrappedTeamByName();
    const flagOf = (name) => (TEAM_BY_NAME[name] && TEAM_BY_NAME[name].flag) || '';

    const profByEmail = {};
    profiles.forEach((p) => { if (p && p.email) profByEmail[p.email.toLowerCase()] = p; });
    const isBlocked = (email) => { const p = profByEmail[(email || '').toLowerCase()]; return !!(p && p.blocked); };
    const nameOf = (email) => {
        const p = profByEmail[(email || '').toLowerCase()];
        return (p && (p.nickname || p.realname)) || (email || '').split('@')[0] || 'Someone';
    };

    // Group picks into squads by user_email (skip blocked + excluded test accounts)
    const squads = {};
    picks.forEach((row) => {
        if (!row || !row.user_email) return;
        const key = row.user_email.toLowerCase();
        if (isBlocked(row.user_email) || WRAPPED_EXCLUDE.has(key)) return;
        (squads[key] = squads[key] || []).push(row);
    });
    const players = Object.keys(squads);
    const playerCount = players.length;
    const pot = WRAPPED_ENTRY_FEE * playerCount;

    // Team popularity (distinct squads containing each team)
    const teamCount = {};
    Object.values(squads).forEach((sq) => {
        const seen = new Set();
        sq.forEach((r) => { if (seen.has(r.team_name)) return; seen.add(r.team_name); teamCount[r.team_name] = (teamCount[r.team_name] || 0) + 1; });
    });
    const pickedTeams = Object.entries(teamCount).sort((a, b) => b[1] - a[1]);
    const mostTeam = pickedTeams[0] || null;
    const leastTeam = pickedTeams.length ? pickedTeams[pickedTeams.length - 1] : null;
    const tier1 = pickedTeams.filter(([name]) => (TEAM_BY_NAME[name] || {}).tier === 1);
    const topTier1 = tier1[0] || null;
    const distinctCountries = Object.keys(teamCount).length;

    // Teams that got ZERO picks (exclude non-qualified placeholders like Italy)
    const allTeams = (typeof teams !== 'undefined' ? teams : []);
    const qualifiedTeams = allTeams.filter((t) => t.qualified !== false && (Number(t.cost) || 0) > 0);
    const totalTeams = qualifiedTeams.length; // 48 in the tournament
    const allPicked = distinctCountries >= totalTeams;
    const zeroPickTeams = qualifiedTeams
        .filter((t) => !teamCount[t.name])
        .map((t) => t.name);

    // Group popularity
    const groupCount = {};
    Object.values(squads).forEach((sq) => sq.forEach((r) => {
        const g = (TEAM_BY_NAME[r.team_name] || {}).group;
        if (g) groupCount[g] = (groupCount[g] || 0) + 1;
    }));
    const groups = Object.entries(groupCount).sort((a, b) => b[1] - a[1]);
    const mostGroup = groups[0] || null;
    const leastGroup = groups.length ? groups[groups.length - 1] : null;
    // All groups A–L for the heatmap (zero-fill missing); also blind-spot groups
    const allGroupLetters = Array.from(new Set(allTeams.map((t) => t.group).filter(Boolean))).sort();
    const groupHeat = allGroupLetters.map((g) => ({ group: g, count: groupCount[g] || 0 }))
        .sort((a, b) => b.count - a.count || a.group.localeCompare(b.group));
    const zeroGroups = allGroupLetters.filter((g) => !groupCount[g]);

    // Spend per player
    const spend = players.map((e) => ({ name: nameOf(e), total: squads[e].reduce((s, r) => s + (Number(r.cost) || 0), 0) }));
    spend.sort((a, b) => b.total - a.total);
    const smallest = spend.length ? spend[spend.length - 1] : null;
    const maxedCount = spend.filter((s) => s.total >= 150).length;

    // Picks per price point — how many total team-picks landed at each cost ($50, $45 … $2)
    const costCount = {};
    Object.values(squads).forEach((sq) => sq.forEach((r) => {
        const c = Number(r.cost) || 0;
        if (c > 0) costCount[c] = (costCount[c] || 0) + 1;
    }));
    const costRows = Object.entries(costCount)
        .map(([cost, count]) => ({ label: '$' + cost, value: count, _cost: Number(cost) }))
        .sort((a, b) => b._cost - a._cost);

    // Priciest team that anyone actually rostered
    // Tier-3 gamblers: most Tier-3 teams stacked in one squad (capture their full squad)
    let gambler = null;
    players.forEach((e) => {
        const t3 = squads[e].filter((r) => (TEAM_BY_NAME[r.team_name] || {}).tier === 3).length;
        if (gambler === null || t3 > gambler.count) {
            const squadFlags = squads[e]
                .slice()
                .sort((a, b) => (Number(b.cost) || 0) - (Number(a.cost) || 0))
                .map((r) => flagOf(r.team_name))
                .join(' ');
            gambler = { name: nameOf(e), count: t3, squadFlags };
        }
    });

    // Longest nickname — "didn't get the memo"
    let longestName = null;
    players.forEach((e) => {
        const nick = (profByEmail[e] || {}).nickname || '';
        if (nick && (longestName === null || nick.length > longestName.length)) {
            longestName = { name: nick, length: nick.length };
        }
    });

    // Twins & originals: identical 8-team squads (sorted signature)
    const sigCount = {};
    players.forEach((e) => {
        const sig = squads[e].map((r) => r.team_name).sort().join('|');
        sigCount[sig] = (sigCount[sig] || 0) + 1;
    });
    const sharedGroups = Object.values(sigCount).filter((c) => c > 1).length; // distinct squads shared by 2+
    const uniqueCount = Object.values(sigCount).filter((c) => c === 1).length;

    // Host sweep
    const hostHeroes = players.filter((e) => {
        const names = new Set(squads[e].map((r) => r.team_name));
        return WRAPPED_HOSTS.every((h) => names.has(h));
    }).map(nameOf);

    // Hometown heroes: squad includes their home_country
    const hometownHeroes = players.filter((e) => {
        const p = profByEmail[e];
        const home = p && p.home_country;
        if (!home) return false;
        return new Set(squads[e].map((r) => r.team_name)).has(home);
    }).map(nameOf);

    // Most saves (tinkerers) — top 3 by picks_save_count, only among included players
    const savers = players
        .map((e) => ({ name: nameOf(e), saves: Number((profByEmail[e] || {}).picks_save_count) || 0 }))
        .filter((x) => x.saves > 0)
        .sort((a, b) => b.saves - a.saves)
        .slice(0, 3);

    // Favourite-team loyalty
    const loyalists = [], traitors = [];
    players.forEach((e) => {
        const p = profByEmail[e];
        const fav = p && p.favorite_team;
        if (!fav) return;
        const names = new Set(squads[e].map((r) => r.team_name));
        (names.has(fav) ? loyalists : traitors).push({ name: nameOf(e), fav });
    });

    const slideHTML = (extra, inner) => '<section class="wr-slide ' + extra + '"><div class="wr-inner">' + inner + '</div></section>';
    const statSlide = (kicker, big, caption, isFlag) => slideHTML(isFlag ? 'wr-blue' : '',
        '<div class="wr-kicker">' + _wrappedEsc(kicker) + '</div><div class="wr-bignum">' + big + '</div><p class="wr-caption">' + caption + '</p>');
    const chipList = (names, withFlag) => '<div class="wr-namelist">' + names.slice(0, 24).map((n) =>
        '<span class="wr-chip">' + _wrappedEsc(typeof n === 'string' ? n : n.name) + (withFlag && n.fav ? ' ' + flagOf(n.fav) : '') + '</span>').join('') + '</div>';
    // rows = [{label, value, flag}], max for scaling
    const barRows = (rows) => {
        const max = Math.max(1, ...rows.map((r) => r.value));
        return '<div class="wr-bars">' + rows.map((r) => {
            const w = Math.round((r.value / max) * 100);
            return '<div class="wr-bar-row">'
                + '<div class="wr-bar-label">' + (r.flag ? r.flag + ' ' : '') + _wrappedEsc(r.label) + '</div>'
                + '<div class="wr-bar-track"><div class="wr-bar-fill" style="width:' + w + '%"></div></div>'
                + '<div class="wr-bar-val">' + r.value + '</div></div>';
        }).join('') + '</div>';
    };
    const tierBarsSlide = (tierNum) => {
        const rows = allTeams.filter((t) => t.tier === tierNum && t.qualified !== false && (Number(t.cost) || 0) > 0)
            .map((t) => ({ label: t.name, value: teamCount[t.name] || 0, flag: t.flag }))
            .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
        return slideHTML('', '<div class="wr-kicker">Tier ' + tierNum + ' — by picks</div>'
            + '<h1 class="wr-headline" style="font-size:clamp(24px,6vw,40px);margin-bottom:6px">'
            + (tierNum === 1 ? 'The Heavyweights' : tierNum === 2 ? 'The Contenders' : 'The Longshots') + '</h1>'
            + barRows(rows));
    };

    if (!playerCount) {
        host.innerHTML = '<div class="wr-state"><div class="wr-headline" style="font-size:30px">No picks yet</div>'
            + '<p class="wr-caption" style="margin-top:12px">Once players save squads, their Wrapped will appear here.</p></div>';
        return;
    }

    const slides = [];
    // Cover
    slides.push(slideHTML('wr-blue', '<div class="wr-brand">WC2026 POOL</div><h1 class="wr-headline" style="margin-top:10px">Picks Are In ⚽</h1><p class="wr-caption" style="margin-top:14px">Every squad is locked. Here\'s the pool by the numbers before a ball is kicked.</p>'));
    // The Squad
    slides.push(statSlide('The Squad', String(playerCount), _wrappedPeople(playerCount) + ' joined the pool. May the best squad win.'));
    // The Pot
    slides.push(slideHTML('wr-gold',
        '<div class="wr-kicker">The Pot</div><div class="wr-bignum">' + _wrappedMoney(pot) + '</div>'
        + '<p class="wr-caption">' + _wrappedPeople(playerCount) + ' × ' + _wrappedMoney(WRAPPED_ENTRY_FEE) + ' CAD. Split across the top three.</p>'
        + '<div class="wr-payouts">'
        + '<div class="wr-payrow"><span class="wr-place">🥇 1st</span><span class="wr-amt" style="color:#34d399">' + _wrappedMoney(pot * WRAPPED_SPLIT.first) + '</span></div>'
        + '<div class="wr-payrow"><span class="wr-place">🥈 2nd</span><span class="wr-amt" style="color:#9ca3af">' + _wrappedMoney(pot * WRAPPED_SPLIT.second) + '</span></div>'
        + '<div class="wr-payrow"><span class="wr-place">🥉 3rd</span><span class="wr-amt" style="color:#f59e0b">' + _wrappedMoney(pot * WRAPPED_SPLIT.third) + '</span></div>'
        + '</div>'));
    // Most Picked Team
    if (mostTeam) slides.push(statSlide('Most Picked Team', '<span class="wr-flag-lead">' + flagOf(mostTeam[0]) + '</span>' + _wrappedEsc(mostTeam[0]),
        'On ' + mostTeam[1] + ' of ' + playerCount + ' squads (' + Math.round(mostTeam[1] / playerCount * 100) + '%). The crowd favourite.', true));
    // Zero-pick teams (replaces "least picked")
    if (zeroPickTeams.length) {
        slides.push(slideHTML('',
            '<div class="wr-kicker">Zero Love</div><div class="wr-bignum" style="font-size:clamp(56px,16vw,120px)">' + zeroPickTeams.length + '</div>'
            + '<p class="wr-caption">' + (zeroPickTeams.length === 1 ? 'team got no picks at all.' : 'teams nobody picked at all.') + '</p>'
            + '<div class="wr-namelist">' + zeroPickTeams.map((n) => '<span class="wr-chip">' + flagOf(n) + ' ' + _wrappedEsc(n) + '</span>').join('') + '</div>'));
    } else if (leastTeam) {
        slides.push(statSlide('Least Picked Team', '<span class="wr-flag-lead">' + flagOf(leastTeam[0]) + '</span>' + _wrappedEsc(leastTeam[0]),
            'Only ' + _wrappedPeople(leastTeam[1]) + ' believed. Every team got at least one pick.', true));
    }
    // Top Tier-1
    if (topTier1) slides.push(statSlide('Top Tier-1 Pick', '<span class="wr-flag-lead">' + flagOf(topTier1[0]) + '</span>' + _wrappedEsc(topTier1[0]),
        'The most-backed heavyweight — chosen by ' + _wrappedPeople(topTier1[1]) + '.', true));
    // Tier 1 / 2 / 3 bars
    slides.push(tierBarsSlide(1));
    slides.push(tierBarsSlide(2));
    slides.push(tierBarsSlide(3));
    // Most loved group
    if (mostGroup) slides.push(statSlide('Most Loved Group', 'Group ' + _wrappedEsc(mostGroup[0]), mostGroup[1] + ' picks came from this group alone.'));
    // Group heatmap (A–L bars)
    if (groupHeat.length) slides.push(slideHTML('',
        '<div class="wr-kicker">Picks by Group</div><h1 class="wr-headline" style="font-size:clamp(24px,6vw,40px);margin-bottom:6px">The Group Map</h1>'
        + barRows(groupHeat.map((g) => ({ label: 'Group ' + g.group, value: g.count })))));
    // Group blind spots
    if (zeroGroups.length) slides.push(statSlide('Blind Spots',
        zeroGroups.map((g) => 'Group ' + g).join(' · '),
        (zeroGroups.length === 1 ? 'A whole group' : zeroGroups.length + ' whole groups') + ' nobody touched. '
        + (allPicked ? 'Still, all ' + totalTeams + ' teams got picked at least once.' : distinctCountries + ' of the ' + totalTeams + ' teams got picked in total.')));
    else if (allPicked) slides.push(statSlide('Spread the Love', 'All ' + totalTeams,
        'Every single team in the tournament got picked. All ' + totalTeams + ' of them — nobody was left out.'));
    else slides.push(statSlide('Spread the Love', String(distinctCountries),
        distinctCountries + ' of the ' + totalTeams + ' teams got picked across the pool.'));
    // Average squad
    if (costRows.length) slides.push(slideHTML('',
        '<div class="wr-kicker">Picks by Price</div><h1 class="wr-headline" style="font-size:clamp(24px,6vw,40px);margin-bottom:6px">Where the Money Went</h1>'
        + '<p class="wr-caption" style="margin-bottom:6px">How many picks landed at each price point.</p>'
        + barRows(costRows)));
    // Maxed out ($150)
    slides.push(statSlide('Maxed Out', String(maxedCount),
        (maxedCount === 1 ? '1 player' : maxedCount + ' players') + ' spent every last dollar — the full $150 budget.'));
    // Bargain hunter (lowest spender)
    if (smallest) slides.push(statSlide('Bargain Hunter', _wrappedEsc(smallest.name), 'Built a squad for just ' + _wrappedMoney(smallest.total) + '. Moneyball.'));
    // Tier-3 gamblers — show their ridiculous squad
    if (gambler && gambler.count > 0) slides.push(slideHTML('',
        '<div class="wr-kicker">Longshot King</div>'
        + '<h1 class="wr-headline" style="font-size:clamp(26px,7vw,46px)">' + _wrappedEsc(gambler.name) + '</h1>'
        + '<p class="wr-caption" style="margin-top:10px">Stacked ' + gambler.count + ' Tier-3 longshots in one squad. Living dangerously — behold:</p>'
        + '<div class="wr-bignum" style="font-size:clamp(30px,9vw,64px);margin-top:14px;line-height:1.25">' + gambler.squadFlags + '</div>'));
    // Longest nickname — didn't get the memo
    if (longestName) slides.push(statSlide('Didn\'t Get the Memo', _wrappedEsc(longestName.name),
        longestName.length + ' characters. Ever heard of a short name?'));
    // Twins & originals
    slides.push(slideHTML('',
        '<div class="wr-kicker">Twins & Originals</div>'
        + '<div class="wr-bignum" style="font-size:clamp(56px,16vw,120px)">' + uniqueCount + '</div>'
        + '<p class="wr-caption">' + uniqueCount + ' one-of-a-kind squads nobody else matched.'
        + (sharedGroups ? ' ' + sharedGroups + (sharedGroups === 1 ? ' squad was copied by twins.' : ' squads had twins.') : ' Everyone went their own way.') + '</p>'));
    // Host sweep (count + names always)
    slides.push(slideHTML('',
        '<div class="wr-kicker">The Host Sweep</div><h1 class="wr-headline">' + WRAPPED_HOSTS.map(flagOf).join('') + '</h1>'
        + '<p class="wr-caption" style="margin-top:12px">' + (hostHeroes.length
            ? (hostHeroes.length === 1 ? '1 player' : hostHeroes.length + ' players') + ' backed all three hosts (USA, Mexico, Canada):'
            : 'Nobody dared take all three hosts (USA, Mexico, Canada).') + '</p>'
        + (hostHeroes.length ? chipList(hostHeroes) : '')));
    // Hometown heroes
    if (hometownHeroes.length) slides.push(slideHTML('',
        '<div class="wr-kicker">Hometown Heroes 🏠</div><div class="wr-bignum" style="font-size:clamp(56px,16vw,120px)">' + hometownHeroes.length + '</div>'
        + '<p class="wr-caption">backed their own home nation.</p>' + chipList(hometownHeroes)));
    // Most saves
    if (savers.length) slides.push(slideHTML('',
        '<div class="wr-kicker">The Tinkerers ✏️</div><h1 class="wr-headline" style="font-size:clamp(24px,6vw,40px);margin-bottom:6px">Most Edits</h1>'
        + '<p class="wr-caption" style="margin-bottom:6px">Who couldn\'t stop changing their squad.</p>'
        + barRows(savers.map((s) => ({ label: s.name, value: s.saves })))));
    // Loyalists
    slides.push(slideHTML('',
        '<div class="wr-kicker">The Loyalists ❤️</div><div class="wr-bignum" style="font-size:clamp(56px,16vw,120px)">' + loyalists.length + '</div>'
        + '<p class="wr-caption">' + (loyalists.length ? 'put their money on their favourite team.' : 'No one backed their own favourite team. Cold-blooded.') + '</p>'
        + (loyalists.length ? chipList(loyalists, true) : '')));
    // Traitors
    slides.push(slideHTML('',
        '<div class="wr-kicker">The Traitors 🙈</div><div class="wr-bignum" style="font-size:clamp(56px,16vw,120px)">' + traitors.length + '</div>'
        + '<p class="wr-caption">' + (traitors.length ? 'left their favourite team off the squad. Business is business.' : 'Everyone stayed loyal. Wholesome.') + '</p>'
        + (traitors.length ? chipList(traitors) : '')));
    // Closer
    slides.push(slideHTML('wr-blue', '<h1 class="wr-headline">Good luck 🍀</h1><p class="wr-caption" style="margin-top:14px">The tournament starts now. Let\'s see whose squad holds up.</p><div class="wr-sub" style="margin-top:26px">WC2026 Pool · Picks Are In</div>'));

    const count = slides.length;
    host.innerHTML =
        '<div class="wr-deck" id="wr-deck">' + slides.join('') + '</div>'
        + '<div class="wr-progress" id="wr-progress"></div>'
        + '<div class="wr-hint" id="wr-hint">Swipe or tap Next · ↑ back</div>'
        + '<div class="wr-controls">'
        + '<button class="wr-prev" id="wr-prev" aria-label="Previous">↑</button>'
        + '<button class="wr-next" id="wr-next">Next ↓</button>'
        + '</div>';

    _setupWrappedNav(count);
    if (typeof twemoji !== 'undefined') _wrappedRenderFlags(host);
}

function _wrappedRenderFlags(root) {
    const BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/';
    const isFlag = (str) => {
        const cps = Array.from(str).map((c) => c.codePointAt(0));
        const reg = cps.length === 2 && cps.every((c) => c >= 0x1F1E6 && c <= 0x1F1FF);
        const tag = cps[0] === 0x1F3F4 && cps.some((c) => c >= 0xE0060 && c <= 0xE007F);
        return reg || tag;
    };
    try {
        twemoji.parse(root, {
            className: 'wr-flag', folder: 'svg', ext: '.svg', base: BASE,
            callback: function (icon, options) {
                const str = icon.split('-').map((h) => String.fromCodePoint(parseInt(h, 16))).join('');
                if (!isFlag(str)) return false;
                return BASE + 'svg/' + icon + options.ext;   // v14: hardcode svg/ folder
            }
        });
    } catch (e) { /* never break the deck */ }
}

function _setupWrappedNav(count) {
    const deck = document.getElementById('wr-deck');
    const progress = document.getElementById('wr-progress');
    const nextBtn = document.getElementById('wr-next');
    const prevBtn = document.getElementById('wr-prev');
    const hint = document.getElementById('wr-hint');
    if (!deck) return;
    progress.innerHTML = Array.from({ length: count }, (_, i) => '<span class="wr-dot' + (i === 0 ? ' active' : '') + '"></span>').join('');
    const dots = Array.from(progress.children);
    const slides = Array.from(deck.children);
    const slideH = () => deck.clientHeight || window.innerHeight;
    const current = () => Math.round(deck.scrollTop / slideH());
    const go = (i) => { i = Math.max(0, Math.min(count - 1, i)); slides[i].scrollIntoView({ behavior: 'smooth' }); };
    const updateUI = () => {
        const i = current();
        dots.forEach((d, k) => d.classList.toggle('active', k === i));
        nextBtn.textContent = (i >= count - 1) ? 'Restart ↺' : 'Next ↓';
        if (prevBtn) prevBtn.classList.toggle('wr-disabled', i <= 0);
        if (hint) hint.style.display = (i === 0) ? '' : 'none';
    };
    deck.addEventListener('scroll', () => window.requestAnimationFrame(updateUI), { passive: true });
    nextBtn.addEventListener('click', () => { const i = current(); if (i >= count - 1) go(0); else go(i + 1); });
    if (prevBtn) prevBtn.addEventListener('click', () => go(current() - 1));
    if (_wrappedKeyHandler) document.removeEventListener('keydown', _wrappedKeyHandler);
    _wrappedKeyHandler = (e) => {
        if (document.getElementById('wrapped-deck-modal').classList.contains('hidden')) return;
        if (e.key === 'Escape') { closeWrappedDeck(); }
        else if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(current() + 1); }
        else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); go(current() - 1); }
        else if (e.key === 'Home') go(0);
        else if (e.key === 'End') go(count - 1);
    };
    document.addEventListener('keydown', _wrappedKeyHandler);
    updateUI();
}

Object.assign(window, {
    setupAdminPage,
    showAdminTab,
    showResultsTab,
    showWrappedDeck,
    openWrappedDeck,
    renderUpdatesTable,
    closeWrappedDeck,
    setupDashboard,
    setDashRightTab,
    setDashRankingsSort,
    setDashMatchMode,
    toggleDashMatchMode,
    toggleDashSheet,
    showDashPointsModal,
    closeDashPointsModal,
    showDashRankModal,
    closeDashRankModal,
    showDashReportCard,
    closeDashReportCard,
    selectDashReportCard,
    openReportDrawer,
    closeReportDrawer,
    openChipsDrawer,
    closeChipsDrawer,
    showDashChips,
    closeDashChips,
    selectDashChips,
    setupResultsPage,
    setupStatsPage,
    setTeamResultsSort,
    setPublicTeamResultsFilter,
    resetPublicTeamResultsFilters,
    fetchAdminHistory,
    renderScheduleBrowser,
    renderKnockoutBracket,
    setScheduleFilter,
    prefillFromSchedule,
    editScheduleMatch,
    fetchAdminUsers,
    fetchAdminNotifications,
    fetchAdminAdvancement,
    fetchAdminTeamResults,
    fetchPublicTeamResults,
    scrollLeaderboardToSelf,
    clearChatMessages,
    deleteUserPicks,
    toggleUserPaidStatus,
    toggleUserBlockedStatus,
    fetchPublicResults,
    deleteMatch,
    submitManualResult,
    fetchLeaderboard,
    fetchStats,
    setupChat,
    fetchMessages,
    renderMessage,
    sendChatMessage,
    setupChatKeyboardSubmit,
    syncAdminToggleControls,
    exportAllTablesXlsx,
    sendAdminNotification,
    deleteAdminNotification,
    toggleTeamAdvancement,
    toggleTeamElimination,
    resetAllTeamStatus,
    resetAllMatches,
    clearAllPicks,
    simulateAllScheduledMatches,
    togglePicksLock,
    toggleAutoLock
    ,
    toggleHideTeamSelection,
    toggleHidePlayerChips,
    toggleAutoTeamStatusSync,
    renderProfileFavoriteBanner,
    applyPicksAccentTheme,
    toggleEmojiPicker,
    handleEmojiReaction,
    toggleReaction,
    setupLeaderboardRealtime,
    showBestAvailableExplorer,
    showBestAvailableExplorerHome,
    showBestAvailableLab,
    updateBestAvailableLabFilter,
    resetBestAvailableLabFilters,
    toggleBestAvailableLabInfo,
    showMyPoolLab,
    closeMyPoolLab,
    updateMyPoolLabFilter,
    resetMyPoolLabFilters,
    toggleMyPoolLabInfo,
    toggleLeaderboardSelfLabInfo,
    jumpToLeaderboardSelfFromLab,
    selectBestAvailableSquad,
    closeBestAvailableExplorer,
    showPlayerProfile,
    togglePlayerChipInline,
    showPlayerChipInfo,
    showProfileChipsPopup,
    closeProfileChipsPopup,
    closeChipPopover,
    showProfileByNickname,
    closePlayerProfile,
    clearChatBadge,
    postSystemMessage,
    insertMention,
    saveEditMessage,
    cancelEditMessage,
    undoSendMessage,
    fetchAdminVerifyTournament,
    setVerifyTournamentFilter,
    downloadTournamentVerifyCsv,
    toggleManagerArchiveMenu,
    openArchivedAdminTab
});

async function generatePlayerReport() {
    if (typeof isProtectedAdminEmail !== 'function' || !isProtectedAdminEmail(userEmail)) {
        if (typeof showToast === 'function') showToast('Admin access required.');
        return;
    }

    const [profilesRes, picksRes] = await Promise.all([
        supabaseClient.from('profiles').select('email, nickname, realname, favorite_team, home_country, has_paid, picks_save_count'),
        supabaseClient.from('picks').select('user_email, team_name, cost, tier')
    ]);

    if (profilesRes.error || picksRes.error) {
        if (typeof showToast === 'function') showToast('Could not load player data for the report.');
        return;
    }

    const userMap = new Map();
    (profilesRes.data || []).forEach((p) => {
        userMap.set(p.email, {
            email: p.email,
            realname: p.realname || '',
            nickname: p.nickname || '',
            country: p.home_country || '',
            favoriteTeam: p.favorite_team || '',
            hasPaid: Boolean(p.has_paid),
            saveCount: Number(p.picks_save_count || 0),
            picks: []
        });
    });
    (picksRes.data || []).forEach((row) => {
        const user = userMap.get(row.user_email);
        if (user) user.picks.push({ name: row.team_name, cost: Number(row.cost || 0) });
    });

    const rows = Array.from(userMap.values())
        .sort((a, b) => (a.realname || a.nickname || a.email).localeCompare(b.realname || b.nickname || b.email));

    const reportWin = window.open('', '_blank');
    if (!reportWin) {
        if (typeof showToast === 'function') showToast('Allow pop-ups to generate the report.');
        return;
    }
    reportWin.document.open();
    reportWin.document.write(buildPlayerReportHtml(rows));
    reportWin.document.close();
    reportWin.onload = () => {
        try { reportWin.focus(); reportWin.print(); } catch (e) { /* user can print manually */ }
    };
}

function buildPlayerReportHtml(rows) {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const totalAccounts = rows.length;
    const totalPaid = rows.filter((r) => r.hasPaid).length;
    const teamsSaved = rows.filter((r) => r.picks.length > 0).length;
    const noTeamsSaved = rows.filter((r) => r.picks.length === 0).length;
    const esc = _escapeReportHtml;
    const teamOwners = new Map();
    const rosterDensity = new Map();

    rows.forEach((r) => {
        rosterDensity.set(r.picks.length, (rosterDensity.get(r.picks.length) || 0) + 1);
        new Set(r.picks.map((p) => p.name).filter(Boolean)).forEach((teamName) => {
            if (!teamOwners.has(teamName)) teamOwners.set(teamName, new Set());
            teamOwners.get(teamName).add(r.email);
        });
    });

    const topPickedTeams = Array.from(teamOwners.entries())
        .map(([teamName, owners]) => ({
            teamName,
            pickedCount: owners.size,
            percentage: totalAccounts > 0 ? Math.round((owners.size / totalAccounts) * 100) : 0,
            teamData: typeof teams !== 'undefined' ? teams.find((team) => team.name === teamName) : null
        }))
        .sort((a, b) => b.pickedCount - a.pickedCount || a.teamName.localeCompare(b.teamName));
    const mostPickedTeam = topPickedTeams[0] || null;
    const topPickedMax = Math.max(1, ...topPickedTeams.slice(0, 5).map((entry) => entry.pickedCount));
    const rosterDensityEntries = Array.from(rosterDensity.entries())
        .map(([pickCount, playerCount]) => ({ pickCount, playerCount }))
        .sort((a, b) => b.pickCount - a.pickCount);
    const rosterDensityMax = Math.max(1, ...rosterDensityEntries.map((entry) => entry.playerCount));

    const statCards = [
        { label: 'Total accounts', value: totalAccounts, tone: 'dark' },
        { label: 'Paid', value: totalPaid, tone: 'green' },
        { label: 'Teams saved', value: teamsSaved, tone: 'blue' },
        { label: 'No teams saved', value: noTeamsSaved, tone: 'red' }
    ].map((card) => `
        <div class="stat-card ${card.tone}">
            <div class="stat-value">${card.value}</div>
            <div class="stat-label">${card.label}</div>
        </div>
    `).join('');

    const topPickedHtml = topPickedTeams.slice(0, 5).map((entry, index) => `
        <div class="bar-row">
            <div class="bar-label"><span class="rank">${index + 1}</span><span>${esc(entry.teamData?.flag || '')}</span><span>${esc(entry.teamName)}</span></div>
            <div class="bar-track"><span style="width:${Math.max(4, Math.round(entry.pickedCount / topPickedMax * 100))}%"></span></div>
            <div class="bar-value">${entry.pickedCount} · ${entry.percentage}%</div>
        </div>
    `).join('') || '<div class="empty-card">No saved teams yet.</div>';

    const rosterDensityHtml = rosterDensityEntries.map((entry) => `
        <div class="density-pill">
            <strong>${entry.pickCount}</strong>
            <span>${entry.pickCount === 1 ? 'team' : 'teams'}</span>
            <em>${entry.playerCount} ${entry.playerCount === 1 ? 'player' : 'players'}</em>
            <i style="width:${Math.max(5, Math.round(entry.playerCount / rosterDensityMax * 100))}%"></i>
        </div>
    `).join('') || '<div class="empty-card">No accounts found.</div>';

    const rowHtml = rows.map((r) => {
        const squad = r.picks.map((p) => p.name).join(', ') || '—';
        const spent = r.picks.reduce((s, p) => s + p.cost, 0);
        const remaining = 150 - spent;
        const hasTeamSaved = r.picks.length > 0;
        return `
            <tr>
                <td>${esc(r.realname || r.nickname || r.email)}</td>
                <td>${esc(r.nickname)}</td>
                <td>${esc(r.country)}</td>
                <td>${esc(r.favoriteTeam)}</td>
                <td class="squad">${esc(squad)}</td>
                <td class="num">${r.picks.length}</td>
                <td class="num">$${remaining}</td>
                <td class="num">${r.saveCount}</td>
                <td class="${hasTeamSaved ? 'flag-good' : 'flag-bad'}">${hasTeamSaved ? 'Saved' : 'No team saved'}</td>
                <td class="${r.hasPaid ? 'flag-good' : 'flag-bad'}">${r.hasPaid ? 'Paid' : 'Unpaid'}</td>
            </tr>`;
    }).join('');

    return `<!doctype html>
<html><head><meta charset="utf-8"><title>WC2026 Pool — Player Report</title>
<style>
    @page { size: landscape; margin: 0.5in; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; color: #111827; margin: 0; padding: 22px; background: #f8fafc; }
    h1 { margin: 0; font-size: 24px; letter-spacing: -0.03em; }
    .hero { border-radius: 22px; background: #111827; color: #fff; padding: 20px; margin-bottom: 14px; }
    .hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 16px; }
    .meta { color: #9ca3af; font-size: 11px; margin-top: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
    .hero-badge { border: 1px solid #374151; border-radius: 999px; padding: 7px 10px; color: #d1d5db; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em; white-space: nowrap; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .stat-card { border-radius: 16px; padding: 14px; border: 1px solid #263244; background: #172033; }
    .stat-card.green { background: #052e1a; border-color: #14532d; }
    .stat-card.blue { background: #082f49; border-color: #075985; }
    .stat-card.red { background: #3f1212; border-color: #7f1d1d; }
    .stat-value { font-size: 28px; line-height: 1; font-weight: 900; letter-spacing: -0.04em; }
    .stat-label { margin-top: 6px; color: #cbd5e1; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.16em; }
    .dashboard { display: grid; grid-template-columns: 1.1fr 1.4fr 1fr; gap: 12px; margin-bottom: 14px; }
    .panel { border: 1px solid #d1d5db; border-radius: 18px; background: #fff; padding: 14px; box-shadow: 0 10px 24px rgba(15,23,42,0.06); min-height: 120px; }
    .panel-title { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.18em; color: #64748b; margin-bottom: 9px; }
    .featured-team { font-size: 24px; font-weight: 900; letter-spacing: -0.04em; }
    .featured-sub { color: #64748b; font-size: 11px; font-weight: 700; margin-top: 5px; }
    .bar-row { display: grid; grid-template-columns: 130px 1fr 54px; align-items: center; gap: 8px; margin-top: 8px; font-size: 10px; }
    .bar-label { display: flex; align-items: center; gap: 5px; min-width: 0; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .rank { display: inline-flex; align-items: center; justify-content: center; width: 17px; height: 17px; border-radius: 999px; background: #e5e7eb; color: #374151; font-size: 8px; }
    .bar-track { height: 8px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
    .bar-track span { display: block; height: 100%; background: #15803d; border-radius: inherit; }
    .bar-value { text-align: right; color: #475569; font-weight: 900; font-variant-numeric: tabular-nums; }
    .density-pill { position: relative; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 12px; padding: 8px 9px; margin-top: 7px; font-size: 10px; }
    .density-pill strong { font-size: 17px; margin-right: 4px; }
    .density-pill span { font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; }
    .density-pill em { float: right; color: #64748b; font-style: normal; font-weight: 800; }
    .density-pill i { position: absolute; left: 0; bottom: 0; height: 3px; background: #16a34a; display: block; }
    .empty-card { color: #94a3b8; font-size: 11px; font-weight: 800; padding: 12px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 9.5px; background: #fff; border: 1px solid #d1d5db; }
    th, td { border: 1px solid #d7dce3; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #eef2f7; font-weight: 900; text-transform: uppercase; letter-spacing: 0.07em; font-size: 8px; color: #111827; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.squad { max-width: 260px; }
    .flag-good { color: #15803d; font-weight: 600; }
    .flag-bad { color: #b91c1c; font-weight: 600; }
</style></head><body>
<section class="hero">
    <div class="hero-top">
        <div>
            <h1>World Cup 2026 Pool — Player Report</h1>
            <div class="meta">Generated ${today}</div>
        </div>
        <div class="hero-badge">Admin export</div>
    </div>
    <div class="summary">${statCards}</div>
</section>
<section class="dashboard">
    <div class="panel">
        <div class="panel-title">Most Picked Team</div>
        ${mostPickedTeam ? `<div class="featured-team">${esc(mostPickedTeam.teamData?.flag || '')} ${esc(mostPickedTeam.teamName)}</div><div class="featured-sub">${mostPickedTeam.pickedCount} players · ${mostPickedTeam.percentage}% of accounts</div>` : '<div class="empty-card">No saved teams yet.</div>'}
    </div>
    <div class="panel">
        <div class="panel-title">Top Picked Teams</div>
        ${topPickedHtml}
    </div>
    <div class="panel">
        <div class="panel-title">Roster Size</div>
        ${rosterDensityHtml}
    </div>
</section>
<table>
    <thead><tr>
        <th>Name</th><th>Nickname</th><th>Country</th><th>Fav Team</th>
        <th>Squad</th><th>#</th><th>$ Left</th><th>Saves</th><th>Squad Status</th><th>Paid</th>
    </tr></thead>
    <tbody>${rowHtml}</tbody>
</table>
</body></html>`;
}

function _escapeReportHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function openGroupsModal() {
    const modal = document.getElementById('picks-groups-modal');
    const body = document.getElementById('picks-groups-modal-body');
    if (!modal || !body) return;

    const picks = (typeof myPicks !== 'undefined' && Array.isArray(myPicks)) ? myPicks : [];
    const pickedNames = new Set(picks.map((p) => p.name));

    const groupLetters = Array.from(new Set(teams.map((t) => t.group).filter((g) => g))).sort();
    body.innerHTML = `
        <div class="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-4 gap-2.5">
            ${groupLetters.map((letter) => {
                const groupTeams = teams
                    .filter((t) => t.group === letter)
                    .sort((a, b) => b.cost - a.cost);
                const pickedCount = picks.filter((p) => p.group === letter).length;
                const headerBadge = pickedCount > 0
                    ? `<span class="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white tabular-nums" style="background-color: var(--theme-accent-primary);" aria-label="${pickedCount} of your picks in this group">${pickedCount}</span>`
                    : '';
                return `
                    <div class="rounded-xl border border-gray-700 bg-gray-800 p-3">
                        <div class="flex items-center justify-between mb-2">
                            <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Group ${letter}</div>
                            ${headerBadge}
                        </div>
                        <div class="space-y-1.5">
                            ${groupTeams.map((t) => {
                                const isPicked = pickedNames.has(t.name);
                                const nameClass = isPicked ? '' : 'text-white';
                                const nameStyle = isPicked ? 'color: var(--theme-accent-on-dark); font-weight: 900;' : '';
                                const starSlot = isPicked
                                    ? `<span class="inline-block w-2.5 shrink-0 text-[10px] leading-none" style="color: var(--theme-accent-on-dark);">★</span>`
                                    : `<span class="inline-block w-2.5 shrink-0"></span>`;
                                return `
                                <div class="flex items-center justify-between gap-2 text-[11px] font-bold">
                                    <div class="flex items-center gap-1.5 min-w-0">
                                        ${starSlot}
                                        <span class="shrink-0 text-base leading-none">${t.flag}</span>
                                        <span class="truncate ${nameClass}" style="${nameStyle}">${escapeHtml(t.name)}</span>
                                    </div>
                                    <div class="flex items-center gap-2 shrink-0">
                                        <span class="text-[9px] font-black text-gray-500 tracking-[0.1em]">T${t.tier}</span>
                                        <span class="text-[10px] font-black text-gray-300 tabular-nums">$${t.cost}</span>
                                    </div>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    modal.classList.remove('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.remove('picks-modal-out')));
}

function closeGroupsModal() {
    const modal = document.getElementById('picks-groups-modal');
    if (!modal) return;
    modal.classList.add('picks-modal-out');
    setTimeout(() => modal.classList.add('hidden'), 250);
}

function _updateFloatingGroupsBtnVisibility() {
    const btn = document.getElementById('picks-floating-groups-btn');
    const card = document.getElementById('picks-rules-card');
    const picksPage = document.getElementById('page-picks');
    if (!btn || !card || !picksPage) return;
    if (picksPage.classList.contains('hidden')) {
        btn.classList.add('hidden');
        return;
    }
    const rect = card.getBoundingClientRect();
    // Show button as soon as the top of the rules card scrolls behind the nav bar
    if (rect.top < 80) {
        btn.classList.remove('hidden');
    } else {
        btn.classList.add('hidden');
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('picks-groups-modal');
        if (modal && !modal.classList.contains('hidden')) closeGroupsModal();
    }
});

Object.assign(window, { generatePlayerReport, openGroupsModal, closeGroupsModal, _updateFloatingGroupsBtnVisibility });

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GROUP_STAGE_SCHEDULE,
        KNOCKOUT_SCHEDULE,
        TEAM_REPORT_DATA,
        computeGroupStandings,
        _getBestThirdPlaceTeams,
        _getBestThirdSlots,
        _buildBestThirdAssignments,
        _buildFallbackBestThirdAssignments,
        _buildKnockoutResolutionContext,
        _resolveKnockoutMatchTeam,
        _findKnockoutSlotRow,
        _getKnockoutResultForSlot,
        _hasFinalScore,
        _managerBuildApiIndex,
        _managerFindApiMatch,
        _managerGetEntriesForFilter,
        _managerGetEntriesInRenderOrder,
        _managerFindDbRow,
        _managerFindImportTargetDbRow,
        _buildDerivedTeamStatusRows,
        buildTournamentAudit,
        _getFifaRank,
        _detectTiebreakerWarnings
    };
}
