package com.web.nrs.service;

import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Pageable;

import com.web.nrs.pojo.BalanceSheet;

public interface BalanceSheetService {
	
	public Map<String,Object> saveBalanceDetails(BalanceSheet blc);
	public int countBalanceSheetData();
	public List<?> getBalanceSheetData(Pageable pageable,String sSearch);

}
