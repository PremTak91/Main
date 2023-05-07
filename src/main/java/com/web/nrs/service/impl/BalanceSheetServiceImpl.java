package com.web.nrs.service.impl;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.web.nrs.pojo.BalanceSheet;
import com.web.nrs.repo.dao.BalanceSheetRepository;
import com.web.nrs.service.BalanceSheetService;

@Service("BalanceSheetService")
public class BalanceSheetServiceImpl implements BalanceSheetService{

	@Autowired
	BalanceSheetRepository blcRepo;
	
	@Override
	public Map<String, Object> saveBalanceDetails(BalanceSheet blc) {
		
		return blcRepo.saveBalanceDetails(blc);
	}

	@Override
	public int countBalanceSheetData() {
		// TODO Auto-generated method stub
		return 0;
	}

	@Override
	public List<?> getBalanceSheetData(Pageable pageable, String sSearch) {

		return 	blcRepo.getBalanceSheetData(pageable, sSearch);
	}

}
