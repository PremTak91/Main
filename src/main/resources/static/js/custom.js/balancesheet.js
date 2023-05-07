$(document).ready(
		  function(){
		
});

$('#blcTableId')
.DataTable(
		{
			'destroy' : true,
			'bProcessing' : true,
			'bServerSide' : true,
			'sort' : 'position',
			'bStateSave' : false,
			'iDisplayStart' : 0,
			'fnDrawCallback' : function() {
			},
			"sAjaxSource" : "/NRS/searchblcDetailsByAjax",
			"fnServerData" : function(sSource, aoData, fnCallback,
					oSettings) {
				oSettings.jqXHR = $.ajax({
					"dataType" : 'json',

					"type" : "POST",
					"url" : sSource,
					"data" : aoData,
					/*headers : {
						'Authorization' : "Authorisation",
						'Token' : "token " + jwttoken + "",
					},*/
					"success" : function(json) {
						fnCallback(json);
					}
				});

			},
			'aoColumns' : [ {
				'data' : 'id',
				'defaultContent' : ""
			}, {
				'data' : 'payment_desc',
				'defaultContent' : ""
			}, {
				'data' : 'total_amt',
				'defaultContent' : ""
			},{
				'data' : 'advance_amt',
				'defaultContent' : ""
			},{
				'data' : 'due_amt',
				'defaultContent' : ""
			}
			, 
			{
				'data' : 'entrydate',
				'defaultContent' : ""
			},
			{
				'data' : 'status',
				'defaultContent' : ""
			},
			{
				'data' : 'action',
				'defaultContent' : ""
			} ],
			columnDefs : [ {
				'targets' : [ -1 ],
				'orderable' : false
			}, {
				'className' : 'text-right',
				'targets' : [ 1, 2 ]
			} ]
		});
$('input[type=search]').attr('onkeydown', 'disabledkey(event)').attr(
'maxlength', '64');





function saveBalanceSheet(){
	
	var blcbean = {};
	
	var status=$("#status").val();
	var given_to=$("#given_to").val();
	var branch=$("#branch").val();
	
	$('#blcsheetId').find('input').each(function() {
		blcbean[$(this).attr('id')] = $(this).val();
	});
	
	blcbean['status'] =status;
	blcbean['given_to'] =given_to;
	blcbean['branch'] =branch;
	
	ajaxFunc('POST',"/NRS/saveblc",blcbean,function(resp){
		
		if ((resp['error'] != null || resp['error'] != undefined) & resp['error'] == 'N') {
			
			toastr.success("SuccessFully Saved....");
			$("#myModal").hide();
		} 
		
		else {
			
			toastr.error(resp['error']);
		} 
		
	});
	
}