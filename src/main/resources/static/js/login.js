$(document).ready(function() {
    $("#loginForm").submit(function(event) {
        event.preventDefault();
        var username = $("#emailInput").val();
        var password = $("#passwordInput").val();
		debugger;
        $.ajax({
            url: "/NRS/login/auth",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ username: username, password: password }),
            success: function(response) {
                // Save JWT token to localStorage or cookie
                localStorage.setItem("jwtToken", response);
                // Redirect to home or dashboard
                window.location.href = "/home";
            },
            error: function(xhr) {
                alert("Login failed: " + (xhr.responseText || "Invalid credentials"));
            }
        });
    });
});
