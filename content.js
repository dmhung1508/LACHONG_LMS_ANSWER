// Tạo bảng log giao diện
function createLogPanel() {
    const logPanel = document.createElement('div');
    Object.assign(logPanel.style, {
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: '300px',
        maxHeight: '200px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        zIndex: '9999',
        overflowY: 'auto',
        fontSize: '12px',
        fontFamily: 'Arial, sans-serif',
        boxShadow: '0 0 10px rgba(0,0,0,0.5)'
    });

    const title = document.createElement('div');
    title.textContent = 'Log';
    Object.assign(title.style, {
        fontWeight: 'bold',
        marginBottom: '5px',
        borderBottom: '1px solid #fff'
    });

    const logContent = document.createElement('div');
    logContent.id = 'log-content';

    logPanel.appendChild(title);
    logPanel.appendChild(logContent);
    document.body.appendChild(logPanel);

    return logContent;
}

// Custom logging với giao diện và console
const logContent = createLogPanel();
const log = {
    info: (msg) => {
        const entry = `[INFO ${new Date().toLocaleTimeString()}] ${msg}`;
        console.log(`%c${entry}`, 'color: #2196F3');
        const p = document.createElement('p');
        p.textContent = entry;
        p.style.color = '#2196F3';
        logContent.appendChild(p);
        logContent.scrollTop = logContent.scrollHeight;
    },
    success: (msg) => {
        const entry = `[SUCCESS ${new Date().toLocaleTimeString()}] ${msg}`;
        console.log(`%c${entry}`, 'color: #4CAF50');
        const p = document.createElement('p');
        p.textContent = entry;
        p.style.color = '#4CAF50';
        logContent.appendChild(p);
        logContent.scrollTop = logContent.scrollHeight;
    },
    warn: (msg) => {
        const entry = `[WARN ${new Date().toLocaleTimeString()}] ${msg}`;
        console.log(`%c${entry}`, 'color: #FF9800');
        const p = document.createElement('p');
        p.textContent = entry;
        p.style.color = '#FF9800';
        logContent.appendChild(p);
        logContent.scrollTop = logContent.scrollHeight;
    },
    error: (msg) => {
        const entry = `[ERROR ${new Date().toLocaleTimeString()}] ${msg}`;
        console.log(`%c${entry}`, 'color: #F44336');
        const p = document.createElement('p');
        p.textContent = entry;
        p.style.color = '#F44336';
        logContent.appendChild(p);
        logContent.scrollTop = logContent.scrollHeight;
    }
};

// Hàm lấy tiến độ hiện tại
function getProgress() {
    const progressElement = document.querySelector('.ant-progress-text');
    if (progressElement) {
        const progressText = progressElement.textContent;
        return parseFloat(progressText.replace('%', '')) || 0;
    }
    return 0;
}

// Hàm lấy câu hỏi và các đáp án từ trang
function getQuestionAndOptions() {
    // Lấy câu hỏi
    const questionElement = document.querySelector('.question-content');
    if (!questionElement) {
        log.error('Không tìm thấy phần tử câu hỏi với selector .question-content');
        return null;
    }
    const questionText = questionElement.textContent.trim();
    log.info(`Tìm thấy câu hỏi: ${questionText}`);

    // Kiểm tra và lấy URL hình ảnh nếu có
    let imageUrl = null;
    const imageElement = questionElement.querySelector('.question-content__image');
    if (imageElement) {
        imageUrl = imageElement.src;
        log.info(`Tìm thấy hình ảnh: ${imageUrl}`);
    }

    // Lấy các đáp án
    const options = Array.from(document.querySelectorAll('.mc-text-question__radio-answer label'));
    if (options.length === 0) {
        log.error('Không tìm thấy đáp án với selector .mc-text-question__radio-answer label');
        return null;
    }
    log.info(`Tìm thấy ${options.length} đáp án`);

    // Định dạng đáp án
    const optionsText = options.map((opt, index) => `${index + 1}- ${opt.textContent.trim()}`).join('\n');

    // Lấy header
    const headerElement = document.querySelector('.question-panel__header-text');
    const headerText = headerElement ? headerElement.textContent.trim() : '1. Chọn đáp án đúng nhất';

    // Trả về object chứa cả text và imageUrl (nếu có)
    return {
        text: `${headerText}\n${questionText}\n\n${optionsText}`,
        imageUrl: imageUrl
    };
}

// Hàm gọi API cho câu hỏi không có hình ảnh
async function getAnswerFromAPI(questionText) {
    try {
        const response = await fetch('https://lachong.dinhmanhhung.net/get_answer', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question: questionText })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            log.error(`API trả về lỗi: ${response.status} ${response.statusText}. Chi tiết: ${errorText}`);
            return null;
        }

        const data = await response.json();
        log.info(`Kết quả: ${JSON.stringify(data)}`);
        log.success('API trả về kết quả thành công');
        return data.answer - 1; // Trả về index (0-based)
    } catch (error) {
        log.error(`Lỗi khi gọi API: ${error.message}`);
        return null;
    }
}

