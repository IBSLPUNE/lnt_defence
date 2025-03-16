import requests
import frappe
import base64
@frappe.whitelist(allow_guest=True)
def fetch_sensor_data(setup_data):
    try:
        if not setup_data:
            return {"error": "No setup data provided."}

        setup_data = frappe.parse_json(setup_data)  # Parse JSON

        readings = []

        for row in setup_data:
            if not all(k in row for k in ["setup", "sen", "sensor_1", "sensor_2", "sensor_3", "sensor_4"]):
                continue  # Skip if any required field is missing

            setup_name = row["setup"]  # Fetch setup name
            sensor_name = row["sen"]
            sensor_1 = row["sensor_1"]
            sensor_2 = row["sensor_2"]
            sensor_3 = row["sensor_3"]
            sensor_4 = row["sensor_4"]

            # InfluxDB API details
            url = "https://e2e-60-5.ssdcloudindia.net:8086/query"
            username = "sisai"
            password = "sisai123"
            credentials = base64.b64encode(f"{username}:{password}".encode()).decode()

            query = f"""
                SELECT last("{sensor_1}") AS "sensor1", 
                       last("{sensor_2}") AS "sensor2", 
                       last("{sensor_3}") AS "sensor3", 
                       last("{sensor_4}") AS "sensor4"
                FROM "{sensor_name}" 
                WHERE id='1' AND time >= now() - 1h
            """

            params = {"db": "Org_LnT", "q": query}
            headers = {
                "Authorization": f"Basic {credentials}",
                "Accept": "application/json"
            }

            response = requests.get(url, params=params, headers=headers, timeout=10, verify=False)

            if response.status_code == 200:
                result = response.json()
                series_data = result.get("results", [{}])[0].get("series", [])

                if series_data:
                    columns = series_data[0].get("columns", [])  # Field names
                    values = series_data[0].get("values", [])  # Sensor values

                    if values:
                        latest_reading = values[-1]  # Last recorded data point
                        data_dict = {columns[i]: latest_reading[i] for i in range(len(columns))}
                        data_dict["sensor_name"] = sensor_name  # Add sensor name for reference
                        data_dict["setup"] = setup_name  # ✅ Add setup name
                        readings.append(data_dict)

        return readings if readings else {"error": "No data found from InfluxDB"}

    except Exception as e:
        frappe.log_error(f"Error fetching sensor data: {str(e)}")
        return {"error": f"An error occurred: {str(e)}"}


