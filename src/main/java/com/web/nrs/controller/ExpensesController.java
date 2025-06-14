package com.web.nrs.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ExpensesController {

	@GetMapping("/expenses")
	public String addEmployee() {
		return "expenses";
	}
}
