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

frappe.ui.form.on("Test", {
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
                method: "lnt_defence.api.fetch_sensor_data",
                args: { setup_data: setup_data },
                callback: function (response) {
                    if (response.message) {
                        frm.clear_table("readings"); // Clear before adding new data
                        let sensor_data = response.message;

                        if (Array.isArray(sensor_data)) {
                            sensor_data.forEach((data_row) => {
                                let new_row = frm.add_child("readings");
                                new_row.setup = data_row.setup; 
                                new_row.time = frappe.datetime.now_datetime(); // Use current timestamp

                                // Find matching setup row
                                let setup_sensor = setup_data.find(s => s.sen === data_row.sensor_name);
                                if (setup_sensor) {
                                    new_row.reading_1 = data_row.sensor1 || null;
                                    new_row.reading_2 = data_row.sensor2 || null;
                                    new_row.reading_3 = data_row.sensor3 || null;
                                    new_row.reading_4 = data_row.sensor4 || null;
                                }

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
    },
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
    },
    capture_image: function(frm) {
    const scanPipeSrNo = frm.doc.capture_image;
    if (scanPipeSrNo) {
        frappe.call({
            method: "lnt_defence.custom.on_update",
            args: {
                scan_pipe_sr_no: scanPipeSrNo
            },
            callback: function(response) {
                if (response.message) {
                    // Update parent field
                    frm.set_value('scan_pipe_sr', response.message);
                }
            }
        });
    }
}

});

