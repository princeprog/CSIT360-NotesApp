package com.notesapp.nabunturan.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Configuration class to enable Spring Task Scheduling and Async execution
 */
@Configuration
@EnableScheduling
@EnableAsync
public class SchedulingConfig {
    // Spring will use the configuration from application.properties
    // for task scheduling and execution pools
}
