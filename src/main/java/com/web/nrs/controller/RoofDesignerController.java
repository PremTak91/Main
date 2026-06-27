package com.web.nrs.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/roof-designer")
public class RoofDesignerController {

    @GetMapping
    public String showRoofDesigner() {
        return "roof-designer";
    }
}
