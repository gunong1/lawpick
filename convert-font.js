const fs = require('fs');
const path = require('path');

// 맑은 고딕 SemiLight 폰트 사용 (더 작은 크기)
const fontPath = 'C:\\Windows\\Fonts\\malgunsl.ttf';

// 폰트 파일 읽기
const fontBuffer = fs.readFileSync(fontPath);

// Base64로 변환
const base64Font = fontBuffer.toString('base64');

// TypeScript 파일로 저장
const tsContent = `// 맑은 고딕 SemiLight 폰트 Base64 인코딩
// 자동 생성된 파일 - 수정하지 마세요
// 파일 크기: ${(base64Font.length / 1024 / 1024).toFixed(2)} MB

export const malgunFontBase64 = "${base64Font}";
`;

// lib 폴더에 저장
const outputPath = path.join(__dirname, 'lib', 'korean-font.ts');

// lib 폴더가 없으면 생성
if (!fs.existsSync(path.join(__dirname, 'lib'))) {
    fs.mkdirSync(path.join(__dirname, 'lib'), { recursive: true });
}

fs.writeFileSync(outputPath, tsContent);
console.log('Font converted successfully!');
console.log('Output:', outputPath);
console.log('Base64 size:', (base64Font.length / 1024 / 1024).toFixed(2), 'MB');
