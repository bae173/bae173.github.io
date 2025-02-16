import pandas as pd
import re
from bs4 import BeautifulSoup

def generate_html_from_spreadsheet(spreadsheet_path, html_template_path, output_html_path):
    # Load spreadsheet
    df = pd.read_excel(spreadsheet_path)
    
    # Group by Content Title to handle merged rows
    grouped = df.groupby("Content Title", as_index=False, dropna=False).agg({
        "Sub-section": "first",
        "Layout Choice": "first",
        "Cover Picture Link": "first",
        "Content Description": "first",
        "Background Image Link": "first",
        "English Subtitles": "first",
        "Button Title": list,
        "Button Link": list
    })
    
    # Read existing HTML template
    with open(html_template_path, "r", encoding="utf-8") as file:
        soup = BeautifulSoup(file, "html.parser")
    
    # Find the catalogue section
    catalogue_section = soup.find("section", {"id": "catalogue-section"})
    
    for _, row in grouped.iterrows():
        subsection = row["Sub-section"]
        layout_choice = row["Layout Choice"]
        cover_picture = row["Cover Picture Link"] or "#FA9D33"
        content_title = row["Content Title"]
        content_description = row["Content Description"]
        background_image = row["Background Image Link"] or "#FA9D33"
        eng_sub = row["English Subtitles"]
        button_titles = row["Button Title"]
        button_links = row["Button Link"]
        
        # Generate section ID (lowercase, hyphenated, special characters removed)
        section_id = re.sub(r'[^a-zA-Z0-9\s]', '', content_title).strip().lower().replace(" ", "-")
        
        # Find the correct subsection in the catalogue
        subsection_found = False
        for p_tag in catalogue_section.find_all("p", class_="style1"):
            if p_tag.text.strip() == subsection:
                subsection_found = True
                catalogue_grid = p_tag.find_next_sibling("div", class_="cataloguepagegrid")
                break
        
        # If subsection doesn't exist, create it
        if not subsection_found:
            new_subsection = soup.new_tag("p", **{"class": "style1"})
            new_subsection.string = subsection
            catalogue_section.append(new_subsection)
            catalogue_grid = soup.new_tag("div", **{"class": "cataloguepagegrid"})
            catalogue_section.append(catalogue_grid)
        
        # Add new content to the catalogue
        catalogue_item = soup.new_tag("div", **{"class": "catalogue-item style1 image"})
        if eng_sub == "false":
            catalogue_item["class"].append("noengsub")
        
        catalogue_link = soup.new_tag("a", href=f"#{section_id}", **{"class": "frame"})
        catalogue_img = soup.new_tag("img", src=cover_picture, alt="")
        catalogue_caption = soup.new_tag("div", **{"class": "caption"})
        catalogue_caption.string = content_title
        
        catalogue_link.append(catalogue_img)
        catalogue_link.append(catalogue_caption)
        catalogue_item.append(catalogue_link)
        catalogue_grid.append(catalogue_item)
        
        # Generate content section based on layout
        section = soup.new_tag("section", **{"class": "inactive", "id": section_id, "style": "display: none;"})
        
        background_container = soup.new_tag("div", **{"class": "bckgndimage-container"})
        background_img = soup.new_tag("img", src=background_image, alt="Background Image", **{"class": "background-image"})
        overlay_content = soup.new_tag("div", **{"class": "overlay-content"})
        
        title_tag = soup.new_tag("h1")
        title_tag.string = content_title
        description_tag = soup.new_tag("p")
        description_tag.string = content_description
        
        button_container = soup.new_tag("div", **{"class": "button2-container"})
        if any(pd.notna(button) for button in button_titles):
            for button_title, button_link in zip(button_titles, button_links):
                if pd.notna(button_title) and pd.notna(button_link):
                    button = soup.new_tag("a", href=button_link, **{"class": "button2"})
                    button.string = button_title
                    button_container.append(button)
        else:
            button_container["style"] = "display: none;"
        
        overlay_content.append(title_tag)
        overlay_content.append(description_tag)
        overlay_content.append(button_container)
        
        background_container.append(background_img)
        background_container.append(overlay_content)
        
        back_banner = soup.new_tag("div", **{"class": "top-banner"})
        back_link = soup.new_tag("a", href="#catalogue")
        back_link.string = "← BACK TO BAEFLIX"
        back_banner.append(back_link)
        
        section.append(background_container)
        section.append(back_banner)
        
        # Append new section to div.inner
        inner_div = soup.select_one("html > body > div#wrapper > div.main > div.inner")
        inner_div.append(section)
    
    # Save the updated HTML
    with open(output_html_path, "w", encoding="utf-8") as file:
        file.write(str(soup.prettify()))
