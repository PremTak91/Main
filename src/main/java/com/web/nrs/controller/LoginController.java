package com.web.nrs.controller;

import com.web.nrs.model.LoginRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class LoginController {

    @GetMapping("/login")
    public String loginPage() {

        return "login";

    }

    @PostMapping("/login/auth")
    public @ResponseBody String loginAuthentication(@RequestBody LoginRequest loginRequest) {
        System.out.println("User Name: " + loginRequest.getUserName());
        return "login";

    }

}
