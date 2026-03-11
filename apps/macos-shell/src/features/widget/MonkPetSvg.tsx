export function MonkPetSvg() {
  return (
    <span className="desktop-pet__monk">
      <svg
        className="desktop-pet__monk-svg"
        viewBox="0 0 144 138"
        aria-hidden="true"
      >
        <g transform="translate(7 7)">
          <ellipse
            className="desktop-pet__monk-breath-halo"
            cx="67"
            cy="71"
            rx="30"
            ry="22"
            fill="#f5d59b"
            opacity="0.22"
          />
          <ellipse
            className="desktop-pet__monk-cushion"
            cx="63"
            cy="103"
            rx="30"
            ry="9"
            fill="#c96d3a"
            stroke="#9d4f28"
            strokeWidth="2"
          />
          <g className="desktop-pet__woodfish">
          <ellipse
            cx="93"
            cy="78"
            rx="16"
            ry="12"
            fill="#b97033"
            stroke="#8a4b1f"
            strokeWidth="2"
          />
          <ellipse
            cx="88"
            cy="73"
            rx="4"
            ry="3"
            fill="#f0ca8b"
            opacity="0.9"
          />
          <ellipse
            className="desktop-pet__woodfish-slot"
            cx="93"
            cy="79"
            rx="6"
            ry="2.5"
            fill="#6e3712"
            opacity="0.85"
          />
          <circle
            className="desktop-pet__woodfish-impact"
            cx="93"
            cy="77"
            r="11"
            fill="none"
            stroke="#f8dca2"
            strokeWidth="2"
          />
          <circle
            className="desktop-pet__woodfish-echo"
            cx="93"
            cy="77"
            r="16"
            fill="none"
            stroke="#f6d8a0"
            strokeWidth="1.6"
          />
          </g>
          <g className="desktop-pet__monk-rig">
          <g className="desktop-pet__monk-body">
            <g className="desktop-pet__monk-head">
              <circle
                cx="68"
                cy="27"
                r="17"
                fill="#e8bc84"
                stroke="#c79661"
                strokeWidth="1.5"
              />
              <ellipse className="desktop-pet__monk-brow" cx="68" cy="22" rx="8" ry="2" fill="#8a603d" opacity="0.25" />
              <circle className="desktop-pet__monk-cheek desktop-pet__monk-cheek--left" cx="58" cy="31" r="3.4" fill="#e59c86" opacity="0.35" />
              <circle className="desktop-pet__monk-cheek desktop-pet__monk-cheek--right" cx="78" cy="31" r="3.4" fill="#e59c86" opacity="0.35" />
              <ellipse className="desktop-pet__monk-eye desktop-pet__monk-eye--left" cx="62" cy="27" rx="2.8" ry="1.6" fill="#5b432e" />
              <ellipse className="desktop-pet__monk-eye desktop-pet__monk-eye--right" cx="74" cy="27" rx="2.8" ry="1.6" fill="#5b432e" />
              <path
                className="desktop-pet__monk-mouth"
                d="M64 33 Q68 36 72 33"
                fill="none"
                stroke="#6b4528"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </g>
            <path
              className="desktop-pet__monk-robe"
              d="M47 47 C51 40 58 37 68 37 C78 37 86 40 91 47 L94 79 C88 89 80 94 68 94 C56 94 47 89 42 79 Z"
              fill="#c87835"
              stroke="#a65d2b"
              strokeWidth="2"
            />
            <path
              className="desktop-pet__monk-robe-fold"
              d="M63 45 C67 57 69 69 66 83"
              fill="none"
              stroke="#e4ad6a"
              strokeWidth="2.4"
              strokeLinecap="round"
              opacity="0.74"
            />
            <circle
              className="desktop-pet__monk-beads"
              cx="62"
              cy="60"
              r="10"
              fill="none"
              stroke="#8a5428"
              strokeWidth="3"
              strokeDasharray="1.5 4.2"
              strokeLinecap="round"
            />
            <g className="desktop-pet__monk-arm desktop-pet__monk-arm--left">
              <rect
                x="43"
                y="55"
                width="11"
                height="28"
                rx="5.5"
                fill="#e6b37d"
              />
            </g>
            <g className="desktop-pet__monk-arm desktop-pet__monk-arm--right">
              <path
                className="desktop-pet__monk-sleeve"
                d="M79 52 C85 50 90 52 92 58 C92 64 90 69 84 71 C79 67 77 61 79 52 Z"
                fill="#ca7a37"
                stroke="#a55c2a"
                strokeWidth="1.5"
              />
              <rect
                x="78"
                y="53"
                width="10"
                height="30"
                rx="5"
                fill="#e6b37d"
              />
              <g className="desktop-pet__mallet">
                <path
                  className="desktop-pet__mallet-trail"
                  d="M84 67 Q96 60 108 64"
                  fill="none"
                  stroke="#f5d8ab"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0"
                />
                <rect
                  x="83"
                  y="67"
                  width="25"
                  height="5"
                  rx="2.5"
                  fill="#d6b17a"
                />
                <rect
                  x="103"
                  y="62"
                  width="12"
                  height="14"
                  rx="4"
                  fill="#b97636"
                  stroke="#975822"
                  strokeWidth="1.5"
                />
              </g>
            </g>
          </g>
          </g>
        </g>
      </svg>
    </span>
  );
}
