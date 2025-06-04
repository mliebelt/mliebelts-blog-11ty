# Pagination Plan for Books and Authors

This document outlines a comprehensive plan for implementing pagination for both books and authors in the 11ty blog.

## 1. Overview of Pagination in 11ty

Eleventy provides built-in pagination capabilities through the `pagination` front matter key. This allows for:

- Splitting large collections into smaller chunks
- Creating "previous" and "next" navigation
- Customizing page sizes
- Filtering and transforming paginated data

## 2. Pagination for Books

### 2.1 Books by Date (Chronological)

```njk
---
layout: layouts/base.njk
title: Books by Date
pagination:
  data: collections.posts
  size: 10
  alias: books
  reverse: true
permalink: /books/page-{{ pagination.pageNumber + 1 }}/
---

<h1>Books (Page {{ pagination.pageNumber + 1 }} of {{ pagination.pages.length }})</h1>

<div class="book-list">
  {% for book in books %}
    <!-- Book display code -->
  {% endfor %}
</div>

<nav class="pagination">
  {% if pagination.href.previous %}
    <a href="{{ pagination.href.previous }}">Previous</a>
  {% endif %}
  
  {% for pageNumber in pagination.pages %}
    <a href="/books/page-{{ loop.index }}/" 
       {% if loop.index0 == pagination.pageNumber %}aria-current="page"{% endif %}>
      {{ loop.index }}
    </a>
  {% endfor %}
  
  {% if pagination.href.next %}
    <a href="{{ pagination.href.next }}">Next</a>
  {% endif %}
</nav>
```

### 2.2 Books by Author

```njk
---
pagination:
  data: collections.authors
  size: 1
  alias: author
permalink: /books/by-author/{{ author.data.surname | slugify }}-{{ author.data.prename | slugify }}/
---

<h1>Books by {{ author.data.name }}</h1>

{% set authorBooks = collections.posts | byAuthor(author.data.name) %}

<!-- Nested pagination for books by this author -->
{% set bookPagination = authorBooks | batch(10) %}
{% set pageNumber = 0 %}

<div class="book-list">
  {% for book in bookPagination[pageNumber] %}
    <!-- Book display code -->
  {% endfor %}
</div>

<!-- Pagination controls -->
```

### 2.3 Books by Tag

```njk
---
pagination:
  data: collections.tagList
  size: 1
  alias: tag
permalink: /books/by-tag/{{ tag | slugify }}/
---

<h1>Books tagged "{{ tag }}"</h1>

{% set taggedBooks = collections[tag] %}

<!-- Nested pagination for books with this tag -->
```

## 3. Pagination for Authors

### 3.1 Authors Alphabetically

```njk
---
layout: layouts/base.njk
title: Authors
pagination:
  data: collections.authors
  size: 20
  alias: paginatedAuthors
permalink: /authors/page-{{ pagination.pageNumber + 1 }}/
---

<h1>Authors (Page {{ pagination.pageNumber + 1 }} of {{ pagination.pages.length }})</h1>

<!-- Sort authors by surname -->
{% set sortedAuthors = paginatedAuthors | sortByLastName %}

<div class="authors-grid">
  {% for author in sortedAuthors %}
    <!-- Author display code -->
  {% endfor %}
</div>

<!-- Pagination controls -->
```

### 3.2 Authors by Letter

```njk
---
pagination:
  data: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  size: 1
  alias: letter
permalink: /authors/letter-{{ letter | lower }}/
---

<h1>Authors: {{ letter }}</h1>

{% set authorsWithLetter = collections.authors | filter(author => 
  author.data.surname.charAt(0).toUpperCase() === letter
) %}

<!-- Display authors starting with this letter -->
```

## 4. Implementation Details

### 4.1 Required Changes to Existing Files

1. Create new template files for each pagination type
2. Update navigation to include links to paginated views
3. Add custom filters for pagination-specific operations

### 4.2 New Filters Needed

