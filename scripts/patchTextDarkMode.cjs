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

            // Text primary
            if (classList.match(/\btext-primary\b/) && !classList.match(/dark:text-/)) {
                classList = classList.replace(/\btext-primary\b/g, 'text-primary dark:text-white');
            }

            // Border primary vs dark border
            if (classList.match(/\bborder-primary\b/) && !classList.match(/dark:border-/)) {
                classList = classList.replace(/\bborder-primary\b/g, 'border-primary dark:border-white/20');
            }

            // Indigo backgrounds and texts
            if (classList.match(/\bbg-indigo-50\b/) && !classList.match(/dark:bg-/)) {
                classList = classList.replace(/\bbg-indigo-50\b/g, 'bg-indigo-50 dark:bg-indigo-900/20');
            }
            if (classList.match(/\btext-indigo-600\b/) && !classList.match(/dark:text-/)) {
                classList = classList.replace(/\btext-indigo-600\b/g, 'text-indigo-600 dark:text-indigo-300');
            }
            if (classList.match(/\btext-indigo-700\b/) && !classList.match(/dark:text-/)) {
                classList = classList.replace(/\btext-indigo-700\b/g, 'text-indigo-700 dark:text-indigo-200');
            }
            if (classList.match(/\btext-indigo-800\b/) && !classList.match(/dark:text-/)) {
                classList = classList.replace(/\btext-indigo-800\b/g, 'text-indigo-800 dark:text-indigo-100');
            }
            if (classList.match(/\btext-indigo-900\b/) && !classList.match(/dark:text-/)) {
                classList = classList.replace(/\btext-indigo-900\b/g, 'text-indigo-900 dark:text-white');
            }

            // Red backgrounds and texts
            if (classList.match(/\bbg-red-50\b/) && !classList.match(/dark:bg-/)) {
                classList = classList.replace(/\bbg-red-50\b/g, 'bg-red-50 dark:bg-red-900/20');
            }
            if (classList.match(/\bbg-emerald-50\b/) && !classList.match(/dark:bg-/)) {
                classList = classList.replace(/\bbg-emerald-50\b/g, 'bg-emerald-50 dark:bg-emerald-900/20');
            }
            if (classList.match(/\bbg-amber-50\b/) && !classList.match(/dark:bg-/)) {
                classList = classList.replace(/\bbg-amber-50\b/g, 'bg-amber-50 dark:bg-amber-900/20');
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

console.log(`Patched ${filesModified} files for text/bg contrast issues.`);
