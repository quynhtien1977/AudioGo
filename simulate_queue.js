const API_URL = 'http://localhost:5086/api/mobile/location-log';
const TOTAL_REQUESTS = 200;

async function runDemo() {
    console.log(`🚀 BẮT ĐẦU DEMO QUEUE...`);
    console.log(`Đang giả lập ${TOTAL_REQUESTS} thiết bị gửi GPS cùng lúc...\n`);

    const requests = [];
    const startTime = Date.now();

    for (let i = 0; i < TOTAL_REQUESTS; i++) {
        const payload = {
            deviceId: `fake-device-${i}`,
            points: [
                {
                    latitude: 10.7769 + (Math.random() * 0.01),
                    longitude: 106.7009 + (Math.random() * 0.01),
                    timestamp: new Date().toISOString()
                }
            ]
        };

        // Đưa request vào mảng (chưa đợi)
        requests.push(fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }));
    }

    try {
        // Bắn toàn bộ 200 requests cùng 1 tích tắc
        await Promise.all(requests);
        
        const duration = Date.now() - startTime;
        console.log(`✅ HOÀN THÀNH!`);
        console.log(`- Đã gửi thành công: ${TOTAL_REQUESTS} requests.`);
        console.log(`- Tổng thời gian phản hồi: ${duration} ms.`);
        console.log(`- Tốc độ trung bình: ${(duration / TOTAL_REQUESTS).toFixed(2)} ms / request.`);
        console.log(`\n👉 BÂY GIỜ HÃY NHÌN SANG MÀN HÌNH TERMINAL CỦA API SERVER!`);
        console.log(`Bạn sẽ thấy Server từ từ ghi vào DB theo từng Batch 50 items.`);
    } catch (error) {
        console.error("❌ Có lỗi xảy ra:", error.message);
    }
}

runDemo();
