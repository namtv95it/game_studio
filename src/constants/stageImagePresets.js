/**
 * Preset Background Images for Game Studio Stage
 * SVG Data URIs - lightweight, crisp, instant loading without external network requests
 */

export const STAGE_BG_IMAGE_PRESETS = [
  {
    id: 'preset-wood',
    name: 'Sàn Gỗ Tự Nhiên',
    category: 'wood',
    desc: 'Vân gỗ ấm áp phong cách studio gia đình',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='960' height='540' viewBox='0 0 960 540'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%234a2e18'/%3E%3Cstop offset='50%25' stop-color='%235c3a1e'/%3E%3Cstop offset='100%25' stop-color='%2338210f'/%3E%3C/linearGradient%3E%3Cpattern id='plank' width='160' height='90' patternUnits='userSpaceOnUse'%3E%3Crect width='160' height='90' fill='none' stroke='%232c190a' stroke-width='2'/%3E%3Cpath d='M0 25 Q40 28 80 23 T160 26 M0 55 Q50 50 100 57 T160 52 M0 75 Q30 78 70 73 T160 76' fill='none' stroke='%233a200e' stroke-width='0.8' stroke-opacity='0.6'/%3E%3Ccircle cx='45' cy='25' r='2' fill='%23221206' fill-opacity='0.5'/%3E%3C/pattern%3E%3CradialGradient id='vignette' cx='50%25' cy='50%25' r='60%25'%3E%3Cstop offset='60%25' stop-color='%23000' stop-opacity='0'/%3E%3Cstop offset='100%25' stop-color='%23000' stop-opacity='0.5'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='960' height='540' fill='url(%23bg)'/%3E%3Crect width='960' height='540' fill='url(%23plank)'/%3E%3Crect width='960' height='540' fill='url(%23vignette)'/%3E%3C/svg%3E"
  },
  {
    id: 'preset-classroom',
    name: 'Bảng Đen Lớp Học',
    category: 'education',
    desc: 'Bảng phấn màu xám rêu với viền gỗ cổ điển',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='960' height='540' viewBox='0 0 960 540'%3E%3Cdefs%3E%3ClinearGradient id='chalk' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2320302b'/%3E%3Cstop offset='50%25' stop-color='%23192622'/%3E%3Cstop offset='100%25' stop-color='%23131c19'/%3E%3C/linearGradient%3E%3Cpattern id='cgrid' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23ffffff' stroke-width='0.4' stroke-opacity='0.08'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='960' height='540' fill='%23614126'/%3E%3Crect x='16' y='16' width='928' height='508' fill='url(%23chalk)' rx='4'/%3E%3Crect x='16' y='16' width='928' height='508' fill='url(%23cgrid)' rx='4'/%3E%3Ccircle cx='200' cy='150' r='120' fill='%23ffffff' fill-opacity='0.02' filter='blur(20px)'/%3E%3Ccircle cx='700' cy='350' r='180' fill='%23ffffff' fill-opacity='0.02' filter='blur(20px)'/%3E%3C/svg%3E"
  },
  {
    id: 'preset-cosmic',
    name: 'Vũ Trụ Huyền Ảo',
    category: 'space',
    desc: 'Dải ngân hà sâu thẳm với ngàn sao lấp lánh',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='960' height='540' viewBox='0 0 960 540'%3E%3Cdefs%3E%3ClinearGradient id='sky' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%230a0818'/%3E%3Cstop offset='40%25' stop-color='%23180e29'/%3E%3Cstop offset='100%25' stop-color='%2306040d'/%3E%3C/linearGradient%3E%3CradialGradient id='neb1' cx='30%25' cy='40%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%237928ca' stop-opacity='0.4'/%3E%3Cstop offset='100%25' stop-color='%23000' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='neb2' cx='75%25' cy='65%25' r='45%25'%3E%3Cstop offset='0%25' stop-color='%230070f3' stop-opacity='0.35'/%3E%3Cstop offset='100%25' stop-color='%23000' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='960' height='540' fill='url(%23sky)'/%3E%3Crect width='960' height='540' fill='url(%23neb1)'/%3E%3Crect width='960' height='540' fill='url(%23neb2)'/%3E%3Ccircle cx='120' cy='80' r='1.5' fill='%23fff' fill-opacity='0.9'/%3E%3Ccircle cx='280' cy='140' r='1' fill='%23fff' fill-opacity='0.8'/%3E%3Ccircle cx='450' cy='60' r='2' fill='%2380d8ff' fill-opacity='0.9'/%3E%3Ccircle cx='620' cy='180' r='1.2' fill='%23fff' fill-opacity='0.7'/%3E%3Ccircle cx='820' cy='90' r='1.8' fill='%23ff80ab' fill-opacity='0.8'/%3E%3Ccircle cx='200' cy='320' r='1' fill='%23fff' fill-opacity='0.7'/%3E%3Ccircle cx='380' cy='420' r='1.6' fill='%23fff' fill-opacity='0.8'/%3E%3Ccircle cx='550' cy='300' r='2.2' fill='%23b388ff' fill-opacity='0.9'/%3E%3Ccircle cx='720' cy='450' r='1.4' fill='%23fff' fill-opacity='0.8'/%3E%3Ccircle cx='890' cy='380' r='1' fill='%23fff' fill-opacity='0.6'/%3E%3C/svg%3E"
  },
  {
    id: 'preset-blueprint',
    name: 'Bản Vẽ Blueprint',
    category: 'tech',
    desc: 'Giấy vẽ kỹ thuật màu lam đậm với lưới tọa độ',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='960' height='540' viewBox='0 0 960 540'%3E%3Cdefs%3E%3ClinearGradient id='bgblue' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%230f3057'/%3E%3Cstop offset='100%25' stop-color='%23001f3f'/%3E%3C/linearGradient%3E%3Cpattern id='smallgrid' width='16' height='16' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 16 0 L 0 0 0 16' fill='none' stroke='%2300ffff' stroke-width='0.4' stroke-opacity='0.15'/%3E%3C/pattern%3E%3Cpattern id='biggrid' width='80' height='80' patternUnits='userSpaceOnUse'%3E%3Crect width='80' height='80' fill='url(%23smallgrid)'/%3E%3Cpath d='M 80 0 L 0 0 0 80' fill='none' stroke='%2300ffff' stroke-width='1.2' stroke-opacity='0.35'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='960' height='540' fill='url(%23bgblue)'/%3E%3Crect width='960' height='540' fill='url(%23biggrid)'/%3E%3Crect x='20' y='20' width='920' height='500' fill='none' stroke='%2300ffff' stroke-width='2' stroke-opacity='0.4' stroke-dasharray='10 5'/%3E%3C/svg%3E"
  },
  {
    id: 'preset-brick',
    name: 'Tường Gạch Cổ Điển',
    category: 'architecture',
    desc: 'Tường gạch nung phong cách studio gác mái vintage',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='960' height='540' viewBox='0 0 960 540'%3E%3Cdefs%3E%3Cpattern id='brick' width='80' height='40' patternUnits='userSpaceOnUse'%3E%3Crect width='80' height='40' fill='%23632616'/%3E%3Crect x='2' y='2' width='76' height='16' fill='%23853621' rx='1'/%3E%3Crect x='42' y='22' width='76' height='16' fill='%23853621' rx='1'/%3E%3Crect x='-38' y='22' width='76' height='16' fill='%23853621' rx='1'/%3E%3Cpath d='M0 20 L80 20 M0 40 L80 40 M40 0 L40 20 M80 20 L80 40 M0 20 L0 40' stroke='%2338140b' stroke-width='3' fill='none'/%3E%3C/pattern%3E%3CradialGradient id='vign' cx='50%25' cy='50%25' r='60%25'%3E%3Cstop offset='40%25' stop-color='%23000' stop-opacity='0'/%3E%3Cstop offset='100%25' stop-color='%23000' stop-opacity='0.6'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='960' height='540' fill='url(%23brick)'/%3E%3Crect width='960' height='540' fill='url(%23vign)'/%3E%3C/svg%3E"
  },
  {
    id: 'preset-sky',
    name: 'Bầu Trời Mây Trắng',
    category: 'nature',
    desc: 'Bầu trời xanh ngát với những áng mây bồng bềnh anime',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='960' height='540' viewBox='0 0 960 540'%3E%3Cdefs%3E%3ClinearGradient id='bluesky' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%234facfe'/%3E%3Cstop offset='100%25' stop-color='%2300f2fe'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='960' height='540' fill='url(%23bluesky)'/%3E%3Cellipse cx='180' cy='320' rx='90' ry='35' fill='%23ffffff' fill-opacity='0.85'/%3E%3Cellipse cx='240' cy='300' rx='70' ry='45' fill='%23ffffff' fill-opacity='0.85'/%3E%3Cellipse cx='300' cy='325' rx='75' ry='30' fill='%23ffffff' fill-opacity='0.85'/%3E%3Cellipse cx='680' cy='180' rx='110' ry='40' fill='%23ffffff' fill-opacity='0.8'/%3E%3Cellipse cx='750' cy='160' rx='80' ry='50' fill='%23ffffff' fill-opacity='0.8'/%3E%3Cellipse cx='820' cy='190' rx='90' ry='35' fill='%23ffffff' fill-opacity='0.8'/%3E%3C/svg%3E"
  },
  {
    id: 'preset-cyber',
    name: 'Lưới Neon Cyberpunk',
    category: 'game',
    desc: 'Lưới phối cảnh neon phát sáng phong cách synthwave',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='960' height='540' viewBox='0 0 960 540'%3E%3Cdefs%3E%3ClinearGradient id='cybg' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23120626'/%3E%3Cstop offset='50%25' stop-color='%23280b45'/%3E%3Cstop offset='100%25' stop-color='%23080214'/%3E%3C/linearGradient%3E%3CradialGradient id='sun' cx='50%25' cy='55%25' r='30%25'%3E%3Cstop offset='0%25' stop-color='%23ff007f' stop-opacity='0.6'/%3E%3Cstop offset='100%25' stop-color='%23ff007f' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='960' height='540' fill='url(%23cybg)'/%3E%3Ccircle cx='480' cy='280' r='160' fill='url(%23sun)'/%3E%3Cg stroke='%2300ffff' stroke-width='1.2' stroke-opacity='0.4'%3E%3Cline x1='0' y1='280' x2='960' y2='280' stroke-width='2' stroke='%23ff007f' stroke-opacity='0.8'/%3E%3Cline x1='0' y1='300' x2='960' y2='300'/%3E%3Cline x1='0' y1='330' x2='960' y2='330'/%3E%3Cline x1='0' y1='375' x2='960' y2='375'/%3E%3Cline x1='0' y1='440' x2='960' y2='440'/%3E%3Cline x1='0' y1='525' x2='960' y2='525'/%3E%3Cline x1='480' y1='280' x2='-200' y2='540'/%3E%3Cline x1='480' y1='280' x2='80' y2='540'/%3E%3Cline x1='480' y1='280' x2='280' y2='540'/%3E%3Cline x1='480' y1='280' x2='480' y2='540'/%3E%3Cline x1='480' y1='280' x2='680' y2='540'/%3E%3Cline x1='480' y1='280' x2='880' y2='540'/%3E%3Cline x1='480' y1='280' x2='1160' y2='540'/%3E%3C/g%3E%3C/svg%3E"
  },
  {
    id: 'preset-grass',
    name: 'Sân Cỏ Mùa Hè',
    category: 'nature',
    desc: 'Sân cỏ thể thao xanh mướt mát mẻ',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='960' height='540' viewBox='0 0 960 540'%3E%3Cdefs%3E%3ClinearGradient id='grass' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%232e7d32'/%3E%3Cstop offset='50%25' stop-color='%23388e3c'/%3E%3Cstop offset='100%25' stop-color='%231b5e20'/%3E%3C/linearGradient%3E%3Cpattern id='turf' width='80' height='540' patternUnits='userSpaceOnUse'%3E%3Crect x='0' width='40' height='540' fill='%23ffffff' fill-opacity='0.04'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='960' height='540' fill='url(%23grass)'/%3E%3Crect width='960' height='540' fill='url(%23turf)'/%3E%3Ccircle cx='480' cy='270' r='100' fill='none' stroke='%23ffffff' stroke-width='2' stroke-opacity='0.25'/%3E%3Cline x1='480' y1='0' x2='480' y2='540' stroke='%23ffffff' stroke-width='2' stroke-opacity='0.25'/%3E%3C/svg%3E"
  }
];
