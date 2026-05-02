$(document).ready(function() {
    // Restore remembered credentials if any
    if (localStorage.getItem("rememberMe") === "true") {
        $("#emailInput").val(localStorage.getItem("rememberedUsername"));
        $("#passwordInput").val(localStorage.getItem("rememberedPassword"));
        $("#rememberMe").prop("checked", true);
    }

    $("#loginForm").submit(function(event) {
        event.preventDefault();
        var username = $("#emailInput").val();
        var password = $("#passwordInput").val();
        var rememberMe = $("#rememberMe").is(":checked");
        
        showLoader();
        $.ajax({
            url: "/NRS/login/auth",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ username: username, password: password }),
            success: function(response) {
                // Save JWT token to localStorage or cookie
                localStorage.setItem("jwtToken", response);
                
                // Save or clear Remember Me data
                if (rememberMe) {
                    localStorage.setItem("rememberMe", "true");
                    localStorage.setItem("rememberedUsername", username);
                    localStorage.setItem("rememberedPassword", password);
                } else {
                    localStorage.removeItem("rememberMe");
                    localStorage.removeItem("rememberedUsername");
                    localStorage.removeItem("rememberedPassword");
                }
                
                hideLoader();
                // Redirect to home or dashboard
                window.location.href = "/NRS/home";
            },
            error: function(xhr) {
                hideLoader();
                var errorText = "You have entered wrong login details, please correct it and login again.";
                $("#loginErrorText").text(errorText);
                $("#loginErrorMessage").removeClass("d-none").addClass("d-flex");
            }
        });
    });

    // Forgot Password Form Submission
    $("#forgotPasswordForm").submit(function(event) {
        event.preventDefault();
        var email = $("#forgotEmailInput").val();
        var $messageBox = $("#forgotPasswordMessage");
        
        showLoader();
        $messageBox.hide().removeClass("alert-success alert-danger");

        $.ajax({
            url: "/NRS/forgot-password",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ email: email }),
            success: function(response) {
                hideLoader();
                $messageBox.text(response).addClass("alert alert-success").show();
                // Optionally hide the modal after a few seconds
                setTimeout(function() {
                    $("#forgotPasswordModal").modal("hide");
                    $messageBox.hide();
                    $("#forgotEmailInput").val("");
                }, 3000);
            },
            error: function(xhr) {
                hideLoader();
                var errorMsg = xhr.responseText || "An error occurred. Please try again.";
                $messageBox.text(errorMsg).addClass("alert alert-danger").show();
            }
        });
    });
});
