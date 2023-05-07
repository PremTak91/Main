package com.web.nrs.repo.dao;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;

import com.web.nrs.pojo.BalanceSheet;

public interface BalanceSheetRepository {

	public Map<String,Object> saveBalanceDetails(BalanceSheet blc);
	public int countBalanceSheetData();
	
	@Query(value = "SELECT c.cityid,c.cityname,c.stdcode,c.pincode,c.countryid,c.stateid,c.active "
			+ " FROM citymaster AS c "
			+ " WHERE c.active=1 "
			+ " AND (LOWER(cityname)  like LOWER('%' :sSearch  '%') "
			+ " OR LOWER(stdcode)  like LOWER('%' :sSearch '%') "
			+ " OR LOWER(pincode)  like LOWER('%' :sSearch '%'))", nativeQuery = true)
	public List<?> getBalanceSheetData(Pageable pageable,String sSearch);
}
