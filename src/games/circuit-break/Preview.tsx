// Cabinet screenshot: a board mid-run, three rows cleared and the ball on its way back up.
const ROWS = [
  { y: 58, fill: '#ef4db8', light: '#ff8fd4', gaps: [3] },
  { y: 82, fill: '#a97bd8', light: '#cfa9f2', gaps: [0, 6] },
  { y: 106, fill: '#58e6cf', light: '#a6fff0', gaps: [2, 3] },
  { y: 130, fill: '#f7ed59', light: '#fffbb0', gaps: [5] },
];
export default function CircuitBreakPreview() {
  return <svg className="cabinet-preview" viewBox="0 0 480 270" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="cb-bg" x2="0" y2="1"><stop stopColor="#1b1436"/><stop offset=".55" stopColor="#0e0b20"/><stop offset="1" stopColor="#141029"/></linearGradient>
      <radialGradient id="cb-ball"><stop stopColor="#fffdf0"/><stop offset=".45" stopColor="#f7ed59"/><stop offset="1" stopColor="#f7ed5900"/></radialGradient>
      <radialGradient id="cb-vignette"><stop offset=".55" stopColor="#000" stopOpacity="0"/><stop offset="1" stopColor="#000" stopOpacity=".55"/></radialGradient>
    </defs>
    <path fill="url(#cb-bg)" d="M0 0h480v270H0z"/>
    <g stroke="#58e6cf" strokeWidth=".5" opacity=".13">
      {Array.from({ length: 15 }, (_, i) => <path key={`v${i}`} d={`M${i * 34} 0v270`}/>)}
      {Array.from({ length: 9 }, (_, i) => <path key={`h${i}`} d={`M0 ${i * 34}h480`}/>)}
    </g>
    {ROWS.map(row => Array.from({ length: 8 }, (_, col) => row.gaps.includes(col) ? null : (
      <g key={`${row.y}-${col}`}>
        <rect x={40 + col * 50} y={row.y} width="44" height="16" rx="1.5" fill={row.fill}/>
        <rect x={40 + col * 50} y={row.y} width="44" height="4" rx="1.5" fill={row.light} opacity=".85"/>
        <rect x={40 + col * 50} y={row.y + 13} width="44" height="3" fill="#00000055"/>
      </g>
    )))}
    <g opacity=".5"><rect x={40 + 3 * 50} y="58" width="44" height="16" rx="1.5" fill="none" stroke="#ff8fd4" strokeWidth=".8" strokeDasharray="3 4"/></g>
    <g fill="#f7ed59">
      <circle cx="236" cy="186" r="4" opacity=".14"/><circle cx="248" cy="199" r="4.5" opacity=".22"/><circle cx="260" cy="212" r="5" opacity=".34"/>
    </g>
    <circle cx="272" cy="226" r="17" fill="url(#cb-ball)" opacity=".65"/>
    <circle cx="272" cy="226" r="5.5" fill="#fffdf0"/>
    <g>
      <rect x="196" y="246" width="104" height="9" rx="4.5" fill="#58e6cf" opacity=".25"/>
      <rect x="200" y="247" width="96" height="7" rx="3.5" fill="#58e6cf"/>
      <rect x="200" y="247" width="96" height="2.5" rx="1.2" fill="#ccfff5"/>
    </g>
    <path fill="url(#cb-vignette)" d="M0 0h480v270H0z"/>
    <g fontFamily="ui-monospace, monospace" fontSize="10" letterSpacing="2">
      <text x="18" y="26" fill="#58e6cf">CIRCUIT_01</text>
      <text x="462" y="26" fill="#f7ed59" textAnchor="end">03720</text>
      <text x="18" y="254" fill="#7c6b90" fontSize="9">BREAK. BOUNCE. REPEAT.</text>
    </g>
    <g fill="#ef4db8">{[0, 1, 2].map(i => <rect key={i} x={430 + i * 11} y="244" width="7" height="9" rx="1" opacity={i === 2 ? '.3' : '1'}/>)}</g>
  </svg>;
}
