package com.web.nrs.service.impl;

import java.util.Map;
import java.util.Optional;

import com.web.nrs.entity.LoginEntity;
import com.web.nrs.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.web.nrs.pojo.UserInfo;
import com.web.nrs.repo.dao.UserRepositoryTemp;
import com.web.nrs.service.UserService;

@Service("UserService")
public class UserServiceImpl implements UserService {

	
	@Autowired
	UserRepositoryTemp userRepo;

	@Autowired
	UserRepository userRepository;


	@Override
	public Optional<LoginEntity> findByUsername(String username) {
		return userRepository.findByUsername(username);
	}

	@Override
		public Map<String, Object> saveUser(UserInfo user) {
			
			return userRepo.saveUser(user);
		}
		
	
}
