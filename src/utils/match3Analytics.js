const listeners=new Set()
export function recordMatch3Event(type,data={}){const event={type,at:new Date().toISOString(),...data};if(import.meta.env.DEV)console.debug('[match3]',event);for(const fn of listeners)fn(event);return event}
export function onMatch3Event(fn){listeners.add(fn);return()=>listeners.delete(fn)}
export function haptic(kind='light'){try{if(navigator.vibrate)navigator.vibrate(kind==='success'?[20,30,20]:10)}catch{/* graceful browser fallback */}}
