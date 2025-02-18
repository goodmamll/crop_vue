// Harris Corner Detection in JS: https://github.com/rayyamhk/img-mage.js
// 'FAST Corner Detection' in JS: https://github.com/m320ng/fast9
// Image processing and manipulation in JavaScript: https://github.com/image-js/image-js

function detectHarrisCorners(greyimage: any[][], w: number, h: number, sigma: number, threshold: number) {
    if (!sigma || typeof sigma !== 'number' || sigma <= 0) {
        console.log(`sigma is not a positive number.`);
    }

    if (!threshold || typeof threshold !== 'number' || threshold <= 0) {
        console.log(`threshold is not a positive number.`);
    }

    const cornersOut = [];
    // const w = greyimage.width;
    // const h = greyimage.height;

    const ResponseImage = cornerResponseImage(greyimage, w, h, sigma)
    for (let u = 1; u < h - 1; u++) {
        for (let v = 1; v < w - 1; v++) {
            if (isLocalMax(ResponseImage, u, v, w)) {
                const R = ResponseImage[u * w + v];
                if (R > threshold) {
                    // y-axis
                    let x0 = v - 1;
                    let y0 = ResponseImage[u * w + x0];
                    let x1 = v;
                    let y1 = ResponseImage[u * w + x1];
                    let x2 = v + 1;
                    let y2 = ResponseImage[u * w + x2];
                    const y_local_max = quadraticInterpolation(x0, y0, x1, y1, x2, y2) + 0.5;

                    // x-axis
                    x0 = u - 1;
                    y0 = ResponseImage[x0 * w + v];
                    x1 = u;
                    y1 = ResponseImage[x1 * w + v];
                    x2 = u + 1;
                    y2 = ResponseImage[x2 * w + v];
                    const x_local_max = quadraticInterpolation(x0, y0, x1, y1, x2, y2) + 0.5;

                    cornersOut.push([x_local_max, y_local_max]);
                }
            }
        }
    }

    return cornersOut;
}

function cornerResponseImage(greyimage: any[][], w: number, h: number, sigma: number) {
    const ResponseImage = new Array(h * w);

    const fx = new Array(h * w);
    const fy = new Array(h * w);
    for (let x = 0; x < h; x++) {
        for (let y = 0; y < w; y++) {
            fx[x * w + y] = 0;
            fy[x * w + y] = 0;

            if (x != 0 && x != h - 1) {
                const up = greyimage[x-1][y];
                const down = greyimage[x+1][y];
                fx[x * w + y] = down - up;
            }

            if (y != 0 && y != w - 1) {
                // console.log("y",x, y);
                const left = greyimage[x][y - 1];
                const right = greyimage[x][y + 1];
                fy[x * w + y] = right - left;
            }
        }
    }

    const fxfx = new Array(h * w);
    const fyfy = new Array(h * w);
    const fxfy = new Array(h * w);
    for (let x = 0; x < h; x++) {
        for (let y = 0; y < w; y++) {
            fxfx[x * w + y] = 0;
            fyfy[x * w + y] = 0;
            fxfy[x * w + y] = 0;

            const dx = fx[x * w + y];
            const dy = fy[x * w + y];
            fxfx[x * w + y] = dx * dx;
            fxfy[x * w + y] = dx * dy;
            fyfy[x * w + y] = dy * dy;
        }
    }

    // const filter = Image.filter(Image.CONSTANT.GAUSSIAN_1D, sigma);
    // console.log("sigma==", fxfx);
    const filter = gaussianFilter1D(sigma);
    const smooth_fxfx = applyGaussianFilter(filter, fxfx, w, h);
    const smooth_fyfy = applyGaussianFilter(filter, fyfy, w, h);
    const smooth_fxfy = applyGaussianFilter(filter, fxfy, w, h);

    const KAPPA = 0.04;
    for (let x = 0; x < h; x++) {
        for (let y = 0; y < w; y++) {
            const A_1 = smooth_fxfx[x * w + y];
            const A_2 = smooth_fxfy[x * w + y];
            const A_3 = smooth_fxfy[x * w + y];
            const A_4 = smooth_fyfy[x * w + y];
            const det = A_1 * A_4 - A_2 * A_3;
            const trace = A_1 + A_4;
            ResponseImage[x * w + y] = det - KAPPA * trace * trace;
        }
    }

    return ResponseImage;
}

function gaussianFilter1D(sigma: number) {
    const temp = Math.pow(Math.log(1/1000)*-2*sigma*sigma, 0.5);
    const x = Math.floor(temp);

    const filter = new Array(2 * x + 1);
    const coefficient = 1 / (sigma * Math.sqrt(2 * Math.PI));
    let sum = 0;

    for (let i = 0; i <= x; i++) {
        filter[x + i] = coefficient * Math.exp(-0.5 * Math.pow(i / sigma, 2));
        sum += filter[x + i];

        if (i !== 0) {
            filter[x - i] = filter[x + i];
            sum += filter[x + i];
        }
    }

    for (let i = 0; i < 2 * x + 1; i++) {
        filter[i] /= sum;
    }

    return filter;
};

function applyGaussianFilter(filter: string | any[], img: any[], w: number, h: number) {
    const s = (filter.length - 1) / 2;
    const temp_w = w - 2 * s;
    const temp_image = new Array(temp_w * h);
    const filtered_image = new Array(w * h);

    for (let u = 0; u < h; u++) {
        for (let v = s; v < w - s; v++) {
            let f = 0.0;
            for (let y = -s; y <= s; y++) {
                f += filter[y + s] * img[u * w + v - y];
            }
            temp_image[u * temp_w + v - s] = f;
        }
    }

    for (let v = 0; v < w; v++) {
        for (let u = 0; u < h; u++) {
            if (u >= s && u < h - s && v >= s && v < w - s) {
                let f = 0.0;
                for (let x = -s; x <= s; x++) {
                    f += filter[x + s] * temp_image[(u - x) * temp_w + v - s];
                }
                filtered_image[u * w + v] = f;
            } else {
                filtered_image[u * w + v] = img[u * w + v];
            }
        }
    }

    return filtered_image;
}

function quadraticInterpolation(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
    // y = b0 + b1(x - x0) + b2(x - x0)(x - x1)
    // const b0 = y0;
    const b1 = (y1 - y0) / (x1 - x0);
    const b2 = ((y2 - y1) / (x2 - x1) - (y1 - y0) / (x1 - x0)) / (x2 - x0);

    // y = ax^2 + bx + c
    const a = b2;
    const b = b1 - b2 * x0 - b2 * x1;
    // const c = b0 - b1 * x0 + b2 * x0 * x1;

    return -b / (2 * a);
}

function isLocalMax(responseImage: any[], x: number, y: number, w: number) {
    // given that x and y are not boundary
    const c = responseImage[x * w + y]; // center pixel
    const tl = responseImage[(x- 1) * w + y - 1];
    const t = responseImage[(x- 1) * w + y];
    const tr = responseImage[(x - 1) * w + y + 1];
    const r = responseImage[x * w + y + 1];
    const br = responseImage[(x + 1) * w + y + 1];
    const b = responseImage[(x + 1) * w + y];
    const bl = responseImage[(x + 1) * w + y - 1];
    const l =  responseImage[x * w + y - 1];
    return c > tl && c > t && c > tr && c > r && c > br && c > b && c > bl && c > l;
}

export {detectHarrisCorners};