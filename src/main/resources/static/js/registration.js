$(document).ready(function() {
    $("#employeeForm").submit(function(event) {
        event.preventDefault();

        // Prepare form data object
        var formData = {
            firstName: $("#firstName").val(),
            middleName: $("#middleName").val(),
            lastName: $("#lastName").val(),
            email: $("#email").val(),
            phoneNumber: $("#phoneNumber").val(),
            password: $("#password").val(),
            roleId: $("#roleId").val(),
            designationId: $("#designationId").val(),
            dateOfJoining: $("#dateOfJoining").val()
            // photo will be sent separately using FormData (see below)
        };

        // Create FormData for file upload
        var data = new FormData(this); // `this` is the form element

        // Append other form fields to FormData (to be sure)
        Object.keys(formData).forEach(key => {
            data.set(key, formData[key]);
        });

        $.ajax({
            url: "/NRS/registration",
            type: "POST",
            data: data,
            processData: false,  // Important for FormData
            contentType: false,  // Important for FormData
            success: function(response) {
                $("#responseMsg").html(
                    '<div class="alert alert-success">' +
                        'Employee registered successfully!<br>' +
                        '<a href="/NRS/login">Click here to login</a>' +
                    '</div>'
                );
                $("#employeeForm")[0].reset();
            },
            error: function(xhr) {
                let errMsg = xhr.responseJSON?.message || "Registration failed. Please try again.";
                $("#responseMsg").html('<div class="alert alert-danger">' + errMsg + '</div>');
            }
        });
    });
});
