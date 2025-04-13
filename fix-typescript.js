const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find files to process using simpler patterns
function getFilesToProcess() {
  try {
    // Find all TypeScript/TSX files
    const allTsFiles = execSync('find src -name "*.tsx" -o -name "*.ts"')
      .toString()
      .split('\n')
      .filter(Boolean);
    
    console.log(`Found ${allTsFiles.length} TypeScript files to scan`);
    return allTsFiles;
  } catch (error) {
    console.error('Error finding files:', error);
    return [];
  }
}

// Fix missing type annotations in callback functions
function fixFiles(files) {
  let totalFixed = 0;
  let totalFiles = 0;

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // Fix forEach callbacks
    content = content.replace(/\.forEach\((\w+)\s*=>/g, '.forEach(($1: any) =>');
    
    // Fix map callbacks
    content = content.replace(/\.map\((\w+)\s*=>/g, '.map(($1: any) =>');
    
    // Fix filter callbacks
    content = content.replace(/\.filter\((\w+)\s*=>/g, '.filter(($1: any) =>');
    
    // Fix find callbacks
    content = content.replace(/\.find\((\w+)\s*=>/g, '.find(($1: any) =>');
    
    // Fix reduce callbacks
    content = content.replace(/\.reduce\((\s*\w+\s*,\s*\w+\s*)\)/g, '.reduce(($1: any))')
    content = content.replace(/\.reduce\((\s*\w+\s*,\s*\w+\s*)\)\s*=>/g, '.reduce(($1: any)) =>');
    content = content.replace(/\.reduce\(\((\w+)\s*,\s*(\w+)\)\s*=>/g, '.reduce(($1: any, $2: any) =>');
    
    // Fix some callback functions
    content = content.replace(/(\w+)\.(\w+)\(\((\w+)\)\s*=>/g, '$1.$2(($3: any) =>');
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content);
      console.log(`Fixed ${file}`);
      totalFixed++;
      totalFiles++;
    }
  });

  return { totalFixed, totalFiles };
}

// Main execution
const files = getFilesToProcess();
const { totalFixed, totalFiles } = fixFiles(files);

console.log(`
Processing complete:
- Scanned ${files.length} TypeScript files
- Modified ${totalFixed} files
- Fixed type annotations in ${totalFiles} files
`);