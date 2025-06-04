const fs = require("fs");
const path = require("path");
const slugify = require("slugify");

// Custom slugify function that preserves periods
function customSlugify(text) {
	return slugify(text, {
		replacement: "-",
		remove: /[*+~.()'"!:@]/g,
		lower: true,
		strict: true,
	});
}

module.exports = function (eleventyConfig) {
	// This runs before Eleventy processes templates
	eleventyConfig.on("eleventy.before", async () => {
		// Ensure authors directory exists
		const authorsDir = path.join(__dirname, "content/authors");
		if (!fs.existsSync(authorsDir)) {
			fs.mkdirSync(authorsDir, { recursive: true });
		}

		// Get all book files
		const booksGlob = path.join(__dirname, "content/books/**/*.md");
		const bookFiles = require("glob").sync(booksGlob);

		// Extract authors from book files
		const authors = new Set();
		bookFiles.forEach((bookFile) => {
			const content = fs.readFileSync(bookFile, "utf8");
			const authorMatch = content.match(/author:\s*["']?(.*?)["']?(\r?\n|\r)/);
			if (authorMatch && authorMatch[1]) {
				authors.add(authorMatch[1]);
			}
		});

		// Check existing author files
		const existingAuthors = new Set();
		fs.readdirSync(authorsDir).forEach((file) => {
			if (file.endsWith(".md")) {
				const slug = file.replace(".md", "");
				existingAuthors.add(slug);
			}
		});

		// Generate files for missing authors
		authors.forEach((author) => {
			const slug = customSlugify(author); // Use our custom slugify function
			const authorFile = path.join(authorsDir, `${slug}.md`);

			// Skip if author file already exists
			if (existingAuthors.has(slug)) {
				return;
			}

			// Create the author file with minimal frontmatter
			// Split name into prename and surname
			const nameParts = author.split(' ');
			const surname = nameParts.pop(); // Last word is surname
			const prename = nameParts.join(' '); // Everything else is prename

			const content = `---
layout: layouts/author.njk
name: ${author}
prename: ${prename}
surname: ${surname}
---
Keine weitere Info zum Autor verfügbar.
`;

			fs.writeFileSync(authorFile, content);
			console.log(`Generated author file: ${authorFile}`);
		});
	});
};
