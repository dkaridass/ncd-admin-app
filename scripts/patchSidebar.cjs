const fs = require('fs');
const path = require('path');

const sidebarPath = '/Users/Apple/Downloads/ncd-la-pentecôte-admin/components/layout/Sidebar.tsx';
let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

// 1. Fix width from w-[72px] to w-20 to match standard Tailwind spacing
sidebarContent = sidebarContent.replace(/w-\[72px\]/g, 'w-20');

// 2. Fix the logo header title
sidebarContent = sidebarContent.replace(
    /\{\!isCollapsed && \(\s*<h1 className="([^"]+)">([^<]+)<\/h1>\s*\)\}/,
    '<h1 className={`$1 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? \'max-w-0 opacity-0\' : \'max-w-[200px] opacity-100\'}`}>$2</h1>'
);

// 3. Fix the nav spans (with and without font-bold)
sidebarContent = sidebarContent.replace(
    /\{\!isCollapsed && <span className="mx-3([^"]*)">(.*?)<\/span>\}/g,
    '<span className={`mx-3$1 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? \'max-w-0 opacity-0\' : \'max-w-[200px] opacity-100\'}`}>$2</span>'
);

// 4. Fix category headers
sidebarContent = sidebarContent.replace(
    /\{\!isCollapsed && \(\s*<div className="([^"]+)">([^<]+)<\/div>\s*\)\}\s*\{isCollapsed && <div className="([^"]+)" \/>\}/g,
    '<div className={`$1 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? \'max-w-0 opacity-0 !p-0 !h-0\' : \'max-w-[200px] opacity-100\'}`}>$2</div>\n        <div className={`$3 transition-all duration-300 ${isCollapsed ? \'opacity-100\' : \'opacity-0 !h-0 !m-0 border-transparent\'}`} />'
);

// 5. Fix User Section
sidebarContent = sidebarContent.replace(
    /\{\!isCollapsed && \(\s*<div className="flex flex-col">([^]*?)<\/div>\s*\)\}/g,
    '<div className={`flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? \'max-w-0 opacity-0\' : \'max-w-[200px] opacity-100\'}`}>$1</div>'
);

fs.writeFileSync(sidebarPath, sidebarContent);
console.log('Sidebar patched successfully.');
