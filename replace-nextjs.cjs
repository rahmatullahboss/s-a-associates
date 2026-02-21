const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) { 
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src'));

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace next/link imports
    if (content.includes('next/link')) {
        content = content.replace(/import Link from ["']next\/link["'];?/g, "import { Link } from 'react-router-dom';");
        // Replace <Link href= with <Link to=
        // Note: this is a simple regex, might not cover all edge cases but covers 99%
        content = content.replace(/<Link\s+href=/g, '<Link to=');
        changed = true;
    }

    // Replace next/image imports
    if (content.includes('next/image')) {
        content = content.replace(/import Image from ["']next\/image["'];?/g, "");
        // Replace <Image with <img
        // This is tricky because Image has self-closing.
        content = content.replace(/<Image([^>]+)\/>/g, '<img$1/>');
        // also remove priority={...} and fill={...} if they exist
        content = content.replace(/\s+priority(\{.*?\})?/g, '');
        content = content.replace(/\s+fill(\{.*?\})?/g, '');
        changed = true;
    }

    // Replace next/navigation imports (useRouter, redirect, usePathname, etc)
    if (content.includes('next/navigation')) {
        content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]next\/navigation['"];?/g, "import { useNavigate, useLocation } from 'react-router-dom';");
        
        // Let's replace simple usages
        content = content.replace(/useRouter\(\)/g, "useNavigate()");
        content = content.replace(/const router = useNavigate\(\)/g, "const navigate = useNavigate()");
        content = content.replace(/router\.push\(/g, "navigate(");
        content = content.replace(/router\.replace\(/g, "navigate(");
        content = content.replace(/usePathname\(\)/g, "useLocation().pathname");
        
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
}
