package com.web.nrs.service.impl;

import com.web.nrs.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Password Reset Request - NRS Solar Solution");

            String htmlContent = "<div style='font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;'>" +
                    "<div style='text-align: center; margin-bottom: 20px;'>" +
                    "   <h2>NRS Solar Solution</h2>" +
                    "</div>" +
                    "<h3>Hello,</h3>" +
                    "<p>We received a request to reset your password. Click the button below to choose a new one:</p>" +
                    "<div style='text-align: center; margin: 30px 0;'>" +
                    "   <a href='" + resetLink + "' style='background-color: #6a1b9a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Reset Password</a>" +
                    "</div>" +
                    "<p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>" +
                    "<p>Thanks,<br>The NRS Solar Solution Team</p>" +
                    "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);

        } catch (MessagingException e) {
            log.error("Failed to send password reset email to {}", toEmail, e);
            throw new RuntimeException("Failed to send email");
        }
    }
}
