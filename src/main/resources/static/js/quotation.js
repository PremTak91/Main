
$(document).ready(function(){
  const today = new Date();

   const day = String(today.getDate()).padStart(2, '0');
   const month = String(today.getMonth() + 1).padStart(2, '0');
   const year = today.getFullYear();
   const formattedDate = `${day}/${month}/${year}`;
   $("#createdDate").val(formattedDate);

});

function calculateKw() {
    const panelWatt = parseInt($("#panelWatt").val()) || 0;
    const noOfPanels = parseInt($("#noOfPanels").val()) || 0;

    const result = (noOfPanels * panelWatt) / 1000;

    return Number(result.toFixed(2)); // keeps it numeric
}
// Keep the JavaScript logic exactly as provided
  function CalculateActualPrice() {

      // Retrieve values and convert them to numbers
      var totalKw = calculateKw(); // Default to 0 if NaN
      var perKw = parseFloat($("#rateKw").val() || 0); // Default to 0 if NaN
      var discomInputVal = $("#discomMeter").val();
      var discomMeterCharge = parseFloat(discomInputVal); // Default to 0 if NaN
      var pqHsCost = parseFloat($("#pqHsCost").val() || 0); // Default to 0 if NaN
      var subsidy = parseFloat($("#subsidy").val() || 0); // Default to 0 if NaN

      // Calculate total price
      var totalPrice = perKw * totalKw;
      $("#value").val(Number(totalPrice.toFixed(2)));
    
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
      // Check for query parameters to auto-fill (Regeneration)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('customerName')) {
          $("#customerName").val(urlParams.get('customerName'));
          $("#customerMobileNumber").val(urlParams.get('customerNumber'));
          $("#solarType").val(urlParams.get('solarType') || 'Residential');
          $("#panelsName").val(urlParams.get('panelsName') || 'ADANI TOPCON, ADANI BIFACIAL , WAAREE');
          $("#noOfPanels").val(urlParams.get('noOfPanels') || '');
          $("#panelWatt").val(urlParams.get('panelWatt') || '540');
          $("#rateKw").val(urlParams.get('rateKw') || '');
          $("#discomMeter").val(urlParams.get('discomMeter') || '0');
          $("#pqHsCost").val(urlParams.get('pqHsCost') || '0');
          $("#subsidy").val(urlParams.get('subsidy') || '78000');
          
          const subByVal = urlParams.get('submittedBy');
          if (subByVal) {
              if ($("#submittedBy").length > 0) {
                  $("#submittedBy option").each(function() {
                      if ($(this).text() === subByVal) {
                          $(this).prop('selected', true);
                          $("#submittedByName").val(subByVal);
                      }
                  });
              } else {
                  $("#submittedByName").val(subByVal);
              }
          }
          if (urlParams.get('submittedNumber')) {
              $("#submittedNumber").val(urlParams.get('submittedNumber'));
          }
          if (urlParams.get('discount')) {
              $("#discount").val(urlParams.get('discount'));
          }
          $("#pdfType").val(urlParams.get('pdfType') || 'Standardized');
      }

      // Initialize calculation on page load if values are present
      CalculateActualPrice();

      // Apply discount calculation if discount is present
      if (urlParams.has('customerName') && urlParams.get('discount')) {
          let discount = parseFloat(urlParams.get('discount'));
          if (!isNaN(discount) && discount > 0) {
              let actualAmount = parseFloat($("#actualPrice").val()) || 0;
              let baseEffectivePrice = Math.round(actualAmount - parseFloat($("#subsidy").val())) || 0;
              let discountAmount = discount;
              let afterDiscountEffectivePrice = baseEffectivePrice - discountAmount;
              $("#discountAmount").val(discountAmount);
              $("#effectivePrice").val(Math.round(afterDiscountEffectivePrice));
          }
      }

      $("form").on("submit", function(event) {
          event.preventDefault();

          var quationsNumber = $("#quationNumber").val();
          var name           = $("#customerName").val();
          var pdfFilename    = quationsNumber + "_" + name + ".pdf";

          var formData = {
              quationNumber:        quationsNumber,
              customerName:         name,
              customerMobileNumber: $("#customerMobileNumber").val(),
              kw:                   calculateKw(),
              solarType:            $("#solarType").val(),
              panelsName:           $("#panelsName").val(),
              rateKw:               parseFloat($("#rateKw").val()),
              value:                parseFloat($("#value").val()),
              discomMeter:          $("#discomMeter").val(),
              pqHsCost:             parseFloat($("#pqHsCost").val()),
              actualPrice:          parseFloat($("#actualPrice").val()),
              subsidy:              parseFloat($("#subsidy").val()),
              effectivePrice:       parseFloat($("#effectivePrice").val()),
              submittedBy:          $("#submittedByName").val(),
              submittedNumber:      $("#submittedNumber").val(),
              quotationDate:          $("#createdDate").val(),
              discountAmount:       $("#discountAmount").val(),
              pdfType:              $("#pdfType").val(),
              panelWatt:            $("#panelWatt").val(),
              noOfPanels:           $("#noOfPanels").val(),
          };

          // Show loader for the entire duration of PDF generation
          if (typeof showLoader === "function") showLoader();

          // ── Helper ───────────────────────────────────────────────────────
          function safeHideLoader() {
              if (typeof hideLoader === "function") hideLoader();
          }

          // ── Android WebView path ──────────────────────────────────────────
          // When running inside the NRS Android app, window.Android is the
          // JavascriptInterface bridge injected by MainActivity.
          // We pass the form JSON to the bridge which:
          //   1. POSTs to /quts/token (with the JWT cookie)
          //   2. Navigates the WebView to /quts/view/{token}
          //   3. Downloads the PDF bytes and opens them in the system PDF viewer
          // This requires ZERO storage permissions and works on all Android versions.
          if (window.Android && typeof window.Android.downloadPdf === "function") {
              try {
                  safeHideLoader();
                  window.Android.downloadPdf(JSON.stringify(formData), pdfFilename);
              } catch (e) {
                  safeHideLoader();
                  showToast("Mobile PDF error: " + e.message, "error");
              }
              return; // Stop here — Android handles the rest natively
          }

          // ── Web / Desktop / iOS path ──────────────────────────────────────
          // Direct blob download — works perfectly on all browsers except Android WebView.
          $.ajax({
              type:        "POST",
              url:         "/NRS/quts",
              contentType: "application/json",
              data:        JSON.stringify(formData),
              xhrFields:   { responseType: "blob" },
              success: function(blob) {
                  safeHideLoader();
                  var blobUrl = window.URL.createObjectURL(blob);
                  var a = document.createElement("a");
                  a.href = blobUrl;
                  a.download = pdfFilename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  setTimeout(function() {
                      window.URL.revokeObjectURL(blobUrl);
                  }, 1000);
              },
              error: function(xhr, status, error) {
                  safeHideLoader();
                  showToast("Error generating PDF: " + (error || "Unknown error"), "error");
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

$("#solarType").on("change", function(){
    if($(this).val().trim() == "Residential"){
        $("#subsidy").val(78000);
    }else{
        $("#subsidy").val(0);
    }

});