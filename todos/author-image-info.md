# Image Information UI Options

This document summarizes the options discussed for adding image information to the UI without disturbing the reader/viewer in our 11ty blog project.

## 1. Image Captions with CSS Overlay

This option shows the image title as an overlay when hovering over the image.

### Implementation:

1. Modify the `post.njk` template:

```njk
<div class="post-cover">
  {% if cover %}
    <div class="image-container">
      {% image cover, title %}
      <div class="image-overlay">{{ title }}</div>
    </div>
  {% endif %}
</div>
```

2. Add CSS to it

```CSS
.image-container {
  position: relative;
  display: inline-block;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-container:hover .image-overlay {
  opacity: 1;
}
```
