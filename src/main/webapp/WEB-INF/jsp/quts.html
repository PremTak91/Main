
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NRS - Solar Quatation</title>
    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
    <!-- Bootstrap JS -->
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.bundle.min.js"></script>
</head>
<body>
<div class="container mt-5">
    <h2 class="text-center">Solar Quatation</h2></br></br>
    <form>
        <div class="row">
            <div class="col-md-4 form-group">
                <label for="kw">Kw:</label>
                <input type="text" class="form-control" id="kw" placeholder="Enter Kw"  onkeyup="CalculateActualPrice()" required>
            </div>
            <div class="col-md-4 form-group">
                <label for="solarType">Solar Type:</label>
                <input type="text" class="form-control" id="solarType" placeholder="Enter Solar Type" value="Residential" required>
            </div>
            <div class="col-md-4 form-group">
                <label for="panelsName">Panels Name:</label>
                <input type="text" class="form-control" id="panelsName" placeholder="Enter Panels Name" value="ADANI TOPCON, ADANI BIFACIAL , RAYZON" required>
            </div>
        </div>
        <div class="row">
            <div class="col-md-4 form-group">
                <label for="rateKw">Rate/Kw (Including GST):</label>
                <input type="number" class="form-control" id="rateKw" onkeyup="CalculateActualPrice()" placeholder="Enter Rate/Kw" required>
            </div>
            <div class="col-md-4 form-group">
                <label for="value">Value:</label>
                <input type="text" class="form-control" id="value" placeholder="Enter Value"  onkeyup="CalculateActualPrice()" required>
            </div>
            <div class="col-md-4 form-group">
                <label for="discomMeter">Discom Meter:</label>
                <input type="number" class="form-control" id="discomMeter" placeholder="Enter Discom Meter"  onkeyup="CalculateActualPrice()" value="0" required>
            </div>
        </div>
        <div class="row">
            <div class="col-md-4 form-group">
                <label for="pqHs">P.Q. and H.S. cost:</label>
                <input type="number" class="form-control" id="pqHsCost" placeholder="Enter P.Q. and H.S."  onkeyup="CalculateActualPrice()" value="0" required>
            </div>
            <div class="col-md-4 form-group">
                <label for="actualPrice">Actual Price:</label>
                <input type="text" class="form-control" id="actualPrice" placeholder="Enter Actual Price"  onkeyup="CalculateActualPrice()" required>
            </div>
            <div class="col-md-4 form-group">
                <label for="subsidy">Subsidy:</label>
                <input type="number" class="form-control" id="subsidy" placeholder="Enter Subsidy"  onkeyup="CalculateActualPrice()" value="78000" required>
            </div>
        </div>
        <div class="row">
            <div class="col-md-4 form-group">
                <label for="effectivePrice">Effective Price:</label>
                <input type="number" class="form-control" id="effectivePrice" placeholder="Enter Effective Price"  onkeyup="CalculateActualPrice()" required>
            </div>
            <div class="col-md-4 form-group">
                <label for="submittedBy">Submitted By:</label>
                <input type="text" class="form-control" id="submittedBy" placeholder="Enter Submitted By" value="Amit Vyas" required>
            </div>
            <div class="col-md-4 form-group">
                <label for="submittedNumber">Submitted Number:</label>
                <input type="text" class="form-control" id="submittedNumber" placeholder="Enter Submitted Number" value="+91-8866389038" required>
            </div>
        </div>
        <button type="submit" class="btn btn-primary">Export</button>
    </form>
</div>
</body>
<script>


	function CalculateActualPrice() {
		debugger;
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


		 // Method for Quation Generate
		 
		 $(document).ready(function() {
			$("form").on("submit", function(event) {
			    event.preventDefault();

			    const formData = {
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
			        submittedNumber: $("#submittedNumber").val()
			    };

			    $.ajax({
			        type: "POST",
			        url: "/NRS/quts",
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
			            alert("Error downloading PDF: " + error);
			        }
			    });
			});		 });

		 
</script>
</html>
