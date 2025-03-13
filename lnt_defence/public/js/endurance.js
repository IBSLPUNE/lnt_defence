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
                    if (response.message) {
                        frappe.model.set_value(cdt, cdn, 'scan_pipe_sr', response.message);
                    }
                }
            });
        }
    }
});

frappe.ui.form.on("Endurance", {
    start: function (frm) {
        frm.clear_table("readings"); // Clear previous readings

        let setup_data = frm.doc.setup || [];
        if (!setup_data.length) {
            frappe.msgprint("No setup data available.");
            return;
        }

        // Stop previous interval if already running
        if (frm.data_interval) {
            clearInterval(frm.data_interval);
        }

        function fetchData() {
            frappe.call({
                method: "lnt_defence.custom.fetch_sensor_data",
                args: { setup_data: setup_data },
                callback: function (response) {
                    if (response.message) {
                        frm.clear_table("readings"); // Clear before adding new data
                        let sensor_data = response.message;

                        if (Array.isArray(sensor_data)) {
                            // Iterate over all setup sensors and match their readings
                            setup_data.forEach((setup, index) => {
                                let new_row = frm.add_child("readings");
                                new_row.time = sensor_data[0]?.time || frappe.datetime.now_datetime(); // Use latest time or current

                                // Assign each reading to its corresponding sensor
                                new_row.reading_1 = sensor_data.find(d => d.sensor === setup.sensor_1)?.["40100"] || null;
                                new_row.reading_2 = sensor_data.find(d => d.sensor === setup.sensor_2)?.["40100"] || null;
                                new_row.reading_3 = sensor_data.find(d => d.sensor === setup.sensor_3)?.["40100"] || null;
                                new_row.reading_4 = sensor_data.find(d => d.sensor === setup.sensor_4)?.["40100"] || null;

                                frm.refresh_field("readings");
                            });
                        } else {
                            frappe.msgprint("Invalid data format received.");
                        }
                    }
                }
            });
        }

        // Fetch data every 5 seconds
        frm.data_interval = setInterval(fetchData, 5000);
    },

    stop: function (frm) {
        if (frm.data_interval) {
            clearInterval(frm.data_interval);
            delete frm.data_interval;
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
