// Cabinet screenshot: a wide camera angle on the sheet, puck travelling toward the CPU goal.
const SCRATCHES = Array.from({ length: 46 }, (_, i) => {
  const x = 26 + (i * 97) % 430, y = 30 + (i * 61) % 212;
  return { x, y, dx: 5 + (i * 13) % 26, dy: ((i % 5) - 2) * 1.6, bright: i % 3 !== 0 };
});
export default function AirHockeyPreview() {
  return <svg className="cabinet-preview" viewBox="0 0 480 270" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="ah-ice" x1="0" y1="0" x2=".4" y2="1"><stop stopColor="#b3c8dd"/><stop offset=".5" stopColor="#9db6cf"/><stop offset="1" stopColor="#8099b6"/></linearGradient>
      <radialGradient id="ah-lamp"><stop stopColor="#e8f6ff" stopOpacity=".3"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient>
      <radialGradient id="ah-edge"><stop offset=".48" stopColor="#1f3c5c" stopOpacity="0"/><stop offset="1" stopColor="#16304d" stopOpacity=".62"/></radialGradient>
      <radialGradient id="ah-player"><stop stopColor="#b6fff1"/><stop offset=".55" stopColor="#58e6cf"/><stop offset="1" stopColor="#1f9c8c"/></radialGradient>
      <radialGradient id="ah-cpu"><stop stopColor="#ffb0e0"/><stop offset=".55" stopColor="#ef4db8"/><stop offset="1" stopColor="#a52076"/></radialGradient>
    </defs>
    <path fill="#141d2c" d="M0 0h480v270H0z"/>
    <path fill="url(#ah-ice)" d="M14 16h452v238H14z"/>
    <ellipse cx="140" cy="82" rx="170" ry="120" fill="url(#ah-lamp)"/>
    <ellipse cx="356" cy="196" rx="150" ry="110" fill="url(#ah-lamp)"/>
    <path fill="#fff" opacity=".12" d="M14 150 466 34v34L14 196z"/>
    <g strokeLinecap="round">
      {SCRATCHES.map(s => <path key={`${s.x}-${s.y}`} d={`M${s.x} ${s.y}l${s.dx} ${s.dy}`} stroke={s.bright ? '#fff' : '#8aa6bf'} strokeWidth={s.bright ? 1 : 1.3} opacity={s.bright ? .55 : .2}/>)}
    </g>
    <g fill="none">
      <path stroke="#2a63ad" strokeWidth="6" opacity=".8" d="M160 16v238M320 16v238"/>
      <path stroke="#c33448" strokeWidth="4" opacity=".82" d="M240 16v238"/>
      <circle cx="240" cy="135" r="42" stroke="#2a63ad" strokeWidth="2" opacity=".8"/>
      {[[86, 74], [86, 196], [394, 74], [394, 196]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="27" stroke="#c33448" strokeWidth="1.6" opacity=".6"/>)}
    </g>
    <g fill="#c2384c" opacity=".55">{[[86, 74], [86, 196], [394, 74], [394, 196], [240, 135]].map(([cx, cy]) => <circle key={`d${cx}-${cy}`} cx={cx} cy={cy} r="3"/>)}</g>
    <g>
      <path fill="#7fc0e0" opacity=".38" d="M14 88a48 48 0 0 1 0 94zM466 88a48 48 0 0 0 0 94z"/>
      <path fill="none" stroke="#c2384c" strokeWidth="2" opacity=".6" d="M14 88a48 48 0 0 1 0 94M466 88a48 48 0 0 0 0 94"/>
      <path fill="none" stroke="#c2384c" strokeWidth="4" opacity=".6" d="M14 16v238M466 16v238"/>
    </g>
    <path fill="url(#ah-edge)" d="M14 16h452v238H14z"/>
    <g fill="#0f1724"><rect x="0" y="98" width="14" height="74"/><rect x="466" y="98" width="14" height="74"/></g>
    <g stroke="#7a8899" strokeWidth="1" opacity=".55">
      {Array.from({ length: 7 }, (_, i) => <path key={`nl${i}`} d={`M2 ${104 + i * 11}h10`}/>)}
      {Array.from({ length: 7 }, (_, i) => <path key={`nr${i}`} d={`M468 ${104 + i * 11}h10`}/>)}
    </g>
    <g fill="#e9eef4"><rect x="10" y="10" width="460" height="6" opacity=".75"/><rect x="10" y="254" width="460" height="6" opacity=".75"/></g>
    <g>
      <ellipse cx="120" cy="164" rx="27" ry="22" fill="#1f3348" opacity=".22"/>
      <circle cx="118" cy="158" r="25" fill="url(#ah-player)"/>
      <circle cx="118" cy="158" r="17" fill="none" stroke="#fff" strokeWidth="2" opacity=".4"/>
      <circle cx="118" cy="158" r="10" fill="#0d2a2a" opacity=".35"/>
      <circle cx="111" cy="151" r="6" fill="#fff" opacity=".3"/>
    </g>
    <g>
      <ellipse cx="360" cy="102" rx="27" ry="22" fill="#1f3348" opacity=".22"/>
      <circle cx="358" cy="96" r="25" fill="url(#ah-cpu)"/>
      <circle cx="358" cy="96" r="17" fill="none" stroke="#fff" strokeWidth="2" opacity=".4"/>
      <circle cx="358" cy="96" r="10" fill="#2a0d22" opacity=".35"/>
      <circle cx="351" cy="89" r="6" fill="#fff" opacity=".3"/>
    </g>
    <g fill="#31465e">
      <circle cx="222" cy="151" r="9" opacity=".1"/><circle cx="238" cy="143" r="10" opacity=".16"/><circle cx="254" cy="135" r="11" opacity=".24"/>
    </g>
    <g>
      <ellipse cx="272" cy="132" rx="14" ry="12" fill="#26384d" opacity=".3"/>
      <circle cx="270" cy="126" r="12" fill="#080b10"/>
      <circle cx="270" cy="124" r="12" fill="#22272f"/>
      <circle cx="270" cy="124" r="9" fill="none" stroke="#59626d" strokeWidth="1"/>
      <circle cx="270" cy="124" r="4" fill="#12161c"/>
    </g>
    <g fontFamily="ui-monospace, monospace" letterSpacing="2">
      <rect x="196" y="8" width="88" height="24" rx="2" fill="#0c1421" opacity=".82"/>
      <text x="240" y="25" fill="#f7ed59" fontSize="12" textAnchor="middle">4 — 3</text>
      <text x="24" y="248" fill="#3d5a78" fontSize="9">TABLE_03</text>
      <text x="456" y="248" fill="#3d5a78" fontSize="9" textAnchor="end">FIRST TO 7</text>
    </g>
  </svg>;
}
