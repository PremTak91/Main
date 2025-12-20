package com.web.nrs.service;

import java.util.Map;
import java.util.Optional;

import com.web.nrs.entity.LoginEntity;
import com.web.nrs.pojo.UserInfo;

public interface UserService {

	Optional<LoginEntity> findByUsername(String username);
	public Map<String,Object> saveUser(UserInfo user);
}
