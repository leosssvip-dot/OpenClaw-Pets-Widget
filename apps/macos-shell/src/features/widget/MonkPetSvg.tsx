export function MonkPetSvg({
  className = '',
  svgClassName = ''
}: {
  className?: string;
  svgClassName?: string;
}) {
  return (
    <span className={['desktop-pet__monk', className].filter(Boolean).join(' ')}>
      <svg
        className={['desktop-pet__monk-svg', svgClassName].filter(Boolean).join(' ')}
        viewBox="0 0 144 138"
        aria-hidden="true"
      >
        <g transform="translate(10 8)">
          <ellipse
            className="desktop-pet__monk-breath-halo"
            cx="63"
            cy="68"
            rx="25"
            ry="19"
            fill="#f5d59b"
            opacity="0.2"
          />
          <ellipse
            className="desktop-pet__monk-cushion"
            cx="63"
            cy="103"
            rx="31"
            ry="9"
            fill="#c96d3a"
            stroke="#9d4f28"
            strokeWidth="2"
          />
          <g className="desktop-pet__woodfish">
            <ellipse
              className="desktop-pet__woodfish-shell"
              cx="79"
              cy="81"
              rx="10.5"
              ry="8"
              fill="#b97033"
              stroke="#8a4b1f"
              strokeWidth="2"
            />
            <ellipse
              cx="75"
              cy="77"
              rx="2.6"
              ry="2.1"
              fill="#f0ca8b"
              opacity="0.9"
            />
            <ellipse
              className="desktop-pet__woodfish-slot"
              cx="79"
              cy="81.5"
              rx="3.8"
              ry="1.5"
              fill="#6e3712"
              opacity="0.88"
            />
            <circle
              className="desktop-pet__woodfish-impact"
              cx="79"
              cy="81"
              r="7.5"
              fill="none"
              stroke="#f8dca2"
              strokeWidth="1.8"
            />
            <circle
              className="desktop-pet__woodfish-echo"
              cx="79"
              cy="81"
              r="11.5"
              fill="none"
              stroke="#f6d8a0"
              strokeWidth="1.4"
            />
          </g>
          <g className="desktop-pet__monk-rig">
            <g className="desktop-pet__monk-body">
              <g className="desktop-pet__monk-head">
                <circle
                  cx="63"
                  cy="27"
                  r="16"
                  fill="#e8bc84"
                  stroke="#c79661"
                  strokeWidth="1.5"
                />
                <ellipse
                  className="desktop-pet__monk-brow"
                  cx="63"
                  cy="22"
                  rx="7"
                  ry="1.8"
                  fill="#8a603d"
                  opacity="0.24"
                />
                <circle
                  className="desktop-pet__monk-cheek desktop-pet__monk-cheek--left"
                  cx="54"
                  cy="31"
                  r="3"
                  fill="#e59c86"
                  opacity="0.3"
                />
                <circle
                  className="desktop-pet__monk-cheek desktop-pet__monk-cheek--right"
                  cx="72"
                  cy="31"
                  r="3"
                  fill="#e59c86"
                  opacity="0.3"
                />
                <ellipse
                  className="desktop-pet__monk-eye desktop-pet__monk-eye--left"
                  cx="58"
                  cy="27"
                  rx="2.5"
                  ry="1.4"
                  fill="#5b432e"
                />
                <ellipse
                  className="desktop-pet__monk-eye desktop-pet__monk-eye--right"
                  cx="68"
                  cy="27"
                  rx="2.5"
                  ry="1.4"
                  fill="#5b432e"
                />
                <path
                  className="desktop-pet__monk-mouth"
                  d="M59 33 Q63 35 67 33"
                  fill="none"
                  stroke="#6b4528"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </g>
              <path
                className="desktop-pet__monk-robe"
                d="M45 47 C49 40 55 38 63 38 C72 38 79 41 84 48 L88 78 C84 91 75 96 63 96 C51 96 42 91 38 78 Z"
                fill="#c87835"
                stroke="#a65d2b"
                strokeWidth="2"
              />
              <path
                className="desktop-pet__monk-robe-fold"
                d="M61 47 C63 58 64 70 62 83"
                fill="none"
                stroke="#e4ad6a"
                strokeWidth="2.3"
                strokeLinecap="round"
                opacity="0.72"
              />
              <circle
                className="desktop-pet__monk-beads"
                cx="57"
                cy="60"
                r="9"
                fill="none"
                stroke="#8a5428"
                strokeWidth="3"
                strokeDasharray="1.5 4.2"
                strokeLinecap="round"
              />
              <g className="desktop-pet__monk-arm desktop-pet__monk-arm--left">
                <path
                  d="M45 58 C48 55 53 56 56 60 C57 66 56 71 52 75 C47 73 44 67 45 58 Z"
                  fill="#ca7a37"
                  stroke="#a55c2a"
                  strokeWidth="1.5"
                />
                <rect
                  x="49"
                  y="60"
                  width="8"
                  height="18"
                  rx="4"
                  fill="#e6b37d"
                  transform="rotate(19 53 69)"
                />
                <circle
                  className="desktop-pet__monk-hand desktop-pet__monk-hand--left"
                  cx="68"
                  cy="79"
                  r="4.6"
                  fill="#e6b37d"
                />
              </g>
              {/* Outer g positions the arm so (0,0) = shoulder joint at local (73,55) */}
              <g transform="translate(73 55)">
                <g className="desktop-pet__monk-arm desktop-pet__monk-arm--right">
                  <path
                    className="desktop-pet__monk-sleeve"
                    d="M0 0 C6 -2 10 1 12 6 C11 12 8 16 3 17 C-1 13 -2 6 0 0 Z"
                    fill="#ca7a37"
                    stroke="#a55c2a"
                    strokeWidth="1.5"
                  />
                  <circle
                    className="desktop-pet__monk-hand desktop-pet__monk-hand--right"
                    cx="7"
                    cy="18"
                    r="4.1"
                    fill="#e6b37d"
                  />
                  <g className="desktop-pet__mallet">
                    <path
                      className="desktop-pet__mallet-trail"
                      d="M6 20 Q7 24 7 28"
                      fill="none"
                      stroke="#f5d8ab"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity="0"
                    />
                    {/* handle: starts at hand, extends down to woodfish */}
                    <rect
                      x="5.5"
                      y="17"
                      width="3"
                      height="10"
                      rx="1.5"
                      fill="#d6b17a"
                    />
                    {/* head: rounded striking end resting on woodfish top */}
                    <ellipse
                      cx="7"
                      cy="27"
                      rx="4.5"
                      ry="3"
                      fill="#b97636"
                      stroke="#975822"
                      strokeWidth="1.4"
                    />
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>
    </span>
  );
}
