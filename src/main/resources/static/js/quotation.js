

// Keep the JavaScript logic exactly as provided
  function CalculateActualPrice() {
      // debugger; // Keep or remove debugger as per your needs
      // Retrieve values and convert them to numbers
      var totalKw = parseFloat($("#kw").val() || 0); // Default to 0 if NaN
      var perKw = parseFloat($("#rateKw").val() || 0); // Default to 0 if NaN
      var discomInputVal = $("#discomMeter").val();
      var discomMeterCharge = parseFloat(discomInputVal); // Default to 0 if NaN
      var pqHsCost = parseFloat($("#pqHsCost").val() || 0); // Default to 0 if NaN
      var subsidy = parseFloat($("#subsidy").val() || 0); // Default to 0 if NaN

      // Calculate total price
      var totalPrice = perKw * totalKw;
      $("#value").val(totalPrice);
    
      // Calculate actual price
      var actualPrice = 0;
      if(!isNaN(discomMeterCharge)) {
          actualPrice = Math.round(totalPrice + pqHsCost + discomMeterCharge);
      }else{
            actualPrice = Math.round(totalPrice + pqHsCost + 0);
      }

      $("#actualPrice").val(actualPrice);
    
      // Calculate effective price
      var effectivePrice = Math.round(actualPrice - subsidy); // To ensure the effective price doesn't go negative
      $("#effectivePrice").val(effectivePrice);
  }



$(document).on("keyup", "#discount", function () {
    let discount = parseFloat($(this).val());
    let actualAmount = parseFloat($("#actualPrice").val()) || 0;
    let baseEffectivePrice = Math.round(actualAmount - parseFloat($("#subsidy").val())) || 0;
    if (!isNaN(discount) && baseEffectivePrice >= 0) {
        let discountAmount = discount;
        let afterDiscountEffectivePrice = baseEffectivePrice - discountAmount;
        $("#discountAmount").val(discountAmount);
        $("#effectivePrice").val(Math.round(afterDiscountEffectivePrice.toFixed(2)));
    }
});
  $(document).ready(function() {
      // Initialize calculation on page load if values are present
      CalculateActualPrice(); 

      $("form").on("submit", function(event) {
          event.preventDefault();

        let quationsNumber = $("#quationNumber").val();
        let name =  $("#customerName").val();
        let filename = quationsNumber +"_"+ name;
          const formData = {
			  quationNumber: quationsNumber,
			  customerName: name,
			  customerMobileNumber: $("#customerMobileNumber").val(),
              kw: parseFloat($("#kw").val()),
              solarType: $("#solarType").val(),
              panelsName: $("#panelsName").val(),
              rateKw: parseFloat($("#rateKw").val()),
              value: parseFloat($("#value").val()),
              discomMeter: $("#discomMeter").val(),
              pqHsCost: parseFloat($("#pqHsCost").val()),
              actualPrice: parseFloat($("#actualPrice").val()),
              subsidy: parseFloat($("#subsidy").val()),
              effectivePrice: parseFloat($("#effectivePrice").val()),
              submittedBy: $("#submittedByName").val(),
              submittedNumber: $("#submittedNumber").val(),
			  createdDate: $("#createdDate").val(),
			  discountAmount: $("#discountAmount").val(),
              pdfType: $("#pdfType").val()
          };

          // Trigger standard application loader before initiating heavy PDF generation request
          if (typeof showLoader === "function") showLoader();

          $.ajax({
              type: "POST",
              url: "/NRS/quts", // Keep the exact URL as requested
              contentType: "application/json",
              data: JSON.stringify(formData),
              xhrFields: {
                  responseType: 'blob'
              },
              success: function(blob, status, xhr) {
                  if (typeof hideLoader === "function") hideLoader();
                  const link = document.createElement("a");
                  const url = window.URL.createObjectURL(blob);
                  link.href = url;
                  link.download = filename;
                  document.body.appendChild(link);
                  link.click();
                  window.URL.revokeObjectURL(url);
                  location.reload();
              },
              error: function(xhr, status, error) {
                  if (typeof hideLoader === "function") hideLoader();
                  // Use a custom modal or message box instead of alert()
                  // Example: console.error("Error downloading PDF:", error);
                  // For a simple in-page message:
                  let errorMessage = "Error downloading PDF: " + (error || "Unknown error");
                  alert(errorMessage); // Temporarily using alert as per original logic, but recommended to use custom modal.
              }
          });
      });
  });


$(document)
  .off("change", "#submittedBy")
  .on("change", "#submittedBy", function () {

    $("#submittedByName").val($("#submittedBy option:selected").text());
    $("#submittedNumber").val($(this).val());

});