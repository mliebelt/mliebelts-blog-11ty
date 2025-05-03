module.exports = {
	eleventyComputed: {
		// This will run for each template that uses this data file
		pagination: (data) => {
			// Get all posts from the collections
			const posts = data.collections.posts || [];

			// Extract all unique authors
			const authorSet = new Set();
			posts.forEach((post) => {
				if (post.data.author) {
					authorSet.add(post.data.author);
				}
			});

			// Convert to array format for pagination
			return {
				data: Array.from(authorSet),
				size: 1,
				alias: "author",
			};
		},
	},
};
