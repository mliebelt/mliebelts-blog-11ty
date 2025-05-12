const { DateTime } = require("luxon");
const markdownItAnchor = require("markdown-it-anchor");
const Image = require("@11ty/eleventy-img");

const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginBundle = require("@11ty/eleventy-plugin-bundle");
const pluginNavigation = require("@11ty/eleventy-navigation");
const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");

const pluginDrafts = require("./eleventy.config.drafts.cjs");
const pluginImages = require("./eleventy.config.images.cjs");
const pluginAuthors = require("./eleventy.config.authors.cjs");
const util = require("util");

async function imageShortcode(src, alt, sizes) {
	let metadata = await Image(src, {
		widths: [300, 600],
		formats: ["avif", "jpeg"],
	});

	let imageAttributes = {
		alt,
		sizes,
		loading: "lazy",
		decoding: "async",
	};

	return Image.generateHTML(metadata, imageAttributes);
}

/** @param {import('@11ty/eleventy').UserConfig} eleventyConfig */
module.exports = function (eleventyConfig) {
	// Add image shortcode
	eleventyConfig.addAsyncShortcode("image", imageShortcode);
	eleventyConfig.addPlugin(pluginAuthors);

	eleventyConfig.addDataExtension("js", (contents) => {
		const result = require("./" + contents);

		// Handle both function-returning-function and regular object data
		if (typeof result === "function" && result.length === 1) {
			return result(eleventyConfig);
		}
		return result;
	});
	// Add this near the top of your module.exports function
	eleventyConfig.on("eleventy.after", ({ results }) => {
		console.log("Generated pages:");
		results.forEach((result) => {
			console.log(`  ${result.outputPath}`);
		});

		console.log("\nAuthor pages created:");
		const authorPages = results.filter((result) => result.outputPath && result.outputPath.includes("/authors/"));
		authorPages.forEach((page) => {
			console.log(`  ${page.outputPath}`);
		});
	});
	eleventyConfig.addFilter("inspect", function (obj) {
		return util.inspect(obj, { depth: 5, colors: false });
	});
	// Copy the contents of the `public` folder to the output folder
	// For example, `./public/css/` ends up in `_site/css/`
	eleventyConfig.addPassthroughCopy({
		"./public/": "/",
		"./node_modules/prismjs/themes/prism-okaidia.css": "/css/prism-okaidia.css",
	});

	// Run Eleventy when these files change:
	// https://www.11ty.dev/docs/watch-serve/#add-your-own-watch-targets

	// Watch content images for the image pipeline.
	eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpeg}");

	// App plugins
	eleventyConfig.addPlugin(pluginDrafts);
	eleventyConfig.addPlugin(pluginImages);

	// Official plugins
	eleventyConfig.addPlugin(pluginRss);
	eleventyConfig.addPlugin(pluginSyntaxHighlight, {
		preAttributes: { tabindex: 0 },
	});
	eleventyConfig.addPlugin(pluginNavigation);
	eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
	eleventyConfig.addPlugin(pluginBundle);

	// Filters
	eleventyConfig.addFilter("germanDate", (dateObj) => {
		return DateTime.fromJSDate(dateObj, { zone: "utc" }).toLocaleString(DateTime.DATE_FULL, { locale: "de" });
	});

	eleventyConfig.addFilter("dateFormat", (date, format, locale) => {
		locale = locale || "de"; // default to German
		return DateTime.fromJSDate(date, { zone: "utc" }).toFormat(format, { locale: locale });
	});

	eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
		// Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
		return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(format || "dd LLLL yyyy");
	});

	eleventyConfig.addFilter("htmlDateString", (dateObj) => {
		// dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
		return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
	});

	// Get the first `n` elements of a collection.
	eleventyConfig.addFilter("head", (array, n) => {
		if (!Array.isArray(array) || array.length === 0) {
			return [];
		}
		if (n < 0) {
			return array.slice(n);
		}

		return array.slice(0, n);
	});

	// Return the smallest number argument
	eleventyConfig.addFilter("min", (...numbers) => {
		return Math.min.apply(null, numbers);
	});

	// Return all the tags used in a collection
	eleventyConfig.addFilter("getAllTags", (collection) => {
		let tagSet = new Set();
		for (let item of collection) {
			(item.data.tags || []).forEach((tag) => tagSet.add(tag));
		}
		return Array.from(tagSet);
	});

	eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
		return (tags || []).filter((tag) => ["all", "nav", "post", "posts"].indexOf(tag) === -1);
	});

	// To be used for showing an overview
	eleventyConfig.addFilter("excerpt", (content) => {
		const excerptLength = 400; // Adjust this to your preferred length
		if (!content || content.length <= excerptLength) return content;
		return content.substr(0, content.lastIndexOf(" ", excerptLength)) + "...";
	});

	eleventyConfig.addFilter("filter", function (array, property, value) {
		return Array.isArray(array)
			? array.filter((item) => {
					if (property.includes(".")) {
						const props = property.split(".");
						let propValue = item;
						for (const prop of props) {
							propValue = propValue?.[prop];
						}
						return propValue === value;
					}
					return item?.[property] === value;
				})
			: [];
	});

	// Add a simple filter to find posts by author
	eleventyConfig.addFilter("byAuthor", function (posts, authorName) {
		return posts.filter((post) => post.data.author === authorName);
	});

	// Add a custom filter to sort authors by last name
	eleventyConfig.addFilter("sortByLastName", function (authors) {
		return authors.sort((a, b) => {
			const aNameParts = a.data.name.split(" ");
			const bNameParts = b.data.name.split(" ");

			// Get last names
			const aLastName = aNameParts[aNameParts.length - 1];
			const bLastName = bNameParts[bNameParts.length - 1];

			// Compare last names first
			return aLastName.localeCompare(bLastName);
		});
	});

	// Add a custom filter to sort books by title
	eleventyConfig.addFilter("sortByTitle", function (books) {
		return books.sort((a, b) => {
			return (a.data.title || "").localeCompare(b.data.title || "");
		});
	});

	// Customize Markdown library settings:
	eleventyConfig.amendLibrary("md", (mdLib) => {
		mdLib.use(markdownItAnchor, {
			permalink: markdownItAnchor.permalink.ariaHidden({
				placement: "after",
				class: "header-anchor",
				symbol: "#",
				ariaHidden: false,
			}),
			level: [1, 2, 3, 4],
			slugify: eleventyConfig.getFilter("slugify"),
		});
	});

	eleventyConfig.addShortcode("currentBuildDate", () => {
		return new Date().toISOString();
	});

	eleventyConfig.addCollection("posts", function (collection) {
		return collection.getFilteredByGlob("content/blog/books/**/*.md");
	});

	eleventyConfig.addCollection("authors", function (collectionApi) {
		return collectionApi.getFilteredByGlob("content/authors/*.md");
	});

	eleventyConfig.addCollection("debugPosts", function (collectionApi) {
		const posts = collectionApi.getFilteredByGlob("content/blog/books/**/*.md");
		console.log("\nDEBUG - Book authors:");
		posts.forEach((post) => {
			console.log(`  "${post.data.title}" by "${post.data.author}"`);
		});
		return posts;
	});

	// Features to make your build faster (when you need them)

	// If your passthrough copy gets heavy and cumbersome, add this line
	// to emulate the file copy on the dev server. Learn more:
	// https://www.11ty.dev/docs/copy/#emulate-passthrough-copy-during-serve

	// eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

	return {
		// Control which files Eleventy will process
		// e.g.: *.md, *.njk, *.html, *.liquid
		templateFormats: ["md", "njk", "html", "liquid"],

		// Pre-process *.md files with: (default: `liquid`)
		markdownTemplateEngine: "njk",

		// Pre-process *.html files with: (default: `liquid`)
		htmlTemplateEngine: "njk",

		// These are all optional:
		dir: {
			input: "content", // default: "."
			includes: "../_includes", // default: "_includes"
			data: "../_data", // default: "_data"
			output: "_site",
		},

		// -----------------------------------------------------------------
		// Optional items:
		// -----------------------------------------------------------------

		// If your site deploys to a subdirectory, change `pathPrefix`.
		// Read more: https://www.11ty.dev/docs/config/#deploy-to-a-subdirectory-with-a-path-prefix

		// When paired with the HTML <base> plugin https://www.11ty.dev/docs/plugins/html-base/
		// it will transform any absolute URLs in your HTML to include this
		// folder name and does **not** affect where things go in the output folder.
		pathPrefix: "/",
	};
};
