#! /usr/bin/env node
import {spawn} from 'child_process';
import {Command} from 'commander';
import dayjs from 'dayjs';
import got from 'got';
import {resolve} from 'path';

const cmd = new Command();

cmd
  .argument('<roomid>')
  .option('-b --background', 'download in background')
  .option('-q --quiet')
  .option('-d --dir <string>', 'directory')
  .action(main)
  .parse(process.argv);

async function main(roomId, opt) {
  const {background = false, quiet = false, dir} = opt || {};
  let cwd = process.cwd();
  if (dir) cwd = resolve(cwd, dir);

  const filename = `${roomId}-${dayjs().format('YYMMDDHHmm')}.%(ext)s`;
  const res = await got(`https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo`, {
    resolveBodyOnly: true,
    searchParams: {
      room_id: roomId,
      protocol: '1', // 0: http_stream, 1: http_hls
      format: '2', // 0: flv, 1: ts, 2: mp4
      codec: '0', // 0: h264, 1: h265
      qn: '10000',
      platform: 'web',
    }
  }).json();

  const object = res.data.playurl_info?.playurl.stream.at(0).format.at(0).codec.at(0);
  if (!object) throw new Error('live not found.')
  const { host, extra } = object.url_info.at(-1)
  const m3u8 = `${host}${object.base_url}${extra}`;

  if (background) {
    spawn('youtube-dl', [m3u8, '-o', filename, '-q'], {cwd, detached: true, stdio: 'ignore'})
      .once('spawn', function () { this.unref(); });
  } else {
    spawn('youtube-dl', [m3u8, '-o', filename].concat(quiet ? ['-q']: []), {cwd, stdio: 'inherit'});
  }
}
