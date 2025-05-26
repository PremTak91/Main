package com.web.nrs.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class TempController {

	
	@RequestMapping("/exps")
	public String ExpsHome() {
		
		return "expenses";
		
	}
	
	@RequestMapping("/leaveForm")
	public String leaveForm() {
		
		return "leaveForm";
		
	}
	
	@RequestMapping("/leavebal")
	public String leaveBal() {
		
		return "leaveBalanceAndStatus";
		
	}
	
	@RequestMapping("/leaverole")
	public String leaveRole() {
		
		return "leaveRole";
		
	}
	
	
	@RequestMapping("/companyDoc")
	public String uploadDocument() {
		
		return "companyDoc";
		
	}
	
	@RequestMapping("/profileUpdate")
	public String profileUpdate() {
		
		return "profileUpdate";
		
	}

}
