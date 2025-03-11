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

frappe.ui.form.on('Endurance', {
    start: function(frm) {
        frm.clear_table("readings");

        let setup_data = frm.doc.setup || [];
        let setup_length = setup_data.length;
        let sen_values = setup_data.map(row => row.sen).filter(Boolean); // Remove empty/null values

        if (sen_values.length === 0) {
            frappe.msgprint("No sensor values found in setup.");
            return;
        }

        // Initialize readings with setup_data
        setup_data.forEach(row => {
            let new_row = frm.add_child("readings");
            new_row.setup = row.setup;
            new_row.sen = row.sen; // Ensure the sensor name is stored
        });
        frm.refresh_field("readings");

        if (!frm.data_interval) {
            frm.data_interval = setInterval(() => {
                frm.clear_table("readings");

                // Loop through each sensor value and fetch data
                sen_values.forEach((sen, index) => {
                    let url = "https://e2e-60-5.ssdcloudindia.net:8086/query";
                    let params = {
                        db: "Org_LnT",
                        q: `SELECT * FROM ${sen} WHERE time >= now() - 1h`
                    };

                    let username = "sisai";
                    let password = "sisai123";
                    let credentials = btoa(username + ':' + password);

                    $.ajax({
                        url: url + "?" + $.param(params),
                        method: "GET",
                        headers: {
                            "Authorization": "Basic " + credentials,
                            "Accept": "application/json"
                        },
                        success: function(response) {
                            if (response.results && response.results[0].series) {
                                let values = response.results[0].series[0].values;

                                // Limit data to match the setup length
                                values.slice(0, setup_length).forEach((data_row, row_index) => {
                                    let new_row = frm.add_child("readings");
                                    new_row.time = data_row[0];
                                    new_row.reading_1 = data_row[1];
                                    new_row.reading_2 = data_row[2];
                                    new_row.reading_3 = data_row[3];
                                    new_row.reading_4 = data_row[4];

                                    // Ensure setup mapping remains consistent
                                    if (setup_data[row_index]) {
                                        new_row.setup = setup_data[row_index].setup;
                                        new_row.sen = setup_data[row_index].sen;
                                    }
                                });

                                frm.refresh_field("readings");
                            } else {
                                frappe.msgprint(`No data returned from sensor ${sen}.`);
                            }
                        },
                        error: function(xhr, status, error) {
                            frappe.msgprint(`Error fetching data for sensor ${sen}: ` + xhr.responseText);
                        }
                    });
                });
            }, 5000);
        }
    },

    stop: function(frm) {
        if (frm.data_interval) {
            clearInterval(frm.data_interval);
            frm.data_interval = null;
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

