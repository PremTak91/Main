package com.web.nrs.controller;


import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class BalansheetController {

	@RequestMapping("/blc")
	public String loginHome() {
		
		return "balancesheet";
		
	}
	
}
