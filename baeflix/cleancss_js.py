import re

# List of IDs to preserve
preserved_ids = {
    "#icons01", "#icons03", "#icons48", "#icons30", "#text02", "#text03", "#text04", "#text09", 
    "#text50", "#text51", "#text07", "#text10", "#text52", "#text06", "#text57", "#container01", 
    "#container09", "#container53", "#container03", "#container02", "#container106", "#container107", 
    "#container127", "#container65", "#container67", "#image02", "#image03", "#image12", "#image09", 
    "#image17", "#image25", "#image133", "#image168", "#image169", "#image170", "#image171", "#image172", 
    "#image173", "#image174", "#image175", "#image176", "#image177", "#image178", "#image179", "#image79", 
    "#video28", "#video23"
}

# Load the CSS file
with open("/Users/ekanemokeke/Documents/Extracurriculars/kpopedits/bae173/baeflix/optimized_styles.css", "r", encoding="utf-8") as f:
    css = f.read()

# Function to clean the CSS
def clean_css(css):
    # Regular expression to match selectors with specific ID formats followed by 2 or 3 digits
    pattern = re.compile(r'([^{]+)\{([^}]+)\}')

    # Function to process each match
    def process_match(match):
        full_rule = match.group(0)
        selectors = match.group(1)

        # Split selectors by comma, trim whitespace
        selector_list = [s.strip() for s in selectors.split(',')]

        # Lists to store valid and invalid selectors
        valid_selectors = []
        invalid_selectors = []

        for s in selector_list:
            if s.startswith(('#icons', '#text', '#container', '#image', '#video')) and re.match(r'#[a-zA-Z]+\d{2,3}', s):
                # If the ID is in the preserved list, keep it
                if s in preserved_ids:
                    valid_selectors.append(s)
                else:
                    invalid_selectors.append(s)
            else:
                # Non-ID selectors are valid, always keep them
                valid_selectors.append(s)

        # If no valid selectors remain, return an empty string to delete this rule
        if not valid_selectors:
            return ""

        # If the rule contains only valid selectors, return the full rule
        return f"{', '.join(valid_selectors)}{{{match.group(2)}}}"

    # Process the CSS content and remove invalid selectors
    css = re.sub(pattern, process_match, css)

    # Return the cleaned CSS
    return css

# Run the cleaning function
cleaned_css = clean_css(css)

# Save the cleaned CSS to a new file
with open("cleaned.css", "w", encoding="utf-8") as f:
    f.write(cleaned_css)

print("CSS cleaning complete. Check 'cleaned.css' for the result.")
