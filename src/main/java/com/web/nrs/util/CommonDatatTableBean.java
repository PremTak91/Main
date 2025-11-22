package com.web.nrs.util;

import java.util.List;


import jakarta.servlet.http.HttpServletRequest;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Component;

@Component
public class CommonDatatTableBean{

	HttpServletRequest request;
	public static JSONObject result;
	public static JSONArray array;
	public static String strQuery;
	public static String fromBlock;
	public static String whereClause;
	public static String countQuery;
	public static List<?> tableData;
	public static String pageLength;
	
//DataTable ajax request Handling Parameter
	public static String iDisplayStart;		//sStart
	public static String iDisplayLength;		//sAmount
	public static String sEcho;
	public static String iSortCol_0;		//sCol sort column no
	public static String sSortDir_0;		//sdir ordering asending 
	public static String sSearch;
	public String[] cols;
	public static String dir = "asc";

	// Calcute   records   &  Pages  & search etc ... 
		public static int totalAfterFilter =0;
		public static long totalrecords =0;
		public static int amount = 10;			// Default  Display Records
		public static int start;
		public static int echo;	
		public static int col  ;
		

		public void calculateDataTableVar()  // like paging , No of rec. ,
		{
			try 
			{
				if (iDisplayStart != null) 
				{
					start = Integer.parseInt(iDisplayStart);
					if (start < 0)
						start = 0;
				}
				if (iDisplayLength != null) 
				{
					amount = Integer.parseInt(iDisplayLength);
					if (amount < 10 || amount > 100)
						amount = 10;
				}
				if (sEcho != null) 
				{
					echo = Integer.parseInt(sEcho);
				}
				if (iSortCol_0 != null) 
				{
					col = Integer.parseInt(iSortCol_0);
					if (col < 0 || col > cols.length) // no of column in dataTable
						col = 0;
				}
				if (sSortDir_0 != null) 
				{
					if (!sSortDir_0.equals("asc"))
						dir = "desc";
				}
			}
			catch (Exception ex) 
			{
				ex.printStackTrace();
			}
		}
		
		
		
		//setter and getter
		public static JSONObject getResult() {
			return result;
		}
		public static void setResult(JSONObject result) {
			CommonDatatTableBean.result = result;
		}
		public static JSONArray getArray() {
			return array;
		}
		public static void setArray(JSONArray array) {
			CommonDatatTableBean.array = array;
		}
		public static String getStrQuery() {
			return strQuery;
		}
		public static void setStrQuery(String strQuery) {
			CommonDatatTableBean.strQuery = strQuery;
		}
		public static String getFromBlock() {
			return fromBlock;
		}
		public static void setFromBlock(String fromBlock) {
			CommonDatatTableBean.fromBlock = fromBlock;
		}
		public static String getWhereClause() {
			return whereClause;
		}
		public static void setWhereClause(String whereClause) {
			CommonDatatTableBean.whereClause = whereClause;
		}
		public static String getCountQuery() {
			return countQuery;
		}
		public static void setCountQuery(String countQuery) {
			CommonDatatTableBean.countQuery = countQuery;
		}
		public static List<?> getTableData() {
			return tableData;
		}
		public static void setTableData(List<?> tableData) {
			CommonDatatTableBean.tableData = tableData;
		}
		public static String getPageLength() {
			return pageLength;
		}
		public static void setPageLength(String pageLength) {
			CommonDatatTableBean.pageLength = pageLength;
		}
		public static String getiDisplayStart() {
			return iDisplayStart;
		}
		public static void setiDisplayStart(String iDisplayStart) {
			CommonDatatTableBean.iDisplayStart = iDisplayStart;
		}
		public static String getiDisplayLength() {
			return iDisplayLength;
		}
		public static void setiDisplayLength(String iDisplayLength) {
			CommonDatatTableBean.iDisplayLength = iDisplayLength;
		}
		public static String getsEcho() {
			return sEcho;
		}
		public static void setsEcho(String sEcho) {
			CommonDatatTableBean.sEcho = sEcho;
		}
		public static String getiSortCol_0() {
			return iSortCol_0;
		}
		public static void setiSortCol_0(String iSortCol_0) {
			CommonDatatTableBean.iSortCol_0 = iSortCol_0;
		}
		public static String getsSortDir_0() {
			return sSortDir_0;
		}
		public static void setsSortDir_0(String sSortDir_0) {
			CommonDatatTableBean.sSortDir_0 = sSortDir_0;
		}
		public static String getsSearch() {
			return sSearch;
		}
		public static void setsSearch(String sSearch) {
			CommonDatatTableBean.sSearch = sSearch;
		}
		public static String getDir() {
			return dir;
		}
		public static void setDir(String dir) {
			CommonDatatTableBean.dir = dir;
		}
		public static int getTotalAfterFilter() {
			return totalAfterFilter;
		}
		public static void setTotalAfterFilter(int totalAfterFilter) {
			CommonDatatTableBean.totalAfterFilter = totalAfterFilter;
		}
		public static int getAmount() {
			return amount;
		}
		public static long getTotalrecords() {
			return totalrecords;
		}
		public static void setTotalrecords(long totalrecords) {
			CommonDatatTableBean.totalrecords = totalrecords;
		}
		public static void setAmount(int amount) {
			CommonDatatTableBean.amount = amount;
		}
		public static int getStart() {
			return start;
		}
		public static void setStart(int start) {
			CommonDatatTableBean.start = start;
		}
		public static int getEcho() {
			return echo;
		}
		public static void setEcho(int echo) {
			CommonDatatTableBean.echo = echo;
		}
		public static int getCol() {
			return col;
		}
		public static void setCol(int col) {
			CommonDatatTableBean.col = col;
		}



		public String[] getCols() {
			return cols;
		}



		public void setCols(String[] cols) {
			this.cols = cols;
		}
		
		
		
		public static String setIfNull(Object obj, String nullValue) {
			if (!(null != nullValue && nullValue.trim().length() > 0))
				nullValue = "";
			if (null == obj)
				return nullValue;
			else
				return obj.toString();
		}
		


}
