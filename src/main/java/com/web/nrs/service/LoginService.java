package com.web.nrs.service;

import com.web.nrs.entity.LoginEntity;

import java.util.Optional;

public interface LoginService {

    Optional<LoginEntity> findByUsername(String username);

}
