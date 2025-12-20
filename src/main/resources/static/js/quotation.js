// Keep the JavaScript logic exactly as provided
  function CalculateActualPrice() {
      // debugger; // Keep or remove debugger as per your needs
      // Retrieve values and convert them to numbers
      var totalKw = parseFloat($("#kw").val() || 0); // Default to 0 if NaN
      var perKw = parseFloat($("#rateKw").val() || 0); // Default to 0 if NaN
      var discomMeterCharge = parseFloat($("#discomMeter").val() || 0); // Default to 0 if NaN
      var pqHsCost = parseFloat($("#pqHsCost").val() || 0); // Default to 0 if NaN
      var subsidy = parseFloat($("#subsidy").val() || 0); // Default to 0 if NaN

      // Calculate total price
      var totalPrice = perKw * totalKw;
      $("#value").val(totalPrice);
    
      // Calculate actual price
      var actualPrice = Math.round(totalPrice + pqHsCost + discomMeterCharge);
      $("#actualPrice").val(actualPrice);
    
      // Calculate effective price
      var effectivePrice = Math.round(actualPrice - subsidy); // To ensure the effective price doesn't go negative
      $("#effectivePrice").val(effectivePrice);
  }

  $(document).ready(function() {
      // Initialize calculation on page load if values are present
      CalculateActualPrice(); 

      $("form").on("submit", function(event) {
          event.preventDefault();

          const formData = {
			  quationNumber: $("#quationNumber").val(),
			  customerName: $("#customerName").val(),
			  customerAddress: $("#customerAddress").val(),
              kw: parseFloat($("#kw").val()),
              solarType: $("#solarType").val(),
              panelsName: $("#panelsName").val(),
              rateKw: parseFloat($("#rateKw").val()),
              value: parseFloat($("#value").val()),
              discomMeter: parseFloat($("#discomMeter").val()),
              pqHsCost: parseFloat($("#pqHsCost").val()),
              actualPrice: parseFloat($("#actualPrice").val()),
              subsidy: parseFloat($("#subsidy").val()),
              effectivePrice: parseFloat($("#effectivePrice").val()),
              submittedBy: $("#submittedBy").val(),
              submittedNumber: $("#submittedNumber").val(),
			  createdDate: $("#createdDate").val()
          };

          $.ajax({
              type: "POST",
              url: "/NRS/quts", // Keep the exact URL as requested
              contentType: "application/json",
              data: JSON.stringify(formData),
              xhrFields: {
                  responseType: 'blob'
              },
              success: function(blob, status, xhr) {
                  const filename = "quotation.pdf";
                  const link = document.createElement("a");
                  const url = window.URL.createObjectURL(blob);
                  link.href = url;
                  link.download = filename;
                  document.body.appendChild(link);
                  link.click();
                  window.URL.revokeObjectURL(url);
              },
              error: function(xhr, status, error) {
                  // Use a custom modal or message box instead of alert()
                  // Example: console.error("Error downloading PDF:", error);
                  // For a simple in-page message:
                  let errorMessage = "Error downloading PDF: " + (error || "Unknown error");
                  alert(errorMessage); // Temporarily using alert as per original logic, but recommended to use custom modal.
              }
          });
      });
  });