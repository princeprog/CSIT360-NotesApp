package com.notesapp.nabunturan;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NabunturanApplication {

	public static void main(String[] args) {
		SpringApplication.run(NabunturanApplication.class, args);
	}

}
