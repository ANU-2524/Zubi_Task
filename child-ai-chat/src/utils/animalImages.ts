/**
 * SVG Animal Images as data URLs for use when actual images aren't available
 */

export const animalSVGs = {
  elephant: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#e8e8e8"/>
    <ellipse cx="100" cy="120" rx="40" ry="50" fill="#999"/>
    <!-- Head -->
    <circle cx="100" cy="70" r="35" fill="#999"/>
    <!-- Ears -->
    <ellipse cx="70" cy="70" rx="20" ry="30" fill="#888"/>
    <ellipse cx="130" cy="70" rx="20" ry="30" fill="#888"/>
    <!-- Trunk -->
    <path d="M 100 90 Q 95 130 90 150" stroke="#888" stroke-width="8" fill="none"/>
    <!-- Eyes -->
    <circle cx="90" cy="65" r="3" fill="black"/>
    <circle cx="110" cy="65" r="3" fill="black"/>
    <!-- Tusk -->
    <path d="M 85 105 Q 80 125 85 135" stroke="#f0e68c" stroke-width="4" fill="none"/>
    <!-- Legs -->
    <rect x="85" y="160" width="8" height="30" fill="#999"/>
    <rect x="107" y="160" width="8" height="30" fill="#999"/>
  </svg>`,

  lion: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#fff9e6"/>
    <!-- Mane -->
    <circle cx="100" cy="100" r="45" fill="#cd853f"/>
    <circle cx="65" cy="80" r="20" fill="#cd853f"/>
    <circle cx="135" cy="80" r="20" fill="#cd853f"/>
    <circle cx="60" cy="120" r="20" fill="#cd853f"/>
    <circle cx="140" cy="120" r="20" fill="#cd853f"/>
    <!-- Head -->
    <circle cx="100" cy="100" r="30" fill="#daa520"/>
    <!-- Ears -->
    <circle cx="80" cy="75" r="8" fill="#cd853f"/>
    <circle cx="120" cy="75" r="8" fill="#cd853f"/>
    <!-- Eyes -->
    <circle cx="90" cy="95" r="4" fill="black"/>
    <circle cx="110" cy="95" r="4" fill="black"/>
    <!-- Nose -->
    <ellipse cx="100" cy="110" rx="3" ry="2" fill="black"/>
    <!-- Mouth -->
    <path d="M 100 110 Q 98 115 95 115" stroke="black" stroke-width="1" fill="none"/>
    <path d="M 100 110 Q 102 115 105 115" stroke="black" stroke-width="1" fill="none"/>
  </svg>`,

  monkey: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#f5deb3"/>
    <!-- Body -->
    <ellipse cx="100" cy="130" rx="25" ry="35" fill="#8b4513"/>
    <!-- Head -->
    <circle cx="100" cy="80" r="30" fill="#a0522d"/>
    <!-- Ears -->
    <circle cx="75" cy="60" r="10" fill="#a0522d"/>
    <circle cx="125" cy="60" r="10" fill="#a0522d"/>
    <!-- Face -->
    <circle cx="100" cy="85" r="20" fill="#d2b48c"/>
    <!-- Eyes -->
    <circle cx="90" cy="75" r="5" fill="black"/>
    <circle cx="110" cy="75" r="5" fill="black"/>
    <!-- Nose -->
    <ellipse cx="100" cy="85" rx="4" ry="3" fill="#8b4513"/>
    <!-- Mouth -->
    <path d="M 100 90 Q 98 95 95 94" stroke="black" stroke-width="1" fill="none"/>
    <path d="M 100 90 Q 102 95 105 94" stroke="black" stroke-width="1" fill="none"/>
    <!-- Arms -->
    <rect x="70" y="120" width="10" height="25" fill="#8b4513" transform="rotate(-20 75 120)"/>
    <rect x="120" y="120" width="10" height="25" fill="#8b4513" transform="rotate(20 125 120)"/>
    <!-- Tail -->
    <path d="M 100 160 Q 110 180 105 195" stroke="#8b4513" stroke-width="6" fill="none"/>
  </svg>`,

  giraffe: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#fffacd"/>
    <!-- Neck -->
    <rect x="95" y="50" width="10" height="70" fill="#f4a460"/>
    <!-- Head -->
    <circle cx="100" cy="40" r="15" fill="#f4a460"/>
    <!-- Horns -->
    <rect x="92" y="20" width="2" height="20" fill="#8b4513"/>
    <rect x="106" y="20" width="2" height="20" fill="#8b4513"/>
    <!-- Eyes -->
    <circle cx="95" cy="38" r="2" fill="black"/>
    <circle cx="105" cy="38" r="2" fill="black"/>
    <!-- Body -->
    <ellipse cx="100" cy="140" rx="30" ry="40" fill="#f4a460"/>
    <!-- Spots -->
    <circle cx="80" cy="120" r="8" fill="#8b4513"/>
    <circle cx="120" cy="130" r="8" fill="#8b4513"/>
    <circle cx="100" cy="160" r="7" fill="#8b4513"/>
    <!-- Legs -->
    <rect x="80" y="170" width="8" height="30" fill="#f4a460"/>
    <rect x="112" y="170" width="8" height="30" fill="#f4a460"/>
    <rect x="95" y="170" width="8" height="30" fill="#f4a460"/>
  </svg>`
};

export const getAnimalSVG = (animalName: string): string => {
  const name = animalName.toLowerCase().replace('.jpg', '');
  return animalSVGs[name as keyof typeof animalSVGs] || animalSVGs.elephant;
};

export const getSVGDataURL = (svgString: string): string => {
  const encoded = encodeURIComponent(svgString);
  return `data:image/svg+xml,${encoded}`;
};
