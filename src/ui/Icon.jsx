const paths = {
  home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V21h13V10.5M9.5 21v-6h5v6"/></>,
  collection: <><rect x="4" y="5" width="12" height="16" rx="2"/><path d="m8 9 4-2 4 2M8 13h4M8 17h4"/><path d="M8 3h10a2 2 0 0 1 2 2v13"/></>,
  rewards: <><path d="M4 10h16v11H4zM3 7h18v4H3zM12 7v14"/><path d="M12 7H8.5A2.5 2.5 0 1 1 12 3.5ZM12 7h3.5A2.5 2.5 0 1 0 12 3.5Z"/></>,
  more: <><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>,
  star: <path d="m12 2.5 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.1l6.2-.9z"/>,
  coin: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6"/><path d="m12 7.3 1.4 2.8 3.1.5-2.2 2.1.5 3.1-2.8-1.5-2.8 1.5.5-3.1-2.2-2.1 3.1-.5z"/></>,
  cart: <><path d="M3 4h2l2.2 10.2h10.6L20 7H6"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/></>,
  left: <path d="m15 18-6-6 6-6"/>,
  right: <path d="m9 18 6-6-6-6"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  cards: <><rect x="5" y="4" width="13" height="17" rx="2"/><path d="M9 8h5M9 12h5M3 7v11a2 2 0 0 0 2 2"/></>,
  foil: <><path d="m12 2 3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/><path d="m18.5 3 .7 1.6L21 5.5l-1.8.8-.7 1.7-.8-1.7-1.7-.8 1.7-.9z"/></>,
  season: <><path d="M5 8h14v12H5zM8 4v7M16 4v7M5 11h14"/><path d="m12 13 1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z"/></>,
  xp: <><path d="m12 3 7 4v5c0 4.4-3 7.5-7 9-4-1.5-7-4.6-7-9V7z"/><path d="m9 12 2 2 4-5"/></>,
  retry: <><path d="M20 7v5h-5"/><path d="M18.5 16a8 8 0 1 1 .5-8l1 4"/></>,
  alert: <><path d="M12 3 2.8 20h18.4z"/><path d="M12 9v5M12 17h.01"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  play: <path d="m8 5 11 7-11 7z"/>,
  pause: <path d="M8 5h3v14H8zM14 5h3v14h-3z"/>,
}

export default function Icon({ name, size = 24, label, className = '' }) {
  const content = paths[name] ?? paths.info
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={['star', 'coin'].includes(name) ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-hidden={label ? undefined : true}
    >
      {label && <title>{label}</title>}
      {content}
    </svg>
  )
}
