package com.web.nrs.service.impl;

import com.web.nrs.entity.LoginEntity;
import com.web.nrs.repository.LoginRepository;
import com.web.nrs.service.LoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.web.nrs.entity.PasswordResetTokenEntity;
import com.web.nrs.repository.PasswordResetTokenRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class LoginServiceImpl implements LoginService {
    @Autowired
    LoginRepository loginRepository;

    @Autowired
    PasswordResetTokenRepository tokenRepository;

    @Autowired
    @org.springframework.context.annotation.Lazy
    PasswordEncoder passwordEncoder;

    @Override
    public Optional<LoginEntity> findByUsername(String username) {
        return loginRepository.findByUsername(username);
    }

    @Override
    @Transactional
    public String generatePasswordResetToken(String username) {
        Optional<LoginEntity> userOptional = loginRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            LoginEntity user = userOptional.get();
            // Delete existing tokens for this user
            tokenRepository.deleteByUser(user);
            
            String token = UUID.randomUUID().toString();
            PasswordResetTokenEntity tokenEntity = new PasswordResetTokenEntity(token, user);
            tokenRepository.save(tokenEntity);
            return token;
        }
        return null;
    }

    @Override
    public boolean validatePasswordResetToken(String token) {
        Optional<PasswordResetTokenEntity> tokenOpt = tokenRepository.findByToken(token);
        return tokenOpt.isPresent() && !tokenOpt.get().isExpired();
    }

    @Override
    @Transactional
    public void updatePassword(String token, String newPassword) {
        Optional<PasswordResetTokenEntity> tokenOpt = tokenRepository.findByToken(token);
        if (tokenOpt.isPresent() && !tokenOpt.get().isExpired()) {
            LoginEntity user = tokenOpt.get().getUser();
            user.setPassword(passwordEncoder.encode(newPassword));
            loginRepository.save(user);
            tokenRepository.deleteByUser(user);
        } else {
            throw new RuntimeException("Invalid or expired token");
        }
    }
}
