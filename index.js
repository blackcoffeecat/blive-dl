import {spawn} from 'child_process';
import dayjs from 'dayjs';
import got from 'got';


const [roomId] = process.argv.slice(2);

const main = async () => {
  const filename = `${roomId}-${dayjs().format('YYMMDDHHmm')}.%(ext)s`;
  const res = await got(`https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo`, {
    resolveBodyOnly: true,
    searchParams: {
      room_id: roomId,
      protocol: '0,1',
      format: '0,1,2',
      codec: '0,1',
      qn: '10000',
      platform: 'web',
      ptype: '8',
      dolby: '5',
    }
  }).json();

  const object = res.data.playurl_info.playurl.stream.at(-1).format.at(-1).codec.at(-1);
  const {base_url, url_info: [{host, extra}]} = object;
  const m3u8 = `${host}${base_url}${extra}`;

  spawn('youtube-dl', [m3u8, '-o', filename], {detached: true, stdio: 'ignore'})
    .once('spawn', function () {
      this.unref();
    });
};

main();