const {
    getMatchPointsForTeam,
    buildTeamStageBreakdownMap,
    buildTeamPointsMap,
    buildProfilesMap,
    getDisplayProfile,
    buildLeaderboardData,
    buildBestAvailableTeamData
} = window.WorldCupScoring;

const {
    THIRD_PLACE_MAPPING
} = window.WorldCupThirdPlaceMapping || { THIRD_PLACE_MAPPING: {} };

function getTeamStatus(teamName) {
    return {
        advanced: advancedTeams.has(teamName),
        eliminated: eliminatedTeams.has(teamName)
    };
}

const teamResultsSortState = {
    'public-team-results-body': { key: 'team', direction: 'asc' }
};

const stageMultiplierLabels = {
    Group: 'x1',
    R32: 'x2',
    R16: 'x3',
    Quarters: 'x5',
    Semis: 'x8',
    Finals: 'x12'
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

    banner.className = 'rounded-3xl px-6 py-5 text-center shadow-sm';
    banner.classList.remove('hidden');
    banner.style.background = `linear-gradient(rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.75)), ${config.gradient}`;
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

// ── 2026 World Cup Group Stage Schedule ──────────────────────────────────────
// All 72 group stage matches. Dates are "YYYY-MM-DD". Teams match the names in
// the global `teams` array exactly so flag lookups work automatically.

const GROUP_STAGE_SCHEDULE = [
    // June 11
    { date: '2026-06-11', group: 'A', home: 'Mexico',         away: 'South Africa' },
    { date: '2026-06-11', group: 'A', home: 'South Korea', away: 'Czechia' },
    // June 12
    { date: '2026-06-12', group: 'B', home: 'Canada',         away: 'Bosnia' },
    { date: '2026-06-12', group: 'D', home: 'USA',  away: 'Paraguay' },
    // June 13
    { date: '2026-06-13', group: 'B', home: 'Qatar',          away: 'Switzerland' },
    { date: '2026-06-13', group: 'C', home: 'Brazil',         away: 'Morocco' },
    { date: '2026-06-13', group: 'C', home: 'Haiti',          away: 'Scotland' },
    { date: '2026-06-13', group: 'D', home: 'Australia',      away: 'Turkiye' },
    // June 14
    { date: '2026-06-14', group: 'E', home: 'Germany',        away: 'Curacao' },
    { date: '2026-06-14', group: 'E', home: 'Ivory Coast',    away: 'Ecuador' },
    { date: '2026-06-14', group: 'F', home: 'Netherlands',    away: 'Japan' },
    { date: '2026-06-14', group: 'F', home: 'Sweden',         away: 'Tunisia' },
    // June 15
    { date: '2026-06-15', group: 'G', home: 'Belgium',        away: 'Egypt' },
    { date: '2026-06-15', group: 'G', home: 'Iran',           away: 'New Zealand' },
    { date: '2026-06-15', group: 'H', home: 'Spain',          away: 'Cape Verde' },
    { date: '2026-06-15', group: 'H', home: 'Saudi Arabia',   away: 'Uruguay' },
    // June 16
    { date: '2026-06-16', group: 'I', home: 'France',         away: 'Senegal' },
    { date: '2026-06-16', group: 'I', home: 'Iraq',           away: 'Norway' },
    { date: '2026-06-16', group: 'J', home: 'Argentina',      away: 'Algeria' },
    { date: '2026-06-16', group: 'J', home: 'Austria',        away: 'Jordan' },
    // June 17
    { date: '2026-06-17', group: 'K', home: 'Portugal',       away: 'DR Congo' },
    { date: '2026-06-17', group: 'K', home: 'Uzbekistan',     away: 'Colombia' },
    { date: '2026-06-17', group: 'L', home: 'England',        away: 'Croatia' },
    { date: '2026-06-17', group: 'L', home: 'Ghana',          away: 'Panama' },
    // June 18
    { date: '2026-06-18', group: 'A', home: 'Czechia',        away: 'South Africa' },
    { date: '2026-06-18', group: 'A', home: 'Mexico',         away: 'South Korea' },
    { date: '2026-06-18', group: 'B', home: 'Switzerland',    away: 'Bosnia' },
    { date: '2026-06-18', group: 'B', home: 'Canada',         away: 'Qatar' },
    // June 19
    { date: '2026-06-19', group: 'C', home: 'Scotland',       away: 'Morocco' },
    { date: '2026-06-19', group: 'C', home: 'Brazil',         away: 'Haiti' },
    { date: '2026-06-19', group: 'D', home: 'USA',  away: 'Australia' },
    { date: '2026-06-19', group: 'D', home: 'Turkiye',         away: 'Paraguay' },
    // June 20
    { date: '2026-06-20', group: 'E', home: 'Germany',        away: 'Ivory Coast' },
    { date: '2026-06-20', group: 'E', home: 'Ecuador',        away: 'Curacao' },
    { date: '2026-06-20', group: 'F', home: 'Netherlands',    away: 'Sweden' },
    { date: '2026-06-20', group: 'F', home: 'Tunisia',        away: 'Japan' },
    // June 21
    { date: '2026-06-21', group: 'G', home: 'Belgium',        away: 'Iran' },
    { date: '2026-06-21', group: 'G', home: 'New Zealand',    away: 'Egypt' },
    { date: '2026-06-21', group: 'H', home: 'Spain',          away: 'Saudi Arabia' },
    { date: '2026-06-21', group: 'H', home: 'Uruguay',        away: 'Cape Verde' },
    // June 22
    { date: '2026-06-22', group: 'I', home: 'France',         away: 'Iraq' },
    { date: '2026-06-22', group: 'I', home: 'Norway',         away: 'Senegal' },
    { date: '2026-06-22', group: 'J', home: 'Argentina',      away: 'Austria' },
    { date: '2026-06-22', group: 'J', home: 'Jordan',         away: 'Algeria' },
    // June 23
    { date: '2026-06-23', group: 'K', home: 'Portugal',       away: 'Uzbekistan' },
    { date: '2026-06-23', group: 'K', home: 'Colombia',       away: 'DR Congo' },
    { date: '2026-06-23', group: 'L', home: 'England',        away: 'Ghana' },
    { date: '2026-06-23', group: 'L', home: 'Panama',         away: 'Croatia' },
    // June 24
    { date: '2026-06-24', group: 'A', home: 'Czechia',        away: 'Mexico' },
    { date: '2026-06-24', group: 'A', home: 'South Africa',   away: 'South Korea' },
    { date: '2026-06-24', group: 'B', home: 'Switzerland',    away: 'Canada' },
    { date: '2026-06-24', group: 'B', home: 'Bosnia', away: 'Qatar' },
    { date: '2026-06-24', group: 'C', home: 'Scotland',       away: 'Brazil' },
    { date: '2026-06-24', group: 'C', home: 'Morocco',        away: 'Haiti' },
    // June 25
    { date: '2026-06-25', group: 'D', home: 'Turkiye',         away: 'USA' },
    { date: '2026-06-25', group: 'D', home: 'Paraguay',       away: 'Australia' },
    { date: '2026-06-25', group: 'E', home: 'Curacao',        away: 'Ivory Coast' },
    { date: '2026-06-25', group: 'E', home: 'Ecuador',        away: 'Germany' },
    { date: '2026-06-25', group: 'F', home: 'Japan',          away: 'Sweden' },
    { date: '2026-06-25', group: 'F', home: 'Tunisia',        away: 'Netherlands' },
    // June 26
    { date: '2026-06-26', group: 'G', home: 'Egypt',          away: 'Iran' },
    { date: '2026-06-26', group: 'G', home: 'New Zealand',    away: 'Belgium' },
    { date: '2026-06-26', group: 'H', home: 'Cape Verde',     away: 'Saudi Arabia' },
    { date: '2026-06-26', group: 'H', home: 'Uruguay',        away: 'Spain' },
    { date: '2026-06-26', group: 'I', home: 'Norway',         away: 'France' },
    { date: '2026-06-26', group: 'I', home: 'Senegal',        away: 'Iraq' },
    // June 27
    { date: '2026-06-27', group: 'J', home: 'Jordan',         away: 'Argentina' },
    { date: '2026-06-27', group: 'J', home: 'Algeria',        away: 'Austria' },
    { date: '2026-06-27', group: 'K', home: 'Colombia',       away: 'Portugal' },
    { date: '2026-06-27', group: 'K', home: 'DR Congo',       away: 'Uzbekistan' },
    { date: '2026-06-27', group: 'L', home: 'Panama',         away: 'England' },
    { date: '2026-06-27', group: 'L', home: 'Croatia',        away: 'Ghana' },
];

// ── 2026 World Cup Knockout Stage Schedule ───────────────────────────────────
// Seedings: 1X = Group X winner, 2X = Group X runner-up.
// July 4 R32 slots are for the best 8 third-place finishers (exact pairings TBD
// after the group stage). R16 and beyond are TBD until prior results are known.

const KNOCKOUT_SCHEDULE = [
    // ── Round of 32 ─── July 1–4, 2026 ───────────────────────────────────────
    { slotKey: 'r32-01', date: '2026-07-01', stage: 'R32', home: '2A', away: '2B' },
    { slotKey: 'r32-02', date: '2026-07-01', stage: 'R32', home: '1F', away: '2C' },
    { slotKey: 'r32-03', date: '2026-07-01', stage: 'R32', home: '1C', away: '2F' },
    { slotKey: 'r32-04', date: '2026-07-01', stage: 'R32', home: '2E', away: '2I' },
    { slotKey: 'r32-05', date: '2026-07-02', stage: 'R32', home: '2K', away: '2L' },
    { slotKey: 'r32-06', date: '2026-07-02', stage: 'R32', home: '1H', away: '2J' },
    { slotKey: 'r32-07', date: '2026-07-02', stage: 'R32', home: '1J', away: '2H' },
    { slotKey: 'r32-08', date: '2026-07-02', stage: 'R32', home: '2D', away: '2G' },
    { slotKey: 'r32-09', date: '2026-07-03', stage: 'R32', home: '1E', away: 'Best 3rd', awayCandidates: ['A', 'B', 'C', 'D', 'F'] },
    { slotKey: 'r32-10', date: '2026-07-03', stage: 'R32', home: '1I', away: 'Best 3rd', awayCandidates: ['C', 'D', 'F', 'G', 'H'] },
    { slotKey: 'r32-11', date: '2026-07-03', stage: 'R32', home: '1A', away: 'Best 3rd', awayCandidates: ['C', 'E', 'F', 'H', 'I'] },
    { slotKey: 'r32-12', date: '2026-07-03', stage: 'R32', home: '1L', away: 'Best 3rd', awayCandidates: ['E', 'H', 'I', 'J', 'K'] },
    { slotKey: 'r32-13', date: '2026-07-04', stage: 'R32', home: '1D', away: 'Best 3rd', awayCandidates: ['B', 'E', 'F', 'I', 'J'] },
    { slotKey: 'r32-14', date: '2026-07-04', stage: 'R32', home: '1G', away: 'Best 3rd', awayCandidates: ['A', 'E', 'H', 'I', 'J'] },
    { slotKey: 'r32-15', date: '2026-07-04', stage: 'R32', home: '1B', away: 'Best 3rd', awayCandidates: ['E', 'F', 'G', 'I', 'J'] },
    { slotKey: 'r32-16', date: '2026-07-04', stage: 'R32', home: '1K', away: 'Best 3rd', awayCandidates: ['D', 'E', 'I', 'J', 'L'] },
    // ── Round of 16 ─── July 6–9, 2026 ───────────────────────────────────────
    { slotKey: 'r16-01', date: '2026-07-06', stage: 'R16', home: 'W:r32-01', away: 'W:r32-02' },
    { slotKey: 'r16-02', date: '2026-07-06', stage: 'R16', home: 'W:r32-03', away: 'W:r32-04' },
    { slotKey: 'r16-03', date: '2026-07-07', stage: 'R16', home: 'W:r32-05', away: 'W:r32-06' },
    { slotKey: 'r16-04', date: '2026-07-07', stage: 'R16', home: 'W:r32-07', away: 'W:r32-08' },
    { slotKey: 'r16-05', date: '2026-07-08', stage: 'R16', home: 'W:r32-09', away: 'W:r32-10' },
    { slotKey: 'r16-06', date: '2026-07-08', stage: 'R16', home: 'W:r32-11', away: 'W:r32-12' },
    { slotKey: 'r16-07', date: '2026-07-09', stage: 'R16', home: 'W:r32-13', away: 'W:r32-14' },
    { slotKey: 'r16-08', date: '2026-07-09', stage: 'R16', home: 'W:r32-15', away: 'W:r32-16' },
    // ── Quarter-finals ─── July 11–12, 2026 ──────────────────────────────────
    { slotKey: 'qf-01', date: '2026-07-11', stage: 'Quarters', home: 'W:r16-01', away: 'W:r16-02' },
    { slotKey: 'qf-02', date: '2026-07-11', stage: 'Quarters', home: 'W:r16-03', away: 'W:r16-04' },
    { slotKey: 'qf-03', date: '2026-07-12', stage: 'Quarters', home: 'W:r16-05', away: 'W:r16-06' },
    { slotKey: 'qf-04', date: '2026-07-12', stage: 'Quarters', home: 'W:r16-07', away: 'W:r16-08' },
    // ── Semi-finals ─── July 15–16, 2026 ─────────────────────────────────────
    { slotKey: 'sf-01', date: '2026-07-15', stage: 'Semis', home: 'W:qf-01', away: 'W:qf-02' },
    { slotKey: 'sf-02', date: '2026-07-16', stage: 'Semis', home: 'W:qf-03', away: 'W:qf-04' },
    // ── Third-place play-off ─── July 18, 2026 ───────────────────────────────
    { slotKey: 'finals-01', date: '2026-07-18', stage: 'Finals', home: 'L:sf-01', away: 'L:sf-02' },
    // ── Grand Final ─── July 19, 2026 ────────────────────────────────────────
    { slotKey: 'finals-02', date: '2026-07-19', stage: 'Finals', home: 'W:sf-01', away: 'W:sf-02' },
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

// Returns logged results for a knockout stage+date, sorted by id so slot
// assignment is consistent: the i-th card on a date maps to the i-th result.
function _getKnockoutDayResults(stage, date, matchesCache = _scheduleBrowserLoggedCache) {
    return (matchesCache || [])
        .filter((r) => r.stage === stage && r.match_date_manual === date)
        .sort((a, b) => {
            const dateCompare = String(a.match_date || '').localeCompare(String(b.match_date || ''));
            if (dateCompare !== 0) return dateCompare;
            return (a.id || 0) - (b.id || 0);
        });
}

function _getKnockoutScheduleMatchBySlot(slotKey) {
    return KNOCKOUT_SCHEDULE.find((match) => match.slotKey === slotKey) || null;
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

    const dayResults = _getKnockoutDayResults(scheduleMatch.stage, scheduleMatch.date, matchesCache);
    const homeRes = _resolveKnockoutMatchTeam(scheduleMatch, 'home', standings, bestThirdAssignments, { matchesCache, memo });
    const awayRes = _resolveKnockoutMatchTeam(scheduleMatch, 'away', standings, bestThirdAssignments, { matchesCache, memo });
    const expectedHome = homeRes?.status !== 'none' ? homeRes.name : '';
    const expectedAway = awayRes?.status !== 'none' ? awayRes.name : '';

    let matched = null;
    if (expectedHome && expectedAway) {
        matched = dayResults.find((result) =>
            (result.team_home === expectedHome && result.team_away === expectedAway) ||
            (result.team_home === expectedAway && result.team_away === expectedHome)
        ) || null;
    }

    if (!matched) {
        const daySchedule = KNOCKOUT_SCHEDULE.filter((match) => match.stage === scheduleMatch.stage && match.date === scheduleMatch.date);
        const slotIndex = daySchedule.findIndex((match) => match.slotKey === slotKey);
        matched = slotIndex >= 0 ? (dayResults[slotIndex] || null) : null;
    }

    memo[memoKey] = matched;
    return matched;
}

function _findKnockoutResultForMatch(scheduleMatch, standings, bestThirdAssignments, usedResultIds) {
    const dayResults = _getKnockoutDayResults(scheduleMatch.stage, scheduleMatch.date);
    const resolvedHome = _resolveKnockoutMatchTeam(scheduleMatch, 'home', standings, bestThirdAssignments);
    const resolvedAway = _resolveKnockoutMatchTeam(scheduleMatch, 'away', standings, bestThirdAssignments);
    const expectedHome = resolvedHome?.name;
    const expectedAway = resolvedAway?.name;

    if (expectedHome && expectedAway && expectedHome !== scheduleMatch.home && expectedAway !== scheduleMatch.away) {
        const matched = dayResults.find((result) => {
            if (usedResultIds.has(result.id)) return false;
            return (
                (result.team_home === expectedHome && result.team_away === expectedAway) ||
                (result.team_home === expectedAway && result.team_away === expectedHome)
            );
        });
        if (matched) {
            usedResultIds.add(matched.id);
            return matched;
        }
    }

    const nextByOrder = dayResults.find((result) => !usedResultIds.has(result.id));
    if (nextByOrder) {
        usedResultIds.add(nextByOrder.id);
        return nextByOrder;
    }

    return null;
}

// ── Group standings + knockout seeding resolution ─────────────────────────────

// Compute standings for every group from a match cache.
// status: 'none' = 0 matches played, 'partial' = some, 'complete' = all 6 played.
function computeGroupStandings(matchesCache) {
    if (matchesCache === undefined) matchesCache = _scheduleBrowserLoggedCache;
    const result = {};
    'ABCDEFGHIJKL'.split('').forEach((g) => {
        const sched = GROUP_STAGE_SCHEDULE.filter((m) => m.group === g);
        const names = [...new Set(sched.flatMap((m) => [m.home, m.away]))];
        const stats = {};
        names.forEach((n) => { stats[n] = { name: n, group: g, played: 0, pts: 0, gd: 0, gf: 0 }; });
        let logged = 0;
        sched.forEach((m) => {
            const r = matchesCache.find((r) =>
                r.stage === 'Group' &&
                ((r.team_home === m.home && r.team_away === m.away) ||
                 (r.team_home === m.away && r.team_away === m.home))
            );
            if (!r) return;
            logged++;
            const h = stats[r.team_home];
            const a = stats[r.team_away];
            if (!h || !a) return;
            h.played++; a.played++;
            h.gf += r.score_home; h.gd += r.score_home - r.score_away;
            a.gf += r.score_away; a.gd += r.score_away - r.score_home;
            if (r.score_home > r.score_away)      { h.pts += 3; }
            else if (r.score_home < r.score_away) { a.pts += 3; }
            else                                  { h.pts += 1; a.pts += 1; }
        });
        const status = logged === 0 ? 'none' : logged < sched.length ? 'partial' : 'complete';
        const sorted = Object.values(stats).sort((a, b) => {
            if (status === 'none') {
                const teamA = teams.find((team) => team.name === a.name);
                const teamB = teams.find((team) => team.name === b.name);
                return (teamB?.cost || 0) - (teamA?.cost || 0) || a.name.localeCompare(b.name);
            }
            return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name);
        });
        result[g] = { teams: sorted, status };
    });
    return result;
}

function _compareStandingRows(a, b) {
    return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name);
}

