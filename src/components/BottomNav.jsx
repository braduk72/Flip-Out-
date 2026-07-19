import { BottomNavigation } from '../ui/components.jsx'

const activeDestination = active => {
  if (active === 'home') return 'home'
  if (active === 'collection' || active === 'inventory') return 'collection'
  if (active === 'rewards' || active === 'spin') return 'rewards'
  return 'more'
}

export default function BottomNav({ active, onHome, onCollection, onRewards, onMore, onShop, onSettings }) {
  const navigate = destination => {
    if (destination === 'home') onHome?.()
    if (destination === 'collection') (onCollection ?? onShop)?.()
    if (destination === 'rewards') (onRewards ?? onShop)?.()
    if (destination === 'more') (onMore ?? onSettings)?.()
  }
  return <BottomNavigation active={activeDestination(active)} onNavigate={navigate}/>
}
