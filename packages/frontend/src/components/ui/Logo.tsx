import './Logo.css';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 48, className = '' }: LogoProps) {
  return (
    <svg
      className={`logo-svg ${className}`}
      viewBox="75 120 310 210"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size * (210 / 310)}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <g id="steam-group">
          <path
            className="wisp-left"
            d="M 185 170 C 160 130, 200 90, 185 40 Q 180 20 185 10 Q 195 30 195 60 C 205 100, 170 140, 195 170 Z"
            fill="currentColor"
          />
          <path
            className="wisp-right"
            d="M 215 160 C 195 125, 225 90, 215 45 Q 210 25 215 15 Q 225 35 225 65 C 235 100, 205 135, 225 160 Z"
            fill="currentColor"
          />
        </g>
      </defs>

      <use href="#steam-group" className="steam steam-1" />
      <use href="#steam-group" className="steam steam-2" />

      <path
        d="M 290 205 C 365 205, 365 275, 275 275"
        fill="none"
        stroke="currentColor"
        strokeWidth="22"
        strokeLinecap="round"
      />

      <path
        d="M 100 180 C 100 290, 140 320, 200 320 C 260 320, 300 290, 300 180 Z"
        fill="currentColor"
      />

      <ellipse cx="200" cy="180" rx="100" ry="25" fill="currentColor" />
      <ellipse cx="200" cy="180" rx="92" ry="18" className="logo-inner" />

      <path
        d="M 140 230 Q 200 265 260 230 C 245 295 155 295 140 230 Z"
        className="logo-inner"
      />
      <path
        d="M 152 245 Q 200 272 248 245 C 238 285 162 285 152 245 Z"
        fill="currentColor"
      />

      <path
        d="M 125 215 Q 135 195 145 215"
        fill="none"
        className="logo-inner-stroke"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M 255 215 Q 265 195 275 215"
        fill="none"
        className="logo-inner-stroke"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
