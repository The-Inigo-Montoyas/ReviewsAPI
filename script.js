import http from 'k6/http';
import { sleep } from 'k6';
export let options = {
  vus: 100,
  duration: '1s',
};
export default function () {
  http.get('http://localhost:3003/reviews/5/helpful');
  sleep(1);
}
