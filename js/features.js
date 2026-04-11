const {
    getMatchPointsForTeam,
    buildTeamStageBreakdownMap,
    buildTeamPointsMap,
    buildProfilesMap,
    getDisplayProfile,
    buildLeaderboardData
} = window.WorldCupScoring;

function getTeamStatus(teamName) {
    return {
        advanced: advancedTeams.has(teamName),
        eliminated: eliminatedTeams.has(teamName)
    };
}

const teamResultsSortState = {
    'public-team-results-body': { key: 'team', direction: 'asc' }
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
    root.style.setProperty('--theme-accent-chat-meta', mixHexWithWhite(tokens.primary, 0.72));
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

function setupAdminPage() {
    const teamOneSelect = document.getElementById('admin-team1');
    const teamTwoSelect = document.getElementById('admin-team2');

    showAdminTab('matches');

    if (teamOneSelect && teamTwoSelect) {
        const options = [...teams]
            .filter((team) => team.qualified !== false)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((team) => `<option value="${team.name}">${team.flag} ${team.name}</option>`)
            .join('');

        teamOneSelect.innerHTML = `<option value="">Select Home Team...</option>${options}`;
        teamTwoSelect.innerHTML = `<option value="">Select Away Team...</option>${options}`;
        attachAlphaJumpToSelect(teamOneSelect);
        attachAlphaJumpToSelect(teamTwoSelect);
    }

    fetchAdminHistory();
    fetchAdminUsers();
    fetchAdminNotifications();
    fetchAdminAdvancement();
    fetchStats();
    syncAdminToggleControls();
}

function syncAdminToggleControls() {
    const lockToggle = document.getElementById('admin-lock-picks-toggle');
    const autoLockToggle = document.getElementById('admin-auto-lock-toggle');
    const hideTeamSelectionToggle = document.getElementById('admin-hide-team-selection-toggle');

    if (lockToggle) {
        lockToggle.checked = Boolean(appSettings.picksLocked);
    }

    if (autoLockToggle) {
        autoLockToggle.checked = appSettings.autoLockAtKickoff !== false;
    }

    if (hideTeamSelectionToggle) {
        hideTeamSelectionToggle.checked = Boolean(appSettings.hideTeamSelection);
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
}

function showResultsTab(tabId) {
    const panels = document.querySelectorAll('.results-panel');
    const tabs = document.querySelectorAll('.results-tab');

    panels.forEach((panel) => panel.classList.add('hidden'));
    tabs.forEach((tab) => {
        tab.classList.remove('active', 'theme-tab-active');
        tab.classList.add('border-gray-300', 'bg-white', 'text-gray-500');
    });

    const activePanel = document.getElementById(`results-panel-${tabId}`);
    const activeTab = document.getElementById(`results-tab-${tabId}`);

    if (activePanel) {
        activePanel.classList.remove('hidden');
    }

    if (activeTab) {
        activeTab.classList.add('active', 'theme-tab-active');
        activeTab.classList.remove('border-gray-300', 'bg-white', 'text-gray-500');
    }
}

function setupResultsPage() {
    showResultsTab('groups');
    renderGroups();
    fetchPublicResults();
    fetchPublicTeamResults();
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
        showToast(checked ? 'Team selection hidden.' : 'Team selection visible.', 'success');
    } catch (error) {
        syncAdminToggleControls();
        showToast(error.message || 'Unable to update team visibility.');
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
    try {
        const currentStatus = getTeamStatus(teamName);
        const { error } = await supabaseClient
            .from('team_advancement')
            .upsert({
                team_name: teamName,
                advanced_to_knockouts: checked,
                eliminated: currentStatus.eliminated
            }, { onConflict: 'team_name' });

        if (error) {
            throw error;
        }

        await fetchAdvancedTeams();
        fetchAdminAdvancement();
        renderGroups();
        fetchLeaderboard();
        fetchPublicTeamResults();
        setupDashboard();
        showToast(checked ? `${teamName} marked advanced.` : `${teamName} advancement removed.`, 'success');
    } catch (error) {
        showToast(error.message || 'Unable to update advancement.');
        fetchAdminAdvancement();
    }
}

async function toggleTeamElimination(teamName, checked) {
    try {
        const currentStatus = getTeamStatus(teamName);
        const { error } = await supabaseClient
            .from('team_advancement')
            .upsert({
                team_name: teamName,
                advanced_to_knockouts: currentStatus.advanced,
                eliminated: checked
            }, { onConflict: 'team_name' });

        if (error) {
            throw error;
        }

        await fetchAdvancedTeams();
        fetchAdminAdvancement();
        fetchLeaderboard();
        setupDashboard();
        showToast(checked ? `${teamName} marked eliminated.` : `${teamName} moved back to remaining.`, 'success');
    } catch (error) {
        showToast(error.message || 'Unable to update elimination status.');
        fetchAdminAdvancement();
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

    if (leaderboardEl) leaderboardEl.innerHTML = '<div class="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading leaderboard...</div>';
    if (resultsEl) resultsEl.innerHTML = '<div class="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading results...</div>';
    if (mostPickedEl) mostPickedEl.innerHTML = '<div class="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading picks...</div>';
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
        if (playerCountEl) playerCountEl.textContent = `${playerCount} ${playerCount === 1 ? 'entry' : 'entries'}`;
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
            leaderboardEl.innerHTML = leaders.map((entry, index) => `
                <div class="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                    <div class="min-w-0">
                        <div class="theme-accent-text text-[10px] font-black uppercase tracking-[0.2em]">#${index + 1}</div>
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
                    <div class="theme-accent-text text-[10px] font-black uppercase tracking-[0.2em]">${match.match_date_manual || 'TBD'} | ${match.stage}</div>
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
                        <div class="theme-solid-badge rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">${count}</div>
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
    const keys = ['team', 'total', 'G1', 'G2', 'G3', 'Bonus', 'R32', 'R16', 'QF', 'SM', 'F'];

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
        sortState.direction = key === 'team' ? 'asc' : 'desc';
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

    body.innerHTML = '<tr><td colspan="6" class="px-5 py-8 text-center text-gray-500 uppercase text-xs">Loading players...</td></tr>';

    try {
        const users = await getAdminUserRecords();
        body.innerHTML = users.map((user) => `
            <tr class="border-t border-gray-800">
                <td class="px-5 py-4 align-top min-w-[180px]">
                    <div class="text-white">${user.realname || user.nickname || user.email}</div>
                    <div class="mt-1 text-xs italic text-gray-400">${user.nickname || '<span class="not-italic text-gray-500">No nickname</span>'}</div>
                </td>
                <td class="px-5 py-4 align-top break-all min-w-[220px]">${user.email}</td>
                <td class="px-5 py-4 align-top min-w-[180px]">${renderAdminTeamFlagsByTier(user.teamGroups)}</td>
                <td class="px-5 py-4 align-top min-w-[140px]">${formatAdminTeamSavedAt(user.lastTeamSavedAt, user.picksSaveCount)}</td>
                <td class="px-5 py-4 align-top text-center">
                    <button onclick="toggleUserPaidStatus('${user.email.replace(/'/g, "\\'")}', ${user.hasPaid ? 'true' : 'false'})" class="rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${user.hasPaid ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}">
                        ${user.hasPaid ? 'Paid' : 'Not Paid'}
                    </button>
                </td>
                <td class="px-5 py-4 text-right align-top">
                    <button onclick="deleteUserPicks('${user.email.replace(/'/g, "\\'")}')" class="rounded-xl bg-red-600 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-red-500 transition-colors">Delete</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="6" class="px-5 py-8 text-center text-gray-500 uppercase text-xs">No player records found.</td></tr>';
    } catch (error) {
        body.innerHTML = '<tr><td colspan="6" class="px-5 py-8 text-center text-red-400 uppercase text-xs">Could not load player records.</td></tr>';
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
    const [
        { data: profiles, error: profilesError },
        { data: picks, error: picksError }
    ] = await Promise.all([
        supabaseClient.from('profiles').select('email, nickname, realname, has_paid, avatar_url, updated_at, picks_save_count'),
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

async function toggleUserPaidStatus(email, currentValue) {
    const nextValue = !currentValue;

    try {
        const { error } = await supabaseClient
            .from('profiles')
            .update({ has_paid: nextValue })
            .eq('email', email);

        if (error) {
            throw error;
        }
    } catch (error) {
        showToast(error.message || 'Unable to update payment status.');
        return;
    }

    fetchAdminUsers();
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

    const knockoutStageMap = {
        R32: 'R32',
        R16: 'R16',
        Quarters: 'QF',
        Semis: 'SM',
        Finals: 'F'
    };

    body.innerHTML = '<tr><td colspan="11" class="px-4 py-8 text-center text-gray-500 uppercase text-xs">Loading team results...</td></tr>';

    try {
        await fetchAdvancedTeams();

        const { data: matches, error } = await supabaseClient
            .from('matches')
            .select('*')
            .order('match_date_manual', { ascending: true });

        if (error) {
            throw error;
        }

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

                return {
                    team,
                    totalPoints,
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
                        <td class="px-4 py-4">
                            <div class="min-w-[72px] py-1 text-center">
                                <div class="text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'} leading-none">${stageBreakdown.Bonus || '-'}</div>
                            </div>
                        </td>
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

        body.innerHTML = rows.map((row) => row.html).join('') || '<tr><td colspan="11" class="px-4 py-8 text-center text-gray-500 uppercase text-xs">No teams found.</td></tr>';

        if (targetId === 'public-team-results-body') {
            updatePublicTeamSortIndicators();
        }
    } catch (error) {
        body.innerHTML = '<tr><td colspan="11" class="px-4 py-8 text-center text-red-400 uppercase text-xs">Could not load team results.</td></tr>';
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
        label: 'Are You Sure?',
        icon: '⚠️',
        title: 'Delete Player Record?',
        message: `This will delete all picks and the full profile for ${email}.`,
        detail: 'It also removes their chat messages and any notifications they sent.',
        confirmText: 'Yes, Delete',
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
        detail: 'Are you absolutely sure you want to permanently remove this player record?',
        confirmText: 'Delete Forever',
        cancelText: 'Keep Player'
    });

    if (!finalDelete) {
        return;
    }

    try {
        const [
            { error: picksError },
            { error: profileError },
            { error: messagesError },
            { error: notificationsError }
        ] = await Promise.all([
            supabaseClient.from('picks').delete().eq('user_email', email),
            supabaseClient.from('profiles').delete().eq('email', email),
            supabaseClient.from('messages').delete().eq('user_email', email),
            supabaseClient.from('notifications').delete().eq('created_by', email)
        ]);

        if (picksError) {
            throw picksError;
        }

        if (profileError) {
            throw profileError;
        }

        if (messagesError) {
            throw messagesError;
        }

        if (notificationsError) {
            throw notificationsError;
        }

        if (userEmail === email) {
            myPicks = [];
            updateUI();
        }

        fetchAdminUsers();
        fetchAdminNotifications();
        fetchMessages();
        fetchLeaderboard();
        fetchStats();
        showToast('Player record deleted.', 'success');
    } catch (error) {
        showToast(error.message || 'Unable to delete player record.');
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
                <div class="theme-accent-text text-[9px] font-black uppercase text-left">${match.match_date_manual} | ${match.stage}</div>
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
                <div class="theme-accent-text text-[8px] md:text-[10px] font-black uppercase mb-1">${match.match_date_manual} | ${match.stage}</div>
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
    body.innerHTML = '<tr><td colspan="12" class="p-8 text-center text-gray-500">Calculating Live Standings...</td></tr>';

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

        body.innerHTML = leaderboardData.map((user, index) => `
            <tr class="theme-hover-row border-b border-gray-100 transition-colors text-left text-gray-900">
                <td class="theme-accent-text px-6 py-4 text-center italic">#${index + 1}</td>
                <td class="theme-accent-text px-6 py-4 text-center font-mono text-2xl font-black">${user.totalPoints}</td>
                <td class="px-6 py-4 text-left">
                    <div class="text-sm font-black uppercase text-left text-gray-900">${user.nickname}</div>
                    <div class="text-[9px] text-gray-400 uppercase text-left">${user.realname}</div>
                    <div class="mt-2 text-left">
                        ${appSettings.hideTeamSelection
                            ? '<div class="text-[8px] font-black uppercase tracking-[0.18em] text-gray-400">Teams to be displayed when WC starts</div>'
                            : (() => {
                                const sortedSquad = [...user.squad].sort((a, b) => b.cost - a.cost || a.name.localeCompare(b.name));
                                const remainingFlags = sortedSquad.filter((team) => !team.eliminated).map((team) => `<span class="text-lg">${team.flag}</span>`).join('');
                                const eliminatedFlags = sortedSquad.filter((team) => team.eliminated).map((team) => `<span class="text-lg opacity-70">${team.flag}</span>`).join('');
                                return `
                                    <div class="space-y-1 text-left">
                                        <div class="text-[8px] font-black uppercase tracking-[0.18em] text-gray-500">Remaining: <span class="ml-1 inline-flex gap-1 align-middle">${remainingFlags || '<span class="text-gray-300">-</span>'}</span></div>
                                        <div class="text-[8px] font-black uppercase tracking-[0.18em] text-gray-400">Eliminated: <span class="ml-1 inline-flex gap-1 align-middle">${eliminatedFlags || '<span class="text-gray-300">-</span>'}</span></div>
                                    </div>
                                `;
                            })()}
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
        `).join('') || '<tr><td colspan="10" class="p-8 text-center text-gray-900">No players found</td></tr>';
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
                    <div class="picks-price-pill px-3 py-1 rounded-full text-xs font-black">${count} PICKS</div>
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
    messageElement.className = `max-w-[80%] p-4 rounded-2xl text-left ${isMe ? 'theme-chat-own self-end rounded-tr-none' : 'bg-gray-100 self-start rounded-tl-none text-black'}`;
    messageElement.innerHTML = `
        <div class="text-[9px] font-black uppercase text-left ${isMe ? 'theme-chat-own-meta' : 'theme-accent-text'}">
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
    fetchAdminNotifications,
    fetchAdminAdvancement,
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
    setupChatKeyboardSubmit,
    syncAdminToggleControls,
    exportAllTables,
    sendAdminNotification,
    deleteAdminNotification,
    toggleTeamAdvancement,
    toggleTeamElimination,
    togglePicksLock,
    toggleAutoLock
    ,
    toggleHideTeamSelection,
    renderProfileFavoriteBanner,
    applyPicksAccentTheme
});
