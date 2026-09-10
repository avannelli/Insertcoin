export default function AirHockeyPreview() {
  return <svg className="fish-preview" viewBox="0 0 450 300" width="100%" height="100%" aria-hidden="true">
    <path fill="#12172b" d="M0 0h450v300H0z"/>
    <path fill="#e8f2f6" d="M120 22h210v256H120z"/>
    <g stroke="#fff" opacity=".5">{Array.from({ length: 22 }, (_, i) => <path key={i} d={`M${130 + i * 37 % 170} ${32 + i * 53 % 225}l14 4`}/>)}</g>
    <g fill="none"><path stroke="#c83f53" strokeWidth="2" d="M120 150h210"/><path stroke="#3675b5" strokeWidth="3" d="M120 105h210M120 195h210"/><circle stroke="#3675b5" cx="225" cy="150" r="28"/>
      <path stroke="#c83f53" strokeWidth="3" d="M120 22h67m76 0h67M120 278h67m76 0h67"/>
      <path fill="#8cc9e4" fillOpacity=".5" stroke="#c83f53" d="M190 22a35 35 0 0 0 70 0zM190 278a35 35 0 0 1 70 0z"/>
      {[70, 230].flatMap(y => [164, 286].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="20" stroke="#c83f53" opacity=".6"/>))}
    </g>
    <circle cx="247" cy="72" r="17" fill="#ef4db8"/><circle cx="247" cy="72" r="9" fill="#171127" opacity=".25"/>
    <circle cx="194" cy="235" r="17" fill="#58e6cf"/><circle cx="194" cy="235" r="9" fill="#171127" opacity=".25"/>
    <path stroke="#253044" opacity=".12" strokeWidth="7" d="M238 174l-17 30"/><circle cx="239" cy="176" r="8" fill="#263044" opacity=".2"/><circle cx="238" cy="175" r="7" fill="#080b10"/><circle cx="238" cy="173" r="7" fill="#20252c"/><circle cx="238" cy="173" r="5" fill="none" stroke="#505863" strokeWidth=".7"/>
    <text x="20" y="25" fill="#58e6cf" fontFamily="monospace" fontSize="10" letterSpacing="1">TABLE_03</text>
    <text x="20" y="280" fill="#a99bbd" fontFamily="monospace" fontSize="9" letterSpacing="1">FIRST TO 7.</text>
  </svg>;
}
