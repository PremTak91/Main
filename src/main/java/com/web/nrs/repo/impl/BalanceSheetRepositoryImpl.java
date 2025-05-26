package com.web.nrs.repo.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceContext;

import org.hibernate.Session;
import org.hibernate.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import com.web.nrs.pojo.BalanceSheet;
import com.web.nrs.repo.dao.BalanceSheetRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import javax.persistence.Query;
import org.springframework.data.repository.query.Param;


@Repository("BalanceSheetRepository")
public class BalanceSheetRepositoryImpl implements  BalanceSheetRepository {

	@Autowired
	EntityManagerFactory emf;
	@Autowired
	@PersistenceContext
	private EntityManager entityManager;
	Query q;
	
	private final Logger logger = LoggerFactory.getLogger(this.getClass());
	
	@Override
	public Map<String, Object> saveBalanceDetails(BalanceSheet blc) {

		Map<String, Object> map = new HashMap<>();
		
		Session session = emf.createEntityManager().unwrap(Session.class);
		Transaction transaction = session.beginTransaction();
		try {
			
			if(blc.getId()>0) {
				
				session.save(blc);
			}
			else {
				session.save(blc);	
			}

			
			session.flush();
			transaction.commit();
			map.put("error","N");
		} catch (Exception e) {
			transaction.rollback();
			map.put("error", "Please Contact Administrator. There was error while saving balancesheet record");
			logger.error("Error in save ",e);
		}
		return map;
	}

	@Override
	public int countBalanceSheetData() {
		
		return 0;
	}

	@Override
	public List<?> getBalanceSheetData(Pageable pageable, String sSearch) {
		
		
		String strQuery  = "select id, payment_desc, total_amt, advance_amt, entrydate, status, given_to, branch, audit_userid, audittimestamp"
				+ "from blcsheet"
				+ "where "
				+ "AND (LOWER(cityname)  like LOWER('%' :sSearch  '%') "
				+ "AND (LOWER(cityname)  like LOWER('%' :sSearch  '%') "
				+ "AND (LOWER(cityname)  like LOWER('%' :sSearch  '%') "
				+ "AND (LOWER(cityname)  like LOWER('%' :sSearch  '%')  "
				+ "limit "+pageable;
		try {
		
			q = entityManager.createNativeQuery(strQuery);
			
			return  q.getResultList();
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		return new ArrayList<>();
	}

}
