#!/bin/bash

# Usage: ./remove_comments_and_delete_empty.sh /path/to/folder

target_folder="$1"

if [[ -z "$target_folder" ]]; then
  echo "Usage: $0 /path/to/folder"
  exit 1
fi

# Find all .ts files recursively
find "$target_folder" -type f -name "*.ts" | while read -r file; do
  echo "Processing $file..."

  # First, remove /* block comments */
  sed -E -i '' '
    :a
    s@/\*([^*]|\*[^/])*\*/@@g
    ta
  ' "$file"

  # Then, remove // comments (but not inside quotes)
  sed -E -i '' '
    s@(^|[^:"'"'"'])//.*$@\1@g
  ' "$file"

  # Remove empty lines (pure whitespace)
  sed -i '' '/^[[:space:]]*$/d' "$file"

  # If file is now empty, delete it
  if [[ ! -s "$file" ]]; then
    echo "Deleting empty file: $file"
    rm "$file"
  fi
done

echo "Done."
