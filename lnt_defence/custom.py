import frappe
from PIL import Image
import pytesseract
import os

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
import os
import frappe
from PIL import Image
import pytesseract
import random
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

            # Ensure Tesseract-OCR is installed and available in the path
            pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"  # Adjust path if needed

            img = Image.open(full_image_file_path)
            extracted_text = pytesseract.image_to_string(img)

            # Log the extracted text for debugging
            frappe.logger().info(f"Extracted Text: {extracted_text}")

            return extracted_text  # Returning extracted text

        except Exception as e:
            frappe.log_error(f"Failed to process image: {str(e)}")
            frappe.throw(f"Error processing image: {str(e)}")


@frappe.whitelist(allow_guest=True)
def generate_random_values_for_rows():
    row_count = int(frappe.form_dict.get('row_count'))  # Extract 'row_count' from the request data
    readings = []
    for _ in range(row_count):
        readings.append({
            'reading_1': random.randint(0, 100),
            'reading_2': random.randint(0, 100),
            'reading_3': random.randint(0, 100),
            'reading_4': random.randint(0, 100)
        })
    return readings


import frappe
import requests
import base64
@frappe.whitelist(allow_guest=True)
def fetch_sensor_data(setup_data):
    try:
        if not setup_data:
            return {"error": "No setup data provided."}

        setup_data = frappe.parse_json(setup_data)
        sensor_map = {}  # Map to link sensor fields (sensor_1, sensor_2) with actual sensor names
        
        for row in setup_data:
            for key, value in row.items():
                if key.startswith("sensor_") and value:
                    sensor_map[key] = value  # Example: {'sensor_1': 'a0hex001', 'sensor_2': 'a0hex002'}

        if not sensor_map:
            return {"error": "No sensor fields found in setup data."}

        url = "https://e2e-60-5.ssdcloudindia.net:8086/query"
        username = "sisai"
        password = "sisai123"
        credentials = base64.b64encode(f"{username}:{password}".encode()).decode()

        readings = []

        for sensor_field, sensor_name in sensor_map.items():
            params = {
                "db": "Org_LnT",
                "q": f"SELECT * FROM {sensor_name} WHERE time >= now() - 10m"
            }
            headers = {
                "Authorization": f"Basic {credentials}",
                "Accept": "application/json"
            }

            response = requests.get(url, params=params, headers=headers, timeout=10, verify=False)

            if response.status_code == 200:
                result = response.json()
                series_data = result.get("results", [{}])[0].get("series", [])

                if series_data:
                    columns = series_data[0].get("columns", [])
                    values = series_data[0].get("values", [])

                    if "AI1" in columns:
                        index_40100 = columns.index("AI1")

                        for data_row in values:
                            if index_40100 < len(data_row):
                                readings.append({
                                    "sensor_field": sensor_field,  # ✅ Map back to sensor_1, sensor_2, etc.
                                    "sensor": sensor_name,
                                    "time": data_row[0],
                                    "40100": data_row[index_40100]
                                })

        return readings

    except Exception as e:
        frappe.log_error(f"Error fetching sensor data: {str(e)}")
        return {"error": f"An error occurred: {str(e)}"}









