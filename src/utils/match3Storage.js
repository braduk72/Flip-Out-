const PROGRESS_KEY='fo_match3_local_progress'
const SESSION_KEY='fo_match3_resume'
export function loadMatch3Progress(){try{return JSON.parse(localStorage.getItem(PROGRESS_KEY))??{highestUnlockedLevel:1,completedLevels:{}}}catch{return{highestUnlockedLevel:1,completedLevels:{}}}}
export function saveMatch3Progress(value){localStorage.setItem(PROGRESS_KEY,JSON.stringify(value))}
export function saveMatch3Resume(value){if(value)localStorage.setItem(SESSION_KEY,JSON.stringify(value));else localStorage.removeItem(SESSION_KEY)}
export function loadMatch3Resume(){try{return JSON.parse(localStorage.getItem(SESSION_KEY))}catch{return null}}
export function resetMatch3Development(){localStorage.removeItem(PROGRESS_KEY);localStorage.removeItem(SESSION_KEY)}
