
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

        let quationsNumber = $("#quationNumber").val();
        let name =  $("#customerName").val();
        let filename = quationsNumber +"_"+ name;
          const formData = {
			  quationNumber: quationsNumber,
			  customerName: name,
			  customerMobileNumber: $("#customerMobileNumber").val(),
              kw: calculateKw(),
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
              pdfType: $("#pdfType").val(),
              panelWatt: $("#panelWatt").val()
          };

          // Trigger standard application loader before initiating heavy PDF generation request
          if (typeof showLoader === "function") showLoader();

          // ── Helper: safely hide the loader ───────────────────────────────
          function safeHideLoader() {
              if (typeof hideLoader === "function") hideLoader();
          }

          // ── Detect Android WebView (Replit APK wraps the site in WebView) ──
          // WebView UA contains "wv" flag, or carries "Version/x.x" alongside "Android"
          // without being a standalone browser.
          function isAndroidWebView() {
              var ua = navigator.userAgent || "";
              return /Android/.test(ua) && (/wv\b/.test(ua) || /Version\/[\d.]+/.test(ua));
          }

          // ── Handle the PDF blob across all environments ───────────────────
          //
          // 3 distinct paths are needed because each environment handles blobs differently:
          //
          //  1. Android WebView (Replit APK):
          //     • blob: URLs → unsupported / restricted
          //     • window.location.href = "data:..." → blocked since Chrome 66 / Android API 21+
          //     • Correct fix: create a hidden <a href="data:..." download> and .click() it;
          //       Android routes the data URI to the system PDF viewer via an Intent.
          //
          //  2. Mobile browser (Chrome for Android, Safari iOS — NOT WebView):
          //     • window.open(blobUrl, "_blank") → works; browser's built-in PDF viewer opens.
          //
          //  3. Desktop browser:
          //     • Standard blob anchor download, then page reload to reset the sequence number.
          //
          function handlePdfBlob(blob, pdfFilename) {

              if (isAndroidWebView()) {
                  // Path 1 — Android WebView
                  // Keep the loader visible during the (async) FileReader conversion so the user
                  // has feedback while the large PDF blob is being converted to base64.
                  var reader = new FileReader();

                  reader.onloadend = function () {
                      // Now we have the base64 data URI — hide loader just before handing off
                      safeHideLoader();
                      var base64data = reader.result; // "data:application/pdf;base64,..."

                      // Use a hidden anchor + .click() instead of window.location.href = data:
                      // Navigating to a data: URI is blocked in Chrome-based WebViews (API 21+)
                      // but an anchor click triggers the Android Intent chooser (PDF viewer).
                      var a = document.createElement("a");
                      a.href = base64data;
                      a.download = pdfFilename;
                      a.style.display = "none";
                      document.body.appendChild(a);
                      a.click();
                      // Small delay before removing the anchor to allow the Intent to fire
                      setTimeout(function () { document.body.removeChild(a); }, 2000);
                  };

                  reader.onerror = function () {
                      safeHideLoader();
                      alert("Could not prepare the PDF. Please try again.");
                  };

                  reader.readAsDataURL(blob);

              } else {
                  // Path 2 & 3 — standard browser (mobile or desktop)
                  var url = window.URL.createObjectURL(blob);
                  var isMobileBrowser = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

                  if (isMobileBrowser) {
                      // Path 2 — mobile browser: open PDF in a new tab
                      safeHideLoader();
                      var newTab = window.open(url, "_blank");

                      if (newTab) {
                          // Revoke after the new tab has had time to read the blob
                          setTimeout(function () {
                              window.URL.revokeObjectURL(url);
                              location.reload(); // reset quotation number for next use
                          }, 5000);
                      } else {
                          // Pop-up was blocked — show a tappable link as fallback
                          var link = document.createElement("a");
                          link.href = url;
                          link.target = "_blank";
                          link.rel = "noopener";
                          link.textContent = "Tap here to open your PDF";
                          link.style.cssText = [
                              "display:block",
                              "margin:20px auto",
                              "padding:14px 20px",
                              "font-size:16px",
                              "font-weight:600",
                              "color:#fff",
                              "background:#0d6efd",
                              "border-radius:8px",
                              "text-align:center",
                              "text-decoration:none",
                              "max-width:320px"
                          ].join(";");
                          document.body.insertBefore(link, document.body.firstChild);
                          // Revoke the blob URL only after a long delay so tapping still works
                          setTimeout(function () { window.URL.revokeObjectURL(url); }, 60000);
                      }

                  } else {
                      // Path 3 — desktop: trigger file download then reload
                      safeHideLoader();
                      var link = document.createElement("a");
                      link.href = url;
                      link.download = pdfFilename;
                      link.style.display = "none";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      setTimeout(function () {
                          window.URL.revokeObjectURL(url);
                          location.reload(); // reset quotation number for next use
                      }, 1500);
                  }
              }
          }

          $.ajax({
              type: "POST",
              url: "/NRS/quts",
              contentType: "application/json",
              data: JSON.stringify(formData),
              xhrFields: { responseType: "blob" },
              success: function(blob) {
                  // NOTE: hideLoader is called INSIDE handlePdfBlob at the right moment
                  // for each path (especially important for the async FileReader WebView path).
                  var pdfFilename = filename.endsWith(".pdf") ? filename : filename + ".pdf";
                  handlePdfBlob(blob, pdfFilename);
              },
              error: function(xhr, status, error) {
                  safeHideLoader();
                  var errorMessage = "Error generating PDF: " + (error || "Unknown error");
                  alert(errorMessage);
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