# import frappe
# from PIL import Image
# import pytesseract
# import os

# def process_image(image_url):
#     # Extract filename from URL
#     filename = os.path.basename(image_url)
    
#     # Construct the full file path
#     full_image_file_path = os.path.join(frappe.get_site_path("private", "files"), filename)
    
#     try:
#         # Check if the file exists before trying to open it
#         if not os.path.exists(full_image_file_path):
#             frappe.log_error(f"File not found: {full_image_file_path}")
#             return None
        
#         img = Image.open(full_image_file_path)
        
#         # Use pytesseract to extract text from the image
#         extracted_text = pytesseract.image_to_string(img)
#         frappe.log_error(f"Extracted text: {extracted_text}")
        
#         # Return the extracted text
#         return extracted_text
        
#     except Exception as e:
#         # Log error and return None
#         frappe.log_error(f"Failed to process image from file {full_image_file_path}: {str(e)}")
#         return None

# @frappe.whitelist()
# def on_update(doc, method):
#     # Check if the 'test' field is populated
#     # if doc.test:
#     #     extracted_text = process_image(doc.test)
#     #     if extracted_text:
#     #         # Avoid recursive saves by only saving when necessary
#     #         if doc.test_data != extracted_text:
#     #             doc.test_data = extracted_text  # Save the extracted text to the 'test_data' field
#     #             doc.db_update()  # Use db_update to avoid triggering hooks again
#     if doc.setup:  # Assuming 'setup' is a child table
#         for i in doc.setup:
#             if i.scan_pipe_sr_no:  # Assuming 'scan_pipe_sr_no' holds the image file name or path
#                 extracted_text = process_image(i.scan_pipe_sr_no)
#                 if extracted_text:
#                     i.pipe_sr_no = extracted_text 
#         doc.db_update()
import frappe, pytesseract, os, random
from PIL import Image

@frappe.whitelist()
def on_update(scan_pipe_sr_no):
    extracted_text = ""

    if scan_pipe_sr_no:
        image_url = scan_pipe_sr_no
        filename = os.path.basename(image_url)
        full_image_file_path = os.path.join(frappe.get_site_path("private", "files"), filename)
        
        try:
            if not os.path.exists(full_image_file_path):
                frappe.throw(f"File not found: {full_image_file_path}")
            
            img = Image.open(full_image_file_path)
            extracted_text = pytesseract.image_to_string(img)
            
        except Exception as e:
            frappe.log_error(f"Failed to process image: {str(e)}")
    
    return extracted_text
@frappe.whitelist(allow_guest=True)
def generate_random_values_for_rows():
    row_count = int(frappe.form_dict.get('row_count'))  # Extract 'row_count' from the request data
    readings = []
    for _ in range(row_count):
        readings.append({
            'reading_1': random.randint(0, 100),
            'reading_2': random.randint(0, 100),
            'reading_3': random.randint(0, 100)
        })
    return readings