```javascript
// Filter to get the first letter of an author's surname
eleventyConfig.addFilter("firstLetter", function(author) {
  return author.data.surname.charAt(0).toUpperCase();
});

// Group authors by the first letter of their surname
eleventyConfig.addFilter("groupByFirstLetter", function(authors) {
  const grouped = {};
  authors.forEach(author => {
    const letter = author.data.surname.charAt(0).toUpperCase();
    if (!grouped[letter]) {
      grouped[letter] = [];
    }
    grouped[letter].push(author);
  });
  return grouped;
});

// Batch an array into chunks (for manual pagination)
eleventyConfig.addFilter("batch", function(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
});
```

### 4.3 URL Structure

- Books main pagination: `/books/page-[number]/`
- Books by author: `/books/by-author/[surname]-[prename]/`
- Books by tag: `/books/by-tag/[tag]/`
- Authors main pagination: `/authors/page-[number]/`
- Authors by letter: `/authors/letter-[letter]/`

## 5. Template Examples

### 5.1 Pagination Navigation Component

Create a reusable pagination component:

```njk
{# _includes/pagination-nav.njk #}
{% macro paginationNav(pagination) %}
  <nav class="pagination" aria-label="Pagination Navigation">
    <ul class="pagination-list">
      {% if pagination.href.previous %}
        <li class="pagination-previous">
          <a href="{{ pagination.href.previous }}" rel="prev">Previous</a>
        </li>
      {% endif %}
      
      {% for pageEntry in pagination.pages %}
        <li class="pagination-item{% if loop.index0 == pagination.pageNumber %} current{% endif %}">
          <a href="{{ pagination.hrefs[loop.index0] }}"
             {% if loop.index0 == pagination.pageNumber %}aria-current="page"{% endif %}>
            {{ loop.index }}
          </a>
        </li>
      {% endfor %}
      
      {% if pagination.href.next %}
        <li class="pagination-next">
          <a href="{{ pagination.href.next }}" rel="next">Next</a>
        </li>
      {% endif %}
    </ul>
  </nav>
{% endmacro %}
```

### 5.2 Alphabetical Index Component

```njk
{# _includes/alpha-index.njk #}
{% macro alphaIndex(currentLetter) %}
  <nav class="alpha-index" aria-label="Alphabetical Index">
    <ul class="alpha-list">
      {% for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" %}
        <li class="alpha-item{% if letter == currentLetter %} current{% endif %}">
          <a href="/authors/letter-{{ letter | lower }}/"
             {% if letter == currentLetter %}aria-current="page"{% endif %}>
            {{ letter }}
          </a>
        </li>
      {% endfor %}
    </ul>
  </nav>
{% endmacro %}
```

## 6. CSS Considerations

```css
/* Pagination styling */
.pagination {
  margin: 2rem 0;
  text-align: center;
}

.pagination-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  list-style: none;
  padding: 0;
}

.pagination-item {
  margin: 0 0.25rem;
}

.pagination-item a {
  display: inline-block;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ccc;
  text-decoration: none;
  border-radius: 3px;
}

.pagination-item.current a {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

/* Alpha index styling */
.alpha-index {
  margin: 1rem 0;
}

.alpha-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  list-style: none;
  padding: 0;
}

.alpha-item {
  margin: 0 0.25rem;
}

.alpha-item a {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  line-height: 2rem;
  text-align: center;
  border: 1px solid #ccc;
  text-decoration: none;
  border-radius: 50%;
}

.alpha-item.current a {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}
```

## 7. Implementation Steps

1. Add the necessary filters to `eleventy.config.cjs`
2. Create the pagination component templates
3. Implement book pagination templates
4. Implement author pagination templates
5. Update navigation to include links to paginated views
6. Add CSS for pagination components
7. Test and refine the pagination experience

## 8. Advanced Features (Future Enhancements)

- Infinite scroll option for book listings
- AJAX-powered pagination that doesn't require full page reloads
- Filtering options within paginated views (e.g., filter books by year within an author's page)
- Remember pagination state using localStorage
- URL parameters for additional filtering and sorting options