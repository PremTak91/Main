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

<body>

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
				
				<div class="card-header py-3">
                  
                                
                 <button type="button" class="btn btn-primary btn-lg" data-toggle="modal" data-target="#myModal"> Add Entry</button>
                 </div>
					<table id="blcTableId" class="table table-striped table-bordered" style="width:100%">
				     
				        <thead>
				     
				                       <tr>
                                            <th>No.</th>
                                            <th>Employee Name</th>
                                            <th>Phone No.</th>
											<th>position</th>
                                            <th>Date Of Joining</th>
											<th>Mainter</th>	
                                            <th>Employee Status</th>
                                            <th></th>
                                        </tr>
				     
				        </thead>
				     
				        <tbody>

								      <tr>
                                            <th>1</th>
                                            <th>Yuveraj</th>
                                            <th>7019374747</th>
                                            <th>Weldar</th>
                                            <th>10/10/2021</th>
                                            <th>Vikram</th>
                                            <th>Under Review</th>												
                                            <th></th>
                                        </tr>
					    </tbody>
      
    				</table>
    				
    				
    				
    				<!-- Modal content -start -->
					     <div class="modal fade" id="myModal" role="dialog">
							    <div class="modal-dialog">
							    
							      <!-- Modal content-->
							      <div class="modal-content">
							        <div class="modal-header">
							          <h4 class="modal-title">Add</h4>
							          <button type="button" class="close" data-dismiss="modal">&times;</button>
							          
							        </div>
							        <div class="modal-body">
							          
									<form>
										<div class = "row">
											 
											 <div class = "col-md-4">  
												  <div class="form-group">
												    <label for="paymentDesc">First Name</label>
												    <input type="email" class="form-control" id="paymentDesc" maxlength =64 >
												  </div>
											  </div>
											
											<div class = "col-md-4">  
												  <div class="form-group">
												    <label for="paymentDesc">Middle Name</label>
												    <input type="email" class="form-control" id="paymentDesc" maxlength =64 >
												  </div>
											  </div>
											  
											<div class = "col-md-4">  
												  <div class="form-group">
												    <label for="paymentDesc">Last Name</label>
												    <input type="email" class="form-control" id="paymentDesc" maxlength =64 >
												  </div>
											  </div>
										</div>
										
										<div class = "row">
											 
											 <div class = "col-md-8">  
												  <div class="form-group">
												    <label for="paymentDesc">Address</label>
												    <input type="email" class="form-control" id="paymentDesc" maxlength =64 >
												  </div>
											  </div>
											
											<div class = "col-md-4">  
												  <div class="form-group">
												    <label for="paymentDesc">Phone No.</label>
												    <input type="email" class="form-control" id="paymentDesc" maxlength =64 >
												  </div>
											  </div>
											  
									</div>
									<div class = "row">
											 
											 <div class = "col-md-6">  
												  <div class="form-group">
												    <label for="paymentDesc">City</label>
												    <input type="email" class="form-control" id="paymentDesc" maxlength =64 >
												  </div>
											  </div>
											
											<div class = "col-md-6">  
												  <div class="form-group">
												    <label for="paymentDesc">State</label>
												    <input type="email" class="form-control" id="paymentDesc" maxlength =64 >
												  </div>
											  </div>
											  
									</div>
									  <div class="row">	
										
									   <div class = "col-md-6">  
												  <div class="form-group">
												    <label for="paymentDesc">Email</label>
												    <input type="email" class="form-control" id="paymentDesc" maxlength =64 >
												  </div>
									   </div>
										<div class = "col-md-6">
											   <div class="form-group">
												    <label for="statusId">Position</label>
												    <select name="statusId" class="form-control" id="statusId">
													  <option value="">Select</option>
													  <option value="Pending">Site Engineer</option>
													  <option value="Processed">Weldar</option>
													</select>
												  </div>
									    </div>
									    
											 
									  </div>
									  <div class="row">
									  
									  <div class = "col-md-6">
											  <div class="form-group">
			        							<label for="advancedAmt">Date Of Joining</label>
			        								<input type="date" class="form-control" id="paymentDateId" name="paymentDateId">
			                                  </div>
									   </div>  
									    <div class = "col-md-6">
											   <div class="form-group">
												    <label for="statusId">Employee Status</label>
												    <select name="statusId" class="form-control" id="statusId">
													  <option value="">Select</option>
													  <option value="Pending">Under Review</option>
													  <option value="Processed">Confirmed</option>
													</select>
												  </div>
									    </div>
									</div>	
									

									<div class="row">
										<div class = "col-md-6">
												  <div class="form-group">
													    <label for="giventoId">Employee Mainter</label>
													    <select name="giventoId" class="form-control" id="giventoId">
														  <option value="">Select</option>
														  <option value="Pending">Yogesh Meena</option>
														  <option value="Processed">Vikram Kansara</option>
														</select>
												  </div>
										    </div>	
									    <div class = "col-md-6">
											   <div class="form-group">
												    <label for="statusId">Branch</label>
												    <select name="statusId" class="form-control" id="statusId">
													  <option value="">Select</option>
													  <option value="Pending">Ahmedabad</option>
													  <option value="Processed">Sirohi</option>
													</select>
												  </div>
									    </div>
									</div>	  
						<button type="submit" class="btn btn-primary">Submit</button>
						</form>
							         			
							        </div>
							        <div class="modal-footer">
							          <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
							        </div>
							      </div>
							      
							    </div>
							  </div>
  

    				<!-- Modal content -end -->
    				
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
                        <span aria-hidden="true">×</span>
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