<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="">
    <meta name="author" content="">

    <title>NRS SOLAR SOLUTION</title>

    <jsp:include page="uppercommon.jsp"/>

    <!-- Custom styles for this page -->
    <link href="vendor/jquery/jquery.min.js" rel="stylesheet">
    <link href="vendor/bootstrap/js/bootstrap.min.js" rel="stylesheet">
    

</head>

<body id="page-top">

    <!-- Page Wrapper -->
    <div id="wrapper">

		<jsp:include page="sideBar.jsp"/>

        <!-- Content Wrapper -->
        <div id="content-wrapper" class="d-flex flex-column">

            <!-- Main Content -->
            <div id="content">

				<jsp:include page="header.jsp"/>


                <!-- Begin Page Content -->
                <div class="container-fluid">
				
				   <div class="modal-body">
							          
									<form>

									
									<div class="row">
									    <div class = "col-md-6">
											   <div class="form-group">
												    <label for="statusId">Leave Type</label>
												    <select name="statusId" class="form-control" id="statusId">
													  <option value="">Select</option>
													  <option value="Pending">Test1</option>
													  <option value="Processed">Test2</option>
													</select>
												  </div>
									    </div>
									    
									    <div class = "col-md-6">
											    <label for="statusId">Leave Left : 7</label>
												    
									    </div>
									</div>
									
									<div class="row">	

											<div class = "col-md-6">
											  <div class="form-group">
			        							<label for="advancedAmt">From Date</label>
			        								<input type="date" class="form-control" id="paymentDateId" name="paymentDateId">
			                                  </div>
											</div>
										      
									  </div>

									<div class="row">	
										
											<div class = "col-md-6">
											  <div class="form-group">
			        							<label for="advancedAmt">To Date</label>
			        								<input type="date" class="form-control" id="paymentDateId" name="paymentDateId">
			                                  </div>
											</div>  
										    
										      
									  </div>											 
									<div class="row">
										<div class = "col-md-6">  
													  <div class="form-group">
													    <label for="paymentDesc">Leave Reason</label>
													    <input type="email" class="form-control" id="paymentDesc" maxlength =64 >
													    <small id="Description" class="form-text text-muted">Leave Description help to know about your leave</small>
													  </div>
										 </div>
										 
										 <div class = "col-md-6"> 

														<br>						
													    <label id="Description" class=" mt-5 form-text text-muted">Leave Approver :  Vijay Kumawat</label>
													  </div>
										 </div>
												 
										  
						<button type="submit" class="btn btn-primary">Apply Leave</button>
						</form>
							         			
							        </div>

    				
                </div>
                <!-- /.container-fluid -->

            </div>
            <!-- End of Main Content -->

            <!-- Footer -->
             <jsp:include page="footer.jsp"/>
            <!-- End of Footer -->

        </div>
        <!-- End of Content Wrapper -->

    </div>
    <!-- End of Page Wrapper -->

    <!-- Scroll to Top Button-->
    <a class="scroll-to-top rounded" href="#page-top">
        <i class="fas fa-angle-up"></i>
    </a>

    <!-- Logout Modal-->
    <div class="modal fade" id="logoutModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel"
        aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLabel">Ready to Leave?</h5>
                    <button class="close" type="button" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">�</span>
                    </button>
                </div>
                <div class="modal-body">Select "Logout" below if you are ready to end your current session.</div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" type="button" data-dismiss="modal">Cancel</button>
                    <a class="btn btn-primary" href="login.html">Logout</a>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap core JavaScript-->
    <script src="vendor/jquery/jquery.min.js"></script>
    <script src="vendor/bootstrap/js/bootstrap.bundle.min.js"></script>

    <!-- Core plugin JavaScript-->
    <script src="vendor/jquery-easing/jquery.easing.min.js"></script>

    <!-- Custom scripts for all pages-->
    <script src="js/nrs-admin-2.min.js"></script>

    <!-- Page level plugins -->
    <script src="vendor/datatables/jquery.dataTables.min.js"></script>
    <script src="vendor/datatables/dataTables.bootstrap4.min.js"></script>
	<script src="js/custom.js/balancesheet.js"></script>




</body>

</html>