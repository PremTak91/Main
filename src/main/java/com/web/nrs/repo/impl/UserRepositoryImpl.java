package com.web.nrs.repo.impl;

import java.util.HashMap;
import java.util.Map;

import javax.persistence.EntityManagerFactory;

import org.hibernate.Session;
import org.hibernate.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.web.nrs.pojo.UserInfo;
import com.web.nrs.repo.dao.UserRepository;
import com.web.nrs.util.TextEncryptDecrypt;

@Repository("UserRepository")
public class UserRepositoryImpl implements UserRepository{

	@Autowired
	EntityManagerFactory emf;
	@Autowired 
	private TextEncryptDecrypt encryotDecrypt;
	
	private final Logger logger = LoggerFactory.getLogger(this.getClass());
	@Override
	public Map<String, Object> saveUser(UserInfo user) {
		
		Map<String, Object> map = new HashMap<>();
		
		Session session = emf.createEntityManager().unwrap(Session.class);
		Transaction transaction = session.beginTransaction();
		try {
			
			user.setPassword(encryotDecrypt.encrypt(user.getPassword()));
			session.save(user);
			session.flush();
			transaction.commit();
			map.put("error","N");
		} catch (Exception e) {
			transaction.rollback();
			map.put("error", "Please Contact Administrator" + e.getMessage());
			logger.error("Error in save ",e);
		}
		return map;
	}

}
