import type { PetRolePackId } from './pet-appearance';

export function DesktopPetIllustration({ rolePack }: { rolePack: PetRolePackId }) {
  switch (rolePack) {
    case 'cat':
      return (
        <span className="desktop-pet__art desktop-pet__art--cat">
          <svg className="desktop-pet__art-svg" viewBox="0 0 160 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <ellipse cx="78" cy="123" rx="44" ry="10" fill="#D3DFEF" />
            <rect x="95" y="43" width="32" height="44" rx="10" fill="#FFFDF7" />
            <rect x="100" y="50" width="22" height="7" rx="3.5" fill="#FFD66E" />
            <rect x="100" y="62" width="17" height="7" rx="3.5" fill="#FF9FB0" />
            <rect x="100" y="73" width="20" height="7" rx="3.5" fill="#8FD5B6" />
            <path d="M58 44 L71 60 H46 Z" fill="#B8DBFF" />
            <path d="M95 44 L111 60 H84 Z" fill="#B8DBFF" />
            <ellipse cx="76" cy="84" rx="34" ry="28" fill="#CDE6FF" />
            <ellipse cx="54" cy="82" rx="17" ry="15" fill="#E7F2FF" />
            <ellipse cx="98" cy="82" rx="17" ry="15" fill="#E7F2FF" />
            <circle cx="64" cy="80" r="5" fill="#2E2440" />
            <circle cx="88" cy="80" r="5" fill="#2E2440" />
            <path d="M69 92 C75 97 83 97 89 92" stroke="#2E2440" strokeWidth="4" strokeLinecap="round" />
            <path d="M107 98 C126 92 132 73 123 65" stroke="#8BBEF5" strokeWidth="10" strokeLinecap="round" fill="none" />
            <path d="M109 100 L126 88" stroke="#2E2440" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </span>
      );
    case 'robot':
      return (
        <span className="desktop-pet__art desktop-pet__art--robot">
          <svg className="desktop-pet__art-svg" viewBox="0 0 160 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <ellipse cx="80" cy="124" rx="42" ry="10" fill="#D0C5F1" />
            <rect x="44" y="52" width="68" height="58" rx="22" fill="#BCA8F4" />
            <rect x="57" y="37" width="42" height="24" rx="12" fill="#D7C8FF" />
            <rect x="58" y="67" width="40" height="20" rx="10" fill="#5B5794" />
            <rect x="63" y="72" width="10" height="3" rx="1.5" fill="#8EF1C1" />
            <rect x="76" y="72" width="10" height="3" rx="1.5" fill="#8EF1C1" />
            <rect x="89" y="72" width="5" height="3" rx="1.5" fill="#FFCC73" />
            <circle cx="67" cy="93" r="5" fill="#2E2440" />
            <circle cx="89" cy="93" r="5" fill="#2E2440" />
            <path d="M71 102 C76 107 84 107 89 102" stroke="#2E2440" strokeWidth="4" strokeLinecap="round" />
            <path d="M78 37 V24" stroke="#8269D6" strokeWidth="8" strokeLinecap="round" />
            <circle cx="78" cy="19" r="7" fill="#FF8B7C" />
            <path d="M57 110 V125" stroke="#8269D6" strokeWidth="8" strokeLinecap="round" />
            <path d="M100 110 V125" stroke="#8269D6" strokeWidth="8" strokeLinecap="round" />
            <path d="M112 83 C126 79 131 93 123 103" stroke="#8269D6" strokeWidth="7" strokeLinecap="round" fill="none" />
            <circle cx="122" cy="106" r="5" fill="#8EF1C1" />
          </svg>
        </span>
      );
    case 'monk':
      return (
        <span className="desktop-pet__art desktop-pet__art--monk">
          <svg className="desktop-pet__art-svg" viewBox="0 0 160 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <ellipse
              className="desktop-pet__monk-breath-halo"
              cx="76"
              cy="92"
              rx="30"
              ry="22"
              fill="#f5d59b"
              opacity="0.18"
            />
            <g className="desktop-pet__woodfish">
              <ellipse
                className="desktop-pet__woodfish-shell"
                cx="118"
                cy="104"
                rx="22"
                ry="17"
                fill="#A96B33"
              />
              <ellipse cx="113" cy="101" rx="12" ry="8" fill="#D59A57" opacity="0.9" />
              <ellipse
                className="desktop-pet__woodfish-slot"
                cx="119"
                cy="105"
                rx="7.5"
                ry="2.6"
                fill="#8a5325"
                opacity="0.82"
              />
              <circle
                className="desktop-pet__woodfish-impact"
                cx="119"
                cy="104"
                r="11"
                fill="none"
                stroke="#f8dca2"
                strokeWidth="2"
              />
              <circle
                className="desktop-pet__woodfish-echo"
                cx="119"
                cy="104"
                r="16"
                fill="none"
                stroke="#f6d8a0"
                strokeWidth="1.6"
              />
            </g>
            <g className="desktop-pet__monk-rig">
              <g className="desktop-pet__monk-body">
                <g className="desktop-pet__monk-head">
                  <circle cx="76" cy="50" r="18" fill="#F1C27D" />
                  <ellipse
                    className="desktop-pet__monk-brow"
                    cx="76"
                    cy="44"
                    rx="8"
                    ry="2.2"
                    fill="#8a603d"
                    opacity="0.22"
                  />
                  <circle
                    className="desktop-pet__monk-cheek desktop-pet__monk-cheek--left"
                    cx="69"
                    cy="55"
                    r="3.2"
                    fill="#e59c86"
                    opacity="0.28"
                  />
                  <circle
                    className="desktop-pet__monk-cheek desktop-pet__monk-cheek--right"
                    cx="84"
                    cy="55"
                    r="3.2"
                    fill="#e59c86"
                    opacity="0.28"
                  />
                  <ellipse
                    className="desktop-pet__monk-eye desktop-pet__monk-eye--left"
                    cx="69"
                    cy="50"
                    rx="4.2"
                    ry="4.6"
                    fill="#2E2440"
                  />
                  <ellipse
                    className="desktop-pet__monk-eye desktop-pet__monk-eye--right"
                    cx="84"
                    cy="50"
                    rx="4.2"
                    ry="4.6"
                    fill="#2E2440"
                  />
                  <path
                    className="desktop-pet__monk-mouth"
                    d="M70 60 C74 64 80 64 84 60"
                    fill="none"
                    stroke="#2E2440"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </g>
                <path
                  className="desktop-pet__monk-robe"
                  d="M49 114 C48 97 50 79 52 71 C55 63 64 63 76 63 C91 63 108 71 108 91 V114 Z"
                  fill="#F6A96C"
                />
                <path
                  className="desktop-pet__monk-robe-fold"
                  d="M69 67 C73 81 75 93 75 112"
                  fill="none"
                  stroke="#db9257"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.72"
                />
                <circle
                  className="desktop-pet__monk-beads"
                  cx="66"
                  cy="82"
                  r="12"
                  fill="none"
                  stroke="#8C5A30"
                  strokeWidth="4"
                  strokeDasharray="1.5 6"
                  strokeLinecap="round"
                />
                <g className="desktop-pet__monk-arm desktop-pet__monk-arm--left">
                  <path
                    d="M94 92 C102 97 107 99 111 101"
                    stroke="#F6A96C"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <circle
                    className="desktop-pet__monk-hand desktop-pet__monk-hand--left"
                    cx="109"
                    cy="100"
                    r="4.8"
                    fill="#e6b37d"
                  />
                </g>
                <g className="desktop-pet__monk-arm desktop-pet__monk-arm--right">
                  <path
                    className="desktop-pet__monk-sleeve"
                    d="M97 77 C109 59 118 51 127 44"
                    fill="none"
                    stroke="#8C5A30"
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                  <circle
                    className="desktop-pet__monk-hand desktop-pet__monk-hand--right"
                    cx="130"
                    cy="41"
                    r="7"
                    fill="#D5A16A"
                  />
                  <g className="desktop-pet__mallet">
                    <path
                      className="desktop-pet__mallet-trail"
                      d="M94 78 Q108 62 124 47"
                      fill="none"
                      stroke="#f5d8ab"
                      strokeWidth="4"
                      strokeLinecap="round"
                      opacity="0"
                    />
                    <path
                      d="M96 76 C109 58 117 50 126 44"
                      fill="none"
                      stroke="#8C5A30"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />
                  </g>
                </g>
              </g>
            </g>
          </svg>
        </span>
      );
    case 'lobster':
    default:
      return (
        <span className="desktop-pet__art desktop-pet__art--lobster">
          <svg className="desktop-pet__art-svg" viewBox="0 0 160 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="40" y="103" width="80" height="22" rx="11" fill="#FFEEDC" />
            <rect x="52" y="106" width="56" height="14" rx="7" fill="#6D5C82" />
            <rect x="57" y="110" width="6" height="3" rx="1.5" fill="#FFF4EA" />
            <rect x="67" y="110" width="6" height="3" rx="1.5" fill="#FFF4EA" />
            <rect x="77" y="110" width="6" height="3" rx="1.5" fill="#FFF4EA" />
            <rect x="87" y="110" width="6" height="3" rx="1.5" fill="#FFF4EA" />
            <rect x="97" y="110" width="6" height="3" rx="1.5" fill="#FFF4EA" />
            <ellipse cx="80" cy="128" rx="40" ry="9" fill="#E3BBA5" />
            <ellipse cx="80" cy="83" rx="34" ry="29" fill="#FF8A72" />
            <circle cx="62" cy="47" r="10" fill="#FFB9AA" />
            <circle cx="98" cy="47" r="10" fill="#FFB9AA" />
            <path d="M52 45 C52 29 70 25 80 25 C90 25 108 29 108 45" stroke="#4E4B75" strokeWidth="6" strokeLinecap="round" fill="none" />
            <rect x="48" y="42" width="10" height="18" rx="5" fill="#4E4B75" />
            <rect x="102" y="42" width="10" height="18" rx="5" fill="#4E4B75" />
            <circle cx="62" cy="47" r="4" fill="#2E2440" />
            <circle cx="98" cy="47" r="4" fill="#2E2440" />
            <path d="M80 58 C68 58 66 72 66 81 C66 96 72 108 80 108 C88 108 94 96 94 81 C94 72 92 58 80 58Z" fill="#FF6F61" />
            <path d="M54 80 C31 73 22 84 22 94 C22 104 30 110 46 106" stroke="#FF6F61" strokeWidth="11" strokeLinecap="round" fill="none" />
            <path d="M106 84 C126 79 135 88 135 97 C135 105 128 110 116 107" stroke="#FF6F61" strokeWidth="11" strokeLinecap="round" fill="none" />
            <circle cx="33" cy="95" r="9" fill="#FF8A72" />
            <circle cx="126" cy="98" r="8" fill="#FF8A72" />
            <path d="M71 88 C75 94 85 94 89 88" stroke="#2E2440" strokeWidth="4" strokeLinecap="round" />
            <circle cx="126" cy="42" r="8" fill="#FFF4EA" />
            <path d="M122 42 H130 M126 38 V46" stroke="#FF7D6F" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      );
  }
}
