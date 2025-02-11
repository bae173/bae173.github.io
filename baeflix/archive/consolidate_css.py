import cssutils
from collections import defaultdict

def consolidate_css(input_file, output_file):
    """ Reads a CSS file, consolidates similar styles, and writes optimized CSS. """
    
    # Read input CSS file
    with open(input_file, 'r', encoding='utf-8') as file:
        css_text = file.read()

    # Create a CSS parser
    parser = cssutils.CSSParser()
    stylesheet = parser.parseString(css_text)
    
    style_groups = defaultdict(list)

    # Iterate over CSS rules
    for rule in stylesheet:
        if isinstance(rule, cssutils.css.CSSStyleRule):  # Ignore media queries, imports, etc.
            prop_dict = tuple(sorted((p.name, p.value) for p in rule.style))  # Sort properties
            style_groups[prop_dict].append(rule.selectorText)

    # Generate consolidated CSS
    consolidated_css = cssutils.css.CSSStyleSheet()
    
    for properties, selectors in style_groups.items():
        new_rule = cssutils.css.CSSStyleRule()
        new_rule.selectorText = ", ".join(selectors)  # Merge selectors
        for prop_name, prop_value in properties:
            new_rule.style.setProperty(prop_name, prop_value)
        consolidated_css.add(new_rule)
    
    # Write optimized CSS to output file
    with open(output_file, 'w', encoding='utf-8') as file:
        file.write(consolidated_css.cssText.decode('utf-8'))
    
    print(f"Consolidated CSS written to {output_file}")

# Example usage
input_file = "/Users/ekanemokeke/Documents/Extracurriculars/kpopedits/bae173/baeflix/styles_formatted.css"  # Replace with actual file
output_file = "/Users/ekanemokeke/Documents/Extracurriculars/kpopedits/bae173/baeflix/optimized_styles.css"
consolidate_css(input_file, output_file)
