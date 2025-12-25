package com.web.nrs.service.impl;

import com.web.nrs.entity.LoginEntity;
import com.web.nrs.repository.LoginRepository;
import com.web.nrs.service.LoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class LoginServiceImpl implements LoginService {
    @Autowired
    LoginRepository loginRepository;


    @Override
    public Optional<LoginEntity> findByUsername(String username) {
        return loginRepository.findByUsername(username);
    }


}
