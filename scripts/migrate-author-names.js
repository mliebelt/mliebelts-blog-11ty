const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Directory containing author files
const authorsDir = path.join(__dirname, '../content/authors');

// Get all author files
const authorFiles = fs.readdirSync(authorsDir)
  .filter(file => file.endsWith('.md'));

// Process each author file
authorFiles.forEach(file => {
  const filePath = path.join(authorsDir, file);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Parse frontmatter
  const { data, content } = matter(fileContent);
  
  // Skip if already has prename and surname
  if (data.prename && data.surname) {
    console.log(`Skipping ${file} - already has prename and surname`);
    return;
  }
  
  // Split name into prename and surname
  const nameParts = data.name.split(' ');
  const surname = nameParts.pop(); // Last word is surname
  const prename = nameParts.join(' '); // Everything else is prename
  
  // Add new fields
  data.prename = prename;
  data.surname = surname;
  
  // Convert back to frontmatter format
  const newFileContent = matter.stringify(content, data);
  
  // Write updated file
  fs.writeFileSync(filePath, newFileContent);
  console.log(`Updated ${file}: "${prename}" "${surname}"`);
});

console.log('Migration complete!');