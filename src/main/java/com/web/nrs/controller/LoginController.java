package com.web.nrs.controller;

import com.web.nrs.entity.LoginEntity;
import com.web.nrs.model.LoginRequest;
import com.web.nrs.security.JwtUtil;
import com.web.nrs.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Controller
public class LoginController {

    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService;

    @GetMapping("/login")
    public String loginPage() {

        return "login";

    }

    @PostMapping("/login/auth")
    public @ResponseBody ResponseEntity loginAuthentication(@RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );
        Optional<LoginEntity> user = userService.findByUsername(loginRequest.getUsername());


        String token = jwtUtil.generateToken(loginRequest.getUsername(), user.get().getUserRoles());
        if (token != null) {
            // Set token as HttpOnly cookie
            Cookie cookie = new Cookie("jwtToken", token);
            cookie.setHttpOnly(true);
            cookie.setSecure(true); // true if using HTTPS
            cookie.setPath("/");    // accessible to entire app
            cookie.setMaxAge(24 * 60 * 60); // 1 day
            response.addCookie(cookie);
            return ResponseEntity.ok("Login successful");
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }

    }

}
