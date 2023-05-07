package com.web.nrs.controller;


import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.json.JSONArray;
import org.json.JSONObject;
import com.web.nrs.pojo.BalanceSheet;
import com.web.nrs.service.BalanceSheetService;
import com.web.nrs.util.CommonDatatTableBean;

import org.springframework.ui.Model;

@Controller
public class BalansheetController extends CommonDatatTableBean {

	@Autowired
	BalanceSheetService blcService;
	
	@RequestMapping("/blc")
	public String loginHome() {
		
		return "balancesheet";
		
	}
	
	public static String[] cols = { "id", "payment_desc", "total_amt", "advance_amt", "due_amt", "entrydate", "status"};


	@RequestMapping(value = "/searchblcDetailsByAjax")
	public String searchCitymasterByAjax(Model model, Pageable pageable, HttpServletRequest request) {

		iDisplayLength = request.getParameter("iDisplayLength");
		iDisplayStart = request.getParameter("iDisplayStart");
		String sortcolumn = request.getParameter("iSortCol_0");
		String Direction1 = request.getParameter("sSortDir_0");
		String sSearch = request.getParameter("sSearch");
		
		
		if(null==sSearch.trim() &&  sSearch.trim().length()==0){
			sSearch="";
		}
		int page = Integer.parseInt(iDisplayStart) / Integer.parseInt(iDisplayLength);
		totalrecords = blcService.countBalanceSheetData();
		JSONObject returndata = new JSONObject();
		calculateDataTableVar();

		Direction dir = null;

		if (Direction1.equals("asc")) {
			dir = Direction.ASC;
		} else {
			dir = Direction.DESC;
		}
		
		returndata = generateJsonArray(blcService.getBalanceSheetData( PageRequest.of(page,  Integer.parseInt(iDisplayLength), dir, cols[Integer.parseInt(sortcolumn)]),sSearch.trim()));
		return returndata.toString();

	}
	
	
	
	public JSONObject generateJsonArray(List<?> list) {

		try {
			result = new JSONObject();
			array = new JSONArray();

			JSONObject obj = null;

			for (int i = 0; i < list.size(); i++) {
				Object[] data = (Object[]) list.get(i);
				obj = new JSONObject();
				obj.put("cityname", data[1]);
				obj.put("stdcode", setIfNull(data[2], ""));
				obj.put("pincode", setIfNull(data[3], ""));
				 
				strQuery = "<a class=\"mr-1 text-success\" href=\"#\" onclick=\"editData('" + data[0] + "','" + data[1] + "','"+ setIfNull(data[2], "")+"','"+ setIfNull(data[3], "")+"'"
						+ ",'"+data[4]+"','"+data[5]+"')\"><i  class=\"fa fa-edit\"></i></a>"
						+ "<a class=\"text-danger mr-1\"  href=\"#\" onclick=\"deleteData('" + data[0] + "')\"><i class=\"fa fa-trash\"></i>";
				obj.put("action", strQuery);
				array.put(obj);
				obj = null;
				totalAfterFilter = i;
			}

			result.put("iTotalRecords", totalrecords);
			result.put("iTotalDisplayRecords", totalrecords);
			result.put("iDisplayLength", iDisplayLength);
			result.put("aaData", array);
			return result;
		} catch (Exception e) {
			e.printStackTrace();
		}
		return null;
	}
	
	
	@RequestMapping(value = "/saveblc", method = RequestMethod.POST, consumes = MediaType.APPLICATION_JSON_VALUE)
	public @ResponseBody Map<String,Object> saveUser(@RequestBody BalanceSheet blcbean) {
			
			 return blcService.saveBalanceDetails(blcbean);
			
    }
		
	
}
