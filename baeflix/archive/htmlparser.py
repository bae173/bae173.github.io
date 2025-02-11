from bs4 import BeautifulSoup

def format_html(input_file, output_file):
    # Open the input HTML file and read its content
    with open(input_file, 'r', encoding='utf-8') as file:
        html_content = file.read()

    # Use BeautifulSoup to parse and format the HTML content
    soup = BeautifulSoup(html_content, 'lxml')  # 'lxml' is faster and better for parsing

    # Format the HTML with indentation and line breaks
    formatted_html = soup.prettify()

    # Write the formatted HTML to the output file
    with open(output_file, 'w', encoding='utf-8') as file:
        file.write(formatted_html)

# Example usage
input_file = '/Users/ekanemokeke/Documents/Extracurriculars/kpopedits/bae173/baeflix/baeflixtest.html'  # Path to your unformatted HTML file
output_file = '/Users/ekanemokeke/Documents/Extracurriculars/kpopedits/bae173/baeflix/baeflixtest_formatted.html'   # Path where the formatted HTML should be saved
format_html(input_file, output_file)
