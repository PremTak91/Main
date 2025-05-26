package com.web.nrs.util;

import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

public class AddInDataTable  {
	
	/*public JSONObject generateJsonArray(List<?> list,JSONObject result) {

		try {
			result = new JSONObject();
			JSONArray array = new JSONArray();

			JSONObject obj = null;

			for (int i = 0; i < list.size(); i++) {
				String activeStr = "";
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
*/
}
