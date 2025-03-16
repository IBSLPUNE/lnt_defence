frappe.ui.form.on('Setup List', {
    scan_pipe_sr_no(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        const scanPipeSrNo = row.scan_pipe_sr_no;

        if (scanPipeSrNo) {
            frappe.call({
                method: "lnt_defence.custom.on_update",
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

frappe.ui.form.on('Test', {
    start: function(frm) {
        // Clear and populate readings table
        frm.clear_table("reading");
        (frm.doc.setup || []).forEach(row => {
            let new_row = frm.add_child("reading");
            new_row.setup = row.setup;
        });
        frm.refresh_field("reading");

        // Start random value generation
        if (!frm.random_interval) {
            frm.random_interval = setInterval(() => {
                frappe.call({
                    method: "lnt_defence.custom.generate_random_values_for_rows",
                    args: {
                        row_count: frm.doc.reading.length
                    },
                    callback: function(response) {
                        if (response.message) {
                            frm.doc.reading.forEach((row, index) => {
                                frappe.model.set_value(row.doctype, row.name, 'reading_1', response.message[index].reading_1);
                                frappe.model.set_value(row.doctype, row.name, 'reading_2', response.message[index].reading_2);
                                frappe.model.set_value(row.doctype, row.name, 'reading_3', response.message[index].reading_3);
                                frappe.model.set_value(row.doctype, row.name, 'reading_4', response.message[index].reading_4);
                            });
                            frm.refresh_field("reading");
                        }
                    },
                    error: function(xhr) {
                        frappe.msgprint("Error in API call: " + xhr.responseText);
                    }
                });
            }, 5000); // Update every 5 seconds
        }
    },

    stop: function(frm) {
        if (frm.random_interval) {
            clearInterval(frm.random_interval);
            frm.random_interval = null;
        }
    },

    before_save: function(frm) {
        if (frm.random_interval) {
            clearInterval(frm.random_interval);
            frm.random_interval = null;
        }
    },

    onload_post_render: function(frm) {
        if (frm.random_interval) {
            clearInterval(frm.random_interval);
            frm.random_interval = null;
        }
    }
});
frappe.ui.form.on("Flushing", {
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
                        frm.clear_table("reading"); // Clear before adding new data
                        let sensor_data = response.message;

                        if (Array.isArray(sensor_data)) {
                            sensor_data.forEach((data_row) => {
                                let new_row = frm.add_child("reading");
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

                                frm.refresh_field("reading");
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
    }
});


