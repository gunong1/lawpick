const fs = require('fs');
const path = require('path');

// NanumGothic-ExtraLight.ttf가 더 작을 수 있음
// 또는 malgunsl.ttf (맑은 고딕 Light)
const fonts = [
    'C:\\Windows\\Fonts\\malgunsl.ttf',  // 맑은 고딕 Semi Light
    'C:\\Windows\\Fonts\\NanumGothic.ttf',
    'C:\\Windows\\Fonts\\gulim.ttc',
];

let selectedFont = null;
let selectedSize = Infinity;

for (const fontPath of fonts) {
    try {
        const stats = fs.statSync(fontPath);
        console.log(`${fontPath}: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        if (stats.size < selectedSize) {
            selectedSize = stats.size;
            selectedFont = fontPath;
        }
    } catch (e) {
        console.log(`${fontPath}: Not found`);
    }
}

if (selectedFont) {
    console.log(`\nSmallest font: ${selectedFont} (${(selectedSize / 1024 / 1024).toFixed(2)} MB)`);
}
