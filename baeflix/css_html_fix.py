import re
import cssutils
from collections import defaultdict

def parse_css(file_path):
    """Reads and parses the CSS file, returning a dictionary of style rules."""
    with open(file_path, 'r', encoding='utf-8') as file:
        css_text = file.read()

    sheet = cssutils.parseString(css_text)
    style_dict = defaultdict(set)

    for rule in sheet.cssRules:
        if rule.type == rule.STYLE_RULE:
            properties = tuple(sorted((prop.name, prop.value) for prop in rule.style))
            style_dict[properties].add(rule.selectorText)

    return style_dict

def write_optimized_css(style_dict, output_file):
    """Writes the optimized CSS to a new file."""
    with open(output_file, 'w', encoding='utf-8') as file:
        for properties, selectors in style_dict.items():
            file.write(f"{', '.join(selectors)} {{\n")
            for name, value in properties:
                file.write(f"    {name}: {value};\n")
            file.write("}\n\n")

def update_html(input_html, output_html, style_dict):
    """Replaces old selectors in the HTML with optimized ones."""
    with open(input_html, 'r', encoding='utf-8') as file:
        html_text = file.read()

    replacements = {}
    for properties, selectors in style_dict.items():
        new_class = list(selectors)[0]  # Pick one class to represent the merged styles
        for selector in selectors:
            if selector.startswith('#'):
                tag_id = selector.lstrip('#')
                replacements[f'id="{tag_id}"'] = f'class="{new_class.lstrip('.')}"'
            elif selector.startswith('.'):
                class_name = selector.lstrip('.')
                replacements[f'class="{class_name}"'] = f'class="{new_class.lstrip('.')}"'

    for old, new in replacements.items():
        html_text = re.sub(rf'\b{re.escape(old)}\b', new, html_text)

    with open(output_html, 'w', encoding='utf-8') as file:
        file.write(html_text)

def main():
    css_input = "/Users/ekanemokeke/Documents/Extracurriculars/kpopedits/bae173/baeflix/optimized_styles.css"  # Change this to your CSS file path
    css_output = "/Users/ekanemokeke/Documents/Extracurriculars/kpopedits/bae173/baeflix/consolidated_styles.css"
    html_input = "/Users/ekanemokeke/Documents/Extracurriculars/kpopedits/bae173/baeflix/baeflixtest_formatted.html"  # Change this to your HTML file path
    html_output = "/Users/ekanemokeke/Documents/Extracurriculars/kpopedits/bae173/baeflix/baeflixtest_optimized.html"

    print("Optimizing CSS...")
    style_dict = parse_css(css_input)
    write_optimized_css(style_dict, css_output)
    
    print("Updating HTML...")
    update_html(html_input, html_output, style_dict)

    print("Optimization complete! Files saved as 'optimized.css' and 'optimized.html'.")

if __name__ == "__main__":
    main()