// Hàm gọi API cho câu hỏi có hình ảnh
async function getAnswerFromImageAPI(questionText, imageUrl) {
    try {
        const formData = new FormData();
        formData.append('question', questionText);

        // Tải hình ảnh từ URL và thêm vào form-data
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        formData.append('image', blob, 'image.png');

        const apiResponse = await fetch('https://lachong.dinhmanhhung.net/get_answer_image', {
            method: 'POST',
            headers: {
                'accept': 'application/json'
            },
            body: formData
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            log.error(`API trả về lỗi: ${apiResponse.status} ${apiResponse.statusText}. Chi tiết: ${errorText}`);
            return null;
        }

        const data = await apiResponse.json();
        log.info(`Kết quả: ${JSON.stringify(data)}`);
        log.success('API hình ảnh trả về kết quả thành công');
        return data.answer - 1; // Trả về index (0-based)
    } catch (error) {
        log.error(`Lỗi khi gọi API hình ảnh: ${error.message}`);
        return null;
    }
}

// Hàm chọn đáp án từ API
async function selectAnswerFromAPI() {
    const questionData = getQuestionAndOptions();
    if (!questionData) return false;

    let answerIndex;
    if (questionData.imageUrl) {
        // Nếu có hình ảnh, gọi API xử lý hình ảnh
        answerIndex = await getAnswerFromImageAPI(questionData.text, questionData.imageUrl);
    } else {
        // Nếu không có hình ảnh, gọi API thông thường
        answerIndex = await getAnswerFromAPI(questionData.text);
    }

    if (answerIndex === null || answerIndex < 0) {
        log.warn('Không nhận được đáp án hợp lệ từ API');
        return false;
    }

    const answers = document.querySelectorAll('input[type="radio"]:not([disabled])');
    if (answers.length > answerIndex) {
        answers[answerIndex].click();
        log.success(`Đã chọn đáp án số ${answerIndex + 1}/${answers.length} từ API`);
        return true;
    }
    
    log.warn('Đáp án từ API không khớp với số lượng lựa chọn');
    return false;
}

// Hàm nhấn nút "Tiếp"
function clickNext() {
    const nextButton = document.querySelector('#practice-question-footer-pc button.ant-btn.btn-primary');
    if (nextButton && !nextButton.disabled) {
        nextButton.click();
        log.success('Đã nhấn nút "Tiếp"');
        return true;
    }
    log.warn('Nút "Tiếp" không khả dụng');
    return false;
}

// Hàm nhấn nút "Kết thúc luyện thi"
function clickFinish() {
    const finishButton = document.querySelector('.col-md-4 button.btn-primary.btn-normal');
    if (finishButton && !finishButton.disabled) {
        finishButton.click();
        log.success('Đã nhấn nút "Kết thúc luyện thi"');
        return true;
    }
    log.warn('Nút "Kết thúc" không khả dụng');
    return false;
}

// Hàm nhấn nút "Luyện câu sai"
function clickPracticeWrong() {
    const wrongButton = document.querySelector('button.btn.btn-outline.btn-small:nth-child(2)');
    if (wrongButton && !wrongButton.disabled) {
        wrongButton.click();
        log.success('Đã nhấn nút "Luyện câu sai"');
        return true;
    }
    log.warn('Nút "Luyện câu sai" không khả dụng');
    return false;
}

// Hàm xử lý popup xác nhận
function handleConfirmationPopup() {
    const confirmButton = document.querySelector('button:contains("OK")') || 
                         document.querySelector('button:contains("Xác nhận")');
    if (confirmButton) {
        confirmButton.click();
        log.success('Đã xác nhận popup');
        return true;
    }
    return false;
}

// Hàm kiểm tra xem còn câu hỏi nào không
function hasMoreQuestions() {
    const nextButton = document.querySelector('#practice-question-footer-pc button.ant-btn.btn-primary');
    return nextButton && !nextButton.disabled;
}

// Hàm tự động làm quiz
async function autoCompleteQuiz() {
    log.info('Bắt đầu quá trình tự động hóa...');
    const interval = setInterval(async () => {
        if (await selectAnswerFromAPI()) {
            setTimeout(() => {
                if (clickNext()) {
                    log.info('Chuyển sang câu hỏi tiếp theo');
                } else if (!hasMoreQuestions()) {
                    log.info('Hoàn thành lượt luyện tập');
                    clearInterval(interval);
                    setTimeout(() => {
                        if (clickFinish()) {
                            setTimeout(handleConfirmationPopup, 1000);
                            checkAndContinue();
                        }
                    }, 1000);
                }
            }, 1000);
        } else if (clickNext()) {
            log.info('Chuyển sang câu hỏi tiếp theo (đã chọn trước)');
        }
    }, 3000);
}

// Hàm kiểm tra tiến độ và tiếp tục nếu chưa đạt 100%
function checkAndContinue() {
    setTimeout(() => {
        const progress = getProgress();
        log.info(`Tiến độ hiện tại: ${progress}%`);
        
        if (progress < 100) {
            log.info('Tiến độ chưa đạt 100%, tiếp tục luyện câu sai');
            setTimeout(() => {
                if (clickPracticeWrong()) {
                    setTimeout(autoCompleteQuiz, 2000);
                } else {
                    log.error('Không thể tiếp tục luyện câu sai');
                }
            }, 2000);
        } else {
            log.success('Đã đạt 100% tiến độ!');
        }
    }, 2000);
}

// Tạo nút điều khiển
function createControlButton() {
    const button = document.createElement('button');
    button.innerText = 'Bắt đầu Tự Động';
    Object.assign(button.style, {
        position: 'fixed',
        top: '60px',
        right: '10px',
        zIndex: '9999',
        padding: '10px 15px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold'
    });

    button.addEventListener('click', () => {
        autoCompleteQuiz();
        button.disabled = true;
        button.style.backgroundColor = '#cccccc';
        button.innerText = 'Đang chạy...';
        log.success('Đã kích hoạt tự động hóa');
    });

    document.body.appendChild(button);
    log.info('Nút điều khiển đã được thêm vào trang');
}

// Khởi chạy
try {
    createControlButton();
    log.success('Extension đã được tải thành công');
} catch (error) {
    log.error(`Lỗi khi khởi tạo: ${error.message}`);
}