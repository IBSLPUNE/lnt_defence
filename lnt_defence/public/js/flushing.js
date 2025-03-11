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
                        console.log(response.message);
                    }
                }
            });
        }
    }
});

frappe.ui.form.on('Flushing', {
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
                $.ajax({
                    url: "http://127.0.0.1:8000/api/method/lnt_defence.custom.generate_random_values_for_rows",
                    method: "POST",
                    data: {
                        row_count: frm.doc.reading.length
                    },
                    headers: {
                        "X-Frappe-CSRF-Token": frappe.csrf_token
                    },
                    success: function(response) {
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

