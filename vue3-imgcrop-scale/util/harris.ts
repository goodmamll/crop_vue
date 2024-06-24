// @ts-ignore
import {Image} from "image-js";
import {detectHarrisCorners} from "./harrisCorner";

function minBR(greyimg:Image) {
    const bimg = greyimg.mask({algorithm: "threshold", threshold:0.98, invert: true}); 
    const rect = bimg.minimalBoundingRectangle();

    let offset_crop = 6;  //6
    const rect0 = rect.map((row: any[]) => row[0]);
    const rect1 = rect.map((row: any[]) => row[1]);
    let crop_x = Math.max(Math.min(...rect0) - offset_crop, 0)
    let crop_y = Math.max(Math.min(...rect1) - offset_crop, 0)
    let crop_w = Math.min(Math.max(...rect0) - crop_x + offset_crop, greyimg.width - crop_x)
    let crop_h = Math.min(Math.max(...rect1) - crop_y + offset_crop, greyimg.height - crop_y)
    greyimg = greyimg.crop({x: crop_x, y: crop_y, width: crop_w, height: crop_h});
    // console.log("==greyimg===", crop_x, crop_y,  crop_w, crop_h)
    return greyimg;
}
/**
 * 自动进行图片裁剪
 * Warning: DPI must be set at 300 when extracting images from a PDF file using pdfjs.
 * How to set DPI? dpi位于pdf-dist/build/pdf.sandbox.js中code字符串中的this.bitmapDPI
 * @param name 
 * @returns 
 */
export async function autoCropImage(imgname: string) {    
    let image = await Image.load(imgname);
    // console.log("size==", image.colorModel, "alpha="+image.alpha)
    let greyimg = minBR(image.grey({keepAlpha: true}));
    const cimg_w = greyimg.width;
    const cimg_h = greyimg.height;

    let in_img = greyimg.getMatrix();
    // const cimg_w = in_img.columns;
    // const cimg_h = in_img.rows;
    // @ts-ignore
    let corners = detectHarrisCorners(in_img.data, cimg_w, cimg_h, 2, 1000000);  //corners = [y,x] that required to be revert
    // let corners = detectHarrisCorners(in_img["data"], cimg_w, cimg_h, 2, 1000000); 
    for (let item of corners) {
        let temp = Math.floor(item[0])
        item[0] = Math.floor(item[1])
        item[1] = temp
    }
    const fcoeff = 0.08  // 0.14 is a tune parameter
    corners = corners.filter(([firstColumn, secondColumn]) => (firstColumn < cimg_w * fcoeff && secondColumn < cimg_h * fcoeff) || firstColumn > cimg_w * (1 - fcoeff));

    // y is a sorted array, x is a unsorted array
    const x = corners.map(row => row[0]);
    const y = corners.map(row => row[1]);

    const corners_tl = corners.filter(([firstColumn, secondColumn]) => (firstColumn < cimg_w*fcoeff && secondColumn < cimg_h*fcoeff));  
    let density_rate = 0;
    if(corners.length > 1){
        density_rate = corners_tl.length / (cimg_w*fcoeff * cimg_h*fcoeff) / (corners.length / (cimg_w * cimg_h));
    }    
    // console.log("density_rate==", density_rate);
    if (corners.length <= 2 || density_rate < 0.1 || density_rate >= 4.2) {  
        console.log("No corners found, need to be croped", density_rate);
    }else{
        // console.log("Corners are found, to search and crop the region of design drawing");
        // const x_left = Math.min(...x);
        // const y_top= y[0];
        const x_right = Math.max(...x);
        const y_bottom = y[y.length - 1];

        //(1) Tune top-left corner       
        let left = Math.min(...x);
        let top = y[0];

        const lt_region = cimg_w * 0.04   // 0.11? Aussume the left-top corner may be located in the given region 
        const left_top = corners.filter(([firstColumn, secondColumn]) => firstColumn < lt_region && secondColumn < lt_region);
        if (left_top.length > 0) {
            for (let cid = 0; cid < left_top.length; cid++) {
                if (left_top[cid][0] > left && left_top[cid][1] > top) {
                    left = left_top[cid][0];
                    top = left_top[cid][1];
                }
            }
        }

        //(2) Find the maximum elements at given indices
        let rightList = corners.filter(([_, secondColumn]) => secondColumn === top)
                           .map(([firstColumn]) => firstColumn);
        
        let right = Math.max(...rightList); 
        if (right < x_right * 0.7){
            right = x_right
        }
        
        //(3) Find the right-bottom corner
        let bot = y_bottom;
        let offset_ratio = 0.78  // 0.78 for DPI=300
        const y_unique = [...new Set(y)];
        let bot_start = y_unique[0] + (y_unique[y_unique.length-2] - y_unique[0]) * offset_ratio;

        const right_bot = corners.filter(([firstColumn, secondColumn]) => firstColumn > right-8 && firstColumn < right+8) // 8 is a tune parameter
                    .map(([,secondColumn]) => secondColumn); 
        // bot_cords = bot_cords.filter(element => element >= bot_start); 
        let bot_cords = right_bot.filter(element => element > bot_start); 
        if (bot_cords.length > 0){
            bot = Math.min(...bot_cords); 
        }        

        const offset = 5  // 6 is a tune parameter
        left = left + offset
        top = top + offset
        let wid = right - 2 * offset - left
        let heg = bot - 2 * offset - top
        if(!(wid > 0 && heg > 0 && x.length < wid && y.length < heg)){
            console.log('error in auto crop');
        }
        if (wid > 0 && heg > 0 && x.length < wid && y.length < heg && (top < bot || left < right)) {
            greyimg = greyimg.crop({x: left, y: top, width: wid, height: heg});
        }
    }

    greyimg = minBR(greyimg);
    return greyimg.toDataURL();
}