package com.web.nrs.service;

import java.util.Map;

import com.web.nrs.pojo.UserInfo;

public interface UserService {

	public Map<String,Object> saveUser(UserInfo user);
}
