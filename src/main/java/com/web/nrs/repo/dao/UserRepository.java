package com.web.nrs.repo.dao;

import java.util.Map;

import com.web.nrs.pojo.UserInfo;

public interface UserRepository {

	public Map<String,Object> saveUser(UserInfo user);
}
