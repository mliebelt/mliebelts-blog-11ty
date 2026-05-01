#!/bin/bash

# Script to create new book entries interactively
# Input format: title;author;date;tag1,tag2,...

TEMPLATE_FILE="content/books-staging/template-index.md"
STAGING_DIR="content/books-staging"

# Check if template exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "Error: Template file not found at $TEMPLATE_FILE"
    exit 1
fi

echo "Book Entry Creator"
echo "=================="
echo "Input format: title;author;YYYY-MM-DD;tag1,tag2,..."
echo "Press Enter without input to exit"
echo ""

while true; do
    # Prompt for input
    echo -n "Enter book data: "
    read -r INPUT

    # Exit if input is empty
    if [ -z "$INPUT" ]; then
        echo "Exiting..."
        break
    fi

    # Parse input fields
    IFS=';' read -r TITLE AUTHOR DATE TAGS_INPUT <<< "$INPUT"

    # Validate required fields
    if [ -z "$TITLE" ] || [ -z "$AUTHOR" ] || [ -z "$DATE" ]; then
        echo "Error: Missing required fields (title, author, or date)"
        continue
    fi

    # Extract YYMMDD from date (YYYY-MM-DD)
    YEAR=$(echo "$DATE" | cut -d'-' -f1)
    MONTH=$(echo "$DATE" | cut -d'-' -f2)
    DAY=$(echo "$DATE" | cut -d'-' -f3)
    YY="${YEAR:2:2}"
    YYMMDD="${YY}${MONTH}${DAY}"

    # Create directory path
    NEW_DIR="${STAGING_DIR}/${YYMMDD}"

    # Check if directory already exists
    if [ -d "$NEW_DIR" ]; then
        echo "Warning: Directory $NEW_DIR already exists. Skipping..."
        continue
    fi

    # Create directory
    mkdir -p "$NEW_DIR"

    # Copy template to new directory
    cp "$TEMPLATE_FILE" "${NEW_DIR}/index.md"

    # Convert tags to array format
    if [ -n "$TAGS_INPUT" ]; then
        TAGS_ARRAY=""
        IFS=',' read -ra TAG_LIST <<< "$TAGS_INPUT"
        for tag in "${TAG_LIST[@]}"; do
            # Trim whitespace
            tag=$(echo "$tag" | xargs)
            TAGS_ARRAY="${TAGS_ARRAY}\n  - \"${tag}\""
        done
        # Remove leading newline
        TAGS_ARRAY=$(echo -e "$TAGS_ARRAY" | tail -n +2)
    else
        TAGS_ARRAY=""
    fi

    # Replace placeholders in the new index.md
    sed -i "s|PLACEHOLDER_TITLE|${TITLE}|g" "${NEW_DIR}/index.md"
    sed -i "s|PLACEHOLDER_AUTHOR|${AUTHOR}|g" "${NEW_DIR}/index.md"
    sed -i "s|PLACEHOLDER_DATE|${DATE}|g" "${NEW_DIR}/index.md"
    sed -i "s|PLACEHOLDER_PATH|/${YYMMDD}|g" "${NEW_DIR}/index.md"

    # Replace tags placeholder with proper array format
    if [ -n "$TAGS_ARRAY" ]; then
        # Use a temporary file for tag replacement
        awk -v tags="$TAGS_ARRAY" '
            /^tags: PLACEHOLDER_TAGS/ {
                print "tags:"
                print tags
                next
            }
            { print }
        ' "${NEW_DIR}/index.md" > "${NEW_DIR}/index.md.tmp"
        mv "${NEW_DIR}/index.md.tmp" "${NEW_DIR}/index.md"
    else
        sed -i "s|tags: PLACEHOLDER_TAGS|tags: []|g" "${NEW_DIR}/index.md"
    fi

    # Replace "## TITLE" with actual title
    sed -i "s|## TITLE|## ${TITLE}|g" "${NEW_DIR}/index.md"

    echo "✓ Created: ${NEW_DIR}/index.md"
    echo ""
done

echo "Done!"
