package com.web.nrs;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.util.TimeZone;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
public class NrsprojectApplication {

	public static void main(String[] args) {
		// Force JVM timezone to IST (India Standard Time = UTC+5:30)
		// This ensures all LocalDateTime.now() calls return correct India time
		// regardless of the server OS / Docker container timezone (which defaults to UTC)
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
		SpringApplication.run(NrsprojectApplication.class, args);
	}

}
