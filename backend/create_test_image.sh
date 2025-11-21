#!/bin/bash
# Create a simple 1x1 red PNG using ImageMagick or sips
if command -v convert &> /dev/null; then
    convert -size 200x200 xc:red test-image.png
elif command -v sips &> /dev/null; then
    # macOS sips can't easily create images, so we'll use a different approach
    echo "Using alternative method"
fi
