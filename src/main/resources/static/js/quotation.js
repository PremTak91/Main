
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
      // Initialize calculation on page load if values are present
      CalculateActualPrice();

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
              createdDate:          $("#createdDate").val(),
              discountAmount:       $("#discountAmount").val(),
              pdfType:              $("#pdfType").val(),
              panelWatt:            $("#panelWatt").val()
          };

          // Show loader for the entire duration of PDF generation
          if (typeof showLoader === "function") showLoader();

          // ── Helper ───────────────────────────────────────────────────────
          function safeHideLoader() {
              if (typeof hideLoader === "function") hideLoader();
          }

          // ── Environment detection ─────────────────────────────────────────
          // Treat ALL mobile devices (WebView or real browser) with the token
          // path so we never trigger the Android DownloadManager.
          // Desktop browsers get the direct blob-download path.
          var ua = navigator.userAgent || "";
          var isMobileDevice = /Android|iPhone|iPad|iPod/i.test(ua);

          if (isMobileDevice) {
              // ════════════════════════════════════════════════════════════════
              // MOBILE PATH  (Android WebView / Chrome for Android / Safari iOS)
              // ════════════════════════════════════════════════════════════════
              //
              // WHY this approach:
              //   Every client-side download technique (blob anchor, data-URI
              //   anchor, FileReader + navigate) ultimately calls Android's
              //   DownloadManager, which requires WRITE_EXTERNAL_STORAGE.
              //   Replit APK manifests never include this permission → the OS
              //   shows "Permission not granted" and the app may crash.
              //
              // HOW it works:
              //   1. POST form JSON to /quts/token  →  server generates the PDF,
              //      stores it in memory with a one-time UUID token, returns JSON
              //      { token, viewUrl }.
              //   2. Navigate window.location.href to viewUrl.
              //   3. The WebView makes a normal GET page-load request; the JWT
              //      cookie is sent automatically.
              //   4. Server responds with Content-Disposition: inline → Android
              //      opens the PDF in the system viewer (Intent) — ZERO storage
              //      permissions required, ZERO crashes.
              //
              $.ajax({
                  type:        "POST",
                  url:         "/NRS/quts/token",
                  contentType: "application/json",
                  data:        JSON.stringify(formData),
                  success: function(response) {
                      safeHideLoader();
                      if (response && response.viewUrl) {
                          // Navigate → WebView loads the PDF like a normal page
                          window.location.href = response.viewUrl;
                      } else {
                          alert("Could not generate PDF. Server returned an unexpected response.");
                      }
                  },
                  error: function(xhr) {
                      safeHideLoader();
                      var msg = "Error generating PDF.";
                      try {
                          var json = JSON.parse(xhr.responseText);
                          if (json && json.error) msg = json.error;
                      } catch(e) { /* ignore */ }
                      alert(msg);
                  }
              });

          } else {
              // ════════════════════════════════════════════════════════════════
              // DESKTOP PATH  (Chrome, Firefox, Edge, Safari on macOS / Windows)
              // ════════════════════════════════════════════════════════════════
              //
              // Desktop browsers support blob:// URLs and honour the HTML
              // download attribute → trigger a direct file-save dialog.
              //
              $.ajax({
                  type:        "POST",
                  url:         "/NRS/quts",
                  contentType: "application/json",
                  data:        JSON.stringify(formData),
                  xhrFields:   { responseType: "blob" },
                  success: function(blob) {
                      safeHideLoader();
                      var url  = window.URL.createObjectURL(blob);
                      var link = document.createElement("a");
                      link.href     = url;
                      link.download = pdfFilename;
                      link.style.display = "none";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      setTimeout(function() {
                          window.URL.revokeObjectURL(url);
                          location.reload(); // reset quotation number for next use
                      }, 1500);
                  },
                  error: function(xhr, status, error) {
                      safeHideLoader();
                      alert("Error generating PDF: " + (error || "Unknown error"));
                  }
              });
          }
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