export default function SillyFishPreview() {
  return <svg className="fish-preview" viewBox="0 0 450 300" width="100%" height="100%" aria-hidden="true">
    <defs><linearGradient id="fish-water" x2="0" y2="1"><stop stopColor="#131c35"/><stop offset="1" stopColor="#241530"/></linearGradient></defs>
    <path fill="url(#fish-water)" d="M0 0h450v300H0z"/>
    <g fill="none" stroke="#58e6cf" opacity=".22">{[30, 85, 156, 238, 324, 408].map((x, i) => <circle key={x} cx={x} cy={45 + (i * 53) % 210} r={3 + i % 4}/>)}</g>
    <g fill="none" strokeLinecap="round">
      <path stroke="#c34d91" strokeWidth="22" d="M347-12Q339 32 348 80"/>
      <path stroke="#c34d91" strokeWidth="12" d="M345 12Q320 23 315 57M345 28Q369 35 377 62M337 30Q329 49 331 69"/>
      <path stroke="#ffa2c7" strokeWidth="4" d="M342 4Q343 39 347 76M321 39l-5 14M367 44l8 15"/>
      <path stroke="#39b7ae" strokeWidth="23" d="M347 312Q338 263 348 212"/>
      <path stroke="#39b7ae" strokeWidth="12" d="M346 284Q321 270 315 241M345 271Q372 266 378 233M341 260Q330 242 333 228"/>
      <path stroke="#9cf1d5" strokeWidth="4" d="M341 294Q338 253 348 215M325 261l-8-17M370 256l7-20"/>
    </g>
    <g fill="#ffce93">{[18, 33, 49, 65].map(y => <circle key={y} cx={350 + Math.sin(y) * 3} cy={y} r="1.6"/>)}</g>
    <g fill="#9cf1d5">{[230, 247, 265, 285].map(y => <circle key={y} cx={347 + Math.sin(y) * 4} cy={y} r="1.6"/>)}</g>
    <g transform="translate(160 152) rotate(-12)"><path fill="#ffa94e" d="M-20 0l-22-18v36z"/><path fill="#f7ed59" d="M-6-12L8-30l12 18z"/><ellipse fill="#ffa94e" rx="30" ry="21"/><path stroke="#fff1c9" strokeWidth="9" d="M-11-18v36M12-17v34"/><path fill="#f7ed59" d="M0 2l-14 16 22-3z"/><circle cx="22" cy="-5" r="5" fill="#171127"/><circle cx="23" cy="-7" r="1.5" fill="white"/></g>
    <text x="20" y="25" fill="#58e6cf" fontFamily="monospace" fontSize="9" letterSpacing="2">REEF_02</text>
    <text x="20" y="280" fill="#a99bbd" fontFamily="monospace" fontSize="9" letterSpacing="2">SMALL FISH. BIG AMBITIONS.</text>
  </svg>;
}
