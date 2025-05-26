package com.web.nrs.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class LoginController {

	
	
	@RequestMapping("/login")
	public String loginHome() {
		
		return "login";
		
	}
	
	@RequestMapping("/home")
	public String homePage() {
		
		return "home";
		
	}
	
	
	@RequestMapping("/temp")
	public String tempPage() {
		
		return "temp";
		
	}
}
