import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 5 }, // Ramp up to 5 concurrent users
    { duration: '1m', target: 5 },  // Stay at 5 users
    { duration: '30s', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.01'],    // Less than 1% failure rate
  },
};

// We need a small "audio" file to upload
const binFile = open('./dummy.webm', 'b');

export default function () {
  const url = 'http://localhost:3000/api/answers/upload';
  
  const payload = {
    audio: http.file(binFile, 'test.webm', 'audio/webm'),
    sessionId: 'load-test-session',
    questionId: 'q1',
    question: 'How do you teach math?',
    competencyTags: JSON.stringify(['pedagogy']),
  };

  const params = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };

  const res = http.post(url, payload, params);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has answerId': (r) => r.json('answerId') !== undefined,
  });

  sleep(1);
}
