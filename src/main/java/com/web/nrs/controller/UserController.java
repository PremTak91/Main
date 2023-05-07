package com.web.nrs.controller;

import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;


@Controller
public class UserController {

	
	@RequestMapping("/addEmp")
	public String addEmployee() {
		return "addEmployee";
	}
	
	 @RequestMapping(value = "/saveUser", method = RequestMethod.POST, consumes = MediaType.APPLICATION_JSON_VALUE)
	public @ResponseBody Map<String,Object> saveUser() {
		
		 return null;
		
	}
}
