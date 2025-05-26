package com.web.nrs.service.impl;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.web.nrs.pojo.UserInfo;
import com.web.nrs.repo.dao.UserRepository;
import com.web.nrs.service.UserService;

@Service("UserService")
public class UserServiceImpl implements UserService {

	
	@Autowired
	UserRepository userRepo;
		@Override
		public Map<String, Object> saveUser(UserInfo user) {
			
			return userRepo.saveUser(user);
		}
		
	
}
