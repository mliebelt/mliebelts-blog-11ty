const path = require("path");
const eleventyImage = require("@11ty/eleventy-img");

function relativeToInputPath(inputPath, relativeFilePath) {
	let split = inputPath.split("/");
	split.pop();

	return path.resolve(split.join(path.sep), relativeFilePath);
}

function isFullUrl(url) {
	try {
		new URL(url);
		return true;
	} catch (e) {
		return false;
	}
}

module.exports = function (eleventyConfig) {
	// Copy image files
	eleventyConfig.addPassthroughCopy("books/**/*.(jpg|png|webp)");
	// Eleventy Image shortcode
	// https://www.11ty.dev/docs/plugins/image/
	eleventyConfig.addAsyncShortcode("image", async function imageShortcode(src, alt, widths, sizes) {
		// Full list of formats here: https://www.11ty.dev/docs/plugins/image/#output-formats
		// Warning: Avif can be resource-intensive so take care!
		// console.log("widths:" + widths);
		let formats = ["webp", "jpeg", "png"];
		let input;
		if (isFullUrl(src)) {
			input = src;
		} else {
			input = relativeToInputPath(this.page.inputPath, src);
		}
		// Convert widths to an array if it's not already
		widths = Array.isArray(widths) ? widths : [widths];

		let metadata = await eleventyImage(input, {
			widths: widths || ["auto"],
			formats,
			outputDir: path.join(eleventyConfig.dir.output, "img"), // Advanced usage note: `eleventyConfig.dir` works here because we’re using addPlugin.
		});

		// TODO loading=eager and fetchpriority=high
		let imageAttributes = {
			alt,
			sizes,
			loading: "lazy",
			decoding: "async",
		};

		return eleventyImage.generateHTML(metadata, imageAttributes);
	});
};
