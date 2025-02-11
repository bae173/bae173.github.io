import cssutils

def format_css(css_code):
    # Parse CSS
    parser = cssutils.CSSParser()
    stylesheet = parser.parseString(css_code)
    
    # Format CSS with indentation and line breaks
    formatted_css = stylesheet.cssText.decode('utf-8')
    
    return formatted_css

# Read the unformatted CSS from a file
with open("/Users/ekanemokeke/Documents/Extracurriculars/kpopedits/bae173/baeflix/styles.css", "r", encoding="utf-8") as f:
    raw_css = f.read()

# Format the CSS
formatted_css = format_css(raw_css)

# Save the formatted CSS to a new file
with open("/Users/ekanemokeke/Documents/Extracurriculars/kpopedits/bae173/baeflix/styles_formatted.css", "w", encoding="utf-8") as f:
    f.write(formatted_css)

print("CSS formatting complete! Check formatted.css.")
