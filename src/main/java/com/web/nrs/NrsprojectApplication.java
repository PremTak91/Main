package com.web.nrs;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
public class NrsprojectApplication {

	public static void main(String[] args) {
		SpringApplication.run(NrsprojectApplication.class, args);
	}

}
