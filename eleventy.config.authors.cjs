const fs = require("fs");
const path = require("path");

// Improved slugify function that correctly handles German umlauts
function slugify(text) {
	return (
		text
			.toLowerCase()
			// Replace umlauts with their ASCII equivalents
			.replace(/ä/g, "ae")
			.replace(/ö/g, "oe")
			.replace(/ü/g, "ue")
			.replace(/ß/g, "ss")
			// Remove other special characters and replace spaces with hyphens
			.replace(/[^\w\s-]/g, "")
			.replace(/[\s_-]+/g, "-")
			.replace(/^-+|-+$/g, "")
	);
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
		const booksGlob = path.join(__dirname, "content/blog/books/**/*.md");
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
			const slug = slugify(author); // Use our improved slugify function
			const authorFile = path.join(authorsDir, `${slug}.md`);

			// Skip if author file already exists
			if (existingAuthors.has(slug)) {
				return;
			}

			// Create the author file with minimal frontmatter
			const content = `---
layout: layouts/author.njk
name: ${author}
# email: optional@example.com
# website: https://optional-website.com
---
No additional information is available for this author.
`;

			fs.writeFileSync(authorFile, content);
			console.log(`Generated author file: ${authorFile}`);
		});
	});
};
