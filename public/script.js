// File: public/script.js - PHIÊN BẢN HOÀN THIỆN CUỐI CÙNG

// Biến toàn cục để lưu ô chữ đang được chọn
let activeCell = null;

document.addEventListener('DOMContentLoaded', () => {
    // Gán chức năng cho các nút bấm
    const generateButton = document.getElementById('generate-button');
    const checkButton = document.getElementById('check-button');
    const hintButton = document.getElementById('hint-button');

    generateButton.addEventListener('click', () => {
        const themeInput = document.getElementById('theme-input');
        const userTheme = themeInput.value.trim();
        if (userTheme) {
            fetchPuzzle(userTheme);
        } else {
            alert('Vui lòng nhập một chủ đề để bắt đầu!');
        }
    });
    
    checkButton.addEventListener('click', checkAnswers);
    hintButton.addEventListener('click', giveHint); // Gán chức năng cho nút Gợi ý
});

async function fetchPuzzle(theme) {
    document.getElementById('theme').innerText = 'Chủ đề: Đang tạo ô chữ, vui lòng chờ...';
    document.getElementById('crossword-grid').innerHTML = '';

    try {
        const response = await fetch(`/api/generate-puzzle?theme=${encodeURIComponent(theme)}`);
        if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
        const puzzleData = await response.json();
        renderPuzzle(puzzleData);
    } catch (error) {
        console.error('Lỗi khi lấy ô chữ:', error);
        document.getElementById('theme').innerText = 'Chủ đề: Có lỗi xảy ra khi tạo ô chữ!';
    }
}

function renderPuzzle(data) {
    document.getElementById('theme').innerText = `Chủ đề: ${data.theme}`;
    const verticalWord = data.vertical_keyword.word;
    const horizontalClues = data.horizontal_clues;
    
    let maxLeftOffset = 0, maxRightOffset = 0;
    horizontalClues.forEach(hClue => {
        const intersectionChar = verticalWord[hClue.intersection_index_vertical];
        const intersectionIndexHorizontal = hClue.word.toUpperCase().indexOf(intersectionChar.toUpperCase());
        hClue.intersection_index_horizontal = intersectionIndexHorizontal;
        if (intersectionIndexHorizontal > maxLeftOffset) maxLeftOffset = intersectionIndexHorizontal;
        const rightOffset = hClue.word.length - intersectionIndexHorizontal - 1;
        if (rightOffset > maxRightOffset) maxRightOffset = rightOffset;
    });

    const gridRows = verticalWord.length;
    const gridCols = maxLeftOffset + 1 + maxRightOffset;
    const verticalColIndex = maxLeftOffset;
    const grid = Array(gridRows).fill(null).map(() => Array(gridCols).fill(null));

    horizontalClues.forEach(hClue => {
        const row = hClue.intersection_index_vertical;
        const startCol = verticalColIndex - hClue.intersection_index_horizontal;
        for (let i = 0; i < hClue.word.length; i++) {
            grid[row][startCol + i] = { char: hClue.word[i] };
        }
    });

    for (let i = 0; i < verticalWord.length; i++) {
        grid[i][verticalColIndex] = { char: verticalWord[i] };
    }

    const gridContainer = document.getElementById('crossword-grid');
    gridContainer.innerHTML = '';
    gridContainer.style.gridTemplateColumns = `repeat(${gridCols}, 35px)`;

    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const cellData = grid[r][c];
            const cell = document.createElement('input');
            cell.type = 'text';
            cell.maxLength = 1;
            
            if (cellData) {
                cell.classList.add('grid-cell');
                if (c === verticalColIndex) cell.classList.add('vertical-cell');
                cell.dataset.char = cellData.char.toUpperCase(); 
                cell.id = `cell-${r}-${c}`;
                
                // *** THÊM MỚI: Theo dõi ô đang được chọn ***
                cell.addEventListener('focus', () => {
                    activeCell = cell;
                });

            } else {
                cell.className = 'empty-cell';
                cell.disabled = true;
            }
            gridContainer.appendChild(cell);
        }
    }
    
    const horizontalCluesList = document.querySelector('#horizontal-clues ul');
    horizontalCluesList.innerHTML = '';
    data.horizontal_clues.sort((a, b) => a.clue_number - b.clue_number).forEach(hClue => {
        const li = document.createElement('li');
        li.textContent = `${hClue.clue_number}. ${hClue.clue}`;
        horizontalCluesList.appendChild(li);
    });

    const verticalClueP = document.querySelector('#vertical-clue p');
    verticalClueP.textContent = data.vertical_keyword.clue;
}

function checkAnswers() {
    const cells = document.querySelectorAll('.grid-cell');
    let allCorrect = true;
    cells.forEach(cell => {
        cell.classList.remove('correct', 'incorrect');
        const userAnswer = cell.value.toUpperCase();
        const correctAnswer = cell.dataset.char.toUpperCase();
        if (userAnswer === '') {
            allCorrect = false;
        } else if (userAnswer === correctAnswer) {
            cell.classList.add('correct');
            cell.disabled = true;
        } else {
            cell.classList.add('incorrect');
            allCorrect = false;
        }
    });
    if (allCorrect) {
        setTimeout(() => {
            alert('🎉 CHÚC MỪNG! 🎉\n\nBạn đã giải thành công toàn bộ ô chữ!');
        }, 300);
    }
}

// *** THÊM MỚI: Hàm logic cho nút Gợi ý ***
function giveHint() {
    if (!activeCell || activeCell.disabled) {
        alert('Vui lòng chọn một ô chữ còn trống mà bạn muốn gợi ý!');
        return;
    }

    const correctAnswer = activeCell.dataset.char;
    activeCell.value = correctAnswer;
    activeCell.classList.add('correct'); // Đánh dấu là đúng
    activeCell.disabled = true; // Khóa ô lại
    activeCell = null; // Reset ô đang chọn
}