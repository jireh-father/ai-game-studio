// config.js - Game constants, colors, SVG strings, item database

const COLORS = {
    recycle: '#2196F3', recycleDark: '#1976D2',
    compost: '#4CAF50', compostDark: '#388E3C',
    trash: '#757575', trashDark: '#616161',
    hazard: '#FF9800', hazardDark: '#F57C00',
    bgClean: '#FFF8E1', bgDirty: '#E8D5A3', bgCondemned: '#5D4037',
    floor: '#8D6E63', danger: '#F44336', gold: '#FFD700',
    uiText: '#212121', uiBg: 'rgba(0,0,0,0.7)',
    white: '#FFFFFF', black: '#000000'
};

const GAME_CONFIG = {
    width: 360, height: 640,
    strikeLimit: 3, stageDuration: 15000,
    inactivityTimeout: 15000, binOverlapTolerance: 20,
    quickSortTime: 1500, maxComboMultiplier: 10,
    deathRestartDelay: 800
};

const SCORING = {
    correct: 100, quickSort: 150, trickBonus: 200,
    ambiguousBonus: 150, perfectStage: 500,
    comboMultiplierCap: 10
};

const CATEGORIES = ['recycle', 'compost', 'trash', 'hazard'];

const ITEMS = [
    { id: 'bottle', name: 'Plastic Bottle', category: 'recycle', unlockStage: 1, trick: false, ambiguous: false },
    { id: 'banana', name: 'Banana Peel', category: 'compost', unlockStage: 1, trick: false, ambiguous: false },
    { id: 'chipbag', name: 'Chip Bag', category: 'trash', unlockStage: 1, trick: false, ambiguous: false },
    { id: 'newspaper', name: 'Newspaper', category: 'recycle', unlockStage: 1, trick: false, ambiguous: false },
    { id: 'apple', name: 'Apple Core', category: 'compost', unlockStage: 2, trick: false, ambiguous: false },
    { id: 'napkin', name: 'Used Napkin', category: 'trash', unlockStage: 2, trick: false, ambiguous: false },
    { id: 'sodacan', name: 'Soda Can', category: 'recycle', unlockStage: 3, trick: false, ambiguous: false },
    { id: 'eggshell', name: 'Egg Shells', category: 'compost', unlockStage: 3, trick: false, ambiguous: false },
    { id: 'styrofoam', name: 'Styrofoam Cup', category: 'trash', unlockStage: 3, trick: false, ambiguous: false },
    { id: 'battery', name: 'Battery', category: 'hazard', unlockStage: 4, trick: false, ambiguous: false },
    { id: 'paintcan', name: 'Paint Can', category: 'hazard', unlockStage: 5, trick: false, ambiguous: false },
    { id: 'lightbulb', name: 'Light Bulb', category: 'hazard', unlockStage: 6, trick: false, ambiguous: false },
    { id: 'pizzabox', name: 'Pizza Box', category: 'recycle', unlockStage: 7, trick: false, ambiguous: true },
    { id: 'juicebox', name: 'Juice Carton', category: 'recycle', unlockStage: 7, trick: false, ambiguous: true },
    { id: 'teabag', name: 'Tea Bag', category: 'compost', unlockStage: 8, trick: false, ambiguous: true },
    { id: 'coffeecup', name: 'Coffee Cup', category: 'trash', unlockStage: 9, trick: false, ambiguous: true },
    { id: 'greasypaper', name: 'Greasy Paper Towel', category: 'compost', unlockStage: 10, trick: false, ambiguous: true },
    { id: 'ecowipes', name: '"Eco" Wipes', category: 'trash', unlockStage: 11, trick: true, ambiguous: false },
    { id: 'ceramicmug', name: 'Broken Mug', category: 'trash', unlockStage: 12, trick: true, ambiguous: false },
    { id: 'aerosol', name: 'Aerosol Can', category: 'hazard', unlockStage: 13, trick: true, ambiguous: false },
    { id: 'magazine', name: 'Glossy Magazine', category: 'recycle', unlockStage: 14, trick: true, ambiguous: false },
    { id: 'compfork', name: '"Compostable" Fork', category: 'trash', unlockStage: 15, trick: true, ambiguous: false },
    { id: 'motoroil', name: 'Motor Oil Bottle', category: 'hazard', unlockStage: 16, trick: true, ambiguous: false },
    { id: 'dryersheets', name: 'Dryer Sheets', category: 'trash', unlockStage: 18, trick: true, ambiguous: false },
    { id: 'fakechip', name: '"Recyclable" Chip Bag', category: 'trash', unlockStage: 20, trick: true, ambiguous: false },
];

