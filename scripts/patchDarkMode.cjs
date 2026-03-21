const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) walkDir(fullPath, callback);
        else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) callback(fullPath);
    });
}

const dirs = [
    '/Users/Apple/Downloads/ncd-la-pentecôte-admin/pages',
    '/Users/Apple/Downloads/ncd-la-pentecôte-admin/components'
];

let filesModified = 0;

for (const dir of dirs) {
    walkDir(dir, (filePath) => {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        content = content.replace(/className=(?:\{`|`|")([^`"]+)(?:`\}|`|")/g, (match, classList) => {
            // Backgrounds
            if (classList.match(/\bbg-white\b/) && !classList.match(/dark:bg-/)) {
                classList = classList.replace(/\bbg-white\b/g, 'bg-white dark:bg-card-dark');
            }
            if (classList.match(/\bbg-slate-50\b/) && !classList.match(/dark:bg-/)) {
                classList = classList.replace(/\bbg-slate-50\b/g, 'bg-slate-50 dark:bg-white/[0.02]');
            }

            // Text colors
            if (classList.match(/\btext-slate-(900|800|700)\b/) && !classList.match(/dark:text-/)) {
                classList = classList.replace(/\b(text-slate-[789]00)\b/g, '$1 dark:text-slate-100');
            }
            if (classList.match(/\btext-slate-(600|500)\b/) && !classList.match(/dark:text-/)) {
                classList = classList.replace(/\b(text-slate-[56]00)\b/g, '$1 dark:text-slate-300');
            }

            // Borders
            if (classList.match(/\bborder-slate-(100|200)\b/) && !classList.match(/dark:border-/)) {
                classList = classList.replace(/\b(border-slate-[12]00)\b/g, '$1 dark:border-slate-700/50');
            }

            // Shadows (remove shadows in dark mode for a flatter, sleeker look)
            if (classList.match(/\bshadow-(sm|md|lg|xl|2xl|premium|soft)\b/) && !classList.match(/dark:shadow-/)) {
                classList = classList.replace(/\b(shadow-[a-z0-z-]+)\b/g, '$1 dark:shadow-none');
            }

            if (match.startsWith('className="')) return `className="${classList}"`;
            if (match.startsWith('className={`')) return `className={\`${classList}\`}`;
            if (match.startsWith('className=`')) return `className=\`${classList}\``;

            return match;
        });

        if (content !== original) {
            fs.writeFileSync(filePath, content);
            filesModified++;
        }
    });
}

console.log(`Patched ${filesModified} files for Dark Mode compatibility.`);