function _isStandingTie(a, b) {
    return !!a && !!b && a.pts === b.pts && a.gd === b.gd && a.gf === b.gf;
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

const THIRD_PLACE_WINNER_SLOT_MAP = {
    '1E': 'r32-09:away',
    '1I': 'r32-10:away',
    '1A': 'r32-11:away',
    '1L': 'r32-12:away',
    '1D': 'r32-13:away',
    '1G': 'r32-14:away',
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
    if (!isResolvable || !mappingEntry) return assignments;

    const officialAssignments = mappingEntry.assignments || {};
    const teamByGroup = new Map(qualifiedThirds.map((team) => [team.group, team]));
    Object.entries(officialAssignments).forEach(([winnerSeed, thirdSeed]) => {
        const slotKey = THIRD_PLACE_WINNER_SLOT_MAP[winnerSeed];
        const groupLetter = thirdSeed?.[1];
        const team = teamByGroup.get(groupLetter);
        if (slotKey && team) assignments.set(slotKey, team);
    });

    return assignments.size === slots.length ? assignments : new Map();
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

    const active   = 'border-blue-500 bg-blue-600/30 text-blue-300';
    const inactive = 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500 hover:text-gray-200';
    const current  = 'border-[1.5px] border-gray-500 text-gray-100 font-extrabold';
    const pillClasses = (filter) => {
        const stateClass = f === filter ? active : inactive;
        const currentClass = currentFilter === filter && f !== filter ? current : '';
        return `px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-colors ${stateClass} ${currentClass}`;
    };

    // ── Counts for pill labels ────────────────────────────────────────────────
    const groupDone = GROUP_STAGE_SCHEDULE.filter(_isMatchLogged).length;
    const koDone    = _scheduleBrowserLoggedCache.filter((r) => r.stage !== 'Group').length;

    // ── Filter pills ──────────────────────────────────────────────────────────
    filterEl.innerHTML = `
        <div class="flex flex-wrap gap-2">
            <button onclick="setScheduleFilter('all')"
                class="${pillClasses('all')}">
                Groups <span class="opacity-60">${groupDone}/${GROUP_STAGE_SCHEDULE.length}</span>
            </button>
            ${allGroups.map((g) => `
                <button onclick="setScheduleFilter('${g}')"
                    class="${pillClasses(g)}">
                    Grp ${g}
                </button>
            `).join('')}
        </div>
        <div class="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-800">
            <button onclick="setScheduleFilter('knockout-all')"
                class="${pillClasses('knockout-all')}">
                Knockout <span class="opacity-60">${koDone}/${KNOCKOUT_SCHEDULE.length}</span>
            </button>
            ${koStages.map((s) => `
                <button onclick="setScheduleFilter('${s}')"
                    class="${pillClasses(s)}">
                    ${koLabels[s]}
                </button>
            `).join('')}
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
    const useSeedStatusColours = !_isKnockoutFieldLocked(_standings);

    cardsEl.innerHTML = Object.entries(byDate).map(([date, matches]) => {
        let cards;

        if (isKnockout) {
            const usedResultIds = new Set();

            cards = matches.map((m) => {
                const result = _findKnockoutResultForMatch(m, _standings, _best3rdAssignments, usedResultIds);
                const isLogged = !!result;

                if (isLogged) {
                    const homeTeam = _scheduleTeam(result.team_home);
                    const awayTeam = _scheduleTeam(result.team_away);
                    return `
                        <div class="w-full rounded-2xl border border-gray-800 bg-gray-900/50 px-4 py-3">
                            <div class="flex items-center justify-between">
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

                return `
                    <button onclick="prefillFromSchedule('${enterHomeName}','${enterAwayName}','${m.stage}','${m.date}')"
                        class="w-full text-left rounded-2xl border border-gray-700 bg-gray-800 hover:border-blue-500/50 hover:bg-gray-700 active:scale-[0.99] px-4 py-3 transition-all">
                        <div class="flex items-center justify-between">
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

            if (logged) {
                return `
                    <div class="w-full rounded-2xl border border-gray-800 bg-gray-900/50 px-4 py-3">
                        <div class="flex items-center justify-between">
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
    const useSeedStatusColours = !_isKnockoutFieldLocked(standings);
    if (guide) guide.classList.toggle('hidden', !useSeedStatusColours);

    const SLOT_H = 68;
    const TOTAL_H = SLOT_H * 16;
    const HEADER_H = 64;
    const CARD_H = 66;
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
                    ${matchTag}
                    <div onclick="showTeamOwners('${logged.team_home.replace(/'/g, "\\'")}')" class="cursor-pointer px-2.5 py-1.5 flex items-center justify-between gap-1 ${hWon ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'} transition-colors">
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
                    <div onclick="showTeamOwners('${logged.team_away.replace(/'/g, "\\'")}')" class="cursor-pointer px-2.5 py-1.5 flex items-center justify-between gap-1 ${aWon ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'} transition-colors">
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
            const clickAttr = `onclick="showTeamOwners('${res.name.replace(/'/g, "\\'")}')" class="cursor-pointer px-2.5 py-1.5 flex items-center gap-1.5 min-w-0 ${rowTone} hover:brightness-95 transition-all"`;
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
                ${matchTag}
                ${_teamRow(homeRes, rawHomeLabel)}
                <div class="h-px bg-gray-100"></div>
                ${_teamRow(awayRes, rawAwayLabel)}
            </div>`;
    };

    const columnMarkup = stageLayouts.map(({ stage, label, units, width, left }) => {
        const schedMatches = KNOCKOUT_SCHEDULE.filter((m) => m.stage === stage);
        const loggedStage = matchesCache.filter((r) => r.stage === stage).sort((a, b) => a.id - b.id);
        const blockH = SLOT_H * units;
        const sceneMidY = HEADER_H + (TOTAL_H / 2);

        const cards = schedMatches.map((m, slotIdx) => {
            const logged = loggedStage[slotIdx] || null;
            let homeRes, awayRes;

            if (!logged) {
                homeRes = _resolveKnockoutMatchTeam(m, 'home', standings, best3rdAssignments, { matchesCache });
                awayRes = _resolveKnockoutMatchTeam(m, 'away', standings, best3rdAssignments, { matchesCache });
            }

            const meta = {
                width: stage === 'Finals'
                    ? (slotIdx === 1 ? CARD_W + 12 : CARD_W - 6)
                    : CARD_W,
                label: stage === 'Finals'
                    ? (slotIdx === 0 ? 'Third Place Match' : 'World Cup Final')
                    : '',
                isThirdPlace: stage === 'Finals' && slotIdx === 0,
                isTitleMatch: stage === 'Finals' && slotIdx === 1
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

    showAdminTab('matches');

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

function syncAdminToggleControls() {
    const lockToggle = document.getElementById('admin-lock-picks-toggle');
    const autoLockToggle = document.getElementById('admin-auto-lock-toggle');
    const hideTeamSelectionToggle = document.getElementById('admin-hide-team-selection-toggle');
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

    if (autoTeamStatusToggle) {
        autoTeamStatusToggle.checked = Boolean(appSettings.autoTeamStatusSync);
    }
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

    if (tabId === 'schedule') {
        _syncScheduleFilterTop();
        _syncScheduleBrowserToCurrentProgress();
    }
    if (tabId === 'verify') fetchAdminKnockoutVerify();
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

    const tabLabels = { groups: 'Results by Group', bracket: 'Bracket', pool: 'Results Table', matches: 'Match Results', selection: 'Selection Stats' };
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
    fetchPublicSelectionStats();
}

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

async function exportAllTables() {
    const button = document.getElementById('admin-export-all-btn');
    const tables = ['profiles', 'picks', 'matches', 'messages', 'notifications', 'app_settings', 'team_advancement'];

    if (button) {
        button.disabled = true;
        button.textContent = 'Exporting...';
    }

    try {
        for (const tableName of tables) {
            const { data, error } = await supabaseClient.from(tableName).select('*');
            if (error) {
                throw error;
            }

            const rows = data || [];
            const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
            const csvRows = [headers];

            rows.forEach((row) => {
                csvRows.push(headers.map((header) => row[header]));
            });

            downloadCsv(`wc-pool-${tableName}.csv`, csvRows);
        }

        showToast('CSV exports downloaded.', 'success');
    } catch (error) {
        showToast(error.message || 'Unable to export data.');
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = 'Export All Tables';
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
            hideTeamSelection: appSettings.hideTeamSelection
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
            hideTeamSelection: appSettings.hideTeamSelection
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
            hideTeamSelection: checked
        });
        syncAdminToggleControls();
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
        .filter((match) => match.stage !== 'Group' && match.score_home !== match.score_away)
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
    appSettings.autoTeamStatusSync = Boolean(checked);
    try {
        localStorage.setItem('wc_pool_auto_team_status_sync', checked ? 'true' : 'false');
    } catch (error) {
        // Ignore localStorage failures and keep the in-memory toggle for this session.
    }

    if (checked) {
        try {
            await syncDerivedTeamStatus({ silent: true });
            showToast('Auto team sync enabled.', 'success');
        } catch (error) {
            appSettings.autoTeamStatusSync = false;
            try {
                localStorage.setItem('wc_pool_auto_team_status_sync', 'false');
            } catch (_storageError) {
                // Ignore storage cleanup failures.
            }
            const toggle = document.getElementById('admin-auto-team-status-toggle');
            if (toggle) toggle.checked = false;
            showToast(error.message || 'Unable to enable auto team sync.');
            return;
        }
    } else {
        showToast('Auto team sync disabled.', 'success');
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
    const squadStripEl = document.getElementById('dashboard-squad-strip');
    const prizePotEl = document.getElementById('dashboard-prize-pot');
    const playerCountEl = document.getElementById('dashboard-player-count');
    const prizeFirstEl = document.getElementById('dashboard-prize-1st');
    const prizeSecondEl = document.getElementById('dashboard-prize-2nd');
    const prizeThirdEl = document.getElementById('dashboard-prize-3rd');
    const ctaButton = document.getElementById('dashboard-primary-cta');
    const leaderboardEl = document.getElementById('dashboard-leaderboard');
    const resultsEl = document.getElementById('dashboard-latest-results');
    const mostPickedEl = document.getElementById('dashboard-most-picked');

    // Skeleton cards replace text loading states so the dashboard layout doesn't flash blank
    const dashSkeletonCard = `
        <div class="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 flex items-center justify-between gap-4">
            <div class="space-y-2">
                <div class="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div class="h-3 w-16 bg-gray-100 rounded animate-pulse"></div>
            </div>
            <div class="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
        </div>`;
    if (leaderboardEl) leaderboardEl.innerHTML = dashSkeletonCard.repeat(3);
    if (resultsEl) resultsEl.innerHTML = dashSkeletonCard.repeat(3);
    if (mostPickedEl) mostPickedEl.innerHTML = dashSkeletonCard.repeat(5);
    if (squadStripEl) squadStripEl.innerHTML = '<div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Loading squad...</div>';

    if (saveStatusEl) {
        const sourceSaveStatus = document.getElementById('save-status');
        saveStatusEl.textContent = sourceSaveStatus ? sourceSaveStatus.textContent : 'No changes yet';
    }

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
        const profilesMap = buildProfilesMap(allProfiles);
        const selectionStats = buildSelectionStatsSnapshot(picks, allProfiles || []);
        const teamOwnership = new Map();
        selectionStats.sortedCountryCounts.forEach((entry) => {
            teamOwnership.set(entry.teamName, {
                pickedCount: entry.pickedCount,
                percentage: entry.percentage
            });
        });
        await fetchAdvancedTeams();
        const teamPointsMap = buildTeamPointsMap(matches, teams, advancedTeams);
        const leaderboardData = buildLeaderboardData(picks, matches, profilesMap, teams, advancedTeams, eliminatedTeams);
        const currentUserRows = picks.filter((pick) => pick.user_email === userEmail);
        const currentProfile = getDisplayProfile(userEmail, profilesMap);
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
                <div class="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 ${alignClass}">
                    ${pickedCount} picked${selectionStats.totalPlayers > 0 ? ` · ${percentage}%` : ''}
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
            return `${awardedPoints} pts awarded`;
        };
        const renderDashboardMatchCard = (match, { squadNames = null } = {}) => {
            const homeTeam = teams.find((team) => team.name === match.team_home);
            const awayTeam = teams.find((team) => team.name === match.team_away);
            const isHomeMine = squadNames?.has(match.team_home);
            const isAwayMine = squadNames?.has(match.team_away);
            const stageLabel = _getMatchStageDisplayLabel(match);
            const scoreMarkup = match.is_finished
                ? `${match.score_home}-${match.score_away}`
                : (match.match_date_manual || 'TBD');

            return `
                <div class="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                    <div class="flex items-center justify-between gap-3">
                        <div class="theme-accent-text text-[9px] font-black uppercase tracking-[0.18em]">${match.match_date_manual || 'TBD'} | ${stageLabel}</div>
                        <div class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 whitespace-nowrap">
                            ${buildPointsAwardedLabel(match)}
                        </div>
                    </div>
                    <div class="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-sm font-black text-gray-900">
                        <div class="min-w-0 text-left ${isHomeMine ? 'font-black' : ''}">
                            <div class="truncate">${homeTeam?.flag || ''} ${match.team_home}</div>
                            ${ownershipMarkup(match.team_home, 'left')}
                        </div>
                        <div class="text-center">
                            <div class="rounded-xl bg-gray-900 px-2.5 py-1 font-mono text-white text-center text-[13px]">
                                ${scoreMarkup}
                            </div>
                        </div>
                        <div class="min-w-0 text-right ${isAwayMine ? 'font-black' : ''}">
                            <div class="truncate">${match.team_away} ${awayTeam?.flag || ''}</div>
                            ${ownershipMarkup(match.team_away, 'right')}
                        </div>
                    </div>
                    ${match.was_extra_time ? '<div class="mt-2 text-[8px] font-black uppercase text-red-500 italic text-right">ET/Pens Result</div>' : ''}
                </div>
            `;
        };

        // ── My Teams Today ────────────────────────────────────────────────────
        const teamsTodaySection = document.getElementById('dashboard-teams-today-section');
        const teamsTodayEl = document.getElementById('dashboard-teams-today');
        const teamsTodayLabel = document.getElementById('dashboard-teams-today-label');
        if (teamsTodayEl && liveSquad.length > 0) {
            const squadNames = new Set(liveSquad.map((t) => t.name));
            const squadMatches = matches
                .filter((match) =>
                    match?.match_date_manual && (squadNames.has(match.team_home) || squadNames.has(match.team_away))
                )
                .sort((a, b) => getMatchSortKey(a).localeCompare(getMatchSortKey(b)));
            const previousMatches = squadMatches
                .filter((match) => match.is_finished || match.match_date_manual < localTodayKey)
                .sort((a, b) => getMatchSortKey(b).localeCompare(getMatchSortKey(a)))
                .slice(0, 3);
            const standings = computeGroupStandings(matches);
            const bestThirdAssignments = _buildBestThirdAssignments(standings);
            const loggedKeySet = new Set(
                matches
                    .filter((match) => match?.match_date_manual)
                    .map((match) => `${match.stage}|${match.match_date_manual}|${match.team_home}|${match.team_away}`)
            );
            const upcomingGroupMatches = GROUP_STAGE_SCHEDULE
                .filter((match) =>
                    match.date >= localTodayKey &&
                    (squadNames.has(match.home) || squadNames.has(match.away)) &&
                    !loggedKeySet.has(`Group|${match.date}|${match.home}|${match.away}`) &&
                    !loggedKeySet.has(`Group|${match.date}|${match.away}|${match.home}`)
                )
                .map((match) => ({
                    stage: 'Group',
                    match_date_manual: match.date,
                    team_home: match.home,
                    team_away: match.away,
                    is_finished: false,
                    was_extra_time: false
                }));
            const upcomingKnockoutMatches = KNOCKOUT_SCHEDULE
                .filter((match) => match.date >= localTodayKey)
                .map((match) => {
                    const homeRes = _resolveKnockoutMatchTeam(match, 'home', standings, bestThirdAssignments, { matchesCache: matches });
                    const awayRes = _resolveKnockoutMatchTeam(match, 'away', standings, bestThirdAssignments, { matchesCache: matches });
                    return {
                        stage: match.stage,
                        match_date_manual: match.date,
                        team_home: homeRes?.status !== 'none' ? homeRes.name : 'TBD',
                        team_away: awayRes?.status !== 'none' ? awayRes.name : 'TBD',
                        is_finished: false,
                        was_extra_time: false
                    };
                })
                .filter((match) =>
                    (squadNames.has(match.team_home) || squadNames.has(match.team_away)) &&
                    !loggedKeySet.has(`${match.stage}|${match.match_date_manual}|${match.team_home}|${match.team_away}`) &&
                    !loggedKeySet.has(`${match.stage}|${match.match_date_manual}|${match.team_away}|${match.team_home}`)
                );
            const upcomingMatches = [...upcomingGroupMatches, ...upcomingKnockoutMatches]
                .sort((a, b) => getMatchSortKey(a).localeCompare(getMatchSortKey(b)))
                .slice(0, 3);

            if (teamsTodaySection) teamsTodaySection.classList.remove('hidden');

            if (upcomingMatches.length === 0 && previousMatches.length === 0) {
                teamsTodayEl.innerHTML = '<div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">No matches found for your squad</div>';
                if (teamsTodayLabel) {
                    teamsTodayLabel.textContent = 'Upcoming and recent matches for your squad';
                }
            } else {
                if (teamsTodayLabel) {
                    teamsTodayLabel.textContent = 'Recent and upcoming matches for your squad';
                }

                teamsTodayEl.innerHTML = `
                    <div class="space-y-3">
                        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Last Games</div>
                        ${previousMatches.length > 0
                            ? previousMatches.map((match) => renderDashboardMatchCard(match, { squadNames })).join('')
                            : '<div class="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">No previous squad matches yet</div>'}
                    </div>
                    <div class="space-y-3">
                        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Next Games</div>
                        ${upcomingMatches.length > 0
                            ? upcomingMatches.map((match) => renderDashboardMatchCard(match, { squadNames })).join('')
                            : '<div class="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">No upcoming squad matches</div>'}
                    </div>
                `;
            }
        }

        const spent = liveSquad.reduce((sum, team) => sum + team.cost, 0);
        const tierThreeCount = liveSquad.filter((team) => team.tier === 3).length;
        const myPoints = currentUserRows.reduce((sum, pick) => sum + (teamPointsMap[pick.team_name] || 0), 0);
        const myRank = leaderboardData.findIndex((entry) => entry.email === userEmail);
        const hasUnsaved = typeof saveState !== 'undefined' && (saveState.picksDirty || saveState.identityDirty);

        if (myPointsEl) myPointsEl.textContent = `${myPoints}`;
        if (myRankEl) myRankEl.textContent = myRank >= 0 ? `#${myRank + 1}` : '-';
        if (squadSizeEl) squadSizeEl.textContent = `${liveSquad.length}`;
        if (budgetLeftEl) budgetLeftEl.textContent = `$${150 - spent}`;

        if (squadStripEl) {
            squadStripEl.innerHTML = liveSquad.length > 0
                ? liveSquad
                    .sort((a, b) => b.cost - a.cost || a.name.localeCompare(b.name))
                    .map((team) => `
                        <div class="min-w-[58px] text-center">
                            <div class="text-3xl">${team.flag}</div>
                            <div class="mt-1 text-[9px] font-black uppercase tracking-[0.15em] text-gray-900">T${team.tier} · $${team.cost}</div>
                        </div>
                    `)
                    .join('')
                : '<div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">No squad selected yet</div>';
        }

        const playerCount = leaderboardData.length;
        if (prizePotEl) prizePotEl.textContent = `$${(playerCount * 40).toLocaleString()}`;
    if (playerCountEl) playerCountEl.textContent = `${playerCount} ${playerCount === 1 ? 'entry' : 'entries'} in the pool`;
        if (prizeFirstEl) prizeFirstEl.textContent = `$${Math.floor(playerCount * 40 * 0.65).toLocaleString()}`;
        if (prizeSecondEl) prizeSecondEl.textContent = `$${Math.floor(playerCount * 40 * 0.25).toLocaleString()}`;
        if (prizeThirdEl) prizeThirdEl.textContent = `$${Math.floor(playerCount * 40 * 0.10).toLocaleString()}`;

        if (welcome) {
            if (!myEntry && liveSquad.length === 0) {
                welcome.textContent = 'Start building your squad, save your picks, and track the pool from one place.';
            } else if (!myEntry) {
                welcome.textContent = 'Your current squad is local to this browser until you save it to the pool.';
            } else if (hasUnsaved) {
                welcome.textContent = `${currentProfile.nickname || myEntry?.nickname || 'Manager'}, you have unsaved changes in your squad right now.`;
            } else {
                welcome.textContent = `${currentProfile.nickname || myEntry?.nickname || 'Manager'}, you are currently ranked #${myRank + 1} with ${myPoints} points.`;
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
            const rankStyles = [
                { border: 'border-yellow-200', bg: '#fffbeb', bar: '#f59e0b', rankColor: '#b45309', medal: '🥇' },
                { border: 'border-gray-200',   bg: '#f8fafc', bar: '#94a3b8', rankColor: '#475569', medal: '🥈' },
                { border: 'border-orange-100', bg: '#fff7f0', bar: '#f97316', rankColor: '#c2410c', medal: '🥉' },
            ];
            leaderboardEl.innerHTML = leaders.map((entry, index) => {
                const s = rankStyles[index] || rankStyles[2];
                return `
                <div class="relative flex items-center justify-between gap-4 rounded-2xl border ${s.border} overflow-hidden px-4 py-4" style="background-color: ${s.bg};">
                    <div class="absolute left-0 top-0 bottom-0 w-[3px]" style="background-color: ${s.bar};"></div>
                    <div class="min-w-0 pl-2">
                        <div class="flex items-center gap-1.5">
                            <span class="text-base leading-none">${s.medal}</span>
                            <span class="text-[10px] font-black uppercase tracking-[0.2em]" style="color: ${s.rankColor};">#${index + 1}</span>
                        </div>
                        <div class="truncate text-lg font-black uppercase italic text-gray-900">${entry.nickname}</div>
                        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">${entry.realname}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-black text-gray-900">${entry.totalPoints}</div>
                        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Pts</div>
                    </div>
                </div>`;
            }).join('') || '<div class="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">No leaderboard data yet</div>';
        }

        if (resultsEl) {
            resultsEl.innerHTML = matches
                .filter((match) => match.is_finished)
                .slice(0, 3)
                .map((match) => renderDashboardMatchCard(match))
                .join('') || '<div class="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">No results logged yet</div>';
        }

        if (mostPickedEl) {
            if (appSettings.hideTeamSelection) {
                mostPickedEl.innerHTML = `
                    <div class="flex h-[382px] items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 px-6 text-center">
                        <div class="max-w-xs">
                            <div class="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Hidden For Now</div>
                            <div class="mt-3 text-sm font-black uppercase tracking-[0.08em] text-gray-500">Pick selection statistics will be displayed when the World Cup starts.</div>
                        </div>
                    </div>
                `;
                return;
            }

            const topTeams = selectionStats.sortedCountryCounts.slice(0, 5);
            const maxPickedCount = topTeams[0]?.pickedCount || 1;

            mostPickedEl.innerHTML = topTeams.map((entry, i) => {
                const name = entry.teamName;
                const count = entry.pickedCount;
                const team = entry.teamData || teams.find((teamEntry) => teamEntry.name === name);
                const barPct = Math.round((count / maxPickedCount) * 100);
                const ownPct = entry.percentage;
                const barOpacity = i === 0 ? '0.12' : '0.07';
                return `
                    <div class="relative rounded-2xl border border-gray-100 overflow-hidden px-4 py-3.5" style="background-color: #f9fafb;">
                        <div class="absolute inset-0 rounded-2xl" style="width: ${barPct}%; background-color: rgba(var(--theme-accent-primary-rgb), ${barOpacity});"></div>
                        <div class="relative flex items-center justify-between gap-3">
                            <div class="flex min-w-0 items-center gap-3">
                                <span class="text-2xl">${team?.flag || ''}</span>
                                <div class="truncate text-sm font-black uppercase text-gray-900">${name}</div>
                            </div>
                            <div class="flex items-center gap-2 shrink-0">
                                <span class="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">${ownPct}%</span>
                                <div class="theme-solid-badge rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">${count}</div>
                            </div>
                        </div>
                    </div>`;
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
    const keys = ['team', 'group', 'pickedPct', 'total', 'G1', 'G2', 'G3', 'Bonus', 'R32', 'R16', 'QF', 'SM', 'F'];

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

    return `
        <div class="min-w-[92px] py-1 text-center">
            <div class="text-[15px] font-black ${pointsClass} leading-none">${points}</div>
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

    const knockoutStageMap = {
        R32: 'R32',
        R16: 'R16',
        Quarters: 'QF',
        Semis: 'SM',
        Finals: 'F'
    };

    body.innerHTML = '<tr><td colspan="13" class="px-4 py-8 text-center text-gray-500 uppercase text-xs">Loading team results...</td></tr>';

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

        const rows = [...teams]
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

                return {
                    team,
                    totalPoints,
                    pickedPct,
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
                            <div class="flex items-center gap-3">
                                <span class="text-2xl">${team.flag}</span>
                                <div>
                                    <div class="text-[12px] font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-gray-900'}">
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

        const sortState = teamResultsSortState[targetId];
        if (sortState) {
            rows.sort((a, b) => {
                let comparison = 0;

                if (sortState.key === 'team') {
                    comparison = a.team.name.localeCompare(b.team.name);
                } else if (sortState.key === 'group') {
                    comparison = a.team.group.localeCompare(b.team.group);
                } else if (sortState.key === 'pickedPct') {
                    comparison = a.pickedPct - b.pickedPct;
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

        body.innerHTML = rows.map((row) => row.html).join('') || '<tr><td colspan="13" class="px-4 py-8 text-center text-gray-500 uppercase text-xs">No teams found.</td></tr>';

        if (targetId === 'public-team-results-body') {
            updateResultsSelectionVisibility();
            updatePublicTeamSortIndicators();
        }
    } catch (error) {
        body.innerHTML = '<tr><td colspan="13" class="px-4 py-8 text-center text-red-400 uppercase text-xs">Could not load team results.</td></tr>';
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

        ({ error } = await supabaseClient.from('matches').insert(allRows));
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
                    return `
                        <div class="bg-gray-800 rounded-2xl border border-gray-700 px-4 py-3 ${highlightLatest && index === 0 ? 'result-flash' : ''}">
                            <div class="grid grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)_24px] md:grid-cols-[minmax(0,1fr)_128px_minmax(0,1fr)_24px] items-center gap-3">
                                <div class="text-left min-w-0">
                                    <div class="text-sm md:text-base font-black text-white truncate">${homeTeam?.flag || ''} ${match.team_home}</div>
                                    ${ownershipMarkup(match.team_home)}
                                </div>
                                <div class="text-center">
                                    <div class="text-[8px] font-black uppercase tracking-[0.15em] text-gray-500 mb-1">${stageLabel}</div>
                                    <div class="bg-gray-950 text-white font-mono font-black text-sm md:text-base tabular-nums px-2.5 py-1 rounded-lg text-center">${match.score_home} – ${match.score_away}</div>
                                    <div class="mt-1 text-[8px] font-black uppercase tracking-[0.12em] text-gray-500">${buildPointsLabel(match)}</div>
                                    ${match.was_extra_time ? '<div class="mt-0.5 text-[8px] font-black uppercase text-red-400">E/P</div>' : ''}
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

                    return `
                        <div class="rounded-[24px] border border-gray-200 bg-white px-3 py-2.5 md:px-4 md:py-3 text-left">
                            <div class="grid grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)] items-center gap-2.5 md:grid-cols-[minmax(180px,1fr)_108px_minmax(180px,1fr)] md:gap-4">
                                <div class="min-w-0 text-left">
                                    <div class="text-[13px] md:text-base font-black leading-tight truncate">${homeTeam?.flag || ''} ${match.team_home}</div>
                                    ${ownershipMarkup(match.team_home)}
                                </div>
                                <div class="text-center">
                                    <div class="mb-1 text-[8px] font-black uppercase tracking-[0.16em] text-gray-400">
                                        ${stageLabel}
                                    </div>
                                    <div class="rounded-lg bg-gray-900 px-2 py-1 text-center font-mono text-sm md:text-lg font-black tabular-nums text-white">
                                        ${match.score_home} - ${match.score_away}
                                    </div>
                                    <div class="mt-1 text-[8px] font-black uppercase tracking-[0.12em] text-gray-400">
                                        ${buildPointsAwardedLabel(match)}
                                    </div>
                                </div>
                                <div class="min-w-0 text-right">
                                    <div class="text-[13px] md:text-base font-black leading-tight truncate">${match.team_away} ${awayTeam?.flag || ''}</div>
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
                was_extra_time: wasExtraTime
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
                was_extra_time: wasExtraTime
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

async function fetchLeaderboard() {
    const body = document.getElementById('leaderboard-body');
    // Show animated placeholder rows while scores are calculated.
    // Columns: rank, points, player+squad, then 7 stage-points cols (G, Bonus, R32, R16, QF, SM, F)
    const skeletonCell = '<td class="px-4 py-4 text-center"><div class="h-4 w-6 bg-gray-200 rounded animate-pulse mx-auto"></div></td>';
    const skeletonRow = `
        <tr class="border-b border-gray-100">
            <td class="w-[88px] px-4 py-4 text-center"><div class="h-5 w-6 bg-gray-200 rounded animate-pulse mx-auto"></div></td>
            <td class="w-[92px] px-4 py-4 text-center"><div class="h-6 w-10 bg-gray-200 rounded animate-pulse mx-auto"></div></td>
            <td class="px-6 py-4"><div class="space-y-2"><div class="h-4 w-28 bg-gray-200 rounded animate-pulse"></div><div class="h-3 w-20 bg-gray-100 rounded animate-pulse"></div></div></td>
            ${skeletonCell.repeat(7)}
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
            supabaseClient.from('profiles').select('email, nickname, realname, has_paid, avatar_url, updated_at')
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
        let leaderboardData = buildLeaderboardData(allPicks || [], allMatches || [], profilesMap, teams, advancedTeams, eliminatedTeams);
        const bestAvailableTeam = buildBestAvailableTeamData(allMatches || [], teams, advancedTeams, eliminatedTeams);
        const playerCount = leaderboardData.length;
        const search = document.getElementById('leaderboard-search').value.toLowerCase();
        const countryFilter = document.getElementById('leaderboard-country-filter');
        const filter = countryFilter?.value || '';

        if (countryFilter) {
            countryFilter.disabled = Boolean(appSettings.hideTeamSelection);
            countryFilter.classList.toggle('opacity-50', Boolean(appSettings.hideTeamSelection));
        }

        if (search) {
            leaderboardData = leaderboardData.filter((user) => (
                user.nickname.toLowerCase().includes(search) || user.realname.toLowerCase().includes(search)
            ));
        }

        if (!appSettings.hideTeamSelection && filter) {
            leaderboardData = leaderboardData.filter((user) => (
                user.squad.some((squadTeam) => teams.find((team) => team.flag === squadTeam.flag).name === filter)
            ));
        }

        const totalPot = playerCount * 40;

        document.getElementById('total-players-count').innerText = playerCount;
        document.getElementById('total-prize-pot').innerText = `$${totalPot.toLocaleString()}`;
        document.getElementById('prize-1st').innerText = `$${Math.floor(totalPot * 0.65).toLocaleString()}`;
        document.getElementById('prize-2nd').innerText = `$${Math.floor(totalPot * 0.25).toLocaleString()}`;
        document.getElementById('prize-3rd').innerText = `$${Math.floor(totalPot * 0.10).toLocaleString()}`;

        const renderSquadSummary = (user, muted = false) => {
            if (appSettings.hideTeamSelection) {
                return '<div class="text-[8px] font-black uppercase tracking-[0.18em] text-gray-400">Teams to be displayed when WC starts</div>';
            }

            const sortedSquad = [...user.squad].sort((a, b) => b.cost - a.cost || a.name.localeCompare(b.name));
            const remainingFlags = sortedSquad.filter((team) => !team.eliminated).map((team) => `<span class="text-lg">${team.flag}</span>`).join('');
            const eliminatedFlags = sortedSquad.filter((team) => team.eliminated).map((team) => `<span class="text-lg opacity-70">${team.flag}</span>`).join('');
            const remainingTone = muted ? 'text-gray-400' : 'text-gray-500';
            const eliminatedTone = muted ? 'text-gray-300' : 'text-gray-400';

            return `
                <div class="space-y-1 text-left">
                    <div class="text-[8px] font-black uppercase tracking-[0.18em] ${remainingTone}">Remaining: <span class="ml-1 inline-flex gap-1 align-middle">${remainingFlags || '<span class="text-gray-300">-</span>'}</span></div>
                    <div class="text-[8px] font-black uppercase tracking-[0.18em] ${eliminatedTone}">Eliminated: <span class="ml-1 inline-flex gap-1 align-middle">${eliminatedFlags || '<span class="text-gray-300">-</span>'}</span></div>
                </div>
            `;
        };

        const bestRowMarkup = bestAvailableTeam ? `
            <tr class="border-b border-gray-100 bg-gray-50 text-left text-gray-700">
                <td class="w-[88px] px-4 py-4 text-center text-[1.45rem] font-black text-gray-400">-</td>
                <td class="w-[92px] px-4 py-4 text-center font-mono text-[1.45rem] font-black text-gray-500">${bestAvailableTeam.totalPoints}</td>
                <td class="px-6 py-4 text-left">
                    <div class="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400 text-left">${bestAvailableTeam.nickname}</div>
                    <div class="mt-2 text-left">
                        ${renderSquadSummary(bestAvailableTeam, true)}
                    </div>
                </td>
                <td class="px-4 py-4 text-center font-black text-gray-500">${(bestAvailableTeam.stagePoints.G1 + bestAvailableTeam.stagePoints.G2 + bestAvailableTeam.stagePoints.G3) || '-'}</td>
                <td class="px-4 py-4 text-center font-black text-gray-500">${bestAvailableTeam.stagePoints.Bonus || '-'}</td>
                <td class="px-4 py-4 text-center font-black text-gray-500">${bestAvailableTeam.stagePoints.R32 || '-'}</td>
                <td class="px-4 py-4 text-center font-black text-gray-500">${bestAvailableTeam.stagePoints.R16 || '-'}</td>
                <td class="px-4 py-4 text-center font-black text-gray-500">${bestAvailableTeam.stagePoints.QF || '-'}</td>
                <td class="px-4 py-4 text-center font-black text-gray-500">${bestAvailableTeam.stagePoints.SM || '-'}</td>
                <td class="px-4 py-4 text-center font-black text-gray-500">${bestAvailableTeam.stagePoints.F || '-'}</td>
            </tr>
        ` : '';

        let displayRank = 0;
        let previousPoints = null;

        // Load previous rank snapshot from localStorage for change arrows
        const previousRanks = JSON.parse(localStorage.getItem('wc_pool_lb_ranks') || '{}');
        const newRanks = {};

        body.innerHTML = bestRowMarkup + (leaderboardData.map((user, index) => {
            if (user.totalPoints !== previousPoints) {
                displayRank = index + 1;
                previousPoints = user.totalPoints;
            }

            newRanks[user.email] = displayRank;

            // Compute rank change indicator
            const prevRank = previousRanks[user.email];
            let rankIndicator;
            if (prevRank === undefined || prevRank === null) {
                rankIndicator = '';
            } else {
                const delta = prevRank - displayRank;
                if (delta > 0) rankIndicator = `<span class="text-green-500 text-xs font-black">↑${delta}</span>`;
                else if (delta < 0) rankIndicator = `<span class="text-red-400 text-xs font-black">↓${Math.abs(delta)}</span>`;
                else rankIndicator = '';
            }

            const rowTone = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';

            return `
            <tr class="theme-hover-row ${rowTone} border-b border-gray-100 transition-colors text-left text-gray-900 cursor-pointer" onclick="showPlayerProfile('${user.email}')">
                <td class="theme-accent-text w-[88px] px-4 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <div class="w-5 text-right">${rankIndicator}</div>
                        <div class="text-[1.45rem] font-black">#${displayRank}</div>
                    </div>
                </td>
                <td class="theme-accent-text w-[92px] px-4 py-4 text-center font-mono text-[1.45rem] font-black">${user.totalPoints}</td>
                <td class="px-6 py-4 text-left">
                    <div class="text-lg font-black uppercase text-left text-gray-900">${user.nickname}</div>
                    <div class="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400 text-left">${user.realname}</div>
                    <div class="mt-2 text-left">
                        ${renderSquadSummary(user)}
                    </div>
                </td>
                <td class="px-4 py-4 text-center font-black text-gray-900">${(user.stagePoints.G1 + user.stagePoints.G2 + user.stagePoints.G3) || '-'}</td>
                <td class="px-4 py-4 text-center font-black text-gray-900">${user.stagePoints.Bonus || '-'}</td>
                <td class="px-4 py-4 text-center font-black text-gray-900">${user.stagePoints.R32 || '-'}</td>
                <td class="px-4 py-4 text-center font-black text-gray-900">${user.stagePoints.R16 || '-'}</td>
                <td class="px-4 py-4 text-center font-black text-gray-900">${user.stagePoints.QF || '-'}</td>
                <td class="px-4 py-4 text-center font-black text-gray-900">${user.stagePoints.SM || '-'}</td>
                <td class="px-4 py-4 text-center font-black text-gray-900">${user.stagePoints.F || '-'}</td>
            </tr>
        `;
        }).join('') || '<tr><td colspan="10" class="p-8 text-center text-gray-900">No players found</td></tr>');

        // Persist ranks for next page load comparison, cache data for player profile modal
        localStorage.setItem('wc_pool_lb_ranks', JSON.stringify(newRanks));
        window._leaderboardData = leaderboardData;
    } catch (error) {
        body.innerHTML = '<tr><td colspan="10" class="p-8 text-center text-red-500 text-gray-900">Error calculating scores</td></tr>';
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

    wrapper.innerHTML = `
        <div class="flex items-start gap-1 ${isMe ? 'justify-end' : 'justify-start'}">
            ${isMe ? addBtnContainer + bubble : bubble + addBtnContainer}
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

    // Squad section
    let squadHtml = '';
    let budgetUsed = 0;
    if (playerEntry?.squad?.length > 0) {
        budgetUsed = playerEntry.squad.reduce((sum, t) => sum + (t.cost || 0), 0);
        squadHtml = playerEntry.squad
            .sort((a, b) => (b.cost || 0) - (a.cost || 0) || a.name.localeCompare(b.name))
            .map((t) => `
                <div class="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 flex items-center gap-2 ${t.eliminated ? 'opacity-40' : ''}">
                    <span class="text-xl">${t.flag || ''}</span>
                    <div class="flex-1 min-w-0">
                        <div class="text-xs font-black uppercase text-white truncate">${escapeHtml(t.name)}</div>
                        <div class="text-[10px] font-bold text-gray-400">T${t.tier} · $${t.cost}${t.eliminated ? ' · out' : ''}</div>
                    </div>
                </div>
            `).join('');
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
        <div class="px-6 pb-5">
            <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Budget Used</span>
                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-white">$${budgetUsed} / $150</span>
            </div>
            <div class="h-2 rounded-full bg-gray-800 overflow-hidden">
                <div class="h-full rounded-full" style="width: ${Math.round(budgetUsed / 150 * 100)}%; background-color: var(--theme-accent-primary);"></div>
            </div>
        </div>` : '';

    content.innerHTML = `
        <div class="p-6 space-y-5">
            <div class="flex items-center gap-4">
                <div class="h-14 w-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style="background-color: rgba(var(--theme-accent-primary-rgb), 0.15);">
                    ${favFlag || '👤'}
                </div>
                <div class="min-w-0 flex-1">
                    <div class="text-2xl font-black uppercase italic tracking-tight text-white truncate">${escapeHtml(nickname)}</div>
                    ${realname ? `<div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">${escapeHtml(realname)}</div>` : ''}
                    <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        ${profile?.favorite_team ? `<span class="text-[10px] font-black uppercase tracking-[0.15em] text-gray-300">${favFlag} ${escapeHtml(profile.favorite_team)}</span>` : ''}
                        ${profile?.home_country ? `<span class="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">${escapeHtml(profile.home_country)}</span>` : ''}
                    </div>
                </div>
                ${playerEntry ? `<div class="ml-auto text-right shrink-0">
                    <div class="theme-accent-text text-3xl font-black">${playerEntry.totalPoints}</div>
                    <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">pts</div>
                </div>` : ''}
            </div>

            ${playerEntry && stageBreakdownHtml ? `
            <div class="rounded-2xl border border-gray-700 bg-gray-800/50 px-4 py-3">
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

function closePlayerProfile() {
    const modal = document.getElementById('player-profile-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function showTeamOwners(teamName) {
    const modal = document.getElementById('team-owners-modal');
    const content = document.getElementById('team-owners-modal-content');
    if (!modal || !content) return;

    const team = teams.find((t) => t.name === teamName);
    const flag = team?.flag || '';

    const lb = window._leaderboardData || [];
    const owners = lb
        .filter((u) => u.squad.some((t) => t.name === teamName))
        .sort((a, b) => b.totalPoints - a.totalPoints || a.nickname.localeCompare(b.nickname));

    const ownersHtml = owners.length > 0
        ? owners.map((u) => `
            <button onclick="closeTeamOwners();showPlayerProfile('${u.email}')"
                class="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0">
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-black uppercase text-white truncate">${escapeHtml(u.nickname)}</div>
                    ${u.realname ? `<div class="text-[10px] font-bold text-gray-500 truncate">${escapeHtml(u.realname)}</div>` : ''}
                </div>
                <div class="shrink-0 text-right">
                    <div class="text-lg font-black theme-accent-text">${u.totalPoints}</div>
                    <div class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">pts</div>
                </div>
            </button>`).join('')
        : '<div class="p-8 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">No players have picked this team</div>';

    content.innerHTML = `
        <div class="p-6 border-b border-gray-800">
            <div class="flex items-center gap-4">
                <span class="text-5xl leading-none">${flag}</span>
                <div>
                    <div class="text-xl font-black uppercase italic tracking-tight text-white">${escapeHtml(teamName)}</div>
                    <div class="mt-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">${owners.length} ${owners.length === 1 ? 'player' : 'players'} picked this team</div>
                </div>
            </div>
        </div>
        <div>${ownersHtml}</div>`;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    const onEscape = (e) => { if (e.key === 'Escape') { closeTeamOwners(); document.removeEventListener('keydown', onEscape); } };
    document.addEventListener('keydown', onEscape);
}

function closeTeamOwners() {
    const modal = document.getElementById('team-owners-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
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

Object.assign(window, {
    setupAdminPage,
    showAdminTab,
    showResultsTab,
    setupDashboard,
    setupResultsPage,
    setTeamResultsSort,
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
    exportAllTables,
    sendAdminNotification,
    deleteAdminNotification,
    toggleTeamAdvancement,
    toggleTeamElimination,
    resetAllTeamStatus,
    resetAllMatches,
    simulateAllScheduledMatches,
    togglePicksLock,
    toggleAutoLock
    ,
    toggleHideTeamSelection,
    toggleAutoTeamStatusSync,
    renderProfileFavoriteBanner,
    applyPicksAccentTheme,
    toggleEmojiPicker,
    handleEmojiReaction,
    toggleReaction,
    setupLeaderboardRealtime,
    showPlayerProfile,
    showProfileByNickname,
    closePlayerProfile,
    clearChatBadge,
    postSystemMessage,
    insertMention,
    saveEditMessage,
    cancelEditMessage,
    undoSendMessage
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GROUP_STAGE_SCHEDULE,
        KNOCKOUT_SCHEDULE,
        computeGroupStandings,
        _getBestThirdPlaceTeams,
        _getBestThirdSlots,
        _buildBestThirdAssignments,
        _resolveKnockoutMatchTeam,
        _buildDerivedTeamStatusRows
    };
}