// SVG strings for all game assets
const SVG = {};

SVG.bins = {
    recycle: `<svg viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="15" width="70" height="50" rx="8" fill="${COLORS.recycle}" stroke="#000" stroke-width="3"/><rect x="3" y="10" width="74" height="12" rx="4" fill="${COLORS.recycleDark}" stroke="#000" stroke-width="3"/><circle cx="28" cy="35" r="8" fill="white" stroke="#000" stroke-width="2"/><circle cx="52" cy="35" r="8" fill="white" stroke="#000" stroke-width="2"/><circle cx="30" cy="35" r="4" fill="#000"/><circle cx="54" cy="35" r="4" fill="#000"/><path d="M 25 50 Q 40 60 55 50" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round"/><text x="40" y="28" text-anchor="middle" font-size="8" fill="white" font-weight="bold">RECYCLE</text></svg>`,
    compost: `<svg viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="15" width="70" height="50" rx="8" fill="${COLORS.compost}" stroke="#000" stroke-width="3"/><rect x="3" y="10" width="74" height="12" rx="4" fill="${COLORS.compostDark}" stroke="#000" stroke-width="3"/><circle cx="28" cy="35" r="8" fill="white" stroke="#000" stroke-width="2"/><circle cx="52" cy="35" r="8" fill="white" stroke="#000" stroke-width="2"/><circle cx="30" cy="35" r="4" fill="#000"/><circle cx="54" cy="35" r="4" fill="#000"/><path d="M 25 50 Q 40 60 55 50" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round"/><text x="40" y="28" text-anchor="middle" font-size="7" fill="white" font-weight="bold">COMPOST</text></svg>`,
    trash: `<svg viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="15" width="70" height="50" rx="8" fill="${COLORS.trash}" stroke="#000" stroke-width="3"/><rect x="3" y="10" width="74" height="12" rx="4" fill="${COLORS.trashDark}" stroke="#000" stroke-width="3"/><circle cx="28" cy="35" r="8" fill="white" stroke="#000" stroke-width="2"/><circle cx="52" cy="35" r="8" fill="white" stroke="#000" stroke-width="2"/><circle cx="30" cy="35" r="4" fill="#000"/><circle cx="54" cy="35" r="4" fill="#000"/><path d="M 25 50 Q 40 60 55 50" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round"/><text x="40" y="28" text-anchor="middle" font-size="8" fill="white" font-weight="bold">TRASH</text></svg>`,
    hazard: `<svg viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="15" width="70" height="50" rx="8" fill="${COLORS.hazard}" stroke="#000" stroke-width="3"/><rect x="3" y="10" width="74" height="12" rx="4" fill="${COLORS.hazardDark}" stroke="#000" stroke-width="3"/><circle cx="28" cy="35" r="8" fill="white" stroke="#000" stroke-width="2"/><circle cx="52" cy="35" r="8" fill="white" stroke="#000" stroke-width="2"/><circle cx="30" cy="35" r="4" fill="#000"/><circle cx="54" cy="35" r="4" fill="#000"/><path d="M 25 50 Q 40 60 55 50" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round"/><text x="40" y="28" text-anchor="middle" font-size="7" fill="white" font-weight="bold">HAZARD</text></svg>`
};

