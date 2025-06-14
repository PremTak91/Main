package com.web.nrs.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LeaveController {

	@GetMapping("/leaveBalance")
	public String homePage() {
		return "leaveBalanceAndStatus";
	}
}
