package com.web.nrs.dto;

public class RoofDesignDto {
    private int cols;
    private int rows;
    private double scale;
    private double rotate;
    private double tilt;
    private double structureHeight;
    private double capacityKw;
    private String direction;

    // Getters and Setters
    public int getCols() {
        return cols;
    }

    public void setCols(int cols) {
        this.cols = cols;
    }

    public int getRows() {
        return rows;
    }

    public void setRows(int rows) {
        this.rows = rows;
    }

    public double getScale() {
        return scale;
    }

    public void setScale(double scale) {
        this.scale = scale;
    }

    public double getRotate() {
        return rotate;
    }

    public void setRotate(double rotate) {
        this.rotate = rotate;
    }

    public double getTilt() {
        return tilt;
    }

    public void setTilt(double tilt) {
        this.tilt = tilt;
    }

    public double getStructureHeight() {
        return structureHeight;
    }

    public void setStructureHeight(double structureHeight) {
        this.structureHeight = structureHeight;
    }

    public double getCapacityKw() {
        return capacityKw;
    }

    public void setCapacityKw(double capacityKw) {
        this.capacityKw = capacityKw;
    }

    public String getDirection() {
        return direction;
    }

    public void setDirection(String direction) {
        this.direction = direction;
    }
}
