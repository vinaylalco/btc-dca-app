#!/bin/bash

# Script to combine .css, .js, and .jsx files from the specified folder and its SUBDIRECTORIES into a single text file for uploading to Grok
# Excludes any files with "config" in their name or path
# Includes the folder structure and file list in the output file
# exmaple, ./combine_files.sh /Users/vinaylal/Documents/sites/btc-dca-app/src combined.txt  

# Check if directory and output file are provided as arguments
if [ $# -ne 2 ]; then
    echo "Usage: $0 <directory> <output_file>"
    echo "Example: $0 ./src combined.txt"
    exit 1
fi

DIRECTORY=$1
OUTPUT_FILE=$2

# Resolve the absolute path of the directory
DIRECTORY=$(realpath "$DIRECTORY" 2>/dev/null || echo "$DIRECTORY")
if [ ! -d "$DIRECTORY" ]; then
    echo "Error: Directory '$DIRECTORY' does not exist or is inaccessible."
    exit 1
fi

# Clear or create the output file
> "$OUTPUT_FILE"

# Debug: List all files in the directory (including top-level and subdirectories)
echo "Debug: Listing all files in $DIRECTORY"
find "$DIRECTORY" -type f

# Debug: List .css, .js, .jsx files in the directory and subdirectories (no exclusions)
echo "Debug: Searching for .css, .js, .jsx files in $DIRECTORY and SUBDIRECTORIES (no exclusions)"
find "$DIRECTORY" -type f \( -iname "*.css" -o -iname "*.js" -o -iname "*.jsx" \)

# Debug: List .css, .js, .jsx files in the directory and subdirectories after excluding those with 'config' in the name/path
echo "Debug: Searching for .css, .js, .jsx files in $DIRECTORY and SUBDIRECTORIES, excluding those with 'config' in the name/path"
find "$DIRECTORY" -type f \( -iname "*.css" -o -iname "*.js" -o -iname "*.jsx" \) -not -ipath "*config*"

# Check if any matching files exist
MATCHING_FILES=$(find "$DIRECTORY" -type f \( -iname "*.css" -o -iname "*.js" -o -iname "*.jsx" \) -not -ipath "*config*" | wc -l)
if [ "$MATCHING_FILES" -eq 0 ]; then
    echo "No .css, .js, or .jsx files found in $DIRECTORY or its SUBDIRECTORIES (excluding files with 'config' in the name/path)"
    echo "Please check the debug output above to verify file existence, extensions, and permissions."
    rm "$OUTPUT_FILE" # Remove empty output file
    exit 1
fi

# Add folder structure to the output file
echo "===== Directory Structure of $DIRECTORY =====" >> "$OUTPUT_FILE"
if command -v tree >/dev/null 2>&1; then
    tree -if --noreport "$DIRECTORY" >> "$OUTPUT_FILE"
else
    echo "(Note: 'tree' command not found, using 'find' to list directory structure)" >> "$OUTPUT_FILE"
    find "$DIRECTORY" -print >> "$OUTPUT_FILE"
fi
echo -e "\n===== End of Directory Structure =====\n" >> "$OUTPUT_FILE"

# Combine files from the directory and subdirectories, excluding those with "config" in the name/path
echo "Combining .css, .js, .jsx files from $DIRECTORY and SUBDIRECTORIES (excluding files with 'config' in the name/path)"
find "$DIRECTORY" -type f \( -iname "*.css" -o -iname "*.js" -o -iname "*.jsx" \) -not -ipath "*config*" -exec sh -c '
    for file do
        if [ -r "$file" ]; then
            echo "===== Start of $file =====" >> "$0"
            cat "$file" >> "$0"
            echo -e "\n===== End of $file =====\n" >> "$0"
        else
            echo "Warning: Cannot read file $file (permission denied)" >&2
        fi
    done
' "$OUTPUT_FILE" {} +

echo "Files combined into $OUTPUT_FILE"