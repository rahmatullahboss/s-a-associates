const fs = require('fs');
const files = [
  'src/components/ui/button.tsx',
  'src/lib/site-settings-context.tsx',
  'src/pages/about/layout.tsx',
  'src/pages/contact/layout.tsx',
  'src/pages/dashboard/profile/page.tsx',
  'src/pages/services/layout.tsx'
];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let text = fs.readFileSync(f, 'utf8');
    if (!text.includes('eslint-disable react-refresh/only-export-components')) {
      text = '/* eslint-disable react-refresh/only-export-components */\n' + text;
      fs.writeFileSync(f, text);
    }
  }
});
