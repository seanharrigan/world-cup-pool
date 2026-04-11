const SUPABASE_URL = 'https://ttqvchhzuyzhzeumysks.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3cT0wz86jjMqaEciDUwseg_Y59smIY3';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const LOCK_DATE = new Date('2026-06-11T12:00:00');

let userEmail = '';
let myPicks = [];
let appSettings = {
    picksLocked: false,
    autoLockAtKickoff: true,
    hideTeamSelection: false
};
let advancedTeams = new Set();
let eliminatedTeams = new Set();
let isLocked = false;
let chatChannel = null;
let notificationChannel = null;
let countdownStarted = false;
let kickoffLockSyncAttempted = false;
let activeNotificationId = null;

function refreshLockState() {
    isLocked = Boolean(appSettings.picksLocked) || (appSettings.autoLockAtKickoff !== false && new Date() >= LOCK_DATE);
    return isLocked;
}

refreshLockState();

const teams = [
    {"flag": "🇪🇸", "tier": 1, "group": "H", "name": "Spain", "cost": 50},
    {"flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "tier": 1, "group": "L", "name": "England", "cost": 50},
    {"flag": "🇫🇷", "tier": 1, "group": "I", "name": "France", "cost": 50},
    {"flag": "🇦🇷", "tier": 1, "group": "J", "name": "Argentina", "cost": 45},
    {"flag": "🇧🇷", "tier": 1, "group": "C", "name": "Brazil", "cost": 45},
    {"flag": "🇵🇹", "tier": 1, "group": "K", "name": "Portugal", "cost": 40},
    {"flag": "🇩🇪", "tier": 1, "group": "E", "name": "Germany", "cost": 40},
    {"flag": "🇳🇱", "tier": 2, "group": "F", "name": "Netherlands", "cost": 35},
    {"flag": "🇳🇴", "tier": 2, "group": "I", "name": "Norway", "cost": 30},
    {"flag": "🇧🇪", "tier": 2, "group": "G", "name": "Belgium", "cost": 30},
    {"flag": "🇨🇴", "tier": 2, "group": "K", "name": "Colombia", "cost": 25},
    {"flag": "🇲🇦", "tier": 2, "group": "C", "name": "Morocco", "cost": 25},
    {"flag": "🇺🇸", "tier": 2, "group": "D", "name": "USA", "cost": 25},
    {"flag": "🇯🇵", "tier": 2, "group": "F", "name": "Japan", "cost": 25},
    {"flag": "🇲🇽", "tier": 2, "group": "A", "name": "Mexico", "cost": 25},
    {"flag": "🇨🇭", "tier": 2, "group": "B", "name": "Switzerland", "cost": 25},
    {"flag": "🇺🇾", "tier": 2, "group": "H", "name": "Uruguay", "cost": 20},
    {"flag": "🇪🇨", "tier": 2, "group": "E", "name": "Ecuador", "cost": 20},
    {"flag": "🇭🇷", "tier": 2, "group": "L", "name": "Croatia", "cost": 20},
    {"flag": "🇦🇹", "tier": 2, "group": "J", "name": "Austria", "cost": 20},
    {"flag": "🇸🇳", "tier": 2, "group": "I", "name": "Senegal", "cost": 15},
    {"flag": "🇹🇷", "tier": 2, "group": "D", "name": "Turkiye", "cost": 15},
    {"flag": "🇸🇪", "tier": 2, "group": "F", "name": "Sweden", "cost": 15},
    {"flag": "🇨🇦", "tier": 2, "group": "B", "name": "Canada", "cost": 10},
    {"flag": "🇵🇾", "tier": 2, "group": "D", "name": "Paraguay", "cost": 10},
    {"flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "tier": 2, "group": "C", "name": "Scotland", "cost": 10},
    {"flag": "🇧🇦", "tier": 2, "group": "B", "name": "Bosnia", "cost": 15},
    {"flag": "🇪🇬", "tier": 3, "group": "G", "name": "Egypt", "cost": 8},
    {"flag": "🇨🇿", "tier": 3, "group": "A", "name": "Czechia", "cost": 8},
    {"flag": "🇨🇮", "tier": 3, "group": "E", "name": "Ivory Coast", "cost": 8},
    {"flag": "🇩🇿", "tier": 3, "group": "J", "name": "Algeria", "cost": 8},
    {"flag": "🇬🇭", "tier": 3, "group": "L", "name": "Ghana", "cost": 8},
    {"flag": "🇦🇺", "tier": 3, "group": "D", "name": "Australia", "cost": 6},
    {"flag": "🇹🇳", "tier": 3, "group": "F", "name": "Tunisia", "cost": 6},
    {"flag": "🇮🇷", "tier": 3, "group": "G", "name": "Iran", "cost": 6},
    {"flag": "🇰🇷", "tier": 3, "group": "A", "name": "South Korea", "cost": 6},
    {"flag": "🇨🇩", "tier": 3, "group": "K", "name": "DR Congo", "cost": 6},
    {"flag": "🇶🇦", "tier": 3, "group": "B", "name": "Qatar", "cost": 4},
    {"flag": "🇿🇦", "tier": 3, "group": "A", "name": "South Africa", "cost": 4},
    {"flag": "🇸🇦", "tier": 3, "group": "H", "name": "Saudi Arabia", "cost": 4},
    {"flag": "🇵🇦", "tier": 3, "group": "L", "name": "Panama", "cost": 4},
    {"flag": "🇳🇿", "tier": 3, "group": "G", "name": "New Zealand", "cost": 4},
    {"flag": "🇮🇶", "tier": 3, "group": "I", "name": "Iraq", "cost": 4},
    {"flag": "🇨🇻", "tier": 3, "group": "H", "name": "Cape Verde", "cost": 2},
    {"flag": "🇨🇼", "tier": 3, "group": "E", "name": "Curacao", "cost": 2},
    {"flag": "🇺🇿", "tier": 3, "group": "K", "name": "Uzbekistan", "cost": 2},
    {"flag": "🇯🇴", "tier": 3, "group": "J", "name": "Jordan", "cost": 2},
    {"flag": "🇭🇹", "tier": 3, "group": "C", "name": "Haiti", "cost": 2},
    {"flag": "🇮🇹", "tier": 3, "group": "", "name": "Italy", "cost": 0, "qualified": false}
];
