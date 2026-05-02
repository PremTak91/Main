package com.web.nrs.service;

public interface EmailService {
    void sendPasswordResetEmail(String toEmail, String resetLink);
}
