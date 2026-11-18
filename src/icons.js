// Original line icons drawn for git-wrapped, in the spirit of Apple's SF Symbols
// (24×24 grid, 1.75 stroke, round caps). Pure path data, so they work both as
// inline SVG and as canvas Path2D for the share card.
// Stroke style shared by every renderer (inline SVG, canvas, profile card).
// The path data above only carries geometry; these settings carry the look.
export const STROKE = { regular: 1.75, bold: 2, cap: 'round', join: 'round' };

const ring = (cx, cy, r) => `M${cx} ${cy - r}a${r} ${r} 0 1 1 0 ${2 * r}a${r} ${r} 0 1 1 0 ${-2 * r}z`;

export const ICONS = {
  commit: `M3 12h5.5M15.5 12H21${ring(12, 12, 3.5)}`,
  folder: 'M3 7.5A1.5 1.5 0 0 1 4.5 6h4.2l2 2h8.8A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z',
  calendar: 'M4.5 5.5h15A1.5 1.5 0 0 1 21 7v12a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19V7a1.5 1.5 0 0 1 1.5-1.5zM3 10h18M8 3.5v4M16 3.5v4',
  weekend: 'M4.5 5.5h15A1.5 1.5 0 0 1 21 7v12a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19V7a1.5 1.5 0 0 1 1.5-1.5zM3 10h18M8 3.5v4M16 3.5v4M14 14.5h3v3h-3z',
  clock: `${ring(12, 12, 9)}M12 7v5l3.5 2`,
  timer: `${ring(12, 13, 8)}M12 9v4.5M10 2.5h4M18.5 6.5L20 5`,
  doc: 'M6.5 3H14l5 5v11.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6.5 3zM14 3v5h5M8.5 13h7M8.5 16.5h5',
  book: 'M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5c2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5v13',
  moon: 'M18.5 15A7.5 7.5 0 0 1 9 5.5a7.5 7.5 0 1 0 9.5 9.5zM17.5 3v4M15.5 5h4',
  flame: 'M12 21c-3.9 0-6.5-2.6-6.5-6.2c0-3.3 2.3-5.4 3.8-7.3c.4 1.6 1.2 2.7 2.2 3.2C11.6 7.6 12.8 5 15 3c.2 3 1.4 4.6 2.4 6.2c.7 1.2 1.1 2.4 1.1 3.9c0 4.4-2.6 7.9-6.5 7.9z',
  bolt: 'M13 2.5L5 13.5h6l-1 8l8-11h-6z',
  pr: `${ring(6, 5, 2.2)}${ring(6, 19, 2.2)}${ring(18, 19, 2.2)}M6 7.2v9.6M18 16.8V9.5A2.5 2.5 0 0 0 15.5 7H11M13.5 4.5L11 7l2.5 2.5`,
  eye: `M2.5 12S6 5.5 12 5.5S21.5 12 21.5 12S18 18.5 12 18.5S2.5 12 2.5 12z${ring(12, 12, 3)}`,
  issue: `${ring(12, 12, 9)}M12 7.5V13M12 16.2v.3`,
  lock: 'M6.5 10.5h11A1.5 1.5 0 0 1 19 12v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-7a1.5 1.5 0 0 1 1.5-1.5zM8 10.5v-3a4 4 0 0 1 8 0v3',
  people: `${ring(9, 7.5, 3.5)}M2.5 20c.5-3.5 3.2-6 6.5-6s6 2.5 6.5 6M16 4.3a3.3 3.3 0 0 1 0 6.4M18 14.4c2 .7 3.3 2.8 3.5 5.6`,
  speaker: 'M4 9.5h3l5-4v13l-5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
  mute: 'M4 9.5h3l5-4v13l-5-4H4zM16 9.5l5 5M21 9.5l-5 5',
  download: 'M12 3.5v12M7.5 11l4.5 4.5l4.5-4.5M4.5 17v2A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-2',
  share: 'M12 14V3.5M8 7.5l4-4l4 4M8.5 10.5H7A1.5 1.5 0 0 0 5.5 12v7A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5h-1.5',
  replay: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4v4.5H9',
  chart: 'M4 4v16h16M8.5 16v-4M12.5 16V8M16.5 16v-6',
  bubble: 'M4.5 4.5h15A1.5 1.5 0 0 1 21 6v9.5a1.5 1.5 0 0 1-1.5 1.5H10l-5 4v-4h-.5A1.5 1.5 0 0 1 3 15.5V6a1.5 1.5 0 0 1 1.5-1.5z',
  wrench: 'M15 4.2a4.5 4.5 0 0 0-4.6 6l-6.2 6.2a2 2 0 0 0 2.8 2.8l6.2-6.2a4.5 4.5 0 0 0 6-4.6l-2.6 2.6l-2.5-.6l-.6-2.5z',
  hourglass: 'M7 3.5h10M7 20.5h10M8 3.5c0 4 8 4.5 8 8.5s-8 4.5-8 8.5M16 3.5c0 4-8 4.5-8 8.5s8 4.5 8 8.5',
  warning: 'M12 4l9 15.5H3zM12 10v4.5M12 17.2v.3',
  star: 'M12 3.5l2.6 5.3l5.9.9l-4.25 4.1l1 5.85L12 16.9l-5.25 2.75l1-5.85L3.5 9.7l5.9-.9z',
  sunrise: 'M3 17.5h18M7 17.5a5 5 0 0 1 10 0M12 4v4M9.5 6.5L12 4l2.5 2.5M4.6 11.1l1.4 1M19.4 11.1l-1.4 1M5 21h14',
  trend: 'M3 17l5.5-5.5l4 4L21 7M15.5 7H21v5.5',
  trash: 'M4 6.5h16M9.5 6.5v-2h5v2M6 6.5l1 13A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5l1-13M10 10.5V17M14 10.5V17',
  cube: 'M12 2.8l8 4.6v9.2l-8 4.6l-8-4.6V7.4zM4 7.4l8 4.6l8-4.6M12 12v9.2',
  scope: `${ring(12, 12, 8)}M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5${ring(12, 12, 1)}`,
  tornado: 'M3.5 5h17M5.5 9h13M8 13h9M10 17h5M11.5 21h2',
  briefcase: 'M4.5 7.5h15A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5V9a1.5 1.5 0 0 1 1.5-1.5zM8.5 7.5v-2A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5v2M3 13h18',
  stack: 'M12 3l9 4.5l-9 4.5l-9-4.5zM3 12l9 4.5l9-4.5M3 16.5L12 21l9-4.5',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
};

export function svgIcon(name, size = 18, extra = '') {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${STROKE.regular}" stroke-linecap="${STROKE.cap}" stroke-linejoin="${STROKE.join}" aria-hidden="true" ${extra}><path d="${ICONS[name]}"/></svg>`;
}
