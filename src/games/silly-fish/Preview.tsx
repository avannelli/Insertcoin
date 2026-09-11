// Cabinet screenshot: the fish lining up the next gap, coral closing in from the right.
export default function SillyFishPreview() {
  return <svg className="cabinet-preview" viewBox="0 0 480 270" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="sf-water" x2="0" y2="1"><stop stopColor="#10395a"/><stop offset=".5" stopColor="#122a48"/><stop offset="1" stopColor="#0d1a30"/></linearGradient>
      <linearGradient id="sf-shaft" x2="0" y2="1"><stop stopColor="#9ff0ff" stopOpacity=".16"/><stop offset="1" stopColor="#9ff0ff" stopOpacity="0"/></linearGradient>
      <radialGradient id="sf-vignette"><stop offset=".55" stopColor="#000" stopOpacity="0"/><stop offset="1" stopColor="#04101c" stopOpacity=".62"/></radialGradient>
    </defs>
    <path fill="url(#sf-water)" d="M0 0h480v270H0z"/>
    <g fill="url(#sf-shaft)">
      <path d="M52 0h54l-34 270H10z"/><path d="M188 0h32l-22 270h-36z"/><path d="M300 0h44l-30 270h-48z"/>
    </g>
    <g fill="#7fe4ff" opacity=".3">
      {[[64, 58, 4], [96, 132, 2.5], [140, 40, 3], [206, 205, 3.5], [268, 96, 2], [330, 176, 4], [402, 66, 2.5], [436, 214, 3]].map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r}/>)}
    </g>
    <g fill="#0a1728" opacity=".85"><path d="M0 246q42-26 86-10t92 2 96-16 108 10 98-8v46H0z"/></g>
    <g fill="#1d6f6a" opacity=".55">
      {[24, 62, 108, 150].map(x => <path key={x} d={`M${x} 262q-6-30 4-46t2-32`} stroke="#2b8f86" strokeWidth="5" fill="none" strokeLinecap="round"/>)}
    </g>
    <g>
      <path fill="#c34d91" d="M352 0h44v92q-22 14-44 0z"/>
      <path fill="#e57ab8" d="M352 0h9v96h-9z" opacity=".6"/>
      <g stroke="#ffa2c7" strokeWidth="3.5" strokeLinecap="round" fill="none"><path d="M362 18q-16 10-19 32M386 30q14 10 16 34M374 8v84"/></g>
      <path fill="#2f9d93" d="M352 178h44v92h-44z"/>
      <path fill="#5fd3c2" d="M387 178h9v92h-9z" opacity=".55"/>
      <g stroke="#9cf1d5" strokeWidth="3.5" strokeLinecap="round" fill="none"><path d="M364 262q-14-14-14-40M388 250q12-14 12-38M374 270v-88"/></g>
    </g>
    <g fill="#9cf1d5" opacity=".5">{[[344, 104, 3], [338, 122, 2], [346, 150, 2.5], [340, 166, 2]].map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r}/>)}</g>
    <g fill="#ffce93" opacity=".45">{[[176, 96, 3], [160, 118, 2], [148, 142, 2.5]].map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r}/>)}</g>
    <g transform="translate(196 138) rotate(-14) scale(1.25)">
      <path fill="#e8873c" d="M-22 0l-24-19v38z"/>
      <path fill="#f7ed59" d="M-4-14L12-33l11 19z"/>
      <ellipse fill="#ffa94e" rx="31" ry="21"/>
      <path fill="#ffc97d" d="M-31 0a31 21 0 0 1 62 0z" opacity=".45"/>
      <path stroke="#fff1c9" strokeWidth="9" strokeLinecap="round" d="M-12-16v32M11-15v30"/>
      <path fill="#f7ed59" d="M1 3l-15 16 23-3z"/>
      <circle cx="22" cy="-6" r="5.5" fill="#171127"/><circle cx="23.6" cy="-7.6" r="1.7" fill="#fff"/>
    </g>
    <path fill="url(#sf-vignette)" d="M0 0h480v270H0z"/>
    <g fontFamily="ui-monospace, monospace" fontSize="10" letterSpacing="2">
      <text x="18" y="26" fill="#58e6cf">REEF_02</text>
      <text x="462" y="26" fill="#f7ed59" textAnchor="end">×014</text>
      <text x="18" y="254" fill="#8fa6bd" fontSize="9">SMALL FISH. BIG AMBITIONS.</text>
    </g>
  </svg>;
}
