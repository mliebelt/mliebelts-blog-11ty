#!/bin/bash

# Script to add title field to author markdown files
# The title value will be the same as the name value

# Move to the authors directory
cd "$(dirname "$0")/content/authors" || { echo "Error: Cannot change to authors directory"; exit 1; }

# Process each markdown file
for file in *.md; do
    # Skip if not a regular file
    [ -f "$file" ] || continue

    # Check if file already has a title field
    if grep -q "^title:" "$file"; then
        echo "Skipping $file - already has title field"
        continue
    fi

    # Extract the name value
    name=$(grep "^name:" "$file" | sed 's/^name: //')

    if [ -z "$name" ]; then
        echo "Warning: No name field found in $file - skipping"
        continue
    fi

    # Add the title field after the name field
    sed -i "/^name: /a title: $name" "$file"
    echo "Added title: $name to $file"
done

echo "Done! Processed all author files."
