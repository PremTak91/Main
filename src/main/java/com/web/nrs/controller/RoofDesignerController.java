package com.web.nrs.controller;

import com.web.nrs.DTO.RoofDesignDto;
import com.web.nrs.utils.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/roof-designer")
public class RoofDesignerController {

    @GetMapping
    public String showRoofDesigner() {
        return "roof-designer";
    }

    @PostMapping("/save")
    @ResponseBody
    public ResponseEntity<ApiResponse> saveDesign(@RequestBody RoofDesignDto dto) {
        System.out.println("Saving Roof Design via Spring DTO binding: Capacity=" 
            + dto.getCapacityKw() + "kW, Facing=" + dto.getDirection());
        return ResponseEntity.ok(ApiResponse.success("Solar design proposal configuration saved successfully!"));
    }
}