SVG.items = {
    bottle: `<svg viewBox="0 0 30 50" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="0" width="10" height="8" rx="2" fill="#81D4FA" stroke="#000" stroke-width="2"/><rect x="5" y="8" width="20" height="38" rx="6" fill="#29B6F6" stroke="#000" stroke-width="2"/><text x="15" y="32" text-anchor="middle" font-size="8" fill="#0277BD">PET</text></svg>`,
    banana: `<svg viewBox="0 0 40 35" xmlns="http://www.w3.org/2000/svg"><path d="M 5 30 Q 10 5 25 8 Q 35 10 38 25" fill="#FFEB3B" stroke="#000" stroke-width="2"/><path d="M 8 28 Q 12 15 22 12" fill="#F9A825" stroke="none"/><circle cx="12" cy="22" r="2" fill="#795548"/></svg>`,
    chipbag: `<svg viewBox="0 0 35 45" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="29" height="35" rx="3" fill="#E53935" stroke="#000" stroke-width="2"/><polygon points="3,5 17,0 32,5" fill="#C62828" stroke="#000" stroke-width="2"/><rect x="8" y="15" width="19" height="12" rx="2" fill="#FFCDD2"/><text x="17" y="24" text-anchor="middle" font-size="7" fill="#B71C1C">CHIPS</text></svg>`,
    newspaper: `<svg viewBox="0 0 40 35" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="36" height="31" rx="2" fill="#ECEFF1" stroke="#000" stroke-width="2"/><rect x="6" y="6" width="28" height="4" fill="#90A4AE"/><rect x="6" y="13" width="12" height="8" fill="#B0BEC5"/><line x1="20" y1="14" x2="32" y2="14" stroke="#90A4AE" stroke-width="2"/><line x1="20" y1="18" x2="32" y2="18" stroke="#90A4AE" stroke-width="2"/><line x1="6" y1="25" x2="32" y2="25" stroke="#B0BEC5" stroke-width="1.5"/><line x1="6" y1="29" x2="24" y2="29" stroke="#B0BEC5" stroke-width="1.5"/></svg>`,
    apple: `<svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"><ellipse cx="15" cy="18" rx="12" ry="10" fill="#FFF9C4" stroke="#000" stroke-width="2"/><path d="M 15 8 Q 18 2 22 5" fill="none" stroke="#795548" stroke-width="2"/><circle cx="10" cy="16" r="2" fill="#A1887F"/></svg>`,
    napkin: `<svg viewBox="0 0 35 30" xmlns="http://www.w3.org/2000/svg"><path d="M 5 5 L 30 5 L 28 25 L 7 25 Z" fill="#EFEBE9" stroke="#000" stroke-width="2"/><circle cx="15" cy="14" r="3" fill="#BCAAA4"/><circle cx="22" cy="18" r="2" fill="#A1887F"/></svg>`,
    sodacan: `<svg viewBox="0 0 25 40" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="19" height="30" rx="4" fill="#E53935" stroke="#000" stroke-width="2"/><ellipse cx="12" cy="5" rx="9" ry="3" fill="#C62828" stroke="#000" stroke-width="2"/><rect x="7" y="14" width="11" height="8" rx="1" fill="#FFCDD2"/><text x="12" y="20" text-anchor="middle" font-size="6" fill="#B71C1C">COLA</text></svg>`,
    eggshell: `<svg viewBox="0 0 30 25" xmlns="http://www.w3.org/2000/svg"><path d="M 5 15 Q 5 3 15 3 Q 25 3 25 15" fill="#FFF8E1" stroke="#000" stroke-width="2"/><path d="M 5 15 L 10 12 L 15 16 L 20 11 L 25 15" fill="none" stroke="#000" stroke-width="2"/></svg>`,
    styrofoam: `<svg viewBox="0 0 30 35" xmlns="http://www.w3.org/2000/svg"><path d="M 5 5 L 8 30 L 22 30 L 25 5 Z" fill="#F5F5F5" stroke="#000" stroke-width="2"/><ellipse cx="15" cy="5" rx="10" ry="3" fill="#EEEEEE" stroke="#000" stroke-width="2"/></svg>`,
    battery: `<svg viewBox="0 0 20 40" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="0" width="8" height="4" fill="#9E9E9E" stroke="#000" stroke-width="1.5"/><rect x="2" y="4" width="16" height="32" rx="2" fill="#FF9800" stroke="#000" stroke-width="2"/><text x="10" y="18" text-anchor="middle" font-size="10" fill="#000" font-weight="bold">+</text><text x="10" y="30" text-anchor="middle" font-size="10" fill="#000" font-weight="bold">-</text></svg>`,
    paintcan: `<svg viewBox="0 0 35 40" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="8" width="25" height="28" rx="3" fill="#E65100" stroke="#000" stroke-width="2"/><rect x="3" y="5" width="29" height="6" rx="2" fill="#BF360C" stroke="#000" stroke-width="2"/><path d="M 12 3 Q 17 0 22 3" fill="none" stroke="#000" stroke-width="2"/><rect x="9" y="18" width="17" height="8" rx="1" fill="#FFCC80"/><text x="17" y="25" text-anchor="middle" font-size="6" fill="#E65100">PAINT</text></svg>`,
    lightbulb: `<svg viewBox="0 0 25 40" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="14" r="10" fill="#FFF9C4" stroke="#000" stroke-width="2"/><rect x="8" y="24" width="9" height="8" fill="#9E9E9E" stroke="#000" stroke-width="2"/><rect x="8" y="32" width="9" height="4" rx="2" fill="#757575" stroke="#000" stroke-width="1.5"/><line x1="8" y1="27" x2="17" y2="27" stroke="#000" stroke-width="1"/><line x1="8" y1="30" x2="17" y2="30" stroke="#000" stroke-width="1"/></svg>`,
    pizzabox: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="41" height="41" rx="3" fill="#8D6E63" stroke="#000" stroke-width="2"/><circle cx="23" cy="23" r="14" fill="#FFC107"/><circle cx="17" cy="18" r="3" fill="#D32F2F"/><circle cx="28" cy="26" r="3" fill="#D32F2F"/><text x="40" y="10" text-anchor="end" font-size="6" fill="#4CAF50">R</text></svg>`,
    juicebox: `<svg viewBox="0 0 25 40" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="19" height="30" rx="2" fill="#FFF176" stroke="#000" stroke-width="2"/><polygon points="8,5 17,5 12,0" fill="#F9A825" stroke="#000" stroke-width="1.5"/><rect x="6" y="12" width="13" height="10" rx="1" fill="#FF8F00"/><text x="12" y="20" text-anchor="middle" font-size="5" fill="#FFF">JUICE</text></svg>`,
    teabag: `<svg viewBox="0 0 25 35" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="8" width="17" height="20" rx="2" fill="#A1887F" stroke="#000" stroke-width="2"/><line x1="12" y1="0" x2="12" y2="8" stroke="#795548" stroke-width="2"/><rect x="9" y="0" width="7" height="5" fill="#EFEBE9" stroke="#000" stroke-width="1.5"/></svg>`,
    coffeecup: `<svg viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg"><path d="M 5 5 L 8 35 L 22 35 L 25 5 Z" fill="#FFFFFF" stroke="#000" stroke-width="2"/><rect x="3" y="3" width="24" height="5" rx="2" fill="#795548" stroke="#000" stroke-width="2"/><rect x="8" y="15" width="14" height="8" rx="1" fill="#8D6E63"/><text x="15" y="22" text-anchor="middle" font-size="5" fill="#FFF">JAVA</text></svg>`,
    greasypaper: `<svg viewBox="0 0 35 30" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="29" height="24" rx="2" fill="#EFEBE9" stroke="#000" stroke-width="2"/><ellipse cx="15" cy="12" rx="8" ry="5" fill="#D7CCC8" opacity="0.7"/><ellipse cx="22" cy="18" rx="5" ry="4" fill="#BCAAA4" opacity="0.6"/></svg>`,
    ecowipes: `<svg viewBox="0 0 35 25" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="31" height="21" rx="4" fill="#A5D6A7" stroke="#000" stroke-width="2"/><text x="17" y="10" text-anchor="middle" font-size="6" fill="#1B5E20">ECO</text><text x="17" y="18" text-anchor="middle" font-size="5" fill="#424242">wipes</text></svg>`,
    ceramicmug: `<svg viewBox="0 0 35 30" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="20" height="22" rx="3" fill="#FFFFFF" stroke="#000" stroke-width="2"/><path d="M 25 10 Q 32 10 32 17 Q 32 24 25 24" fill="none" stroke="#000" stroke-width="2"/><path d="M 10 5 L 15 10" stroke="#F44336" stroke-width="2"/><path d="M 15 5 L 20 15" stroke="#F44336" stroke-width="1.5"/></svg>`,
    aerosol: `<svg viewBox="0 0 22 45" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="10" width="14" height="30" rx="3" fill="#B0BEC5" stroke="#000" stroke-width="2"/><rect x="8" y="3" width="6" height="10" rx="1" fill="#78909C" stroke="#000" stroke-width="1.5"/><rect x="6" y="18" width="10" height="12" rx="1" fill="#FF5722"/><text x="11" y="27" text-anchor="middle" font-size="5" fill="#FFF">SPRAY</text></svg>`,
    magazine: `<svg viewBox="0 0 35 45" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="2" width="29" height="41" rx="2" fill="#E91E63" stroke="#000" stroke-width="2"/><rect x="6" y="6" width="23" height="5" fill="#F48FB1"/><rect x="6" y="14" width="23" height="18" fill="#F8BBD0"/><text x="17" y="38" text-anchor="middle" font-size="5" fill="#FFF">GLOSS</text></svg>`,
    compfork: `<svg viewBox="0 0 15 45" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="20" width="5" height="22" rx="1" fill="#A5D6A7" stroke="#000" stroke-width="1.5"/><line x1="3" y1="0" x2="3" y2="20" stroke="#A5D6A7" stroke-width="2"/><line x1="7" y1="0" x2="7" y2="20" stroke="#A5D6A7" stroke-width="2"/><line x1="11" y1="0" x2="11" y2="20" stroke="#A5D6A7" stroke-width="2"/><text x="7" y="35" text-anchor="middle" font-size="4" fill="#1B5E20">BIO</text></svg>`,
    motoroil: `<svg viewBox="0 0 25 40" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="8" width="17" height="28" rx="3" fill="#37474F" stroke="#000" stroke-width="2"/><rect x="8" y="2" width="9" height="8" rx="1" fill="#455A64" stroke="#000" stroke-width="1.5"/><rect x="6" y="16" width="13" height="10" rx="1" fill="#FF9800"/><text x="12" y="24" text-anchor="middle" font-size="5" fill="#000">OIL</text></svg>`,
    dryersheets: `<svg viewBox="0 0 30 35" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="24" height="29" rx="3" fill="#CE93D8" stroke="#000" stroke-width="2"/><rect x="6" y="8" width="18" height="4" fill="#E1BEE7"/><text x="15" y="22" text-anchor="middle" font-size="5" fill="#4A148C">SOFT</text><text x="15" y="28" text-anchor="middle" font-size="4" fill="#6A1B9A">sheets</text></svg>`,
    fakechip: `<svg viewBox="0 0 35 45" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="29" height="35" rx="3" fill="#43A047" stroke="#000" stroke-width="2"/><polygon points="3,5 17,0 32,5" fill="#2E7D32" stroke="#000" stroke-width="2"/><rect x="8" y="15" width="19" height="12" rx="2" fill="#A5D6A7"/><text x="17" y="24" text-anchor="middle" font-size="5" fill="#1B5E20">ECO</text><text x="17" y="43" text-anchor="middle" font-size="4" fill="#FFF">recycle?</text></svg>`
};

SVG.condemned = `<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="190" height="70" rx="8" fill="none" stroke="#F44336" stroke-width="6"/><text x="100" y="52" text-anchor="middle" font-size="32" fill="#F44336" font-weight="bold" font-family="Impact, sans-serif" transform="rotate(-8, 100, 40)">CONDEMNED</text></svg>`;

SVG.inspector = `<svg viewBox="0 0 50 70" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="25" width="20" height="35" rx="3" fill="#37474F" stroke="#000" stroke-width="2"/><circle cx="25" cy="18" r="12" fill="#FFCCBC" stroke="#000" stroke-width="2"/><rect x="14" y="8" width="22" height="8" rx="2" fill="#455A64" stroke="#000" stroke-width="2"/><circle cx="20" cy="16" r="2" fill="#000"/><circle cx="30" cy="16" r="2" fill="#000"/><path d="M 20 23 L 30 23" stroke="#000" stroke-width="2"/><rect x="36" y="30" width="12" height="16" rx="2" fill="#ECEFF1" stroke="#000" stroke-width="1.5"/></svg>`;

SVG.particle = `<svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="4" r="3" fill="#FFF"/></svg>`;
