frappe.ui.form.on('Setup List', {
    scan_pipe_sr_no(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        const scanPipeSrNo = row.scan_pipe_sr_no;
        if (scanPipeSrNo) {
            frappe.call({
                method: "lnt_defence.custom.on_update", // Fixed quotation marks
                args: {
                    scan_pipe_sr_no: scanPipeSrNo
                },
                callback: function(response) {
                    console.log(response);
                    if (response.message) {
                        frappe.model.set_value(cdt, cdn, 'scan_pipe_sr', response.message);
                        console.log(response.message);
                    }
                }
            });
        }
    }
});

frappe.ui.form.on("Endurance", {
    start: function(frm) {
        frm.clear_table("readings");  // Clear readings before starting

        let setup_data = frm.doc.setup || [];
        if (!setup_data.length) {
            frappe.msgprint("No setup data available.");
            return;
        }

        // Stop previous interval if already running
        if (frm.data_interval) {
            clearInterval(frm.data_interval);
        }

        // Function to fetch and map data correctly
        function fetchData() {
            frappe.call({
                method: "lnt_defence.custom.fetch_sensor_data", // Update with actual app path
                args: { setup_data: setup_data },
                callback: function(response) {
                    if (response.message) {
                        frm.clear_table("readings");  // Clear before adding new data
                        let sensor_data = response.message; // API response

                        if (Array.isArray(sensor_data)) {
                            setup_data.forEach((setup_row, index) => {
                                let sensor_reading = sensor_data.find(data_row => data_row.sen === setup_row.sen);
                                console.log(sensor_reading)
                                if (sensor_reading) {
                                    let new_row = frm.add_child("readings");
                                    new_row.time = sensor_reading.time;
                                    new_row.reading_1 = sensor_reading.reading_1 || null;
                                    new_row.reading_2 = sensor_reading.reading_2 || null;
                                    new_row.reading_3 = sensor_reading.reading_3 || null;
                                    new_row.reading_4 = sensor_reading.reading_4 || null;
                                    new_row.setup = setup_row.setup;
                                    new_row.sen = setup_row.sen;
                                }
                            });

                            frm.refresh_field("readings");
                        } else {
                            frappe.msgprint("Invalid data format received.");
                        }
                    }
                }
            });
        }

        // Initial fetch and set interval
        fetchData();
        frm.data_interval = setInterval(fetchData, 5000);
    },

    stop: function(frm) {
        if (frm.data_interval) {
            clearInterval(frm.data_interval);
            frm.data_interval = null;
            frappe.msgprint("Data fetching stopped.");
        }
    }

,

    before_save: function(frm) {
        if (frm.data_interval) {
            clearInterval(frm.data_interval);
            frm.data_interval = null;
        }
    },

    onload_post_render: function(frm) {
        if (frm.data_interval) {
            clearInterval(frm.data_interval);
            frm.data_interval = null;
        }
    }
});
