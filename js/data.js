const SUPABASE_URL = 'https://ttqvchhzuyzhzeumysks.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3cT0wz86jjMqaEciDUwseg_Y59smIY3';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// Kickoff: Mexico vs South Africa, 12:00 PM Mexico City (UTC−6, no DST) = 18:00 UTC.
// The trailing 'Z' fixes this as an absolute UTC instant so every viewer's
// countdown ends at the same real-world second regardless of their timezone.
const LOCK_DATE = new Date('2026-06-11T18:00:00Z');

let userEmail = '';
let myPicks = [];
let appSettings = {
    picksLocked: false,
    autoLockAtKickoff: true,
    hideTeamSelection: false,
    hidePlayerChips: false,
    autoTeamStatusSync: false
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
    {"flag": "🇪🇸", "tier": 1, "group": "H", "name": "Spain", "cost": 50, "region": "UEFA"},
    {"flag": "🇫🇷", "tier": 1, "group": "I", "name": "France", "cost": 50, "region": "UEFA"},
    {"flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "tier": 1, "group": "L", "name": "England", "cost": 50, "region": "UEFA"},
    {"flag": "🇧🇷", "tier": 1, "group": "C", "name": "Brazil", "cost": 45, "region": "CONMEBOL"},
    {"flag": "🇦🇷", "tier": 1, "group": "J", "name": "Argentina", "cost": 45, "region": "CONMEBOL"},
    {"flag": "🇵🇹", "tier": 1, "group": "K", "name": "Portugal", "cost": 40, "region": "UEFA"},
    {"flag": "🇩🇪", "tier": 1, "group": "E", "name": "Germany", "cost": 40, "region": "UEFA"},
    {"flag": "🇳🇱", "tier": 2, "group": "F", "name": "Netherlands", "cost": 35, "region": "UEFA"},
    {"flag": "🇧🇪", "tier": 2, "group": "G", "name": "Belgium", "cost": 30, "region": "UEFA"},
    {"flag": "🇳🇴", "tier": 2, "group": "I", "name": "Norway", "cost": 30, "region": "UEFA"},
    {"flag": "🇨🇴", "tier": 2, "group": "K", "name": "Colombia", "cost": 25, "region": "CONMEBOL"},
    {"flag": "🇲🇦", "tier": 2, "group": "C", "name": "Morocco", "cost": 25, "region": "CAF"},
    {"flag": "🇯🇵", "tier": 2, "group": "F", "name": "Japan", "cost": 25, "region": "AFC"},
    {"flag": "🇺🇸", "tier": 2, "group": "D", "name": "USA", "cost": 25, "region": "CONCACAF"},
    {"flag": "🇺🇾", "tier": 2, "group": "H", "name": "Uruguay", "cost": 25, "region": "CONMEBOL"},
    {"flag": "🇲🇽", "tier": 2, "group": "A", "name": "Mexico", "cost": 25, "region": "CONCACAF"},
    {"flag": "🇨🇭", "tier": 2, "group": "B", "name": "Switzerland", "cost": 20, "region": "UEFA"},
    {"flag": "🇭🇷", "tier": 2, "group": "L", "name": "Croatia", "cost": 20, "region": "UEFA"},
    {"flag": "🇪🇨", "tier": 2, "group": "E", "name": "Ecuador", "cost": 20, "region": "CONMEBOL"},
    {"flag": "🇹🇷", "tier": 2, "group": "D", "name": "Turkiye", "cost": 20, "region": "UEFA"},
    {"flag": "🇸🇪", "tier": 2, "group": "F", "name": "Sweden", "cost": 15, "region": "UEFA"},
    {"flag": "🇸🇳", "tier": 2, "group": "I", "name": "Senegal", "cost": 15, "region": "CAF"},
    {"flag": "🇵🇾", "tier": 2, "group": "D", "name": "Paraguay", "cost": 15, "region": "CONMEBOL"},
    {"flag": "🇦🇹", "tier": 2, "group": "J", "name": "Austria", "cost": 15, "region": "UEFA"},
    {"flag": "🇨🇦", "tier": 2, "group": "B", "name": "Canada", "cost": 10, "region": "CONCACAF"},
    {"flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "tier": 2, "group": "C", "name": "Scotland", "cost": 10, "region": "UEFA"},
    {"flag": "🇨🇿", "tier": 2, "group": "A", "name": "Czechia", "cost": 10, "region": "UEFA"},
    {"flag": "🇨🇮", "tier": 3, "group": "E", "name": "Ivory Coast", "cost": 8, "region": "CAF"},
    {"flag": "🇧🇦", "tier": 3, "group": "B", "name": "Bosnia", "cost": 8, "region": "UEFA"},
    {"flag": "🇬🇭", "tier": 3, "group": "L", "name": "Ghana", "cost": 8, "region": "CAF"},
    {"flag": "🇪🇬", "tier": 3, "group": "G", "name": "Egypt", "cost": 8, "region": "CAF"},
    {"flag": "🇩🇿", "tier": 3, "group": "J", "name": "Algeria", "cost": 8, "region": "CAF"},
    {"flag": "🇰🇷", "tier": 3, "group": "A", "name": "South Korea", "cost": 6, "region": "AFC"},
    {"flag": "🇹🇳", "tier": 3, "group": "F", "name": "Tunisia", "cost": 6, "region": "CAF"},
    {"flag": "🇦🇺", "tier": 3, "group": "D", "name": "Australia", "cost": 6, "region": "AFC"},
    {"flag": "🇮🇷", "tier": 3, "group": "G", "name": "Iran", "cost": 6, "region": "AFC"},
    {"flag": "🇨🇩", "tier": 3, "group": "K", "name": "DR Congo", "cost": 6, "region": "CAF"},
    {"flag": "🇿🇦", "tier": 3, "group": "A", "name": "South Africa", "cost": 4, "region": "CAF"},
    {"flag": "🇸🇦", "tier": 3, "group": "H", "name": "Saudi Arabia", "cost": 4, "region": "AFC"},
    {"flag": "🇵🇦", "tier": 3, "group": "L", "name": "Panama", "cost": 4, "region": "CONCACAF"},
    {"flag": "🇶🇦", "tier": 3, "group": "B", "name": "Qatar", "cost": 4, "region": "AFC"},
    {"flag": "🇺🇿", "tier": 3, "group": "K", "name": "Uzbekistan", "cost": 4, "region": "AFC"},
    {"flag": "🇳🇿", "tier": 3, "group": "G", "name": "New Zealand", "cost": 4, "region": "OFC"},
    {"flag": "🇮🇶", "tier": 3, "group": "I", "name": "Iraq", "cost": 2, "region": "AFC"},
    {"flag": "🇨🇻", "tier": 3, "group": "H", "name": "Cape Verde", "cost": 2, "region": "CAF"},
    {"flag": "🇨🇼", "tier": 3, "group": "E", "name": "Curacao", "cost": 2, "region": "CONCACAF"},
    {"flag": "🇯🇴", "tier": 3, "group": "J", "name": "Jordan", "cost": 2, "region": "AFC"},
    {"flag": "🇭🇹", "tier": 3, "group": "C", "name": "Haiti", "cost": 2, "region": "CONCACAF"},
    {"flag": "🇮🇹", "tier": 3, "group": "", "name": "Italy", "cost": 0, "region": "UEFA", "qualified": false}
];
