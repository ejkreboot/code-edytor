// Font file imports - Vite will handle these as URLs
import firaCodeWoff from './FiraCode-VF.woff?url';
import firaCodeWoff2 from './FiraCode-VF.woff2?url';
import monaspaceNeonWoff from './Monaspace Neon Var.woff?url';
import monaspaceNeonWoff2 from './Monaspace Neon Var.woff2?url';
import monaspaceArgonWoff from './Monaspace Argon Var.woff?url';
import monaspaceArgonWoff2 from './Monaspace Argon Var.woff2?url';

/**
 * Get font URLs for CSS @font-face declarations
 * @returns {Object} Object with font URLs
 */
export function getFontUrls() {
    return {
        firaCode: {
            woff: firaCodeWoff,
            woff2: firaCodeWoff2
        },
        monaspaceNeon: {
            woff: monaspaceNeonWoff,
            woff2: monaspaceNeonWoff2
        },
        monaspaceArgon: {
            woff: monaspaceArgonWoff,
            woff2: monaspaceArgonWoff2
        }
    };
}

/**
 * Generate CSS @font-face declarations for all fonts
 * @returns {string} CSS string with all font declarations
 */
export function generateFontCSS() {
    const urls = getFontUrls();
    
    return `
        @font-face {
            font-family: 'Fira Code VF';
            src: url('${urls.firaCode.woff2}') format('woff2-variations'),
                url('${urls.firaCode.woff}') format('woff-variations');
            font-weight: 300 700;
            font-style: normal;
        }

        @font-face {
            font-family: 'Monaspace Neon VF';
            src: url('${urls.monaspaceNeon.woff2}') format('woff2-variations'),
                url('${urls.monaspaceNeon.woff}') format('woff-variations');
            font-weight: 300 700;
            font-style: normal;
        }

        @font-face {
            font-family: 'Monaspace Argon VF';
            src: url('${urls.monaspaceArgon.woff2}') format('woff2-variations'),
                url('${urls.monaspaceArgon.woff}') format('woff-variations');
            font-weight: 300 700;
            font-style: normal;
        }
    `;
}