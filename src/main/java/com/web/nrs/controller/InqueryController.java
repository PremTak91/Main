package com.web.nrs.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class InqueryController {

	@GetMapping("/inquery")
	public String homePage() {
		return "inqueryEntry";
	}
}
