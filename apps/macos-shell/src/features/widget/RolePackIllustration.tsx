import type { PetRolePackId } from './pet-appearance';

export function RolePackIllustration({
  rolePack,
  className = '',
  svgClassName = ''
}: {
  rolePack: PetRolePackId;
  className?: string;
  svgClassName?: string;
}) {
  const classes = ['role-pack-illustration', `role-pack-illustration--${rolePack}`, className]
    .filter(Boolean)
    .join(' ');
  const svgClasses = ['role-pack-illustration__svg', svgClassName].filter(Boolean).join(' ');

  switch (rolePack) {
    case 'cat':
      return (
        <span className={classes} aria-hidden="true">
          <svg className={svgClasses} viewBox="0 0 160 150" xmlns="http://www.w3.org/2000/svg">
            <rect width="160" height="150" rx="24" fill="#EEF6FF" />
            <rect x="95" y="40" width="34" height="48" rx="10" fill="#FFFDF7" />
            <rect x="100" y="48" width="24" height="9" rx="4.5" fill="#FFD66E" />
            <rect x="100" y="61" width="18" height="8" rx="4" fill="#FF9FB0" />
            <rect x="100" y="73" width="22" height="8" rx="4" fill="#8FD5B6" />
            <ellipse cx="76" cy="124" rx="44" ry="10" fill="#C9DDF0" />
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
        <span className={classes} aria-hidden="true">
          <svg className={svgClasses} viewBox="0 0 160 150" xmlns="http://www.w3.org/2000/svg">
            <rect width="160" height="150" rx="24" fill="#F4EEFF" />
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
        <span className={classes} aria-hidden="true">
          <svg className={svgClasses} viewBox="0 0 160 150" xmlns="http://www.w3.org/2000/svg">
            <rect width="160" height="150" rx="24" fill="#FFF7DA" />
            <ellipse cx="80" cy="124" rx="42" ry="10" fill="#DFC98D" />
            <ellipse cx="120" cy="102" rx="23" ry="17" fill="#A96B33" />
            <ellipse cx="120" cy="101" rx="13" ry="8" fill="#D59A57" />
            <circle cx="76" cy="50" r="18" fill="#F1C27D" />
            <path d="M49 85 C49 69 63 63 76 63 C91 63 109 71 108 92 V114 H51 Z" fill="#F6A96C" />
            <circle cx="69" cy="49" r="4" fill="#2E2440" />
            <circle cx="84" cy="49" r="4" fill="#2E2440" />
            <path d="M70 58 C74 62 80 62 84 58" stroke="#2E2440" strokeWidth="4" strokeLinecap="round" />
            <path d="M96 76 C109 58 117 50 126 44" stroke="#8C5A30" strokeWidth="7" strokeLinecap="round" />
            <circle cx="130" cy="41" r="7" fill="#D5A16A" />
            <path d="M95 90 C104 96 109 98 112 100" stroke="#F6A96C" strokeWidth="9" strokeLinecap="round" />
            <path d="M120 75 C126 73 132 73 138 75" stroke="#8C5A30" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
            <path d="M122 123 C126 118 129 111 129 104" stroke="#8C5A30" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
          </svg>
        </span>
      );
    case 'lobster':
    default:
      return (
        <span className={classes} aria-hidden="true">
          <svg className={svgClasses} viewBox="0 0 160 150" xmlns="http://www.w3.org/2000/svg">
            <rect width="160" height="150" rx="24" fill="#FFE8DA" />
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
