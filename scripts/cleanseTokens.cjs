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
            // 1. Remove the old "!bg-white dark:bg-card-dark" hack everywhere
            classList = classList.replace(/!bg-white\s+dark:!bg-card-dark/g, 'bg-card dark:bg-card-dark');
            classList = classList.replace(/!bg-white\s+dark:bg-card-dark/g, 'bg-card dark:bg-card-dark');
            classList = classList.replace(/bg-white\s+dark:bg-card-dark/g, 'bg-card dark:bg-card-dark');

            // 2. Fix the borders
            classList = classList.replace(/!border-slate-200\s+dark:border-slate-700\/50/g, 'border-slate-200 dark:border-dark');
            classList = classList.replace(/border-slate-200\s+dark:border-slate-700\/50/g, 'border-slate-200 dark:border-dark');
            classList = classList.replace(/dark:!border-slate-700\/50/g, 'dark:border-dark');
            classList = classList.replace(/dark:border-slate-700\/50/g, 'dark:border-dark');

            // Hover borders
            classList = classList.replace(/dark:hover:!border-gold/g, 'dark:hover:border-darkHighlight');
            classList = classList.replace(/dark:hover:border-gold\/30/g, 'dark:hover:border-darkHighlight');
            classList = classList.replace(/dark:hover:border-primary\/20/g, 'dark:hover:border-darkHighlight');

            // 3. Fix the texts
            // If it's a solid block of text primary, make it switch strictly to text-primary-dark in dark mode
            classList = classList.replace(/text-slate-900\s+dark:text-slate-100/g, 'text-slate-900 dark:text-primary-dark');
            classList = classList.replace(/!text-slate-700\s+dark:!text-slate-100/g, 'text-slate-700 dark:text-primary-dark');
            classList = classList.replace(/text-slate-800\s+dark:text-slate-100/g, 'text-slate-800 dark:text-primary-dark');
            classList = classList.replace(/text-slate-700\s+dark:text-slate-100/g, 'text-slate-700 dark:text-primary-dark');

            classList = classList.replace(/text-slate-600\s+dark:text-slate-300/g, 'text-slate-600 dark:text-secondary-dark');
            classList = classList.replace(/text-slate-500\s+dark:text-slate-300/g, 'text-slate-500 dark:text-secondary-dark');
            classList = classList.replace(/text-slate-400\s+dark:text-slate-300/g, 'text-slate-400 dark:text-muted-dark');

            // 4. Flatten shadows in dark mode completely
            classList = classList.replace(/shadow-sm\s+dark:shadow-none/g, 'shadow-sm dark:shadow-none');
            classList = classList.replace(/shadow-md\s+dark:shadow-none/g, 'shadow-md dark:shadow-none');
            classList = classList.replace(/shadow-premium\s+dark:shadow-none/g, 'shadow-premium dark:shadow-none');

            // Reduce multiple spaces to single spaces
            classList = classList.replace(/\s+/g, ' ').trim();

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

console.log(`Cleansed ${filesModified} files to enforce Semantic Tokens.`);
