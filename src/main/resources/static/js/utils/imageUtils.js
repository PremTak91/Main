// Image Utilities for Roof Designer
// Provides helper functions to work with natural image dimensions without using CSS width/height.
window.imageUtils = {
  /**
   * Returns the natural width and height of an HTMLImageElement.
   * @param {HTMLImageElement} img
   * @returns {{width:number,height:number}}
   */
  getNaturalSize: function (img) {
    return {
      width: img.naturalWidth,
      height: img.naturalHeight
    };
  },

  /**
   * Adjusts a canvas element to match the natural size of the supplied image.
   * @param {HTMLCanvasElement} canvas
   * @param {HTMLImageElement} img
   */
  fitCanvasToImage: function (canvas, img) {
    const size = this.getNaturalSize(img);
    canvas.width = size.width;
    canvas.height = size.height;
  }
};
