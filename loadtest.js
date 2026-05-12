import http from 'k6/http';
import { check } from 'k6';

// Cấu hình kịch bản test: 1000 user ảo bắn TỔNG CỘNG 100.000 requests nhanh nhất có thể
export const options = {
    scenarios: {
        burst_test: {
            executor: 'shared-iterations',
            vus: 1000,          // 1000 user ảo chạy song song (máy cá nhân chạy > 1000 VU có thể tràn RAM)
            iterations: 100000, // Tổng số request cần bắn
            maxDuration: '2m',  // Cho phép chạy tối đa 2 phút
        },
    },
};

export default function () {
    const url = 'http://localhost:5086/api/mobile/location-log';
    
    // Tạo payload ngẫu nhiên
    const payload = JSON.stringify({
        deviceId: `device-k6-${__VU}-${__ITER}`,
        points: [
            {
                latitude: 10.7769 + (Math.random() * 0.01),
                longitude: 106.7009 + (Math.random() * 0.01),
                timestamp: new Date().toISOString()
            }
        ]
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // Bắn request
    const res = http.post(url, payload, params);
    
    // Kiểm tra API có trả về 202 Accepted không
    check(res, {
        'is status 202': (r) => r.status === 202,
    });
}
